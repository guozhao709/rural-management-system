import { BadGatewayException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EntityManager, QueryOrder, type EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { KnowledgeStatus } from '../agriculture.enums';
import type { EvaluationInput, GrowthAnalysisInput, GrowthAnalysisResult, PlantingEvaluationResult } from '../agriculture-v2.schemas';
import { growthAnalysisResultSchema, plantingEvaluationResultSchema } from '../agriculture-v2.schemas';
import { AgricultureKnowledge } from '../entities/agriculture-knowledge.entity';
import { AgricultureGrowthAnalysis, AgriculturePlantingEvaluation } from '../entities/agriculture-v2.entity';
import { AGRICULTURE_V2_LLM_PORT, type AgricultureV2LlmPort } from '../ports/agriculture-v2-llm.port';
import { AGRICULTURE_V2_WEATHER_PORT, type AgricultureV2WeatherPort } from '../ports/agriculture-v2-weather.port';
import { AgricultureV2Service } from './agriculture-v2.service';

type RetrievedKnowledge = { id: number; title: string; source: string | null; sourceTitle: string | null; content: string };

@Injectable()
export class AgricultureV2AnalysisService {
  constructor(
    private readonly agriculture: AgricultureV2Service,
    @InjectRepository(AgricultureKnowledge) private readonly knowledge: EntityRepository<AgricultureKnowledge>,
    @InjectRepository(AgriculturePlantingEvaluation) private readonly evaluations: EntityRepository<AgriculturePlantingEvaluation>,
    @InjectRepository(AgricultureGrowthAnalysis) private readonly analyses: EntityRepository<AgricultureGrowthAnalysis>,
    private readonly em: EntityManager,
    @Inject(AGRICULTURE_V2_LLM_PORT) private readonly llm: AgricultureV2LlmPort,
    @Inject(AGRICULTURE_V2_WEATHER_PORT) private readonly weather: AgricultureV2WeatherPort,
  ) {}

  async evaluatePlanting(userId: number, landId: string, input: EvaluationInput) {
    const land = await this.agriculture.findLand(userId, landId);
    const crop = input.crop.type === 'catalog' ? await this.agriculture.findCrop(input.crop.cropId) : null;
    const cropName = input.crop.type === 'catalog' ? crop!.name : input.crop.name;
    const knowledge = await this.retrieveKnowledge(crop?.id ?? null, land);
    const context = {
      land: this.landContext(land),
      crop: { id: crop?.id ?? null, inputName: cropName, standardName: crop?.name ?? null, variety: input.crop.variety ?? null },
      plannedPlantingTime: input.plannedPlantingTime ?? null,
      knowledgeContext: knowledge,
    };
    const generated = await this.llm.generate(this.evaluationPrompt(context));
    const parsed = plantingEvaluationResultSchema.safeParse(generated.output);
    if (!parsed.success) throw new BadGatewayException('AI_OUTPUT_INVALID');
    const result = this.withReferences(parsed.data, knowledge);
    const item = this.evaluations.create({ land, crop, cropName, variety: input.crop.variety ?? null, plannedPlantingTime: input.plannedPlantingTime ?? null, summary: result.summary, suitability: result.suitability, inputSnapshot: context, resultSnapshot: result }, { partial: true });
    await this.em.flush();
    return item;
  }

  async analyzeGrowth(userId: number, plantingId: string, input: GrowthAnalysisInput) {
    const planting = await this.agriculture.findPlanting(userId, plantingId);
    const metrics = await this.agriculture.listMetrics(userId, plantingId);
    const knowledge = await this.retrieveKnowledge(planting.crop.id, planting.land);
    const weather = await this.weatherContext(planting.land);
    const growthMetrics = metrics.map((metric) => {
      const points = metric.records.getItems().sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
      const values = points.slice(-10).map((record) => Number(record.value));
      const first = values.at(0);
      const latest = values.at(-1);
      const change = first === undefined || latest === undefined ? null : latest - first;
      const tolerance = first === undefined ? 0 : Math.max(Math.abs(first) * 0.01, 0.0001);
      return { name: metric.name, unit: metric.unit, latestValue: latest ?? null, trend: values.length < 2 ? 'insufficient_data' : change! > tolerance ? 'increasing' : change! < -tolerance ? 'decreasing' : 'stable', recentValues: values };
    });
    const context = {
      planting: { id: planting.id, crop: { id: planting.crop.id, name: planting.crop.name, variety: planting.variety }, plantingDate: planting.plantingDate, plantingTime: planting.plantingTimeText, growthStage: planting.growthStage },
      land: this.landContext(planting.land), observations: input.observations, description: input.description ?? null,
      weather, growthMetrics, knowledgeContext: knowledge,
    };
    const generated = await this.llm.generate(this.growthPrompt(context));
    const parsed = growthAnalysisResultSchema.safeParse(generated.output);
    if (!parsed.success) throw new BadGatewayException('AI_OUTPUT_INVALID');
    const result = this.withReferences(parsed.data, knowledge);
    const item = this.analyses.create({ planting, summary: result.summary, growthStatus: result.growthStatus, inputSnapshot: context, resultSnapshot: result }, { partial: true });
    await this.em.flush();
    return item;
  }

  private async retrieveKnowledge(cropId: number | null, land: { province: string; city: string; district: string }) {
    try {
      const candidates = await this.knowledge.find({ status: KnowledgeStatus.Published, deletedAt: null }, { populate: ['crops'], orderBy: { updatedAt: QueryOrder.DESC }, limit: 50 });
      return candidates.filter((item) => {
        const cropMatches = !cropId || item.isGeneral || item.crops.getItems().some((crop) => crop.id === cropId);
        const regions = item.regionTags.length ? item.regionTags : item.regionCodes;
        const regionMatches = regions.length === 0 || regions.some((tag) => [land.province, land.city, land.district].includes(tag));
        return cropMatches && regionMatches;
      }).slice(0, 8).map((item): RetrievedKnowledge => ({ id: item.id, title: item.title, source: item.sourceName, sourceTitle: item.sourceTitle, content: item.content }));
    } catch { throw new ServiceUnavailableException('KNOWLEDGE_RETRIEVAL_FAILED'); }
  }

  private async weatherContext(land: { province: string; city: string; district: string }) {
    try { return await this.weather.getContext({ province: land.province, city: land.city, district: land.district }); }
    catch { return { availability: 'unavailable' as const, warning: '天气数据获取失败，未向分析提供模拟天气。' }; }
  }

  private withReferences<T extends PlantingEvaluationResult | GrowthAnalysisResult>(result: T, knowledge: RetrievedKnowledge[]) {
    const byId = new Map(knowledge.map((item) => [item.id, item]));
    const ids = new Set<number>();
    for (const reference of result.references) { if (!byId.has(reference.knowledgeId)) throw new BadGatewayException('AI_OUTPUT_INVALID'); ids.add(reference.knowledgeId); }
    return { ...result, references: [...ids].map((id) => { const item = byId.get(id)!; return { knowledgeId: item.id, title: item.title, source: item.source }; }) };
  }

  private landContext(land: { id: string; name: string; province: string; city: string; district: string; plantingEnvironment: string; areaValue: string | null; areaUnit: string | null; soil: string | null; irrigation: string | null; drainage: string | null; description: string | null }) {
    return { id: land.id, name: land.name, region: { province: land.province, city: land.city, district: land.district }, plantingEnvironment: land.plantingEnvironment, area: land.areaValue === null || land.areaUnit === null ? null : { value: Number(land.areaValue), unit: land.areaUnit }, soil: land.soil, irrigation: land.irrigation, drainage: land.drainage, description: land.description };
  }

  private evaluationPrompt(context: object) {
    return `你正在执行固定的种植评估，不是对话 Agent。只根据以下 JSON 中的事实回答；缺失字段明确为 unknown，不得补造土壤、天气、指标、知识或来源。不要预测产量、成熟/采摘时间、诊断病害、给出无依据的精确农药剂量或百分比评分。references 只能填写 knowledgeContext 中的 knowledgeId。只输出 JSON：{"summary":"","suitability":"suitable|suitable_with_conditions|limited|not_recommended","advantages":[],"limitations":[],"plantingSuggestions":[],"preparations":[],"attentionPoints":[],"references":[{"knowledgeId":1}]}\n事实：${JSON.stringify(context)}`;
  }
  private growthPrompt(context: object) {
    return `你正在执行固定的生长分析，不是对话 Agent。只根据以下 JSON 中的事实回答；任何 unavailable 或 unknown 必须保持该状态，尤其不得伪造天气、土壤、未记录指标或知识。possibleFactors 必须使用可能/需观察等不确定表述，不得确诊病害；不要预测产量、成熟/采摘时间、给出无依据精确农药剂量或百分比评分。references 只能填写 knowledgeContext 中的 knowledgeId。只输出 JSON：{"summary":"","growthStatus":"normal|needs_attention|abnormal","currentSituation":[],"concerns":[],"possibleFactors":[],"managementSuggestions":[],"followUp":[],"references":[{"knowledgeId":1}]}\n事实：${JSON.stringify(context)}`;
  }
}
