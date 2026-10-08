'use client';

import { useState } from 'react';
import { Send, Zap } from 'lucide-react';

export default function XPTransferWidget({ user, onTransferSuccess }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/transfer-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername: recipient, amount: parseInt(amount) })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Transfer failed');
      } else {
        window.appAlert('Successfully transferred ' + amount + ' XP to ' + recipient + '!');
        setRecipient('');
        setAmount('');
        if (onTransferSuccess) onTransferSuccess(data.newXp);
      }
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '1.2rem' }}>
        <Zap size={20} color="#22c55e" /> Share XP
      </h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
        Gift your XP to friends to help them rank up!
      </p>
      
      <form onSubmit={handleTransfer} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Username" 
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          style={{ flex: 1, minWidth: '120px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '10px', borderRadius: '8px' }}
        />
        <input 
          type="number" 
          placeholder="Amount" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="1"
          max={user?.xp || 0}
          style={{ width: '100px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '10px', borderRadius: '8px' }}
        />
        <button 
          type="submit" 
          disabled={loading || !recipient || !amount}
          style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', padding: '0 16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: (loading || !recipient || !amount) ? 'not-allowed' : 'pointer', opacity: (loading || !recipient || !amount) ? 0.6 : 1 }}
        >
          <Send size={16} /> {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '12px' }}>{error}</p>}
    </div>
  );
}
