'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminModeration() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoments();
  }, []);

  const fetchMoments = async () => {
    try {
      const res = await fetch('/api/admin/moderation');
      const data = await res.json();
      if (data.moments) setMoments(data.moments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMoment = async (momentId) => {
    if (!await window.appConfirm('Are you sure you want to delete this moment?')) return;
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ momentId })
      });
      if (res.ok) {
        setMoments(moments.filter(m => m._id !== momentId));
      }
    } catch (e) {}
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
        <h1>Moment <span className={styles.gradient}>Moderation</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Review and forcefully delete posts violating guidelines.</p>
      </div>

      <div className={styles.section} style={{ marginTop: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {moments.map(m => (
            <div key={m._id} style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <img src={m.user?.avatarUrl || `https://ui-avatars.com/api/?name=${m.user?.username}&background=random`} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <strong style={{ display: 'block' }}>{m.user?.username}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              </div>
              
              {m.mediaUrl && <img src={m.mediaUrl} alt="Moment" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />}
              <p style={{ flex: 1, marginBottom: '16px' }}>{m.caption}</p>
              
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button onClick={() => handleDeleteMoment(m._id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  <AlertCircle size={16} /> Delete Post
                </button>
              </div>
            </div>
          ))}
        </div>
        {moments.length === 0 && (
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No recent moments to review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
