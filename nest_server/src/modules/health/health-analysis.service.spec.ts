import { BadGatewayException } from '@nestjs/common';
import { HealthAnalysisService } from './health-analysis.service';

describe('HealthAnalysisService', () => {
  const analyses = { create: jest.fn(), findAndCount: jest.fn(), findOne: jest.fn() };
  const profiles = { findOne: jest.fn() };
  const metrics = { find: jest.fn() };
  const knowledge = { find: jest.fn() };
  const em = { flush: jest.fn() };
  const llm = { generate: jest.fn() };
  const service = new HealthAnalysisService(analyses as never, profiles as never, metrics as never, knowledge as never, em as never, llm);

  beforeEach(() => {
    jest.clearAllMocks();
    profiles.findOne.mockResolvedValue({ birthDate: '2000-01-01', heightCm: '175', sex: 'male', smokingStatus: null, drinkingStatus: null, exerciseStatus: null, sleepStatus: null, healthHistory: null, allergies: null });
    metrics.find.mockResolvedValue([{ metricType: 'weight', numericValue: '65.2', systolicValue: null, diastolicValue: null, unit: 'kg', measuredAt: new Date('2026-09-01T00:00:00Z') }]);
    knowledge.find.mockResolvedValue([{ id: 7, title: '正确测量体重', sourceName: '示例机构', content: '正文' }]);
    analyses.create.mockImplementation((value: object) => ({ id: 1, ...value, createdAt: new Date('2026-09-17T00:00:00Z') }));
    llm.generate.mockResolvedValue({ summary: '概况', concerns: [], factors: [], suggestions: ['观察'], medicalAdvice: '如症状加重请及时就医。', references: [{ knowledgeId: 7, title: '伪造标题', source: '伪造来源' }, { knowledgeId: 999, title: '伪造', source: '未知' }] });
  });

  it('builds deterministic context and persists only permitted knowledge references', async () => {
    const analysis = await service.create(3, { symptoms: ['fatigue'], severity: 'mild', duration: 'today' });

    expect(analysis.contextSnapshot).toMatchObject({ profile: { age: 26, heightCm: 175 }, statistics: { bmi: 21.29, weightTrend: 'stable' } });
    expect(analysis.resultSnapshot).toMatchObject({ references: [{ knowledgeId: 7, title: '正确测量体重', source: '示例机构' }] });
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('does not persist an analysis when the model call fails', async () => {
    llm.generate.mockRejectedValue(new BadGatewayException('模型错误'));
    await expect(service.create(3, { symptoms: ['fatigue'], severity: 'mild', duration: 'today' })).rejects.toThrow('模型错误');
    expect(analyses.create).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });
});
