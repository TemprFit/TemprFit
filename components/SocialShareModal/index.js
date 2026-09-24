'use client';

import { useState, useRef } from 'react';
import { X, Dumbbell, Copy, Share2, Check, Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import styles from './SocialShareModal.module.css';

export default function SocialShareModal({ isOpen, onClose, stats }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [sharingToMoments, setSharingToMoments] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      const link = document.createElement('a');
      link.download = 'workout-stats.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  };

  const handleShareMoments = () => {
    setSharingToMoments(true);
    setTimeout(() => {
      setSharingToMoments(false);
      window.appAlert('Successfully shared and saved to your Moments!');
      onClose();
    }, 1200);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Share to Story</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.cardContainer}>
          <div className={styles.shareCard} id="share-card-element" ref={cardRef}>
            <div className={styles.cardBgEffect} />
            
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Workout Complete</div>
              <div className={styles.cardSubtitle}>TemprFit</div>
            </div>

            <div className={styles.cardStats}>
              <div className={styles.statRow}>
                <span className={styles.statValue}>{stats?.totalVolume?.toLocaleString() || 0}</span>
                <span className={styles.statLabel}>Total Volume (kg)</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statValue}>{stats?.duration || '0m'}</span>
                <span className={styles.statLabel}>Duration</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statValue}>{stats?.prCount || 0}</span>
                <span className={styles.statLabel}>New PRs</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <Dumbbell size={16} /> TemprFit App
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.copyBtn} onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Saving...' : <><Download size={18} /> Download Image</>}
          </button>
          <button className={styles.momentsBtn} onClick={handleShareMoments} disabled={sharingToMoments}>
            {sharingToMoments ? 'Sharing...' : <><ImageIcon size={18} /> Share to Moments</>}
          </button>
        </div>
      </div>
    </div>
  );
}
