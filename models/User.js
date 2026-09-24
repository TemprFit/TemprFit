import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    // Primary identity field going forward. Not marked `required` at the
    // schema level (only enforced in the register API route) so accounts
    // created before this field existed don't break on read — see
    // lib/utils.js displayName() for the fallback chain.
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
    },
    name: { type: String, trim: true, default: '' }, // legacy field, kept for pre-username accounts only
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    password: { type: String, required: true }, // stored as a bcrypt hash, never plain text
    role: {
      type: String,
      enum: ['user', 'trainer', 'admin'],
      default: 'user',
    },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    banExpiresAt: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpiresAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: Date.now },
    lastReminderSentAt: { type: Date, default: null },
    age: { type: Number, default: null },
    sex: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
      default: '',
    },
    heardAboutUs: { type: String, default: '' }, // e.g. "Social Media", "Friend/Family"
    // Flips to true the first time the dashboard renders for this user, so
    // it can show "Welcome to your new dashboard" once and "Welcome back"
    // every time after — flipped server-side so it survives refreshes.
    firstLoginCompleted: { type: Boolean, default: false },
    goal: { type: String, default: '' }, // e.g. "Build Muscle"
    experience: { type: String, default: '' }, // e.g. "Beginner"
    plan: {
      type: String,
      enum: ['free', 'pro', 'max'],
      default: 'free',
    },
    planExpiresAt: { type: Date, default: null },
    usedCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CouponCode' }],
    trainerInfo: {
      bio: { type: String, default: '' },
      specialties: [{ type: String }],
      escrowBalance: { type: Number, default: 0 },
      isFeatured: { type: Boolean, default: false },
      featuredUntil: { type: Date, default: null },
      isApproved: { type: Boolean, default: false }, // Trainer approval status
      isVerified: { type: Boolean, default: false }, // Check tick mark
      views: { type: Number, default: 0 },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      rating: { type: Number, default: 0 },
      reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }],
      price: { type: Number, default: 50 }, // Per session rate
      location: { type: String, default: 'Remote' },
      trainingMode: { type: String, enum: ['physical', 'remote', 'hybrid'], default: 'remote' },
      mediaGallery: [{ type: String }], // Array of URLs
      resumeUrl: { type: String, default: '' },
      introVideoUrl: { type: String, default: '' },
      expertise: [{ type: String }],
      experienceYears: { type: Number, default: 0 },
      availability: { type: String, default: 'Available Mon-Fri, 9AM - 5PM' },
      tagline: { type: String, default: '' },
      responseTime: { type: String, default: 'Usually replies within 24 hours' },
      payoutEmail: { type: String, default: '' },
      activeClients: { type: Number, default: 0 },
      totalClients: { type: Number, default: 0 },
    },
    avatarUrl: { type: String, default: '' }, // data URL (uploaded photo) or an external URL
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    favoriteExercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date, default: null },
    goals: {
      weeklySessions: { type: Number, default: 4 },
      targetExerciseSlug: { type: String, default: 'barbell-bench-press' },
      targetWeight: { type: Number, default: null }, // in the user's weightUnit
      targetBodyFatPercent: { type: Number, default: null },
    },
    weightUnit: { type: String, enum: ['lbs', 'kg'], default: 'lbs' },
    heightCm: { type: Number, default: null }, // canonical storage; UI converts to ft/in or cm for display
    aiUsage: {
      date: { type: String, default: '' },
      count: { type: Number, default: 0 },
    },
    fitnessProfile: {
      nickname: { type: String, default: '' },
      country: { type: String, default: '' },
      primaryGoal: { type: String, enum: ['fat_loss', 'hypertrophy', 'strength_endurance', 'general_health', 'recomp'], default: 'general_health' },
      bodyMetrics: {
        heightCm: { type: Number, default: null },
        currentWeightKg: { type: Number, default: null },
        targetWeightKg: { type: Number, default: null },
        targetRatePerWeekKg: { type: Number, default: null },
        age: { type: Number, default: null },
        biologicalSex: { type: String, enum: ['male', 'female', 'other', ''], default: '' }
      },
      experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
      workoutContext: {
        location: { type: String, enum: ['home_bodyweight', 'home_dumbbells', 'commercial_gym'], default: 'commercial_gym' },
        daysAvailablePerWeek: { type: Number, default: 3 },
        preferredSessionMins: { type: Number, default: 45 }
      },
      dietaryContext: {
        dietaryRestrictions: [{ type: String }],
        foodBudgetTier: { type: String, enum: ['budget', 'moderate', 'premium'], default: 'moderate' },
        regionalCuisinePreferences: [{ type: String }],
        typicalDailySchedule: { type: String, default: '' }
      },
      specialInterests: [{ type: String }]
    },
    appPreferences: {
      showOnLeaderboard: { type: Boolean, default: false }
    },
    hasCompletedOnboarding: { type: Boolean, default: false },
    onboardingTourSeen: { type: Map, of: Boolean, default: {} },
    badges: [{
      badgeId: { type: String },
      earnedAt: { type: Date, default: Date.now }
    }],
    xp: { type: Number, default: 0 },
    lastCheckInDate: { type: String, default: null }, // Stored as "YYYY-MM-DD"
    checkInStreak: { type: Number, default: 0 },
    totalCheckInStreak: { type: Number, default: 0 },
    longestCheckInStreak: { type: Number, default: 0 },
    unlockedColors: [{ type: String }],
    unlockedBorders: [{ type: String }],
    activeColor: { type: String, default: '' },
    activeBorder: { type: String, default: '' },
    borderExpiresAt: { type: Date, default: null },
    inventory: {
      streak_freeze: { type: Number, default: 0 }
    }

  },
  { timestamps: true }
)

// Never send the password hash back in API responses
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.models.User || mongoose.model('User', UserSchema)
