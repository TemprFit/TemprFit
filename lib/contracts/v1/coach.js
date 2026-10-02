import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/coach',
  version: '1.0.0',
  description: 'AI Coach conversational messaging and exercise Q&A contracts for /api/v1/coach/**',
};

export const coachAttachmentSchema = z.object({
  name: z.string(),
  type: z.string(),
}).passthrough();

export const coachMessageSchema = z.object({
  _id: z.any().optional(),
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  attachment: coachAttachmentSchema.nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const coachMessageListResponseSchema = z.object({
  messages: z.array(coachMessageSchema),
}).passthrough();

export const coachSendMessageRequestSchema = z.object({
  message: z.string().max(2000, 'Message is too long').optional().default(''),
  attachment: z.object({
    name: z.string(),
    type: z.string(),
  }).optional(),
}).strict();

export const coachSendMessageResponseSchema = z.object({
  message: coachMessageSchema,
}).passthrough();

export const coachPaywallErrorSchema = z.object({
  error: z.string(),
  upgrade: z.boolean().optional(),
  requiredPlan: z.string().optional(),
  details: z.any().optional(),
}).passthrough();

export const coachAskExerciseRequestSchema = z.object({
  exerciseSlug: z.string().min(1, 'Exercise slug is required'),
  question: z.string().min(1, 'Question is required').max(1000),
}).strict();

export const coachAskExerciseResponseSchema = z.object({
  answer: z.string(),
}).passthrough();
