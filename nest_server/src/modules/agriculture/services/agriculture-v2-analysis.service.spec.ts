import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { AgricultureV2AnalysisService } from './agriculture-v2-analysis.service';

const land = { id: 'd25b3c31-7335-466d-bf94-55260a77c507', name: '菜地', province: '陕西省', city: '西安市', district: '长安区', plantingEnvironment: 'open_field', areaValue: null, areaUnit: null, soil: null, irrigation: null, drainage: null, description: null };
const crop = { id: 1, name: '番茄' };
const knowledgeItem = { id: 7, title: '番茄排水', sourceName: '农业农村部', sourceTitle: null, content: '雨后排水', status: 'published', deletedAt: null, isGeneral: true, regionTags: [], regionCodes: [], crops: { getItems: (): unknown[] => [] } };

const build = (output: unknown, options?: { knowledgeFailure?: boolean; weather?: unknown }) => {
  const agriculture = { findLand: jest.fn().mockResolvedValue(land), findCrop: jest.fn().mockResolvedValue(crop), findPlanting: jest.fn(), listMetrics: jest.fn() };
  const knowledge = { find: options?.knowledgeFailure ? jest.fn().mockRejectedValue(new Error('database unavailable')) : jest.fn().mockResolvedValue([knowledgeItem]) };
  const evaluations = { create: jest.fn((value: Record<string, unknown>) => ({ id: 'evaluation-id', createdAt: new Date('2026-09-19T00:00:00.000Z'), ...value })) };
  const analyses = { create: jest.fn((value: Record<string, unknown>) => ({ id: 'analysis-id', createdAt: new Date('2026-09-19T00:00:00.000Z'), ...value })) };
  const em = { flush: jest.fn().mockResolvedValue(undefined) };
  const llm = { generate: jest.fn().mockResolvedValue({ output, provider: 'test', model: 'test' }) };
  const weather = { getContext: jest.fn().mockResolvedValue(options?.weather ?? { availability: 'unavailable', warning: '天气不可用' }) };
  const service = new AgricultureV2AnalysisService(agriculture as never, knowledge as never, evaluations as never, analyses as never, em as never, llm, weather);
  return { service, evaluations, analyses, em, knowledge, agriculture };
};

describe('AgricultureV2AnalysisService', () => {
  const validEvaluation = { summary: '可种植，但注意排水。', suitability: 'suitable_with_conditions', advantages: [], limitations: [], plantingSuggestions: [], preparations: [], attentionPoints: [], references: [{ knowledgeId: 7 }] };
  it('persists one validated evaluation snapshot and enriches only retrieved references', async () => {
    const { service, evaluations, em } = build(validEvaluation);
    const result = await service.evaluatePlanting(1, land.id, { crop: { type: 'catalog', cropId: 1 }, plannedPlantingTime: null });
    expect(em.flush).toHaveBeenCalledTimes(1);
    const [saved] = evaluations.create.mock.calls[0]!;
    expect(saved.summary).toBe(validEvaluation.summary);
    expect((saved.inputSnapshot as { land: { name: string } }).land.name).toBe('菜地');
    expect((saved.resultSnapshot as { references: unknown[] }).references).toEqual([{ knowledgeId: 7, title: '番茄排水', source: '农业农村部' }]);
    expect(result).toMatchObject({ id: 'evaluation-id' });
  });
  it('rejects a fabricated knowledge reference without saving an analysis', async () => {
    const { service, evaluations, em } = build({ ...validEvaluation, references: [{ knowledgeId: 99 }] });
    await expect(service.evaluatePlanting(1, land.id, { crop: { type: 'catalog', cropId: 1 } })).rejects.toBeInstanceOf(BadGatewayException);
    expect(evaluations.create).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });
  it('rejects a structurally invalid AI result without saving an analysis', async () => {
    const { service, evaluations, em } = build({ summary: 'only a summary' });
    await expect(service.evaluatePlanting(1, land.id, { crop: { type: 'catalog', cropId: 1 } })).rejects.toBeInstanceOf(BadGatewayException);
    expect(evaluations.create).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });
  it('does not turn a knowledge retrieval failure into an empty knowledge result', async () => {
    const { service } = build(validEvaluation, { knowledgeFailure: true });
    await expect(service.evaluatePlanting(1, land.id, { crop: { type: 'catalog', cropId: 1 } })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('persists an explicit unavailable weather state in a growth-analysis snapshot', async () => {
    const output = { summary: '缺少天气数据，建议继续观察。', growthStatus: 'needs_attention', currentSituation: [], concerns: [], possibleFactors: [], managementSuggestions: [], followUp: [], references: [] };
    const { service, agriculture, analyses, em } = build(output, { weather: { availability: 'unavailable', warning: '天气不可用' } });
    agriculture.findPlanting.mockResolvedValue({ id: 'planting-id', crop, land, variety: null, plantingDate: null, plantingTimeText: null, growthStage: null });
    agriculture.listMetrics.mockResolvedValue([]);
    await service.analyzeGrowth(1, 'planting-id', { observations: ['叶片发黄'] });
    const [saved] = analyses.create.mock.calls[0]!;
    expect((saved.inputSnapshot as { weather: { availability: string; warning: string } }).weather).toEqual({ availability: 'unavailable', warning: '天气不可用' });
    expect(em.flush).toHaveBeenCalledTimes(1);
  });
});
