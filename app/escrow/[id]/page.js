'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Lock, AlertTriangle, PlayCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function EscrowManagement() {
  const { id } = useParams();
  const router = useRouter();
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Fetch current user and escrow details
    const init = async () => {
      try {
        const [userRes, escrowRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch(`/api/escrow/${id}`)
        ]);
        
        const userData = await userRes.json();
        const escrowData = await escrowRes.json();
        
        if (userData.user) setCurrentUser(userData.user);
        if (escrowData.escrow) setEscrow(escrowData.escrow);
        else router.push('/');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, router]);

  const handleRelease = async (milestoneId) => {
    if (!await window.appConfirm('Are you sure you want to release these funds? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/escrow/${id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId })
      });
      const data = await res.json();
      
      if (res.ok) {
        setEscrow(data.transaction);
        window.appAlert('Success! The funds have been released to your trainer.');
      } else {
        window.appAlert(data.error || 'We couldn\'t release the funds right now. Please try again later.');
      }
    } catch (err) {
      window.appAlert('We\'re having trouble connecting to the network right now. Please check your connection and try again!');
    }
  };

  const handleDispute = () => {
    window.appAlert("Dispute feature coming in next phase. Contact support in the meantime.");
  };

  if (loading || !escrow || !currentUser) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div style={{ padding: '120px 20px', textAlign: 'center' }}>Loading Escrow Details...</div>
      </div>
    );
  }

  const isTrainee = currentUser._id === escrow.trainee._id;
  const isTrainer = currentUser._id === escrow.trainer._id;

  return (
    <div className={styles.page}>
      <Navbar />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', marginBottom: '16px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className={styles.title}>Secure Escrow</h1>
          <p className={styles.subtitle}>
            {escrow.description} • Status: <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: escrow.status === 'released' ? '#22c55e' : '#f59e0b' }}>{escrow.status}</span>
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.amountBox}>
            <div className={styles.amountLabel}>Total Held in Escrow</div>
            <div className={styles.amount}>${escrow.amount.toFixed(2)}</div>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Trainer Earnings: ${escrow.trainerEarnings.toFixed(2)} | Platform Fee: ${escrow.platformFee.toFixed(2)}
            </p>
          </div>

          <h3 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>Milestone Progress</h3>
          
          <div className={styles.milestonesList}>
            {escrow.milestones.map((m) => {
              const amount = (escrow.trainerEarnings * (m.percent / 100)).toFixed(2);
              const isPending = m.status === 'pending';
              const isCompleted = m.status === 'completed';
              
              return (
                <div key={m.id} className={`${styles.milestone} ${isCompleted ? styles.milestoneCompleted : ''}`}>
                  <div className={styles.milestoneInfo}>
                    <div className={styles.milestoneLabel}>{m.label} ({m.percent}%)</div>
                    <div className={styles.milestoneAmount}>${amount}</div>
                    
                    <div className={styles.statusBadge} style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem', background: isCompleted ? 'rgba(34, 197, 94, 0.1)' : isPending ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: isCompleted ? '#22c55e' : isPending ? '#3b82f6' : 'var(--color-text-muted)' }}>
                      {isCompleted ? <CheckCircle size={14} /> : isPending ? <PlayCircle size={14} /> : <Lock size={14} />}
                      {m.status}
                    </div>
                  </div>

                  {isTrainee && isPending && (
                    <button onClick={() => handleRelease(m.id)} className={styles.releaseBtn}>
                      Release Funds
                    </button>
                  )}
                  {isTrainee && isCompleted && (
                    <button className={styles.releaseBtn} disabled>Released</button>
                  )}
                  {isTrainer && isPending && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Awaiting Trainee Release</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.actions}>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                Total Released so far: <strong style={{ color: '#22c55e' }}>${escrow.releasedAmount.toFixed(2)}</strong>
              </p>
            </div>
            {escrow.status !== 'released' && (
              <button onClick={handleDispute} className={styles.disputeBtn}>
                <AlertTriangle size={16} /> Raise Dispute
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
