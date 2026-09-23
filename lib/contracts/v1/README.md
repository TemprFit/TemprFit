# API v1 Contract Schemas (`lib/contracts/v1/`)

This directory contains the authoritative Zod contract definitions for all `/api/v1/**` endpoints.

## 1. Core Principle: Single Source of Truth

Schemas defined in this directory are the **single source of truth** for all request and response shapes between the TemprFit backend and its consumers (both Next.js web frontend and Flutter mobile app).

- **Backend handlers** (`app/api/v1/**`): Use these schemas to parse and validate incoming request payloads (`requestSchema.parse(body)`) and ensure returned data conforms to the contract.
- **Web client callers** (`lib/client/v1/**`): Use these schemas to parse API responses (`responseSchema.parse(data)`), ensuring malformed or drifting data is caught immediately at runtime.
- **Mobile client** (`temprfit-mobile`): Does not run JavaScript. Instead, static JSON Schemas emitted from these Zod definitions (`npm run emit-contracts` -> `contracts/v1/*.json`) are consumed by mobile code generators (e.g. Freezed / JSON Serializable) to keep Dart models in strict lockstep.

## 2. Contract File Structure

Each endpoint contract file in `lib/contracts/v1/` exports:

```javascript
import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/resource',
  method: 'POST',
  version: '1.0.0',
  description: 'Creates a resource',
};

// Input payload schema (null or z.void() if no request body required)
export const requestSchema = z.object({
  title: z.string().min(1).max(100),
  count: z.number().int().positive().optional(),
}).strict();

// Successful response payload schema
export const responseSchema = z.object({
  data: z.object({
    id: z.string(),
    title: z.string(),
    createdAt: z.string(),
  }),
}).strict();
```

## 3. Strict Validation & Standard Envelopes

1. **Strict Objects**: Use `.strict()` on object schemas to forbid undeclared properties. This prevents silent contract creep where backend sends fields the client does not know about, or clients send properties the backend ignores.
2. **Standard Error Envelope**: When endpoints return error responses (HTTP 4xx/5xx), the response body must conform to:
   ```javascript
   export const errorResponseSchema = z.object({
     error: z.object({
       code: z.string(),
       message: z.string(),
       details: z.any().optional(),
     }),
   });
   ```

## 4. Immutability & Mobile Compatibility

1. **Never mutate an active schema in-place without bumping `contractMetadata.version`**.
2. **Non-breaking changes** (e.g. adding an optional field): Bump minor/patch version (e.g. `1.0.0` -> `1.1.0`).
3. **Breaking changes** (e.g. removing a field, changing a type, making an optional field required): Must NOT break existing deployed mobile clients. Version the endpoint path (e.g. `/api/v2/**`) or maintain backwards-compatible transformations on `/api/v1/**`.
4. Run `npm run emit-contracts` after modifying any contract schema file so `contracts/v1/*.json` reflects the changes.
