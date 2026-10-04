'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Activity, Flame, Dumbbell, Sun, Moon, Zap, Shield, Trophy, Plus, X, Upload } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

const ICON_MAP = {
  'Flame': Flame,
  'Dumbbell': Dumbbell,
  'Activity': Activity,
  'Sun': Sun,
  'Moon': Moon,
  'Zap': Zap,
  'Shield': Shield,
  'Trophy': Trophy
};

export default function PodsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pods, setPods] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPodName, setNewPodName] = useState('');
  const [newPodDesc, setNewPodDesc] = useState('');
  const [newPodIcon, setNewPodIcon] = useState('Dumbbell');
  const [newPodImage, setNewPodImage] = useState('');
  const [newPodReward, setNewPodReward] = useState('');
  const [newPodRewardType, setNewPodRewardType] = useState('pool_share');
  const [newPodGoalType, setNewPodGoalType] = useState('volume_lifted');
  const [newPodGoalTarget, setNewPodGoalTarget] = useState('');
  const [newPodDuration, setNewPodDuration] = useState('7');
  const [newPodRules, setNewPodRules] = useState('');
  const [newPodPrivate, setNewPodPrivate] = useState(false);
  
  const [selectedPod, setSelectedPod] = useState(null);
  const [loadingPodDetails, setLoadingPodDetails] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, pod: null, action: null });
  const [shareModal, setShareModal] = useState({ isOpen: false, podId: null, username: '', loading: false });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login');
          return;
        }
        setUser(data.user);
        
        fetch('/api/pods').then(r => r.json()).then(pData => {
          if (pData.pods) setPods(pData.pods);
        });
        
        fetch('/api/pods/feed').then(r => r.json()).then(fData => {
          if (fData.feed) setFeed(fData.feed);
          setLoading(false);
        });
      });
  }, [router]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setNewPodImage(data.fileUrl);
      else window.appAlert('Upload failed');
    } catch (err) {
      window.appAlert('Upload failed');
    }
    setUploadingImage(false);
  };

  const toggleJoinClick = (pod) => {
    const action = pod.joined ? 'leave' : 'join';
    setConfirmModal({ isOpen: true, pod, action });
  };

  const executeToggleJoin = async () => {
    const { pod, action } = confirmModal;
    setConfirmModal({ isOpen: false, pod: null, action: null });
    
    try {
      const res = await fetch(`/api/pods/${pod.id}/join`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPods(pods.map(p => {
          if (p.id === pod.id) {
            return { ...p, joined: data.joined, membersCount: data.members };
          }
          return p;
        }));
        
        if (selectedPod && selectedPod.id === pod.id) {
          setSelectedPod(null);
        }
        
        window.appAlert(`Successfully ${action === 'join' ? 'joined' : 'left'} the pod!`);
      } else {
        window.appAlert(data.error || 'We could not update your pod membership. Please try again!');
      }
    } catch (e) {
      window.appAlert('We could not update your pod membership. Please try again!');
    }
  };

  const executeSharePod = async (e) => {
    e.preventDefault();
    const { podId, username } = shareModal;
    if (!username) return;
    
    setShareModal({ ...shareModal, loading: true });
    
    try {
      const res = await fetch(`/api/pods/${podId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });
      const data = await res.json();
      
      setShareModal({ isOpen: false, podId: null, username: '', loading: false });
      
      if (data.success) {
        window.appAlert(data.message);
      } else {
        window.appAlert(data.error);
      }
    } catch (err) {
      setShareModal({ isOpen: false, podId: null, username: '', loading: false });
      window.appAlert('Failed to share pod. Please check your connection.');
    }
  };

  const handleCreatePod = async (e) => {
    e.preventDefault();
    if (!newPodName || !newPodDesc) return;
    setCreating(true);
    try {
      const payload = {
        name: newPodName,
        description: newPodDesc,
        icon: newPodIcon,
        image: newPodImage,
        rewardPool: parseInt(newPodReward) || 0,
        rewardType: newPodRewardType,
        goalType: newPodGoalType,
        goalTarget: parseInt(newPodGoalTarget) || 0,
        durationDays: parseInt(newPodDuration) || 7,
        rules: newPodRules,
        isPrivate: newPodPrivate
      };

      const res = await fetch('/api/pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        fetch('/api/pods').then(r => r.json()).then(pData => {
          if (pData.pods) setPods(pData.pods);
        });
        setShowCreateModal(false);
        setNewPodName('');
        setNewPodDesc('');
        setNewPodReward('');
        setNewPodGoalTarget('');
        setNewPodRules('');
        setNewPodImage('');
        // Update user XP locally so they don't have to refresh if XP was deducted
        if (payload.rewardPool > 0) {
          setUser(prev => ({ ...prev, xp: prev.xp - payload.rewardPool }));
        }
      } else {
        window.appAlert(data.error || 'We couldn\'t create the pod right now.');
      }
    } catch (e) {
      window.appAlert('We couldn\'t create the pod right now.');
    }
    setCreating(false);
  };

  if (!user || loading) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container"><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading pods...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Training Pods</h1>
              <p className={styles.subtitle}>Join a group of like-minded athletes and stay accountable together.</p>
            </div>
            <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
              <Plus size={20} /> Create Pod
            </button>
          </div>

          <div className={styles.podsGrid}>
            {pods.map(pod => {
              const Icon = ICON_MAP[pod.icon] || Activity;
              return (
                <div key={pod.id} className={styles.podCard} onClick={async () => {
                  setSelectedPod(pod);
                  setLoadingPodDetails(true);
                  try {
                    const res = await fetch(`/api/pods/${pod.id}`);
                    const data = await res.json();
                    if (data.pod) setSelectedPod(data.pod);
                  } catch (e) {
                    console.error('Failed to load pod details', e);
                  }
                  setLoadingPodDetails(false);
                }} style={{ cursor: 'pointer' }}>
                  <div className={styles.podHeader}>
                    <div>
                      <h3 className={styles.podName}>{pod.name}</h3>
                      {pod.isPrivate && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#ef4444', borderRadius: '4px', marginLeft: '8px' }}>
                          PRIVATE
                        </span>
                      )}
                      <div className={styles.podMembers}>
                        <Users size={14} /> {pod.membersCount} members
                      </div>
                    </div>
                    <div className={styles.podIconWrap}>
                      {pod.image ? (
                        <img src={pod.image} alt="Pod" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                      ) : (
                        <Icon size={24} />
                      )}
                    </div>
                  </div>
                  
                  <p className={styles.podDesc}>{pod.description}</p>
                  
                  {(pod.goalType || pod.rewardPool > 0) && (
                    <div style={{ marginTop: '16px', marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>{pod.goalType?.replace('_', ' ').toUpperCase()}</span>
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>{pod.rewardPool} XP Pool</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <span>Target: {pod.goalTarget ? pod.goalTarget.toLocaleString() : 'N/A'}</span>
                        <span>Ends: {new Date(pod.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  <button 
                    className={`${styles.joinBtn} ${pod.joined ? styles.joinedBtn : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleJoinClick(pod); }}
                  >
                    {pod.joined ? 'Leave Pod' : 'Join Pod'}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Pod Details Modal */}
      {selectedPod && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPod(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button className={styles.closeBtn} onClick={() => setSelectedPod(null)}>
              <X size={24} />
            </button>
            
            {loadingPodDetails ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading pod details...</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {selectedPod.image ? (
                      <img src={selectedPod.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Activity size={32} color="var(--color-primary)" />
                    )}
                  </div>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedPod.name}</h2>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                      {selectedPod.membersCount} Members • {selectedPod.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                    </div>
                  </div>
                </div>
                
                <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>{selectedPod.description}</p>
                
                {selectedPod.rules && (
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-primary)' }}>Pod Rules</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{selectedPod.rules}</p>
                  </div>
                )}
    
                <div style={{ background: 'linear-gradient(45deg, rgba(34,197,94,0.1), rgba(16,185,129,0.1))', padding: '16px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={16} /> Reward & Completion Criteria
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', marginBottom: '12px' }}>
                    <div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Reward Type</div>
                      <div style={{ fontWeight: 'bold' }}>{selectedPod.rewardType?.replace(/_/g, ' ').toUpperCase() || 'SHARED POOL'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Reward XP</div>
                      <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>{selectedPod.rewardPool ? selectedPod.rewardPool.toLocaleString() : 0} XP Pool</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Goal Type</div>
                      <div style={{ fontWeight: 'bold' }}>{selectedPod.goalType?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Pod Type</div>
                      <div style={{ fontWeight: 'bold', color: selectedPod.podType === 'goal_bound' ? '#06b6d4' : '#a855f7' }}>
                        {selectedPod.podType?.replace('_', ' ').toUpperCase() || 'TIME BOUND'}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0px', marginBottom: 0 }}>
                    {selectedPod.podType === 'goal_bound' 
                      ? `The pod will end immediately as soon as a user hits the target of ${(selectedPod.goalTarget || 0).toLocaleString()}.` 
                      : `The pod will run until the duration is over (${selectedPod.endDate ? new Date(selectedPod.endDate).toLocaleDateString() : 'TBD'}). Progress is tallied at the end.`}
                  </p>
                </div>
                
                {selectedPod.leaderboard && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0' }}>Mini-Leaderboard</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedPod.leaderboard.length === 0 ? (
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>No members have joined yet.</div>
                      ) : (
                        selectedPod.leaderboard.map(m => (
                          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                              <span style={{ fontWeight: 'bold', color: m.rank === 1 ? '#fbbf24' : m.rank === 2 ? '#94a3b8' : m.rank === 3 ? '#b45309' : 'var(--color-text-muted)', flexShrink: 0, width: '24px' }}>#{m.rank}</span>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {m.avatar ? <img src={m.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Users size={16} />}
                              </div>
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.username}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                              <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                {m.score.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>{selectedPod.goalType === 'volume_lifted' ? 'kg' : selectedPod.goalType === 'streak_maintained' ? 'days' : 'workouts'}</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{m.xp.toLocaleString()} total XP</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    style={{ flex: 1, padding: '16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => toggleJoinClick(selectedPod)}
                  >
                    {selectedPod.joined ? 'Leave Pod' : 'Join Pod Now'}
                  </button>
                  <button 
                    style={{ flex: 1, padding: '16px', background: 'transparent', color: 'var(--color-primary)', border: '2px solid var(--color-primary)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={() => setShareModal({ isOpen: true, podId: selectedPod.id, username: '', loading: false })}
                  >
                    Share Pod
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Pod Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '8px' }}>Create a New Pod</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Design your own custom challenge and fund the prize pool.</p>
            
            <form onSubmit={handleCreatePod} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Pod Name</label>
                <input type="text" value={newPodName} onChange={(e) => setNewPodName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }} placeholder="e.g. 5AM Club" required />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Description</label>
                <textarea value={newPodDesc} onChange={(e) => setNewPodDesc(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff', minHeight: '60px' }} placeholder="What is this pod about?" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Goal Type</label>
                  <select value={newPodGoalType} onChange={(e) => setNewPodGoalType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}>
                    <option value="volume_lifted">Total Volume Lifted</option>
                    <option value="workouts_logged">Workouts Logged</option>
                    <option value="streak_maintained">Streak Maintained</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Target Value</label>
                  <input type="number" value={newPodGoalTarget} onChange={(e) => setNewPodGoalTarget(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }} placeholder="e.g. 50000" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Reward XP Pool</label>
                  <input type="number" value={newPodReward} onChange={(e) => setNewPodReward(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }} placeholder="Deducted from you" />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Your balance: {user.xp} XP</div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Reward Type</label>
                  <select value={newPodRewardType} onChange={(e) => setNewPodRewardType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}>
                    <option value="winner_takes_all">Winner Takes All</option>
                    <option value="pool_share">Shared Pool</option>
                    <option value="top_three">Top Three Split</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Duration (Days)</label>
                  <select value={newPodDuration} onChange={(e) => setNewPodDuration(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}>
                    <option value="7">1 Week</option>
                    <option value="14">2 Weeks</option>
                    <option value="30">1 Month</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Visibility</label>
                  <select value={newPodPrivate} onChange={(e) => setNewPodPrivate(e.target.value === 'true')} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}>
                    <option value="false">Public</option>
                    <option value="true">Private (Invite Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Rules & Requirements</label>
                <textarea value={newPodRules} onChange={(e) => setNewPodRules(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff', minHeight: '60px' }} placeholder="Any specific rules?" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Pod Image</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}>
                    <Upload size={16} /> {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                  </label>
                  {newPodImage && <img src={newPodImage} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />}
                </div>
              </div>

              {!newPodImage && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Or Select Icon</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.keys(ICON_MAP).map(iconKey => {
                      const IconComp = ICON_MAP[iconKey];
                      return (
                        <button key={iconKey} type="button" onClick={() => setNewPodIcon(iconKey)} style={{ padding: '12px', borderRadius: '8px', background: newPodIcon === iconKey ? 'var(--color-primary)' : 'var(--color-bg)', border: `1px solid ${newPodIcon === iconKey ? 'var(--color-primary)' : 'var(--color-border)'}`, color: '#fff', cursor: 'pointer' }}>
                          <IconComp size={24} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <button type="submit" disabled={creating} style={{ marginTop: '16px', background: 'var(--color-primary)', color: 'white', padding: '16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: creating ? 'not-allowed' : 'pointer' }}>
                {creating ? 'Creating...' : 'Launch Pod'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setConfirmModal({ isOpen: false, pod: null, action: null })}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: confirmModal.action === 'join' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trophy size={32} color={confirmModal.action === 'join' ? '#22c55e' : '#ef4444'} />
            </div>
            <h2 style={{ margin: '0 0 12px 0' }}>{confirmModal.action === 'join' ? 'Join Pod' : 'Leave Pod'}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              {confirmModal.action === 'join' 
                ? `Are you sure you want to join ${confirmModal.pod?.name}? Make sure you've read the rules!`
                : `Are you sure you want to leave ${confirmModal.pod?.name}? You will lose any progress tracked towards its goal.`}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                style={{ flex: 1, padding: '12px', background: 'var(--color-surface)', color: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => setConfirmModal({ isOpen: false, pod: null, action: null })}
              >
                Cancel
              </button>
              <button 
                style={{ flex: 1, padding: '12px', background: confirmModal.action === 'join' ? 'var(--color-primary)' : '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={executeToggleJoin}
              >
                {confirmModal.action === 'join' ? 'Yes, Join' : 'Yes, Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Pod Modal */}
      {shareModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setShareModal({ isOpen: false, podId: null, username: '', loading: false })}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className={styles.closeBtn} onClick={() => setShareModal({ isOpen: false, podId: null, username: '', loading: false })}>
              <X size={24} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={32} color="#3b82f6" />
              </div>
              <h2 style={{ margin: '0 0 8px 0' }}>Invite an Athlete</h2>
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>Enter their exact username to send an invitation.</p>
            </div>
            
            <form onSubmit={executeSharePod}>
              <div className={styles.formGroup}>
                <label>Username</label>
                <input 
                  type="text" 
                  value={shareModal.username}
                  onChange={e => setShareModal({...shareModal, username: e.target.value})}
                  placeholder="e.g. ironlifter99"
                  required
                />
              </div>
              <button 
                type="submit"
                style={{ width: '100%', padding: '16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
                disabled={shareModal.loading}
              >
                {shareModal.loading ? 'Sending Invite...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
