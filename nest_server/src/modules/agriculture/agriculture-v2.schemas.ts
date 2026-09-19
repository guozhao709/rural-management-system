import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().min(1).max(max).nullable().optional();
const nullableText = (max: number) => z.string().trim().min(1).max(max).nullable();
const page = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(20) });

export const landSchema = z.object({
  name: z.string().trim().min(1).max(100),
  region: z.object({ province: z.string().trim().min(1).max(50), city: z.string().trim().min(1).max(50), district: z.string().trim().min(1).max(50) }),
  plantingEnvironment: z.enum(['open_field', 'greenhouse', 'home_garden', 'balcony_or_yard', 'other']),
  area: z.object({ value: z.number().positive().max(9999999999.99), unit: z.string().trim().min(1).max(16) }).nullable().optional(),
  soil: optionalText(100), irrigation: optionalText(32), drainage: optionalText(32), description: optionalText(5000),
});
export const landPatchSchema = landSchema.partial().refine((value) => Object.keys(value).length > 0, '至少提供一个可修改字段');
export const cropsQuerySchema = page.extend({ keyword: z.string().trim().min(1).max(100).optional() });
export const knowledgeQuerySchema = page.extend({ keyword: z.string().trim().min(1).max(100).optional(), cropId: z.coerce.number().int().positive().optional(), category: z.string().trim().min(1).max(50).optional() });
export const plantingTimeSchema = z.discriminatedUnion('type', [z.object({ type: z.literal('date'), date: z.string().date() }), z.object({ type: z.literal('text'), text: z.string().trim().min(1).max(100) })]).nullable();
export const plantingSchema = z.object({ cropId: z.number().int().positive(), variety: nullableText(100).optional(), plantingTime: plantingTimeSchema.optional().default(null), growthStage: nullableText(100).optional(), status: z.enum(['planned', 'growing']).default('planned'), description: nullableText(5000).optional() });
export const plantingPatchSchema = z.object({ variety: nullableText(100).optional(), plantingTime: plantingTimeSchema.optional(), growthStage: nullableText(100).optional(), status: z.enum(['planned', 'growing', 'harvested', 'ended']).optional(), description: nullableText(5000).optional() }).refine((value) => Object.keys(value).length > 0, '至少提供一个可修改字段');
export const plantingsQuerySchema = page.extend({ landId: z.string().uuid().optional(), cropId: z.coerce.number().int().positive().optional(), status: z.enum(['planned', 'growing', 'harvested', 'ended']).optional() });
export const metricSchema = z.object({ name: z.string().trim().min(1).max(100), unit: z.string().trim().min(1).max(32) });
export const recordSchema = z.object({ value: z.number().finite(), recordedAt: z.string().datetime({ offset: true }), note: nullableText(5000).optional() });
export const recordsQuerySchema = page.extend({ from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional() }).refine((value) => !value.from || !value.to || value.from <= value.to, 'from 不得晚于 to');
export const trendQuerySchema = z.object({ from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional(), limit: z.coerce.number().int().min(1).max(100).default(30) }).refine((value) => !value.from || !value.to || value.from <= value.to, 'from 不得晚于 to');
export const evaluationInputSchema = z.object({ crop: z.discriminatedUnion('type', [z.object({ type: z.literal('catalog'), cropId: z.number().int().positive(), variety: nullableText(100).optional() }), z.object({ type: z.literal('manual'), name: z.string().trim().min(1).max(100), variety: nullableText(100).optional() })]), plannedPlantingTime: nullableText(100).optional() });
export const growthAnalysisInputSchema = z.object({ observations: z.array(z.string().trim().min(1).max(500)).max(20).default([]), description: nullableText(5000).optional() }).refine((value) => value.observations.length > 0 || Boolean(value.description), 'observations 与 description 至少提供一个');
export const analysisPageSchema = page;

const referenceSchema = z.object({ knowledgeId: z.number().int().positive() }).strict();
export const plantingEvaluationResultSchema = z.object({ summary: z.string().trim().min(1).max(2000), suitability: z.enum(['suitable', 'suitable_with_conditions', 'limited', 'not_recommended']), advantages: z.array(z.string().trim().min(1).max(1000)).max(20), limitations: z.array(z.string().trim().min(1).max(1000)).max(20), plantingSuggestions: z.array(z.string().trim().min(1).max(1000)).max(20), preparations: z.array(z.string().trim().min(1).max(1000)).max(20), attentionPoints: z.array(z.string().trim().min(1).max(1000)).max(20), references: z.array(referenceSchema).max(20) }).strict();
export const growthAnalysisResultSchema = z.object({ summary: z.string().trim().min(1).max(2000), growthStatus: z.enum(['normal', 'needs_attention', 'abnormal']), currentSituation: z.array(z.string().trim().min(1).max(1000)).max(20), concerns: z.array(z.string().trim().min(1).max(1000)).max(20), possibleFactors: z.array(z.string().trim().min(1).max(1000)).max(20), managementSuggestions: z.array(z.string().trim().min(1).max(1000)).max(20), followUp: z.array(z.string().trim().min(1).max(1000)).max(20), references: z.array(referenceSchema).max(20) }).strict();

export type LandInput = z.infer<typeof landSchema>;
export type LandPatch = z.infer<typeof landPatchSchema>;
export type PlantingInput = z.infer<typeof plantingSchema>;
export type PlantingPatch = z.infer<typeof plantingPatchSchema>;
export type EvaluationInput = z.infer<typeof evaluationInputSchema>;
export type GrowthAnalysisInput = z.infer<typeof growthAnalysisInputSchema>;
export type PlantingEvaluationResult = z.infer<typeof plantingEvaluationResultSchema>;
export type GrowthAnalysisResult = z.infer<typeof growthAnalysisResultSchema>;
export const parse = <T>(schema: z.ZodType<T>, value: unknown): T => { const result = schema.safeParse(value); if (!result.success) throw new BadRequestException('请求参数不符合要求'); return result.data; };
