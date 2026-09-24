'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Send, CheckCircle, MessageSquare } from 'lucide-react';
import styles from '../dashboard/page.module.css';

export default function SupportPage() {
  const [complaints, setComplaints] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (data.complaints) {
        setComplaints(data.complaints);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) return;
    setLoading(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message })
      });
      const data = await res.json();
      if (data.success) {
        setSubject('');
        setMessage('');
        fetchComplaints();
        window.appAlert('Complaint submitted successfully!');
      } else {
        window.appAlert(data.error);
      }
    } catch (e) {
      console.error(e);
      window.appAlert('Failed to submit complaint.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Support & Complaints</h1>
            <p className={styles.subtitle}>Lodge an issue or view responses from the admin team.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', height: 'fit-content' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <MessageSquare size={20} color="#3b82f6" /> Submit a New Issue
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Subject</label>
                  <input 
                    type="text" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="Brief description of the issue" 
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Message</label>
                  <textarea 
                    rows={5} 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    placeholder="Provide detailed information..." 
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }} 
                  />
                </div>
                <button type="submit" disabled={loading} style={{ background: 'var(--color-primary)', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} /> {loading ? 'Submitting...' : 'Submit Issue'}
                </button>
              </form>
            </div>

            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h2 style={{ marginBottom: '16px' }}>Your Previous Tickets</h2>
              {fetching ? (
                <p>Loading...</p>
              ) : complaints.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)' }}>You have not submitted any issues.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {complaints.map(c => (
                    <div key={c._id} style={{ background: 'var(--color-bg-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>{c.subject}</h3>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: c.status === 'resolved' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: c.status === 'resolved' ? '#22c55e' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {c.status === 'resolved' && <CheckCircle size={12} />}
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>{c.message}</p>
                      
                      {c.adminReply && (
                        <div style={{ background: 'rgba(59,130,246,0.05)', borderLeft: '3px solid #3b82f6', padding: '12px', borderRadius: '0 8px 8px 0', marginTop: '12px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Admin Reply</span>
                          <p style={{ fontSize: '0.9rem', margin: 0 }}>{c.adminReply}</p>
                        </div>
                      )}
                      
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '12px' }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
