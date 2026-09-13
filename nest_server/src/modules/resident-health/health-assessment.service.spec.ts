import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { User } from '../users/user.entity';
import { DevelopmentReferenceTriageAdapter } from './development-reference-triage.adapter';
import { DeterministicTestHealthCryptoAdapter } from './health-sensitive-data-crypto';
import { HealthAssessment } from './entities/health-assessment.entity';
import { HealthConsent } from './entities/health-consent.entity';
import { HealthMeasurement } from './entities/health-measurement.entity';
import { HealthProfile } from './entities/health-profile.entity';
import { HealthAssessmentService } from './health-assessment.service';

describe('HealthAssessmentService', () => {
  const assessments = { findOne: jest.fn(), findAndCount: jest.fn(), create: jest.fn() };
  const consents = { findOne: jest.fn() };
  const profiles = { findOne: jest.fn() };
  const measurements = { find: jest.fn() };
  const entityManager = { flush: jest.fn() };
  const audit = { record: jest.fn() };
  const explanation = { explain: jest.fn() };
  const user = Object.assign(new User(), { id: 7 });
  let service: HealthAssessmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    entityManager.flush.mockResolvedValue(undefined);
    audit.record.mockResolvedValue(undefined);
    assessments.create.mockImplementation((value: Partial<HealthAssessment>) =>
      Object.assign(new HealthAssessment(), { createdAt: new Date('2026-08-25T00:00:00.000Z'), ...value }),
    );
    consents.findOne.mockResolvedValue(
      Object.assign(new HealthConsent(), { id: '11', userId: 7, scopes: ['assessment'], revokedAt: null }),
    );
    profiles.findOne.mockResolvedValue(null);
    measurements.find.mockResolvedValue([]);
    service = new HealthAssessmentService(
      assessments as unknown as EntityRepository<HealthAssessment>,
      consents as unknown as EntityRepository<HealthConsent>,
      profiles as unknown as EntityRepository<HealthProfile>,
      measurements as unknown as EntityRepository<HealthMeasurement>,
      entityManager as unknown as EntityManager,
      new DeterministicTestHealthCryptoAdapter(),
      new DevelopmentReferenceTriageAdapter(),
      { assessmentDailyLimit: 5, aiExplanationEnabled: false },
      explanation,
      audit as unknown as import('./health-access-audit.service').HealthAccessAuditService,
    );
  });

  it('creates an encrypted, deterministic emergency assessment from the current user only', async () => {
    assessments.findOne.mockResolvedValueOnce(null);
    assessments.findAndCount.mockResolvedValueOnce([[], 0]);
    const result = await service.create(user, {
      idempotencyKey: 'key-1',
      symptoms: [{ code: 'chest_discomfort', severity: 'moderate', course: 'persistent', startedAt: '2026-08-25T08:00:00.000Z' }],
    });

    expect((result.triage as { level: string }).level).toBe('emergency');
    expect(result.aiGenerated).toBe(false);
    expect(assessments.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, status: 'succeeded' }), { partial: true });
    const created = assessments.create.mock.results[0]?.value as HealthAssessment;
    const encrypted = created.inputSnapshotCiphertext as { ciphertext: string };
    expect(typeof encrypted.ciphertext).toBe('string');
    expect(Buffer.from(encrypted.ciphertext, 'base64').toString()).not.toContain('userId');
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', resourceId: created.id }));
  });

  it('serializes bigint measurement identifiers before encrypting an assessment snapshot', async () => {
    assessments.findOne.mockResolvedValueOnce(null);
    assessments.findAndCount.mockResolvedValueOnce([[], 0]);
    measurements.find.mockResolvedValueOnce([
      Object.assign(new HealthMeasurement(), {
        id: 2n as unknown as string,
        userId: 7,
        type: 'body_temperature',
        source: 'self_reported',
        measuredAt: new Date('2026-08-25T08:00:00.000Z'),
        values: { value: 36.5, unit: 'celsius' },
      }),
    ]);

    await service.create(user, {
      idempotencyKey: 'measurement-bigint',
      symptoms: [{ code: 'chest_discomfort', severity: 'moderate', course: 'persistent', startedAt: '2026-08-25T08:00:00.000Z' }],
      measurementIds: ['2'],
    });

    const created = assessments.create.mock.results[0]?.value as HealthAssessment;
    const encrypted = created.inputSnapshotCiphertext as { ciphertext: string };
    expect(Buffer.from(encrypted.ciphertext, 'base64').toString()).toContain('"id":"2"');
  });

  it('returns the prior result for the same user idempotency key without evaluating again', async () => {
    assessments.findOne.mockResolvedValueOnce(Object.assign(new HealthAssessment(), {
      id: 'existing', userId: 7, status: 'succeeded', triageLevel: 'insufficient', ruleVersion: 'v1',
      result: { schemaVersion: '1.0', triage: { level: 'insufficient', reasonCodes: [], message: '信息不足' }, summary: '信息不足', factors: [], nextActions: [], selfCare: [], warningSignals: [], knowledgeReferences: [], limitations: ['不构成诊断'], aiGenerated: false, generatedAt: new Date() },
    }));
    const result = await service.create(user, { idempotencyKey: 'same-key', symptoms: [{ code: 'fever', severity: 'mild', course: 'new', startedAt: '2026-08-25T08:00:00.000Z' }] });
    expect(result.id).toBe('existing');
    expect(assessments.findAndCount).not.toHaveBeenCalled();
  });

  it('uses the AI explanation port with consented, de-identified symptom fields only', async () => {
    consents.findOne.mockResolvedValueOnce(
      Object.assign(new HealthConsent(), { id: '11', userId: 7, scopes: ['assessment', 'ai_processing'], revokedAt: null }),
    );
    assessments.findOne.mockResolvedValueOnce(null);
    assessments.findAndCount.mockResolvedValueOnce([[], 0]);
    explanation.explain.mockResolvedValueOnce({
      schemaVersion: '1.0',
      triage: { level: 'insufficient', reasonCodes: ['DEVELOPMENT_RULE_NO_MATCH'], message: '信息不足' },
      summary: 'AI 生成的补充健康说明。', factors: ['已提供发热症状。'], nextActions: ['如持续不适，请联系医疗机构。'],
      selfCare: [], warningSignals: ['症状明显加重时立即求助。'], knowledgeReferences: [],
      limitations: ['本结果不构成诊断。'], aiGenerated: true, generatedAt: new Date('2026-08-25T08:01:00.000Z'),
    });
    service = new HealthAssessmentService(
      assessments as unknown as EntityRepository<HealthAssessment>, consents as unknown as EntityRepository<HealthConsent>,
      profiles as unknown as EntityRepository<HealthProfile>, measurements as unknown as EntityRepository<HealthMeasurement>,
      entityManager as unknown as EntityManager, new DeterministicTestHealthCryptoAdapter(), new DevelopmentReferenceTriageAdapter(),
      { assessmentDailyLimit: 5, aiExplanationEnabled: true }, explanation,
      audit as unknown as import('./health-access-audit.service').HealthAccessAuditService,
    );

    const result = await service.create(user, {
      idempotencyKey: 'ai-explanation',
      symptoms: [{ code: 'fever', severity: 'moderate', course: 'new', startedAt: '2026-08-25T08:00:00.000Z' }],
      otherDetails: '不应发送给模型',
    });

    expect(explanation.explain).toHaveBeenCalledWith(expect.objectContaining({
      symptoms: [{ code: 'fever', severity: 'moderate', course: 'new' }],
    }));
    expect(result.aiGenerated).toBe(true);
  });

  it('fails closed when assessment consent is absent and hides records owned by another user', async () => {
    consents.findOne.mockResolvedValueOnce(null);
    await expect(service.create(user, { idempotencyKey: 'denied', symptoms: [{ code: 'fever', severity: 'mild', course: 'new', startedAt: '2026-08-25T08:00:00.000Z' }] })).rejects.toBeInstanceOf(ServiceUnavailableException);
    assessments.findOne.mockResolvedValueOnce(null);
    await expect(service.getOne(user, 'someone-else')).rejects.toBeInstanceOf(NotFoundException);
    expect(assessments.findOne).toHaveBeenLastCalledWith({ id: 'someone-else', userId: 7, deletedAt: null });
  });
});
