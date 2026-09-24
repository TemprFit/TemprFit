'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, ArrowRight, Activity, Calendar, MapPin, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export default function AIWorkoutGeneratorPage() {
  const [goal, setGoal] = useState('hypertrophy');
  const [level, setLevel] = useState('beginner');
  const [equipment, setEquipment] = useState('commercial_gym');
  const [days, setDays] = useState(4);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const generatePlan = async () => {
    setLoading(true);
    // Simulate API call for the public lead magnet
    setTimeout(() => {
      setPlan({
        title: `${days}-Day ${goal === 'hypertrophy' ? 'Muscle Building' : goal === 'fat_loss' ? 'Fat Burning' : 'Strength'} Split`,
        description: `A custom routine tailored for ${level} lifters using ${equipment.replace('_', ' ')}.`,
        days: Array.from({ length: days }).map((_, i) => ({
          day: `Day ${i + 1}`,
          focus: i % 2 === 0 ? 'Upper Body / Push' : 'Lower Body / Pull',
          exercises: 5
        }))
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.heroSection}>
            <div className={styles.badge}>Try It Free</div>
            <h1 className={styles.title}>
              <Bot size={32} /> AI Workout Generator
            </h1>
            <p className={styles.subtitle}>
              Get a 1-day preview of TemprFit's AI Coach. Tell us your goals, and we'll build a custom workout plan instantly.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.formCard}>
              <h2>Customize Your Plan</h2>
              
              <div className={styles.field}>
                <label>Primary Goal</label>
                <div className={styles.optionGrid}>
                  {[
                    { id: 'hypertrophy', label: 'Build Muscle', icon: <Activity size={16}/> },
                    { id: 'fat_loss', label: 'Lose Fat', icon: <Zap size={16}/> },
                    { id: 'strength', label: 'Gain Strength', icon: <Activity size={16}/> }
                  ].map(opt => (
                    <button 
                      key={opt.id}
                      className={`${styles.optBtn} ${goal === opt.id ? styles.optActive : ''}`}
                      onClick={() => setGoal(opt.id)}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Experience Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className={styles.input}>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="advanced">Advanced (3+ years)</option>
                </select>
              </div>

              <div className={styles.field}>
                <label><MapPin size={16} style={{display: 'inline', marginBottom: '-3px'}}/> Equipment Access</label>
                <select value={equipment} onChange={e => setEquipment(e.target.value)} className={styles.input}>
                  <option value="commercial_gym">Full Commercial Gym</option>
                  <option value="home_dumbbells">Home Gym (Dumbbells/Bench)</option>
                  <option value="bodyweight">Bodyweight Only</option>
                </select>
              </div>

              <div className={styles.field}>
                <label><Calendar size={16} style={{display: 'inline', marginBottom: '-3px'}}/> Days Per Week: {days}</label>
                <input 
                  type="range" 
                  min="2" 
                  max="6" 
                  value={days} 
                  onChange={e => setDays(Number(e.target.value))} 
                  className={styles.rangeInput}
                />
              </div>

              <button className={styles.calcBtn} onClick={generatePlan} disabled={loading}>
                {loading ? 'Analyzing...' : 'Generate My Plan'} <ArrowRight size={18} />
              </button>
            </div>

            <div className={styles.resultCard}>
              {plan ? (
                <div className={styles.planView}>
                  <div className={styles.planHeader}>
                    <h3>{plan.title}</h3>
                    <p>{plan.description}</p>
                  </div>
                  
                  <div className={styles.dayList}>
                    {plan.days.map((d, i) => (
                      <div key={i} className={styles.dayCard}>
                        <h4>{d.day}: <span style={{color: 'var(--color-primary)'}}>{d.focus}</span></h4>
                        <p>{d.exercises} exercises • ~45-60 mins</p>
                      </div>
                    ))}
                  </div>

                  <div className={styles.ctaBanner}>
                    <p><strong>Want the full set-by-set breakdown?</strong></p>
                    <p>Save this plan and let the AI Coach track your progress.</p>
                    <Link href={`/register?goal=${goal}&level=${level}`} className={styles.ctaBtn}>
                      Create Free Account <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyResult}>
                  <Bot size={48} style={{opacity: 0.15}} />
                  <p>Set your preferences and click Generate to preview your custom AI workout plan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
