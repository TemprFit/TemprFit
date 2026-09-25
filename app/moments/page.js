'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Heart, MessageCircle, Eye, Plus, X, Send, MoreVertical, Bookmark, Edit2, Trash2, Smile, Dumbbell, FileText } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import styles from './page.module.css';

export default function MomentsPage() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMoment, setActiveMoment] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'saved'
  
  // Upload State
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiUpload, setShowEmojiUpload] = useState(false);

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [showEmojiComment, setShowEmojiComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const handleCommentLike = async (momentId, commentId) => {
    try {
      const res = await fetch(`/api/moments/${momentId}/comments/${commentId}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.map(m => {
          if (m._id === momentId) {
            return {
              ...m,
              comments: m.comments.map(c => c._id === commentId ? data.comment : c)
            };
          }
          return m;
        }));
        if (activeMoment && activeMoment._id === momentId) {
          setActiveMoment(prev => ({
            ...prev,
            comments: prev.comments.map(c => c._id === commentId ? data.comment : c)
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentReply = (comment) => {
    setReplyingTo(comment);
    setCommentText(`@${comment.user.username} `);
  };

  const handleReplyLike = async (momentId, commentId, replyId) => {
    try {
      const res = await fetch(`/api/moments/${momentId}/comments/${commentId}/replies/${replyId}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.map(m => {
          if (m._id === momentId) {
            return {
              ...m,
              comments: m.comments.map(c => c._id === commentId ? data.comment : c)
            };
          }
          return m;
        }));
        if (activeMoment && activeMoment._id === momentId) {
          setActiveMoment(prev => ({
            ...prev,
            comments: prev.comments.map(c => c._id === commentId ? data.comment : c)
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  // Edit State
  const [editingMomentId, setEditingMomentId] = useState(null);
  const [editCaption, setEditCaption] = useState('');

  // Dropdown Menu State
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setCurrentUser(d.user))
      .catch(console.error);
    fetchMoments();
  }, []);

  const fetchMoments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moments');
      const data = await res.json();
      if (data.moments) setMoments(data.moments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/moments/${id}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.map(m => {
          if (m._id === id) {
            const userId = currentUser?._id || 'me';
            const hasLiked = data.isLiked;
            return {
              ...m,
              likes: hasLiked ? [...(m.likes || []), userId] : (m.likes || []).filter(l => l !== userId),
              isLikedByMe: hasLiked
            };
          }
          return m;
        }));
        if (activeMoment && activeMoment._id === id) {
          setActiveMoment(prev => ({
            ...prev,
            likes: data.isLiked ? [...(prev.likes || []), currentUser?._id || 'me'] : (prev.likes || []).filter(l => l !== (currentUser?._id || 'me')),
            isLikedByMe: data.isLiked
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/moments/${id}/save`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.map(m => {
          if (m._id === id) {
            const userId = currentUser?._id || 'me';
            const hasSaved = data.isSaved;
            return {
              ...m,
              savedBy: hasSaved ? [...(m.savedBy || []), userId] : (m.savedBy || []).filter(s => s !== userId)
            };
          }
          return m;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!await window.appConfirm('Are you sure you want to delete this moment?')) return;
    
    try {
      const res = await fetch(`/api/moments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.filter(m => m._id !== id));
        setMenuOpenId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (e, moment) => {
    e.stopPropagation();
    setEditingMomentId(moment._id);
    setEditCaption(moment.caption);
    setMenuOpenId(null);
  };

  const saveEdit = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/moments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: editCaption })
      });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.map(m => m._id === id ? { ...m, caption: editCaption } : m));
        setEditingMomentId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openMoment = async (moment) => {
    setActiveMoment(moment);
    try {
      await fetch(`/api/moments/${moment._id}/view`, { method: 'POST' });
      setMoments(prev => prev.map(m => m._id === moment._id ? { ...m, views: m.views + 1 } : m));
      setActiveMoment(prev => ({ ...prev, views: prev.views + 1 }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeMoment) return;
    
    try {
      if (replyingTo) {
        const res = await fetch(`/api/moments/${activeMoment._id}/comments/${replyingTo._id}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: commentText.replace(`@${replyingTo.user.username} `, '') })
        });
        const data = await res.json();
        if (data.success) {
          setActiveMoment(prev => ({
            ...prev,
            comments: prev.comments.map(c => c._id === replyingTo._id ? data.comment : c)
          }));
          setMoments(prev => prev.map(m => {
            if (m._id === activeMoment._id) {
              return {
                ...m,
                comments: m.comments.map(c => c._id === replyingTo._id ? data.comment : c)
              };
            }
            return m;
          }));
        }
      } else {
        const res = await fetch(`/api/moments/${activeMoment._id}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: commentText })
        });
        const data = await res.json();
        if (data.success) {
          setActiveMoment(prev => ({ ...prev, comments: data.comments }));
          setMoments(prev => prev.map(m => m._id === activeMoment._id ? { ...m, comments: data.comments } : m));
        }
      }
      setCommentText('');
      setShowEmojiComment(false);
      setReplyingTo(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file && !mediaUrl) return;

    setUploading(true);
    try {
      let finalMediaUrl = mediaUrl;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        
        if (uploadData.success) {
          finalMediaUrl = uploadData.fileUrl;
        } else {
          throw new Error('File upload failed');
        }
      }

      const res = await fetch('/api/moments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl: finalMediaUrl, caption })
      });
      const data = await res.json();
      if (data.success) {
        setMoments([data.moment, ...moments]);
        setShowUpload(false);
        setMediaUrl('');
        setCaption('');
        setFile(null);
        setFilePreview(null);
        setShowEmojiUpload(false);
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const displayedMoments = activeTab === 'saved' 
    ? moments.filter(m => m.savedBy?.includes(currentUser?._id))
    : moments;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.momentsContainer}`}>
        
        <div className={styles.header}>
          <h1>Community Moments</h1>
          <button className={styles.uploadBtn} onClick={() => setShowUpload(true)} data-tour="tour-moments-post">
            <Plus size={20} /> Share a Moment
          </button>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'global' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('global')}
          >
            Global Feed
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'saved' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved Moments
          </button>
        </div>

        {loading ? (
          <p>Loading moments...</p>
        ) : displayedMoments.length === 0 ? (
          <p className={styles.muted}>No moments to display here.</p>
        ) : (
          <div className={styles.feed} data-tour="tour-moments-feed">
            {displayedMoments.map(m => {
              const isSavedByMe = m.savedBy?.includes(currentUser?._id);
              const isMyMoment = m.user?._id === currentUser?._id;

              return (
                <div key={m._id} className={styles.momentCard} onClick={() => openMoment(m)}>
                  <div className={styles.momentHeader}>
                    <img src={m.user?.avatarUrl || `https://ui-avatars.com/api/?name=${m.user?.username}&background=22c55e&color=fff`} className={`${styles.avatar} ${m.user?.activeBorder ? `aura-avatar-${m.user.activeBorder}` : ''}`} alt={m.user?.username} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className={styles.username} style={{ color: m.user?.activeColor || 'inherit' }}>{m.user?.username}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(m.createdAt)}</div>
                    </div>
                    
                    {isMyMoment && (
                      <div className={styles.menuContainer} onClick={e => e.stopPropagation()}>
                        <button className={styles.menuBtn} onClick={() => setMenuOpenId(menuOpenId === m._id ? null : m._id)}>
                          <MoreVertical size={20} />
                        </button>
                        {menuOpenId === m._id && (
                          <div className={styles.dropdownMenu}>
                            <button className={styles.dropdownItem} onClick={(e) => startEdit(e, m)}>
                              <Edit2 size={16} /> Edit Caption
                            </button>
                            <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={(e) => handleDelete(e, m._id)}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.mediaContainer}>
                    {m.sharedType ? (
                      <div className={styles.sharedCard}>
                        <div className={styles.sharedIcon}>
                          {m.sharedType === 'workout' ? <Dumbbell size={32} /> : <FileText size={32} />}
                        </div>
                        <h3>{m.sharedTitle || `Shared ${m.sharedType}`}</h3>
                        
                        {m.sharedPreview && m.sharedPreview.length > 0 && (
                          <ul className={styles.sharedPreviewList}>
                            {m.sharedPreview.map((line, idx) => (
                              <li key={idx}>{line}</li>
                            ))}
                          </ul>
                        )}

                        <Link href={m.sharedLink || '#'} className={styles.sharedBtn}>
                          View {m.sharedType}
                        </Link>
                      </div>
                    ) : m.mediaUrl?.match(/\.(mp4|webm)$/i) ? (
                      <video src={m.mediaUrl} className={styles.media} muted loop autoPlay playsInline preload="metadata" />
                    ) : m.mediaUrl ? (
                      <img src={m.mediaUrl} className={styles.media} alt="Moment" />
                    ) : null}
                  </div>

                  <div className={styles.actions}>
                    <button className={`${styles.actionBtn} ${m.isLikedByMe ? styles.liked : ''}`} onClick={(e) => handleLike(e, m._id)}>
                      <Heart size={20} fill={m.isLikedByMe ? "currentColor" : "none"} /> {m.likes?.length || 0}
                    </button>
                    <button className={styles.actionBtn}>
                      <MessageCircle size={20} /> {m.comments?.length || 0}
                    </button>
                    
                    <button className={`${styles.actionBtn} ${isSavedByMe ? styles.liked : ''}`} style={{ marginLeft: 'auto' }} onClick={(e) => handleSave(e, m._id)}>
                      <Bookmark size={20} fill={isSavedByMe ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className={styles.caption}>
                    {editingMomentId === m._id ? (
                      <div onClick={e => e.stopPropagation()}>
                        <textarea 
                          value={editCaption}
                          onChange={e => setEditCaption(e.target.value)}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '8px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={(e) => saveEdit(e, m._id)} style={{ background: '#22c55e', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                          <button onClick={() => setEditingMomentId(null)} style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    ) : m.caption ? (
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: m.user?.activeColor || 'inherit' }}>{m.user?.username}</strong> {m.caption}
                      </div>
                    ) : null}

                    {m.comments && m.comments.length > 2 && (
                      <button 
                        onClick={() => setActiveMoment(m)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px 0', fontSize: '0.9rem', textAlign: 'left' }}
                      >
                        View all {m.comments.length} comments
                      </button>
                    )}

                    {m.comments && m.comments.slice(0, 2).map((c, i) => (
                      <div key={i} style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                        <strong style={{ color: c.user?.activeColor || 'inherit' }}>{c.user?.username}</strong> {c.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className={styles.overlay} onClick={() => setShowUpload(false)}>
          <form className={styles.uploadForm} onClick={e => e.stopPropagation()} onSubmit={handleUpload}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Share a Moment</h2>
              <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowUpload(false)} />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="file" 
                accept="image/*,video/mp4,video/webm" 
                onChange={handleFileChange} 
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>OR</span>
              <input 
                type="text" 
                placeholder="Paste Media URL" 
                value={mediaUrl} 
                onChange={e => setMediaUrl(e.target.value)} 
                style={{ flex: 1 }}
              />
            </div>
            
            {(filePreview || mediaUrl) && (
              <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(file?.type.startsWith('video/') || mediaUrl.match(/\.(mp4|webm)$/i)) ? (
                  <video src={filePreview || mediaUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} controls />
                ) : (
                  <img src={filePreview || mediaUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display='none'} />
                )}
              </div>
            )}
            
            <div style={{ position: 'relative' }}>
              <textarea 
                placeholder="Write a caption..." 
                value={caption} 
                onChange={e => setCaption(e.target.value)} 
                rows={3} 
              />
              <button 
                type="button"
                onClick={() => setShowEmojiUpload(!showEmojiUpload)}
                style={{ position: 'absolute', bottom: '16px', right: '12px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <Smile size={20} />
              </button>
              {showEmojiUpload && (
                <div style={{ position: 'absolute', zIndex: 50, bottom: '100%', right: 0, marginBottom: '8px' }}>
                  <EmojiPicker theme="dark" onEmojiClick={(e) => setCaption(prev => prev + e.emoji)} />
                </div>
              )}
            </div>
            <button className={styles.uploadBtn} type="submit" disabled={uploading}>
              {uploading ? 'Posting...' : 'Post Moment'}
            </button>
          </form>
        </div>
      )}

      {/* View Modal */}
      {activeMoment && (
        <div className={styles.overlay} onClick={() => setActiveMoment(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalMedia}>
              {activeMoment.sharedType ? (
                 <div className={styles.sharedCard} style={{ margin: 'auto', background: 'var(--color-surface)', width: '80%', padding: '40px' }}>
                  <div className={styles.sharedIcon}>
                    {activeMoment.sharedType === 'workout' ? <Dumbbell size={48} /> : <FileText size={48} />}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', margin: '16px 0' }}>{activeMoment.sharedTitle || `Shared ${activeMoment.sharedType}`}</h3>
                  
                  {activeMoment.sharedPreview && activeMoment.sharedPreview.length > 0 && (
                    <ul className={styles.sharedPreviewList} style={{ fontSize: '1.1rem', marginBottom: '24px' }}>
                      {activeMoment.sharedPreview.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  )}

                  <Link href={activeMoment.sharedLink || '#'} className={styles.sharedBtn} style={{ padding: '12px 24px', fontSize: '1rem' }}>
                    View {activeMoment.sharedType}
                  </Link>
                </div>
              ) : activeMoment.mediaUrl?.match(/\.(mp4|webm)$/i) ? (
                <video src={activeMoment.mediaUrl} controls autoPlay />
              ) : activeMoment.mediaUrl ? (
                <img src={activeMoment.mediaUrl} alt="Moment" />
              ) : null}
            </div>
            
            <div className={styles.modalSidebar}>
              <div className={styles.momentHeader} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <img src={activeMoment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${activeMoment.user?.username}&background=22c55e&color=fff`} className={`${styles.avatar} ${activeMoment.user?.activeBorder ? `aura-avatar-${activeMoment.user.activeBorder}` : ''}`} alt={activeMoment.user?.username} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className={styles.username} style={{ color: activeMoment.user?.activeColor || 'inherit' }}>{activeMoment.user?.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(activeMoment.createdAt)}</div>
                </div>
                <X size={20} style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setActiveMoment(null)} />
              </div>
              
              <div className={styles.commentsArea}>
                {activeMoment.caption && (
                  <div className={styles.comment}>
                    <img src={activeMoment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${activeMoment.user?.username}&background=22c55e&color=fff`} className={styles.commentAvatar} />
                    <div className={styles.commentText}>
                      <strong style={{ color: activeMoment.user?.activeColor || 'inherit' }}>{activeMoment.user?.username}</strong> {activeMoment.caption}
                    </div>
                  </div>
                )}
                
                {activeMoment.comments?.map((c, i) => {
                  const hasLiked = c.likes?.includes(currentUser?._id);
                  return (
                    <div key={i} className={styles.commentBlock} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className={styles.comment} style={{ display: 'flex', gap: '12px' }}>
                        <img src={c.user?.avatarUrl || `https://ui-avatars.com/api/?name=${c.user?.username}&background=22c55e&color=fff`} className={styles.commentAvatar} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <div style={{ flex: 1 }}>
                          <div className={styles.commentText} style={{ fontSize: '0.9rem' }}>
                            <strong style={{ color: c.user?.activeColor || 'inherit' }}>{c.user?.username}</strong> {c.text}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            <span>{formatDate(c.createdAt)}</span>
                            <button onClick={() => handleCommentLike(activeMoment._id, c._id)} style={{ background: 'none', border: 'none', color: hasLiked ? 'var(--color-primary)' : 'inherit', cursor: 'pointer', padding: 0 }}>
                              {c.likes?.length || 0} {c.likes?.length === 1 ? 'like' : 'likes'}
                            </button>
                            <button onClick={() => handleCommentReply(c)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>Reply</button>
                          </div>
                        </div>
                      </div>
                      
                      {c.replies?.length > 0 && (
                        <div style={{ marginLeft: '44px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                          {c.replies.map((reply, ridx) => {
                            const hasReplyLiked = reply.likes?.includes(currentUser?._id);
                            return (
                              <div key={ridx} className={styles.comment} style={{ display: 'flex', gap: '8px' }}>
                                <img src={reply.user?.avatarUrl || `https://ui-avatars.com/api/?name=${reply.user?.username}&background=22c55e&color=fff`} className={styles.commentAvatar} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                <div style={{ flex: 1 }}>
                                  <div className={styles.commentText} style={{ fontSize: '0.85rem' }}>
                                    <strong style={{ color: reply.user?.activeColor || 'inherit' }}>{reply.user?.username}</strong> {reply.text}
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                    <span>{formatDate(reply.createdAt)}</span>
                                    <button onClick={() => handleReplyLike(activeMoment._id, c._id, reply._id)} style={{ background: 'none', border: 'none', color: hasReplyLiked ? 'var(--color-primary)' : 'inherit', cursor: 'pointer', padding: 0 }}>
                                      {reply.likes?.length || 0} {reply.likes?.length === 1 ? 'like' : 'likes'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.actions} style={{ borderTop: '1px solid var(--color-border)' }}>
                <button className={`${styles.actionBtn} ${activeMoment.isLikedByMe ? styles.liked : ''}`} onClick={(e) => handleLike(e, activeMoment._id)}>
                  <Heart size={24} fill={activeMoment.isLikedByMe ? "currentColor" : "none"} />
                </button>
                <button className={styles.actionBtn}>
                  <MessageCircle size={24} />
                </button>
                <button className={`${styles.actionBtn} ${activeMoment.savedBy?.includes(currentUser?._id) ? styles.liked : ''}`} onClick={(e) => handleSave(e, activeMoment._id)}>
                  <Bookmark size={24} fill={activeMoment.savedBy?.includes(currentUser?._id) ? "currentColor" : "none"} />
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  <span>{activeMoment.likes?.length || 0} likes</span>
                  <span>{activeMoment.views || 0} views</span>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <form className={styles.commentInputArea} onSubmit={handleComment}>
                  <button type="button" onClick={() => setShowEmojiComment(!showEmojiComment)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', paddingRight: '4px' }}>
                    <Smile size={20} />
                  </button>
                  <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    value={commentText} 
                    onChange={e => setCommentText(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <button type="submit">Post</button>
                </form>
                {showEmojiComment && (
                  <div style={{ position: 'absolute', zIndex: 50, bottom: '100%', left: 0, marginBottom: '8px' }}>
                    <EmojiPicker theme="dark" onEmojiClick={(e) => setCommentText(prev => prev + e.emoji)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
