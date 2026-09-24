'use client';
import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'repforge_nudges';
const NUDGE_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours between nudges

function getNudgeState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setNudgeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function canShowNudge(nudgeId) {
  const state = getNudgeState();
  const dismissed = state.dismissed || {};
  const lastShown = state.lastShown || {};

  // If permanently dismissed, never show again
  if (dismissed[nudgeId]) return false;

  // If shown recently, wait for cooldown
  const last = lastShown[nudgeId];
  if (last && Date.now() - last < NUDGE_COOLDOWN_MS) return false;

  return true;
}

function markNudgeShown(nudgeId) {
  const state = getNudgeState();
  if (!state.lastShown) state.lastShown = {};
  state.lastShown[nudgeId] = Date.now();
  setNudgeState(state);
}

/**
 * Proactive in-app nudge engine.
 * Fires context-aware nudges based on real user data (streak status,
 * session pace, goal type). Persists dismiss/cooldown state in localStorage.
 *
 * All nudges use the branded appAlert system from Fix 5.
 */
export function useRetentionNudges({ user, stats }) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!user || !stats || hasTriggered.current) return;
    if (typeof window === 'undefined' || !window.appAlert) return;

    // Small delay so the dashboard fully renders before any popup
    const timer = setTimeout(() => {
      if (hasTriggered.current) return;

      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const userName = user.username || user.name || '';
      const firstName = userName.split(' ')[0] || 'there';

      const sessionsGoal = stats?.goals?.weeklySessions || 4;
      const sessionsThisWeek = stats?.sessionsThisWeek ?? 0;
      const currentStreak = Math.max(stats?.currentStreak || 0, user.totalCheckInStreak || 0);

      // 1. Streak Saver — after 2pm if they haven't worked out today and have an active streak
      if (
        hour >= 14 &&
        currentStreak > 0 &&
        sessionsThisWeek < sessionsGoal &&
        canShowNudge('streak_saver')
      ) {
        window.appAlert(
          `Hey ${firstName}, you're 1 session away from preserving your ${currentStreak}-day streak! Ready for a quick 15-minute workout?`
        );
        markNudgeShown('streak_saver');
        hasTriggered.current = true;
        return;
      }

      // 2. Behind-pace mid-week check — Wednesday+ and behind half their target
      if (
        dayOfWeek >= 3 &&
        sessionsThisWeek < Math.floor(sessionsGoal / 2) &&
        canShowNudge('behind_pace')
      ) {
        window.appAlert(
          `You've completed ${sessionsThisWeek} of ${sessionsGoal} sessions this week. Let's catch up — your AI Coach can generate a quick routine for you!`
        );
        markNudgeShown('behind_pace');
        hasTriggered.current = true;
        return;
      }

      // 3. Goal-specific protein/nutrition nudge (hypertrophy & fat_loss only)
      const primaryGoal = user.fitnessProfile?.primaryGoal;
      if (
        (primaryGoal === 'hypertrophy' || primaryGoal === 'fat_loss') &&
        hour >= 12 &&
        canShowNudge('protein_check')
      ) {
        const msg = primaryGoal === 'fat_loss'
          ? `Quick check — did you stay within your calorie target today? Logging meals helps keep your deficit on track.`
          : `Quick check — did you hit your protein goal today? Consistent intake is key for muscle growth.`;
        window.appAlert(msg);
        markNudgeShown('protein_check');
        hasTriggered.current = true;
        return;
      }

      // 4. Milestone celebration — if they just hit a 10-session or 25-session mark
      const totalSessions = stats?.totalSessions || 0;
      const milestones = [10, 25, 50, 100, 200, 500];
      for (const ms of milestones) {
        if (totalSessions >= ms && totalSessions < ms + 3 && canShowNudge(`milestone_${ms}`)) {
          window.appAlert(
            `🎉 Incredible, ${firstName}! You've completed ${totalSessions} workouts! That's a serious milestone — keep pushing!`
          );
          markNudgeShown(`milestone_${ms}`);
          hasTriggered.current = true;
          return;
        }
      }

      // 5. Next-day prep — after 8pm, gentle reminder
      if (hour >= 20 && canShowNudge('next_day_prep')) {
        window.appAlert(
          `Tomorrow's a new opportunity! Check your saved workout plans or ask the AI Coach to prep your routine for the morning.`
        );
        markNudgeShown('next_day_prep');
        hasTriggered.current = true;
        return;
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, stats]);
}
