'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Dumbbell, Heart, Share2, Download, CheckCircle2, MessageSquareText } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import ShareDialog from '@/components/ShareDialog';
import styles from './workouts.module.css';

export default function WorkoutsPage() {
  const [templates, setTemplates] = useState(null);
  const [error, setError] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetch('/api/workouts')
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then((data) => setTemplates(data.items))
      .catch((e) => setError(e.message === 'signin' ? 'signin' : 'error'));
  }, []);

  const toggleFavorite = async (e, id, currentFav) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentFav })
      });
      if (res.ok) {
        setTemplates(prev => prev.map(t => t._id === id ? { ...t, isFavorite: !currentFav } : t));
        showToast(!currentFav ? 'Added to favorites!' : 'Removed from favorites', 'success');
      }
    } catch (err) {
      showToast('Error updating favorite', 'error');
    }
  };

  const handleDownload = (e, t) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Generate simple text file
    let content = `Workout: ${t.name}\nGoal: ${t.goal || 'General'}\nCreated: ${new Date(t.createdAt).toLocaleDateString()}\n\n`;
    t.exercises.forEach((ex, i) => {
      content += `${i + 1}. ${ex.exercise?.name || 'Exercise'}\n`;
      content += `   Sets: ${ex.sets.length}\n`;
    });
    if (t.note) content += `\nNotes: ${t.note}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.name.replace(/\\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download started!', 'success');
  };

  const handleNotePrompt = async (e, id, currentNote) => {
    e.preventDefault();
    e.stopPropagation();
    const newNote = await window.appPrompt('Enter a note for this workout:', currentNote || '');
    if (newNote !== null) {
      try {
        const res = await fetch(`/api/workouts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: newNote })
        });
        if (res.ok) {
          setTemplates(prev => prev.map(t => t._id === id ? { ...t, note: newNote } : t));
          showToast('Note saved!', 'success');
        }
      } catch (err) {
        showToast('Failed to save note', 'error');
      }
    }
  };

  const handleShareClick = (e, t) => {
    e.preventDefault();
    e.stopPropagation();
    setShareItem(t);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Workouts</h1>
            <p className={styles.subtitle}>Build your own routine, or let TemprFit put one together from your equipment and time.</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/workouts/generate" className={styles.secondaryBtn}>
              <Sparkles size={16} /> Generate
            </Link>
            <Link href="/workouts/new" className={styles.primaryBtn}>
              <Plus size={16} /> Build Workout
            </Link>
          </div>
        </div>

        {error === 'signin' && (
          <div className={styles.empty}>
            <p>Sign in to build and save workouts.</p>
            <Link href="/login" className={styles.primaryBtn}>Sign In</Link>
          </div>
        )}

        {error === 'error' && <div className={styles.empty}>Something went wrong loading your workouts.</div>}

        {templates && templates.length === 0 && (
          <div className={styles.empty}>
            <Dumbbell size={28} />
            <p>No workouts yet — build one manually or generate one from your goals.</p>
          </div>
        )}

        {templates && templates.length > 0 && (
          <div className={styles.grid}>
            {templates.map((t) => (
              <Link key={t._id} href={`/workouts/${t._id}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{t.name} {t.isFavorite && <Heart size={16} fill="var(--color-primary)" color="var(--color-primary)" style={{ display: 'inline', marginLeft: 4 }}/>}</h3>
                </div>
                
                <p className={styles.cardMeta}>
                  {t.exercises.length} exercise{t.exercises.length === 1 ? '' : 's'}
                  {t.goal ? ` \u00b7 ${t.goal.replace('-', ' ')}` : ''}
                  {t.source === 'generated' ? ' \u00b7 generated' : ''}
                </p>

                <div className={styles.cardDates}>
                  <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                  {t.lastCompletedAt && (
                    <span className={styles.completedTick}>
                      <CheckCircle2 size={14} /> 
                      Done: {new Date(t.lastCompletedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {t.note && (
                  <div className={styles.cardNote}>
                    <MessageSquareText size={14} /> {t.note}
                  </div>
                )}

                <div className={styles.cardActions} onClick={e => e.preventDefault()}>
                  <button onClick={(e) => toggleFavorite(e, t._id, t.isFavorite)} title="Favorite">
                    <Heart size={16} fill={t.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button onClick={(e) => handleNotePrompt(e, t._id, t.note)} title="Add Note">
                    <MessageSquareText size={16} />
                  </button>
                  <button onClick={(e) => handleDownload(e, t)} title="Download">
                    <Download size={16} />
                  </button>
                  <button onClick={(e) => handleShareClick(e, t)} title="Share to Moments">
                    <Share2 size={16} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {shareItem && (
        <ShareDialog 
          item={shareItem} 
          type="workout" 
          onClose={() => setShareItem(null)} 
        />
      )}
    </div>
  );
}
