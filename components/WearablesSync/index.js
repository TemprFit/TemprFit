'use client';

import { useState, useEffect } from 'react';
import { Watch, Heart, Activity, CheckCircle, RefreshCcw, Smartphone } from 'lucide-react';
import styles from './index.module.css';

export default function WearablesSync() {
  const [syncStatus, setSyncStatus] = useState('disconnected'); // disconnected, syncing, synced
  const [metrics, setMetrics] = useState({ heartRate: '--', steps: '--', sleep: '--' });

  const handleSync = () => {
    window.appAlert('Wearables integration (Apple Health & Google Fit) is coming soon in the next phase! Stay tuned.');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Watch size={24} className={syncStatus === 'synced' ? styles.iconSynced : styles.iconDefault} />
          <div>
            <h3 className={styles.title}>Wearable Sync</h3>
            <p className={styles.subtitle}>Apple Health & Google Fit</p>
          </div>
        </div>
        
        {syncStatus === 'disconnected' && (
          <button onClick={handleSync} className={styles.syncBtn}>
            <Smartphone size={16} /> Connect Device
          </button>
        )}
        
        {syncStatus === 'syncing' && (
          <div className={styles.syncingBadge}>
            <RefreshCcw size={14} className={styles.spinIcon} /> Syncing...
          </div>
        )}
        
        {syncStatus === 'synced' && (
          <div className={styles.syncedBadge}>
            <CheckCircle size={14} /> Synced Just Now
          </div>
        )}
      </div>

      <div className={`${styles.metricsGrid} ${syncStatus === 'synced' ? styles.metricsActive : ''}`}>
        <div className={styles.metricCard}>
          <Heart size={18} className={styles.metricIcon} color="#ef4444" />
          <div className={styles.metricLabel}>Avg. Heart Rate</div>
          <div className={styles.metricValue}>{metrics.heartRate}</div>
        </div>
        
        <div className={styles.metricCard}>
          <Activity size={18} className={styles.metricIcon} color="#3b82f6" />
          <div className={styles.metricLabel}>Daily Steps</div>
          <div className={styles.metricValue}>{metrics.steps}</div>
        </div>
      </div>
    </div>
  );
}
