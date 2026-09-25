'use client';

import { useEffect, useState } from 'react';
import { Droplet, Plus, Minus } from 'lucide-react';
import ChartWidget from '@/components/ChartWidget';

export default function WaterTracker() {
  const [logs, setLogs] = useState([]);
  const [unit, setUnit] = useState('ml');
  const [amountToAdd, setAmountToAdd] = useState(250);

  useEffect(() => {
    const saved = localStorage.getItem('temprfit_water_logs');
    const savedUnit = localStorage.getItem('temprfit_water_unit');
    if (saved) setLogs(JSON.parse(saved));
    if (savedUnit) setUnit(savedUnit);
  }, []);

  const saveLogs = (newLogs) => {
    setLogs(newLogs);
    localStorage.setItem('temprfit_water_logs', JSON.stringify(newLogs));
  };

  const handleUnitChange = (e) => {
    setUnit(e.target.value);
    localStorage.setItem('temprfit_water_unit', e.target.value);
  };

  const addWater = () => {
    const today = new Date().toISOString().split('T')[0];
    let amountMl = amountToAdd;
    if (unit === 'liters') amountMl = amountToAdd * 1000;
    if (unit === 'cl') amountMl = amountToAdd * 10;
    if (unit === 'oz') amountMl = amountToAdd * 29.5735;

    const existingLogIndex = logs.findIndex(l => l.date === today);
    let newLogs = [...logs];
    
    if (existingLogIndex >= 0) {
      newLogs[existingLogIndex].amountMl += amountMl;
    } else {
      newLogs.push({ date: today, amountMl });
    }
    
    saveLogs(newLogs);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === today);
  const todayMl = todayLog ? todayLog.amountMl : 0;
  
  let displayTotal = todayMl;
  if (unit === 'liters') displayTotal = (todayMl / 1000).toFixed(2);
  if (unit === 'cl') displayTotal = (todayMl / 10).toFixed(1);
  if (unit === 'oz') displayTotal = (todayMl / 29.5735).toFixed(1);

  return (
    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Droplet size={24} color="#3b82f6" />
        <h3 style={{ margin: 0 }}>Water Intake</h3>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{displayTotal}</span>
          <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{unit} today</span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={unit} onChange={handleUnitChange} style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px' }}>
            <option value="ml">ml</option>
            <option value="liters">Liters</option>
            <option value="cl">cl</option>
            <option value="oz">oz</option>
          </select>
          <input 
            type="number" 
            value={amountToAdd} 
            onChange={(e) => setAmountToAdd(parseFloat(e.target.value) || 0)}
            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', width: '80px' }}
          />
          <button onClick={addWater} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <ChartWidget 
            data={logs.slice(-7).map(l => ({ 
              label: new Date(l.date).toLocaleDateString(undefined, { weekday: 'short' }),
              value: unit === 'liters' ? l.amountMl / 1000 : unit === 'cl' ? l.amountMl / 10 : unit === 'oz' ? l.amountMl / 29.5735 : l.amountMl
            }))}
            type="bar"
            title={`Last 7 Days (${unit})`}
            color="#3b82f6"
          />
        </div>
      )}
    </div>
  );
}
