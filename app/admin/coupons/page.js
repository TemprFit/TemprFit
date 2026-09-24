'use client';

import { useEffect, useState } from 'react';
import styles from '../page.module.css';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', planLevel: 'pro', expiresInDays: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.coupons) setCoupons(data.coupons);
    } catch (e) {}
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm)
      });
      if (res.ok) {
        fetchCoupons();
        setCouponForm({ code: '', planLevel: 'pro', expiresInDays: '' });
      } else {
        const data = await res.json();
        window.appAlert(data.error);
      }
    } catch (e) {}
    setActionLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Coupon <span className={styles.gradient}>Management</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Generate mass promotional codes or timed individual discounts.</p>
      </div>

      <div className={styles.section} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginTop: '24px' }}>
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', height: 'fit-content' }}>
          <h2>Generate Coupon</h2>
          <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Coupon Code</label>
              <input type="text" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} placeholder="e.g. VIP2026" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Plan Level</label>
              <select value={couponForm.planLevel} onChange={e => setCouponForm({...couponForm, planLevel: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="pro">Pro Plan</option>
                <option value="max">Max Plan</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Expires In (Days) - Optional</label>
              <input type="number" value={couponForm.expiresInDays} onChange={e => setCouponForm({...couponForm, expiresInDays: e.target.value})} placeholder="e.g. 7" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Leave blank for no expiration. Set to 7 for individual timed promos.</span>
            </div>
            <button type="submit" disabled={actionLoading} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
              {actionLoading ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>
        
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h2>Active Coupons</h2>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {coupons.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>No coupons found.</p>
            ) : (
              coupons.map(c => (
                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg)' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>{c.code}</strong>
                    <span style={{ display: 'inline-block', marginLeft: '8px', padding: '2px 8px', background: 'var(--color-surface-elevated)', borderRadius: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }}>{c.planLevel}</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {c.expiresAt ? `Expires: ${new Date(c.expiresAt).toLocaleDateString()}` : 'No Expiration'}
                    <br />
                    Status: {c.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
