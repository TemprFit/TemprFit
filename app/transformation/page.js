'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Plus, ZoomIn, Loader2, Sparkles, X, Activity } from 'lucide-react';
import styles from './page.module.css';

// Downscale image to a reasonable size to save tokens/bandwidth
function compressImage(file, maxSize = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
}

export default function TransformationPage() {
  const [baseImage, setBaseImage] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [baseTags, setBaseTags] = useState([]);
  const [newTags, setNewTags] = useState([]);
  const [gender, setGender] = useState('Male');
  
  const [activeTab, setActiveTab] = useState('upload'); // upload, tag, compare
  const [activeImage, setActiveImage] = useState('base'); // for tagging
  
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [currentCoord, setCurrentCoord] = useState({ x: 0, y: 0 });
  const [tagLabel, setTagLabel] = useState('');
  
  const [zoomFactor, setZoomFactor] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [aiFeedback, setAiFeedback] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const baseImageRef = useRef(null);
  const newImageRef = useRef(null);
  const tagInputRef = useRef(null);

  const handleUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    if (type === 'base') setBaseImage(compressed);
    if (type === 'new') setNewImage(compressed);
  };

  const handleImageClick = (e, type) => {
    if (activeTab !== 'tag') return;
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentCoord({ x, y });
    setActiveImage(type);
    setTagLabel('');
    setTagInputOpen(true);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!tagLabel.trim()) return;
    const newTag = { bodyPart: tagLabel.trim(), x: currentCoord.x, y: currentCoord.y };
    if (activeImage === 'base') setBaseTags([...baseTags, newTag]);
    else setNewTags([...newTags, newTag]);
    setTagInputOpen(false);
  };

  const focusTag = (tag) => {
    // Zoom in on the specific coordinate
    setZoomFactor(2.5);
    // Center the coordinate
    setPan({
      x: 50 - tag.x,
      y: 50 - tag.y
    });
  };

  const resetZoom = () => {
    setZoomFactor(1);
    setPan({ x: 0, y: 0 });
  };

  const analyzeTransformation = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/transformation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseImage, newImage, gender, baseTags, newTags
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiFeedback(data.feedback);
      } else {
        setAiFeedback(data.error || 'Failed to analyze transformation.');
      }
    } catch (err) {
      console.error(err);
      setAiFeedback('Failed to analyze transformation.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveTransformation = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/transformation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseImage, newImage, gender, baseTags, newTags, aiFeedback
        }),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/transformation')
      .then(res => res.json())
      .then(data => {
        if (data.transformations) setHistory(data.transformations);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (tagInputOpen && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [tagInputOpen]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Activity size={28} />
          <h1>Transformation Journey</h1>
        </div>
        <p>Compare your progress with AI-powered visual analysis.</p>
        
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`} onClick={() => setActiveTab('upload')}>1. Upload</button>
          <button className={`${styles.tab} ${activeTab === 'tag' ? styles.active : ''}`} onClick={() => setActiveTab('tag')} disabled={!baseImage || !newImage}>2. Tag</button>
          <button className={`${styles.tab} ${activeTab === 'compare' ? styles.active : ''}`} onClick={() => setActiveTab('compare')} disabled={!baseImage || !newImage}>3. Compare</button>
          <button className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`} onClick={() => setActiveTab('history')}>History Map</button>
        </div>
      </div>

      {activeTab === 'upload' && (
        <div className={styles.uploadSection}>
          <div className={styles.genderSelect}>
            <label>I am:</label>
            <select value={gender} onChange={e => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className={styles.uploadGrid}>
            <div className={styles.uploadCard}>
              <h3>Base Image (Before)</h3>
              {baseImage ? (
                <div className={styles.previewWrap}>
                  <img src={baseImage} alt="Base" className={styles.preview} />
                  <button className={styles.changeBtn} onClick={() => setBaseImage(null)}><X size={16} /></button>
                </div>
              ) : (
                <label className={styles.dropzone}>
                  <Upload size={32} />
                  <span>Upload Before Photo</span>
                  <input type="file" accept="image/*" hidden onChange={(e) => handleUpload(e, 'base')} />
                </label>
              )}
            </div>
            
            <div className={styles.uploadCard}>
              <h3>New Image (After)</h3>
              {newImage ? (
                <div className={styles.previewWrap}>
                  <img src={newImage} alt="New" className={styles.preview} />
                  <button className={styles.changeBtn} onClick={() => setNewImage(null)}><X size={16} /></button>
                </div>
              ) : (
                <label className={styles.dropzone}>
                  <Upload size={32} />
                  <span>Upload After Photo</span>
                  <input type="file" accept="image/*" hidden onChange={(e) => handleUpload(e, 'new')} />
                </label>
              )}
            </div>
          </div>
          <div className={styles.actions}>
            <button 
              className={styles.primaryBtn} 
              disabled={!baseImage || !newImage}
              onClick={() => setActiveTab('tag')}
            >
              Continue to Tagging
            </button>
          </div>
        </div>
      )}

      {activeTab === 'tag' && (
        <div className={styles.tagSection}>
          <p className={styles.hint}>Click on the images to drop pins on specific body parts (e.g., Chest, Shoulders).</p>
          
          <div className={styles.tagGrid}>
            <div className={styles.imageContainer}>
              <h3>Base Image</h3>
              <div className={styles.imageWrapper}>
                <img src={baseImage} alt="Base" onClick={(e) => handleImageClick(e, 'base')} />
                {baseTags.map((tag, i) => (
                  <div key={i} className={styles.pin} style={{ left: `${tag.x}%`, top: `${tag.y}%` }}>
                    <span className={styles.pinLabel}>{tag.bodyPart}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.imageContainer}>
              <h3>New Image</h3>
              <div className={styles.imageWrapper}>
                <img src={newImage} alt="New" onClick={(e) => handleImageClick(e, 'new')} />
                {newTags.map((tag, i) => (
                  <div key={i} className={styles.pin} style={{ left: `${tag.x}%`, top: `${tag.y}%` }}>
                    <span className={styles.pinLabel}>{tag.bodyPart}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={() => setActiveTab('compare')}>Continue to Comparison</button>
          </div>
          
          {tagInputOpen && (
            <div className={styles.modalOverlay} onClick={() => setTagInputOpen(false)}>
              <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h4>Add Tag</h4>
                <form onSubmit={handleAddTag}>
                  <input 
                    ref={tagInputRef}
                    type="text" 
                    placeholder="e.g. Left Shoulder"
                    value={tagLabel}
                    onChange={e => setTagLabel(e.target.value)}
                  />
                  <button type="submit">Add Pin</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <div className={styles.compareSection}>
          
          <div className={styles.compareLayout}>
            <div className={styles.compareSidebar}>
              <h3>Tagged Areas</h3>
              <p>Click a tag to synchronize zoom.</p>
              
              <div className={styles.tagList}>
                {baseTags.map((t, i) => (
                  <button key={i} className={styles.tagBtn} onClick={() => focusTag(t)}>
                    <ZoomIn size={14} /> {t.bodyPart} (Base)
                  </button>
                ))}
                {newTags.map((t, i) => (
                  <button key={i} className={styles.tagBtn} onClick={() => focusTag(t)}>
                    <ZoomIn size={14} /> {t.bodyPart} (New)
                  </button>
                ))}
                <button className={styles.tagBtn} style={{ background: 'var(--surface-hover)' }} onClick={resetZoom}>Reset Zoom</button>
              </div>

              {!aiFeedback && !analyzing && (
                <button className={styles.aiBtn} onClick={analyzeTransformation}>
                  <Sparkles size={18} /> Analyze with AI
                </button>
              )}
              {analyzing && (
                <div className={styles.analyzingBox}>
                  <Loader2 size={20} className={styles.spin} /> AI is analyzing...
                </div>
              )}
              {aiFeedback && (
                <div className={styles.aiFeedbackBox}>
                  <h4><Sparkles size={16} /> AI Coach Analysis</h4>
                  <p>{aiFeedback}</p>
                  
                  <button className={styles.saveBtn} onClick={saveTransformation} disabled={saving || saved}>
                    {saving ? 'Saving...' : saved ? 'Saved to Profile!' : 'Save Transformation'}
                  </button>
                </div>
              )}
            </div>
            
            <div className={styles.compareViewer}>
              <div className={styles.syncViewer}>
                <div className={styles.viewPane}>
                  <div className={styles.viewInner} style={{ 
                    transform: `scale(${zoomFactor}) translate(${pan.x}%, ${pan.y}%)`,
                    transformOrigin: 'center'
                  }}>
                    <img src={baseImage} alt="Base Zoom" />
                  </div>
                  <div className={styles.paneLabel}>Before</div>
                </div>
                <div className={styles.viewPane}>
                  <div className={styles.viewInner} style={{ 
                    transform: `scale(${zoomFactor}) translate(${pan.x}%, ${pan.y}%)`,
                    transformOrigin: 'center'
                  }}>
                    <img src={newImage} alt="New Zoom" />
                  </div>
                  <div className={styles.paneLabel}>After</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}

      {activeTab === 'history' && (
        <div className={styles.historyMap}>
          <h2>Your Transformation Journey</h2>
          {history.length === 0 ? (
            <p>You haven't saved any transformations yet.</p>
          ) : (
            <div className={styles.timeline}>
              {history.map((item, index) => (
                <div key={item._id} className={styles.timelineNode}>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineImages}>
                      <img src={item.baseImage} alt="Before" />
                      <img src={item.newImage} alt="After" />
                    </div>
                    <div className={styles.timelineDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <p className={styles.timelineFeedback}>{item.aiFeedback}</p>
                  </div>
                  {index < history.length - 1 && <div className={styles.timelineArrow}>↓</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
