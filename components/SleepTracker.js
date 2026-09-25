'use client';

import { useEffect, useState } from 'react';
import { Moon, Plus } from 'lucide-react';
import ChartWidget from '@/components/ChartWidget';

export default function SleepTracker() {
  const [logs, setLogs] = useState([]);
  const [hours, setHours] = useState(8);

  useEffect(() => {
    const saved = localStorage.getItem('temprfit_sleep_logs');
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  const saveLogs = (newLogs) => {
    setLogs(newLogs);
    localStorage.setItem('temprfit_sleep_logs', JSON.stringify(newLogs));
  };

  const addSleep = () => {
    const today = new Date().toISOString().split('T')[0];
    const existingLogIndex = logs.findIndex(l => l.date === today);
    let newLogs = [...logs];
    
    if (existingLogIndex >= 0) {
      newLogs[existingLogIndex].hours = hours;
    } else {
      newLogs.push({ date: today, hours });
    }
    
    saveLogs(newLogs);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === today);
  const todayHours = todayLog ? todayLog.hours : 0;

  return (
    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Moon size={24} color="#8b5cf6" />
        <h3 style={{ margin: 0 }}>Sleep Tracker</h3>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{todayHours}</span>
          <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>hours last night</span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="number" 
            step="0.5"
            value={hours} 
            onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', width: '80px' }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>hrs</span>
          <button onClick={addSleep} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={16} /> Log Sleep
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <ChartWidget 
            data={logs.slice(-7).map(l => ({ 
              label: new Date(l.date).toLocaleDateString(undefined, { weekday: 'short' }),
              value: l.hours
            }))}
            type="line"
            title="Sleep (Last 7 Days)"
            color="#8b5cf6"
          />
        </div>
      )}
    </div>
  );
}
