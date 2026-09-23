import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days (per D-4)

if (!JWT_SECRET) {
  console.warn(
    'JWT_SECRET is not set. Add it to .env.local — see .env.local.example'
  )
}

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plainPassword, salt)
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword)
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function signToken(payload) {
  const tokenPayload = {
    ...payload,
    jti: payload.jti || crypto.randomUUID(),
  }
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE_SECONDS })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export const AUTH_COOKIE_NAME = 'repily_token'
export const AUTH_COOKIE_MAX_AGE = TOKEN_MAX_AGE_SECONDS

/**
 * Check if a token has been revoked in the RevokedToken collection.
 *
 * @param {string} token - Raw JWT token
 * @returns {Promise<boolean>}
 */
export async function isTokenRevoked(token) {
  if (!token) return true
  try {
    const { default: RevokedToken } = await import('@/models/RevokedToken')
    const tokenHash = hashToken(token)
    const revoked = await RevokedToken.findOne({ tokenHash })
    return !!revoked
  } catch (err) {
    console.error('Revocation check error:', err)
    return false
  }
}

/**
 * Record a token in the RevokedToken collection with TTL expiration.
 *
 * @param {string} token - Raw JWT token to revoke
 * @param {object} [options={}] - Revocation metadata
 * @returns {Promise<boolean>}
 */
export async function revokeToken(token, { reason = 'logout', userId = null, expiresAt = null } = {}) {
  if (!token) return false
  try {
    const { default: RevokedToken } = await import('@/models/RevokedToken')
    const tokenHash = hashToken(token)
    const payload = verifyToken(token)

    const resolvedExpiresAt = expiresAt || (payload?.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + TOKEN_MAX_AGE_SECONDS * 1000))
    const resolvedUserId = userId || payload?.userId || null
    const jti = payload?.jti || null

    await RevokedToken.findOneAndUpdate(
      { tokenHash },
      {
        $setOnInsert: {
          tokenHash,
          jti,
          userId: resolvedUserId,
          reason,
          revokedAt: new Date(),
          expiresAt: resolvedExpiresAt,
        },
      },
      { upsert: true }
    )
    return true
  } catch (err) {
    console.error('Revoke token error:', err)
    return false
  }
}

/**
 * Shared helper for API routes: resolves the logged-in user (or null) from
 * either Authorization: Bearer <token> header or auth cookie.
 * Callers must already have called connectDB().
 */
export async function getSessionUser() {
  const { headers, cookies } = await import('next/headers')
  const reqHeaders = headers()
  const reqCookies = cookies()

  let token = null
  let isCookieAuth = false

  // 1. Dual-read: check Authorization: Bearer header first (per Phase 0)
  const authHeader = reqHeaders.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim()
  }

  // 2. Fall back to cookie during migration window
  if (!token) {
    token = reqCookies.get(AUTH_COOKIE_NAME)?.value
    if (token) {
      isCookieAuth = true
    }
  }

  if (!token) return null

  // 3. Verify token signature and expiration
  const payload = verifyToken(token)
  if (!payload || !payload.userId) return null

  // 4. Verify token has not been revoked
  const revoked = await isTokenRevoked(token)
  if (revoked) return null

  const { default: User } = await import('@/models/User')
  const user = await User.findById(payload.userId)
  if (!user || user.isBanned) return null

  // Telemetry log line for day-60 migration checkpoint clause (per D-6)
  if (isCookieAuth) {
    console.log('[AUTH_DUAL_READ] Legacy cookie auth used for session:', user._id)
  }

  // Downgrade expired subscription plan if needed
  if (user.plan !== 'free' && user.planExpiresAt && new Date() > user.planExpiresAt) {
    const expiredPlan = user.plan
    user.plan = 'free'
    user.planExpiresAt = null
    await user.save()

    const { default: Notification } = await import('@/models/Notification')
    await Notification.create({
      user: user._id,
      title: 'Plan Expired',
      message: `Your ${expiredPlan} plan has expired. You are now on the Free plan. Upgrade to regain premium features!`,
      type: 'subscription',
      link: '/upgrade',
    })
  }

  return user
}
