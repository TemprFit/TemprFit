'use client';

import { useEffect, useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      if (data.bookings) setBookings(data.bookings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#ef4444' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Platform <span className={styles.gradient}>Bookings</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>View all active and historical client-trainer bookings.</p>
      </div>

      <div className={styles.section} style={{ marginTop: '24px' }}>
        <div style={{ overflowX: 'auto', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '16px' }}>Date</th>
                <th style={{ padding: '16px' }}>Client</th>
                <th style={{ padding: '16px' }}>Trainer</th>
                <th style={{ padding: '16px' }}>Program</th>
                <th style={{ padding: '16px' }}>Amount</th>
                <th style={{ padding: '16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{b.trainee?.username || 'Unknown'}</td>
                  <td style={{ padding: '16px', fontWeight: 600, color: '#3b82f6' }}>{b.trainer?.username || 'Unknown'}</td>
                  <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>{b.program?.title || b.description || 'Custom'}</td>
                  <td style={{ padding: '16px' }}>${(typeof b.amountPaid === 'number' ? b.amountPaid : (typeof b.amount === 'number' ? b.amount : 0)).toFixed(2)}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize',
                      background: (b.status === 'held' || b.escrowStatus === 'held') ? 'rgba(245, 158, 11, 0.1)' : (b.status === 'released' || b.status === 'completed' || b.escrowStatus === 'released') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: (b.status === 'held' || b.escrowStatus === 'held') ? '#f59e0b' : (b.status === 'released' || b.status === 'completed' || b.escrowStatus === 'released') ? '#22c55e' : '#ef4444'
                    }}>
                      {b.status || b.escrowStatus || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No bookings found on the platform yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
