const fs = require('fs');
const file = 'app/pods/page.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
content = content.replace(
  `  const [newPodImage, setNewPodImage] = useState('');`,
  `  const [newPodImage, setNewPodImage] = useState('');
  const [newPodType, setNewPodType] = useState('standard');
  const [newPodRewardType, setNewPodRewardType] = useState('multiple_winners');
  const [newPodRules, setNewPodRules] = useState('');
  const [selectedPod, setSelectedPod] = useState(null);`
);

// 2. Update handleCreatePod body
content = content.replace(
  `body: JSON.stringify({ name: newPodName, description: newPodDesc, icon: newPodIcon, image: newPodImage, rewardXP: parseInt(newPodReward) || 0, rewardType: newPodRewardType })`,
  `body: JSON.stringify({ name: newPodName, description: newPodDesc, icon: newPodIcon, image: newPodImage, rewardXP: parseInt(newPodReward) || 0, rewardType: newPodRewardType, podType: newPodType, rules: newPodRules })`
);

// 3. Update Pod Card UI to use customImage and add View Details button
content = content.replace(
  `                      <h3 className={styles.podName}>{pod.name}</h3>`,
  `                      <h3 className={styles.podName}>{pod.name}</h3>
                      {pod.podType && pod.podType !== 'standard' && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--color-primary)', borderRadius: '4px', marginLeft: '8px' }}>
                          {pod.podType.replace('_', ' ').toUpperCase()}
                        </span>
                      )}`
);

content = content.replace(
  `                    <div className={styles.podIconWrap}>
                      <Icon size={24} />
                    </div>`,
  `                    <div className={styles.podIconWrap} style={{ overflow: 'hidden' }}>
                      {pod.customImage ? (
                        <img src={pod.customImage} alt="Pod Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Icon size={24} />
                      )}
                    </div>`
);

content = content.replace(
  `                  <button 
                    className={\`\${styles.joinBtn} \${pod.joined ? styles.joinedBtn : ''}\`}
                    onClick={() => toggleJoin(pod.id)}
                  >`,
  `                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button 
                      className={styles.joinBtn}
                      style={{ flex: 1, background: 'var(--color-surface)', color: 'white' }}
                      onClick={() => setSelectedPod(pod)}
                    >
                      Details
                    </button>
                    <button 
                      style={{ flex: 1 }}
                      className={\`\${styles.joinBtn} \${pod.joined ? styles.joinedBtn : ''}\`}
                      onClick={() => toggleJoin(pod.id)}
                    >`
);
content = content.replace(
  `                    {pod.joined ? 'Joined' : 'Join Pod'}
                  </button>`,
  `                    {pod.joined ? 'Joined' : 'Join Pod'}
                    </button>
                  </div>`
);

// 4. Update the Create Pod form to include the new fields
content = content.replace(
  `              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Select Icon</label>`,
  `              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Pod Type</label>
                <select value={newPodType} onChange={(e) => setNewPodType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}>
                  <option value="standard">Standard</option>
                  <option value="time_bound">Time Bound (Ends eventually)</option>
                  <option value="goal_bound">Goal Bound (Ends when goal met)</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Custom Rules</label>
                <textarea 
                  value={newPodRules} 
                  onChange={(e) => setNewPodRules(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff', minHeight: '60px' }}
                  placeholder="Rules for the pod, e.g. must check-in daily"
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Reward Type</label>
                  <select value={newPodRewardType} onChange={(e) => setNewPodRewardType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}>
                    <option value="multiple_winners">Multiple Winners (Shared XP)</option>
                    <option value="single_winner">Single Winner (Winner takes all)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>XP Deduction / Pool</label>
                  <input type="number" value={newPodReward} onChange={(e) => setNewPodReward(e.target.value)} placeholder="0 XP" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Custom Pod Image (Optional)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }} />
                {uploadingImage && <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>Uploading...</span>}
                {newPodImage && <img src={newPodImage} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Select Icon</label>`
);

// 5. Add Details Modal
content = content.replace(
  `      {showCreateModal && (`,
  `      {selectedPod && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setSelectedPod(null)}>
              <X size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedPod.customImage ? (
                  <img src={selectedPod.customImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Activity size={32} color="var(--color-primary)" />
                )}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{selectedPod.name}</h2>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  {selectedPod.members} Members • {selectedPod.podType?.replace('_', ' ').toUpperCase() || 'STANDARD'}
                </div>
              </div>
            </div>
            
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>{selectedPod.description}</p>
            
            {selectedPod.rules && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-primary)' }}>Pod Rules</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{selectedPod.rules}</p>
              </div>
            )}

            <div style={{ background: 'linear-gradient(45deg, rgba(34,197,94,0.1), rgba(16,185,129,0.1))', padding: '16px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={16} /> Reward Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Reward Type</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedPod.challenge?.rewardType?.replace('_', ' ').toUpperCase() || 'SHARED POOL'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Reward XP</div>
                  <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>{selectedPod.challenge?.rewardXP || 0} XP Pool</div>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '12px', marginBottom: 0 }}>
                {selectedPod.challenge?.rewardType === 'single_winner' 
                  ? 'The user with the highest contribution takes the entire XP pool at the end of the pod.' 
                  : 'The XP pool will be shared proportionally among all active contributors based on their effort.'}
              </p>
            </div>
            
            <button 
              style={{ width: '100%', padding: '16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              onClick={() => {
                toggleJoin(selectedPod.id);
                setSelectedPod(null);
              }}
            >
              {selectedPod.joined ? 'Leave Pod' : 'Join Pod Now'}
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (`
);

fs.writeFileSync(file, content);
console.log('UI update complete');
