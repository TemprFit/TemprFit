import WorkoutSession from '@/models/WorkoutSession'
import PersonalRecord from '@/models/PersonalRecord'
import { displayName } from '@/lib/utils'

/**
 * Builds a compact, factual summary of the user's real data so the model
 * answers grounded in what actually happened — not invented specifics.
 * Deliberately terse: this eats into the free-tier token budget every call.
 */
export async function buildUserContext(user) {
  const recentSessions = await WorkoutSession.find({ user: user._id, status: 'completed' })
    .sort({ completedAt: -1 })
    .limit(5)
    .select('name completedAt durationSeconds totalVolume prCount')
    .lean()

  const recentPRs = await PersonalRecord.find({ user: user._id })
    .sort({ achievedAt: -1 })
    .limit(5)
    .populate('exercise', 'name')
    .select('weight reps estOneRepMax achievedAt')
    .lean()

  const fp = user.fitnessProfile || {}
  const bm = fp.bodyMetrics || {}
  const wc = fp.workoutContext || {}
  const dc = fp.dietaryContext || {}

  const lines = []
  lines.push(`Name: ${displayName(user)}`)

  // Primary goal from fitnessProfile (canonical), fall back to legacy field
  const primaryGoal = fp.primaryGoal || user.goal || 'general_health'
  lines.push(`Primary goal: ${primaryGoal}`)

  const expLevel = fp.experienceLevel || user.experience || 'beginner'
  lines.push(`Experience level: ${expLevel}`)

  lines.push(`Current streak: ${user.currentStreak || 0} days (longest: ${user.longestStreak || 0})`)
  lines.push(`Weekly session target: ${user.goals?.weeklySessions ?? 4}`)

  // Body metrics
  if (bm.currentWeightKg) lines.push(`Current weight: ${bm.currentWeightKg} kg`)
  if (bm.targetWeightKg) lines.push(`Goal weight: ${bm.targetWeightKg} kg`)
  if (bm.heightCm) lines.push(`Height: ${bm.heightCm} cm`)
  if (bm.age) lines.push(`Age: ${bm.age}`)
  if (bm.biologicalSex) lines.push(`Biological sex: ${bm.biologicalSex}`)

  // Equipment & workout context
  const equipmentMap = {
    home_bodyweight: 'Bodyweight only (home)',
    home_dumbbells: 'Home gym with dumbbells',
    commercial_gym: 'Full commercial gym',
  }
  lines.push(`Equipment access: ${equipmentMap[wc.location] || wc.location || 'commercial gym'}`)
  if (wc.daysAvailablePerWeek) lines.push(`Days available per week: ${wc.daysAvailablePerWeek}`)
  if (wc.preferredSessionMins) lines.push(`Preferred session length: ${wc.preferredSessionMins} min`)

  // Dietary context
  if (dc.dietaryRestrictions?.length > 0) {
    lines.push(`Dietary restrictions: ${dc.dietaryRestrictions.join(', ')}`)
  }
  if (dc.foodBudgetTier) lines.push(`Food budget: ${dc.foodBudgetTier}`)
  if (dc.regionalCuisinePreferences?.length > 0) {
    lines.push(`Cuisine preferences: ${dc.regionalCuisinePreferences.join(', ')}`)
  }

  if (user.goals?.targetExerciseSlug && user.goals?.targetWeight) {
    lines.push(
      `Target lift: ${user.goals.targetExerciseSlug} to ${user.goals.targetWeight} ${user.weightUnit || 'lbs'} (est. 1RM)`
    )
  }

  if (recentSessions.length === 0) {
    lines.push('No completed workouts logged yet.')
  } else {
    lines.push('Recent completed sessions (most recent first):')
    for (const s of recentSessions) {
      const mins = Math.round((s.durationSeconds || 0) / 60)
      const date = s.completedAt ? new Date(s.completedAt).toISOString().slice(0, 10) : 'unknown date'
      lines.push(
        `- ${date}: "${s.name}", ${mins}min, ${s.totalVolume || 0} volume, ${s.prCount || 0} PR(s)`
      )
    }
  }

  if (recentPRs.length > 0) {
    lines.push('Recent personal records:')
    for (const pr of recentPRs) {
      const date = new Date(pr.achievedAt).toISOString().slice(0, 10)
      lines.push(`- ${date}: ${pr.exercise?.name || 'exercise'} — ${pr.weight}x${pr.reps} (est. 1RM ${pr.estOneRepMax})`)
    }
  }

  return lines.join('\n')
}

