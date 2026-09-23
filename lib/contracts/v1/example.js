import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/example',
  method: 'GET',
  version: '1.0.0',
  description: 'Example contract specification demonstrating the API contract boundary pattern',
};

export const requestSchema = z.object({
  echo: z.string().optional(),
}).strict();

export const responseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
}).strict();
