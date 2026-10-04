const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users.`);
    for(let i = 0; i < Math.min(5, users.length); i++) {
        console.log(`User: ${users[i].username}, XP: ${users[i].xp}, Prefs: ${JSON.stringify(users[i].appPreferences)}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
