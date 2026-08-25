import type { CropAnalysisResult } from '../schemas/crop-analysis-result.schema';
export const STRUCTURED_LLM_PORT = Symbol('STRUCTURED_LLM_PORT');
export interface StructuredLlmPort {
  generate(
    prompt: string,
  ): Promise<{ result: CropAnalysisResult; provider: string; model: string }>;
}
