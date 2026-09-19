export const AGRICULTURE_V2_LLM_PORT = Symbol('AGRICULTURE_V2_LLM_PORT');

export interface AgricultureV2LlmPort {
  generate(prompt: string): Promise<{ output: unknown; provider: string; model: string }>;
}
