import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import User from '@/models/User'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2MB, base64-encoded data URL
const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/

// Fields a user is allowed to edit about themselves. Anything else on the
// User model (role, plan, streaks, etc.) is server-managed and ignored here.
// Async because the username branch needs a uniqueness lookup.
async function pickEditableFields(body, currentUserId) {
  const update = {}
  if (typeof body.username === 'string' && body.username.trim()) {
    const normalized = body.username.trim().toLowerCase()
    if (!USERNAME_PATTERN.test(normalized)) {
      throw new Error(
        'Username must be 3-24 characters and can only contain lowercase letters, numbers, underscores, and periods.'
      )
    }
    const clash = await User.findOne({ username: normalized, _id: { $ne: currentUserId } })
    if (clash) throw new Error('That username is already taken.')
    update.username = normalized
  }
  if (typeof body.goal === 'string') update.goal = body.goal.trim().slice(0, 80)
  if (typeof body.experience === 'string') update.experience = body.experience.trim().slice(0, 40)
  if (typeof body.weightUnit === 'string' && ['lbs', 'kg'].includes(body.weightUnit)) {
    update.weightUnit = body.weightUnit
  }
  if (typeof body.avatarUrl === 'string') {
    if (body.avatarUrl.length > MAX_AVATAR_BYTES) {
      throw new Error('Image is too large. Please use a photo under ~1.5MB.')
    }
    update.avatarUrl = body.avatarUrl
  }
  if (body.goals && typeof body.goals === 'object') {
    const g = {}
    if (Number.isFinite(body.goals.weeklySessions)) {
      g.weeklySessions = Math.max(1, Math.min(14, Math.round(body.goals.weeklySessions)))
    }
    if (typeof body.goals.targetExerciseSlug === 'string') {
      g.targetExerciseSlug = body.goals.targetExerciseSlug.trim()
    }
    if (body.goals.targetWeight === null || Number.isFinite(body.goals.targetWeight)) {
      g.targetWeight = body.goals.targetWeight
    }
    if (body.goals.targetBodyFatPercent === null || Number.isFinite(body.goals.targetBodyFatPercent)) {
      g.targetBodyFatPercent = body.goals.targetBodyFatPercent
    }
    for (const [key, value] of Object.entries(g)) {
      update[`goals.${key}`] = value
    }
  }

  // Trainer Info fields
  if (body.trainerInfo && typeof body.trainerInfo === 'object') {
    if (typeof body.trainerInfo.bio === 'string') {
      update['trainerInfo.bio'] = body.trainerInfo.bio.trim()
    }
    if (Array.isArray(body.trainerInfo.specialties)) {
      update['trainerInfo.specialties'] = body.trainerInfo.specialties.map(s => s.trim()).filter(Boolean)
    }
    if (typeof body.trainerInfo.price === 'number') {
      update['trainerInfo.price'] = body.trainerInfo.price
    }
    if (typeof body.trainerInfo.location === 'string') {
      update['trainerInfo.location'] = body.trainerInfo.location.trim()
    }
    if (typeof body.trainerInfo.trainingMode === 'string' && ['physical', 'remote', 'hybrid'].includes(body.trainerInfo.trainingMode)) {
      update['trainerInfo.trainingMode'] = body.trainerInfo.trainingMode
    }
    if (Array.isArray(body.trainerInfo.mediaGallery)) {
      update['trainerInfo.mediaGallery'] = body.trainerInfo.mediaGallery.filter(url => typeof url === 'string')
    }
    if (typeof body.trainerInfo.resumeUrl === 'string') {
      update['trainerInfo.resumeUrl'] = body.trainerInfo.resumeUrl.trim()
    }
    if (typeof body.trainerInfo.introVideoUrl === 'string') {
      update['trainerInfo.introVideoUrl'] = body.trainerInfo.introVideoUrl.trim()
    }
    if (Array.isArray(body.trainerInfo.expertise)) {
      update['trainerInfo.expertise'] = body.trainerInfo.expertise.map(s => s.trim()).filter(Boolean)
    }
    if (typeof body.trainerInfo.experienceYears === 'number') {
      update['trainerInfo.experienceYears'] = body.trainerInfo.experienceYears
    }
  }

  // Body Metrics
  if (body.fitnessProfile?.bodyMetrics) {
    if (body.fitnessProfile.bodyMetrics.currentWeightKg === null || typeof body.fitnessProfile.bodyMetrics.currentWeightKg === 'number') {
      update['fitnessProfile.bodyMetrics.currentWeightKg'] = body.fitnessProfile.bodyMetrics.currentWeightKg
    }
    if (body.fitnessProfile.bodyMetrics.targetWeightKg === null || typeof body.fitnessProfile.bodyMetrics.targetWeightKg === 'number') {
      update['fitnessProfile.bodyMetrics.targetWeightKg'] = body.fitnessProfile.bodyMetrics.targetWeightKg
    }
  }

  return update
}

export async function GET() {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  return NextResponse.json({ user: user.toSafeObject() })
}

export async function PATCH(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  let update
  try {
    update = await pickEditableFields(body, user._id)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  // user.set() understands dotted paths ("goals.weeklySessions") and merges
  // into the existing sub-document instead of replacing it wholesale.
  for (const [key, value] of Object.entries(update)) {
    user.set(key, value)
  }
  await user.save()

  return NextResponse.json({ user: user.toSafeObject() })
}

export async function DELETE() {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  // Optional: delete related records like WeightEntry, Notification, etc.
  // For now, we will just delete the user document.
  await User.findByIdAndDelete(user._id)

  const response = NextResponse.json({ success: true })
  response.cookies.delete('auth_token') // or AUTH_COOKIE_NAME if imported
  return response
}
