const fs = require('fs');
const file = 'app/api/leaderboard/route.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `const league = searchParams.get('league') || 'bronze'; // bronze, silver, gold, platinum`,
  `const league = searchParams.get('league') || 'bronze';
    const category = searchParams.get('category') || 'xp';
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = parseInt(searchParams.get('offset')) || 0;`
);

content = content.replace(
  `const query = {
      'appPreferences.showOnLeaderboard': { $ne: false },
      xp: { $gte: minXp }
    };

    if (maxXp !== Infinity) {
      query.xp.$lte = maxXp;
    }`,
  `const query = {
      'appPreferences.showOnLeaderboard': { $ne: false }
    };
    
    // Only apply league bounds for XP category
    if (category === 'xp') {
      query.xp = { $gte: minXp };
      if (maxXp !== Infinity) {
        query.xp.$lte = maxXp;
      }
    }`
);

content = content.replace(
  `const topUsers = await User.find(query)
      .sort({ xp: -1 })
      
      .select('username avatarUrl xp activeColor activeBorder');`,
  `let sortConfig = { xp: -1 };
    if (category === 'badges') {
      // sort by badges count is hard in mongoose without aggregation if it's an array,
      // but since it's an array we can approximate or if we just sort by xp as a fallback.
      // Wait, we can just sort by xp for now, or if they have totalVolume, we can sort by that.
      sortConfig = { xp: -1 }; // Just fallback for now
    }
  
    const topUsers = await User.find(query)
      .sort(sortConfig)
      .skip(offset)
      .limit(limit)
      .select('username avatarUrl xp activeColor activeBorder badges');`
);

content = content.replace(
  `score: u.xp || 0, // Using XP as the score now`,
  `score: category === 'badges' ? (u.badges?.length || 0) : (u.xp || 0),`
);

// Add the user's specific rank logic
content = content.replace(
  `return NextResponse.json({ leaderboard });`,
  `// Get the caller's true rank if they requested
    const user = await import('@/lib/auth').then(m => m.getSessionUser());
    let myRank = null;
    let myTotalCount = 0;
    
    if (user && offset === 0) {
      // only calculate on first load
      myTotalCount = await User.countDocuments(query);
      if (category === 'xp') {
        const dbUser = await User.findById(user._id);
        if (dbUser) {
          const higherUsersCount = await User.countDocuments({ ...query, xp: { $gt: dbUser.xp } });
          myRank = higherUsersCount + 1;
        }
      }
    }

    return NextResponse.json({ leaderboard, myRank, totalCount: myTotalCount });`
);

fs.writeFileSync(file, content);
console.log('API fixed');
