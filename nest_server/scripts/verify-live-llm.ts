import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { OpenAiCompatibleStructuredLlmAdapter } from '../src/modules/agriculture/adapters/openai-compatible-structured-llm.adapter';

const config = new ConfigService({
  ai: { apiKey: process.env.LLM_API_KEY ?? '', baseUrl: process.env.LLM_BASE_URL ?? '', model: process.env.LLM_MODEL ?? '' },
  agriculture: { llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 30000), llmMaxRetries: 0 },
});

const prompt = `只返回一个 JSON 对象，不使用 Markdown、代码块或额外字段。请完全按此有效示例的字段和枚举格式回答；可修改中文文本和 score，但不要修改字段名或类型：
{"schemaVersion":"1.0","overview":"小麦基础管理建议。","suitability":{"level":"medium","score":50,"reasons":["缺少实时天气和土壤数据"]},"risks":[],"actions":[],"knowledgeReferences":[],"contextWarnings":["实时天气未接入"],"disclaimer":"仅供基础农业管理参考，请以当地农技指导为准。"}
场景：小麦基础管理验证。不得编造实时天气、市场价格或农药剂量。`;

const main = async (): Promise<void> => {
  const started = Date.now();
  const adapter = new OpenAiCompatibleStructuredLlmAdapter(config);
  const response = await adapter.generate(prompt);
  process.stdout.write(`Live LLM verification passed: provider=${response.provider}, model=${response.model}, durationMs=${Date.now() - started}, schemaVersion=${response.result.schemaVersion}\n`);
};
void main().catch((error: unknown) => {
  process.stderr.write(`Live LLM verification failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  process.exitCode = 1;
});
