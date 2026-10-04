import './../../setup.js';
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST as adminLoginHandler } from '@/app/api/auth/admin/route.js';
import { POST as adminLogoutHandler } from '@/app/api/auth/admin/logout/route.js';
import { GET as meHandler } from '@/app/api/auth/me/route.js';
import { verifyAdminRequest, signToken, verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth.js';
import SystemConfig from '@/models/SystemConfig.js';
import User from '@/models/User.js';
import { setMockCookies, clearMockCookies, setMockHeaders, clearMockHeaders } from './../../mocks/next-headers.js';

describe('Admin Authentication & Authorization (/api/admin/** & /api/auth/admin)', () => {
  beforeEach(() => {
    clearMockCookies();
    clearMockHeaders();
  });

  describe('POST /api/auth/admin Password Resolution & Token Issuance', () => {
    it('accepts EDSHEERAN11 as the fallback password per D-9', async () => {
      const configMock = mock.method(SystemConfig, 'findOne', async () => null);

      try {
        const req = new Request('http://localhost/api/auth/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'EDSHEERAN11' }),
        });

        const res = await adminLoginHandler(req);
        assert.equal(res.status, 200);

        const json = await res.json();
        assert.equal(json.success, true);

        const cookieHeader = res.headers.get('set-cookie');
        assert(cookieHeader.includes('admin_token='));
        
        // Extract the token and verify it is a valid cryptographic admin JWT
        const tokenMatch = cookieHeader.match(/admin_token=([^;]+)/);
        assert(tokenMatch);
        const decoded = verifyToken(tokenMatch[1]);
        assert(decoded);
        assert.equal(decoded.role, 'admin');
        assert.equal(decoded.isAdmin, true);
      } finally {
        configMock.mock.restore();
      }
    });

    it('accepts ADMIN_PASSWORD from process.env if set', async () => {
      const prevEnv = process.env.ADMIN_PASSWORD;
      process.env.ADMIN_PASSWORD = 'CustomEnvPassword123!';
      const configMock = mock.method(SystemConfig, 'findOne', async () => null);

      try {
        const req = new Request('http://localhost/api/auth/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'CustomEnvPassword123!' }),
        });

        const res = await adminLoginHandler(req);
        assert.equal(res.status, 200);
      } finally {
        if (prevEnv !== undefined) {
          process.env.ADMIN_PASSWORD = prevEnv;
        } else {
          delete process.env.ADMIN_PASSWORD;
        }
        configMock.mock.restore();
      }
    });

    it('rejects incorrect passwords with 401', async () => {
      const configMock = mock.method(SystemConfig, 'findOne', async () => null);

      try {
        const req = new Request('http://localhost/api/auth/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'WrongPassword999' }),
        });

        const res = await adminLoginHandler(req);
        assert.equal(res.status, 401);
      } finally {
        configMock.mock.restore();
      }
    });
  });

  describe('verifyAdminRequest Helper', () => {
    it('authorizes when database sessionUser has role: admin', async () => {
      const token = signToken({ userId: 'db_admin_1', role: 'admin' });
      setMockCookies({ [AUTH_COOKIE_NAME]: token });

      const findMock = mock.method(User, 'findById', async () => ({
        _id: 'db_admin_1',
        role: 'admin',
        isBanned: false,
      }));

      try {
        const result = await verifyAdminRequest();
        assert.equal(result.authorized, true);
        assert.equal(result.user?.role, 'admin');
      } finally {
        findMock.mock.restore();
      }
    });

    it('authorizes when admin_token cookie is a valid signed admin JWT', async () => {
      const adminJwt = signToken({ role: 'admin', isAdmin: true });
      setMockCookies({ admin_token: adminJwt });

      const result = await verifyAdminRequest();
      assert.equal(result.authorized, true);
      assert.equal(result.isMasterAdmin, true);
      assert.equal(result.tokenPayload?.role, 'admin');
    });

    it('authorizes when admin_token cookie is legacy string true', async () => {
      setMockCookies({ admin_token: 'true' });

      const result = await verifyAdminRequest();
      assert.equal(result.authorized, true);
      assert.equal(result.isMasterAdmin, true);
    });

    it('rejects when no admin credentials are provided', async () => {
      const result = await verifyAdminRequest();
      assert.equal(result.authorized, false);
      assert.equal(result.user, null);
    });
  });

  describe('GET /api/auth/me Synthetic Admin & Elevation', () => {
    it('returns synthetic admin user when admin_token JWT is present without trainee cookie', async () => {
      const adminJwt = signToken({ role: 'admin', isAdmin: true });
      setMockCookies({ admin_token: adminJwt });

      const res = await meHandler();
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.ok(json.user);
      assert.equal(json.user.role, 'admin');
      assert.equal(json.user.id, 'admin');
    });

    it('elevates standard user to role: admin in-memory when admin_token JWT is present', async () => {
      const userToken = signToken({ userId: 'trainee_123', role: 'user' });
      const adminJwt = signToken({ role: 'admin', isAdmin: true });
      setMockCookies({
        [AUTH_COOKIE_NAME]: userToken,
        admin_token: adminJwt,
      });

      const mockUser = {
        _id: 'trainee_123',
        email: 'trainee@temprfit.com',
        role: 'user',
        plan: 'free',
        toSafeObject: () => ({
          id: 'trainee_123',
          email: 'trainee@temprfit.com',
          role: 'user',
        }),
      };

      const findMock = mock.method(User, 'findById', async () => mockUser);

      try {
        const res = await meHandler();
        assert.equal(res.status, 200);

        const json = await res.json();
        assert.ok(json.user);
        assert.equal(json.user.role, 'admin');
        assert.equal(json.user.originalRole, 'user');
      } finally {
        findMock.mock.restore();
      }
    });
  });

  describe('POST /api/auth/admin/logout', () => {
    it('clears the httpOnly admin_token cookie', async () => {
      const res = await adminLogoutHandler();
      assert.equal(res.status, 200);

      const cookieHeader = res.headers.get('set-cookie');
      assert(cookieHeader.includes('admin_token=;'));
    });
  });
});
