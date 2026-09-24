'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload, Trash2 } from 'lucide-react';
import styles from './page.module.css';

export default function ProgressTimeline() {
  const [photos, setPhotos] = useState([
    { id: 1, date: '2023-01-15', weight: 195, note: 'Day 1. Ready to start!', src: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80' },
    { id: 2, date: '2023-04-15', weight: 185, note: '3 months in. Feeling much stronger.', src: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80' },
  ]);

  const [uploading, setUploading] = useState(false);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulated upload for MVP
    setUploading(true);
    setTimeout(() => {
      const newPhoto = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        weight: 180, // Simulated current weight
        note: 'New progress update!',
        src: URL.createObjectURL(file)
      };
      setPhotos([...photos, newPhoto]);
      setUploading(false);
    }, 1500);
  };

  const handleDelete = async (id) => {
    if(await window.appConfirm('Delete this progress photo?')) {
      setPhotos(photos.filter(p => p.id !== id));
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/dashboard" className={styles.backBtn}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className={styles.title}>Progress Timeline</h1>
          <p className={styles.subtitle}>Track your visual transformation over time.</p>
        </div>

        <div className={styles.uploadCard}>
          <div className={styles.uploadHeader}>
            <h3><Camera size={18} /> Add New Entry</h3>
            <label className={styles.uploadBtn} style={{ opacity: uploading ? 0.5 : 1 }}>
              {uploading ? 'Uploading...' : <><Upload size={16} /> Upload Photo</>}
              <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} hidden />
            </label>
          </div>
        </div>

        <div className={styles.timeline}>
          {photos.sort((a,b) => new Date(b.date) - new Date(a.date)).map((photo, i) => (
            <div key={photo.id} className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <h4>{new Date(photo.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(photo.id)}><Trash2 size={16} /></button>
                </div>
                <div className={styles.photoWrapper}>
                  <img src={photo.src} alt={`Progress on ${photo.date}`} className={styles.photo} />
                </div>
                <div className={styles.metrics}>
                  <span className={styles.metricBadge}>Weight: {photo.weight} lbs</span>
                </div>
                {photo.note && <p className={styles.note}>{photo.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
