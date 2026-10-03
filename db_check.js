const mongoose = require('mongoose');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const mongoUri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).split('=')[1];

async function check() {
  await mongoose.connect(mongoUri.trim());
  
  // Use generic mongoose connection to check users
  const db = mongoose.connection;
  const users = await db.collection('users').find({}).toArray();
  console.log(`Found ${users.length} users in DB.`);
  for (const u of users) {
    console.log(`User: ${u.username}, xp: ${u.xp}, id: ${u._id}`);
  }
  process.exit();
}
check();
