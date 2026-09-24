'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, Flame, Target, Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './page.module.css';

const ACTIVITY_LEVELS = [
  { label: 'Sedentary (office job, little exercise)', value: 1.2 },
  { label: 'Lightly Active (1-3 days/week)', value: 1.375 },
  { label: 'Moderately Active (3-5 days/week)', value: 1.55 },
  { label: 'Very Active (6-7 days/week)', value: 1.725 },
  { label: 'Extremely Active (athlete / physical job)', value: 1.9 },
];

function calcBMR(weight, height, age, sex) {
  // Mifflin-St Jeor
  if (sex === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

function calcBMI(weight, heightCm) {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#3b82f6' };
  if (bmi < 25) return { label: 'Normal', color: '#22c55e' };
  if (bmi < 30) return { label: 'Overweight', color: '#f59e0b' };
  return { label: 'Obese', color: '#ef4444' };
}

export default function TDEECalculatorPage() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [activityIdx, setActivityIdx] = useState(2);
  const [result, setResult] = useState(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (!w || !h || !a) return;

    const bmr = calcBMR(w, h, a, sex);
    const tdee = Math.round(bmr * ACTIVITY_LEVELS[activityIdx].value);
    const bmi = calcBMI(w, h);
    const bmiCat = getBMICategory(bmi);

    setResult({
      bmr: Math.round(bmr),
      tdee,
      bmi: bmi.toFixed(1),
      bmiCategory: bmiCat,
      deficit: tdee - 500,
      surplus: tdee + 300,
      protein: Math.round(w * 2),
    });
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.heroSection}>
            <div className={styles.badge}>Free Tool</div>
            <h1 className={styles.title}>
              <Calculator size={32} /> TDEE & BMI Calculator
            </h1>
            <p className={styles.subtitle}>
              Estimate your Total Daily Energy Expenditure and Body Mass Index based on the Mifflin-St Jeor equation.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.formCard}>
              <h2>Your Details</h2>
              
              <div className={styles.field}>
                <label>Weight (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Height (cm)</label>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25" className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Biological Sex</label>
                <div className={styles.toggleRow}>
                  <button className={`${styles.toggleBtn} ${sex === 'male' ? styles.toggleActive : ''}`} onClick={() => setSex('male')}>Male</button>
                  <button className={`${styles.toggleBtn} ${sex === 'female' ? styles.toggleActive : ''}`} onClick={() => setSex('female')}>Female</button>
                </div>
              </div>
              <div className={styles.field}>
                <label>Activity Level</label>
                <select value={activityIdx} onChange={e => setActivityIdx(Number(e.target.value))} className={styles.input}>
                  {ACTIVITY_LEVELS.map((lv, i) => (
                    <option key={i} value={i}>{lv.label}</option>
                  ))}
                </select>
              </div>

              <button className={styles.calcBtn} onClick={calculate}>
                Calculate <ArrowRight size={18} />
              </button>
            </div>

            <div className={styles.resultCard}>
              {result ? (
                <>
                  <div className={styles.resultBlock}>
                    <div className={styles.resultIcon}><Flame size={24} /></div>
                    <div>
                      <span className={styles.resultLabel}>TDEE (Maintenance)</span>
                      <span className={styles.resultValue}>{result.tdee.toLocaleString()} kcal/day</span>
                    </div>
                  </div>
                  <div className={styles.resultBlock}>
                    <div className={styles.resultIcon} style={{background: 'rgba(59,130,246,0.1)', color: '#3b82f6'}}><Activity size={24} /></div>
                    <div>
                      <span className={styles.resultLabel}>BMR (Basal Metabolic Rate)</span>
                      <span className={styles.resultValue}>{result.bmr.toLocaleString()} kcal/day</span>
                    </div>
                  </div>
                  <div className={styles.resultBlock}>
                    <div className={styles.resultIcon} style={{background: `${result.bmiCategory.color}20`, color: result.bmiCategory.color}}><Target size={24} /></div>
                    <div>
                      <span className={styles.resultLabel}>BMI</span>
                      <span className={styles.resultValue}>{result.bmi} — <span style={{color: result.bmiCategory.color}}>{result.bmiCategory.label}</span></span>
                    </div>
                  </div>

                  <div className={styles.macroGrid}>
                    <div className={styles.macroItem}>
                      <span className={styles.macroLabel}>Fat Loss</span>
                      <span className={styles.macroVal}>{result.deficit.toLocaleString()} kcal</span>
                      <span className={styles.macroSub}>500 kcal deficit</span>
                    </div>
                    <div className={styles.macroItem}>
                      <span className={styles.macroLabel}>Muscle Gain</span>
                      <span className={styles.macroVal}>{result.surplus.toLocaleString()} kcal</span>
                      <span className={styles.macroSub}>300 kcal surplus</span>
                    </div>
                    <div className={styles.macroItem}>
                      <span className={styles.macroLabel}>Protein Target</span>
                      <span className={styles.macroVal}>{result.protein}g</span>
                      <span className={styles.macroSub}>~2g/kg bodyweight</span>
                    </div>
                  </div>

                  <div className={styles.ctaBanner}>
                    <p>Save these results and track your progress with a free TemprFit account.</p>
                    <Link href="/register" className={styles.ctaBtn}>
                      Create Free Account <ArrowRight size={16} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className={styles.emptyResult}>
                  <Calculator size={48} style={{opacity: 0.15}} />
                  <p>Enter your details and click Calculate to see your TDEE, BMR, and BMI results.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
