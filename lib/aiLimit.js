import User from '@/models/User';

const LIMITS = {
  free: 2,
  pro: 30,
  max: Infinity,
};

export async function checkAndIncrementAILimit(userId) {
  const user = await User.findById(userId);
  if (!user) return { allowed: false, error: 'User not found' };

  // Determine current plan, defaulting to free
  let plan = user.plan || 'free';
  
  // If plan is expired, treat as free
  if (plan !== 'free' && user.planExpiresAt && new Date() > user.planExpiresAt) {
    plan = 'free';
  }

  const limit = LIMITS[plan] || LIMITS.free;

  // Max tier has no limits
  if (limit === Infinity) {
    return { allowed: true };
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Initialize aiUsage if missing or from a different day
  if (!user.aiUsage || user.aiUsage.date !== today) {
    user.aiUsage = {
      date: today,
      count: 0
    };
  }

  // Check if limit is reached
  if (user.aiUsage.count >= limit) {
    return { 
      allowed: false, 
      error: `You have reached your daily limit of ${limit} AI generations on the ${plan.toUpperCase()} plan.` 
    };
  }

  // Increment usage
  user.aiUsage.count += 1;
  await user.save();

  return { allowed: true };
}
