import type { HealthAnalysisResult } from './health-analysis-result.schema';
export const HEALTH_LLM_PORT = Symbol('HEALTH_LLM_PORT');
export interface HealthLlmPort { generate(prompt: string): Promise<HealthAnalysisResult>; }
