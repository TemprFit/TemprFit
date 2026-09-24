'use client';

import { useState, useEffect } from 'react';
import { Search, ShieldAlert, Star, Award, ShieldCheck, X, Edit, Camera, Loader2, Check } from 'lucide-react';
import styles from '../page.module.css';

export default function UserManagementPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [banModalUser, setBanModalUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('7'); // days, or 'permanent'

  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', avatarUrl: '', password: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    // Optionally fetch some default users or wait for search
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (e) => {
    e.preventDefault();
    if (!query || query.length < 2) return fetchUsers();
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

  const handleUnban = async (userId) => {
    if (!await window.appConfirm('Are you sure you want to unban this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban' })
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, isBanned: false } : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitBan = async (e) => {
    e.preventDefault();
    if (!banModalUser) return;
    try {
      const res = await fetch(`/api/admin/users/${banModalUser._id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'ban',
          reason: banReason,
          durationDays: banDuration === 'permanent' ? null : parseInt(banDuration)
        })
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === banModalUser._id ? { ...u, isBanned: true } : u));
        setBanModalUser(null);
        setBanReason('');
        setBanDuration('7');
      } else {
        window.appAlert('Failed to ban user');
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

  const openEditModal = (user) => {
    setEditUser(user);
    setEditForm({ username: user.username, avatarUrl: user.avatarUrl || '', password: '' });
    setEditError('');
  };

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setEditError('Image must be under 1.5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditForm(f => ({ ...f, avatarUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/users/${editUser._id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u._id === editUser._id ? { ...u, username: data.user.username, avatarUrl: data.user.avatarUrl } : u));
        setEditUser(null);
      } else {
        setEditError(data.error || 'Failed to update user');
      }
    } catch (e) {
      setEditError('Network error');
    }
    setEditSaving(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>User <span className={styles.gradient}>Management</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Search for users to ban, grant XP, or award custom badges.</p>
      </div>

      <div className={styles.section} style={{ marginTop: '24px' }}>
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
                  <button onClick={() => openEditModal(user)} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => grantXP(user._id)} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={14} /> Grant XP
                  </button>
                  <button onClick={() => grantBadge(user._id)} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} /> Grant Badge
                  </button>
                  {user.isBanned ? (
                    <button onClick={() => handleUnban(user._id)} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} /> Unban User
                    </button>
                  ) : (
                    <button onClick={() => setBanModalUser(user)} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} /> Ban User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {banModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-surface-elevated)', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20} /> Ban {banModalUser.username}</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setBanModalUser(null)} />
            </div>
            
            <form onSubmit={submitBan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Reason for ban</label>
                <input 
                  type="text" 
                  value={banReason} 
                  onChange={e => setBanReason(e.target.value)} 
                  placeholder="Violation of terms..." 
                  required 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Ban Duration</label>
                <select 
                  value={banDuration} 
                  onChange={e => setBanDuration(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                >
                  <option value="7">1 Week</option>
                  <option value="14">2 Weeks</option>
                  <option value="30">1 Month</option>
                  <option value="permanent">Permanent / Lifetime</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setBanModalUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Confirm Ban</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-surface-elevated)', padding: '24px', borderRadius: '12px', width: '500px', border: '1px solid var(--color-border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}><Edit size={20} /> Edit {editUser.username}</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setEditUser(null)} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-surface)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                {editForm.avatarUrl ? (
                  <img src={editForm.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  editForm.username[0]?.toUpperCase()
                )}
              </div>
              <label style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                <Camera size={16} /> Upload New Picture
                <input type="file" accept="image/*" hidden onChange={handleAvatarPick} />
              </label>
            </div>

            <form onSubmit={submitEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Username</label>
                <input 
                  type="text" 
                  value={editForm.username} 
                  onChange={e => setEditForm({...editForm, username: e.target.value})} 
                  required 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>New Password (leave blank to keep current)</label>
                <input 
                  type="password" 
                  value={editForm.password} 
                  onChange={e => setEditForm({...editForm, password: e.target.value})} 
                  placeholder="Leave empty to not change" 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
                />
              </div>

              {editError && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{editError}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setEditUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={editSaving} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#3b82f6', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {editSaving ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
