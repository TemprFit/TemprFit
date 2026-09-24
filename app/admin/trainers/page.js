'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, Check, X } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminTrainers() {
  const [pendingTrainers, setPendingTrainers] = useState([]);
  const [rejectReason, setRejectReason] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.pendingTrainers) {
        setPendingTrainers(data.pendingTrainers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (trainerId, isApproved) => {
    const reason = rejectReason[trainerId] || '';
    if (!isApproved && !reason) return window.appAlert('Please provide a reason for rejection.');
    
    try {
      const res = await fetch('/api/admin/trainers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId, isApproved, reason })
      });
      if (res.ok) {
        setPendingTrainers(pendingTrainers.filter(t => t._id !== trainerId));
        setRejectReason({ ...rejectReason, [trainerId]: '' });
      } else {
        const data = await res.json();
        window.appAlert(data.error);
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
        <h1>Trainer <span className={styles.gradient}>Approvals</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Review and approve pending trainer applications.</p>
      </div>

      <div className={styles.trainersSection} style={{ marginTop: '24px' }}>
        {pendingTrainers.length === 0 ? (
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No trainers pending approval.</p>
          </div>
        ) : (
          <div className={styles.trainerList}>
            {pendingTrainers.map(trainer => (
              <div key={trainer._id} className={styles.trainerCard} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className={styles.trainerInfo}>
                    <span className={styles.trainerName}>{trainer.username}</span>
                    <span className={styles.trainerEmail}>{trainer.email}</span>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.approveBtn} onClick={() => handleApproval(trainer._id, true)}>
                      <Check size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Approve
                    </button>
                  </div>
                </div>
                
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Application Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                    <div><strong>Age:</strong> {trainer.age || 'N/A'}</div>
                    <div><strong>Location:</strong> {trainer.trainerInfo?.location || 'N/A'}</div>
                    <div><strong>Experience:</strong> {trainer.trainerInfo?.experienceYears || 0} years</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong>Expertise:</strong> {trainer.trainerInfo?.expertise?.join(', ') || 'None listed'}</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong>Bio:</strong> {trainer.trainerInfo?.bio || 'None listed'}</div>
                    
                    <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                      <strong>Media Gallery:</strong>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {trainer.trainerInfo?.mediaGallery?.map((img, i) => (
                          <img key={i} src={img} alt="Trainer Media" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', gridColumn: '1 / -1' }}>
                      {trainer.trainerInfo?.resumeUrl && (
                        <a href={trainer.trainerInfo.resumeUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                          View CV / Certificate
                        </a>
                      )}
                      {trainer.trainerInfo?.introVideoUrl && (
                        <a href={trainer.trainerInfo.introVideoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                          View Intro Video
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Reason for rejection (optional)"
                    value={rejectReason[trainer._id] || ''}
                    onChange={e => setRejectReason({ ...rejectReason, [trainer._id]: e.target.value })}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                  <button className={styles.rejectBtn} onClick={() => handleApproval(trainer._id, false)}>
                    <X size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
