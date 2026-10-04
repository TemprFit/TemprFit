import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/sessions',
  version: '1.0.0',
  description: 'Workout session tracking and live logging contracts for /api/v1/sessions/**',
};

export const loggedSetSchema = z.object({
  setNumber: z.number().int(),
  targetReps: z.string().optional().default(''),
  reps: z.number().nullable().optional().default(null),
  weight: z.number().optional().default(0),
  restSeconds: z.number().int().optional().default(60),
  completed: z.boolean().optional().default(false),
  isPR: z.boolean().optional().default(false),
  restSecondsActual: z.number().nullable().optional().default(null),
  notes: z.string().optional().default(''),
}).passthrough();

export const sessionExerciseSchema = z.object({
  exercise: z.any(), // ObjectId string or populated exercise object
  order: z.number().int().optional().default(0),
  sets: z.array(loggedSetSchema).optional().default([]),
  replaced: z.boolean().optional().default(false),
  skipped: z.boolean().optional().default(false),
  notes: z.string().optional().default(''),
}).passthrough();

export const workoutSessionSchema = z.object({
  _id: z.any(),
  id: z.string().optional(),
  user: z.any(),
  template: z.any().nullable().optional(),
  name: z.string().optional().default('Workout'),
  status: z.enum(['in-progress', 'completed', 'abandoned']).default('in-progress'),
  exercises: z.array(sessionExerciseSchema).default([]),
  startedAt: z.union([z.string(), z.date()]),
  completedAt: z.union([z.string(), z.date()]).nullable().optional(),
  durationSeconds: z.number().int().default(0),
  totalVolume: z.number().default(0),
  prCount: z.number().int().default(0),
  notes: z.string().optional().default(''),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const sessionStartRequestSchema = z.object({
  templateId: z.string().optional(),
  name: z.string().optional(),
  exercises: z.array(z.object({
    exercise: z.string().min(1, 'Exercise ID is required'),
    order: z.number().int().optional().default(0),
    sets: z.array(z.object({
      setNumber: z.number().int().default(1),
      targetReps: z.string().optional().default(''),
      reps: z.number().nullable().optional(),
      weight: z.number().optional().default(0),
      restSeconds: z.number().int().optional().default(60),
      completed: z.boolean().optional().default(false),
      notes: z.string().optional().default(''),
    })).optional().default([]),
    notes: z.string().optional().default(''),
  })).optional(),
}).strict();

export const sessionPatchRequestSchema = z.object({
  exercises: z.array(z.object({
    exercise: z.any(),
    order: z.number().int().optional().default(0),
    sets: z.array(z.object({
      setNumber: z.number().int(),
      targetReps: z.string().optional().default(''),
      reps: z.number().nullable().optional(),
      weight: z.number().optional().default(0),
      restSeconds: z.number().int().optional().default(60),
      completed: z.boolean().optional().default(false),
      isPR: z.boolean().optional().default(false),
      restSecondsActual: z.number().nullable().optional(),
      notes: z.string().optional().default(''),
    })).optional().default([]),
    replaced: z.boolean().optional().default(false),
    skipped: z.boolean().optional().default(false),
    notes: z.string().optional().default(''),
  })).optional(),
  notes: z.string().optional(),
}).strict();

export const sessionCompleteRequestSchema = z.object({
  exercises: z.array(z.any()).optional(),
  notes: z.string().optional(),
}).strict();

export const sessionListResponseSchema = z.object({
  sessions: z.array(workoutSessionSchema),
}).passthrough();

export const sessionSingleResponseSchema = z.object({
  session: workoutSessionSchema,
}).passthrough();
