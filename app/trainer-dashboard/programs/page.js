'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Dumbbell, Clock, Globe, Activity, Pencil, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function TrainerPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          return fetch(`/api/programs?trainerId=${d.user._id}`);
        }
      })
      .then(r => r ? r.json() : { programs: [] })
      .then(d => setPrograms(d.programs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!await window.appConfirm('Are you sure you want to delete this program?')) return;
    
    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPrograms(programs.filter(p => p._id !== id));
      } else {
        window.appAlert('Failed to delete program');
      }
    } catch (e) {
      window.appAlert('Error deleting program');
    }
  };

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>My Programs</h1>
              <p className={styles.subtitle}>Manage your training programs and pricing.</p>
            </div>
            <Link href="/trainer-dashboard/programs/new" className={styles.createBtn}>
              <Plus size={18} /> Create Program
            </Link>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading programs...</div>
          ) : programs.length === 0 ? (
            <div className={styles.emptyState}>
              <Dumbbell size={48} className={styles.emptyIcon} />
              <h2>No Programs Yet</h2>
              <p>Create your first program to start accepting clients.</p>
              <Link href="/trainer-dashboard/programs/new" className={styles.createBtnOutline}>
                Create Your First Program
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {programs.map(program => (
                <div key={program._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.categoryBadge}>{program.category}</span>
                    <span className={styles.priceTag}>${program.price}</span>
                  </div>
                  <h3 className={styles.programTitle}>{program.title}</h3>
                  <p className={styles.programDesc}>{program.description}</p>
                  
                  <div className={styles.metaList}>
                    <div className={styles.metaItem}>
                      <Clock size={14} /> {program.sessionsPerWeek}x / week
                    </div>
                    <div className={styles.metaItem}>
                      <Activity size={14} /> {program.totalSessions} sessions total
                    </div>
                    <div className={styles.metaItem}>
                      <Globe size={14} /> {program.trainingMode}
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.bookingCount}>{program.bookingCount || 0} active clients</span>
                    <div className={styles.cardActions}>
                      <button className={styles.iconBtn} aria-label="Edit">
                        <Pencil size={16} />
                      </button>
                      <button className={styles.iconBtnDanger} aria-label="Delete" onClick={() => handleDelete(program._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
