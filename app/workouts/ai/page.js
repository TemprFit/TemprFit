'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Dumbbell, Zap, Loader2, Save } from 'lucide-react';
import styles from './page.module.css';

export default function AIWorkoutPage() {
  const [goal, setGoal] = useState('Build Muscle');
  const [experience, setExperience] = useState('Beginner');
  const [equipment, setEquipment] = useState('Full Gym');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/workouts/ai')
      .then(res => res.json())
      .then(data => {
        if (data.plans) setHistory(data.plans);
      });
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/workouts/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, experience, equipment, daysPerWeek })
      });
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
        setHistory([data.plan, ...history]);
      } else {
        window.appAlert(data.error || 'Your AI Coach couldn\'t generate the plan right now. Please try again!');
      }
    } catch (e) {
      console.error(e);
      window.appAlert('We\'re having trouble connecting to the network right now. Please check your connection and try again!');
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        
        <div className={styles.header}>
          <h1>AI Workout <span className={styles.gradient}>Architect</span></h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Generate a fully customized training program in seconds using Gemini AI.</p>
        </div>

        <form className={styles.generatorCard} onSubmit={handleGenerate}>
          <div className={styles.formGroup}>
            <label>Primary Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="Build Muscle">Build Muscle</option>
              <option value="Lose Fat">Lose Fat</option>
              <option value="Increase Strength">Increase Strength</option>
              <option value="Improve Endurance">Improve Endurance</option>
              <option value="General Fitness">General Fitness</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Experience Level</label>
            <select value={experience} onChange={e => setExperience(e.target.value)}>
              <option value="Beginner">Beginner (0-1 years)</option>
              <option value="Intermediate">Intermediate (1-3 years)</option>
              <option value="Advanced">Advanced (3+ years)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Available Equipment</label>
            <select value={equipment} onChange={e => setEquipment(e.target.value)}>
              <option value="Full Gym">Full Gym</option>
              <option value="Dumbbells Only">Dumbbells Only</option>
              <option value="Bodyweight Only">Bodyweight Only</option>
              <option value="Kettlebells & Bands">Kettlebells & Bands</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Days Per Week</label>
            <select value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))}>
              <option value={2}>2 Days</option>
              <option value={3}>3 Days</option>
              <option value={4}>4 Days</option>
              <option value={5}>5 Days</option>
              <option value={6}>6 Days</option>
            </select>
          </div>

          <button type="submit" className={styles.generateBtn} disabled={loading}>
            {loading ? <Loader2 size={20} className="spin" /> : <Zap size={20} />}
            {loading ? 'Generating Program...' : 'Generate Program'}
          </button>
        </form>

        {plan && (
          <div className={styles.planDisplay}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0 }}>Your Custom Program</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => window.print()} 
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Download PDF
                </button>
                <button 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Workout_${new Date().toISOString().split('T')[0]}.doc`;
                    a.click();
                  }}
                  style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Download Word
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/notes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          title: `AI Workout: ${plan.goal}`, 
                          content: JSON.stringify(plan, null, 2) 
                        })
                      });
                      if (res.ok) window.appAlert('Awesome! Saved directly to your Notes.');
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  style={{ background: '#22c55e', border: 'none', color: '#000', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Save to Notes
                </button>
              </div>
            </div>
            
            {plan.days.map(day => (
              <div key={day.dayNumber} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <div className={styles.dayTitle}>Day {day.dayNumber}: {day.focus}</div>
                  <Dumbbell size={20} color="var(--color-text-muted)" />
                </div>
                
                <table className={styles.exerciseTable}>
                  <thead>
                    <tr>
                      <th>Exercise</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Rest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.exercises.map((ex, i) => (
                      <tr key={i}>
                        <td>
                          <div className={styles.exerciseName}>{ex.name}</div>
                          {ex.notes && <div className={styles.exerciseNotes}>{ex.notes}</div>}
                        </td>
                        <td>{ex.sets}</td>
                        <td>{ex.reps}</td>
                        <td>{ex.rest}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--color-border)' }}>
            <h2 style={{ marginBottom: '20px' }}>Previous Workouts</h2>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px' }}>
              {history.map(h => (
                <div key={h._id} onClick={() => setPlan(h)} style={{ minWidth: '280px', background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6' }}>{h.goal}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {h.days.length} Days • {h.equipment}
                  </p>
                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#71717a' }}>
                    {new Date(h.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
