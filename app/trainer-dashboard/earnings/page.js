'use client';

import { useEffect, useState } from 'react';
import { Wallet, DollarSign, Lock, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function EarningsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trainer/earnings')
      .then(r => r.json())
      .then(d => {
        if (!d.error) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Sidebar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#22c55e' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Escrow & Earnings</h1>
          <p>Track your payouts, wallet balance, and locked escrow funds.</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
              <Wallet size={32} />
            </div>
            <div className={styles.statInfo}>
              <h3>Wallet Balance</h3>
              <p className={styles.value}>${data.walletBalance.toFixed(2)}</p>
              <button className={styles.withdrawBtn} onClick={() => window.appAlert('Withdrawal functionality coming in next phase!')}>
                Withdraw Funds
              </button>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Lock size={32} />
            </div>
            <div className={styles.statInfo}>
              <h3>Locked in Escrow</h3>
              <p className={styles.value}>${data.totalInEscrow.toFixed(2)}</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
                Funds waiting to be released by your clients.
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <DollarSign size={32} />
            </div>
            <div className={styles.statInfo}>
              <h3>Total Lifetime Earnings</h3>
              <p className={styles.value}>${data.totalEarned.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className={styles.historySection}>
          <h2>Transaction History</h2>
          
          {data.history.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No transactions found.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Client</th>
                    <th>Program</th>
                    <th>Total Value</th>
                    <th>Released</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map(tx => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.date).toLocaleDateString()}</td>
                      <td>{tx.type}</td>
                      <td>{tx.trainee}</td>
                      <td>{tx.program}</td>
                      <td>${tx.amount.toFixed(2)}</td>
                      <td style={{ color: '#22c55e', fontWeight: 600 }}>${tx.released.toFixed(2)}</td>
                      <td>
                        <span className={styles.status} style={{
                          background: tx.status === 'active' ? 'rgba(59,130,246,0.1)' : tx.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: tx.status === 'active' ? '#3b82f6' : tx.status === 'completed' ? '#22c55e' : '#ef4444'
                        }}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
