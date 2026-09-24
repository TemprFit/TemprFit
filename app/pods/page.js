'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Activity, Flame, Dumbbell, Sun, Moon, Zap, Shield, Trophy, Plus, X } from 'lucide-react';
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
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login');
          return;
        }
        setUser(data.user);
        
        // Fetch pods
        fetch('/api/pods').then(r => r.json()).then(pData => {
          if (pData.pods) setPods(pData.pods);
        });
        
        // Fetch feed
        fetch('/api/pods/feed').then(r => r.json()).then(fData => {
          if (fData.feed) setFeed(fData.feed);
          setLoading(false);
        });
      });
  }, [router]);

  const toggleJoin = async (id) => {
    try {
      const res = await fetch(`/api/pods/${id}/join`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPods(pods.map(p => {
          if (p.id === id) {
            return { ...p, joined: data.joined, members: data.members };
          }
          return p;
        }));
        
        // refresh feed
        fetch('/api/pods/feed').then(r => r.json()).then(fData => {
          if (fData.feed) setFeed(fData.feed);
        });
      }
    } catch (e) {
      window.appAlert('We couldn\'t update your pod membership. Please try again!');
    }
  };

  const handleCreatePod = async (e) => {
    e.preventDefault();
    if (!newPodName || !newPodDesc) return;
    setCreating(true);
    try {
      const res = await fetch('/api/pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPodName, description: newPodDesc, icon: newPodIcon })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh pods
        fetch('/api/pods').then(r => r.json()).then(pData => {
          if (pData.pods) setPods(pData.pods);
        });
        setShowCreateModal(false);
        setNewPodName('');
        setNewPodDesc('');
      } else {
        window.appAlert(data.error || 'We couldn\'t create the pod right now. Please try again!');
      }
    } catch (e) {
      window.appAlert('We couldn\'t create the pod right now. Please try again!');
    }
    setCreating(false);
  };

  if (!user || loading) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container">
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading pods...</p>
          </div>
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
                <div key={pod.id} className={styles.podCard}>
                  <div className={styles.podHeader}>
                    <div>
                      <h3 className={styles.podName}>{pod.name}</h3>
                      <div className={styles.podMembers}>
                        <Users size={14} /> {pod.members} members
                      </div>
                    </div>
                    <div className={styles.podIconWrap}>
                      <Icon size={24} />
                    </div>
                  </div>
                  
                  <p className={styles.podDesc}>{pod.desc}</p>
                  
                  {pod.challenge && (
                    <div style={{ marginTop: '16px', marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>Weekly Challenge</span>
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>{pod.challenge.rewardXP} XP Reward</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (pod.challenge.currentVolume / pod.challenge.targetVolume) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #10b981)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <span>{pod.challenge.currentVolume.toLocaleString()} kg</span>
                        <span>Goal: {pod.challenge.targetVolume.toLocaleString()} kg</span>
                      </div>
                    </div>
                  )}

                  <button 
                    className={`${styles.joinBtn} ${pod.joined ? styles.joinedBtn : ''}`}
                    onClick={() => toggleJoin(pod.id)}
                  >
                    {pod.joined ? 'Joined' : 'Join Pod'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className={styles.feedSection}>
            <div className={styles.feedHeader}>
              <Activity size={24} style={{ color: '#22c55e' }} />
              Live Pod Activity
            </div>
            
            <div className={styles.feedList}>
              {feed.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)' }}>No recent activity. Join a pod or complete a workout!</p>
              ) : (
                feed.map(item => (
                  <div key={item.id} className={styles.feedItem}>
                    <div 
                      className={styles.feedAvatar}
                      style={{ 
                        border: item.activeBorder ? `2px solid ${item.activeBorder === 'gold' ? '#fbbf24' : item.activeBorder === 'fire' ? '#ef4444' : '#06b6d4'}` : 'none',
                        boxShadow: item.activeBorder === 'fire' ? '0 0 8px #ef4444' : item.activeBorder === 'lightning' ? '0 0 8px #06b6d4' : 'none'
                      }}
                    >
                      {item.avatar}
                    </div>
                    <div className={styles.feedContent}>
                      <Link href={`/u/${item.user}`} style={{ textDecoration: 'none' }}>
                        <h4 style={{ color: item.activeColor ? item.activeColor : 'inherit' }}>{item.user}</h4>
                      </Link>
                      <p>{item.action}</p>
                      <span className={styles.feedTime}>{item.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '24px' }}>Create a New Pod</h2>
            <form onSubmit={handleCreatePod} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Pod Name</label>
                <input 
                  type="text" 
                  value={newPodName} 
                  onChange={(e) => setNewPodName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}
                  placeholder="e.g. 5AM Club"
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Description</label>
                <textarea 
                  value={newPodDesc} 
                  onChange={(e) => setNewPodDesc(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff', minHeight: '80px' }}
                  placeholder="What is this pod about?"
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Select Icon</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.keys(ICON_MAP).map(iconKey => {
                    const IconComp = ICON_MAP[iconKey];
                    return (
                      <button 
                        key={iconKey}
                        type="button"
                        onClick={() => setNewPodIcon(iconKey)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          background: newPodIcon === iconKey ? 'var(--color-primary)' : 'var(--color-bg)',
                          border: `1px solid ${newPodIcon === iconKey ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <IconComp size={24} />
                      </button>
                    )
                  })}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={creating}
                style={{
                  marginTop: '16px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: creating ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Creating...' : 'Create Pod'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
