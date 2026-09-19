import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, QueryOrder, type EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { CropStatus, KnowledgeStatus } from '../agriculture.enums';
import type { LandInput, LandPatch, PlantingInput, PlantingPatch } from '../agriculture-v2.schemas';
import { calculateGrowthTrend } from '../growth-trend';
import { AgricultureKnowledge } from '../entities/agriculture-knowledge.entity';
import { Crop } from '../entities/crop.entity';
import { AgricultureGrowthMetric, AgricultureGrowthMetricRecord, AgricultureLand, AgriculturePlanting, AgriculturePlantingEvaluation, AgricultureGrowthAnalysis } from '../entities/agriculture-v2.entity';
import { User } from '../../users/user.entity';

const notFound = (): never => { throw new NotFoundException('RESOURCE_NOT_FOUND'); };

@Injectable()
export class AgricultureV2Service {
  constructor(
    @InjectRepository(AgricultureLand) private readonly lands: EntityRepository<AgricultureLand>,
    @InjectRepository(AgriculturePlanting) private readonly plantings: EntityRepository<AgriculturePlanting>,
    @InjectRepository(AgricultureGrowthMetric) private readonly metrics: EntityRepository<AgricultureGrowthMetric>,
    @InjectRepository(AgricultureGrowthMetricRecord) private readonly records: EntityRepository<AgricultureGrowthMetricRecord>,
    @InjectRepository(AgriculturePlantingEvaluation) private readonly evaluations: EntityRepository<AgriculturePlantingEvaluation>,
    @InjectRepository(AgricultureGrowthAnalysis) private readonly analyses: EntityRepository<AgricultureGrowthAnalysis>,
    @InjectRepository(Crop) private readonly crops: EntityRepository<Crop>,
    @InjectRepository(AgricultureKnowledge) private readonly knowledge: EntityRepository<AgricultureKnowledge>,
    private readonly em: EntityManager,
  ) {}

