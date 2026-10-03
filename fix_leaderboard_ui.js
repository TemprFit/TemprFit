const fs = require('fs');
const file = 'app/leaderboard/page.js';
let content = fs.readFileSync(file, 'utf8');

// Add states
content = content.replace(
  `  const [activeTab, setActiveTab] = useState('bronze'); // bronze, silver, gold, platinum`,
  `  const [activeTab, setActiveTab] = useState('bronze');
  const [activeCategory, setActiveCategory] = useState('xp');
  const [offset, setOffset] = useState(0);
  const [myRankInfo, setMyRankInfo] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);`
);

// Update fetch
content = content.replace(
  `  useEffect(() => {
    setLeaderboard([]); // clear while loading
    fetch(\`/api/leaderboard?league=\${activeTab}\`)
      .then(r => r.json())
      .then(data => {
        if (data.leaderboard) {
          // Identify if the logged in user is in the list
          const mapped = data.leaderboard.map(entry => ({
            ...entry,
            isMe: user && (entry.id === user._id)
          }));
          setLeaderboard(mapped);
        }
      })
      .catch(() => {});
  }, [user, activeTab]);`,
  `  useEffect(() => {
    setLeaderboard([]); // clear while loading
    setOffset(0);
    fetchBoard(0);
  }, [user, activeTab, activeCategory]);

  const fetchBoard = (currentOffset) => {
    setLoadingMore(true);
    fetch(\`/api/leaderboard?league=\${activeTab}&category=\${activeCategory}&offset=\${currentOffset}&limit=10\`)
      .then(r => r.json())
      .then(data => {
        if (data.leaderboard) {
          const mapped = data.leaderboard.map(entry => ({
            ...entry,
            isMe: user && (entry.id === user._id)
          }));
          if (currentOffset === 0) {
            setLeaderboard(mapped);
            setMyRankInfo(data.myRank ? { rank: data.myRank, total: data.totalCount } : null);
          } else {
            setLeaderboard(prev => [...prev, ...mapped]);
          }
          setHasMore(data.leaderboard.length === 10);
        }
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  };

  const handleSeeMore = () => {
    const nextOffset = offset + 10;
    setOffset(nextOffset);
    fetchBoard(nextOffset);
  };`
);

// Add category tabs and "My Rank" card
content = content.replace(
  `          <div className={styles.tabs}>`,
  `          {myRankInfo && (
            <div style={{ background: 'linear-gradient(45deg, rgba(251,191,36,0.1), rgba(245,158,11,0.1))', border: '1px solid rgba(251,191,36,0.3)', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Global Rank</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fbbf24' }}>#{myRankInfo.rank} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>of {myRankInfo.total}</span></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Total XP</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>{user.xp?.toLocaleString()}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            <button 
              onClick={() => setActiveCategory('xp')} 
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '600', cursor: 'pointer', background: activeCategory === 'xp' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: activeCategory === 'xp' ? '#fff' : 'var(--color-text-muted)' }}
            >
              XP Rankers
            </button>
            <button 
              onClick={() => setActiveCategory('badges')} 
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '600', cursor: 'pointer', background: activeCategory === 'badges' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: activeCategory === 'badges' ? '#fff' : 'var(--color-text-muted)' }}
            >
              Badge Collectors
            </button>
          </div>

          <div className={styles.tabs}>`
);

// Update score header
content = content.replace(
  `              <div style={{ textAlign: 'right' }}>Total XP</div>`,
  `              <div style={{ textAlign: 'right' }}>{activeCategory === 'badges' ? 'Badges' : 'Total XP'}</div>`
);

// Update score value
content = content.replace(
  `<span style={{ fontWeight: 800, color: '#fbbf24' }}>{entry.score.toLocaleString()} XP</span>`,
  `<span style={{ fontWeight: 800, color: '#fbbf24' }}>{entry.score.toLocaleString()} {activeCategory === 'badges' ? 'Badges' : 'XP'}</span>`
);

// Add see more button at bottom
content = content.replace(
  `            </div>
          </div>

        </div>
      </div>
    </div>`,
  `            </div>
            
            {hasMore && leaderboard.length > 0 && (
              <button 
                onClick={handleSeeMore}
                disabled={loadingMore}
                style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '8px', marginTop: '16px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {loadingMore ? 'Loading...' : 'See More'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>`
);

// Rank number index 
content = content.replace(
  `const rank = idx + 1;`,
  `const rank = offset + idx + 1;`
);

fs.writeFileSync(file, content);
console.log('Leaderboard UI fixed');
