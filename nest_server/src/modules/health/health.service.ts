import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { EntityManager, QueryOrder, type EntityRepository, type FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { HealthKnowledge } from './entities/health-knowledge.entity';
import { HealthMetricRecord } from './entities/health-metric-record.entity';
import { HealthMetricTemplate } from './entities/health-metric-template.entity';
import { HealthProfile } from './entities/health-profile.entity';
import type { MetricType } from './health.types';
import type { KnowledgeQuery, MetricInput, MetricsQuery, ProfileInput, TemplateInput, TemplatePatchInput, TemplatesQuery } from './health.schemas';
import { calculateSeriesStatistics } from './health-statistics';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(HealthProfile) private readonly profiles: EntityRepository<HealthProfile>,
    @InjectRepository(HealthMetricTemplate) private readonly templates: EntityRepository<HealthMetricTemplate>,
    @InjectRepository(HealthMetricRecord) private readonly metrics: EntityRepository<HealthMetricRecord>,
    @InjectRepository(HealthKnowledge) private readonly knowledge: EntityRepository<HealthKnowledge>,
    private readonly em: EntityManager,
  ) {}

  async getProfile(userId: number) { return this.profiles.findOne({ userId }); }
  async putProfile(userId: number, dto: ProfileInput) {
    const profile = (await this.profiles.findOne({ userId })) ?? this.profiles.create({ userId }, { partial: true });
    const { heightCm, ...fields } = dto;
    this.profiles.assign(profile, { ...fields, ...(heightCm === undefined ? {} : { heightCm: heightCm === null ? null : String(heightCm) }) }); await this.em.flush(); return profile;
  }
  async createMetric(userId: number, dto: MetricInput) {
    let unit: string; let templateId: number | null = null;
    if (dto.metricType === 'custom') { const template = await this.templates.findOne({ id: dto.templateId, userId }); if (!template) throw new NotFoundException('健康指标模板不存在'); unit = template.unit; templateId = template.id; }
    else unit = ({ weight: 'kg', temperature: '℃', heart_rate: 'bpm', blood_pressure: 'mmHg' } as const)[dto.metricType];
    const record = this.metrics.create({ userId, metricType: dto.metricType, templateId, numericValue: 'value' in dto ? String(dto.value) : null, systolicValue: 'systolic' in dto ? String(dto.systolic) : null, diastolicValue: 'diastolic' in dto ? String(dto.diastolic) : null, unit, measuredAt: new Date(dto.measuredAt) }, { partial: true });
    await this.em.flush(); return record;
  }
  async listMetrics(userId: number, query: MetricsQuery) {
    const where: FilterQuery<HealthMetricRecord> = { userId }; if (query.metricType) where.metricType = query.metricType; if (query.templateId) where.templateId = query.templateId;
    if (query.from || query.to) where.measuredAt = { ...(query.from ? { $gte: new Date(query.from) } : {}), ...(query.to ? { $lte: new Date(query.to) } : {}) };
    const [items, total] = await this.metrics.findAndCount(where, { limit: query.pageSize, offset: (query.page - 1) * query.pageSize, orderBy: { measuredAt: QueryOrder.DESC } }); return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async deleteMetric(userId: number, id: number) { const metric = await this.metrics.findOne({ id, userId }); if (!metric) throw new NotFoundException('健康指标记录不存在'); this.em.remove(metric); await this.em.flush(); }
  async trend(userId: number, target: { metricType?: Exclude<MetricType, 'custom'>; templateId?: number; from?: string; to?: string }) {
    const where: FilterQuery<HealthMetricRecord> = { userId }; if (target.templateId) { const template = await this.templates.findOne({ id: target.templateId, userId }); if (!template) throw new NotFoundException('健康指标模板不存在'); where.templateId = template.id; } else if (target.metricType) where.metricType = target.metricType;
    if (target.from || target.to) where.measuredAt = { ...(target.from ? { $gte: new Date(target.from) } : {}), ...(target.to ? { $lte: new Date(target.to) } : {}) };
    const records = await this.metrics.find(where, { orderBy: { measuredAt: QueryOrder.ASC } }); const bloodPressure = target.metricType === 'blood_pressure';
    const values = (field: 'numericValue' | 'systolicValue' | 'diastolicValue') => records.map((r) => Number(r[field]));
    const stats = calculateSeriesStatistics;
    if (bloodPressure) return { target: { type: 'blood_pressure', unit: 'mmHg' }, points: records.map((r) => ({ measuredAt: r.measuredAt, systolic: Number(r.systolicValue), diastolic: Number(r.diastolicValue) })), statistics: { systolic: stats(values('systolicValue')), diastolic: stats(values('diastolicValue')) } };
    return { target: { type: target.templateId ? 'custom' : target.metricType, unit: records[0]?.unit ?? null }, points: records.map((r) => ({ measuredAt: r.measuredAt, value: Number(r.numericValue) })), statistics: stats(values('numericValue')) };
  }
  async listTemplates(userId: number, query: TemplatesQuery) { const where: FilterQuery<HealthMetricTemplate> = { userId }; if (query.active) where.endedAt = null; const [items, total] = await this.templates.findAndCount(where, { limit: query.pageSize, offset: (query.page - 1) * query.pageSize, orderBy: { createdAt: QueryOrder.DESC } }); return { items, total, page: query.page, pageSize: query.pageSize }; }
  async createTemplate(userId: number, dto: TemplateInput) { const item = this.templates.create({ userId, ...dto, startedAt: new Date(dto.startedAt) }, { partial: true }); await this.em.flush(); return item; }
  async getTemplate(userId: number, id: number) { const item = await this.templates.findOne({ id, userId }); if (!item) throw new NotFoundException('健康指标模板不存在'); return item; }
  async patchTemplate(userId: number, id: number, dto: TemplatePatchInput) { const item = await this.getTemplate(userId, id); this.templates.assign(item, { ...dto, ...(dto.endedAt !== undefined ? { endedAt: dto.endedAt ? new Date(dto.endedAt) : null } : {}) }); await this.em.flush(); return item; }
  async listKnowledge(query: KnowledgeQuery) { const where: FilterQuery<HealthKnowledge> = { isPublished: true }; if (query.category) where.category = query.category; if (query.q) where.$or = [{ title: { $ilike: `%${query.q}%` } }, { summary: { $ilike: `%${query.q}%` } }, { content: { $ilike: `%${query.q}%` } }]; const [items, total] = await this.knowledge.findAndCount(where, { limit: query.pageSize, offset: (query.page - 1) * query.pageSize, orderBy: { updatedAt: QueryOrder.DESC } }); return { items, total, page: query.page, pageSize: query.pageSize }; }
  async getKnowledge(id: number) { const item = await this.knowledge.findOne({ id, isPublished: true }); if (!item) throw new NotFoundException('健康知识不存在'); return item; }
  createAnalysis(): never { throw new ServiceUnavailableException('健康分析模型尚未配置'); }
}
