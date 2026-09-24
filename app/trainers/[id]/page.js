'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Zap, Award, Star, Loader2, PlayCircle, Image as ImageIcon, BadgeCheck, Users, Eye, Heart, UserPlus, UserCheck } from 'lucide-react';
import Link from 'next/link';
import EscrowWidget from '@/components/EscrowWidget';
import styles from './page.module.css';

export default function TrainerProfile({ params }) {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEscrow, setShowEscrow] = useState(false);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setCurrentUser(d.user);
    }).catch(console.error);
    fetch(`/api/trainers/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setTrainer(data.trainer);
          setIsFollowing(data.isFollowing || false);
          
          if (currentUser) {
            const hasLiked = data.trainer.trainerInfo?.likes?.includes(currentUser._id || currentUser.id);
            setIsLiked(hasLiked || false);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error loading profile.');
        setLoading(false);
      });
  }, [params.id]);

  const toggleFollow = async () => {
    if (!trainer) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/trainers/${params.id}/follow`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        setTrainer(prev => ({
          ...prev,
          followers: data.isFollowing 
            ? [...(prev.followers || []), 'temp'] 
            : (prev.followers || []).slice(0, -1)
        }));
      } else {
        window.appAlert(data.error || 'We couldn\'t update your following list. Please try again!');
      }
    } catch (err) {
      console.error(err);
    }
    setFollowLoading(false);
  };

  const toggleLike = async () => {
    if (!trainer) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`/api/trainers/${params.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsLiked(data.isLiked);
        setTrainer(prev => ({
          ...prev,
          trainerInfo: {
            ...prev.trainerInfo,
            likes: data.isLiked 
              ? [...(prev.trainerInfo.likes || []), 'temp'] 
              : (prev.trainerInfo.likes || []).slice(0, -1)
          }
        }));
      } else {
        window.appAlert(data.error || 'We couldn\'t update your likes. Please try again!');
      }
    } catch (err) {
      console.error(err);
    }
    setLikeLoading(false);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/trainers/${params.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });
      const data = await res.json();
      if (data.success) {
        setTrainer(prev => ({
          ...prev,
          trainerInfo: {
            ...prev.trainerInfo,
            rating: data.rating,
            reviews: [
              ...prev.trainerInfo.reviews || [],
              { user: currentUser, rating: reviewForm.rating, comment: reviewForm.comment, createdAt: new Date() }
            ]
          }
        }));
        setShowReviewModal(false);
        setReviewForm({ rating: 5, comment: '' });
      } else {
        window.appAlert(data.error || 'We couldn\'t post your review right now. Please try again!');
      }
    } catch (err) {
      console.error(err);
      window.appAlert('We couldn\'t post your review right now. Please try again!');
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#22c55e' }} />
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2>{error || 'Trainer not found'}</h2>
          <Link href="/trainers" className={styles.backBtn} style={{ marginTop: '20px', display: 'inline-flex' }}>
            <ChevronLeft size={16} /> Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const { trainerInfo, username, avatarUrl } = trainer;
  const isFeatured = trainerInfo.isFeatured;
  const price = trainerInfo.price || 50;
  const location = trainerInfo.location || 'Remote';
  const mode = trainerInfo.trainingMode || 'remote';
  const specialties = trainerInfo.specialties || [];
  const bio = trainerInfo.bio || 'This trainer hasn\'t written a bio yet.';
  const mediaGallery = trainerInfo.mediaGallery || [];
  const isVerified = trainerInfo.isVerified || false;
  const followersCount = trainer?.followers?.length || 0;
  const viewsCount = trainerInfo.views || 0;
  const likesCount = trainerInfo.likes?.length || 0;
  const reviewsCount = trainerInfo.reviews?.length || 0;
  const ratingValue = trainerInfo.rating || 0;

  return (
    <div className={styles.page}>
      {/* Cover Banner */}
      <div className={styles.coverPhoto}></div>

      <div className="container">
        <Link href="/trainers" className={styles.backBtn}>
          <ChevronLeft size={18} /> Back to Directory
        </Link>

        <div className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            <img src={avatarUrl || `https://ui-avatars.com/api/?name=${username}&background=22c55e&color=fff&size=200`} alt={username} className={styles.avatar} />
            {isFeatured && <div className={styles.featuredBadge}><Zap size={14} /> Featured Pro</div>}
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.titleRow}>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {username} 
                {isVerified && <BadgeCheck size={24} color="#3b82f6" fill="#fff" style={{ marginTop: '4px' }} />}
              </h1>
              <div className={styles.rating}>
                <Star size={18} fill={ratingValue > 0 ? "currentColor" : "none"} /> 
                {ratingValue > 0 ? `${ratingValue.toFixed(1)} (${reviewsCount} review${reviewsCount === 1 ? '' : 's'})` : 'No reviews yet'}
              </div>
            </div>
            
            <div className={styles.metaRow}>
              <span className={styles.metaItem}><MapPin size={16} /> {location}</span>
              <span className={styles.metaItem} style={{ textTransform: 'capitalize' }}><Award size={16} /> {mode} Training</span>
              <span className={styles.metaItem}><Users size={16} /> {followersCount} Followers</span>
              <span className={styles.metaItem}><Eye size={16} /> {viewsCount} Views</span>
              <span className={styles.metaItem}><Heart size={16} /> {likesCount} Likes</span>
              {trainerInfo.experienceYears > 0 && <span className={styles.metaItem}><Award size={16} /> {trainerInfo.experienceYears} Years Exp.</span>}
            </div>

            <div className={styles.specialties}>
              {specialties.map(spec => (
                <span key={spec} className={styles.tag}>{spec}</span>
              ))}
              {trainerInfo.expertise?.map(exp => (
                <span key={exp} className={styles.tag} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>{exp}</span>
              ))}
            </div>
          </div>

          <div className={styles.bookingCard}>
            <div className={styles.priceRow}>
              <span className={styles.price}>${price}</span>
              <span className={styles.perSession}>/ session</span>
            </div>
            <p className={styles.bookingText}>Book a 1-on-1 session. Funds are held securely in escrow until completion.</p>
            <button className={styles.bookBtn} onClick={() => setShowEscrow(true)}>
              Book Session
            </button>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button 
                className={styles.followBtn} 
                onClick={toggleFollow} 
                disabled={followLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: isFollowing ? 'transparent' : 'rgba(255,255,255,0.05)',
                  border: isFollowing ? '1px solid var(--color-border)' : '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {isFollowing ? <><UserCheck size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
              </button>

              <button 
                className={styles.likeBtn} 
                onClick={toggleLike} 
                disabled={likeLoading}
                style={{
                  padding: '12px', borderRadius: '12px',
                  background: isLiked ? 'rgba(236, 72, 153, 0.1)' : 'rgba(255,255,255,0.05)',
                  border: isLiked ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                  color: isLiked ? '#ec4899' : '#fff', 
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Heart size={20} fill={isLiked ? '#ec4899' : 'none'} />
              </button>
            </div>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/messages/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetUserId: trainer._id })
                  });
                  const data = await res.json();
                  if (data.success) {
                    router.push('/messages');
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              style={{
                marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3b82f6', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Message Trainer
            </button>
          </div>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.mainCol}>
            <section className={styles.section}>
              <h2>About Me</h2>
              <p className={styles.bio}>{bio}</p>
            </section>

            {(trainerInfo.introVideoUrl || trainerInfo.resumeUrl) && (
              <section className={styles.section} style={{ display: 'flex', gap: '16px' }}>
                {trainerInfo.introVideoUrl && (
                  <a href={trainerInfo.introVideoUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', fontWeight: '600' }}>
                    <PlayCircle size={20} /> Watch Intro Video
                  </a>
                )}
                {trainerInfo.resumeUrl && (
                  <a href={trainerInfo.resumeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', fontWeight: '600' }}>
                    <Award size={20} /> View CV / Resume
                  </a>
                )}
              </section>
            )}

            {mediaGallery.length > 0 && (
              <section className={styles.section}>
                <h2>Gallery & Transformations</h2>
                <div className={styles.gallery}>
                  {mediaGallery.map((url, i) => (
                    <div key={i} className={styles.galleryItem}>
                      <img src={url} alt={`Gallery ${i}`} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className={styles.section}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2>Reviews & Testimonials</h2>
                {currentUser && currentUser._id !== trainer._id && (
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {trainerInfo.reviews && trainerInfo.reviews.length > 0 ? (
                <div className={styles.reviewsList}>
                  {trainerInfo.reviews.map((review, i) => (
                    <div key={i} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={`https://ui-avatars.com/api/?name=${review.user?.username || 'User'}&background=random`} alt="User" className={styles.reviewAvatar} />
                          <div>
                            <strong>{review.user?.username || 'Verified User'}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', color: 'gold' }}>
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} size={14} fill={idx < review.rating ? "gold" : "none"} />
                          ))}
                        </div>
                      </div>
                      <p className={styles.reviewComment}>{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
                  No reviews yet. Be the first to leave a testimony!
                </div>
              )}
            </section>
          </div>
        </div>

        {showEscrow && (
          <div className={styles.escrowOverlay} onClick={() => setShowEscrow(false)}>
            <div className={styles.escrowModal} onClick={e => e.stopPropagation()}>
              <EscrowWidget trainer={trainer} price={price} onClose={() => setShowEscrow(false)} />
            </div>
          </div>
        )}

        {showReviewModal && (
          <div className={styles.escrowOverlay} onClick={() => setShowReviewModal(false)}>
            <div className={styles.reviewModal} onClick={e => e.stopPropagation()}>
              <h2>Write a Review</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>Share your experience training with {username}.</p>
              <form onSubmit={submitReview}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Rating</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        style={{ cursor: 'pointer', background: 'none', border: 'none' }}
                      >
                        <Star size={28} fill={reviewForm.rating >= star ? "gold" : "none"} color="gold" />
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Testimony</label>
                  <textarea 
                    rows={4}
                    required
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Describe your progress and experience..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowReviewModal(false)} style={{ padding: '10px 16px', background: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={submittingReview} style={{ padding: '10px 24px', background: 'var(--color-primary)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
