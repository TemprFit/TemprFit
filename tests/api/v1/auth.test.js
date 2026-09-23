import './../../setup.js';
import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { POST as loginHandler } from '@/app/api/v1/auth/login/route.js';
import { POST as refreshHandler } from '@/app/api/v1/auth/refresh/route.js';
import { POST as logoutHandler } from '@/app/api/v1/auth/logout/route.js';
import { GET as meHandler } from '@/app/api/v1/auth/me/route.js';
import User from '@/models/User';
import RevokedToken from '@/models/RevokedToken';
import {
  hashPassword,
  signToken,
  AUTH_COOKIE_NAME,
} from '@/lib/auth';
import {
  setMockCookies,
  clearMockCookies,
  setMockHeaders,
  clearMockHeaders,
} from './../../mocks/next-headers.js';
import * as authClient from '@/lib/client/v1/auth.js';

describe('API v1 Auth Endpoints with Contract Boundary (/api/v1/auth/**)', () => {
  const TEST_PASSWORD = 'SecurePassword123!';
  let mockUserInstance = null;

  beforeEach(async () => {
    clearMockCookies();
    clearMockHeaders();

    const passwordHash = await hashPassword(TEST_PASSWORD);
    mockUserInstance = {
      _id: '507f1f77bcf86cd799439011',
      name: 'V1 Auth Tester',
      email: 'v1_test@example.com',
      password: passwordHash,
      role: 'user',
      isVerified: true,
      isBanned: false,
      toSafeObject() {
        return {
          id: this._id,
          name: this.name,
          email: this.email,
          role: this.role,
          isVerified: this.isVerified,
          isBanned: this.isBanned,
        };
      },
    };
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 400 on contract request validation failure (missing password)', async () => {
      const request = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mockUserInstance.email }),
      });

      const response = await loginHandler(request);
      assert.equal(response.status, 400);
      const json = await response.json();
      assert(json.error);
    });

    it('returns 401 on invalid password', async () => {
      const findOneMock = mock.method(User, 'findOne', async () => mockUserInstance);

      try {
        const request = new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: mockUserInstance.email, password: 'WrongPassword!' }),
        });

        const response = await loginHandler(request);
        assert.equal(response.status, 401);
      } finally {
        findOneMock.mock.restore();
      }
    });

    it('authenticates valid credentials, returns Bearer token and user, sets cookie', async () => {
      const findOneMock = mock.method(User, 'findOne', async () => mockUserInstance);

      try {
        const request = new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: mockUserInstance.email, password: TEST_PASSWORD }),
        });

        const response = await loginHandler(request);
        assert.equal(response.status, 200);

        const json = await response.json();
        assert(json.token);
        assert.equal(typeof json.token, 'string');
        assert.equal(json.user.email, mockUserInstance.email);
        assert(!json.user.password);

        const cookieHeader = response.headers.get('set-cookie');
        assert(cookieHeader.includes(AUTH_COOKIE_NAME));
      } finally {
        findOneMock.mock.restore();
      }
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('authenticates via Authorization: Bearer <token> header', async () => {
      const token = signToken({ userId: mockUserInstance._id });
      setMockHeaders({ authorization: `Bearer ${token}` });

      const findByIdMock = mock.method(User, 'findById', async () => mockUserInstance);

      try {
        const response = await meHandler();
        assert.equal(response.status, 200);

        const json = await response.json();
        assert(json.user);
        assert.equal(json.user.email, mockUserInstance.email);
      } finally {
        findByIdMock.mock.restore();
      }
    });

    it('falls back to cookie during migration window', async () => {
      const token = signToken({ userId: mockUserInstance._id });
      setMockCookies({ [AUTH_COOKIE_NAME]: token });

      const findByIdMock = mock.method(User, 'findById', async () => mockUserInstance);

      try {
        const response = await meHandler();
        assert.equal(response.status, 200);

        const json = await response.json();
        assert(json.user);
        assert.equal(json.user.email, mockUserInstance.email);
      } finally {
        findByIdMock.mock.restore();
      }
    });

    it('returns user: null when token is revoked', async () => {
      const token = signToken({ userId: mockUserInstance._id });
      setMockHeaders({ authorization: `Bearer ${token}` });

      const findOneRevokedMock = mock.method(RevokedToken, 'findOne', async () => ({ tokenHash: 'revoked' }));

      try {
        const response = await meHandler();
        assert.equal(response.status, 200);

        const json = await response.json();
        assert.equal(json.user, null);
      } finally {
        findOneRevokedMock.mock.restore();
      }
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 401 when no token is present', async () => {
      const request = new Request('http://localhost/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await refreshHandler(request);
      assert.equal(response.status, 401);
    });

    it('re-issues fresh token and revokes the old token', async () => {
      const oldToken = signToken({ userId: mockUserInstance._id });
      setMockHeaders({ authorization: `Bearer ${oldToken}` });

      const findByIdMock = mock.method(User, 'findById', async () => mockUserInstance);
      const findOneAndUpdateMock = mock.method(RevokedToken, 'findOneAndUpdate', async () => ({}));

      try {
        const request = new Request('http://localhost/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await refreshHandler(request);
        assert.equal(response.status, 200);

        const json = await response.json();
        assert(json.token);
        assert.notEqual(json.token, oldToken);
        assert.equal(json.user.email, mockUserInstance.email);
        assert.equal(findOneAndUpdateMock.mock.calls.length, 1);
      } finally {
        findByIdMock.mock.restore();
        findOneAndUpdateMock.mock.restore();
      }
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes active token in RevokedToken and clears cookies', async () => {
      const activeToken = signToken({ userId: mockUserInstance._id });
      setMockHeaders({ authorization: `Bearer ${activeToken}` });

      const findOneAndUpdateMock = mock.method(RevokedToken, 'findOneAndUpdate', async () => ({}));

      try {
        const request = new Request('http://localhost/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await logoutHandler(request);
        assert.equal(response.status, 200);

        const json = await response.json();
        assert.equal(json.ok, true);
        assert.equal(findOneAndUpdateMock.mock.calls.length, 1);

        const cookieHeader = response.headers.get('set-cookie');
        assert(cookieHeader.includes(`${AUTH_COOKIE_NAME}=;`));
      } finally {
        findOneAndUpdateMock.mock.restore();
      }
    });
  });

  describe('lib/client/v1/auth.js Client Functions', () => {
    it('authClient functions call endpoints and parse responses via contracts', async () => {
      const mockFetch = async (url) => {
        if (url === '/api/v1/auth/login') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              token: 'mock-jwt-token',
              user: {
                id: '123',
                email: 'mock@example.com',
                role: 'user',
              },
            }),
          };
        }
        if (url === '/api/v1/auth/me') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              user: {
                id: '123',
                email: 'mock@example.com',
                role: 'user',
              },
            }),
          };
        }
        return { ok: false, status: 404 };
      };

      const loginRes = await authClient.login(
        { email: 'mock@example.com', password: 'password123' },
        { fetchFn: mockFetch }
      );
      assert.equal(loginRes.token, 'mock-jwt-token');
      assert.equal(loginRes.user.email, 'mock@example.com');

      const meRes = await authClient.getCurrentUser({}, { fetchFn: mockFetch });
      assert.equal(meRes.user.email, 'mock@example.com');
    });
  });
});
