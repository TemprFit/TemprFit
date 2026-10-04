import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/workouts',
  version: '1.0.0',
  description: 'Workout template management and generation contracts for /api/v1/workouts/**',
};

export const setPlanSchema = z.object({
  targetReps: z.string().optional().default(''),
  targetWeight: z.number().optional().default(0),
  restSeconds: z.number().int().optional().default(60),
  tempo: z.string().optional().default(''),
}).passthrough();

export const workoutExerciseSchema = z.object({
  exercise: z.any(), // ObjectId string or populated exercise object
  order: z.number().int().optional().default(0),
  sets: z.array(setPlanSchema).optional().default([]),
  notes: z.string().optional().default(''),
  name: z.string().optional(),
  slug: z.string().optional(),
  targetMuscles: z.any().optional(),
  alternatives: z.array(z.any()).optional().default([]),
}).passthrough();

export const workoutTemplateSchema = z.object({
  _id: z.any(),
  id: z.string().optional(),
  user: z.any(),
  name: z.string(),
  goal: z.string().optional().default(''),
  exercises: z.array(workoutExerciseSchema).default([]),
  source: z.enum(['manual', 'generated']).default('manual'),
  isFavorite: z.boolean().optional().default(false),
  note: z.string().optional().default(''),
  generatorInputs: z.record(z.any()).nullable().optional(),
  lastCompletedAt: z.union([z.string(), z.date()]).nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const workoutListResponseSchema = z.object({
  items: z.array(workoutTemplateSchema),
}).passthrough();

export const workoutCreateRequestSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  goal: z.string().optional().default(''),
  exercises: z.array(z.object({
    exercise: z.string().min(1, 'Exercise ID is required'),
    order: z.number().int().optional().default(0),
    sets: z.array(z.object({
      targetReps: z.string().optional().default(''),
      targetWeight: z.number().optional().default(0),
      restSeconds: z.number().int().optional().default(60),
      tempo: z.string().optional().default(''),
    })).optional().default([]),
    notes: z.string().optional().default(''),
  })).min(1, 'Add at least one exercise'),
  note: z.string().optional().default(''),
}).strict();

export const workoutUpdateRequestSchema = workoutCreateRequestSchema.partial().strict();

export const workoutSingleResponseSchema = z.object({
  template: workoutTemplateSchema,
}).passthrough();

export const workoutGenerateRequestSchema = z.object({
  timeMinutes: z.coerce.number().min(10).max(180).default(45),
  equipment: z.array(z.string()).optional(),
  muscles: z.array(z.string()).optional(),
  goal: z.string().default('hypertrophy'),
  useAI: z.boolean().default(false),
  notes: z.string().optional().default(''),
  customEquipment: z.array(z.string()).optional(),
  equipmentImages: z.array(z.string()).optional(),
}).strict();

export const workoutGenerateResponseSchema = z.object({
  name: z.string(),
  goal: z.string(),
  generatorInputs: z.record(z.any()),
  generatedBy: z.enum(['rules', 'ai']),
  aiReasoning: z.string().nullable().optional(),
  aiFallbackReason: z.string().nullable().optional(),
  exercises: z.array(workoutExerciseSchema),
}).passthrough();
