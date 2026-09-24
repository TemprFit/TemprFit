'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import UserAvatar from '@/components/UserAvatar';
import { BADGES } from '@/lib/badges';
import { Activity, Flame, Medal, Star, Trophy } from 'lucide-react';
import styles from './page.module.css';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username;
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setProfile(data.user);
          setStats(data.stats);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container"><p>Loading profile...</p></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container">
            <h2>User not found</h2>
            <p>The user &quot;{username}&quot; does not exist or has chosen to hide their profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const ownedBadgeIds = new Set(profile.badges?.map(b => b.badgeId) || []);
  const ownedBadges = BADGES.filter(b => ownedBadgeIds.has(b.id));

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          
          <div className={`${styles.profileCard} ${profile.activeBorder ? `bg-effect-${profile.activeBorder}` : ''}`}>
            <UserAvatar user={profile} size="xl" disableLightbox={false} />
            
            <h1 
              className={styles.username}
              style={{ color: profile.activeColor ? profile.activeColor : 'inherit' }}
            >
              {profile.username}
            </h1>
            
            {profile.plan !== 'free' && (
              <div className={`${styles.planBadge} ${profile.plan === 'max' ? styles.max : ''}`}>
                {profile.plan.toUpperCase()} TIER
              </div>
            )}

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#fbbf24' }}>{profile.xp || 0}</div>
                <div className={styles.statLabel}>Total XP</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#3b82f6' }}>{stats.totalVolume.toLocaleString()}</div>
                <div className={styles.statLabel}>Volume (kg)</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#10b981' }}>{stats.sessions}</div>
                <div className={styles.statLabel}>Workouts</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#ef4444' }}>{Math.max(profile.currentStreak || 0, profile.totalCheckInStreak || 0)}</div>
                <div className={styles.statLabel}>Day Streak</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#a855f7' }}>{Math.max(profile.longestStreak || 0, profile.longestCheckInStreak || 0)}</div>
                <div className={styles.statLabel}>Total Best Streak</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#06b6d4', fontSize: '1.2rem' }}>
                  {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </div>
                <div className={styles.statLabel}>Joined</div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Trophy Case</h2>
            {ownedBadges.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>This user hasn&apos;t unlocked any badges yet.</p>
            ) : (
              <div className={styles.badgesGrid}>
                {ownedBadges.map(badge => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.id} className={styles.badgeCard}>
                      <div className={styles.badgeIconWrap} style={{ color: badge.color }}>
                        <Icon size={24} />
                      </div>
                      <h3 className={styles.badgeName}>{badge.name}</h3>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
