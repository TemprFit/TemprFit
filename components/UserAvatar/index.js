'use client';
import React, { useState, useEffect } from 'react';
import styles from './UserAvatar.module.css';
import { User, X } from 'lucide-react';

export default function UserAvatar({ user, size = 'md', className = '', disableEffects = false, disableLightbox = true }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsViewerOpen(false);
    };
    if (isViewerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen]);

  if (!user) return <div className={`${styles.container} ${className}`}><User size={24} /></div>;

  // Determine actual rendered size in pixels for orbit calculations
  let sizePx = 40;
  if (size === 'sm') sizePx = 28;
  if (size === 'lg') sizePx = 80;
  if (size === 'xl') sizePx = 120;
  
  const orbitRadius = (sizePx / 2) + 5;

  const { avatarUrl, username, activeBorder, activeColor } = user;
  
  // Fallback avatar logic
  const fallbackUrl = `https://ui-avatars.com/api/?name=${username || 'User'}&background=22c55e&color=fff`;
  const imgSrc = avatarUrl || fallbackUrl;

  const showEffects = !disableEffects && activeBorder;
  const hasCustomColor = !disableEffects && activeColor;
  
  const inlineStyles = {
    width: `${sizePx}px`,
    height: `${sizePx}px`,
    ...(hasCustomColor ? { '--avatar-color': activeColor } : {}),
    '--orbit-radius': orbitRadius
  };

  return (
    <div 
      className={`
        ${styles.container} 
        ${hasCustomColor ? styles.hasCustomColor : ''} 
        ${className}
      `}
      style={inlineStyles}
    >
      <img 
        src={imgSrc} 
        alt={username} 
        className={styles.avatarImage} 
        onClick={() => { if (!disableLightbox) setIsViewerOpen(true); }}
        style={{ cursor: disableLightbox ? 'default' : 'pointer' }}
      />

      {/* Lightning */}
      {showEffects && activeBorder === 'lightning' && <div className={styles.effectLightning} />}

      {/* Stars */}
      {showEffects && activeBorder === 'stars' && (
        <div className={styles.effectStars}>
          <div className={styles.orbitItem}>⭐</div>
          <div className={styles.orbitItem}>✨</div>
          <div className={styles.burstItem}>✨</div>
          <div className={styles.burstItem}>⭐</div>
        </div>
      )}

      {/* Moon */}
      {showEffects && activeBorder === 'moon' && (
        <div className={styles.effectMoon}>
          <div className={styles.orbitItem}>🌙</div>
          <div className={styles.burstItem}>✨</div>
          <div className={styles.burstItem}>✨</div>
        </div>
      )}

      {/* Fire Aura */}
      {showEffects && activeBorder === 'fire' && (
        <div className={styles.effectFire}>
          <div className={styles.burstItem}>🔥</div>
          <div className={styles.burstItem}>✨</div>
        </div>
      )}

      {/* Gold Frame */}
      {showEffects && activeBorder === 'gold' && (
        <div className={styles.effectGold}>
          <div className={styles.burstItem}>✨</div>
          <div className={styles.burstItem}>✨</div>
        </div>
      )}

      {/* Diamond */}
      {showEffects && activeBorder === 'diamond' && <div className={styles.effectDiamond} />}

      {/* Rocket Fuel */}
      {showEffects && activeBorder === 'rocket' && <div className={styles.effectRocket} />}

      {/* Nebula */}
      {showEffects && activeBorder === 'nebula' && <div className={styles.effectNebula} />}

      {/* Matrix */}
      {showEffects && activeBorder === 'matrix' && (
        <div className={styles.effectMatrix}>
          <div className={styles.burstItem}>1</div>
          <div className={styles.burstItem}>0</div>
          <div className={styles.burstItem}>1</div>
        </div>
      )}

      {/* Ocean */}
      {showEffects && activeBorder === 'ocean' && <div className={styles.effectOcean} />}

      {/* Plasma */}
      {showEffects && activeBorder === 'plasma' && <div className={styles.effectPlasma} />}

      {/* Sakura */}
      {showEffects && activeBorder === 'sakura' && (
        <div className={styles.effectSakura}>
          <div className={styles.burstItem}>🌸</div>
          <div className={styles.burstItem}>🌸</div>
        </div>
      )}

      {/* Glitch */}
      {showEffects && activeBorder === 'glitch' && <div className={styles.effectGlitch} />}

      {/* Toxic */}
      {showEffects && activeBorder === 'toxic' && (
        <div className={styles.effectToxic}>
          <div className={styles.burstItem} />
          <div className={styles.burstItem} />
        </div>
      )}

      {/* Holy Light */}
      {showEffects && activeBorder === 'holy_light' && <div className={styles.effectHoly} />}

      {/* Shadow Void */}
      {showEffects && activeBorder === 'shadow' && <div className={styles.effectShadow} />}

      {/* Neon Pulse */}
      {showEffects && activeBorder === 'neon_pulse' && <div className={styles.effectNeonPulse} />}
      
      {isViewerOpen && (
        <div 
          className={styles.viewerOverlay} 
          role="dialog" 
          aria-label="Profile photo preview"
          onClick={() => setIsViewerOpen(false)}
        >
          <div className={styles.viewerContent} onClick={e => e.stopPropagation()}>
            <button className={styles.viewerClose} onClick={() => setIsViewerOpen(false)}>
              <X size={24} color="#fff" />
            </button>
            <img src={imgSrc} alt={username} className={styles.viewerImg} />
          </div>
        </div>
      )}
    </div>
  );
}
