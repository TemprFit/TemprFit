'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Activity, Globe, DollarSign, Calendar, Zap, Check, Star, Heart, Video, X, Target, ClipboardList, HelpCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function ProgramDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    startDate: '',
    time: '',
    location: '',
  });

  useEffect(() => {
    fetch(`/api/programs/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.program) {
          setProgram(d.program);
        } else {
          router.push('/trainers');
        }
      })
      .catch(() => router.push('/trainers'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const submitBooking = async (e) => {
    e.preventDefault();
    const resolvedTrainerId = program.trainer?._id || (typeof program.trainer === 'string' ? program.trainer : null);
    if (!resolvedTrainerId) {
      window.appAlert('Oops! It looks like this trainer\'s profile is no longer available. Please browse our marketplace for other amazing coaches!');
      return;
    }
    
    setSubmittingBooking(true);
    try {
      const res = await fetch('/api/escrow/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: resolvedTrainerId,
          amount: program.price || 0,
          sessions: program.totalSessions || 1,
          description: `${program.title} booking`,
          traineeNotes: `Start: ${bookingForm.startDate}, Time: ${bookingForm.time}, Location: ${bookingForm.location}`
        })
      });
      const data = await res.json();
      if (res.ok && data.escrowId) {
        router.push(`/escrow/${data.escrowId}`);
      } else {
        window.appAlert(data.error || 'We had a little trouble setting up your booking. Please try again!');
      }
    } catch (err) {
      console.error(err);
      window.appAlert('We\'re having trouble connecting to the secure checkout. Please check your connection and try again!');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/trainers/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: trainer._id || program.trainer?._id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      });
      if (res.ok) {
        window.appAlert('Thank you! Your review has been posted successfully.');
        setShowReviewModal(false);
        // refresh data
        window.location.reload();
      } else {
        window.appAlert('We couldn\'t post your review right now. Please try again!');
      }
    } catch (err) {
      console.error(err);
      window.appAlert('We couldn\'t post your review right now. Please try again!');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !program) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div style={{ padding: '120px 20px', textAlign: 'center' }}>Loading program...</div>
      </div>
    );
  }

  const trainer = program.trainer || {
    username: 'Unknown Trainer',
    avatarUrl: '',
    trainerInfo: {}
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        <Link href="/trainers" className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>
        
        <div className={styles.grid}>
          <div className={styles.mainCol}>
            <div className={styles.header}>
              <span className={styles.category}>{program.category}</span>
              <h1 className={styles.title}>{program.title}</h1>
              <div className={styles.meta}>
                <span className={styles.metaItem}><Clock size={16} /> {program.sessionsPerWeek}x / week</span>
                <span className={styles.metaItem}><Activity size={16} /> {program.totalSessions} sessions</span>
                <span className={styles.metaItem}><Globe size={16} style={{ textTransform: 'capitalize' }} /> {program.trainingMode}</span>
              </div>
            </div>

            <div className={styles.section}>
              <h2>About this Program</h2>
              <div className={styles.description}>
                {program.description}
              </div>
            </div>

            {program.targetAudience && (
              <div className={styles.section}>
                <h2><Target size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }} /> Target Audience</h2>
                <div className={styles.targetAudienceBox}>
                  {program.targetAudience}
                </div>
              </div>
            )}

            {program.requirements && program.requirements.length > 0 && (
              <div className={styles.section}>
                <h2><ClipboardList size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }} /> Requirements</h2>
                <ul className={styles.featuresList}>
                  {program.requirements.map((req, i) => (
                    <li key={i}><Check size={16} className={styles.checkIcon} /> {req}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.section}>
              <h2>What's Included</h2>
              <ul className={styles.featuresList}>
                <li><Check size={16} className={styles.checkIcon} /> Custom workout programming for {program.totalSessions} sessions</li>
                <li><Check size={16} className={styles.checkIcon} /> Direct messaging and check-ins with {trainer.username}</li>
                <li><Check size={16} className={styles.checkIcon} /> Full form reviews via the TemprFit App</li>
                <li><Check size={16} className={styles.checkIcon} /> Secure Escrow payments with milestone releases</li>
              </ul>
            </div>

            {program.faq && program.faq.length > 0 && (
              <div className={styles.section}>
                <h2><HelpCircle size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }} /> Frequently Asked Questions</h2>
                <div className={styles.faqContainer}>
                  {program.faq.map((f, i) => (
                    <div key={i} className={styles.faqItem}>
                      <div className={styles.faqQuestion}>
                        {f.question}
                      </div>
                      <div className={styles.faqAnswer}>
                        {f.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {program.mediaGallery && program.mediaGallery.length > 0 && (
              <div className={styles.section}>
                <h2>Media Gallery</h2>
                <div className={styles.mediaGallery}>
                  {program.mediaGallery.map((url, index) => {
                    const isVideo = !!url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i);
                    return (
                      <div key={index} className={styles.mediaItem}>
                        {isVideo ? (
                          <video src={url} controls className={styles.mediaObj} />
                        ) : (
                          <img src={url} alt={`Media ${index}`} className={styles.mediaObj} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}><Star size={20} fill="#f59e0b" color="#f59e0b" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Client Reviews</h2>
                <button 
                  className={styles.writeReviewBtn} 
                  onClick={() => setShowReviewModal(true)}
                  style={{ background: 'var(--color-primary)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '100px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Write a Review
                </button>
              </div>
              
              <div className={styles.reviewsSummary}>
                <div className={styles.ratingBig}>
                  <span className={styles.ratingNumber}>{trainer.trainerInfo?.rating ? trainer.trainerInfo.rating.toFixed(1) : '0.0'}</span>
                  <span className={styles.outOf}>/ 5</span>
                </div>
                <div className={styles.totalReviews}>Based on {trainer.trainerInfo?.reviews?.length || 0} reviews</div>
              </div>

              <div className={styles.reviewsList}>
                {!trainer.trainerInfo?.reviews || trainer.trainerInfo.reviews.length === 0 ? (
                  <p className={styles.noReviews}>No reviews yet. Be the first to book this program!</p>
                ) : (
                  trainer.trainerInfo.reviews.map((rev, i) => (
                    <div key={i} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewerInfo}>
                          <div className={styles.reviewerAvatar}>{rev.user?.username?.[0] || 'A'}</div>
                          <strong>{rev.user?.username || 'Anonymous'}</strong>
                        </div>
                        <div className={styles.reviewStars}>
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} size={14} fill={idx < rev.rating ? "#f59e0b" : "transparent"} color={idx < rev.rating ? "#f59e0b" : "var(--color-border)"} />
                          ))}
                        </div>
                      </div>
                      <p className={styles.reviewComment}>{rev.comment}</p>
                      <span className={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={styles.sideCol}>
            <div className={styles.bookingCard}>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                <div className={styles.priceRow} style={{ marginBottom: '16px' }}>
                  <span className={styles.price}>${program.price}</span>
                  <span className={styles.per}>total</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <img src={program.programProfilePicture || trainer.avatarUrl || `https://ui-avatars.com/api/?name=${trainer.username}`} alt={trainer.username} className={styles.avatar} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1.1rem', fontWeight: 800 }}>{trainer.username}</strong>
                      {trainer.trainerInfo?.isVerified && (
                        <div className={styles.verifiedBadge} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          <Zap size={10} color="#000" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                      <span className={styles.trainerRating}>
                        <Star size={14} fill="gold" color="gold" /> {trainer.trainerInfo?.rating ? trainer.trainerInfo.rating.toFixed(1) : '5.0'}
                      </span>
                      <span className={styles.trainerLikes}>
                        <Heart size={14} fill="#ec4899" color="#ec4899" /> {trainer.trainerInfo?.likes?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                className={styles.bookBtn}
                onClick={() => setShowBookingModal(true)}
              >
                <DollarSign size={18} /> Book via Secure Escrow
              </button>
              <p className={styles.guarantee}>
                <Zap size={14} /> 100% Secure. Funds are held in escrow and released progressively as sessions are completed.
              </p>

              <hr className={styles.divider} />

              <div className={styles.trainerInfo} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                {trainer.trainerInfo?.availability && (
                  <div className={styles.availabilityBox} style={{ margin: 0 }}>
                    <Clock size={16} color="var(--color-text-muted)" />
                    <span>{trainer.trainerInfo.availability}</span>
                  </div>
                )}
                
                {trainer.trainerInfo?.bio && (
                  <div className={styles.trainerBio} style={{ textAlign: 'left', marginTop: 0 }}>
                    <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: '8px', fontSize: '1rem' }}>About {trainer.username}</strong>
                    <p style={{ margin: 0 }}>{trainer.trainerInfo.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setShowBookingModal(false)}><X size={20} /></button>
            <h2 style={{ marginBottom: '8px' }}>Book Program</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Fill in your preferred schedule and location to proceed to Secure Escrow.</p>
            
            <form onSubmit={submitBooking}>
              <div className={styles.inputGroup}>
                <label>Preferred Start Date</label>
                <input type="date" required value={bookingForm.startDate} onChange={e => setBookingForm({...bookingForm, startDate: e.target.value})} />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Preferred Time</label>
                <input type="time" required value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})} />
              </div>

              <div className={styles.inputGroup}>
                <label>Location / Setup Details</label>
                <textarea 
                  placeholder={program.trainingMode === 'remote' ? "e.g. My timezone is EST, I have dumbells at home." : "e.g. Meet at local gym downtown."} 
                  required 
                  value={bookingForm.location}
                  onChange={e => setBookingForm({...bookingForm, location: e.target.value})}
                  rows={3}
                />
              </div>

              <button type="submit" className={styles.submitBookBtn} disabled={submittingBooking}>
                {submittingBooking ? 'Processing...' : `Proceed to Escrow Checkout ($${program.price})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setShowReviewModal(false)}><X size={20} /></button>
            <h2 style={{ marginBottom: '8px' }}>Write a Review</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Share your experience with {trainer.username}.</p>
            
            <form onSubmit={submitReview}>
              <div className={styles.inputGroup} style={{ marginBottom: '16px' }}>
                <label>Rating (1-5)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1,2,3,4,5].map(num => (
                    <button 
                      key={num} 
                      type="button"
                      onClick={() => setReviewForm({...reviewForm, rating: num})}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Star size={32} fill={reviewForm.rating >= num ? "#f59e0b" : "transparent"} color={reviewForm.rating >= num ? "#f59e0b" : "var(--color-border)"} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className={styles.inputGroup}>
                <label>Your Review</label>
                <textarea 
                  placeholder="How was the program? Did you get the results you wanted?"
                  required 
                  value={reviewForm.comment}
                  onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                  rows={4}
                />
              </div>

              <button type="submit" className={styles.submitBookBtn} disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
