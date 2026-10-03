const fs = require('fs');
const file = 'app/badges/page.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the hardcoded sections with a tab UI

content = content.replace(
  `          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Achievements & Rewards</h1>
              <p className={styles.subtitle}>Unlock badges for XP and spend your XP in the shop.</p>
            </div>
            <div className={styles.xpBadge}>
              <Star fill="currentColor" size={18} /> {user.xp || 0} XP
            </div>
          </div>`,
  `          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Achievements & Rewards</h1>
              <p className={styles.subtitle}>Unlock badges for XP and spend your XP in the shop.</p>
            </div>
            <div className={styles.xpBadge}>
              <Star fill="currentColor" size={18} /> {user.xp || 0} XP
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
            <button 
              onClick={() => setActiveTab('badges')} 
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '600', cursor: 'pointer', background: activeTab === 'badges' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: activeTab === 'badges' ? '#fff' : 'var(--color-text-muted)' }}
            >
              Badges
            </button>
            <button 
              onClick={() => setActiveTab('store')} 
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '600', cursor: 'pointer', background: activeTab === 'store' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: activeTab === 'store' ? '#fff' : 'var(--color-text-muted)' }}
            >
              XP Store
            </button>
            <button 
              onClick={() => setActiveTab('coins')} 
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '600', cursor: 'pointer', background: activeTab === 'coins' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: activeTab === 'coins' ? '#fff' : 'var(--color-text-muted)' }}
            >
              Buy Coins (XP)
            </button>
          </div>`
);

content = content.replace(
  `          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><Trophy size={24} style={{ color: '#fbbf24' }} /> Badges ({progressionBadges.filter(isBadgeUnlocked).length}/{progressionBadges.length})</h2>`,
  `          {activeTab === 'badges' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><Trophy size={24} style={{ color: '#fbbf24' }} /> Badges ({progressionBadges.filter(isBadgeUnlocked).length}/{progressionBadges.length})</h2>`
);

content = content.replace(
  `              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><Shield size={24} style={{ color: '#3b82f6' }} /> The XP Store</h2>`,
  `              </div>
            </div>
          </div>
          )}

          {activeTab === 'store' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><Shield size={24} style={{ color: '#3b82f6' }} /> The XP Store</h2>`
);

content = content.replace(
  `              })}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><Star size={24} style={{ color: '#10b981' }} /> Buy XP / Coins</h2>`,
  `              })}
            </div>
          </div>
          )}

          {activeTab === 'coins' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><Star size={24} style={{ color: '#10b981' }} /> Buy XP / Coins</h2>`
);

content = content.replace(
  `            </div>
          </div>

        </div>
      </div>
    </div>
  );
}`,
  `            </div>
          </div>
          )}

        </div>
      </div>
    </div>
  );
}`
);

fs.writeFileSync(file, content);
console.log('Tabs fixed');
