'use client';
import React, { useMemo, useState } from 'react';
import styles from './ActivityHeatmap.module.css';

export default function ActivityHeatmap({ data = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const calendar = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    
    const dataMap = {};
    data.forEach(item => {
      dataMap[item.date] = { count: item.count, exercises: item.exercises || [] };
    });

    const weeks = [];
    let currentWeek = [];
    
    // Pad start of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split('T')[0];
      const count = dataMap[dateStr] ? dataMap[dateStr].count : 0;
      const exercises = dataMap[dateStr] ? dataMap[dateStr].exercises : [];
      
      currentWeek.push({ day, dateStr, count, exercises });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [currentDate, data]);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>Workout Consistency</h4>
        <div className={styles.controls}>
          <button onClick={prevMonth}>&lt;</button>
          <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={nextMonth}>&gt;</button>
        </div>
      </div>
      <div className={styles.calendar}>
        <div className={styles.weekdays}>
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        {calendar.map((week, wIdx) => (
          <div key={wIdx} className={styles.week}>
            {week.map((dayObj, dIdx) => {
              if (!dayObj) return <div key={dIdx} className={styles.emptyDay} />;
              const isGreen = dayObj.count > 0;
              return (
                <div 
                  key={dIdx} 
                  className={`${styles.day} ${isGreen ? styles.activeDay : ''}`}
                  onClick={() => { if (isGreen) setSelectedDay(dayObj) }}
                  style={{ cursor: isGreen ? 'pointer' : 'default' }}
                  title={`${dayObj.dateStr}: ${dayObj.count} session(s)`}
                >
                  {dayObj.day}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedDay && (
        <div className={styles.modalOverlay} onClick={() => setSelectedDay(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--color-text)' }}>
              {new Date(selectedDay.dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h4>
            <p style={{ margin: '0 0 16px 0', color: 'var(--color-primary)', fontWeight: 'bold' }}>
              {selectedDay.count} Session(s) Completed
            </p>
            {selectedDay.exercises && selectedDay.exercises.length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', color: 'var(--color-text-muted)' }}>
                {selectedDay.exercises.map((ex, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>{ex}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>No specific exercises recorded.</p>
            )}
            <button onClick={() => setSelectedDay(null)} style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
