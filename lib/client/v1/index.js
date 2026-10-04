/**
 * Custom error thrown when an API response violates its designated contract schema.
 */
export class ContractValidationError extends Error {
  constructor(message, { endpoint, issues, rawResponse } = {}) {
    super(message);
    this.name = 'ContractValidationError';
    this.endpoint = endpoint;
    this.issues = issues;
    this.rawResponse = rawResponse;
  }
}

/**
 * Validated fetch wrapper that executes an HTTP request and validates the response body
 * against a contract's responseSchema.
 *
 * @param {object} contract - Contract definition exporting responseSchema and contractMetadata
 * @param {object} [options={}] - Fetch configuration options
 * @param {string} [options.url] - Override URL if different from contract.contractMetadata.endpoint
 * @param {Record<string, string>} [options.headers] - HTTP headers
 * @param {any} [options.body] - Request body (validated against requestSchema if provided)
 * @param {function} [fetchFn=globalThis.fetch] - Custom fetch implementation
 * @returns {Promise<{ data: any, status: number, headers: Headers }>}
 */
export async function contractFetch(contract, options = {}, fetchFn = options.fetchFn || globalThis.fetch) {
  if (!contract || !contract.responseSchema) {
    throw new Error('contractFetch requires a valid contract with a responseSchema');
  }

  const endpoint = options.url || contract.contractMetadata?.endpoint;
  if (!endpoint) {
    throw new Error('contractFetch requires a target URL or contract.contractMetadata.endpoint');
  }

  const method = options.method || contract.contractMetadata?.method || 'GET';
  const headers = new Headers(options.headers || {});
  const effectiveFetch = options.fetchFn || fetchFn;

  let body = options.body;
  if (body !== undefined && typeof body !== 'string' && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
    if (contract.requestSchema) {
      const parsedBody = contract.requestSchema.safeParse(body);
      if (!parsedBody.success) {
        throw new ContractValidationError(
          `Request body contract validation failed for ${method} ${endpoint}`,
          { endpoint, issues: parsedBody.error.issues, rawResponse: body }
        );
      }
      body = parsedBody.data;
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(body);
  }

  const response = await effectiveFetch(endpoint, {
    ...options,
    method,
    headers,
    body,
  });

  let json = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    json = await response.json();
  }

  if (!response.ok) {
    const errorDetails = json?.error?.message || json?.message || `HTTP ${response.status} ${response.statusText}`;
    const error = new Error(`Request to ${method} ${endpoint} failed: ${errorDetails}`);
    error.status = response.status;
    error.data = json;
    throw error;
  }

  const parseResult = contract.responseSchema.safeParse(json);
  if (!parseResult.success) {
    throw new ContractValidationError(
      `Response contract validation failed for ${method} ${endpoint}`,
      {
        endpoint,
        issues: parseResult.error.issues,
        rawResponse: json,
      }
    );
  }

  return {
    data: parseResult.data,
    status: response.status,
    headers: response.headers,
  };
}

/**
 * Factory for creating a scoped contract API client with shared base configuration.
 *
 * @param {object} [config={}] - Client configuration
 * @param {string} [config.baseUrl=''] - Base URL prefix (e.g. 'https://api.temprfit.com')
 * @param {Record<string, string>} [config.defaultHeaders={}] - Default headers to send with every request
 * @param {function} [config.fetchFn=globalThis.fetch] - Custom fetch implementation
 */
export function createContractClient({ baseUrl = '', defaultHeaders = {}, fetchFn = globalThis.fetch } = {}) {
  return {
    async call(contract, options = {}) {
      const endpoint = options.url || contract.contractMetadata?.endpoint || '';
      const fullUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}` : endpoint;

      const mergedHeaders = {
        ...defaultHeaders,
        ...(options.headers || {}),
      };

      return contractFetch(contract, { ...options, url: fullUrl, headers: mergedHeaders }, fetchFn);
    },
  };
}
