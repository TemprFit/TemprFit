'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, DollarSign, TrendingUp, Search, Shield, CheckCircle, XCircle,
  Plus, Loader2, TicketCheck, BarChart3, Crown, Zap, UserX, Trash2, Mail
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import StatsCard from '@/components/StatsCard';
import styles from './page.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState({ role: '', plan: '' });
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPlan, setNewCouponPlan] = useState('pro');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState('');

  // Escrow state
  const [escrows, setEscrows] = useState([]);
  const [loadingEscrow, setLoadingEscrow] = useState(false);

  // Settings state
  const [adminPwd, setAdminPwd] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');

  // Load stats
  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  // Load users when tab or search changes
  useEffect(() => {
    if (tab !== 'users' && tab !== 'applications') return;
    setLoadingUsers(true);
    const params = new URLSearchParams();
    if (userSearch) params.set('q', userSearch);
    if (userFilter.role) params.set('role', userFilter.role);
    if (userFilter.plan) params.set('plan', userFilter.plan);
    params.set('page', usersPage);

    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || []);
        setUsersTotal(data.total || 0);
      })
      .finally(() => setLoadingUsers(false));
  }, [tab, userSearch, userFilter, usersPage]);

  // Load coupons
  useEffect(() => {
    if (tab !== 'coupons') return;
    fetch('/api/admin/coupons')
      .then(r => r.json())
      .then(data => setCoupons(data.coupons || []))
      .catch(() => {});
  }, [tab]);

  // Load escrows
  useEffect(() => {
    if (tab !== 'escrow') return;
    setLoadingEscrow(true);
    fetch('/api/escrow')
      .then(r => r.json())
      .then(data => setEscrows(data.transactions || []))
      .catch(() => {})
      .finally(() => setLoadingEscrow(false));
  }, [tab]);

  const handleEscrowAction = async (transactionId, action) => {
    if (!await window.appConfirm(`Are you sure you want to ${action} this transaction?`)) return;
    const res = await fetch('/api/escrow', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, action }),
    });
    const data = await res.json();
    if (data.success) {
      setEscrows(prev => prev.map(t => t._id === transactionId ? data.transaction : t));
    }
  };

  const handleInitChat = async (userIds) => {
    try {
      const res = await fetch('/api/messages/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserIds: userIds })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/messages');
      } else {
        window.appAlert(data.error || 'Failed to start chat');
      }
    } catch (e) {
      console.error(e);
      window.appAlert('Network error while starting chat');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!await window.appConfirm('Delete this user permanently? This cannot be undone.')) return;
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setUsers(prev => prev.filter(u => u._id !== userId));
    setUsersTotal(prev => prev - 1);
  };

  const handleChangeRole = async (userId, newRole) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates: { role: newRole } }),
    });
    const data = await res.json();
    if (data.user) {
      setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
    }
  };

  const handleContactUser = async (userId, username) => {
    const message = await window.appPrompt(`Enter message to send to ${username}:`);
    if (!message) return;
    
    const res = await fetch('/api/admin/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title: 'Message from Admin', message }),
    });
    
    const data = await res.json();
    if (data.success) window.appAlert('Message sent successfully!');
    else window.appAlert('Failed to send message: ' + (data.error || 'Unknown error'));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponLoading(true);
    setCouponMsg('');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCouponCode, planLevel: newCouponPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponMsg(data.error || 'Failed');
      } else {
        setCoupons(prev => [data.coupon, ...prev]);
        setNewCouponCode('');
        setCouponMsg('Coupon created!');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleToggleCoupon = async (couponId, isActive) => {
    const res = await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponId, isActive }),
    });
    const data = await res.json();
    if (data.coupon) {
      setCoupons(prev => prev.map(c => c._id === couponId ? data.coupon : c));
    }
  };

  const planIcon = (plan) => {
    if (plan === 'max') return <Crown size={12} style={{ color: 'gold' }} />;
    if (plan === 'pro') return <Zap size={12} style={{ color: '#22c55e' }} />;
    return <Shield size={12} style={{ color: 'var(--color-text-muted)' }} />;
  };

  return (
    <div className={styles.page}>
      <AdminSidebar activeTab={tab} onTabChange={setTab} />
      <div className={styles.content}>
        <div className="container">

          {/* ─── OVERVIEW TAB ─── */}
          {tab === 'overview' && (
            <>
              <div className={styles.header}>
                <div>
                  <h1 className={styles.title}>Admin Command Center</h1>
                  <p className={styles.subtitle}>Real-time platform analytics from the database.</p>
                </div>
              </div>

              <div className={styles.statsGrid}>
                <StatsCard label="Total Users" value={stats?.totalUsers ?? '...'} change={`+${stats?.newUsersThisWeek ?? 0} this week`} />
                <StatsCard label="Est. MRR" value={`$${stats?.estimatedMRR ?? '0'}`} change={`${stats?.proUsers ?? 0} Pro + ${stats?.maxUsers ?? 0} Max`} />
                <StatsCard label="Active Trainers" value={stats?.totalTrainers ?? '...'} change="Platform coaches" />
                <StatsCard label="Free Users" value={stats?.freeUsers ?? '...'} change="Conversion opportunity" />
              </div>

              <div className={styles.chartsRow} style={{ marginTop: '2rem' }}>
                <div className={styles.tableSection} style={{ flex: 1 }}>
                  <div className={styles.tableHeader}>
                    <h3>Quick Stats</h3>
                  </div>
                  <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>New users this month</span>
                      <strong>{stats?.newUsersThisMonth ?? '...'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Active coupons</span>
                      <strong>{stats?.activeCoupons ?? '...'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Pro subscribers</span>
                      <strong style={{ color: '#22c55e' }}>{stats?.proUsers ?? '...'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Max subscribers</span>
                      <strong style={{ color: 'gold' }}>{stats?.maxUsers ?? '...'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── USERS TAB ─── */}
          {tab === 'users' && (
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h3>User Management ({usersTotal})</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className={styles.searchInput}
                      style={{ paddingLeft: '30px' }}
                      value={userSearch}
                      onChange={e => { setUserSearch(e.target.value); setUsersPage(1); }}
                    />
                  </div>
                  <select className={styles.searchInput} value={userFilter.role} onChange={e => setUserFilter(f => ({ ...f, role: e.target.value }))}>
                    <option value="">All Roles</option>
                    <option value="user">Trainee</option>
                    <option value="trainer">Trainer</option>
                  </select>
                  <select className={styles.searchInput} value={userFilter.plan} onChange={e => setUserFilter(f => ({ ...f, plan: e.target.value }))}>
                    <option value="">All Plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="max">Max</option>
                  </select>
                </div>
              </div>
              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <span>User</span>
                  <span>Role</span>
                  <span>Plan</span>
                  <span>Joined</span>
                  <span>Actions</span>
                </div>
                {loadingUsers ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Loader2 size={24} className={styles.spin} />
                  </div>
                ) : users.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No users found.</div>
                ) : (
                  users.map(u => (
                    <div key={u._id} className={styles.tableRow}>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (u.username?.[0] || u.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <span className={styles.userName}>{u.username || u.name || 'Unknown'}</span>
                          <span className={styles.userEmail}>{u.email}</span>
                        </div>
                      </div>
                      <span className={`${styles.planBadge}`} style={{ textTransform: 'capitalize' }}>{u.role}</span>
                      <span className={`${styles.planBadge}`}>
                        {planIcon(u.plan)} {u.plan}
                      </span>
                      <span className={styles.timeCell}>{new Date(u.createdAt).toLocaleDateString()}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className={styles.moreBtn} onClick={() => handleContactUser(u._id, u.username || u.email)} title="Contact user">
                          <Mail size={14} />
                        </button>
                        <select
                          className={styles.searchInput}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                          value={u.role}
                          onChange={e => handleChangeRole(u._id, e.target.value)}
                        >
                          <option value="user">Trainee</option>
                          <option value="trainer">Trainer</option>
                        </select>
                        <button className={styles.moreBtn} onClick={() => handleDeleteUser(u._id)} title="Delete user">
                          <Trash2 size={14} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── APPLICATIONS TAB ─── */}
          {tab === 'applications' && (
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h3>Trainer Applications</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Approve or reject pending trainer accounts.</p>
              </div>
              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <span>Trainer</span>
                  <span>Specialties</span>
                  <span>Applied</span>
                  <span>Actions</span>
                </div>
                {users.filter(u => u.role === 'trainer' && !u.trainerInfo?.isApproved).length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Shield size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p>No pending applications.</p>
                  </div>
                ) : (
                  users.filter(u => u.role === 'trainer' && !u.trainerInfo?.isApproved).map(u => (
                    <div key={u._id} className={styles.tableRow}>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (u.username?.[0] || u.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <span className={styles.userName}>{u.username || u.name || 'Unknown'}</span>
                          <span className={styles.userEmail}>{u.email}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.85rem' }}>
                        {u.trainerInfo?.specialties?.join(', ') || 'N/A'}
                      </span>
                      <span className={styles.timeCell}>{new Date(u.createdAt).toLocaleDateString()}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={async () => {
                            const res = await fetch('/api/admin/users', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: u._id, updates: { isApproved: true } }),
                            });
                            if (res.ok) {
                              window.appAlert('Trainer approved!');
                              setUsers(prev => prev.map(user => user._id === u._id ? { ...user, trainerInfo: { ...user.trainerInfo, isApproved: true } } : user));
                            }
                          }}
                          style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u._id)}
                          style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── ESCROW TAB ─── */}
          {tab === 'escrow' && (
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h3>Escrow & Disputes</h3>
              </div>
              
              {loadingEscrow ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <Loader2 size={32} className={styles.spin} />
                </div>
              ) : escrows.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <DollarSign size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No escrow transactions yet.</p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Escrow transactions will appear here once trainers start receiving bookings.</p>
                </div>
              ) : (
                <div className={styles.table}>
                  <div className={styles.tableHead}>
                    <span>Transaction</span>
                    <span>Trainer</span>
                    <span>Amount</span>
                    <span>Platform Fee</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  {escrows.map(tx => (
                    <div key={tx._id} className={styles.tableRow}>
                      <div className={styles.userCell}>
                        <div>
                          <span className={styles.userName}>{tx.description}</span>
                          <span className={styles.userEmail}>{new Date(tx.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tx.trainer?.username || 'Unknown'}</span>
                      <span style={{ fontWeight: 700, color: '#f0f0f0' }}>${tx.amount.toFixed(2)}</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>-${tx.platformFee.toFixed(2)}</span>
                      <span className={`${styles.statusBadge} ${tx.status === 'held' ? styles.suspended : tx.status === 'released' ? styles.active : ''}`}>
                        {tx.status.toUpperCase()}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {tx.status === 'held' || tx.status === 'disputed' ? (
                          <>
                            <button onClick={() => handleEscrowAction(tx._id, 'release')} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Release</button>
                            <button onClick={() => handleEscrowAction(tx._id, 'refund')} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Refund</button>
                            {tx.status === 'disputed' && (
                              <>
                                <button onClick={() => handleInitChat([tx.trainee._id])} style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Msg Trainee</button>
                                <button onClick={() => handleInitChat([tx.trainer._id])} style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Msg Trainer</button>
                                <button onClick={() => handleInitChat([tx.trainee._id, tx.trainer._id])} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Group Chat</button>
                              </>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Resolved</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── COUPONS TAB ─── */}
          {tab === 'coupons' && (
            <>
              <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <h3>Create New Coupon</h3>
                </div>
                <form onSubmit={handleCreateCoupon} style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. SUMMER2024)"
                    className={styles.searchInput}
                    style={{ flex: 1, minWidth: '200px' }}
                    value={newCouponCode}
                    onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                    required
                  />
                  <select className={styles.searchInput} value={newCouponPlan} onChange={e => setNewCouponPlan(e.target.value)}>
                    <option value="pro">Pro Plan</option>
                    <option value="max">Max Plan</option>
                  </select>
                  <button type="submit" className={styles.actionBtn} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }} disabled={couponLoading}>
                    {couponLoading ? <Loader2 size={14} className={styles.spin} /> : <Plus size={14} />} Create
                  </button>
                </form>
                {couponMsg && <p style={{ padding: '0 20px 16px', color: couponMsg.includes('!') ? '#22c55e' : '#ef4444', fontSize: '0.85rem' }}>{couponMsg}</p>}
              </div>

              <div className={styles.tableSection} style={{ marginTop: '1.5rem' }}>
                <div className={styles.tableHeader}>
                  <h3>All Coupons ({coupons.length})</h3>
                </div>
                <div className={styles.table}>
                  <div className={styles.tableHead}>
                    <span>Code</span>
                    <span>Plan</span>
                    <span>Status</span>
                    <span>Created</span>
                    <span>Actions</span>
                  </div>
                  {coupons.map(c => (
                    <div key={c._id} className={styles.tableRow}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '1px' }}>{c.code}</span>
                      <span className={styles.planBadge}>
                        {planIcon(c.planLevel)} {c.planLevel}
                      </span>
                      <span className={`${styles.statusBadge} ${c.isActive ? styles.active : styles.suspended}`}>
                        {c.isActive ? <><CheckCircle size={12} /> Active</> : <><XCircle size={12} /> Inactive</>}
                      </span>
                      <span className={styles.timeCell}>{new Date(c.createdAt).toLocaleDateString()}</span>
                      <button
                        className={styles.moreBtn}
                        style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: c.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: c.isActive ? '#ef4444' : '#22c55e', border: 'none', cursor: 'pointer' }}
                        onClick={() => handleToggleCoupon(c._id, !c.isActive)}
                      >
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── REPORTS TAB ─── */}
          {tab === 'reports' && (
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h3>Reports & Analytics</h3>
              </div>
              <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>Total Registered Users</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>All-time user registrations</p>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{stats?.totalUsers ?? '...'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>Monthly Revenue (Est.)</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Based on active Pro + Max subscriptions</p>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>${stats?.estimatedMRR ?? '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>Conversion Rate</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Paid users / Total users</p>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#06b6d4' }}>
                    {stats ? (((stats.proUsers + stats.maxUsers) / Math.max(stats.totalUsers, 1)) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── SETTINGS TAB ─── */}
          {tab === 'settings' && (
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h3>System Settings</h3>
              </div>
              <div style={{ padding: '20px', display: 'grid', gap: '20px', maxWidth: '500px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Platform Fee (%)</label>
                  <input className={styles.searchInput} type="number" defaultValue={15} min={0} max={50} />
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Commission charged on escrow transactions.</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Admin Password</label>
                  <input className={styles.searchInput} type="password" placeholder="New admin password" value={adminPwd} onChange={e => setAdminPwd(e.target.value)} />
                </div>
                <button
                  className={styles.actionBtn}
                  style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}
                  onClick={() => setSettingsMsg('Settings saved (demo mode).')}
                >
                  Save Settings
                </button>
                {settingsMsg && <p style={{ color: '#22c55e', fontSize: '0.85rem' }}>{settingsMsg}</p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
