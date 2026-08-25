import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { OpenAiCompatibleStructuredLlmAdapter } from './openai-compatible-structured-llm.adapter';

const result = {
  schemaVersion: '1.0',
  overview: '适宜种植',
  suitability: { level: 'high', score: 80, reasons: ['条件适宜'] },
  risks: [],
  actions: [],
  knowledgeReferences: [],
  contextWarnings: ['实时天气未接入'],
  disclaimer: '仅供参考',
};
const config = {
  getOrThrow: jest.fn(
    (key: string) =>
      ({
        'ai.apiKey': 'key',
        'ai.baseUrl': 'https://example.test/v1',
        'ai.model': 'test-model',
        'agriculture.llmMaxRetries': 0,
        'agriculture.llmTimeoutMs': 1000,
      })[key],
  ),
};

describe('OpenAiCompatibleStructuredLlmAdapter', () => {
  afterEach(() => jest.restoreAllMocks());
  it('parses a fenced valid JSON response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(result)}\n\`\`\`` } }],
        }),
        { status: 200 },
      ),
    );
    await expect(
      new OpenAiCompatibleStructuredLlmAdapter(config as never).generate('prompt'),
    ).resolves.toMatchObject({ result, provider: 'openai-compatible', model: 'test-model' });
  });
  it('rejects malformed output', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), {
        status: 200,
      }),
    );
    await expect(
      new OpenAiCompatibleStructuredLlmAdapter(config as never).generate('prompt'),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
  it('does not call the network without complete LLM config', async () => {
    config.getOrThrow.mockImplementation((key: string) => (key === 'ai.apiKey' ? '' : 'x'));
    await expect(
      new OpenAiCompatibleStructuredLlmAdapter(config as never).generate('prompt'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
