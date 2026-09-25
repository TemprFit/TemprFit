'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Scale, Info, Save } from 'lucide-react'
import styles from './calculator.module.css'

export default function BMICalculator() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/bmi')
      const data = await res.json()
      if (data.success) {
        setHistory(data.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const calculateBMI = async (e) => {
    e.preventDefault()
    if (!weight || !height) return

    const w = parseFloat(weight)
    const h = parseFloat(height) / 100 // cm to m
    const bmiValue = (w / (h * h)).toFixed(1)

    let category = ''
    let advice = ''

    if (bmiValue < 18.5) {
      category = 'Underweight'
      advice = 'Consider a slight caloric surplus and strength training to build muscle mass.'
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      category = 'Normal weight'
      advice = 'Excellent shape! Maintain your current balanced diet and regular exercise routine.'
    } else if (bmiValue >= 25 && bmiValue < 30) {
      category = 'Overweight'
      advice = 'You are in decent form, but could benefit from a slight caloric deficit or increased cardio to lower body fat.'
    } else {
      category = 'Obese'
      advice = 'Consider consulting a healthcare provider or a TemprFit coach to plan a safe weight loss journey.'
    }

    const newResult = { weight: w, height: parseFloat(height), bmi: bmiValue, category, advice, notes, date }
    setResult(newResult)

    // Save to DB
    setLoading(true)
    try {
      await fetch('/api/bmi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResult)
      })
      fetchHistory()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.header}>
          <Activity size={32} /> BMI & Health Calculator
        </h1>

        <div className={styles.grid}>
          <motion.div 
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            data-tour="tour-health-bmi"
          >
            <h2 className={styles.cardTitle}>
              <Scale size={24} /> Calculate your BMI
            </h2>
            <form onSubmit={calculateBMI}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={styles.input}
                  placeholder="e.g. 75"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={styles.input}
                  placeholder="e.g. 175"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={styles.input}
                  placeholder="e.g. Feeling energetic today..."
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? 'Saving...' : 'Calculate & Save'}
              </button>
            </form>
          </motion.div>

        {result && (
          <motion.div 
            className={styles.card}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className={styles.cardTitle}>Results</h2>
            <div className={styles.resultCenter}>
              <span className={styles.bmiValue}>{result.bmi}</span>
              <p className={styles.category}>{result.category}</p>
            </div>
            <div className={styles.adviceBox}>
              <Info size={24} className={styles.infoIcon} />
              <p className={styles.adviceText}>{result.advice}</p>
            </div>
          </motion.div>
        )}
      </div>

      {history.length > 0 && (
        <div className={styles.historySection} data-tour="tour-health-graphs">
          <h2 className={styles.historyTitle}>Recent Logs</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>BMI</th>
                  <th>Category</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.date).toLocaleDateString()}</td>
                    <td>{log.weight} kg</td>
                    <td>{log.bmi}</td>
                    <td>{log.category}</td>
                    <td>{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
