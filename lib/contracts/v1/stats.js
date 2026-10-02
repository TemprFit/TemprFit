import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/stats',
  version: '1.0.0',
  description: 'Dashboard statistics, 12-week progress charts, and weight logging contracts',
};

export const weeklyVolumeItemSchema = z.object({
  value: z.number(),
}).passthrough();

export const strengthTrendItemSchema = z.object({
  value: z.number(),
}).passthrough();

export const activityHeatmapItemSchema = z.object({
  date: z.string(),
  count: z.number().int(),
  exercises: z.array(z.string()),
  meals: z.number().int().optional().default(0),
}).passthrough();

export const recentPRItemSchema = z.object({
  exerciseName: z.string(),
  exerciseSlug: z.string().optional(),
  weight: z.number(),
  reps: z.number(),
  estOneRepMax: z.number(),
  achievedAt: z.union([z.string(), z.date()]),
}).passthrough();

export const statsResponseSchema = z.object({
  totalSessions: z.number().int(),
  sessionsThisWeek: z.number().int(),
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
  totalCheckInStreak: z.number().int().optional(),
  longestCheckInStreak: z.number().int().optional(),
  workoutSecondsThisWeek: z.number().int(),
  workoutSecondsAllTime: z.number().int(),
  caloriesThisWeek: z.number(),
  caloriesEstimateNote: z.string().optional(),
  weeklyVolume: z.array(weeklyVolumeItemSchema),
  strengthTrend: z.array(strengthTrendItemSchema),
  targetExercise: z.object({
    name: z.string(),
    slug: z.string(),
  }).nullable().optional(),
  currentBest1RM: z.number().nullable().optional(),
  goals: z.record(z.any()).optional(),
  activityHeatmap: z.array(activityHeatmapItemSchema),
  recentPRs: z.array(recentPRItemSchema),
}).passthrough();

export const chartPointSchema = z.object({
  label: z.string(),
  value: z.number(),
}).passthrough();

export const progressResponseSchema = z.object({
  volumeByWeek: z.array(chartPointSchema),
  sessionsByWeek: z.array(chartPointSchema),
  exerciseOptions: z.array(z.object({
    slug: z.string(),
    name: z.string(),
  })),
  strengthTrend: z.array(z.object({
    achievedAt: z.union([z.string(), z.date()]),
    estOneRepMax: z.number(),
    weight: z.number(),
    reps: z.number(),
  })).optional(),
  currentBest1RM: z.number().nullable().optional(),
  selectedExerciseName: z.string().nullable().optional(),
}).passthrough();

export const weightEntrySchema = z.object({
  _id: z.any(),
  id: z.string().optional(),
  user: z.any(),
  date: z.union([z.string(), z.date()]),
  weight: z.number(),
  unit: z.enum(['kg', 'lbs']),
  bodyFatPercent: z.number().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const weightListResponseSchema = z.object({
  entries: z.array(weightEntrySchema),
}).passthrough();

export const weightCreateRequestSchema = z.object({
  weight: z.coerce.number().positive().max(2000, 'Enter a valid weight'),
  unit: z.enum(['kg', 'lbs']).optional(),
  bodyFatPercent: z.coerce.number().min(0).max(75).nullable().optional(),
  date: z.union([z.string(), z.date()]).optional(),
}).strict();

export const weightSingleResponseSchema = z.object({
  entry: weightEntrySchema,
}).passthrough();
