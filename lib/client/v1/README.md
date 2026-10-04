# API v1 Client SDK (`lib/client/v1/`)

This directory provides the typed, runtime-validated fetch client wrappers for all `/api/v1/**` endpoints.

## 1. Purpose & Boundary Pattern

Per the TemprFit architectural boundary rules:
- **No direct API or Model imports in UI:** Code under `app/**` (outside `app/api/**`) is prohibited from directly importing route handlers or Mongoose models.
- **Typed, Contract-Checked Communication:** UI components must call API endpoints exclusively via client wrappers in `lib/client/v1/**` or using `contractFetch` against schemas in `lib/contracts/v1/**`.
- **Runtime Validation:** All HTTP responses are parsed against the contract's `responseSchema`. If the server returns malformed data or drifts from the published schema, `ContractValidationError` is thrown with descriptive issue paths, preventing unexpected silent UI failures.

## 2. Usage Example

```javascript
import { contractFetch, createContractClient } from '@/lib/client/v1';
import * as authContract from '@/lib/contracts/v1/auth';

// 1. Direct call with contract
const { data, status } = await contractFetch(authContract.loginContract, {
  body: { email: 'user@example.com', password: 'password123' },
});

// 2. Client factory with default headers / base URL
const client = createContractClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  defaultHeaders: { 'Accept': 'application/json' },
});

const result = await client.call(authContract.loginContract, {
  body: { email: 'user@example.com', password: 'password123' },
});
```

## 3. Submodule Layout

- `index.js`: Core fetch primitives (`contractFetch`, `createContractClient`, `ContractValidationError`).
- `auth.js`: Dedicated domain client for authentication endpoints (`login`, `refresh`, `logout`, `getCurrentUser`).
