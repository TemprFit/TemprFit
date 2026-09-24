'use client';
import React, { useMemo } from 'react';
import styles from './ActivityHeatmap.module.css';

export default function ActivityHeatmap({ data = [], days = 84 }) {
  // data should be an array of objects: { date: 'YYYY-MM-DD', count: number }
  
  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dataMap = {};
    data.forEach(item => {
      dataMap[item.date] = item.count;
    });

    const daysArray = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const count = dataMap[dateStr] || 0;
      
      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count >= 3) level = 3;
      
      daysArray.push({
        date: dateStr,
        count,
        level
      });
    }
    
    // Pad the beginning so the grid aligns well (optional, but we'll just flow it using CSS Grid)
    return daysArray;
  }, [data, days]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>Workout Consistency</h4>
        <span className={styles.legend}>
          <span>Less</span>
          <div className={`${styles.block} ${styles.level0}`} />
          <div className={`${styles.block} ${styles.level1}`} />
          <div className={`${styles.block} ${styles.level2}`} />
          <div className={`${styles.block} ${styles.level3}`} />
          <span>More</span>
        </span>
      </div>
      <div className={styles.grid}>
        {heatmapData.map((day, i) => (
          <div 
            key={day.date}
            className={`${styles.block} ${styles['level' + day.level]}`}
            title={`${day.date}: ${day.count} session(s)`}
          />
        ))}
      </div>
    </div>
  );
}
