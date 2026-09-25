'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingDown, Scale, Target, Trash2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import styles from './tracker.module.css'
import ChartWidget from '@/components/ChartWidget'
import WaterTracker from '@/components/WaterTracker'
import SleepTracker from '@/components/SleepTracker'

export default function TrackerPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bmi')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogs(data.data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const deleteLog = async (id) => {
    if (!confirm('Are you sure you want to delete this log?')) return
    try {
      const res = await fetch(`/api/bmi/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setLogs(prev => prev.filter(log => log._id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const weightData = logs.map(log => ({
    label: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: log.weight
  }))

  const bmiData = logs.map(log => ({
    label: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: log.bmi
  }))

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div style={{ marginBottom: '40px' }}>
            <h1 className={styles.header}>
              <BarChart3 size={32} /> BMI and Health Tracker
            </h1>
            <p className={styles.subtitle}>
              Track your physical progress and see how your diet impacts your body composition over time.
            </p>
          </div>
          
          <WaterTracker />
          <SleepTracker />

          {loading ? (
            <p>Loading your tracking data...</p>
          ) : logs.length === 0 ? (
            <div className={styles.empty}>
              <Scale size={48} />
              <h2>No Data Yet</h2>
              <p>Head over to the BMI & Health Calculator to start logging your bodyweight and tracking your progress.</p>
              <a href="/health/calculator" className={styles.primaryBtn}>Go to Calculator</a>
            </div>
          ) : (
            <div className={styles.grid}>
              <div className={styles.charts}>
                <ChartWidget data={weightData} type="line" title="Bodyweight Trend (kg)" color="#22c55e" />
                <ChartWidget data={bmiData} type="line" title="BMI Trend" color="#10b981" />
              </div>
              
              <div className={styles.historyList}>
                <h2>Recent Measurements</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Weight (kg)</th>
                        <th>BMI</th>
                        <th>Notes</th>
                        <th>AI Remark</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice().reverse().map(log => (
                        <tr key={log._id}>
                          <td>{new Date(log.date).toLocaleDateString()}</td>
                          <td>{log.weight}</td>
                          <td>{log.bmi}</td>
                          <td>{log.notes || '-'}</td>
                          <td style={{ maxWidth: '200px', fontSize: '0.85rem' }}>{log.advice || '-'}</td>
                          <td>
                            <button onClick={() => deleteLog(log._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