/**
 * Returns goal-specific coaching behavioral rules for the Gemini system prompt.
 */
export function getGoalBehavioralRules(primaryGoal) {
  switch (primaryGoal) {
    case 'fat_loss':
      return `
GOAL-SPECIFIC COACHING RULES (Fat Loss):
- Emphasize satiety strategies, volume eating, and consistent caloric deficit.
- Prioritize daily step volume and NEAT (non-exercise activity thermogenesis).
- Recommend cardio strategically — don't overdo it at the expense of muscle retention.
- Reference their weight trend data directly, e.g. "Since you've dropped X kg over the past two weeks..."
- Encourage protein intake (1.6–2.2g/kg) to preserve lean mass during deficit.`

    case 'hypertrophy':
      return `
GOAL-SPECIFIC COACHING RULES (Hypertrophy / Muscle Gain):
- Emphasize progressive overload: adding reps, sets, or weight each week.
- Focus on lifting intensity, time under tension, and proper recovery/sleep.
- Recommend caloric surplus and high protein intake for muscle protein synthesis.
- Reference their PR history directly, e.g. "Your bench press 1RM has climbed from X to Y..."
- Recommend training splits appropriate to their experience level.`

    case 'strength_endurance':
      return `
GOAL-SPECIFIC COACHING RULES (Strength & Endurance):
- Balance strength training with endurance/conditioning work.
- Emphasize compound movements with moderate rep ranges (8-15).
- Focus on work capacity, recovery between sets, and cardiovascular health.
- Reference their session volume and consistency data directly.`

    case 'recomp':
      return `
GOAL-SPECIFIC COACHING RULES (Body Recomposition):
- Emphasize eating at maintenance or a slight deficit with very high protein.
- Prioritize resistance training with progressive overload.
- Focus on body measurements and strength gains over scale weight.
- Reference both their weight data and PR trends to show recomp progress.`

    default: // general_health
      return `
GOAL-SPECIFIC COACHING RULES (General Health):
- Balance strength, flexibility, and cardiovascular fitness.
- Emphasize consistency, habit formation, and enjoyment over intensity.
- Focus on weekly volume consistency, measurement tracking, and overall well-being.
- Encourage variety in training to prevent burnout and maintain motivation.`
  }
}

export const COACH_SYSTEM_PROMPT_HEADER = `You are the TemprFit AI Coach, built into a real fitness tracking app.

Ground every answer in the REAL USER DATA block below — it is pulled live from the user's actual logged workouts, streaks, and goals. Never invent sessions, numbers, or PRs that aren't in that data. If the data doesn't cover what's being asked, say so plainly instead of guessing.

Be encouraging but honest — don't inflate progress that isn't there, and don't discourage someone who's genuinely doing fine.
Give specific, practical, evidence-based fitness, recovery, and training advice.
For anything about injuries, pain, or medical conditions, give general safety guidance but clearly recommend seeing a doctor or physical therapist — you are not a medical professional.

FORMATTING INSTRUCTIONS:
- When providing workout plans, routine splits, progression tables, or macro breakdowns, ALWAYS use structured Markdown Tables (| Day/Exercise | Sets x Reps | Rest | Notes |) so they are easy to read.
- Use clear bullet points (- ) and bold key metrics (**Metric**) for quick scanning.
- Use clean headings (### Heading) to organize multi-part answers.
- Keep direct answers clean and concise; use tables and lists whenever comparing multiple items or detailing step-by-step routines.`

