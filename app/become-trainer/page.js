'use client';

import { useState } from 'react';
import { Check, Upload, Award, Globe, DollarSign, Shield } from 'lucide-react';
import styles from './page.module.css';

export default function BecomeTrainer() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    tagline: '',
    bio: '',
    specialties: '',
    age: '',
    experienceYears: '',
    mediaGallery: [],
    introVideoUrl: '',
    resumeUrl: '',
    price: 50,
    location: '',
    trainingMode: 'remote',
    responseTime: 'Usually replies within 24 hours',
    payoutEmail: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const result = await res.json();
      if (result.success) {
        if (type === 'photo') {
          setFormData({ ...formData, mediaGallery: [...formData.mediaGallery, result.fileUrl] });
        } else if (type === 'video') {
          setFormData({ ...formData, introVideoUrl: result.fileUrl });
        } else if (type === 'resume') {
          setFormData({ ...formData, resumeUrl: result.fileUrl });
        }
      } else {
        window.appAlert('Upload failed: ' + result.error);
      }
    } catch (err) {
      window.appAlert('Upload error');
    } finally {
      setUploading(false);
    }
  };
  const benefits = [
    { icon: DollarSign, title: 'Set Your Own Rates', desc: 'Charge what you are worth. No platform fees on your first $1,000.' },
    { icon: Globe, title: 'Global Reach', desc: 'Train clients from anywhere in the world via video calls.' },
    { icon: Shield, title: 'Secure Payments', desc: 'All payments protected by our escrow system.' },
    { icon: Award, title: 'Verified Badge', desc: 'Get verified to attract more clients and charge premium rates.' },
  ];

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <h1>Become a <span className={styles.gradient}>TemprFit Trainer</span></h1>
          <p>Turn your passion for fitness into a thriving career. Join our global trainer network.</p>
        </div>

        <div className={styles.benefits}>
          {benefits.map((b, i) => (
            <div key={i} className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <b.icon size={24} />
              </div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.formSection}>
          <h2>Trainer Application</h2>
          <div className={styles.steps}>
            <div className={`${styles.stepIndicator} ${step >= 1 ? styles.activeStep : ''}`}>1</div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepIndicator} ${step >= 2 ? styles.activeStep : ''}`}>2</div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepIndicator} ${step >= 3 ? styles.activeStep : ''}`}>3</div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepIndicator} ${step >= 4 ? styles.activeStep : ''}`}>4</div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepIndicator} ${step >= 5 ? styles.activeStep : ''}`}>5</div>
          </div>

          {step === 1 && (
            <div className={styles.formStep}>
              <h3>Basic Profile</h3>
              <div className={styles.formGrid}>
                <input 
                  type="text" 
                  placeholder="Tagline (e.g. Elite Powerlifting Coach)" 
                  value={formData.tagline}
                  onChange={e => setFormData({...formData, tagline: e.target.value})}
                  style={{ gridColumn: '1 / -1' }}
                />
                <textarea 
                  placeholder="Short Bio - tell clients about your experience..." 
                  rows={4}
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  style={{ gridColumn: '1 / -1', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--color-text)', resize: 'none' }}
                />
                <input 
                  type="text" 
                  placeholder="Specialties (comma separated, e.g. Yoga, HIIT)" 
                  value={formData.specialties}
                  onChange={e => setFormData({...formData, specialties: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="Age" 
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="Years of Experience" 
                  value={formData.experienceYears}
                  onChange={e => setFormData({...formData, experienceYears: e.target.value})}
                />
              </div>
              <button 
                className={styles.nextBtn} 
                onClick={() => setStep(2)}
                disabled={!formData.tagline || !formData.bio || !formData.specialties || !formData.age || !formData.experienceYears}
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className={styles.formStep}>
              <h3>Media & Credentials</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>Upload at least 2 photos to show off your training style. An intro video is highly recommended!</p>
              
              <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4>Photos (Min. 2 required)</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {formData.mediaGallery.map((url, i) => (
                      <img key={i} src={url} alt={`Upload ${i}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px dashed var(--border)', cursor: 'pointer' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, 'photo')} disabled={uploading} />
                      <Upload size={20} color="var(--color-text-muted)" />
                    </label>
                  </div>
                </div>

                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4>Introductory Video (Optional)</h4>
                  {formData.introVideoUrl ? (
                    <video src={formData.introVideoUrl} controls style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '8px' }} />
                  ) : (
                    <label style={{ display: 'inline-block', marginTop: '8px', padding: '8px 16px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleUpload(e, 'video')} disabled={uploading} />
                      {uploading ? 'Uploading...' : 'Upload Video'}
                    </label>
                  )}
                </div>

                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4>Certifications / Resume (Optional)</h4>
                  {formData.resumeUrl ? (
                    <a href={formData.resumeUrl} target="_blank" style={{ display: 'block', marginTop: '8px', color: 'var(--color-primary)' }}>View Uploaded Document</a>
                  ) : (
                    <label style={{ display: 'inline-block', marginTop: '8px', padding: '8px 16px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <input type="file" accept=".pdf,.doc,.docx,image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, 'resume')} disabled={uploading} />
                      {uploading ? 'Uploading...' : 'Upload Document'}
                    </label>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <button className={styles.backBtn} onClick={() => setStep(1)} disabled={loading || uploading}>Back</button>
                <button 
                  className={styles.nextBtn} 
                  onClick={() => setStep(3)} 
                  disabled={loading || uploading || formData.mediaGallery.length < 2}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.formStep}>
              <h3>Pricing & Logistics</h3>
              <div className={styles.formGrid}>
                <input 
                  type="number" 
                  placeholder="Price Per Session ($)" 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Location (e.g. Remote, NYC, London)" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
                <select 
                  value={formData.responseTime}
                  onChange={e => setFormData({...formData, responseTime: e.target.value})}
                  style={{ gridColumn: '1 / -1', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--color-text)' }}
                >
                  <option value="Usually replies within 1 hour">Usually replies within 1 hour</option>
                  <option value="Usually replies within a few hours">Usually replies within a few hours</option>
                  <option value="Usually replies within 24 hours">Usually replies within 24 hours</option>
                  <option value="Usually replies in 1-2 days">Usually replies in 1-2 days</option>
                </select>
              </div>
              
              <div style={{ marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>Training Mode:</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['remote', 'physical', 'hybrid'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    style={{ 
                      flex: 1, 
                      padding: '10px', 
                      textTransform: 'capitalize', 
                      borderRadius: '8px',
                      background: formData.trainingMode === mode ? 'var(--color-primary-soft)' : 'var(--bg)',
                      border: `1px solid ${formData.trainingMode === mode ? 'var(--color-primary)' : 'var(--border)'}`,
                      color: formData.trainingMode === mode ? 'var(--color-primary)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setFormData({...formData, trainingMode: mode})}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className={styles.formActions}>
                <button className={styles.backBtn} onClick={() => setStep(2)} disabled={loading}>Back</button>
                <button className={styles.nextBtn} onClick={() => setStep(4)} disabled={loading || !formData.price || !formData.location}>Continue</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={styles.formStep}>
              <h3>Escrow & Payout Setup</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                All training bookings use our secure Escrow engine. Connect a payout account to receive your milestone releases.
              </p>
              
              <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={20} color="#22c55e" /> Connect Flutterwave (Simulated)</h4>
                
                {formData.payoutEmail ? (
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '12px', borderRadius: '8px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={18} /> Payouts connected for {formData.payoutEmail}
                  </div>
                ) : (
                  <div>
                    <input 
                      type="email" 
                      placeholder="Enter your email to simulate Flutterwave connect" 
                      value={formData.payoutEmail}
                      onChange={e => setFormData({...formData, payoutEmail: e.target.value})}
                      style={{ width: '100%', marginBottom: '12px' }}
                    />
                    <button 
                      onClick={() => {
                        if (formData.payoutEmail.includes('@')) {
                          window.appAlert(`Simulated Flutterwave connection successful for ${formData.payoutEmail}`);
                        } else {
                          window.appAlert('Please enter a valid email for the mock connect.');
                        }
                      }}
                      style={{ background: '#6366f1', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Connect Flutterwave (Mock)
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button className={styles.backBtn} onClick={() => setStep(3)} disabled={loading}>Back</button>
                <button className={styles.nextBtn} onClick={() => setStep(5)} disabled={loading || !formData.payoutEmail.includes('@')}>Continue</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className={styles.formStep}>
              <h3>Review & Submit</h3>
              <p style={{ marginBottom: '16px' }}>Please review our Escrow Policy. A 15% platform fee will be deducted from your payouts.</p>
              <div className={styles.terms}>
                <label><input type="checkbox" id="trainer-terms" /> I agree to the Trainer Terms & Escrow Policy</label>
              </div>
              {error && <div className={styles.errorText} style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>}
              <button 
                className={styles.submitBtn} 
                disabled={loading}
                onClick={async () => {
                  const terms = document.getElementById('trainer-terms').checked;
                  if (!terms) {
                    setError('Please agree to the terms.');
                    return;
                  }
                  
                  setError('');
                  setLoading(true);
                  
                  try {
                    const res = await fetch('/api/trainer/upgrade', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formData)
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      setStep(6);
                    } else {
                      setError(data.error || 'Failed to submit application. Please try again.');
                    }
                  } catch (e) {
                    setError('Error submitting application. Is the server running?');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          )}

          {step === 6 && (
            <div className={styles.success}>
              <div className={styles.successIcon}><Check size={32} /></div>
              <h3>Application Submitted!</h3>
              <p>Your trainer application has been submitted and is pending admin approval. We will notify you once you are verified!</p>
              <button className={styles.nextBtn} onClick={() => window.location.href = '/dashboard'} style={{ marginTop: '24px' }}>
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
