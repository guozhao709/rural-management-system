import { BadGatewayException, GatewayTimeoutException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { healthAnalysisResultSchema } from './health-analysis-result.schema';
import type { HealthLlmPort } from './health-llm.port';

@Injectable()
export class OpenAiCompatibleHealthLlmAdapter implements HealthLlmPort {
  constructor(private readonly config: ConfigService) {}
  async generate(prompt: string) {
    const apiKey = this.config.getOrThrow<string>('ai.apiKey'); const baseUrl = this.config.getOrThrow<string>('ai.baseUrl'); const model = this.config.getOrThrow<string>('ai.model');
    if (!apiKey || !baseUrl || !model) throw new ServiceUnavailableException('健康分析模型尚未配置');
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.config.getOrThrow<number>('agriculture.llmTimeoutMs'));
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: '你是健康生活建议助手。不得诊断疾病、给出处方药或剂量。仅输出符合 Schema 的 JSON。' }, { role: 'user', content: prompt }] }) });
      if (!response.ok) throw new BadGatewayException(`LLM 上游请求失败（HTTP ${response.status}）`);
      const body: unknown = await response.json(); const content = (body as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new BadGatewayException('LLM 返回内容为空');
      let decoded: unknown; try { decoded = JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); } catch { throw new BadGatewayException('LLM 返回格式不合法'); }
      const parsed = healthAnalysisResultSchema.safeParse(decoded); if (!parsed.success) throw new BadGatewayException('LLM 返回格式不合法'); return parsed.data;
    } catch (error) { if (error instanceof BadGatewayException || error instanceof ServiceUnavailableException) throw error; if (controller.signal.aborted) throw new GatewayTimeoutException('LLM 请求超时'); throw new BadGatewayException('LLM 网络请求失败'); } finally { clearTimeout(timeout); }
  }
}
