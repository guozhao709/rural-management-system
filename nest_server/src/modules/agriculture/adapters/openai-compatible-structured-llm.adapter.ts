import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cropAnalysisResultSchema } from '../schemas/crop-analysis-result.schema';
import type { StructuredLlmPort } from '../ports/structured-llm.port';

const stripCodeFence = (value: string): string =>
  value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

class LlmRateLimitError extends Error {
  constructor(readonly retryAfterMs: number) {
    super('LLM 上游暂时繁忙');
  }
}

const retryAfterMs = (header: string | null): number => {
  const seconds = Number(header);
  if (!Number.isFinite(seconds)) return 1_000;
  return Math.min(Math.max(Math.round(seconds * 1_000), 0), 5_000);
};

@Injectable()
export class OpenAiCompatibleStructuredLlmAdapter implements StructuredLlmPort {
  constructor(private readonly config: ConfigService) {}

  async generate(prompt: string): ReturnType<StructuredLlmPort['generate']> {
    const apiKey = this.config.getOrThrow<string>('ai.apiKey');
    const baseUrl = this.config.getOrThrow<string>('ai.baseUrl');
    const model = this.config.getOrThrow<string>('ai.model');
    if (!apiKey || !baseUrl || !model) throw new ServiceUnavailableException('LLM 未配置');

    const retries = this.config.getOrThrow<number>('agriculture.llmMaxRetries');
    let attempt = 0;
    let rateLimitRetried = false;
    while (attempt <= retries) {
      try {
        const content = await this.request(
          `${baseUrl.replace(/\/$/, '')}/chat/completions`,
          apiKey,
          model,
          prompt,
        );
        let decoded: unknown;
        try {
          decoded = JSON.parse(stripCodeFence(content));
        } catch {
          throw new BadGatewayException('LLM 返回格式不合法');
        }
        const parsed = cropAnalysisResultSchema.safeParse(decoded);
        if (!parsed.success) throw new BadGatewayException('LLM 返回格式不合法');
        return { result: parsed.data, provider: 'openai-compatible', model };
      } catch (error) {
        if (error instanceof LlmRateLimitError) {
          if (rateLimitRetried)
            throw new BadGatewayException('LLM 上游暂时繁忙，请稍后重试');
          rateLimitRetried = true;
          await new Promise<void>((resolve) => setTimeout(resolve, error.retryAfterMs));
          continue;
        }
        if (
          error instanceof BadGatewayException ||
          error instanceof ServiceUnavailableException ||
          attempt === retries
        )
          throw error;
        attempt += 1;
      }
    }
    throw new BadGatewayException('LLM 请求失败');
  }

  private async request(
    url: string,
    apiKey: string,
    model: string,
    prompt: string,
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.getOrThrow<number>('agriculture.llmTimeoutMs'),
    );
    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          max_completion_tokens: 4096,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: '你是农业分析助手。仅输出符合请求 Schema 的 JSON。' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!response.ok) {
        if (response.status === 429)
          throw new LlmRateLimitError(retryAfterMs(response.headers.get('Retry-After')));
        throw new BadGatewayException(`LLM 上游请求失败（HTTP ${response.status}）`);
      }
      const body: unknown = await response.json();
      const content = (body as { choices?: Array<{ message?: { content?: unknown } }> })
        .choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new BadGatewayException('LLM 返回内容为空');
      return content;
    } catch (error) {
      if (error instanceof LlmRateLimitError) throw error;
      if (error instanceof BadGatewayException) throw error;
      if (controller.signal.aborted) throw new GatewayTimeoutException('LLM 请求超时');
      throw new BadGatewayException('LLM 网络请求失败');
    } finally {
      clearTimeout(timeout);
    }
  }
}
