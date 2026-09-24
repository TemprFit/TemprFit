'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { CheckCircle, Lock, Unlock, Loader2, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setCurrentUser(data.user || null));

    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/escrow');
      const data = await res.json();
      if (data.transactions) setSessions(data.transactions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (transactionId, milestoneId) => {
    if (!await window.appConfirm('Are you sure you want to release these funds to the trainer?')) return;
    
    try {
      const res = await fetch(`/api/escrow/${transactionId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId })
      });
      const data = await res.json();
      if (data.success) {
        window.appAlert('Success! The funds have been released to your trainer.');
        fetchSessions(); // Refresh
      } else {
        window.appAlert(data.error || 'We couldn\'t release the funds right now. Please try again later.');
      }
    } catch (err) {
      console.error(err);
      window.appAlert('We\'re having trouble connecting to the network right now. Please check your connection and try again!');
    }
  };

  if (loading || !currentUser) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Sidebar />
        <div style={{ marginLeft: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#22c55e' }} />
        </div>
      </div>
    );
  }

  const isTrainer = currentUser.role === 'trainer';

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        <div className={styles.header}>
          <h1>My <span className={styles.gradient}>Sessions</span></h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage your booked 1-on-1 training sessions and escrow milestones.</p>
        </div>

        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
            <AlertCircle size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
            <h3>No active sessions</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>You don't have any booked sessions right now.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {sessions.map(session => {
              const otherUser = isTrainer ? session.trainee : session.trainer;
              const isTrainee = !isTrainer;
              
              return (
                <div key={session._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.userInfo}>
                      <img 
                        src={otherUser?.avatarUrl || `https://ui-avatars.com/api/?name=${otherUser?.username}&background=22c55e&color=fff`} 
                        className={styles.avatar} 
                        alt="Avatar" 
                      />
                      <div>
                        <div className={styles.username}>{otherUser?.username}</div>
                        <div className={styles.role}>{isTrainer ? 'Client' : 'Trainer'}</div>
                      </div>
                    </div>
                    <div className={styles.amount}>${session.amount.toFixed(2)}</div>
                  </div>
                  
                  <p className={styles.description}>{session.description}</p>
                  
                  <div className={styles.milestones}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#fff' }}>Milestones</h4>
                    {session.milestones?.map(m => (
                      <div key={m.id} className={`${styles.milestone} ${styles[m.status]}`}>
                        <div className={styles.milestoneInfo}>
                          <span className={styles.statusIcon}>
                            {m.status === 'completed' && <CheckCircle size={16} color="#22c55e" />}
                            {m.status === 'pending' && <Unlock size={16} color="#3b82f6" />}
                            {m.status === 'locked' && <Lock size={16} color="#71717a" />}
                          </span>
                          <span style={{ fontSize: '0.9rem' }}>{m.label} ({m.percent}%)</span>
                        </div>
                        
                        {isTrainee && m.status === 'pending' && (
                          <button 
                            className={styles.releaseBtn}
                            onClick={() => handleRelease(session._id, m.id)}
                          >
                            Release Funds
                          </button>
                        )}
                        
                        {isTrainer && m.status === 'pending' && (
                          <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Waiting for Client</span>
                        )}
                      </div>
                    ))}
                    {(!session.milestones || session.milestones.length === 0) && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Legacy session (no milestones attached).</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
