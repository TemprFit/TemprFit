'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Dumbbell, Trophy, Flame, Calendar, Sparkles, RefreshCw, Clock, Zap } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ChartWidget from '@/components/ChartWidget';
import styles from './progress.module.css';

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [signedIn, setSignedIn] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [report, setReport] = useState(null); // undefined until first load
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const load = (exerciseSlug) => {
    const url = exerciseSlug ? `/api/progress?exercise=${encodeURIComponent(exerciseSlug)}` : '/api/progress';
    fetch(url)
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then((d) => {
        setData(d);
        setSelectedExercise(d.activeExerciseSlug || '');
      })
      .catch((e) => {
        if (e.message === 'signin') setSignedIn(false);
      });
  };

  useEffect(() => load(), []);

  useEffect(() => {
    fetch('/api/coach/weekly-report')
      .then((r) => (r.ok ? r.json() : { report: null }))
      .then((d) => setReport(d.report))
      .catch(() => setReport(null));
  }, []);

  const generateReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      const res = await fetch('/api/coach/weekly-report', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) {
        setReportError(d.error || 'Could not generate the report.');
        return;
      }
      setReport(d.report);
    } finally {
      setReportLoading(false);
    }
  };

  if (!signedIn) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container">
            <div className={styles.empty}>
              <p>Sign in to see your progress.</p>
              <Link href="/login" className={styles.primaryBtn}>Sign In</Link>
            </div>
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
            <h1>Progress</h1>
            <p>Trends and analytics built from your actual completed workouts.</p>
          </div>

          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <div className={styles.reportTitle}>
                <Sparkles size={18} style={{ color: '#a855f7' }} />
                <h3>Weekly Report</h3>
              </div>
              <button className={styles.reportBtn} onClick={generateReport} disabled={reportLoading}>
                <RefreshCw size={14} className={reportLoading ? styles.spin : ''} />
                {reportLoading ? 'Generating…' : report ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {reportError && <p className={styles.reportError}>{reportError}</p>}
            {report ? (
              <>
                <p className={styles.reportSummary}>{report.summary}</p>
                <div className={styles.reportRecommendation}>
                  <strong>Next week:</strong> {report.recommendation}
                </div>
              </>
            ) : (
              !reportError && <p className={styles.reportEmpty}>No report generated yet this week — click Generate for an AI recap of your week and a suggestion for what's next.</p>
            )}
          </div>

          {data && !data.hasHistory && (
            <div className={styles.empty}>
              <TrendingUp size={26} />
              <p>No completed workouts yet — finish a session to start seeing trends here.</p>
              <Link href="/workouts" className={styles.primaryBtn}>Start a workout</Link>
            </div>
          )}

          {data && data.hasHistory && (
            <>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <Dumbbell size={20} style={{ color: '#22c55e' }} />
                  <div>
                    <span className={styles.statValue}>{data.totalSessions}</span>
                    <span className={styles.statLabel}>Total Sessions</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Flame size={20} style={{ color: '#f97316' }} />
                  <div>
                    <span className={styles.statValue}>{data.totalVolumeAllTime.toLocaleString()}</span>
                    <span className={styles.statLabel}>Total Volume Lifted (kg)</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Trophy size={20} style={{ color: '#a855f7' }} />
                  <div>
                    <span className={styles.statValue}>{data.totalPRs}</span>
                    <span className={styles.statLabel}>Personal Records</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Calendar size={20} style={{ color: '#06b6d4' }} />
                  <div>
                    <span className={styles.statValue}>{data.currentStreak}d</span>
                    <span className={styles.statLabel}>Current Streak (best: {data.longestStreak}d)</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Clock size={20} style={{ color: '#f59e0b' }} />
                  <div>
                    <span className={styles.statValue}>{Math.floor((data.totalTimeMinutes || 0) / 60)}h {(data.totalTimeMinutes || 0) % 60}m</span>
                    <span className={styles.statLabel}>Total Time Training</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Zap size={20} style={{ color: '#ef4444' }} />
                  <div>
                    <span className={styles.statValue}>{(data.totalCaloriesBurned || 0).toLocaleString()}</span>
                    <span className={styles.statLabel}>Est. Calories Burned (kcal)</span>
                  </div>
                </div>
              </div>

              <div className={styles.chartsRow}>
                <ChartWidget data={data.volumeByWeek} type="bar" title="Volume by Week (12 wks)" color="#22c55e" />
                <ChartWidget data={data.sessionsByWeek} type="bar" title="Sessions by Week (12 wks)" color="#06b6d4" />
              </div>

              <div className={styles.strengthSection}>
                <div className={styles.strengthHeader}>
                  <h3>Strength Progression</h3>
                  {data.exerciseOptions.length > 0 && (
                    <select
                      value={selectedExercise}
                      onChange={(e) => { setSelectedExercise(e.target.value); load(e.target.value); }}
                      className={styles.select}
                    >
                      {data.exerciseOptions.map((opt) => (
                        <option key={opt.slug} value={opt.slug}>{opt.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {data.strengthHistory.length > 0 ? (
                  <>
                    <ChartWidget
                      data={data.strengthHistory}
                      type="line"
                      title="Estimated 1-Rep Max Over Time"
                      color="#a855f7"
                    />
                    <div className={styles.prTable}>
                      <div className={styles.prTableHeader}>
                        <span>Date</span>
                        <span>Weight × Reps</span>
                        <span>Est. 1RM</span>
                      </div>
                      {data.strengthHistory.slice().reverse().map((pr, i) => (
                        <div key={i} className={styles.prTableRow}>
                          <span>{pr.label}</span>
                          <span>{pr.weight} × {pr.reps}</span>
                          <span className={styles.prValue}>{pr.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={styles.noData}>No PRs logged for this exercise yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
