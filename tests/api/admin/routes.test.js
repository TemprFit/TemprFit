import './../../setup.js';
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GET as complaintsHandler } from '@/app/api/admin/complaints/route.js';
import { GET as bookingsHandler } from '@/app/api/admin/bookings/route.js';
import { GET as moderationHandler } from '@/app/api/admin/moderation/route.js';
import { middleware } from '@/middleware.js';
import { signToken } from '@/lib/auth.js';
import Complaint from '@/models/Complaint.js';
import Booking from '@/models/Booking.js';
import EscrowTransaction from '@/models/EscrowTransaction.js';
import Moment from '@/models/Moment.js';
import { setMockCookies, clearMockCookies, setMockHeaders, clearMockHeaders } from './../../mocks/next-headers.js';

describe('Admin Sub-Routes Stability & Middleware (/api/admin/** & middleware)', () => {
  beforeEach(() => {
    clearMockCookies();
    clearMockHeaders();
  });

  describe('Edge Middleware Admin Protection', () => {
    it('redirects unauthenticated /admin navigation to /admin/login', () => {
      const req = {
        nextUrl: { pathname: '/admin/complaints' },
        url: 'http://localhost:3000/admin/complaints',
        cookies: {
          get: (name) => (name === 'admin_token' ? undefined : undefined),
        },
        headers: new Headers(),
      };

      const res = middleware(req);
      assert.equal(res.status, 307);
      assert.equal(res.headers.get('location'), 'http://localhost:3000/admin/login');
    });

    it('permits unauthenticated access to /admin/login without redirect', () => {
      const req = {
        nextUrl: { pathname: '/admin/login' },
        url: 'http://localhost:3000/admin/login',
        cookies: {
          get: () => undefined,
        },
        headers: new Headers(),
      };

      const res = middleware(req);
      assert.equal(res.status, 200);
    });

    it('permits authenticated admin to /admin/complaints', () => {
      const adminJwt = signToken({ role: 'admin', isAdmin: true });
      const req = {
        nextUrl: { pathname: '/admin/complaints' },
        url: 'http://localhost:3000/admin/complaints',
        cookies: {
          get: (name) => (name === 'admin_token' ? { value: adminJwt } : undefined),
        },
        headers: new Headers(),
      };

      const res = middleware(req);
      assert.equal(res.status, 200);
    });
  });

  describe('GET /api/admin/complaints', () => {
    it('successfully queries complaints and returns success with populated user', async () => {
      const adminToken = signToken({ role: 'admin', isAdmin: true });
      setMockCookies({ admin_token: adminToken });

      const mockQuery = {
        populate: mock.fn(() => mockQuery),
        sort: mock.fn(() => Promise.resolve([
          { _id: 'c1', subject: 'Bug report', status: 'open', user: { username: 'testuser' } }
        ])),
      };
      mock.method(Complaint, 'find', () => mockQuery);

      const res = await complaintsHandler();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.complaints.length, 1);
      assert.equal(json.complaints[0].subject, 'Bug report');
    });
  });

  describe('GET /api/admin/bookings', () => {
    it('successfully queries Booking model with populated program and amountPaid', async () => {
      const adminToken = signToken({ role: 'admin', isAdmin: true });
      setMockCookies({ admin_token: adminToken });

      const mockQuery = {
        populate: mock.fn(() => mockQuery),
        sort: mock.fn(() => mockQuery),
        lean: mock.fn(() => Promise.resolve([
          {
            _id: 'b1',
            amountPaid: 150,
            status: 'held',
            trainee: { username: 'trainee1' },
            trainer: { username: 'trainer1' },
            program: { title: 'Strength 101' },
          },
        ])),
      };
      mock.method(Booking, 'find', () => mockQuery);

      const res = await bookingsHandler();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.bookings.length, 1);
      assert.equal(json.bookings[0].amountPaid, 150);
      assert.equal(json.bookings[0].program.title, 'Strength 101');
    });

    it('falls back to EscrowTransaction when Booking has no records and normalizes fields', async () => {
      const adminToken = signToken({ role: 'admin', isAdmin: true });
      setMockCookies({ admin_token: adminToken });

      const emptyBookingQuery = {
        populate: mock.fn(() => emptyBookingQuery),
        sort: mock.fn(() => emptyBookingQuery),
        lean: mock.fn(() => Promise.resolve([])),
      };
      mock.method(Booking, 'find', () => emptyBookingQuery);

      const mockEscrowQuery = {
        populate: mock.fn(() => mockEscrowQuery),
        sort: mock.fn(() => mockEscrowQuery),
        lean: mock.fn(() => Promise.resolve([
          {
            _id: 'e1',
            amount: 200,
            status: 'held',
            description: 'Custom Session with Trainer',
            trainee: { username: 'trainee1' },
            trainer: { username: 'trainer1' },
          },
        ])),
      };
      mock.method(EscrowTransaction, 'find', () => mockEscrowQuery);

      const res = await bookingsHandler();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.bookings.length, 1);
      assert.equal(json.bookings[0].amountPaid, 200);
      assert.equal(json.bookings[0].program.title, 'Custom Session with Trainer');
    });
  });

  describe('GET /api/admin/moderation', () => {
    it('successfully queries flagged moments with populated user', async () => {
      const adminToken = signToken({ role: 'admin', isAdmin: true });
      setMockCookies({ admin_token: adminToken });

      const mockQuery = {
        populate: mock.fn(() => mockQuery),
        sort: mock.fn(() => mockQuery),
        limit: mock.fn(() => Promise.resolve([
          { _id: 'm1', caption: 'Flagged photo', user: { username: 'flagged_user' } }
        ])),
      };
      mock.method(Moment, 'find', () => mockQuery);

      const res = await moderationHandler();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.moments.length, 1);
      assert.equal(json.moments[0].caption, 'Flagged photo');
    });
  });
});
