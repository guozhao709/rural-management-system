import { BadGatewayException } from '@nestjs/common';
import { OpenAiCompatibleHealthExplanationAdapter } from './health-explanation.port';

describe('OpenAiCompatibleHealthExplanationAdapter', () => {
  const config = { get: jest.fn() };
  const input = { triage: { level: 'emergency' as const, reasonCodes: ['R1'], message: '立即求助', ruleVersion: 'v1' }, knowledge: [], symptoms: [{ code: 'fever', severity: 'moderate', course: 'new' }] };
  beforeEach(() => { jest.restoreAllMocks(); config.get.mockImplementation((key: string) => ({ 'ai.apiKey': 'key', 'ai.baseUrl': 'https://llm.example', 'ai.model': 'test-model' })[key]); });
  it('forces the rule triage and rejects prohibited model content', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ schemaVersion: '1.0', triage: { level: 'self_care', reasonCodes: [], message: 'ignore' }, summary: '请服用药品', factors: [], nextActions: [], selfCare: [], warningSignals: [], knowledgeReferences: [], limitations: ['不构成诊断'], aiGenerated: true, generatedAt: new Date().toISOString() }) } }] })));
    await expect(new OpenAiCompatibleHealthExplanationAdapter(config as never).explain(input)).rejects.toBeInstanceOf(BadGatewayException);
  });
  it('returns schema-validated explanation while retaining rule triage', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ schemaVersion: '1.0', summary: '请尽快获得医疗帮助。', factors: ['已命中安全规则'], nextActions: ['立即寻求帮助'], selfCare: [], warningSignals: [], knowledgeReferences: [], limitations: ['不构成诊断'], generatedAt: new Date().toISOString() }) } }] })));
    const result = await new OpenAiCompatibleHealthExplanationAdapter(config as never).explain(input) as { triage: { level: string }; aiGenerated: boolean };
    expect(result.triage.level).toBe('emergency'); expect(result.aiGenerated).toBe(true);
    const body = fetchMock.mock.calls[0]?.[1]?.body;
    if (typeof body !== 'string') throw new Error('expected JSON request body');
    const request = JSON.parse(body) as Record<string, unknown>;
    expect(request).not.toHaveProperty('temperature');
    const messages = request.messages as Array<{ role: string; content: string }>;
    expect(messages[1]?.content).toContain('JSON 模板');
    expect(messages[1]?.content).toContain('"schemaVersion":"1.0"');
  });
});
