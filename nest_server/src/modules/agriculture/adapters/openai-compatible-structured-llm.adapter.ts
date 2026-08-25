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

@Injectable()
export class OpenAiCompatibleStructuredLlmAdapter implements StructuredLlmPort {
  constructor(private readonly config: ConfigService) {}

  async generate(prompt: string): ReturnType<StructuredLlmPort['generate']> {
    const apiKey = this.config.getOrThrow<string>('ai.apiKey');
    const baseUrl = this.config.getOrThrow<string>('ai.baseUrl');
    const model = this.config.getOrThrow<string>('ai.model');
    if (!apiKey || !baseUrl || !model) throw new ServiceUnavailableException('LLM 未配置');

    const retries = this.config.getOrThrow<number>('agriculture.llmMaxRetries');
    for (let attempt = 0; attempt <= retries; attempt += 1) {
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
        if (
          error instanceof BadGatewayException ||
          error instanceof ServiceUnavailableException ||
          attempt === retries
        )
          throw error;
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
          temperature: 1,
          messages: [
            { role: 'system', content: '你是农业分析助手。仅输出符合请求 Schema 的 JSON。' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => undefined);
        const error = (
          errorBody as { error?: { type?: unknown; code?: unknown; message?: unknown } }
        )?.error;
        const detail = [
          error?.type,
          error?.code,
          typeof error?.message === 'string' ? error.message.slice(0, 160) : undefined,
        ]
          .filter(Boolean)
          .join(': ');
        throw new BadGatewayException(
          `LLM 上游请求失败（HTTP ${response.status}${detail ? `，${detail}` : ''}）`,
        );
      }
      const body: unknown = await response.json();
      const content = (body as { choices?: Array<{ message?: { content?: unknown } }> })
        .choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new BadGatewayException('LLM 返回内容为空');
      return content;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      if (controller.signal.aborted) throw new GatewayTimeoutException('LLM 请求超时');
      throw new BadGatewayException('LLM 网络请求失败');
    } finally {
      clearTimeout(timeout);
    }
  }
}
