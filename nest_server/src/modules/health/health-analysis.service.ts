import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, QueryOrder, type EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { HealthAnalysis } from './entities/health-analysis.entity';
import { HealthKnowledge } from './entities/health-knowledge.entity';
import { HealthMetricRecord } from './entities/health-metric-record.entity';
import { HealthProfile } from './entities/health-profile.entity';
import { HEALTH_LLM_PORT, type HealthLlmPort } from './health-llm.port';
import type { AnalysesQuery, AnalysisInput } from './health.schemas';
import { calculateBmi, calculateSeriesStatistics } from './health-statistics';

@Injectable()
export class HealthAnalysisService {
  constructor(@InjectRepository(HealthAnalysis) private readonly analyses: EntityRepository<HealthAnalysis>, @InjectRepository(HealthProfile) private readonly profiles: EntityRepository<HealthProfile>, @InjectRepository(HealthMetricRecord) private readonly metrics: EntityRepository<HealthMetricRecord>, @InjectRepository(HealthKnowledge) private readonly knowledge: EntityRepository<HealthKnowledge>, private readonly em: EntityManager, @Inject(HEALTH_LLM_PORT) private readonly llm: HealthLlmPort) {}
  async create(userId: number, input: AnalysisInput) {
    const profile = await this.profiles.findOne({ userId });
    const metrics = await this.metrics.find({ userId }, { orderBy: { measuredAt: QueryOrder.DESC }, limit: 20 });
    const knowledge = await this.knowledge.find({ isPublished: true }, { orderBy: { updatedAt: QueryOrder.DESC }, limit: 8 });
    const weightValues = metrics.filter((metric) => metric.metricType === 'weight' && metric.numericValue !== null).map((metric) => Number(metric.numericValue)).reverse();
    const heightCm = profile?.heightCm === null || profile?.heightCm === undefined ? null : Number(profile.heightCm);
    const weightStatistics = calculateSeriesStatistics(weightValues);
    const context = { profile: profile ? { age: profile.birthDate ? this.age(profile.birthDate) : null, sex: profile.sex, heightCm, smokingStatus: profile.smokingStatus, drinkingStatus: profile.drinkingStatus, exerciseStatus: profile.exerciseStatus, sleepStatus: profile.sleepStatus, healthHistory: profile.healthHistory, allergies: profile.allergies } : null, recentMetrics: metrics.map((metric) => ({ metricType: metric.metricType, value: metric.numericValue === null ? null : Number(metric.numericValue), systolic: metric.systolicValue === null ? null : Number(metric.systolicValue), diastolic: metric.diastolicValue === null ? null : Number(metric.diastolicValue), unit: metric.unit, measuredAt: metric.measuredAt })), statistics: { bmi: heightCm === null || weightStatistics.latest === null ? null : calculateBmi(heightCm, weightStatistics.latest), weightTrend: weightStatistics.trend }, knowledge: knowledge.map((item) => ({ id: item.id, title: item.title, source: item.sourceName, content: item.content })) };
    const prompt = `仅使用以下用户事实生成生活建议；未知数据必须明确为未知。禁止疾病确诊、概率、处方药和剂量。用户本次输入：${JSON.stringify(input)}\n系统上下文：${JSON.stringify(context)}\n只输出 JSON：{"summary":"", "concerns":[], "factors":[], "suggestions":[], "medicalAdvice":"", "references":[{"knowledgeId":1,"title":"","source":""}]}`;
    const result = await this.llm.generate(prompt);
    const knowledgeById = new Map(knowledge.map((item) => [item.id, item]));
    result.references = result.references.flatMap((reference) => {
      const item = knowledgeById.get(reference.knowledgeId);
      return item ? [{ knowledgeId: item.id, title: item.title, source: item.sourceName }] : [];
    });
    const analysis = this.analyses.create({ userId, inputSnapshot: input, contextSnapshot: context, resultSnapshot: result, schemaVersion: 'v1' }, { partial: true }); await this.em.flush(); return analysis;
  }
  async list(userId: number, query: AnalysesQuery) { const [items, total] = await this.analyses.findAndCount({ userId }, { limit: query.pageSize, offset: (query.page - 1) * query.pageSize, orderBy: { createdAt: QueryOrder.DESC } }); return { items, total, page: query.page, pageSize: query.pageSize }; }
  async get(userId: number, id: number) { const item = await this.analyses.findOne({ id, userId }); if (!item) throw new NotFoundException('健康分析不存在'); return item; }
  private age(birthDate: string) { const birth = new Date(`${birthDate}T00:00:00Z`); const now = new Date(); return now.getUTCFullYear() - birth.getUTCFullYear() - (now < new Date(Date.UTC(now.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate())) ? 1 : 0); }
}
