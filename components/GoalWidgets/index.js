'use client';
import React, { useState } from 'react';
import { Target, Activity, Droplets, Moon, Map, Zap, TrendingUp, Ruler } from 'lucide-react';
import styles from './GoalWidgets.module.css';

export function FatLossDashboard({ user, stats }) {
  const currentWt = user?.fitnessProfile?.bodyMetrics?.currentWeightKg || null;
  const targetWt = user?.fitnessProfile?.bodyMetrics?.targetWeightKg || null;
  const diff = currentWt && targetWt ? currentWt - targetWt : null;
  const progressPct = currentWt && targetWt && currentWt > targetWt 
    ? Math.min(100, Math.max(0, ((100 - targetWt) / (currentWt - targetWt)) * 100))
    : 0;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.rootWidget}>
        <h3><Target size={18} /> Transformation Overview</h3>
        <div className={styles.transformationGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Current</span>
            <span className={styles.statValue}>{currentWt || '--'} kg</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>To Lose</span>
            <span className={styles.statValue}>{diff > 0 ? diff.toFixed(1) : '--'} kg</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Target</span>
            <span className={styles.statValue}>{targetWt || '--'} kg</span>
          </div>
        </div>
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBarFill} style={{ width: `${progressPct}%`, background: '#ef4444' }} />
        </div>
      </div>
      
      <div className={styles.sideWidgets}>
        <div className={styles.smallWidget}>
          <h4>Est. Calories (7d)</h4>
          <div className={styles.widgetVal}>{stats?.caloriesThisWeek?.toLocaleString() || '--'} <span style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>kcal</span></div>
        </div>
        <div className={styles.smallWidget}>
          <h4>Sessions This Week</h4>
          <div className={styles.widgetVal}>{stats?.sessionsThisWeek ?? '--'} <span style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>/ {stats?.goals?.weeklySessions || 4}</span></div>
        </div>
      </div>
    </div>
  );
}

export function HypertrophyDashboard({ user, stats }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const totalSessions = stats?.totalSessions || 0;
  
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.rootWidget}>
        <h3><Activity size={18} /> Weekly Volume Heat Map</h3>
        <div className={styles.heatMapGrid}>
          {days.map((day, i) => (
            <div key={day} className={styles.heatDay}>
              <div className={styles.heatSquare} style={{ opacity: Math.max(0.15, Math.min(1, (totalSessions > 0 ? 0.3 + (i % 3) * 0.25 : 0.15))) }} />
              <span>{day}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.sideWidgets}>
        <div className={styles.smallWidget} style={{ flex: 1 }}>
          <h4>Strength Progress</h4>
          <div className={styles.recoveryList}>
            {stats?.recentPRs?.length > 0 ? (
              stats.recentPRs.slice(0, 3).map((pr, i) => (
                <div key={i} className={styles.recoveryRow}>
                  <span>{pr.exerciseName}</span>
                  <span style={{color: '#22c55e', fontWeight: 700}}>{pr.estOneRepMax} {user?.weightUnit || 'lbs'}</span>
                </div>
              ))
            ) : (
              <>
                <div className={styles.recoveryRow}><span>No PRs yet</span> <span style={{color: 'var(--color-text-muted)'}}>--</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StrengthEnduranceDashboard({ user, stats }) {
  const totalVolume = stats?.totalVolume || 0;
  const workoutMins = stats?.workoutSecondsThisWeek ? Math.round(stats.workoutSecondsThisWeek / 60) : 0;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.rootWidget}>
        <h3><Zap size={18} /> Strength & Endurance Overview</h3>
        <div className={styles.transformationGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Total Volume</span>
            <span className={styles.statValue}>{totalVolume.toLocaleString()} <span style={{fontSize: '0.7rem'}}>kg</span></span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Workout Time</span>
            <span className={styles.statValue}>{workoutMins}m</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Sessions</span>
            <span className={styles.statValue}>{stats?.sessionsThisWeek ?? 0} <span style={{fontSize: '0.7rem'}}>this week</span></span>
          </div>
        </div>
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBarFill} style={{ width: `${Math.min(100, (stats?.sessionsThisWeek || 0) / (stats?.goals?.weeklySessions || 4) * 100)}%`, background: '#f97316' }} />
        </div>
      </div>
      
      <div className={styles.sideWidgets}>
        <div className={styles.smallWidget}>
          <h4>Streak</h4>
          <div className={styles.widgetVal} style={{color: '#f59e0b'}}>{Math.max(stats?.currentStreak || 0, user?.totalCheckInStreak || 0)} <span style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>days</span></div>
        </div>
        <div className={styles.smallWidget}>
          <h4>Total Sessions</h4>
          <div className={styles.widgetVal}>{stats?.totalSessions || 0}</div>
        </div>
      </div>
    </div>
  );
}

export function RecompDashboard({ user, stats }) {
  const currentWt = user?.fitnessProfile?.bodyMetrics?.currentWeightKg || 0;
  const best1RM = stats?.currentBest1RM || 0;
  const targetExName = stats?.targetExercise?.name || 'Main Lift';

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.rootWidget}>
        <h3><TrendingUp size={18} /> Body Recomposition Tracker</h3>
        <div className={styles.transformationGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Body Weight</span>
            <span className={styles.statValue}>{currentWt || '--'} kg</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Est. 1RM</span>
            <span className={styles.statValue}>{best1RM || '--'} {user?.weightUnit || 'lbs'}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>{targetExName}</span>
            <span className={styles.statValue} style={{fontSize: '0.9rem', color: '#22c55e'}}>Target Lift</span>
          </div>
        </div>
        <p style={{fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '12px'}}>
          Focus: maintain scale weight while strength numbers climb. Track measurements, not just weight.
        </p>
      </div>
      
      <div className={styles.sideWidgets}>
        <div className={styles.smallWidget}>
          <h4>Weekly Volume</h4>
          <div className={styles.widgetVal}>{stats?.sessionsThisWeek ?? 0} <span style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>sessions</span></div>
        </div>
        <div className={styles.smallWidget}>
          <h4>Consistency</h4>
          <div className={styles.widgetVal} style={{color: '#a855f7'}}>{Math.max(stats?.currentStreak || 0, user?.totalCheckInStreak || 0)}d <span style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>streak</span></div>
        </div>
      </div>
    </div>
  );
}

export function GeneralHealthDashboard({ user, stats }) {
  const [water, setWater] = useState(3);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.rootWidget}>
        <h3><Map size={18} /> Consistency Calendar</h3>
        <div className={styles.calendarGrid}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className={styles.calDay} style={{ background: i % 3 === 0 ? 'rgba(34,197,94,0.2)' : 'var(--color-surface)' }}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.sideWidgets}>
        <div className={styles.smallWidget}>
          <h4><Droplets size={16} color="#3b82f6"/> Water Tracker</h4>
          <div className={styles.waterControls}>
            <button onClick={() => setWater(Math.max(0, water - 1))}>-</button>
            <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{water} L</span>
            <button onClick={() => setWater(water + 1)}>+</button>
          </div>
        </div>
        <div className={styles.smallWidget}>
          <h4><Moon size={16} color="#a855f7" /> Sleep</h4>
          <div className={styles.widgetVal}>7.5 hrs</div>
        </div>
      </div>
    </div>
  );
}

