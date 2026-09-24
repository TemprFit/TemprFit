'use client';

import { useState } from 'react';
import { Search, ShieldAlert, Star, Award, ShieldCheck, X } from 'lucide-react';
import styles from './page.module.css';

export default function UserManagement() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (e) => {
    e.preventDefault();
    if (!query || query.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (userId, currentStatus) => {
    if (!await window.appConfirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;
    try {
      const res = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBanned: !currentStatus })
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, isBanned: !currentStatus } : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const grantXP = async (userId) => {
    const amount = parseInt(await window.appPrompt('How much XP to grant? (e.g. 1000)'), 10);
    if (!amount || isNaN(amount)) return;
    try {
      const res = await fetch('/api/admin/users/grant-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, xp: data.newXP } : u));
        window.appAlert(`Success! User now has ${data.newXP} XP.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const grantBadge = async (userId) => {
    const badgeId = await window.appPrompt('Enter Badge ID (e.g., vip_gold, rocket_fuel):');
    if (!badgeId) return;
    try {
      const res = await fetch('/api/admin/users/grant-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, badgeId })
      });
      const data = await res.json();
      if (res.ok) {
        window.appAlert(`Success! Granted badge ${data.badge.name}`);
      } else {
        window.appAlert(`Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.section} style={{ marginTop: '40px' }}>
      <h2>User Management (God Mode)</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>Search for users to ban, grant XP, or award custom badges.</p>
      
      <form onSubmit={searchUsers} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Search by username or email..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'white' }}
        />
        <button type="submit" disabled={loading} className={styles.approveBtn} style={{ background: '#3b82f6' }}>
          <Search size={18} style={{ verticalAlign: 'middle' }} /> Search
        </button>
      </form>

      {users.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users.map(user => (
            <div key={user._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div>
                <strong style={{ color: user.isBanned ? '#ef4444' : 'white', fontSize: '1.1rem' }}>{user.username}</strong>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px', fontSize: '0.9rem' }}>{user.email}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Role: {user.role} | XP: {user.xp || 0} | Joined: {new Date(user.createdAt).toLocaleDateString()}
                  {user.isBanned && <span style={{ color: '#ef4444', marginLeft: '8px', fontWeight: 'bold' }}>[BANNED]</span>}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => grantXP(user._id)} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={14} /> Grant XP
                </button>
                <button onClick={() => grantBadge(user._id)} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} /> Grant Badge
                </button>
                <button onClick={() => toggleBan(user._id, user.isBanned)} style={{ padding: '8px 12px', borderRadius: '6px', background: user.isBanned ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: user.isBanned ? '#22c55e' : '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {user.isBanned ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />} {user.isBanned ? 'Unban User' : 'Ban User'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
