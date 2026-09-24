'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity, Flame, Timer, Trophy, TrendingUp, TrendingDown,
  Dumbbell, Calendar, Target, Zap, Star, Shield, Medal, Award, CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChartWidget from '@/components/ChartWidget';
import WeightTracker from '@/components/WeightTracker';
import AIModal from '@/components/AIModal';
import HealthGraphs from '@/components/HealthGraphs';
import DashboardMeals from '@/components/DashboardMeals';
import MysteryBoxModal from '@/components/MysteryBoxModal';
import WearablesSync from '@/components/WearablesSync';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import { FatLossDashboard, HypertrophyDashboard, StrengthEnduranceDashboard, RecompDashboard, GeneralHealthDashboard } from '@/components/GoalWidgets';
import { useRetentionNudges } from '@/hooks/useRetentionNudges';
import { displayName } from '@/lib/utils';
import styles from './page.module.css';

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function Dashboard() {
  const router = useRouter();
  const [aiOpen, setAiOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [escrows, setEscrows] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [signedIn, setSignedIn] = useState(true);
  const [showFirstWelcome, setShowFirstWelcome] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showMysteryBox, setShowMysteryBox] = useState(false);

  const handleCheckIn = async () => {
    if (checkedIn) return;
    try {
      const res = await fetch('/api/user/checkin', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCheckedIn(true);
        window.appAlert(`Daily check-in complete! You earned ${data.xpAward} XP. Streak: ${data.totalCheckInStreak} days. Total XP: ${data.xp}`);
        if (user) {
          setUser({ 
            ...user, 
            xp: data.xp, 
            lastCheckInDate: data.lastCheckInDate,
            checkInStreak: data.checkInStreak,
            totalCheckInStreak: data.totalCheckInStreak
          });
          
          if (stats) {
            setStats(prev => ({
              ...prev,
              totalCheckInStreak: data.totalCheckInStreak
            }));
          }
        }
        
        // Trigger Mystery Box if they hit a 7-day milestone
        if (data.checkInStreak > 0 && data.checkInStreak % 7 === 0) {
          setShowMysteryBox(true);
        }
      } else {
        window.appAlert(data.error || 'Whoops! We couldn\'t log your daily check-in. Give it another try!');
      }
    } catch (e) {
      window.appAlert('Whoops! We couldn\'t log your daily check-in. Give it another try!');
    }
  };

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        // Redirect approved trainers to their dedicated dashboard if they are in trainer mode
        const activeMode = typeof window !== 'undefined' ? localStorage.getItem('activeMode') : 'trainee';
        if (data.user?.role === 'trainer' && data.user?.trainerInfo?.isApproved && activeMode === 'trainer') {
          router.replace('/trainer-dashboard');
          return;
        }
        setUser(data.user);
        
        if (data.user && !data.user.hasCompletedOnboarding) {
          router.replace('/onboarding');
          return;
        }

        // Check if user already checked in today
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (data.user?.lastCheckInDate === todayStr) {
          setCheckedIn(true);
        }

        // First-ever dashboard visit gets a distinct greeting. The flag is
        // flipped server-side right after we read it here, so a refresh
        // (even an immediate one) correctly shows "Welcome back" from then on.
        if (data.user && !data.user.firstLoginCompleted) {
          setShowFirstWelcome(true);
          fetch('/api/user/first-login', { method: 'POST' }).catch(() => {});
        }
      });

    fetch('/api/stats', { cache: 'no-store' })
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then(setStats)
      .catch((e) => {
        if (e.message === 'signin') setSignedIn(false);
      });

    // Fetch active escrows
    fetch('/api/escrow?status=held', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.transactions) setEscrows(data.transactions);
      })
      .catch(() => {});

    // Fetch AI workouts
    fetch('/api/workouts/generate', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.plans) setSavedWorkouts(data.plans.slice(0, 3));
      })
      .catch(() => {});
  }, [router]);



  const sessionsGoal = stats?.goals?.weeklySessions || 4;
  const sessionsThisWeek = stats?.sessionsThisWeek ?? 0;
  const sessionsPct = Math.min(100, Math.round((sessionsThisWeek / sessionsGoal) * 100));

  const targetWeight = stats?.goals?.targetWeight;
  const currentBest1RM = stats?.currentBest1RM;
  const liftPct =
    targetWeight && currentBest1RM
      ? Math.min(100, Math.round((currentBest1RM / targetWeight) * 100))
      : null;

  const primaryGoal = user?.fitnessProfile?.primaryGoal || 'general_health';

  useRetentionNudges({ user, stats });

  if (!signedIn) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container">
            <p style={{ padding: '60px 0', textAlign: 'center' }}>
              Sign in to see your dashboard. <Link href="/login" style={{ color: '#22c55e' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Dashboard</h1>
              <p className={styles.subtitle}>
                {user ? (
                  <>
                    {showFirstWelcome ? 'Welcome to your new dashboard, ' : 'Welcome back, '}
                    <span style={{ color: user.activeColor || 'inherit', fontWeight: 'bold' }}>
                      {displayName(user).split(' ')[0]}
                    </span>
                    ! Here is your fitness overview.
                  </>
                ) : (
                  'Here is your fitness overview.'
                )}
              </p>
              {user && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={14} /> {user.xp || 0} XP
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={14} /> {Math.max(stats?.currentStreak || 0, user.totalCheckInStreak || 0)} Day Streak
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                className={styles.aiBtn} 
                style={{ background: checkedIn ? 'var(--color-surface-elevated)' : 'var(--color-primary)', color: checkedIn ? 'var(--color-text-muted)' : '#000' }}
                onClick={handleCheckIn}
                disabled={checkedIn}
              >
                <CheckCircle size={18} /> {checkedIn ? 'Checked In' : 'Daily Check-in'}
              </button>
              <button className={styles.aiBtn} onClick={() => setAiOpen(true)} data-tour="tour-ai" style={{ background: 'var(--color-primary)', color: '#000' }}>
                <Zap size={18} /> Ask AI Coach
              </button>
            </div>
          </div>

          {/* Goal-Driven Dynamic Dashboard Engine */}
          {primaryGoal === 'fat_loss' && <FatLossDashboard user={user} stats={stats} />}
          {primaryGoal === 'hypertrophy' && <HypertrophyDashboard user={user} stats={stats} />}
          {primaryGoal === 'strength_endurance' && <StrengthEnduranceDashboard user={user} stats={stats} />}
          {primaryGoal === 'recomp' && <RecompDashboard user={user} stats={stats} />}
          {primaryGoal === 'general_health' && <GeneralHealthDashboard user={user} stats={stats} />}

          <div className={styles.quickStats} data-tour="tour-quickstats">
            <div className={styles.qsCard}>
              <div className={styles.qsIcon} style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
                <Timer size={22} />
              </div>
              <div>
                <span className={styles.qsValue}>{stats ? formatDuration(stats.workoutSecondsThisWeek) : '—'}</span>
                <span className={styles.qsLabel}>Workout Time (7d)</span>
              </div>
            </div>
            <div className={styles.qsCard}>
              <div className={styles.qsIcon} style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
                <Dumbbell size={22} />
              </div>
              <div>
                <span className={styles.qsValue}>{stats ? stats.totalSessions : '—'}</span>
                <span className={styles.qsLabel}>Total Sessions</span>
              </div>
            </div>
            <div className={styles.qsCard}>
              <div className={styles.qsIcon} style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                <Trophy size={22} />
              </div>
              <div>
                <span className={styles.qsValue}>{Math.max(stats?.currentStreak || 0, user?.totalCheckInStreak || 0)}</span>
                <span className={styles.qsLabel}>Active Streak</span>
              </div>
            </div>
          </div>

          <ActivityHeatmap data={stats?.activityHeatmap || []} days={84} />

          {stats && stats.totalSessions === 0 && (
            <div className={styles.emptyBanner}>
              <p>No completed workouts yet — once you finish your first session, your real stats and charts show up here.</p>
              <Link href="/workouts" className={styles.aiBtn} style={{ background: 'var(--color-primary)', color: '#000' }}>Start a workout</Link>
            </div>
          )}

          <div className={styles.chartsRow} data-tour="tour-charts">
            <ChartWidget
              data={stats ? stats.weeklyVolume : Array(8).fill({ value: 0 })}
              type="bar"
              title="Weekly Volume (last 8 weeks)"
              color="#22c55e"
            />
            <ChartWidget
              data={stats && stats.strengthTrend.length > 1 ? stats.strengthTrend : Array(8).fill({ value: 0 })}
              type="line"
              title={stats?.targetExercise ? `Est. 1RM — ${stats.targetExercise.name}` : 'Strength Progress'}
              color="#06b6d4"
            />
          </div>
          
          <div data-tour="tour-meals">
            <DashboardMeals />
          </div>

          <div className={styles.trackerSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gridColumn: '1 / -1' }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Body Metrics & Tracking</h3>
              <Link href="/progress-timeline" style={{ color: '#22c55e', fontSize: '0.9rem', fontWeight: 600 }}>View Photo Timeline &rarr;</Link>
            </div>
            <WeightTracker />
            <WearablesSync />
          </div>

          <div className={styles.goalsSection}>
            <h3 className={styles.sectionTitle}>Active Goals</h3>
            <div className={styles.goalsGrid}>
              <div className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <Target size={18} style={{ color: '#22c55e' }} />
                  <span>{stats?.targetExercise?.name || 'Set a lift goal'} PR</span>
                </div>
                {targetWeight ? (
                  <>
                    <div className={styles.goalProgress}>
                      <div className={styles.goalBar}>
                        <div className={styles.goalFill} style={{ width: `${liftPct ?? 0}%` }} />
                      </div>
                      <span className={styles.goalPercent}>{liftPct ?? 0}%</span>
                    </div>
                    <span className={styles.goalTarget}>
                      Target: {targetWeight} {user?.weightUnit || 'lbs'} | Current: {currentBest1RM ?? '—'} {user?.weightUnit || 'lbs'} (est. 1RM)
                    </span>
                  </>
                ) : (
                  <span className={styles.goalTarget}>
                    No target set yet — <Link href="/settings" style={{ color: '#22c55e' }}>set one in Settings</Link>.
                  </span>
                )}
              </div>

              <div className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <Calendar size={18} style={{ color: '#f97316' }} />
                  <span>Weekly Sessions</span>
                </div>
                <div className={styles.goalProgress}>
                  <div className={styles.goalBar}>
                    <div className={styles.goalFill} style={{ width: `${sessionsPct}%` }} />
                  </div>
                  <span className={styles.goalPercent}>{sessionsPct}%</span>
                </div>
                <span className={styles.goalTarget}>Target: {sessionsGoal} | Current: {sessionsThisWeek}</span>
              </div>

              <div className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <Activity size={18} style={{ color: '#06b6d4' }} />
                  <span>Longest Streak</span>
                </div>
                <div className={styles.goalProgress}>
                  <div className={styles.goalBar}>
                    <div className={styles.goalFill} style={{ width: Math.max(stats?.longestStreak || 0, stats?.longestCheckInStreak || 0) ? '100%' : '0%' }} />
                  </div>
                  <span className={styles.goalPercent}>{Math.max(stats?.longestStreak || 0, stats?.longestCheckInStreak || 0)}d</span>
                </div>
                <span className={styles.goalTarget}>Current streak: {Math.max(stats?.currentStreak || 0, user?.totalCheckInStreak || 0)} days</span>
              </div>
            </div>
          </div>

          {/* Gamification: Badges Showcase */}
          <div className={styles.goalsSection} style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Achievements & Badges</h3>
              <Link href="/badges" style={{ color: '#22c55e', fontSize: '0.9rem', fontWeight: 600 }}>See All / Shop &rarr;</Link>
            </div>
            <div className={styles.badgesGrid}>
              <div className={`${styles.badgeCard} ${stats?.totalSessions >= 1 ? styles.badgeUnlocked : styles.badgeLocked}`}>
                {stats?.totalSessions >= 1 && <div className={styles.badgeCheck}><CheckCircle size={16} /></div>}
                <div className={styles.badgeIconWrap}><Star size={24} /></div>
                <h4>First Step</h4>
                <p>Complete 1 workout</p>
              </div>
              <div className={`${styles.badgeCard} ${stats?.currentStreak >= 3 ? styles.badgeUnlocked : styles.badgeLocked}`}>
                {stats?.currentStreak >= 3 && <div className={styles.badgeCheck}><CheckCircle size={16} /></div>}
                <div className={styles.badgeIconWrap}><Flame size={24} /></div>
                <h4>On Fire</h4>
                <p>Reach a 3-day streak</p>
              </div>
              <div className={`${styles.badgeCard} ${stats && stats.totalVolume >= 10000 ? styles.badgeUnlocked : styles.badgeLocked}`}>
                {stats && stats.totalVolume >= 10000 && <div className={styles.badgeCheck}><CheckCircle size={16} /></div>}
                <div className={styles.badgeIconWrap}><Shield size={24} /></div>
                <h4>Heavy Lifter</h4>
                <p>Lift 10,000kg total</p>
              </div>
              <div className={`${styles.badgeCard} ${stats?.totalSessions >= 10 ? styles.badgeUnlocked : styles.badgeLocked}`}>
                {stats?.totalSessions >= 10 && <div className={styles.badgeCheck}><CheckCircle size={16} /></div>}
                <div className={styles.badgeIconWrap}><Medal size={24} /></div>
                <h4>Consistent</h4>
                <p>Complete 10 workouts</p>
              </div>
              <div className={`${styles.badgeCard} ${user?.badges?.some(b => b.badgeId === 'ai_pioneer') ? styles.badgeUnlocked : styles.badgeLocked}`}>
                {user?.badges?.some(b => b.badgeId === 'ai_pioneer') && <div className={styles.badgeCheck}><CheckCircle size={16} /></div>}
                <div className={styles.badgeIconWrap}><Zap size={24} /></div>
                <h4>AI Pioneer</h4>
                <p>Use the AI Coach 3x</p>
              </div>
            </div>
          </div>

          {escrows.length > 0 && (
            <div className={styles.goalsSection} style={{ marginTop: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Active Training Bookings</h3>
                <Link href="/escrow" style={{ color: '#22c55e', fontSize: '0.9rem', fontWeight: 600 }}>Manage All Escrows &rarr;</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {escrows.map(escrow => {
                  const trainerName = escrow.trainer?.username || 'Trainer';

                  return (
                    <div key={escrow._id} style={{ background: 'var(--color-bg-elevated)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ marginBottom: '8px' }}>Training with {trainerName}</h4>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>{escrow.description || 'Program'}</p>
                        <div style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 600, marginTop: '8px' }}>
                          ${escrow.amount.toFixed(2)} in Escrow
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Link
                          href={`/escrow/${escrow._id}`}
                          style={{ background: '#22c55e', color: '#000', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
                        >
                          Manage Escrow
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {savedWorkouts.length > 0 && (
            <div className={styles.goalsSection} style={{ marginTop: '40px' }}>
              <h3 className={styles.sectionTitle}>Recent AI Workouts</h3>
              <div className={styles.goalsGrid}>
                {savedWorkouts.map(plan => (
                  <div key={plan._id} className={styles.goalCard} style={{ cursor: 'pointer' }} onClick={() => router.push('/workouts/ai')}>
                    <div className={styles.goalHeader}>
                      <Zap size={18} style={{ color: '#3b82f6' }} />
                      <span>{plan.goal}</span>
                    </div>
                    <span className={styles.goalTarget}>
                      {plan.days.length} Days • {plan.equipment}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '8px' }}>
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!user?.trainerInfo && user?.role !== 'trainer' && user?.originalRole !== 'trainer' && (
            <div style={{ marginTop: '40px', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.1))', padding: '32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#22c55e' }}>Are you a fitness professional?</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Join the TemprFit Trainer Network to coach clients and earn money.</p>
              </div>
              <Link href="/become-trainer" style={{ background: 'var(--color-primary)', color: '#000', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}>
                Become a Trainer
              </Link>
            </div>
          )}

        </div>
      </div>
      <AIModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      <MysteryBoxModal 
        isOpen={showMysteryBox} 
        onClose={() => setShowMysteryBox(false)} 
        onOpenBox={(reward) => {
          if (reward.type === 'xp') {
            setUser(prev => ({ ...prev, xp: prev.xp + reward.value }));
          }
        }}
      />
    </div>
  );
}
