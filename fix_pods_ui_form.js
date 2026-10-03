const fs = require('fs');
const file = 'app/pods/page.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                </div>\n              </div>\n              <button \n                type="submit" \n                disabled={creating}`;

const replacementStr = `                </div>
              </div>
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
              <button 
                type="submit" 
                disabled={creating}`;

// Doing it with split to ignore carriage returns matching
let lines = content.split('\\n');
let replaced = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('              <button ') && lines[i+1] && lines[i+1].includes('type="submit"')) {
    // Check if we are in the form part
    if (lines[i-1].includes('</div>') && lines[i-2].includes('</div>')) {
      // Replace these lines
      lines.splice(i, 2, ...replacementStr.split('\\n'));
      replaced = true;
      break;
    }
  }
}

if (!replaced) {
  // alternative way, just replace by index
  console.log("Could not find the exact pattern. Doing fallback.");
  const btnIdx = lines.findIndex(l => l.includes('type="submit"'));
  if (btnIdx > 0) {
    lines.splice(btnIdx - 1, 0, ...replacementStr.split('\\n').slice(2, -2));
    replaced = true;
  }
}

fs.writeFileSync(file, lines.join('\\n'));
console.log('Fixed Pods UI form');
