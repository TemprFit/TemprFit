'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { BADGES } from '@/lib/badges';
import { SHOP_ITEMS } from '@/lib/shop';
import { Trophy, Star, Shield, Lock, Check, CheckCircle } from 'lucide-react';
import BuyXPButton from '@/components/BuyXPButton';
import styles from './page.module.css';

export default function BadgesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/stats').then(r => r.json())
    ]).then(([userData, statsData]) => {
      if (!userData.user) {
        router.replace('/login');
        return;
      }
      setUser(userData.user);
      setStats(statsData);
    });
  }, [router]);

  const handleBuy = async (itemId, cost, isBadge = false) => {
    if (!await window.appConfirm(`Buy this for ${cost} XP?`)) return;
    setBuying(true);
    try {
      const endpoint = isBadge ? '/api/badges/buy' : '/api/shop/buy';
      const body = isBadge ? { badgeId: itemId } : { itemId };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, ...data }); // API returns xp, activeColor, unlockedColors etc.
        window.appAlert('Purchase successful!');
      } else {
        window.appAlert(data.error || 'Failed to buy item.');
      }
    } catch (e) {
      window.appAlert('Error during purchase.');
    }
    setBuying(false);
  };

  const equipColor = async (colorHex) => {
    try {
      const res = await fetch('/api/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: colorHex })
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, activeColor: data.activeColor });
      } else {
        window.appAlert(data.error || 'Failed to equip color.');
      }
    } catch (e) {
      window.appAlert('Error equipping color');
    }
  };

  if (!user || !stats) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container"><p>Loading...</p></div>
        </div>
      </div>
    );
  }

  const ownedBadgeIds = new Set(user.badges?.map(b => b.badgeId) || []);
  const progressionBadges = BADGES.filter(b => !b.isPremium);
  const unlockedColors = user.unlockedColors || [];

  const unlockedBorders = user.unlockedBorders || [];

  const isBadgeUnlocked = (badge) => {
    if (ownedBadgeIds.has(badge.id)) return true;
    if (!badge.criteria) return false;
    
    if (badge.criteria.type === 'sessions') return (stats?.totalSessions || 0) >= badge.criteria.value;
    if (badge.criteria.type === 'streak') return (user?.currentStreak || 0) >= badge.criteria.value;
    if (badge.criteria.type === 'volume') return (stats?.totalVolume || 0) >= badge.criteria.value;
    
    return false;
  };

  const equipBorder = async (borderName) => {
    try {
      const res = await fetch('/api/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ border: borderName })
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, activeBorder: data.activeBorder });
      } else {
        window.appAlert(data.error || 'Failed to equip border.');
      }
    } catch (e) {
      window.appAlert('Error equipping border');
    }
  };

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Achievements & Rewards</h1>
              <p className={styles.subtitle}>Unlock badges for XP and spend your XP in the shop.</p>
            </div>
            <div className={styles.xpBadge}>
              <Star fill="currentColor" size={18} /> {user.xp || 0} XP
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><Trophy size={24} style={{ color: '#fbbf24' }} /> Badges ({progressionBadges.filter(isBadgeUnlocked).length}/{progressionBadges.length})</h2>
            <div className={styles.badgesGrid}>
              {progressionBadges.map(badge => {
                const Icon = badge.icon;
                const isOwned = isBadgeUnlocked(badge);
                return (
                  <div key={badge.id} className={`${styles.badgeCard} ${isOwned ? styles.badgeUnlocked : styles.badgeLocked}`}>
                    {isOwned && <div className={styles.badgeCheck}><CheckCircle size={20} /></div>}
                    <div className={styles.badgeIconWrap} style={{ color: isOwned ? badge.color : 'inherit' }}>
                      <Icon size={32} />
                    </div>
                    <h3 className={styles.badgeName}>{badge.name}</h3>
                    <p className={styles.badgeDesc}>{badge.desc}</p>
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                      +{badge.rewardXP} XP
                    </div>
                    {!isOwned && <p style={{ fontSize: '0.75rem', marginTop: '8px', color: 'var(--color-text-muted)' }}><Lock size={12} style={{ display: 'inline', verticalAlign: 'middle' }}/> Locked</p>}
                  </div>
                );
              })}
              
              {/* Coming Soon Placeholder */}
              <div className={`${styles.badgeCard} ${styles.badgeLocked}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', opacity: 0.6, borderStyle: 'dashed' }}>
                <Star size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
                <h3 className={styles.badgeName} style={{ color: 'var(--color-text-muted)' }}>More coming soon...</h3>
                <p className={styles.badgeDesc} style={{ textAlign: 'center' }}>We are actively adding new challenges and badges!</p>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><Shield size={24} style={{ color: '#3b82f6' }} /> The XP Store</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Spend your hard-earned XP on exclusive profile customizations and subscriptions.</p>
            <div className={styles.badgesGrid}>
              {SHOP_ITEMS.map(item => {
                const Icon = item.icon;
                const canAfford = (user.xp || 0) >= item.cost;
                
                let isOwned = false;
                let isActive = false;
                let inventoryCount = 0;
                let isWeekendItem = item.weekendOnly;
                let showWeekendItem = true;

                if (isWeekendItem) {
                  const day = new Date().getDay();
                  if (day !== 0 && day !== 6) {
                    showWeekendItem = false;
                  }
                }

                if (!showWeekendItem) return null;

                if (item.type === 'color') {
                  isOwned = unlockedColors.includes(item.value);
                  isActive = user.activeColor === item.value;
                } else if (item.type === 'border') {
                  isOwned = unlockedBorders.includes(item.value);
                  isActive = user.activeBorder === item.value;
                } else if (item.type === 'subscription') {
                  isActive = user.plan === item.value;
                } else if (item.type === 'consumable') {
                  inventoryCount = user.inventory?.[item.value] || 0;
                } else if (item.type === 'badge') {
                  isOwned = ownedBadgeIds.has(item.id);
                }
                
                return (
                  <div key={item.id} className={`${styles.badgeCard} ${isActive ? styles.badgeUnlocked : ''}`} style={!isOwned && !isActive && inventoryCount === 0 ? { border: '1px solid rgba(255,255,255,0.1)' } : {}}>
                    <div className={styles.badgeIconWrap} style={{ color: item.type === 'color' ? item.value : '#fff', background: 'rgba(255,255,255,0.05)' }}>
                      <Icon size={32} />
                    </div>
                    <h3 className={styles.badgeName} style={item.type === 'color' ? { color: item.value } : {}}>{item.name}</h3>
                    <p className={styles.badgeDesc}>{item.desc}</p>
                    
                    {!isOwned && !isActive && (
                      <div style={{ marginTop: '16px', fontWeight: '800', color: '#f59e0b', fontSize: '1.1rem' }}>
                        {item.cost} XP
                      </div>
                    )}
                    
                    {item.type === 'consumable' && inventoryCount > 0 && (
                      <p style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600, marginTop: '8px' }}>Owned: {inventoryCount}</p>
                    )}

                    {isOwned && !isActive && item.type === 'color' ? (
                      <button className={styles.buyBtn} onClick={() => equipColor(item.value)}>
                        Equip Color
                      </button>
                    ) : isOwned && !isActive && item.type === 'border' ? (
                      <button className={styles.buyBtn} onClick={() => equipBorder(item.value)}>
                        Equip Border
                      </button>
                    ) : isActive ? (
                      <button className={styles.buyBtn} disabled style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'transparent', marginTop: '16px' }}>
                        <Check size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Active
                      </button>
                    ) : isOwned && item.type === 'badge' ? (
                      <button className={styles.buyBtn} disabled style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'transparent', marginTop: '16px' }}>
                        <Check size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Owned
                      </button>
                    ) : (
                      <button 
                        className={styles.buyBtn} 
                        disabled={!canAfford || buying}
                        onClick={() => handleBuy(item.id, item.cost)}
                      >
                        {canAfford ? 'Buy' : 'Not Enough XP'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><Star size={24} style={{ color: '#10b981' }} /> Buy XP / Coins</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Want to skip the grind? Purchase XP securely using Flutterwave.</p>
            <div className={styles.badgesGrid}>
              
              <div className={styles.badgeCard}>
                <div className={styles.badgeIconWrap} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Star size={32} />
                </div>
                <h3 className={styles.badgeName}>1,000 XP</h3>
                <p className={styles.badgeDesc}>Perfect for a quick cosmetic upgrade.</p>
                <div style={{ marginTop: '16px', width: '100%' }}>
                  <BuyXPButton 
                    xpAmount={1000} 
                    priceUsd={5} 
                    onSuccess={async (amount) => {
                      const res = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ xpAmount: amount })
                      });
                      const data = await res.json();
                      if (data.success) {
                        setUser({ ...user, xp: data.xp });
                        window.appAlert(`Successfully purchased ${amount} XP!`);
                      }
                    }}
                  />
                </div>
              </div>

              <div className={styles.badgeCard}>
                <div className={styles.badgeIconWrap} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Star size={32} />
                </div>
                <h3 className={styles.badgeName}>5,000 XP</h3>
                <p className={styles.badgeDesc}>Enough to unlock a 14-day PRO subscription.</p>
                <div style={{ marginTop: '16px', width: '100%' }}>
                  <BuyXPButton 
                    xpAmount={5000} 
                    priceUsd={20} 
                    onSuccess={async (amount) => {
                      const res = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ xpAmount: amount })
                      });
                      const data = await res.json();
                      if (data.success) {
                        setUser({ ...user, xp: data.xp });
                        window.appAlert(`Successfully purchased ${amount} XP!`);
                      }
                    }}
                  />
                </div>
              </div>

              <div className={styles.badgeCard}>
                <div className={styles.badgeIconWrap} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Star size={32} />
                </div>
                <h3 className={styles.badgeName}>20,000 XP</h3>
                <p className={styles.badgeDesc}>The ultimate boost. Unlock MAX tier instantly.</p>
                <div style={{ marginTop: '16px', width: '100%' }}>
                  <BuyXPButton 
                    xpAmount={20000} 
                    priceUsd={50} 
                    onSuccess={async (amount) => {
                      const res = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ xpAmount: amount })
                      });
                      const data = await res.json();
                      if (data.success) {
                        setUser({ ...user, xp: data.xp });
                        window.appAlert(`Successfully purchased ${amount} XP!`);
                      }
                    }}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
