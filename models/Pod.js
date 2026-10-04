import mongoose from 'mongoose';

const PodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'Users' }, // lucide icon name
  image: { type: String, default: null }, // custom image or preset URL
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
  joinCode: { type: String, default: null }, // for private pods
  
  rules: { type: String, default: '' },
  podType: { type: String, enum: ['time_bound', 'goal_bound'], default: 'time_bound' },
  
  // Goal Engine
  goalType: { 
    type: String, 
    enum: ['volume_lifted', 'workouts_logged', 'streak_maintained', 'weight_loss'], 
    default: 'volume_lifted' 
  },
  goalTarget: { type: Number, default: 0 }, // e.g. 50000 volume, or 5 workouts
  
  // Reward Engine
  rewardPool: { type: Number, default: 0 }, // Total XP locked in this pod
  rewardType: { 
    type: String, 
    enum: ['winner_takes_all', 'top_three', 'pool_share', 'individual_milestone'], 
    default: 'pool_share' 
  },
  
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }},
  
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  winners: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    xpRewarded: { type: Number, default: 0 }
  }]
}, { timestamps: true });

// Force Mongoose to re-register the schema in Next.js dev environment
if (mongoose.models.Pod) {
  delete mongoose.models.Pod;
}

export default mongoose.model('Pod', PodSchema);
