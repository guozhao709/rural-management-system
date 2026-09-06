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
  getOrThrow: jest.fn(),
};

describe('OpenAiCompatibleStructuredLlmAdapter', () => {
  beforeEach(() => {
    config.getOrThrow.mockImplementation(
      (key: string) =>
        ({
          'ai.apiKey': 'key',
          'ai.baseUrl': 'https://example.test/v1',
          'ai.model': 'test-model',
          'agriculture.llmMaxRetries': 0,
          'agriculture.llmTimeoutMs': 1000,
        })[key],
    );
  });
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
  it('requests Kimi JSON mode with enough completion tokens for the analysis schema', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }), {
        status: 200,
      }),
    );

    await new OpenAiCompatibleStructuredLlmAdapter(config as never).generate('prompt');

    const request = fetchMock.mock.calls[0]?.[1];
    const body = request?.body;
    if (typeof body !== 'string') throw new Error('expected a JSON request body');
    const payload = JSON.parse(body) as Record<string, unknown>;
    expect(payload).toMatchObject({
      response_format: { type: 'json_object' },
      max_completion_tokens: 4096,
    });
    expect(payload).not.toHaveProperty('temperature');
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
  it('retries a rate-limited request after the upstream retry delay', async () => {
    config.getOrThrow.mockImplementation(
      (key: string) =>
        ({
          'ai.apiKey': 'key',
          'ai.baseUrl': 'https://example.test/v1',
          'ai.model': 'test-model',
          'agriculture.llmMaxRetries': 0,
          'agriculture.llmTimeoutMs': 1000,
        })[key],
    );
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'concurrency limit reached' } }), {
          status: 429,
          headers: { 'Retry-After': '0' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }), {
          status: 200,
        }),
      );

    await expect(
      new OpenAiCompatibleStructuredLlmAdapter(config as never).generate('prompt'),
    ).resolves.toMatchObject({ result });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  it('does not expose rate-limit details after the retry budget is exhausted', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'sensitive provider detail' } }), {
        status: 429,
      }),
    );

    try {
      await new OpenAiCompatibleStructuredLlmAdapter(config as never).generate('prompt');
      throw new Error('expected the rate-limited request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadGatewayException);
      expect((error as Error).message).toBe('LLM 上游暂时繁忙，请稍后重试');
      expect((error as Error).message).not.toContain('sensitive provider detail');
    }
  });
  it('does not call the network without complete LLM config', async () => {
    config.getOrThrow.mockImplementation((key: string) => (key === 'ai.apiKey' ? '' : 'x'));
    await expect(
      new OpenAiCompatibleStructuredLlmAdapter(config as never).generate('prompt'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
