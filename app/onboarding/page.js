'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingDown, TrendingUp, Activity, Dumbbell, Home, MapPin, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

const GOALS = [
  { id: 'fat_loss', title: 'Fat Loss', desc: 'Burn fat and get lean', icon: TrendingDown },
  { id: 'hypertrophy', title: 'Build Muscle', desc: 'Increase muscle size and strength', icon: TrendingUp },
  { id: 'general_health', title: 'General Health', desc: 'Improve longevity and fitness', icon: Activity },
  { id: 'recomp', title: 'Body Recomposition', desc: 'Burn fat while building muscle', icon: Target },
];

const LOCATIONS = [
  { id: 'commercial_gym', title: 'Commercial Gym', desc: 'Full access to machines and free weights', icon: MapPin },
  { id: 'home_dumbbells', title: 'Home (Dumbbells)', desc: 'Limited equipment, dumbbells only', icon: Dumbbell },
  { id: 'home_bodyweight', title: 'Home (Bodyweight)', desc: 'No equipment needed', icon: Home },
];

const EXPERIENCES = [
  { id: 'beginner', title: 'Beginner', desc: 'New to structured training' },
  { id: 'intermediate', title: 'Intermediate', desc: '1-3 years of consistent training' },
  { id: 'advanced', title: 'Advanced', desc: '3+ years of serious training' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 5;

  const [data, setData] = useState({
    nickname: '',
    country: '',
    primaryGoal: 'fat_loss',
    experienceLevel: 'beginner',
    workoutContext: {
      location: 'commercial_gym',
      daysAvailablePerWeek: 3,
      preferredSessionMins: 45
    },
    bodyMetrics: {
      heightCm: '',
      currentWeightKg: '',
      targetWeightKg: '',
      age: '',
      biologicalSex: ''
    }
  });

  const updateData = (category, field, value) => {
    if (category) {
      setData(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value
        }
      }));
    } else {
      setData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else submitOnboarding();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const submitOnboarding = async () => {
    setLoading(true);
    try {
      const payload = {
        fitnessProfile: data,
        hasCompletedOnboarding: true
      };
      
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setStep(6); // Go to success screen
      } else {
        window.appAlert('We couldn\'t save your profile right now. Please try again!');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2 className={styles.stepTitle}>Let's get to know you</h2>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>What should your AI Coach call you?</label>
                <input 
                  type="text" 
                  placeholder="Nickname"
                  value={data.nickname}
                  onChange={e => updateData(null, 'nickname', e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Country</label>
                <input 
                  type="text" 
                  placeholder="e.g. United States"
                  value={data.country}
                  onChange={e => updateData(null, 'country', e.target.value)}
                />
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2 className={styles.stepTitle}>What is your primary goal?</h2>
            <div className={styles.optionsGrid}>
              {GOALS.map(g => (
                <div 
                  key={g.id} 
                  className={`${styles.optionCard} ${data.primaryGoal === g.id ? styles.selected : ''}`}
                  onClick={() => updateData(null, 'primaryGoal', g.id)}
                >
                  <g.icon size={32} className={styles.optionIcon} />
                  <h4>{g.title}</h4>
                  <p>{g.desc}</p>
                </div>
              ))}
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h2 className={styles.stepTitle}>Where will you be training?</h2>
            <div className={styles.optionsGrid} style={{ marginBottom: '30px' }}>
              {LOCATIONS.map(loc => (
                <div 
                  key={loc.id} 
                  className={`${styles.optionCard} ${data.workoutContext.location === loc.id ? styles.selected : ''}`}
                  onClick={() => updateData('workoutContext', 'location', loc.id)}
                >
                  <loc.icon size={32} className={styles.optionIcon} />
                  <h4>{loc.title}</h4>
                  <p>{loc.desc}</p>
                </div>
              ))}
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Days per week</label>
                <select 
                  value={data.workoutContext.daysAvailablePerWeek}
                  onChange={(e) => updateData('workoutContext', 'daysAvailablePerWeek', parseInt(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n} days</option>)}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Session length (mins)</label>
                <select 
                  value={data.workoutContext.preferredSessionMins}
                  onChange={(e) => updateData('workoutContext', 'preferredSessionMins', parseInt(e.target.value))}
                >
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                  <option value={90}>90 mins</option>
                </select>
              </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <h2 className={styles.stepTitle}>What is your experience level?</h2>
            <div className={styles.optionsGrid}>
              {EXPERIENCES.map(exp => (
                <div 
                  key={exp.id} 
                  className={`${styles.optionCard} ${data.experienceLevel === exp.id ? styles.selected : ''}`}
                  onClick={() => updateData(null, 'experienceLevel', exp.id)}
                >
                  <h4>{exp.title}</h4>
                  <p>{exp.desc}</p>
                </div>
              ))}
            </div>
          </>
        );
      case 5:
        return (
          <>
            <h2 className={styles.stepTitle}>Let's get your baseline metrics</h2>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Age</label>
                <input 
                  type="number" 
                  min={13} max={100} 
                  placeholder="Years"
                  value={data.bodyMetrics.age}
                  onChange={e => updateData('bodyMetrics', 'age', e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Biological Sex</label>
                <select 
                  value={data.bodyMetrics.biologicalSex}
                  onChange={e => updateData('bodyMetrics', 'biologicalSex', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Height (cm)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 175"
                  value={data.bodyMetrics.heightCm}
                  onChange={e => updateData('bodyMetrics', 'heightCm', e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Current Weight (kg)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 80"
                  value={data.bodyMetrics.currentWeightKg}
                  onChange={e => updateData('bodyMetrics', 'currentWeightKg', e.target.value)}
                />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Target Weight (kg) {data.primaryGoal === 'general_health' ? '(Optional)' : ''}</label>
                <input 
                  type="number" 
                  placeholder="e.g. 75"
                  value={data.bodyMetrics.targetWeightKg}
                  onChange={e => updateData('bodyMetrics', 'targetWeightKg', e.target.value)}
                />
              </div>
            </div>
          </>
        );
      case 6: {
        const heightM = parseFloat(data.bodyMetrics.heightCm) / 100;
        const weightKg = parseFloat(data.bodyMetrics.currentWeightKg);
        const bmi = (weightKg / (heightM * heightM)).toFixed(1);
        
        let message = '';
        if (data.primaryGoal === 'fat_loss') message = "Your AI Coach has built a caloric deficit plan tailored to burn fat while preserving muscle.";
        else if (data.primaryGoal === 'hypertrophy') message = "Get ready to lift heavy! We've prepared a high-volume regimen focused on progressive overload.";
        else if (data.primaryGoal === 'general_health') message = "A balanced approach to fitness is exactly what you need. Let's build sustainable habits.";
        else message = "We're balancing fat loss and muscle gain perfectly. Your customized routine is ready.";

        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <CheckCircle2 size={64} style={{ color: '#22c55e', margin: '0 auto 20px auto' }} />
            <h2 className={styles.stepTitle}>Bravo, {data.nickname || 'Champion'}!</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px', fontSize: '1.1rem' }}>
              Your new account has been created and you are just a step from achieving your set goals.
            </p>
            <div style={{ background: 'var(--color-bg-elevated)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '8px', color: '#22c55e' }}>Estimated BMI: {bmi}</h3>
              <p style={{ fontSize: '0.95rem' }}>{message}</p>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Everything is set up. Let's jump in!
            </p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const isStepValid = () => {
    if (step === 1) return data.nickname && data.country;
    if (step === 5) {
      const { age, biologicalSex, heightCm, currentWeightKg, targetWeightKg } = data.bodyMetrics;
      if (data.primaryGoal !== 'general_health' && !targetWeightKg) return false;
      return age && biologicalSex && heightCm && currentWeightKg;
    }
    return true;
  };

  return (
    <div className={styles.page}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
      
      <main className={styles.content}>
        <div className={styles.wizardCard}>
          <div className={styles.header}>
            <h1>Personalize Your Engine</h1>
            <p>Help us tailor the AI to your exact physiological needs.</p>
          </div>
          
          <div className={styles.body}>
            {renderStep()}
          </div>
          
          <div className={styles.footer}>
            {step > 1 && step < 6 ? (
              <button className={styles.backBtn} onClick={handleBack}>
                <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back
              </button>
            ) : <div />}
            
            {step < 6 ? (
              <button 
                className={`${styles.nextBtn} ${step === totalSteps ? styles.primary : ''}`}
                onClick={handleNext}
                disabled={!isStepValid() || loading}
              >
                {loading ? <Loader2 size={18} className="spin" /> : (step === totalSteps ? 'Complete Setup' : 'Continue')}
                {!loading && step < totalSteps && <ArrowRight size={18} />}
              </button>
            ) : (
              <button 
                className={`${styles.nextBtn} ${styles.primary}`}
                onClick={() => router.push('/dashboard')}
                style={{ margin: '0 auto' }}
              >
                Go to Dashboard <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
