'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Check, CornerDownRight, ShieldAlert } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [filter, setFilter] = useState('open'); // open, resolved, all

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/admin/complaints');
      const data = await res.json();
      if (data.complaints) {
        setComplaints(data.complaints);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reply: replyText[id] || '' })
      });
      if (res.ok) {
        setReplyText({ ...replyText, [id]: '' });
        fetchComplaints();
      }
    } catch (e) {
      console.error(e);
      window.appAlert('Failed to perform action');
    }
  };

  const filtered = complaints.filter(c => filter === 'all' || c.status === filter);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>User <span className={styles.gradient}>Complaints & Appeals</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Resolve user issues and ban appeals.</p>
      </div>

      <div className={styles.section} style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setFilter('open')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: filter === 'open' ? 'var(--color-primary)' : 'var(--color-surface)', color: filter === 'open' ? '#000' : 'var(--color-text)', cursor: 'pointer' }}>Open</button>
          <button onClick={() => setFilter('resolved')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: filter === 'resolved' ? 'var(--color-primary)' : 'var(--color-surface)', color: filter === 'resolved' ? '#000' : 'var(--color-text)', cursor: 'pointer' }}>Resolved</button>
          <button onClick={() => setFilter('all')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: filter === 'all' ? 'var(--color-primary)' : 'var(--color-surface)', color: filter === 'all' ? '#000' : 'var(--color-text)', cursor: 'pointer' }}>All</button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No {filter} tickets found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(c => (
              <div key={c._id} style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
                      {c.type === 'appeal' ? <ShieldAlert size={20} color="#ef4444" /> : <MessageSquare size={20} color="#3b82f6" />}
                      {c.subject}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                      From: {c.user ? `${c.user.username} (${c.user.email}) [${c.user.role}]` : (c.email || 'Unknown')} | {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '100px', background: c.status === 'resolved' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: c.status === 'resolved' ? '#22c55e' : '#f59e0b', fontWeight: 'bold' }}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
                
                <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.message}</p>
                </div>

                {c.adminReply && (
                  <div style={{ background: 'rgba(59,130,246,0.05)', borderLeft: '4px solid #3b82f6', padding: '16px', borderRadius: '0 8px 8px 0' }}>
                    <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Previous Admin Reply</span>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.adminReply}</p>
                  </div>
                )}

                {c.status === 'open' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    <textarea 
                      rows={3}
                      placeholder="Type your reply here..."
                      value={replyText[c._id] || ''}
                      onChange={e => setReplyText({ ...replyText, [c._id]: e.target.value })}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleAction(c._id, 'reply')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CornerDownRight size={16} /> Send Reply Only
                      </button>
                      <button onClick={() => handleAction(c._id, 'resolve')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#000', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={16} /> Send & Resolve Ticket
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
