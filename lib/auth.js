import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10 // 10 years (Persistent login)

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

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE_SECONDS })
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

// Shared helper for API routes: resolves the logged-in user (or null) from
// the auth cookie. Callers must already have called connectDB().
export async function getSessionUser() {
  const { cookies } = await import('next/headers')
  const token = cookies().get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const { default: User } = await import('@/models/User')
  let user = await User.findById(payload.userId)

  if (!user) return null;
  
  if (user.isBanned) return null;

  // The UI and RoleGate upgrade is handled safely in /api/auth/me instead.

  if (user && user.plan !== 'free' && user.planExpiresAt && new Date() > user.planExpiresAt) {
    const expiredPlan = user.plan;
    user.plan = 'free';
    user.planExpiresAt = null;
    await user.save();

    const { default: Notification } = await import('@/models/Notification');
    await Notification.create({
      user: user._id,
      title: 'Plan Expired',
      message: `Your ${expiredPlan} plan has expired. You are now on the Free plan. Upgrade to regain premium features!`,
      type: 'subscription',
      link: '/upgrade'
    });
  }

  return user;
}

export async function verifyAdminToken() {
  const { cookies } = await import('next/headers');
  const adminToken = cookies().get('admin_token')?.value;
  if (!adminToken) return false;
  const payload = verifyToken(adminToken);
  return payload && payload.role === 'admin';
}
