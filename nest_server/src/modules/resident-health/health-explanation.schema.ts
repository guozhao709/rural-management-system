import { z } from 'zod';
import { TRIAGE_LEVELS } from './resident-health.types';

const textList = z.array(z.string().trim().min(1).max(500)).max(10);
export const healthExplanationSchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    triage: z.object({
      level: z.enum(TRIAGE_LEVELS),
      reasonCodes: z.array(z.string().max(100)).max(10),
      message: z.string().min(1).max(500),
    }),
    summary: z.string().min(1).max(1000),
    factors: textList,
    nextActions: textList,
    selfCare: textList,
    warningSignals: textList,
    knowledgeReferences: z
      .array(
        z.object({
          knowledgeId: z.number().int().positive(),
          version: z.number().int().positive(),
          title: z.string().min(1).max(300),
          sourceName: z.string().min(1).max(300),
        }),
      )
      .max(6),
    limitations: textList.min(1),
    aiGenerated: z.boolean(),
    generatedAt: z.coerce.date(),
  })
  .strict();

const prohibited = /(?:概率|可能患|诊断为|处方|服用|药品|剂量|mg\b)/iu;
export const parseSafeHealthExplanation = (value: unknown) => {
  const parsed = healthExplanationSchema.safeParse(value);
  if (!parsed.success) return null;
  const content = [
    parsed.data.summary,
    ...parsed.data.factors,
    ...parsed.data.nextActions,
    ...parsed.data.selfCare,
    ...parsed.data.warningSignals,
  ].join('\n');
  return prohibited.test(content) ? null : parsed.data;
};
