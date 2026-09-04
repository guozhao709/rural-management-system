import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { randomUUID } from 'node:crypto';
import { Inject } from '@nestjs/common';
import type { User } from '../users/user.entity';
import type { CreateHealthAssessmentDto, QueryHealthAssessmentsDto } from './dto/health-assessment.dto';
import { HealthAssessment } from './entities/health-assessment.entity';
import { HealthConsent } from './entities/health-consent.entity';
import { HealthMeasurement } from './entities/health-measurement.entity';
import { HealthProfile } from './entities/health-profile.entity';
import {
  HEALTH_SENSITIVE_DATA_CRYPTO_PORT,
  type EncryptedHealthData,
  type HealthSensitiveDataCryptoPort,
} from './health-sensitive-data-crypto';
import { parseSafeHealthExplanation } from './health-explanation.schema';
import { SAFETY_TRIAGE_PORT, type SafetyTriagePort, type TriageDecision } from './resident-health.types';
import { HealthAccessAuditService } from './health-access-audit.service';
import { HEALTH_EXPLANATION_LLM_PORT, type HealthExplanationLlmPort } from './health-explanation.port';

export interface HealthAssessmentRuntimeConfig {
  assessmentDailyLimit: number;
  aiExplanationEnabled: boolean;
}

@Injectable()
export class HealthAssessmentService {
  constructor(
    @InjectRepository(HealthAssessment)
    private readonly assessments: EntityRepository<HealthAssessment>,
    @InjectRepository(HealthConsent) private readonly consents: EntityRepository<HealthConsent>,
    @InjectRepository(HealthProfile) private readonly profiles: EntityRepository<HealthProfile>,
    @InjectRepository(HealthMeasurement)
    private readonly measurements: EntityRepository<HealthMeasurement>,
    private readonly entityManager: EntityManager,
    @Inject(HEALTH_SENSITIVE_DATA_CRYPTO_PORT)
    private readonly crypto: HealthSensitiveDataCryptoPort | null,
    @Inject(SAFETY_TRIAGE_PORT) private readonly triage: SafetyTriagePort,
    @Inject('HEALTH_ASSESSMENT_RUNTIME_CONFIG')
    private readonly runtime: HealthAssessmentRuntimeConfig,
    @Inject(HEALTH_EXPLANATION_LLM_PORT) private readonly explanation: HealthExplanationLlmPort,
    private readonly audit: HealthAccessAuditService,
  ) {}

  async create(user: User, dto: CreateHealthAssessmentDto) {
    const existing = await this.assessments.findOne({
      userId: user.id,
      idempotencyKey: dto.idempotencyKey,
    });
    if (existing) return this.present(existing);
    const consent = await this.requireAssessmentConsent(user.id);
    if (!this.crypto) throw new ServiceUnavailableException('健康数据加密能力未启用');
    await this.ensureDailyLimit(user.id);
    const measurementSnapshot = await this.loadMeasurementSnapshot(user.id, dto.measurementIds ?? []);
    const profileSnapshot = await this.loadProfileSnapshot(user.id);
    const rule = await this.triage.evaluate({
      symptoms: dto.symptoms.map(({ code, severity, course }) => ({ code, severity, course })),
    });
    const now = new Date();
    const result = await this.makeResult(rule, now, consent.scopes.includes('ai_processing'));
    const assessment = this.assessments.create(
      {
        id: randomUUID(),
        userId: user.id,
        consentId: consent.id,
        idempotencyKey: dto.idempotencyKey,
        status: 'succeeded',
        triageLevel: rule.level,
        inputSnapshotCiphertext: this.crypto.encrypt(
          JSON.stringify({
            symptoms: dto.symptoms,
            otherDetails: dto.otherDetails ?? null,
            profile: profileSnapshot,
            measurements: measurementSnapshot,
          }),
        ),
        ruleResult: {
          level: rule.level,
          reasonCodes: rule.reasonCodes,
          ruleVersion: rule.ruleVersion,
        },
        result,
        ruleVersion: rule.ruleVersion,
        completedAt: now,
      },
      { partial: true },
    );
    await this.entityManager.flush();
    await this.audit.record({ actorType: 'user', actorId: user.id, action: 'create', resourceType: 'health_assessment', resourceId: assessment.id, purpose: 'health_assessment', outcome: 'success' });
    return this.present(assessment);
  }

