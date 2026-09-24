'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dumbbell, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Logo3D from '@/components/Logo3D';
import AuthBackground from '@/components/AuthBackground';
import AuthBackButton from '@/components/AuthBackButton';
import styles from './page.module.css';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function Login() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '461953379526-e5ped6rrio6gn48jqufa1sa3g20792t4.apps.googleusercontent.com'}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </GoogleOAuthProvider>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Ban state
  const [bannedData, setBannedData] = useState(null);
  const [appealMessage, setAppealMessage] = useState('');
  const [appealSent, setAppealSent] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Google login failed.');
        setLoading(false);
        return;
      }
      redirectAfterLogin(data);
    } catch (err) {
      setError('Could not reach the server.');
      setLoading(false);
    }
  };

  const redirectAfterLogin = (data) => {
    const next = searchParams.get('next');
    let defaultRoute = '/dashboard';
    if (!data.user?.hasCompletedOnboarding) {
      defaultRoute = '/onboarding';
    } else if (data.user?.role === 'trainer') {
      defaultRoute = '/trainer-dashboard';
    } else if (data.user?.role === 'admin') {
      defaultRoute = '/admin';
    }
    router.push(next && next.startsWith('/') ? next : defaultRoute);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.status === 403 && data.requiresVerification) {
        setNeedsVerification(true);
        setLoading(false);
        return;
      }
      
      if (res.status === 403 && data.error === 'BANNED') {
        setBannedData({ reason: data.banReason, expiresAt: data.banExpiresAt });
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }
      
      redirectAfterLogin(data);
    } catch (err) {
      setError('Could not reach the server. Is it running?');
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed.');
        setLoading(false);
        return;
      }
      redirectAfterLogin(data);
    } catch (err) {
      setError('Could not reach the server.');
      setLoading(false);
    }
  };

  const handleAppeal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/complaints/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message: appealMessage })
      });
      if (res.ok) {
        setAppealSent(true);
      } else {
        window.appAlert('Failed to submit appeal');
      }
    } catch (err) {
      window.appAlert('Error submitting appeal');
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <AuthBackButton />
      <div className={styles.bgWrapperFull}>
        <AuthBackground />
      </div>
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <div style={{ marginBottom: '20px' }}>
            <Logo3D size={60} />
          </div>
          <h2>Welcome Back to TemprFit</h2>
          <p>Sign in to continue your fitness journey with AI-powered coaching.</p>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div className={styles.logoSmall}>
              <Dumbbell size={24} />
            </div>
            <h1>{bannedData ? 'Account Suspended' : needsVerification ? 'Verify Email' : 'Sign In'}</h1>
            <p>{bannedData ? 'Your account has been restricted' : needsVerification ? 'Enter the 6-digit code sent to your email.' : 'Enter your credentials to access your account'}</p>
          </div>

          {bannedData ? (
            <div className={styles.form}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                <p style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '8px' }}>Reason: {bannedData.reason}</p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  {bannedData.expiresAt ? `Ban expires on: ${new Date(bannedData.expiresAt).toLocaleString()}` : 'This ban is permanent.'}
                </p>
              </div>

              {!appealSent ? (
                <form onSubmit={handleAppeal}>
                  <div className={styles.inputGroup}>
                    <label>Submit an Appeal</label>
                    <textarea 
                      rows={4} 
                      value={appealMessage}
                      onChange={e => setAppealMessage(e.target.value)}
                      placeholder="Explain why you think this is a mistake..."
                      required
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <button type="submit" className={styles.submitBtn} disabled={loading} style={{ background: '#3b82f6' }}>
                    {loading ? 'Submitting...' : 'Submit Appeal'}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', color: '#22c55e', padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px' }}>
                  Your appeal has been submitted to the admin team. We will review it shortly.
                </div>
              )}

              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
                <a href="#" onClick={() => { setBannedData(null); setAppealSent(false); }} style={{ color: 'var(--color-primary)' }}>Back to Login</a>
              </p>
            </div>
          ) : !needsVerification ? (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Password</label>
                <div className={styles.passwordWrapper}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.options}>
                <label className={styles.remember}>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link href="#">Forgot password?</Link>
              </div>

              {error && <p className={styles.errorText}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleVerify}>
              <div className={styles.inputGroup}>
                <label>Verification Code</label>
                <input
                  type="text"
                  placeholder="123456"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}
                  maxLength={6}
                />
              </div>
              
              {error && <p className={styles.errorText}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Verifying…' : 'Verify & Sign In'} <ArrowRight size={16} />
              </button>
              
              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                <a href="#" onClick={() => setNeedsVerification(false)} style={{ color: 'var(--color-primary)' }}>Back to Login</a>
              </p>
            </form>
          )}

          {!needsVerification && !bannedData && (
            <>
              <div className={styles.divider}>
                <span>or continue with</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed.')}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  text="signin_with"
                />
              </div>
            </>
          )}

          <p className={styles.footerText}>
            Don't have an account? <Link href="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
