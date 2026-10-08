'use client';

import { useEffect, useState } from 'react';
import { Apple, Check, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import styles from './DashboardMeals.module.css';

export default function DashboardMeals() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finishModalOpen, setFinishModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/nutrition/plan')
      .then((r) => r.json())
      .then((d) => setPlan(d.plan || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (!plan) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h3><Apple size={20} /> Today's Meals</h3>
          <Link href="/nutrition" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Go to Nutrition</Link>
        </div>
        <p className={styles.emptyState}>You don't have an active meal plan. Generate one in the AI Nutrition section.</p>
      </div>
    );
  }

  const dayIndex = (Math.floor((new Date() - new Date(plan.createdAt)) / 86400000)) % 7;
  const todayDayNumber = (dayIndex || 0) + 1;
  
  const todayMeals = plan.days.find(d => d.dayNumber === todayDayNumber)?.meals || [];
  const completedMeals = plan.completedMeals || [];

  const handleMealClick = async (mealName, isCompleted) => {
    if (!isCompleted && todayMeals.length > 0) {
      const alreadyCheckedCount = todayMeals.filter(m => completedMeals.some(cm => cm.dayNumber === todayDayNumber && cm.mealName === m.name)).length;
      if (alreadyCheckedCount === todayMeals.length - 1) {
         toggleMeal(mealName, false);
         setFinishModalOpen(true);
         return;
      }
    }
    toggleMeal(mealName, isCompleted);
  };

  const toggleMeal = async (mealName, isCompleted) => {
    const timestamp = new Date().toISOString();
    
    const newCompleted = isCompleted 
      ? completedMeals.filter(m => !(m.dayNumber === todayDayNumber && m.mealName === mealName))
      : [...completedMeals, { dayNumber: todayDayNumber, mealName, timestamp }];
    
    setPlan(prev => ({ ...prev, completedMeals: newCompleted }));

    try {
      await fetch('/api/nutrition/plan/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber: todayDayNumber, mealName, completed: !isCompleted })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const closeFinishModal = () => setFinishModalOpen(false);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3><Apple size={20} /> Today's Meals (Day {todayDayNumber})</h3>
        <Link href="/nutrition" style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>Manage Plan</Link>
      </div>
      
      <div className={styles.mealList}>
        {todayMeals.map(meal => {
          const completionData = completedMeals.find(m => m.dayNumber === todayDayNumber && m.mealName === meal.name);
          const isCompleted = !!completionData;
          const timeStr = completionData?.timestamp ? new Date(completionData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

          return (
            <div 
              key={meal.name} 
              className={`${styles.mealItem} ${isCompleted ? styles.completed : ''}`}
              onClick={() => handleMealClick(meal.name, isCompleted)}
            >
              <div className={styles.checkbox} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Check size={16} strokeWidth={3} />
              </div>
              <div className={styles.mealInfo}>
                <div className={styles.mealType} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{meal.mealType}</span>
                  {isCompleted && <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 'bold' }}>Done at {timeStr}</span>}
                </div>
                <h4 className={styles.mealName}>{meal.name}</h4>
                <div className={styles.mealMacros}>
                  <span>{meal.calories} kcal</span>
                  <span>{meal.protein}g P</span>
                  <span>{meal.carbs}g C</span>
                  <span>{meal.fat}g F</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {finishModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={closeFinishModal}>
          <div style={{ background: 'var(--color-surface-elevated)', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '100%', border: '1px solid var(--color-border)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Apple size={32} />
            </div>
            <h2 style={{ marginBottom: '12px' }}>Day Complete?</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Did you finish all of today's meals?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={closeFinishModal} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Review</button>
              <button onClick={closeFinishModal} style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>No</button>
              <button onClick={closeFinishModal} style={{ flex: 1, padding: '12px', background: '#22c55e', border: 'none', color: '#000', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
