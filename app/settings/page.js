'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, Loader2, Link as LinkIcon, FileText, Video } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { PRESET_AVATAR_URLS } from '@/lib/avatars';
import styles from './settings.module.css';

const GOALS = ['Lose Weight', 'Build Muscle', 'Increase Strength', 'Improve Endurance', 'General Fitness'];
const EXPERIENCES = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [signedIn, setSignedIn] = useState(true);
  const [form, setForm] = useState(null);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseResults, setExerciseResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeMode, setActiveMode] = useState('trainee');
  
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const mode = localStorage.getItem('activeMode') || 'trainee';
    setActiveMode(mode);

    fetch('/api/user/profile')
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        setForm({
          username: data.user.username || '',
          goal: data.user.goal || '',
          experience: data.user.experience || '',
          weightUnit: data.user.weightUnit || 'lbs',
          avatarUrl: data.user.avatarUrl || '',
          weeklySessions: data.user.goals?.weeklySessions || 4,
          targetExerciseSlug: data.user.goals?.targetExerciseSlug || '',
          targetExerciseName: '',
          targetWeight: data.user.goals?.targetWeight ?? '',
          trainerBio: data.user.trainerInfo?.bio || '',
          trainerSpecialties: data.user.trainerInfo?.specialties?.join(', ') || '',
          trainerPrice: data.user.trainerInfo?.price || 50,
          trainerLocation: data.user.trainerInfo?.location || '',
          trainerMode: data.user.trainerInfo?.trainingMode || 'remote',
          trainerMediaGallery: data.user.trainerInfo?.mediaGallery?.join(', ') || '',
          trainerResumeUrl: data.user.trainerInfo?.resumeUrl || '',
          trainerIntroVideoUrl: data.user.trainerInfo?.introVideoUrl || '',
          trainerExpertise: data.user.trainerInfo?.expertise?.join(', ') || '',
          trainerExperienceYears: data.user.trainerInfo?.experienceYears || 0,
        });
        
        if (data.user.goals?.targetExerciseSlug) {
          fetch(`/api/exercises/${data.user.goals.targetExerciseSlug}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((ex) => {
              if (ex?.exercise) {
                setExerciseQuery(ex.exercise.name);
                setForm((f) => ({ ...f, targetExerciseName: ex.exercise.name }));
              }
            })
            .catch(() => {});
        }
      })
      .catch((e) => {
        if (e.message === 'signin') setSignedIn(false);
      });
  }, []);

  useEffect(() => {
    if (!exerciseQuery || exerciseQuery === form?.targetExerciseName) {
      setExerciseResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(exerciseQuery)}`)
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => setExerciseResults((d.items || []).slice(0, 6)))
        .catch(() => setExerciseResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [exerciseQuery]);

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Please choose an image under 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatarUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          goal: form.goal,
          experience: form.experience,
          weightUnit: form.weightUnit,
          avatarUrl: form.avatarUrl,
          goals: {
            weeklySessions: Number(form.weeklySessions) || 4,
            targetExerciseSlug: form.targetExerciseSlug || undefined,
            targetWeight: form.targetWeight === '' ? null : Number(form.targetWeight),
          },
          trainerInfo: user?.role === 'trainer' ? {
            bio: form.trainerBio,
            specialties: form.trainerSpecialties.split(',').map(s => s.trim()).filter(Boolean),
            price: Number(form.trainerPrice) || 50,
            location: form.trainerLocation,
            trainingMode: form.trainerMode,
            mediaGallery: form.trainerMediaGallery.split(',').map(s => s.trim()).filter(Boolean),
            resumeUrl: form.trainerResumeUrl,
            introVideoUrl: form.trainerIntroVideoUrl,
            expertise: form.trainerExpertise.split(',').map(s => s.trim()).filter(Boolean),
            experienceYears: Number(form.trainerExperienceYears) || 0,
          } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save changes.');
        return;
      }
      setUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMessage('New passwords do not match.');
      return;
    }
    setPasswordMessage('');
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.new }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');
      setPasswordMessage('Password changed successfully!');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (e) {
      setPasswordMessage(e.message);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyingEmail(true);
    try {
      const res = await fetch('/api/user/verify-email', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        window.appAlert('Awesome! Your email has been verified.');
        setUser(prev => ({ ...prev, emailVerified: true }));
      } else {
        window.appAlert(data.error || 'We couldn\'t verify your email right now.');
      }
    } catch (err) {
      window.appAlert('We\'re having trouble connecting to the network right now. Please check your connection and try again!');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!await window.appConfirm("Are you sure? This will permanently delete your account, progress, and all data. This action cannot be undone.")) return;
    try {
      const res = await fetch('/api/user/profile', { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (e) {
      setError('Network error');
    }
  };

  const handleDeleteTrainerProfile = async () => {
    if (!await window.appConfirm("Are you sure you want to delete your trainer profile? You will lose access to the trainer dashboard and revert to a regular user. This action cannot be undone.")) return;
    try {
      const res = await fetch('/api/trainer/delete', { method: 'DELETE' });
      if (res.ok) {
        localStorage.setItem('activeMode', 'trainee');
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete trainer profile');
      }
    } catch (e) {
      setError('Network error');
    }
  };

  if (!signedIn) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container">
            <p className={styles.signinMsg}>
              Sign in to edit your profile. <Link href="/login" style={{ color: '#22c55e' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <h1>{activeMode === 'trainer' ? 'Trainer Profile' : 'Settings'}</h1>
            <p>
              {activeMode === 'trainer' 
                ? 'Manage your professional coaching profile, CV, and videos.' 
                : 'Manage your profile, photo, and goals. Everything here is saved to your account.'}
            </p>
          </div>

          <div className={styles.card}>
            <h3>Profile Photo</h3>
            <div className={styles.avatarRow}>
              <div className={styles.avatarPreview}>
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Your avatar" />
                ) : (
                  <span>{form.username?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div>
                <button type="button" className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                  <Camera size={16} /> Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarPick}
                />
                {form.avatarUrl && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setForm((f) => ({ ...f, avatarUrl: '' }))}
                  >
                    Remove
                  </button>
                )}
                <p className={styles.hint}>JPG or PNG, under 1.5MB — or pick a preset avatar below.</p>
              </div>
            </div>

            <p className={styles.cardHint} style={{ marginTop: 16 }}>Or choose a preset avatar</p>
            <div className={styles.avatarGrid}>
              {PRESET_AVATAR_URLS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`${styles.avatarOption} ${form.avatarUrl === preset.url ? styles.avatarOptionSelected : ''}`}
                  onClick={() => setForm((f) => ({ ...f, avatarUrl: preset.url }))}
                  aria-label={`Use the ${preset.id} avatar`}
                >
                  <img src={preset.url} alt="" />
                </button>
              ))}
            </div>
          </div>

          {/* BASIC PROFILE (COMMON) */}
          <div className={styles.card}>
            <h3>Basic Info</h3>
            
            <div className={styles.field}>
              <label>Email Address</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input value={user?.email || ''} disabled style={{ flex: 1, opacity: 0.7 }} />
                {user?.emailVerified ? (
                  <span className={styles.clean} style={{ flexShrink: 0 }}><Check size={16} /> Verified</span>
                ) : (
                  <button 
                    className={styles.saveBtn} 
                    style={{ flexShrink: 0, padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)' }}
                    onClick={handleVerifyEmail}
                    disabled={verifyingEmail}
                  >
                    {verifyingEmail ? 'Sending...' : 'Verify Email'}
                  </button>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label>Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>

            <div className={styles.field}>
              <label>Weight Unit</label>
              <div className={styles.optionRow}>
                {['lbs', 'kg'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={`${styles.optionBtn} ${form.weightUnit === u ? styles.selected : ''}`}
                    onClick={() => setForm({ ...form, weightUnit: u })}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TRAINEE SECTION */}
          {activeMode !== 'trainer' && (
            <>
              <div className={styles.card}>
                <h3>Fitness Profile</h3>
                <div className={styles.field}>
                  <label>Fitness Goal</label>
                  <div className={styles.optionRow}>
                    {GOALS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`${styles.optionBtn} ${form.goal === g ? styles.selected : ''}`}
                        onClick={() => setForm({ ...form, goal: g })}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Experience Level</label>
                  <div className={styles.optionRow}>
                    {EXPERIENCES.map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        className={`${styles.optionBtn} ${form.experience === exp ? styles.selected : ''}`}
                        onClick={() => setForm({ ...form, experience: exp })}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3>Goals</h3>
                <p className={styles.cardHint}>These drive the progress bars on your Dashboard.</p>

                <div className={styles.field}>
                  <label>Weekly Session Target</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={form.weeklySessions}
                    onChange={(e) => setForm({ ...form, weeklySessions: e.target.value })}
                  />
                </div>

                <div className={styles.field} style={{ position: 'relative' }}>
                  <label>Target Lift</label>
                  <input
                    placeholder="Search exercises… e.g. Barbell Bench Press"
                    value={exerciseQuery}
                    onChange={(e) => {
                      setExerciseQuery(e.target.value);
                      setForm((f) => ({ ...f, targetExerciseSlug: '', targetExerciseName: '' }));
                    }}
                  />
                  {exerciseResults.length > 0 && (
                    <div className={styles.dropdown}>
                      {exerciseResults.map((ex) => (
                        <button
                          key={ex.slug}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => {
                            setForm((f) => ({ ...f, targetExerciseSlug: ex.slug, targetExerciseName: ex.name }));
                            setExerciseQuery(ex.name);
                            setExerciseResults([]);
                          }}
                        >
                          {ex.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Target Weight ({form.weightUnit}, estimated 1RM)</label>
                  <input
                    type="number"
                    placeholder="e.g. 225"
                    value={form.targetWeight}
                    onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* TRAINER SECTION */}
          {activeMode === 'trainer' && user?.role === 'trainer' && (
            <div className={styles.card} style={{ border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#22c55e' }}>Professional Profile</h3>
                  <p className={styles.cardHint} style={{ marginTop: '4px' }}>This information is publicly visible to potential clients.</p>
                </div>
                {user.trainerInfo?.isVerified && (
                  <span style={{ background: '#22c55e', color: '#000', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={14} /> Verified Trainer
                  </span>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className={styles.field}>
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={form.trainerExperienceYears}
                    onChange={(e) => setForm({ ...form, trainerExperienceYears: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Session Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.trainerPrice}
                    onChange={(e) => setForm({ ...form, trainerPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Location</label>
                <input
                  placeholder="e.g. New York, NY or Remote"
                  value={form.trainerLocation}
                  onChange={(e) => setForm({ ...form, trainerLocation: e.target.value })}
                />
              </div>
              
              <div className={styles.field}>
                <label>Training Mode</label>
                <div className={styles.optionRow}>
                  {['remote', 'physical', 'hybrid'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`${styles.optionBtn} ${form.trainerMode === m ? styles.selected : ''}`}
                      onClick={() => setForm({ ...form, trainerMode: m })}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Expertise Categories (comma separated)</label>
                <input
                  placeholder="e.g. Weightlifting, Cardio, Yoga"
                  value={form.trainerExpertise}
                  onChange={(e) => setForm({ ...form, trainerExpertise: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label>Professional Bio</label>
                <textarea
                  placeholder="Tell clients about your background and coaching philosophy..."
                  value={form.trainerBio}
                  onChange={(e) => setForm({ ...form, trainerBio: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', resize: 'vertical', minHeight: '120px' }}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

              <h4 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Media & Documents</h4>

              <div className={styles.field}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} /> Resume / CV (URL)</label>
                <input
                  placeholder="Link to your Google Drive PDF or LinkedIn"
                  value={form.trainerResumeUrl}
                  onChange={(e) => setForm({ ...form, trainerResumeUrl: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Video size={16} /> Intro Video (YouTube URL)</label>
                <input
                  placeholder="https://youtube.com/watch?v=..."
                  value={form.trainerIntroVideoUrl}
                  onChange={(e) => setForm({ ...form, trainerIntroVideoUrl: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><LinkIcon size={16} /> Image Gallery (comma separated URLs)</label>
                <textarea
                  placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                  value={form.trainerMediaGallery}
                  onChange={(e) => setForm({ ...form, trainerMediaGallery: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>Danger Zone</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Permanently delete your trainer profile. You will lose access to the trainer dashboard and revert to a regular trainee account. You can register again later.
                </p>
                <button 
                  type="button"
                  className={styles.saveBtn} 
                  style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }} 
                  onClick={handleDeleteTrainerProfile}
                >
                  Delete Trainer Profile
                </button>
              </div>
            </div>
          )}

          {error && <p className={styles.errorText}>{error}</p>}

          <button className={styles.saveBtn} onClick={handleSave} disabled={saving} style={{ marginBottom: '40px', width: '100%', padding: '16px', fontSize: '1.1rem' }}>
            {saving ? <Loader2 size={20} className={styles.spin} /> : saved ? <Check size={20} /> : null}
            {saving ? 'Saving Profile…' : saved ? 'Saved Successfully' : 'Save Profile Changes'}
          </button>

          <div className={styles.card}>
            <h3>Security</h3>
            <p className={styles.cardHint}>Change your account password.</p>
            
            <div className={styles.field}>
              <label>Current Password</label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>New Password</label>
              <input
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              />
            </div>

            {passwordMessage && <p className={passwordMessage.includes('successfully') ? styles.clean : styles.errorText} style={{ marginBottom: 15 }}>{passwordMessage}</p>}
            
            <button 
              className={styles.saveBtn} 
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }} 
              onClick={handleChangePassword}
              disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm}
            >
              Update Password
            </button>
          </div>

          <div className={styles.card} style={{ marginTop: '40px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <h3 style={{ color: '#ef4444' }}>Danger Zone</h3>
            <p className={styles.cardHint} style={{ color: 'rgba(239, 68, 68, 0.8)' }}>Permanently delete your account and all associated data.</p>
            
            <button 
              className={styles.saveBtn} 
              style={{ background: '#ef4444', color: '#fff', border: 'none', marginTop: '16px' }} 
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
