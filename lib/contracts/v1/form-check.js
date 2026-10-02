import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/form-check',
  version: '1.0.0',
  description: 'On-device pose inference feedback contracts for /api/v1/form-check. HARD RULE: Zero video/frame egress.',
};

export const SUPPORTED_FORM_CHECK_EXERCISES = [
  'squat', 'push-up', 'plank', 'lunge', 'deadlift', 'other',
];

/**
 * Structured form issue detected locally by ML Kit on-device pose estimation.
 * Per D-19 and Hard Rule, strictly no video or frame payloads.
 */
export const flaggedIssueSchema = z.object({
  issueId: z.string().optional(),
  issueType: z.string().optional(),
  label: z.string().min(1, 'Issue label is required'),
  frameCount: z.number().int().nonnegative().optional().default(1),
  timestampSeconds: z.number().nonnegative(),
  severity: z.enum(['low', 'medium', 'high', 'warning', 'error']).optional().default('medium'),
}).strict();

export const formCheckSessionSchema = z.object({
  _id: z.any(),
  id: z.string().optional(),
  user: z.any(),
  exerciseSlug: z.string(),
  videoDurationSeconds: z.number().nullable().optional(),
  flaggedIssues: z.array(flaggedIssueSchema).default([]),
  aiSummary: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const formCheckListResponseSchema = z.object({
  sessions: z.array(formCheckSessionSchema),
}).passthrough();

export const formCheckSubmitRequestSchema = z.object({
  exerciseSlug: z.enum(['squat', 'push-up', 'plank', 'lunge', 'deadlift', 'other']),
  flaggedIssues: z.array(flaggedIssueSchema),
  videoDurationSeconds: z.number().nullable().optional(),
}).strict();

export const formCheckSubmitResponseSchema = z.object({
  session: formCheckSessionSchema,
}).passthrough();

export const formCheckRateLimitErrorSchema = z.object({
  error: z.string(),
  upgrade: z.boolean().optional(),
  details: z.any().optional(),
}).passthrough();
