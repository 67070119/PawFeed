import { z } from 'zod';
import { AppError } from './app-error.js';

export const animalTypeSchema = z.enum(['DOG', 'CAT', 'OTHER']);
export const reportTypeSchema = z.enum(['STILL_HERE', 'NOT_FOUND']);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const createPointSchema = z.object({
  animalType: animalTypeSchema,
  estimatedCount: z.coerce.number().int().min(1).max(1000),
  description: z.string().trim().min(1).max(2000),
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  usualTime: z.string().trim().max(100).optional().transform((v) => v || null),
});

export const updatePointSchema = z.object({
  estimatedCount: z.coerce.number().int().min(1).max(1000).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  usualTime: z.string().trim().max(100).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'ต้องระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 field' });

export const feedingSchema = z.object({
  note: z.string().trim().max(1000).optional().transform((v) => v || null),
});

export const reportSchema = z.object({ type: reportTypeSchema });

export const boundingBoxSchema = z.object({
  minLat: z.coerce.number().finite().min(-90).max(90),
  maxLat: z.coerce.number().finite().min(-90).max(90),
  minLng: z.coerce.number().finite().min(-180).max(180),
  maxLng: z.coerce.number().finite().min(-180).max(180),
}).refine((v) => v.minLat <= v.maxLat, { path: ['minLat'], message: 'minLat ต้องไม่มากกว่า maxLat' })
  .refine((v) => v.minLng <= v.maxLng, { path: ['minLng'], message: 'minLng ต้องไม่มากกว่า maxLng' });

export function parse(schema, input, message = 'ข้อมูลไม่ถูกต้อง') {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', message, result.error.flatten());
  }
  return result.data;
}
