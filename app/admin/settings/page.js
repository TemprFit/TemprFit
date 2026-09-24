'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import styles from '../page.module.css';

const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setForm({ username: data.user.username || '', avatarUrl: data.user.avatarUrl || '' });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Please choose an image under 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, avatarUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          avatarUrl: form.avatarUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.appAlert('Settings saved!');
    } catch (e) {
      setError(e.message || 'Failed to save settings');
    }
    setSaving(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setPasswordSaving(true);

    try {
      const res = await fetch('/api/admin/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.success) {
        window.appAlert('Master password updated successfully! Please remember the new password.');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error);
      }
    } catch (e) {
      console.error(e);
      setPasswordError('Failed to update password.');
    }
    setPasswordSaving(false);
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
        <h1>Admin <span className={styles.gradient}>Settings</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Manage your administrator profile.</p>
      </div>

      <div className={styles.section} style={{ maxWidth: '600px', marginTop: '24px' }}>
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-surface-elevated)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                form.username?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} /> Update Photo
              </button>
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleAvatarPick} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Username</label>
              <input 
                type="text" 
                value={form.username} 
                onChange={e => setForm({...form, username: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
              />
            </div>
            
            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
            
            <button 
              onClick={handleSave} 
              disabled={saving} 
              style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Save Changes
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Change Master Password</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            This password is required for you and any other admins to log into this portal.
          </p>
          
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>New Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Enter new password" 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Confirm new password" 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
              />
            </div>
            
            {passwordError && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{passwordError}</p>}

            <button type="submit" disabled={passwordSaving} style={{ background: 'var(--color-primary)', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              {passwordSaving ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
