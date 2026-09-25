'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Trash2, GripVertical, Info } from 'lucide-react';
import AuthGateModal from '@/components/AuthGateModal';
import styles from './new.module.css';

const GOALS = ['strength', 'hypertrophy', 'endurance', 'fat-loss'];
const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abdominals'];

const TERM_HELP = {
  reps: 'Reps (repetitions) = how many times you do the movement in one set. "8-12" means anywhere in that range is fine.',
  weight: 'How much weight to load — leave at 0 for bodyweight moves, or if you\'re not sure yet and want to figure it out as you go.',
  rest: 'How long to rest between sets, in seconds. 60-90s is typical for muscle growth, 2-3min+ for heavy strength work.',
  tempo: 'Optional — the speed of each phase of the rep (lowering-pause-lifting-pause), e.g. "3-1-1-0". Leave blank if you don\'t track this.',
};

function defaultSet() {
  return { targetReps: '8-12', targetWeight: 0, restSeconds: 60, tempo: '' };
}

export default function BuildWorkoutPage() {
  return (
    <Suspense fallback={null}>
      <BuildWorkoutForm />
    </Suspense>
  );
}

function BuildWorkoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('hypertrophy');
  const [exercises, setExercises] = useState([]); // [{ exercise: {...}, sets: [...] }]
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [activeMuscle, setActiveMuscle] = useState('');
  const [browseResults, setBrowseResults] = useState([]);

  // Prefill from an exercise detail page's "Add to Workout" button.
  useEffect(() => {
    const slug = searchParams.get('exercise');
    if (!slug) return;
    fetch(`/api/exercises/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.exercise) {
          setExercises((prev) => [...prev, { exercise: data.exercise, sets: [defaultSet()] }]);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => setResults(data.items || []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // "I don't know what it's called" path — browse a short, real list by
  // muscle group instead of requiring the person to know an exercise name.
  const browseMuscle = (muscle) => {
    if (activeMuscle === muscle) {
      setActiveMuscle('');
      setBrowseResults([]);
      return;
    }
    setActiveMuscle(muscle);
    fetch(`/api/exercises?muscle=${encodeURIComponent(muscle)}`)
      .then((r) => r.json())
      .then((data) => setBrowseResults((data.items || []).slice(0, 12)))
      .catch(() => setBrowseResults([]));
  };

  const addExercise = (ex) => {
    if (exercises.some((e) => e.exercise._id === ex._id)) return;
    setExercises((prev) => [...prev, { exercise: ex, sets: [defaultSet()] }]);
    // We intentionally do NOT clear the query/results so the user can easily add multiple exercises in a row.
  };

  const removeExercise = (idx) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveExerciseUp = (idx) => {
    if (idx === 0) return;
    setExercises((prev) => {
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  const moveExerciseDown = (idx) => {
    if (idx === exercises.length - 1) return;
    setExercises((prev) => {
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    setExercises((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const addSet = (exIdx) => {
    setExercises((prev) => {
      const next = [...prev];
      const lastSet = next[exIdx].sets[next[exIdx].sets.length - 1] || defaultSet();
      next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets, { ...lastSet }] };
      return next;
    });
  };

  const removeSet = (exIdx, setIdx) => {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.filter((_, i) => i !== setIdx) };
      return next;
    });
  };

  const canSave = name.trim() && exercises.length > 0 && !saving;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          goal,
          exercises: exercises.map((e) => ({ exercise: e.exercise._id, sets: e.sets })),
        }),
      });
      if (res.status === 401) {
        setAuthGateOpen(true);
        setSaving(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save workout.');
      router.push(`/workouts/${data.template._id}`);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Build a Workout</h1>

        <div className={styles.topRow}>
          <input
            className={styles.nameInput}
            placeholder="Workout name (e.g. Push Day)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select className={styles.goalSelect} value={goal} onChange={(e) => setGoal(e.target.value)}>
            {GOALS.map((g) => <option key={g} value={g}>{g.replace('-', ' ')}</option>)}
          </select>
        </div>

        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search exercises to add..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <div className={styles.searchResults}>
              {results.map((ex) => (
                <button key={ex.slug} className={styles.searchResult} onClick={() => addExercise(ex)}>
                  <span>{ex.name}</span>
                  <span className={styles.searchResultMeta}>{ex.targetMuscles?.primary}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.browseSection}>
          <p className={styles.browseLabel}>Not sure what it's called? Browse by muscle group instead:</p>
          <div className={styles.muscleChips}>
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m}
                className={`${styles.muscleChip} ${activeMuscle === m ? styles.muscleChipActive : ''}`}
                onClick={() => browseMuscle(m)}
              >
                {m}
              </button>
            ))}
          </div>
          {activeMuscle && browseResults.length > 0 && (
            <div className={styles.browseResults}>
              {browseResults.map((ex) => (
                <button key={ex.slug} className={styles.searchResult} onClick={() => addExercise(ex)}>
                  <span>{ex.name}</span>
                  <span className={styles.searchResultMeta}>{ex.difficulty}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.exerciseList}>
          {exercises.map((item, exIdx) => (
            <div key={item.exercise._id} className={styles.exerciseBlock}>
              <div className={styles.exerciseHeader}>
                <div className={styles.exerciseReorder}>
                  <button disabled={exIdx === 0} onClick={() => moveExerciseUp(exIdx)}>▲</button>
                  <button disabled={exIdx === exercises.length - 1} onClick={() => moveExerciseDown(exIdx)}>▼</button>
                </div>
                <h3>{item.exercise.name}</h3>
                <button className={styles.removeBtn} onClick={() => removeExercise(exIdx)}>
                  <Trash2 size={15} />
                </button>
              </div>

              <div className={styles.setsTable}>
                <div className={styles.setsHeaderRow}>
                  <span>Set</span>
                  <span>Reps <TermHint text={TERM_HELP.reps} /></span>
                  <span>Weight <TermHint text={TERM_HELP.weight} /></span>
                  <span>Rest (s) <TermHint text={TERM_HELP.rest} /></span>
                  <span>Tempo <TermHint text={TERM_HELP.tempo} /></span>
                  <span />
                </div>
                {item.sets.map((set, setIdx) => (
                  <div key={setIdx} className={styles.setRow}>
                    <span className={styles.setNumber}>{setIdx + 1}</span>
                    <input
                      value={set.targetReps}
                      onChange={(e) => updateSet(exIdx, setIdx, 'targetReps', e.target.value)}
                      placeholder="8-12"
                    />
                    <input
                      type="number"
                      value={set.targetWeight}
                      onChange={(e) => updateSet(exIdx, setIdx, 'targetWeight', Number(e.target.value))}
                    />
                    <input
                      type="number"
                      value={set.restSeconds}
                      onChange={(e) => updateSet(exIdx, setIdx, 'restSeconds', Number(e.target.value))}
                    />
                    <input
                      value={set.tempo}
                      onChange={(e) => updateSet(exIdx, setIdx, 'tempo', e.target.value)}
                      placeholder="3-1-1-0"
                    />
                    <button className={styles.removeSetBtn} onClick={() => removeSet(exIdx, setIdx)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button className={styles.addSetBtn} onClick={() => addSet(exIdx)}>
                  <Plus size={13} /> Add set
                </button>
              </div>
            </div>
          ))}

          {exercises.length === 0 && (
            <div className={styles.emptyExercises}>Search or browse above to add your first exercise.</div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.saveBtn} disabled={!canSave} onClick={save}>
          {saving ? 'Saving...' : 'Save Workout'}
        </button>
      </div>

      <AuthGateModal
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        message="Sign in to save your workout — your progress is filled in, we just need an account to keep it under."
      />
    </div>
  );
}

// Small inline "?" icon that shows a plain-language explanation on hover/tap —
// for people who don't already know what "tempo" or "rest" mean in this context.
function TermHint({ text }) {
  return (
    <span className={styles.termHint} tabIndex={0}>
      <Info size={11} />
      <span className={styles.termHintPopover}>{text}</span>
    </span>
  );
}
