import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/auth',
  version: '1.0.0',
  description: 'Authentication and session management contracts for /api/v1/auth/**',
};

/**
 * Standard safe user representation returned across auth endpoints.
 */
export const safeUserSchema = z.object({
  _id: z.any().optional(),
  id: z.string().optional(),
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  email: z.string().email(),
  role: z.string(),
  originalRole: z.string().optional(),
  plan: z.string().optional(),
  planExpiresAt: z.union([z.string(), z.date()]).nullable().optional(),
  isBanned: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  avatar: z.string().nullable().optional(),
  xp: z.number().optional(),
  streak: z.number().optional(),
  trainerInfo: z.record(z.any()).optional(),
}).passthrough();

/**
 * POST /api/v1/auth/login
 */
export const loginRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
}).strict();

export const loginResponseSchema = z.object({
  user: safeUserSchema,
  token: z.string(),
}).strict();

export const loginContract = {
  contractMetadata: {
    endpoint: '/api/v1/auth/login',
    method: 'POST',
    version: '1.0.0',
    description: 'Authenticate user with email and password, returning 30d Bearer token and setting repily_token cookie',
  },
  requestSchema: loginRequestSchema,
  responseSchema: loginResponseSchema,
};

/**
 * POST /api/v1/auth/refresh
 */
export const refreshRequestSchema = z.object({
  token: z.string().optional(),
}).strict().optional();

export const refreshResponseSchema = z.object({
  user: safeUserSchema,
  token: z.string(),
}).strict();

export const refreshContract = {
  contractMetadata: {
    endpoint: '/api/v1/auth/refresh',
    method: 'POST',
    version: '1.0.0',
    description: 'Refresh active authentication session and issue a fresh 30d Bearer token',
  },
  requestSchema: refreshRequestSchema,
  responseSchema: refreshResponseSchema,
};

/**
 * POST /api/v1/auth/logout (Revoke)
 */
export const logoutRequestSchema = z.object({
  token: z.string().optional(),
}).strict().optional();

export const logoutResponseSchema = z.object({
  ok: z.boolean(),
}).strict();

export const logoutContract = {
  contractMetadata: {
    endpoint: '/api/v1/auth/logout',
    method: 'POST',
    version: '1.0.0',
    description: 'Revoke active authentication token in RevokedToken collection and clear session cookies',
  },
  requestSchema: logoutRequestSchema,
  responseSchema: logoutResponseSchema,
};

export const revokeContract = logoutContract;

/**
 * GET /api/v1/auth/me (Current User)
 */
export const meRequestSchema = z.void().optional();

export const meResponseSchema = z.object({
  user: safeUserSchema.nullable(),
}).strict();

export const meContract = {
  contractMetadata: {
    endpoint: '/api/v1/auth/me',
    method: 'GET',
    version: '1.0.0',
    description: 'Retrieve current session user profile via Bearer token or cookie',
  },
  requestSchema: meRequestSchema,
  responseSchema: meResponseSchema,
};

export const currentUserContract = meContract;
