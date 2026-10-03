const fs = require('fs');

const podPage = 'app/pods/page.js';
let podCode = fs.readFileSync(podPage, 'utf8');

// 1. Add onClick to podCard
podCode = podCode.replace(
  `<div key={pod.id} className={styles.podCard}>`,
  `<div key={pod.id} className={styles.podCard} onClick={() => setSelectedPod(pod)} style={{ cursor: 'pointer' }}>`
);
// Stop propagation on Join button
podCode = podCode.replace(
  `onClick={() => toggleJoin(pod.id)}`,
  `onClick={(e) => { e.stopPropagation(); toggleJoin(pod.id); }}`
);

// 2. Add missing fields to create modal form
const formFields = `
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Custom Cover Image (Optional)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="pod-image-upload" />
                  <label htmlFor="pod-image-upload" style={{ padding: '8px 16px', background: 'var(--color-surface)', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--color-border)' }}>
                    {uploadingImage ? 'Uploading...' : 'Choose Image'}
                  </label>
                  {newPodImage && <img src={newPodImage} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Pod Type</label>
                  <select value={newPodType} onChange={e => setNewPodType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}>
                    <option value="standard">Standard</option>
                    <option value="time_bound">Time Bound</option>
                    <option value="goal_bound">Goal Bound</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Reward Type</label>
                  <select value={newPodRewardType} onChange={e => setNewPodRewardType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}>
                    <option value="multiple_winners">Shared Pool</option>
                    <option value="single_winner">Winner Takes All</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>XP Deduction (Reward Pool)</label>
                <input 
                  type="number" 
                  value={newPodReward} 
                  onChange={(e) => setNewPodReward(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}
                  placeholder="e.g. 500 (Deducted from your balance)"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Pod Rules</label>
                <textarea 
                  value={newPodRules} 
                  onChange={(e) => setNewPodRules(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff', minHeight: '60px' }}
                  placeholder="What are the rules for winning the XP reward?"
                />
              </div>
`;

// Insert the new fields before the Submit button
podCode = podCode.replace(
  `              <button 
                type="submit" 
                disabled={creating}`,
  formFields + `\n              <button 
                type="submit" 
                disabled={creating}`
);

fs.writeFileSync(podPage, podCode);
console.log('Fixed Pods UI');