  async createLand(userId: number, input: LandInput) {
    const land = this.lands.create({ user: this.em.getReference(User, userId), name: input.name, province: input.region.province, city: input.region.city, district: input.region.district, plantingEnvironment: input.plantingEnvironment, areaValue: input.area ? String(input.area.value) : null, areaUnit: input.area?.unit ?? null, soil: input.soil ?? null, irrigation: input.irrigation ?? null, drainage: input.drainage ?? null, description: input.description ?? null }, { partial: true });
    await this.em.flush(); return land;
  }
  async listLands(userId: number) { return this.lands.find({ user: userId }, { orderBy: { createdAt: QueryOrder.DESC } }); }
  async findLand(userId: number, id: string) { const land = await this.lands.findOne({ id, user: userId }); return land ?? notFound(); }
  async patchLand(userId: number, id: string, input: LandPatch) {
    const land = await this.findLand(userId, id);
    if (input.name !== undefined) land.name = input.name;
    if (input.region) { land.province = input.region.province; land.city = input.region.city; land.district = input.region.district; }
    if (input.plantingEnvironment !== undefined) land.plantingEnvironment = input.plantingEnvironment;
    if (input.area !== undefined) { land.areaValue = input.area ? String(input.area.value) : null; land.areaUnit = input.area?.unit ?? null; }
    if (input.soil !== undefined) land.soil = input.soil;
    if (input.irrigation !== undefined) land.irrigation = input.irrigation;
    if (input.drainage !== undefined) land.drainage = input.drainage;
    if (input.description !== undefined) land.description = input.description;
    await this.em.flush(); return land;
  }
  async deleteLand(userId: number, id: string) {
    const land = await this.findLand(userId, id);
    if (await this.plantings.count({ land }) || await this.evaluations.count({ land })) throw new ConflictException('LAND_HAS_HISTORY');
    this.em.remove(land); await this.em.flush();
  }
  async listCrops(query: { keyword?: string; page: number; pageSize: number }) {
    const where = query.keyword ? { status: CropStatus.Active, $or: [{ name: { $ilike: `%${query.keyword}%` } }, { aliases: { alias: { $ilike: `%${query.keyword}%` } } }] } : { status: CropStatus.Active };
    const [items, total] = await this.crops.findAndCount(where, { populate: ['aliases'], limit: query.pageSize, offset: (query.page - 1) * query.pageSize, orderBy: { name: QueryOrder.ASC } });
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async findCrop(id: number) { const crop = await this.crops.findOne({ id, status: CropStatus.Active }, { populate: ['aliases'] }); return crop ?? notFound(); }
  async listKnowledge(query: { keyword?: string; cropId?: number; category?: string; page: number; pageSize: number }) {
    const where: Record<string, unknown> = { status: KnowledgeStatus.Published, deletedAt: null };
    if (query.keyword) where.$or = [{ title: { $ilike: `%${query.keyword}%` } }, { content: { $ilike: `%${query.keyword}%` } }];
    if (query.cropId) where.crops = query.cropId;
    if (query.category) where.category = query.category;
    const [items, total] = await this.knowledge.findAndCount(where, { populate: ['crops'], limit: query.pageSize, offset: (query.page - 1) * query.pageSize, orderBy: { updatedAt: QueryOrder.DESC } });
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async findKnowledge(id: number) { const item = await this.knowledge.findOne({ id, status: KnowledgeStatus.Published, deletedAt: null }, { populate: ['crops'] }); return item ?? notFound(); }
  async createPlanting(userId: number, landId: string, input: PlantingInput) {
    const [land, crop] = await Promise.all([this.findLand(userId, landId), this.findCrop(input.cropId)]);
    const planting = this.plantings.create({ land, crop, variety: input.variety ?? null, plantingDate: input.plantingTime?.type === 'date' ? input.plantingTime.date : null, plantingTimeText: input.plantingTime?.type === 'text' ? input.plantingTime.text : null, growthStage: input.growthStage ?? null, status: input.status, description: input.description ?? null }, { partial: true });
    await this.em.flush(); return planting;
  }
  async listPlantings(userId: number, query: { landId?: string; cropId?: number; status?: string; page: number; pageSize: number }) {
    const where: Record<string, unknown> = { land: { user: userId } };
    if (query.landId) where.land = { user: userId, id: query.landId };
    if (query.cropId) where.crop = query.cropId;
    if (query.status) where.status = query.status;
    const [items, total] = await this.plantings.findAndCount(where, { populate: ['land', 'crop'], limit: query.pageSize, offset: (query.page - 1) * query.pageSize, orderBy: { createdAt: QueryOrder.DESC } });
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async findPlanting(userId: number, id: string) { const item = await this.plantings.findOne({ id }, { populate: ['land', 'land.user', 'crop'] }); if (!item || item.land.user.id !== userId) return notFound(); return item; }
  async patchPlanting(userId: number, id: string, input: PlantingPatch) {
    const planting = await this.findPlanting(userId, id);
    if (input.variety !== undefined) planting.variety = input.variety;
    if (input.plantingTime !== undefined) { planting.plantingDate = input.plantingTime?.type === 'date' ? input.plantingTime.date : null; planting.plantingTimeText = input.plantingTime?.type === 'text' ? input.plantingTime.text : null; }
    if (input.growthStage !== undefined) planting.growthStage = input.growthStage;
    if (input.description !== undefined) planting.description = input.description;
    if (input.status && input.status !== planting.status) { const allowed: Record<string, string[]> = { planned: ['growing', 'ended'], growing: ['harvested', 'ended'], harvested: ['ended'], ended: [] }; if (!allowed[planting.status]?.includes(input.status)) throw new ConflictException('INVALID_PLANTING_STATUS_TRANSITION'); planting.status = input.status; }
    await this.em.flush(); return planting;
  }
  async deletePlanting(userId: number, id: string) { const planting = await this.findPlanting(userId, id); if (await this.metrics.count({ planting }) || await this.analyses.count({ planting })) throw new ConflictException('PLANTING_HAS_HISTORY'); this.em.remove(planting); await this.em.flush(); }
  async createMetric(userId: number, plantingId: string, input: { name: string; unit: string }) { const planting = await this.findPlanting(userId, plantingId); if (await this.metrics.count({ planting, name: input.name })) throw new ConflictException('指标名称已存在'); const metric = this.metrics.create({ planting, ...input }, { partial: true }); await this.em.flush(); return metric; }
  async listMetrics(userId: number, plantingId: string) { const planting = await this.findPlanting(userId, plantingId); return this.metrics.find({ planting }, { populate: ['records'], orderBy: { createdAt: QueryOrder.ASC } }); }
  async findMetric(userId: number, id: string) { const item = await this.metrics.findOne({ id }, { populate: ['planting', 'planting.land', 'planting.land.user'] }); if (!item || item.planting.land.user.id !== userId) return notFound(); return item; }
  async deleteMetric(userId: number, id: string) { const metric = await this.findMetric(userId, id); if (await this.records.count({ metric })) throw new ConflictException('METRIC_HAS_RECORDS'); this.em.remove(metric); await this.em.flush(); }
  async createRecord(userId: number, metricId: string, input: { value: number; recordedAt: string; note?: string | null }) { const metric = await this.findMetric(userId, metricId); const record = this.records.create({ metric, value: String(input.value), recordedAt: new Date(input.recordedAt), note: input.note ?? null }, { partial: true }); await this.em.flush(); return record; }
  async listRecords(userId: number, metricId: string, query: { from?: string; to?: string; page: number; pageSize: number }) { const metric = await this.findMetric(userId, metricId); const all = await this.records.find({ metric }, { orderBy: { recordedAt: QueryOrder.DESC } }); const filtered = all.filter((record) => (!query.from || record.recordedAt >= new Date(query.from)) && (!query.to || record.recordedAt <= new Date(query.to))); return { items: filtered.slice((query.page - 1) * query.pageSize, query.page * query.pageSize), total: filtered.length, page: query.page, pageSize: query.pageSize }; }
  async deleteRecord(userId: number, metricId: string, recordId: string) { const metric = await this.findMetric(userId, metricId); const record = await this.records.findOne({ id: recordId, metric }); if (!record) return notFound(); this.em.remove(record); await this.em.flush(); }
  async trend(userId: number, metricId: string, query: { from?: string; to?: string; limit: number }) { const metric = await this.findMetric(userId, metricId); const all = await this.records.find({ metric }, { orderBy: { recordedAt: QueryOrder.DESC } }); const points = all.filter((record) => (!query.from || record.recordedAt >= new Date(query.from)) && (!query.to || record.recordedAt <= new Date(query.to))).slice(0, query.limit).reverse().map((record) => ({ value: Number(record.value), recordedAt: record.recordedAt })); return { metric, points, ...calculateGrowthTrend(points) }; }
  async findEvaluation(userId: number, id: string) { const item = await this.evaluations.findOne({ id }, { populate: ['land', 'land.user'] }); if (!item || item.land.user.id !== userId) return notFound(); return item; }
  async listEvaluations(userId: number, landId: string, page: number, pageSize: number) { const land = await this.findLand(userId, landId); const [items, total] = await this.evaluations.findAndCount({ land }, { limit: pageSize, offset: (page - 1) * pageSize, orderBy: { createdAt: QueryOrder.DESC } }); return { items, total, page, pageSize }; }
  async findAnalysis(userId: number, id: string) { const item = await this.analyses.findOne({ id }, { populate: ['planting', 'planting.land', 'planting.land.user'] }); if (!item || item.planting.land.user.id !== userId) return notFound(); return item; }
  async listAnalyses(userId: number, plantingId: string, page: number, pageSize: number) { const planting = await this.findPlanting(userId, plantingId); const [items, total] = await this.analyses.findAndCount({ planting }, { limit: pageSize, offset: (page - 1) * pageSize, orderBy: { createdAt: QueryOrder.DESC } }); return { items, total, page, pageSize }; }
}
