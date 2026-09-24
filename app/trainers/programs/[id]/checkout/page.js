'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { ArrowLeft, Lock, ShieldCheck, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const [program, setProgram] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user and program in parallel
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch(`/api/programs/${id}`).then(r => r.json())
    ])
    .then(([userRes, progRes]) => {
      if (userRes.user) setUser(userRes.user);
      if (progRes.program) setProgram(progRes.program);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [id]);

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X', // Fallback for dev
    tx_ref: Date.now().toString(),
    amount: program?.price || 0,
    currency: 'USD',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || 'user@example.com',
      name: user?.username || 'TemprFit User',
    },
    customizations: {
      title: 'TemprFit Escrow Booking',
      description: `Payment for ${program?.title}`,
      logo: 'https://ui-avatars.com/api/?name=TemprFit&background=22c55e&color=fff',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handlePaymentSuccess = async (response) => {
    try {
      // Send payment confirmation to our backend to create the booking
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: program._id,
          trainerId: program.trainer._id,
          transactionId: response.transaction_id,
          txRef: response.tx_ref,
          amountPaid: program.price
        })
      });

      const data = await res.json();
      if (res.ok) {
        window.appAlert('Booking successful! Redirecting to your dashboard...');
        router.push('/dashboard');
      } else {
        window.appAlert(`Booking failed: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      window.appAlert('An error occurred during booking confirmation.');
    } finally {
      closePaymentModal();
    }
  };

  if (loading || !program) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div style={{ padding: '120px 20px', textAlign: 'center' }}>Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      
      <div className={styles.header}>
        <h1 className={styles.title}>Secure Checkout</h1>
        <p className={styles.subtitle}>Funds are held securely in Escrow.</p>
      </div>

      <div className={styles.grid}>
        <div>
          <Link href={`/trainers/programs/${id}`} className={styles.backBtn}>
            <ArrowLeft size={16} /> Back to Program
          </Link>

          <div className={styles.card}>
            <h2>Order Summary</h2>
            <div className={styles.summaryItem}>
              <span>Program</span>
              <span>{program.title}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Trainer</span>
              <span>{program.trainer.username}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Total Sessions</span>
              <span>{program.totalSessions}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Format</span>
              <span style={{ textTransform: 'capitalize' }}>{program.trainingMode}</span>
            </div>

            <hr className={styles.divider} />

            <div className={styles.summaryItem}>
              <span>Subtotal</span>
              <span>${program.price.toFixed(2)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Platform Fee</span>
              <span>$0.00 (Covered by Trainer)</span>
            </div>

            <hr className={styles.divider} />

            <div className={styles.totalRow}>
              <span>Total Amount</span>
              <span className={styles.totalAmount}>${program.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.card} style={{ background: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldCheck size={24} color="#22c55e" />
              <h3 style={{ margin: 0 }}>Escrow Protection Active</h3>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
              Your payment is secure. We hold your funds in an escrow account and only release them to the trainer progressively as you complete your training sessions.
            </p>
            
            <button 
              className={styles.payBtn}
              onClick={() => {
                if (!user) {
                  window.appAlert('Please log in first to complete booking.');
                  router.push('/login');
                  return;
                }
                handleFlutterPayment({
                  callback: (response) => {
                    console.log('Flutterwave Response:', response);
                    if (response.status === 'successful') {
                      handlePaymentSuccess(response);
                    }
                  },
                  onClose: () => {
                    console.log('Payment modal closed');
                  },
                });
              }}
            >
              <Lock size={18} /> Pay Securely
            </button>
            <div className={styles.guarantee}>
              <Zap size={14} /> Powered by Flutterwave
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
