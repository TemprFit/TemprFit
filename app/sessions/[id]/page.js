'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Check, SkipForward, Repeat2,
  Trophy, Flame, Clock, Lightbulb, Share2
} from 'lucide-react';
import ExercisePreview from '@/components/ExercisePreview';
import SetRow from '@/components/SetRow';
import RestTimer from '@/components/RestTimer';
import VoiceLogger from '@/components/VoiceLogger';
import VoiceCoach from '@/components/VoiceCoach';
import ExerciseSwapModal from '@/components/ExerciseSwapModal';
import SocialShareModal from '@/components/SocialShareModal';
import { saveWorkoutLocally } from '@/lib/offlineSync';
import styles from './session.module.css';

export default function WorkoutSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoSpeakPrompt, setAutoSpeakPrompt] = useState('');
  
  const [restSeconds, setRestSeconds] = useState(null);
  
  const [summary, setSummary] = useState(null);
  const [finishing, setFinishing] = useState(false);
  
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const saveTimer = useRef(null);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session);
          // Auto-advance to first uncompleted exercise
          let exIdx = 0;
          for (let i = 0; i < data.session.exercises.length; i++) {
            if (!data.session.exercises[i].skipped) {
              const sets = data.session.exercises[i].sets;
              if (sets.some(s => !s.completed)) {
                exIdx = i;
                break;
              }
            }
          }
          setCurrentIndex(exIdx);
        } else {
          setError(data.error || 'Session not found.');
        }
      })
      .catch(() => setError('Something went wrong.'));
  }, [id]);

  useEffect(() => {
    if (session && session.exercises[currentIndex]?.exercise) {
      setAutoSpeakPrompt(`Moving on to ${session.exercises[currentIndex].exercise.name}. Let's crush this!`);
    }
  }, [currentIndex, session?.exercises?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const autosave = (nextExercises) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises: nextExercises }),
      }).catch(() => {});
    }, 500);
  };

  const updateSet = (exIdx, setIdx, updates) => {
    setSession((prev) => {
      const exercises = [...prev.exercises];
      const sets = [...exercises[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], ...updates };
      exercises[exIdx] = { ...exercises[exIdx], sets };
      autosave(exercises);
      return { ...prev, exercises };
    });
  };

  const skipExercise = () => {
    setSession((prev) => {
      const exercises = [...prev.exercises];
      exercises[currentIndex] = { ...exercises[currentIndex], skipped: true };
      autosave(exercises);
      return { ...prev, exercises };
    });
    goNext();
  };

  const goNext = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (currentIndex < session.exercises.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };
  
  const goPrev = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  const finish = async () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setFinishing(true);
    
    const payload = { exercises: session.exercises, id };
    
    // Check if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveWorkoutLocally(payload);
      setSummary({ session: { durationSeconds: 0, totalVolume: 0, prCount: 0, offline: true } });
      setAutoSpeakPrompt("Workout saved offline! We'll sync it when you reconnect.");
      setFinishing(false);
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary(data);
      setAutoSpeakPrompt("Workout complete! Awesome job today!");
    } catch (err) {
      // If network fails during fetch, save offline
      await saveWorkoutLocally(payload);
      setSummary({ session: { durationSeconds: 0, totalVolume: 0, prCount: 0, offline: true } });
      setAutoSpeakPrompt("Network error. Workout saved offline! We'll sync it when you reconnect.");
    }
    setFinishing(false);
  };
  
  const handleSetComplete = (setIdx, data, restTime) => {
    updateSet(currentIndex, setIdx, { ...data, completed: true });
    
    // Trigger rest timer
    if (restTime > 0) {
      setRestSeconds(restTime);
      setAutoSpeakPrompt(`Great set. Rest for ${restTime} seconds.`);
    } else {
      setAutoSpeakPrompt(`Great set.`);
      checkExerciseComplete(setIdx);
    }
  };

  const checkExerciseComplete = (justCompletedSetIdx) => {
    const cur = session.exercises[currentIndex];
    const allCompleted = cur.sets.every((s, i) => s.completed || i === justCompletedSetIdx);
    if (allCompleted) {
       goNext();
    }
  };

  const handleRestComplete = () => {
    setRestSeconds(null);
    setAutoSpeakPrompt("Rest is over! Get back in position.");
    
    // Auto advance if we just finished the last set before this rest
    const cur = session.exercises[currentIndex];
    if (cur && cur.sets.every(s => s.completed)) {
      goNext();
    }
  };

  const handleVoiceLog = (data) => {
    // Find first uncompleted set
    const cur = session.exercises[currentIndex];
    const idx = cur.sets.findIndex(s => !s.completed);
    if (idx !== -1) {
      handleSetComplete(idx, data, cur.sets[idx].restSeconds || 60);
    }
  };

  const handleSwap = (alt) => {
    setSession((prev) => {
      const exercises = [...prev.exercises];
      exercises[currentIndex] = { ...exercises[currentIndex], exercise: alt, replaced: true };
      autosave(exercises);
      return { ...prev, exercises };
    });
    setSwapModalOpen(false);
  };

  if (error) return <div className={styles.page}><div className="container"><p className={styles.error}>{error}</p></div></div>;
  if (!session) return <div className={styles.page}><div className="container"><p className={styles.loading}>Loading...</p></div></div>;

  if (summary) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.summaryCard}>
            <Trophy size={40} className={styles.summaryIcon} />
            <h1>Workout Complete</h1>
            <div className={styles.summaryStats}>
              <div>
                <Clock size={16} /> 
                {summary.session.durationSeconds < 60 
                  ? `${summary.session.durationSeconds}s` 
                  : `${Math.floor(summary.session.durationSeconds / 60)}m ${summary.session.durationSeconds % 60}s`}
              </div>
              <div><Flame size={16} /> {summary.session.totalVolume} kg total volume</div>
              {summary.session.prCount > 0 && (
                <div className={styles.prStat}><Trophy size={16} /> {summary.session.prCount} new PR{summary.session.prCount > 1 ? 's' : ''}!</div>
              )}
            </div>
            <div className={styles.summaryActions}>
              <Link href="/history" className={styles.secondaryBtn}>View History</Link>
              <button 
                className={styles.primaryBtn} 
                onClick={() => setShareOpen(true)} 
                style={{ background: 'linear-gradient(135deg, #a855f7, #06b6d4)', display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
              >
                <Share2 size={16} /> Share Workout
              </button>
              <Link href="/workouts" className={styles.primaryBtn}>Back to Workouts</Link>
            </div>
          </div>
        </div>
        <SocialShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} stats={summary.session} />
      </div>
    );
  }

  const current = session.exercises[currentIndex];
  
  const isBodyweight = current?.exercise?.name?.toLowerCase().includes('pushup') || current?.exercise?.name?.toLowerCase().includes('pull up') || current?.exercise?.name?.toLowerCase().includes('bodyweight');
  const isTimeBased = current?.exercise?.name?.toLowerCase().includes('plank') || current?.exercise?.name?.toLowerCase().includes('hold') || current?.exercise?.name?.toLowerCase().includes('wall sit');

  return (
    <div className={styles.page}>
      <div className="container" style={{ paddingBottom: '100px' }}>
        <div className={styles.progressBar}>
          Exercise {currentIndex + 1} of {session.exercises.length}
        </div>

        <div className={styles.tipsCard}>
          <div className={styles.tipsHeader}>
            <Lightbulb size={18} className={styles.tipsIcon} />
            <h4>Pro Tips</h4>
          </div>
          <ul>
            <li><strong>Voice Logging:</strong> Tap the glowing mic at the bottom to record sets hands-free.</li>
            <li><strong>Swipe Right:</strong> Swipe a set row to complete it instantly.</li>
            <li><strong>Edit & Correct:</strong> Tap a completed set to edit it. Tap unit labels (kg/reps) to toggle Bodyweight/Time.</li>
            <li><strong>AI Coach:</strong> Keep the AI coach running to track your rest times and motivate you!</li>
          </ul>
        </div>

        <div className={styles.exerciseCard}>
          <div className={styles.exerciseHeader}>
            <h2>{current?.exercise?.name || 'Exercise'}</h2>
            <div className={styles.headerActions}>
              <button onClick={() => setSwapModalOpen(true)} title="AI Equipment Swap"><Repeat2 size={16} /></button>
              <button onClick={skipExercise} title="Skip exercise"><SkipForward size={16} /></button>
            </div>
          </div>
          
          {current?.exercise && (
            <div className={styles.exerciseDetails}>
              {current.exercise.media && (
                <div className={styles.exerciseMediaWrap}>
                  <ExercisePreview media={current.exercise.media} />
                </div>
              )}
              {current.exercise.instructions && current.exercise.instructions.length > 0 && (
                <div className={styles.exerciseInstructions}>
                  <h4>Instructions</h4>
                  <ol>
                    {current.exercise.instructions.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          <div style={{ margin: '20px 0' }}>
            <VoiceCoach 
              autoSpeakPrompt={autoSpeakPrompt}
              syncKey={currentIndex}
              context={{
                planName: session?.name,
                currentExercise: current?.exercise?.name,
                currentIndex: currentIndex + 1,
                totalExercises: session.exercises.length
              }} 
            />
          </div>

          <div className={styles.setsList}>
            <div className={styles.setsListHeader}>
              <div style={{ width: 24 }}>Set</div>
              <div style={{ flex: 1, textAlign: 'center' }}>Weight</div>
              <div style={{ flex: 1, textAlign: 'center' }}>{isTimeBased ? 'Time (sec)' : 'Reps'}</div>
            </div>
            {current?.sets.map((s, i) => (
              <SetRow
                key={`${currentIndex}-${i}`}
                setIndex={i}
                set={s}
                isCompleted={s.completed}
                isBodyweight={isBodyweight}
                isTimeBased={isTimeBased}
                onUpdate={(data) => updateSet(currentIndex, i, data)}
                onComplete={(data) => handleSetComplete(i, data || { weight: s.weight, reps: s.reps || s.targetReps }, s.restSeconds || 60)}
                onUndo={() => updateSet(currentIndex, i, { completed: false })}
              />
            ))}
          </div>
        </div>

        <div className={styles.navRow}>
          <button className={styles.navBtn} onClick={goPrev} disabled={currentIndex === 0}>
            <ChevronLeft size={16} /> Previous
          </button>
          
          <div className={styles.voiceLoggerWrap}>
            <VoiceLogger onLogSet={handleVoiceLog} />
          </div>

          {currentIndex < session.exercises.length - 1 ? (
            <button className={styles.navBtn} onClick={goNext}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button className={styles.finishBtn} onClick={finish} disabled={finishing}>
              {finishing ? 'Finishing...' : 'Finish Workout'}
            </button>
          )}
        </div>
      </div>

      {restSeconds !== null && (
        <RestTimer 
          initialSeconds={restSeconds} 
          onComplete={handleRestComplete}
          onSkip={handleRestComplete}
          onWarning={() => setAutoSpeakPrompt('5 seconds left, get into position!')}
        />
      )}

      <ExerciseSwapModal 
        isOpen={swapModalOpen} 
        onClose={() => setSwapModalOpen(false)}
        currentExerciseName={current?.exercise?.name}
        onSwap={handleSwap}
      />
    </div>
  );
}
