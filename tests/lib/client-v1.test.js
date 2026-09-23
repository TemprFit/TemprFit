import './../setup.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contractFetch, createContractClient, ContractValidationError } from '@/lib/client/v1/index.js';
import * as exampleContract from '@/lib/contracts/v1/example.js';

describe('lib/client/v1 Contract Client & Validation', () => {
  it('successfully validates and returns data when response conforms to schema', async () => {
    const mockPayload = {
      ok: true,
      message: 'All systems nominal',
      timestamp: '2026-09-23T12:00:00Z',
    };

    const mockFetch = async (url, options) => {
      assert.equal(url, '/api/v1/example');
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockPayload,
      };
    };

    const result = await contractFetch(exampleContract, {}, mockFetch);
    assert.deepEqual(result.data, mockPayload);
    assert.equal(result.status, 200);
  });

  it('throws ContractValidationError when response violates schema', async () => {
    const invalidPayload = {
      ok: 'not-a-boolean', // violation: expected boolean
      message: 'Missing timestamp',
      // timestamp is missing
    };

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => invalidPayload,
    });

    await assert.rejects(
      async () => {
        await contractFetch(exampleContract, {}, mockFetch);
      },
      (err) => {
        assert(err instanceof ContractValidationError);
        assert.equal(err.name, 'ContractValidationError');
        assert.equal(err.endpoint, '/api/v1/example');
        assert(Array.isArray(err.issues));
        assert(err.issues.length >= 2); // boolean type mismatch + missing timestamp
        return true;
      }
    );
  });

  it('validates request payload when requestSchema is defined', async () => {
    let capturedBody = null;
    const mockFetch = async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          ok: true,
          message: 'Echoed',
          timestamp: '2026-09-23T12:00:00Z',
        }),
      };
    };

    // Valid body
    await contractFetch(exampleContract, { body: { echo: 'hello' } }, mockFetch);
    assert.deepEqual(capturedBody, { echo: 'hello' });

    // Invalid body (strict object violation)
    await assert.rejects(
      async () => {
        await contractFetch(exampleContract, { body: { unexpectedField: 'illegal' } }, mockFetch);
      },
      (err) => {
        assert(err instanceof ContractValidationError);
        return true;
      }
    );
  });

  it('createContractClient prepends baseUrl and merges default headers', async () => {
    let calledUrl = null;
    let calledHeaders = null;

    const mockFetch = async (url, options) => {
      calledUrl = url;
      calledHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          ok: true,
          message: 'OK',
          timestamp: '2026-09-23T12:00:00Z',
        }),
      };
    };

    const client = createContractClient({
      baseUrl: 'https://api.temprfit.com',
      defaultHeaders: { 'X-Custom-Client': 'TemprFit-Web' },
      fetchFn: mockFetch,
    });

    await client.call(exampleContract, { headers: { 'Authorization': 'Bearer test-token' } });

    assert.equal(calledUrl, 'https://api.temprfit.com/api/v1/example');
    assert.equal(calledHeaders.get('X-Custom-Client'), 'TemprFit-Web');
    assert.equal(calledHeaders.get('Authorization'), 'Bearer test-token');
  });
});
