import { z } from 'zod';

export const healthAnalysisResultSchema = z.object({
  summary: z.string().min(1).max(2000),
  concerns: z.array(z.string().min(1).max(500)).max(10),
  factors: z.array(z.string().min(1).max(500)).max(10),
  suggestions: z.array(z.string().min(1).max(500)).max(10),
  medicalAdvice: z.string().min(1).max(1000),
  references: z.array(z.object({ knowledgeId: z.number().int().positive(), title: z.string().max(200), source: z.string().max(200) })).max(10),
});
export type HealthAnalysisResult = z.infer<typeof healthAnalysisResultSchema>;
