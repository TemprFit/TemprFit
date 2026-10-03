const fs = require('fs');

// 1. Fix BMI display in onboarding
const onboardingFile = 'app/onboarding/page.js';
let onboarding = fs.readFileSync(onboardingFile, 'utf8');
onboarding = onboarding.replace(
  `const bmi = (weightKg / (heightM * heightM)).toFixed(1);`,
  `const bmiValue = weightKg / (heightM * heightM);
        const bmi = isNaN(bmiValue) ? '-' : bmiValue.toFixed(1);`
);
fs.writeFileSync(onboardingFile, onboarding);

// 2. Update Moments API
const momentsApiFile = 'app/api/moments/route.js';
let momentsApi = fs.readFileSync(momentsApiFile, 'utf8');
momentsApi = momentsApi.replace(
  `const { mediaUrl, caption } = await req.json();
    if (!mediaUrl) return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });

    const newMoment = await Moment.create({
      user: user._id,
      mediaUrl,
      caption: caption || '',
    });`,
  `const body = await req.json();
    const { mediaUrl, caption, sharedLink, sharedTitle, sharedType, sharedPreview } = body;
    
    if (!mediaUrl && !sharedType) return NextResponse.json({ error: 'Media URL or Shared Content is required' }, { status: 400 });

    const newMoment = await Moment.create({
      user: user._id,
      mediaUrl: mediaUrl || '',
      caption: caption || '',
      sharedLink: sharedLink || '',
      sharedTitle: sharedTitle || '',
      sharedType: sharedType || '',
      sharedPreview: sharedPreview || [],
    });`
);
fs.writeFileSync(momentsApiFile, momentsApi);

// 3. Update AI Workout UI to add Share button
const aiWorkoutFile = 'app/workouts/ai/page.js';
let aiWorkout = fs.readFileSync(aiWorkoutFile, 'utf8');
aiWorkout = aiWorkout.replace(
  `<button 
                  onClick={async () => {`,
  `<button 
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/moments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          sharedType: 'workout',
                          sharedTitle: \`AI Workout: \${plan.goal}\`,
                          sharedPreview: [
                            \`Equipment: \${plan.equipment}\`,
                            \`Duration: \${plan.days.length} Days\`
                          ],
                          caption: \`Just generated a new \${plan.goal} program using the AI Coach! 💪\`
                        })
                      });
                      if (res.ok) window.appAlert('Successfully shared to Moments! 🚀');
                      else window.appAlert('Failed to share.');
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  style={{ background: '#a855f7', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Share to Moments
                </button>
                <button 
                  onClick={async () => {`
);
fs.writeFileSync(aiWorkoutFile, aiWorkout);

console.log('Done fixing BMI, Moments API, and AI Workout sharing');
