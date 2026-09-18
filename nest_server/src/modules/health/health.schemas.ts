import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

const nullableString = (max: number) => z.string().trim().max(max).nullable().optional();
const isoDate = z.string().date();
const isoDateTime = z.string().datetime({ offset: true });
const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(20);

export const profileSchema = z
  .object({
    sex: nullableString(20), birthDate: isoDate.nullable().optional(), heightCm: z.coerce.number().positive().max(300).nullable().optional(),
    smokingStatus: nullableString(20), drinkingStatus: nullableString(20), exerciseStatus: nullableString(20), sleepStatus: nullableString(20),
    healthHistory: nullableString(5000), allergies: nullableString(5000),
  })
  .strict();

const measuredAt = isoDateTime;
export const metricSchema = z.discriminatedUnion('metricType', [
  z.object({ metricType: z.literal('weight'), value: z.coerce.number().positive().max(1000), measuredAt }).strict(),
  z.object({ metricType: z.literal('temperature'), value: z.coerce.number().min(20).max(60), measuredAt }).strict(),
  z.object({ metricType: z.literal('heart_rate'), value: z.coerce.number().positive().max(500), measuredAt }).strict(),
  z.object({ metricType: z.literal('blood_pressure'), systolic: z.coerce.number().positive().max(400), diastolic: z.coerce.number().positive().max(300), measuredAt }).strict().refine((v) => v.systolic >= v.diastolic, '收缩压不得低于舒张压'),
  z.object({ metricType: z.literal('custom'), templateId: z.coerce.number().int().positive(), value: z.coerce.number().finite(), measuredAt }).strict(),
]);
export const templateSchema = z.object({
  name: z.string().trim().min(1).max(100), metricName: z.string().trim().min(1).max(100), unit: z.string().trim().min(1).max(30),
  relatedSystemMetricType: z.enum(['weight', 'blood_pressure', 'heart_rate', 'temperature']).nullable().optional(), startedAt: isoDateTime,
}).strict();
export const templatePatchSchema = z.object({ name: z.string().trim().min(1).max(100).optional(), endedAt: isoDateTime.nullable().optional() }).strict().refine((v) => Object.keys(v).length > 0, '至少提供一个可更新字段');
export const metricsQuerySchema = z.object({ metricType: z.enum(['weight', 'blood_pressure', 'heart_rate', 'temperature', 'custom']).optional(), templateId: z.coerce.number().int().positive().optional(), from: isoDateTime.optional(), to: isoDateTime.optional(), page, pageSize }).strict();
export const templatesQuerySchema = z.object({ active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(), page, pageSize }).strict();
export const knowledgeQuerySchema = z.object({ q: z.string().trim().max(100).optional(), category: z.string().trim().max(50).optional(), page, pageSize }).strict();
export const analysisInputSchema = z.object({ symptoms: z.array(z.string().trim().min(1).max(50)).min(1).max(20), severity: z.enum(['mild', 'moderate', 'severe']), duration: z.enum(['today', '1_3_days', '4_7_days', 'over_a_week', 'recurring']), description: z.string().trim().max(2000).optional() }).strict();
export const analysesQuerySchema = z.object({ page, pageSize }).strict();

export const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException(result.error.issues.map((issue) => issue.message).join('; '));
  return result.data;
};

export type ProfileInput = z.infer<typeof profileSchema>;
export type MetricInput = z.infer<typeof metricSchema>;
export type MetricsQuery = z.infer<typeof metricsQuerySchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type TemplatePatchInput = z.infer<typeof templatePatchSchema>;
export type TemplatesQuery = z.infer<typeof templatesQuerySchema>;
export type KnowledgeQuery = z.infer<typeof knowledgeQuerySchema>;
export type AnalysisInput = z.infer<typeof analysisInputSchema>;
export type AnalysesQuery = z.infer<typeof analysesQuerySchema>;
