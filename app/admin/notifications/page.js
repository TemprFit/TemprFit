'use client';

import { useState } from 'react';
import { Send, Megaphone } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminNotifications() {
  const [targetGroup, setTargetGroup] = useState('all');
  const [title, setTitle] = useState('Admin Notice');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetGroup, title, message, link })
      });
      const data = await res.json();
      if (data.success) {
        window.appAlert(`Successfully sent notification to ${data.count} users!`);
        setMessage('');
        setLink('');
      } else {
        window.appAlert(data.error);
      }
    } catch (e) {
      console.error(e);
      window.appAlert('Failed to send notifications.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Broadcast <span className={styles.gradient}>Notifications</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Send mass notifications to specific user segments.</p>
      </div>

      <div className={styles.section} style={{ maxWidth: '600px', marginTop: '24px' }}>
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Megaphone size={20} color="#3b82f6" /> Send Broadcast</h2>
          
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Target Audience</label>
              <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="all">All Users</option>
                <option value="free">Free Tier Users</option>
                <option value="pro">Pro Tier Users</option>
                <option value="max">Max Tier Users</option>
                <option value="trainers">All Trainers</option>
                <option value="trainees">All Trainees</option>
                <option value="new_users_7d">New Users (Last 7 Days)</option>
                <option value="new_users_30d">New Users (Last 30 Days)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Notification Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Title" 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Message</label>
              <textarea 
                rows={4} 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                placeholder="Message body..." 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Link (Optional)</label>
              <input 
                type="text" 
                value={link} 
                onChange={e => setLink(e.target.value)} 
                placeholder="e.g. /upgrade" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
              />
            </div>

            <button type="submit" disabled={loading} style={{ background: 'var(--color-primary)', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <Send size={18} /> {loading ? 'Sending...' : 'Broadcast Notification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
