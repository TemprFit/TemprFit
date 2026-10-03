'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('bronze');
  const [activeCategory, setActiveCategory] = useState('xp');
  const [offset, setOffset] = useState(0);
  const [myRankInfo, setMyRankInfo] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login');
          return;
        }
        setUser(data.user);
        
        // Auto-select tab based on user's XP
        if (data.user.xp >= 100000) setActiveTab('platinum');
        else if (data.user.xp >= 25000) setActiveTab('gold');
        else if (data.user.xp >= 5000) setActiveTab('silver');
        else setActiveTab('bronze');
      });

    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setLeaderboard([]); // clear while loading
    setOffset(0);
    fetchBoard(0);
  }, [user, activeTab, activeCategory]);

  const fetchBoard = (currentOffset) => {
    setLoadingMore(true);
    fetch(`/api/leaderboard?league=${activeTab}&category=${activeCategory}&offset=${currentOffset}&limit=10`)
      .then(r => r.json())
      .then(data => {
        if (data.leaderboard) {
          const mapped = data.leaderboard.map(entry => ({
            ...entry,
            isMe: user && (entry.id === user._id)
          }));
          
          if (currentOffset === 0) {
            setLeaderboard(mapped);
            setMyRankInfo(data.myRank !== null ? { rank: data.myRank, total: data.totalCount } : null);
          } else {
            setLeaderboard(prev => [...prev, ...mapped]);
          }
          
          setHasMore(data.leaderboard.length === 10);
        }
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  };

  const handleSeeMore = () => {
    const nextOffset = offset + 10;
    setOffset(nextOffset);
    fetchBoard(nextOffset);
  };

  if (!user || !stats) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container">
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading leaderboard...</p>
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
              <h1 className={styles.title}>Leaderboard Leagues</h1>
              <p className={styles.subtitle}>Compete in your XP bracket. Rise through the ranks to hit Platinum!</p>
            </div>
          </div>

          {myRankInfo && (
            <div style={{ background: 'linear-gradient(45deg, rgba(251,191,36,0.1), rgba(245,158,11,0.1))', border: '1px solid rgba(251,191,36,0.3)', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Global Rank</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fbbf24' }}>#{myRankInfo.rank} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>of {myRankInfo.total}</span></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Total XP</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>{user.xp?.toLocaleString()}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            <button 
              onClick={() => setActiveCategory('xp')} 
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '600', cursor: 'pointer', background: activeCategory === 'xp' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: activeCategory === 'xp' ? '#fff' : 'var(--color-text-muted)' }}
            >
              XP Rankers
            </button>
            <button 
              onClick={() => setActiveCategory('badges')} 
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '600', cursor: 'pointer', background: activeCategory === 'badges' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: activeCategory === 'badges' ? '#fff' : 'var(--color-text-muted)' }}
            >
              Badge Collectors
            </button>
          </div>

          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'bronze' ? styles.active : ''}`}
              onClick={() => setActiveTab('bronze')}
              style={activeTab === 'bronze' ? { borderColor: '#b87333', color: '#b87333' } : {}}
            >
              Bronze (0-5k)
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'silver' ? styles.active : ''}`}
              onClick={() => setActiveTab('silver')}
              style={activeTab === 'silver' ? { borderColor: '#9ca3af', color: '#9ca3af' } : {}}
            >
              Silver (5k-25k)
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'gold' ? styles.active : ''}`}
              onClick={() => setActiveTab('gold')}
              style={activeTab === 'gold' ? { borderColor: '#fbbf24', color: '#fbbf24' } : {}}
            >
              Gold (25k-100k)
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'platinum' ? styles.active : ''}`}
              onClick={() => setActiveTab('platinum')}
              style={activeTab === 'platinum' ? { borderColor: '#3b82f6', color: '#3b82f6', textShadow: '0 0 10px rgba(59,130,246,0.5)' } : {}}
            >
              Platinum (100k+)
            </button>
          </div>

          <div className={styles.boardCard}>
            <div className={styles.boardHeader}>
              <div>Rank</div>
              <div>Athlete</div>
              <div style={{ textAlign: 'right' }}>{activeCategory === 'badges' ? 'Badges' : 'Total XP'}</div>
            </div>

            <div className={styles.boardList}>
              {leaderboard.length === 0 && !loadingMore && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No athletes found in this category.</div>
              )}
              {leaderboard.map((entry, idx) => {
                const rank = offset + idx + 1;
                let rankClass = '';
                if (rank === 1) rankClass = styles.rank1;
                if (rank === 2) rankClass = styles.rank2;
                if (rank === 3) rankClass = styles.rank3;

                return (
                  <div key={entry.id} className={`${styles.boardRow} ${entry.isMe ? styles.isMe : ''}`}>
                    <div className={`${styles.rank} ${rankClass}`}>
                      #{rank}
                    </div>
                    <Link href={`/u/${entry.name}`} style={{ display: 'flex', flex: 1, alignItems: 'center', textDecoration: 'none' }}>
                      <div className={styles.userCol}>
                        <div className={`${styles.avatar} ${entry.activeBorder ? `aura-avatar-${entry.activeBorder}` : ''}`}>
                          {entry.avatar}
                        </div>
                        <div className={styles.userName}>
                          <span style={{ color: entry.activeColor ? entry.activeColor : 'inherit' }}>
                            {entry.name}
                          </span>
                          {entry.isMe && <span className={styles.isMeBadge}>You</span>}
                        </div>
                      </div>
                    </Link>
                    <div className={styles.score} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontWeight: 800, color: '#fbbf24' }}>{entry.score.toLocaleString()} {activeCategory === 'badges' ? 'Badges' : 'XP'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {hasMore && leaderboard.length > 0 && (
              <button 
                onClick={handleSeeMore}
                disabled={loadingMore}
                style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '8px', marginTop: '16px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {loadingMore ? 'Loading...' : 'See More'}
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
