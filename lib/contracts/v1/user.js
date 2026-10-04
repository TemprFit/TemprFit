import { z } from 'zod';
import { safeUserSchema } from './auth.js';

export const contractMetadata = {
  endpoint: '/api/v1/user',
  version: '1.0.0',
  description: 'User profile inspection, settings updates, first-login acknowledgment, and auth registrations',
};

export const userProfileResponseSchema = z.object({
  user: safeUserSchema,
}).passthrough();

export const userProfileUpdateRequestSchema = z.object({
  username: z.string().trim().regex(/^[a-z0-9_.]{3,24}$/, 'Username must be 3-24 characters (lowercase, numbers, underscores, periods)').optional(),
  goal: z.string().max(80).optional(),
  experience: z.string().max(40).optional(),
  weightUnit: z.enum(['lbs', 'kg']).optional(),
  avatarUrl: z.string().max(2 * 1024 * 1024, 'Avatar image is too large').optional(),
  goals: z.object({
    weeklySessions: z.number().int().min(1).max(14).optional(),
    targetExerciseSlug: z.string().optional(),
    targetWeight: z.number().nullable().optional(),
    targetBodyFatPercent: z.number().nullable().optional(),
  }).optional(),
  trainerInfo: z.object({
    bio: z.string().max(1000).optional(),
    specialties: z.array(z.string()).optional(),
    hourlyRate: z.number().positive().optional(),
  }).optional(),
}).strict();

export const firstLoginResponseSchema = z.object({
  ok: z.boolean(),
}).passthrough();

export const registerRequestSchema = z.object({
  username: z.string().trim().regex(/^[a-z0-9_.]{3,24}$/, 'Username must be 3-24 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  goal: z.string().optional().default(''),
  experience: z.string().optional().default(''),
  age: z.coerce.number().int().min(13).max(120).optional(),
  sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  heardAboutUs: z.string().max(60).optional().default(''),
  weightUnit: z.enum(['kg', 'lbs']).optional().default('lbs'),
  startingWeight: z.coerce.number().positive().max(2000).optional(),
  heightCm: z.coerce.number().positive().max(300).optional(),
}).strict();

export const registerResponseSchema = z.object({
  user: safeUserSchema,
  token: z.string(),
  requiresVerification: z.boolean().default(false),
  message: z.string().optional(),
}).passthrough();

export const googleAuthRequestSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
}).strict();

export const googleAuthResponseSchema = z.object({
  user: safeUserSchema,
  token: z.string(),
}).passthrough();
