const fs = require('fs');
const file = 'app/api/pods/route.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `    const body = await req.json();
    const { name, description, icon, customImage, challenge, image, rewardXP, rewardType } = body;
    if (!name || !description || !icon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPod = await Pod.create({
      name,
      description,
      icon,
      members: [user._id] // creator automatically joins
    });`,
  `    const body = await req.json();
    const { name, description, icon, image, podType, rules, rewardXP, rewardType } = body;
    if (!name || !description || !icon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const xpToDeduct = parseInt(rewardXP) || 0;
    
    // Check if user has enough XP
    const dbUser = await import('@/models/User').then(m => m.default.findById(user._id));
    if (xpToDeduct > 0) {
      if (dbUser.xp < xpToDeduct) {
        return NextResponse.json({ error: 'Not enough XP to create this pod reward pool.' }, { status: 400 });
      }
      // Deduct XP
      dbUser.xp -= xpToDeduct;
      await dbUser.save();
    }

    const newPod = await Pod.create({
      name,
      description,
      icon,
      customImage: image || null,
      podType: podType || 'standard',
      rules: rules || '',
      members: [user._id], // creator automatically joins
      challenge: {
        targetVolume: 50000,
        currentVolume: 0,
        rewardXP: xpToDeduct,
        rewardType: rewardType || 'multiple_winners',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });`
);

content = content.replace(
  `    const mapped = pods.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      customImage: p.customImage,
      icon: p.icon,
      challenge: p.challenge,
      members: p.members.length,
      joined: p.members.some(id => id.toString() === user._id.toString())
    }));`,
  `    const mapped = pods.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      customImage: p.customImage,
      icon: p.icon,
      podType: p.podType,
      rules: p.rules,
      challenge: p.challenge,
      members: p.members.length,
      joined: p.members.some(id => id.toString() === user._id.toString())
    }));`
);

fs.writeFileSync(file, content);
console.log('API fixed');
