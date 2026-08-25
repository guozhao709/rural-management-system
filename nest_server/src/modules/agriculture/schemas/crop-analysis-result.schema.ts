import { z } from 'zod';
export const cropAnalysisResultSchema = z.object({
  schemaVersion: z.literal('1.0'),
  overview: z.string().max(2000),
  suitability: z.object({
    level: z.enum(['low', 'medium', 'high']),
    score: z.number().min(0).max(100),
    reasons: z.array(z.string().max(500)).max(10),
  }),
  risks: z
    .array(
      z.object({
        type: z.enum(['weather', 'pest', 'disease', 'soil', 'water', 'other']),
        level: z.enum(['low', 'medium', 'high']),
        description: z.string().max(1000),
        evidence: z.array(z.string().max(500)).max(10),
      }),
    )
    .max(10),
  actions: z
    .array(
      z.object({
        priority: z.enum(['low', 'medium', 'high']),
        action: z.string().max(1000),
        timing: z.string().max(500),
        rationale: z.string().max(1000),
      }),
    )
    .max(10),
  knowledgeReferences: z
    .array(
      z.object({
        knowledgeId: z.number().int().positive(),
        version: z.number().int().positive(),
        title: z.string().max(255),
      }),
    )
    .max(20),
  contextWarnings: z.array(z.string().max(500)).max(10),
  disclaimer: z.string().max(1000),
});
export type CropAnalysisResult = z.infer<typeof cropAnalysisResultSchema>;
