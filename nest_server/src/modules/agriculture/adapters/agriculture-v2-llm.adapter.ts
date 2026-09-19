import { BadGatewayException, GatewayTimeoutException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AgricultureV2LlmPort } from '../ports/agriculture-v2-llm.port';

const stripCodeFence = (value: string): string => value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

@Injectable()
export class AgricultureV2LlmAdapter implements AgricultureV2LlmPort {
  constructor(private readonly config: ConfigService) {}

  async generate(prompt: string): Promise<{ output: unknown; provider: string; model: string }> {
    const apiKey = this.config.get<string>('ai.apiKey');
    const baseUrl = this.config.get<string>('ai.baseUrl');
    const model = this.config.get<string>('ai.model');
    if (!apiKey || !baseUrl || !model) throw new ServiceUnavailableException('AI_MODEL_REQUEST_FAILED');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.get<number>('agriculture.llmTimeoutMs') ?? 20_000);
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: '只输出符合用户请求 Schema 的 JSON。' }, { role: 'user', content: prompt }] }),
      });
      if (!response.ok) throw new BadGatewayException('AI_MODEL_REQUEST_FAILED');
      const body = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
      const content = body.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new BadGatewayException('AI_OUTPUT_INVALID');
      try { return { output: JSON.parse(stripCodeFence(content)), provider: 'openai-compatible', model }; }
      catch { throw new BadGatewayException('AI_OUTPUT_INVALID'); }
    } catch (error) {
      if (error instanceof BadGatewayException || error instanceof ServiceUnavailableException) throw error;
      if (controller.signal.aborted) throw new GatewayTimeoutException('AI_REQUEST_TIMEOUT');
      throw new BadGatewayException('AI_MODEL_REQUEST_FAILED');
    } finally { clearTimeout(timeout); }
  }
}
