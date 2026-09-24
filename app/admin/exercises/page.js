'use client';

import { useState } from 'react';
import { Dumbbell, Image as ImageIcon } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminExercises() {
  const [exerciseForm, setExerciseForm] = useState({ name: '', category: 'strength', muscleGroup: 'chest', instructions: '' });
  const [imageFile, setImageFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let videoUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.fileUrl) {
          videoUrl = uploadData.fileUrl;
        }
      }

      const res = await fetch('/api/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...exerciseForm, videoUrl })
      });
      
      if (res.ok) {
        window.appAlert('Exercise added to global library!');
        setExerciseForm({ name: '', category: 'strength', muscleGroup: 'chest', instructions: '' });
        setImageFile(null);
      } else {
        const data = await res.json();
        window.appAlert(data.error);
      }
    } catch (e) {}
    setActionLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Global <span className={styles.gradient}>Exercises</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Add new exercises to the platform's global library.</p>
      </div>

      <div className={styles.section} style={{ maxWidth: '600px', marginTop: '24px' }}>
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Dumbbell size={20} color="#22c55e" /> Add New Exercise</h2>
          
          <form onSubmit={handleCreateExercise} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <input type="text" value={exerciseForm.name} onChange={e => setExerciseForm({...exerciseForm, name: e.target.value})} placeholder="Exercise Name" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Category</label>
                <select value={exerciseForm.category} onChange={e => setExerciseForm({...exerciseForm, category: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  <option value="calisthenics">Calisthenics</option>
                  <option value="bodybuilding">Bodybuilding</option>
                  <option value="powerlifting">Powerlifting</option>
                  <option value="stretching">Stretching</option>
                  <option value="cardio">Cardio</option>
                  <option value="olympic weightlifting">Olympic Weightlifting</option>
                  <option value="plyometrics">Plyometrics</option>
                  <option value="strongman">Strongman</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Primary Muscle</label>
                <select value={exerciseForm.muscleGroup} onChange={e => setExerciseForm({...exerciseForm, muscleGroup: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="biceps">Biceps</option>
                  <option value="triceps">Triceps</option>
                  <option value="forearms">Forearms</option>
                  <option value="abdominals">Abdominals</option>
                  <option value="glutes">Glutes</option>
                  <option value="quads">Quads</option>
                  <option value="hamstrings">Hamstrings</option>
                  <option value="calves">Calves</option>
                  <option value="full body">Full Body</option>
                </select>
              </div>
            </div>
            
            <textarea rows={4} value={exerciseForm.instructions} onChange={e => setExerciseForm({...exerciseForm, instructions: e.target.value})} placeholder="Instructions (one per line)" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'none' }} />
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <ImageIcon size={16} /> Upload Image (Optional)
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setImageFile(e.target.files[0])}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
              />
            </div>

            <button type="submit" disabled={actionLoading} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
              {actionLoading ? 'Saving...' : 'Add Exercise to Library'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
