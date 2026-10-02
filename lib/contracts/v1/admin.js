import { z } from 'zod';
import { safeUserSchema } from './auth.js';

export const contractMetadata = {
  endpoint: '/api/v1/admin',
  version: '1.0.0',
  description: 'Administrative platform management contracts for /api/v1/admin/**. Strictly requires role === "admin".',
};

export const adminStatsResponseSchema = z.object({
  totalUsers: z.number().int(),
  totalTrainers: z.number().int(),
  proUsers: z.number().int(),
  maxUsers: z.number().int(),
  freeUsers: z.number().int(),
  newUsersThisWeek: z.number().int(),
  newUsersThisMonth: z.number().int(),
  estimatedMRR: z.string(),
  activeCoupons: z.number().int(),
  totalEscrowRevenue: z.number(),
  heldFunds: z.number(),
  pendingTrainers: z.array(z.any()),
  userGrowth: z.array(z.object({
    month: z.string(),
    count: z.number().int(),
  })),
}).passthrough();

export const adminUserListResponseSchema = z.object({
  users: z.array(safeUserSchema),
}).passthrough();

export const adminBanUserRequestSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  reason: z.string().optional().default(''),
}).strict();

export const adminBanUserResponseSchema = z.object({
  message: z.string(),
  isBanned: z.boolean(),
}).passthrough();

export const adminGrantBadgeRequestSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  badgeId: z.string().min(1, 'badgeId is required'),
}).strict();

export const adminGrantBadgeResponseSchema = z.object({
  message: z.string(),
  badges: z.array(z.any()),
}).passthrough();

export const adminGrantXpRequestSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  amount: z.coerce.number().int().positive('amount must be positive'),
}).strict();

export const adminGrantXpResponseSchema = z.object({
  message: z.string(),
  xp: z.number().int(),
}).passthrough();

export const adminBookingListResponseSchema = z.object({
  bookings: z.array(z.any()),
}).passthrough();

export const adminCouponSchema = z.object({
  _id: z.any().optional(),
  id: z.string().optional(),
  code: z.string(),
  discountPercent: z.number(),
  expiresAt: z.union([z.string(), z.date()]).nullable().optional(),
  maxUses: z.number().nullable().optional(),
  usedCount: z.number().int().optional().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const adminCouponListResponseSchema = z.object({
  coupons: z.array(adminCouponSchema),
}).passthrough();

export const adminCouponCreateRequestSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').trim().toUpperCase(),
  discountPercent: z.coerce.number().min(1).max(100),
  expiresAt: z.union([z.string(), z.date()]).nullable().optional(),
  maxUses: z.coerce.number().int().positive().nullable().optional(),
}).strict();

export const adminCouponUpdateRequestSchema = z.object({
  id: z.string().min(1, 'Coupon ID is required'),
  isActive: z.boolean(),
}).strict();

export const adminCouponSingleResponseSchema = z.object({
  coupon: adminCouponSchema,
}).passthrough();

export const adminModerationListResponseSchema = z.object({
  moments: z.array(z.any()),
}).passthrough();

export const adminModerationDeleteRequestSchema = z.object({
  momentId: z.string().min(1, 'momentId is required'),
}).strict();

export const adminDisputeListResponseSchema = z.object({
  disputes: z.array(z.any()),
}).passthrough();

export const adminDisputeAdjudicateRequestSchema = z.object({
  transactionId: z.string().min(1, 'transactionId is required'),
  resolution: z.enum(['refund_client', 'pay_trainer', 'split']),
  notes: z.string().optional().default(''),
}).strict();

export const adminDisputeAdjudicateResponseSchema = z.object({
  message: z.string().optional(),
  transaction: z.any(),
}).passthrough();

export const adminApproveTrainerRequestSchema = z.object({
  trainerId: z.string().min(1, 'trainerId is required'),
}).strict();

export const adminApproveTrainerResponseSchema = z.object({
  message: z.string(),
  trainer: z.any(),
}).passthrough();
