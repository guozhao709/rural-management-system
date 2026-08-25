import { z } from 'zod';

const measuredAt = z.coerce
  .date()
  .refine((value) => value <= new Date(), 'measuredAt cannot be in the future');
const source = z.enum(['self_reported', 'manual_device', 'connected_device']);
const base = { measuredAt, source };

export const healthMeasurementSchema = z.discriminatedUnion('type', [
  z.object({
    ...base,
    type: z.literal('blood_pressure'),
    systolic: z.number().finite().min(40).max(300),
    diastolic: z.number().finite().min(20).max(200),
    unit: z.literal('mmHg'),
  }),
  z.object({
    ...base,
    type: z.literal('body_temperature'),
    value: z.number().finite().min(30).max(45),
    unit: z.literal('celsius'),
  }),
  z.object({
    ...base,
    type: z.literal('heart_rate'),
    value: z.number().int().min(20).max(300),
    unit: z.literal('bpm'),
  }),
  z.object({
    ...base,
    type: z.literal('body_weight'),
    value: z.number().finite().min(1).max(500),
    unit: z.literal('kg'),
  }),
  z.object({
    ...base,
    type: z.literal('body_height'),
    value: z.number().finite().min(30).max(300),
    unit: z.literal('cm'),
  }),
]);

export type HealthMeasurementInput = z.infer<typeof healthMeasurementSchema>;