  async list(user: User, query: QueryHealthAssessmentsDto) {
    const where: FilterQuery<HealthAssessment> = { userId: user.id, deletedAt: null };
    if (query.triageLevel) where.triageLevel = query.triageLevel;
    const [items, total] = await this.assessments.findAndCount(where, {
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      orderBy: { createdAt: 'DESC' },
    });
    await this.audit.record({ actorType: 'user', actorId: user.id, action: 'list', resourceType: 'health_assessment', resourceId: '*', purpose: 'health_assessment_history', outcome: 'success' });
    return { list: items.map((item) => this.present(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async getOne(user: User, id: string) {
    const assessment = await this.assessments.findOne({ id, userId: user.id, deletedAt: null });
    if (!assessment) throw new NotFoundException('健康评估不存在');
    await this.audit.record({ actorType: 'user', actorId: user.id, action: 'read', resourceType: 'health_assessment', resourceId: assessment.id, purpose: 'health_assessment_history', outcome: 'success' });
    return this.present(assessment);
  }

  async remove(user: User, id: string): Promise<void> {
    const assessment = await this.assessments.findOne({ id, userId: user.id, deletedAt: null });
    if (!assessment) throw new NotFoundException('健康评估不存在');
    assessment.deletedAt = new Date();
    await this.entityManager.flush();
    await this.audit.record({ actorType: 'user', actorId: user.id, action: 'delete', resourceType: 'health_assessment', resourceId: assessment.id, purpose: 'health_data_deletion', outcome: 'success' });
  }

  private async requireAssessmentConsent(userId: number): Promise<HealthConsent> {
    const consent = await this.consents.findOne({ userId, revokedAt: null });
    if (!consent || !consent.scopes.includes('assessment'))
      throw new ServiceUnavailableException('需要有效的健康评估处理同意');
    return consent;
  }

  private async ensureDailyLimit(userId: number): Promise<void> {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const [, total] = await this.assessments.findAndCount({ userId, createdAt: { $gte: from } });
    if (total >= this.runtime.assessmentDailyLimit)
      throw new ServiceUnavailableException('今日健康评估次数已达上限');
  }

  private async loadMeasurementSnapshot(userId: number, ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) return [];
    const measurements = await this.measurements.find({
      id: { $in: uniqueIds },
      userId,
      deletedAt: null,
    });
    if (measurements.length !== uniqueIds.length)
      throw new NotFoundException('指定健康测量不存在');
    return measurements.map((measurement) => ({
      id: measurement.id,
      type: measurement.type,
      values: measurement.values,
      measuredAt: measurement.measuredAt.toISOString(),
      source: measurement.source,
    }));
  }

  private async loadProfileSnapshot(userId: number) {
    const profile = await this.profiles.findOne({ userId });
    if (!profile) return null;
    return {
      medicalHistory: this.decrypt(profile.medicalHistoryCiphertext),
      allergies: this.decrypt(profile.allergiesCiphertext),
      specialPopulation: this.decrypt(profile.specialPopulationCiphertext),
    };
  }

  private decrypt(value: object | null): string | null {
    return value ? this.crypto!.decrypt(value as EncryptedHealthData) : null;
  }

  private async makeResult(rule: TriageDecision, generatedAt: Date, aiProcessingConsented: boolean) {
    if (this.runtime.aiExplanationEnabled && aiProcessingConsented && rule.level !== 'emergency') {
      try {
        const generated = await this.explanation.explain({ triage: rule, knowledge: [] });
        const safe = parseSafeHealthExplanation(generated);
        if (safe) return safe;
      } catch {
        // Do not delay safe rule-first guidance when an optional explanation provider fails.
      }
    }
    return this.makeDeterministicResult(rule, generatedAt);
  }

  private makeDeterministicResult(rule: TriageDecision, generatedAt: Date) {
    const result = {
      schemaVersion: '1.0' as const,
      triage: { level: rule.level, reasonCodes: rule.reasonCodes, message: rule.message },
      summary: rule.level === 'emergency'
        ? '当前信息提示应立即获得紧急医疗帮助。'
        : '当前开发参考规则未能形成低风险结论，请补充信息或咨询专业人员。',
      factors: rule.reasonCodes.length ? ['已命中安全分诊规则。'] : ['当前可用信息不足。'],
      nextActions: rule.level === 'emergency'
        ? ['立即拨打 120 或前往急诊。']
        : ['如不适持续、加重或担心自身情况，请联系医疗机构。'],
      selfCare: [],
      warningSignals: ['出现呼吸困难、意识异常或症状明显加重时立即求助。'],
      knowledgeReferences: [],
      limitations: ['本结果不构成诊断。', '开发参考规则尚未替代专业审核规则集。'],
      aiGenerated: false,
      generatedAt,
    };
    const safe = parseSafeHealthExplanation(result);
    if (!safe) throw new BadRequestException('健康评估结果未通过安全校验');
    return safe;
  }

  private present(assessment: HealthAssessment) {
    return {
      id: assessment.id,
      status: assessment.status,
      triage: assessment.result && typeof assessment.result === 'object'
        ? (assessment.result as { triage?: unknown }).triage
        : { level: assessment.triageLevel },
      result: assessment.result,
      aiGenerated: Boolean((assessment.result as { aiGenerated?: boolean } | null)?.aiGenerated),
      ruleVersion: assessment.ruleVersion,
      createdAt: assessment.createdAt,
      completedAt: assessment.completedAt,
    };
  }
}
