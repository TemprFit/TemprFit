import { 
  Star, Flame, Shield, Medal, Award, Zap, Trophy, Heart, Activity, 
  Dumbbell, Target, Sun, Moon, Coffee, Battery, Anchor, Bird, 
  Crown, Diamond, Droplet, Feather, Key, Lightning, Mountain, 
  Rocket, Compass, Map, Gift, Music, Bell, Apple, Salad
} from 'lucide-react';

export const BADGES = [
  // Progression Badges
  { id: 'first_step', name: 'First Step', desc: 'Complete 1 workout', icon: Star, color: '#fbbf24', rewardXP: 100, criteria: { type: 'sessions', value: 1 } },
  { id: 'consistent', name: 'Consistent', desc: 'Complete 10 workouts', icon: Medal, color: '#94a3b8', rewardXP: 300, criteria: { type: 'sessions', value: 10 } },
  { id: 'dedicated', name: 'Dedicated', desc: 'Complete 50 workouts', icon: Award, color: '#fbbf24', rewardXP: 500, criteria: { type: 'sessions', value: 50 } },
  { id: 'obsessed', name: 'Obsessed', desc: 'Complete 100 workouts', icon: Crown, color: '#a855f7', rewardXP: 1000, criteria: { type: 'sessions', value: 100 } },
  { id: 'legendary', name: 'Legendary', desc: 'Complete 500 workouts', icon: Diamond, color: '#06b6d4', rewardXP: 5000, criteria: { type: 'sessions', value: 500 } },

  // Streak Badges
  { id: 'on_fire', name: 'On Fire', desc: 'Reach a 3-day streak', icon: Flame, color: '#ef4444', rewardXP: 200, criteria: { type: 'streak', value: 3 } },
  { id: 'unstoppable', name: 'Unstoppable', desc: 'Reach a 7-day streak', icon: Zap, color: '#f97316', rewardXP: 400, criteria: { type: 'streak', value: 7 } },
  { id: 'machine', name: 'Machine', desc: 'Reach a 30-day streak', icon: Battery, color: '#22c55e', rewardXP: 1500, criteria: { type: 'streak', value: 30 } },

  // Volume Badges
  { id: 'heavy_lifter', name: 'Heavy Lifter', desc: 'Lift 10,000kg total', icon: Shield, color: '#64748b', rewardXP: 300, criteria: { type: 'volume', value: 10000 } },
  { id: 'titan', name: 'Titan', desc: 'Lift 50,000kg total', icon: Anchor, color: '#3b82f6', rewardXP: 800, criteria: { type: 'volume', value: 50000 } },
  { id: 'atlas', name: 'Atlas', desc: 'Lift 100,000kg total', icon: Mountain, color: '#a855f7', rewardXP: 2000, criteria: { type: 'volume', value: 100000 } },

  // Feature Badges
  { id: 'ai_pioneer', name: 'AI Pioneer', desc: 'Use the AI Coach 3x', icon: Zap, color: '#3b82f6', rewardXP: 50, criteria: { type: 'ai_usage', value: 3 } },

  // Time & Specialized
  { id: 'early_bird', name: 'Early Bird', desc: 'Workout before 7 AM', icon: Sun, color: '#fcd34d', rewardXP: 200 },
  { id: 'night_owl', name: 'Night Owl', desc: 'Workout after 9 PM', icon: Moon, color: '#818cf8', rewardXP: 200 },
  { id: 'caffeinated', name: 'Caffeinated', desc: 'Log a pre-workout', icon: Coffee, color: '#b45309', rewardXP: 150 },
  { id: 'sweat_equity', name: 'Sweat Equity', desc: 'Workout for 2+ hours', icon: Droplet, color: '#0ea5e9', rewardXP: 400 },

  // Social & Community
  { id: 'social_butterfly', name: 'Social Butterfly', desc: 'Share a workout to Moments', icon: Bird, color: '#ec4899', rewardXP: 200 },
  { id: 'cheerleader', name: 'Cheerleader', desc: 'Like 50 Moments', icon: Heart, color: '#f43f5e', rewardXP: 250 },
  { id: 'pod_member', name: 'Pod Member', desc: 'Join a Training Pod', icon: Activity, color: '#10b981', rewardXP: 150 },
  
  // Custom Status Badges (Bought in Shop, but we can list them here as badges if unlocked)
  { id: 'vip_gold', name: 'VIP Gold', desc: 'Exclusive Gold Status', icon: Crown, color: '#fbbf24', isPremium: true },
  { id: 'diamond_tier', name: 'Diamond Tier', desc: 'Premium Diamond Status', icon: Diamond, color: '#38bdf8', isPremium: true },
  { id: 'rocket_fuel', name: 'Rocket Fuel', desc: 'Boosted profile visibility', icon: Rocket, color: '#f43f5e', isPremium: true },

  // Gamification 2.0 Expansion Badges
  { id: 'nutrition_novice', name: 'Nutrition Novice', desc: 'Log 10 meals', icon: Apple, color: '#10b981', rewardXP: 100 },
  { id: 'nutrition_pro', name: 'Nutrition Pro', desc: 'Log 50 meals', icon: Salad, color: '#059669', rewardXP: 400 },
  { id: 'social_star', name: 'Social Star', desc: 'Receive 100 likes on Moments', icon: Heart, color: '#f43f5e', rewardXP: 500 },
  { id: 'form_master', name: 'Form Master', desc: 'Use AI Form Check 5 times', icon: Target, color: '#6366f1', rewardXP: 250 },
  { id: 'marketplace_buyer', name: 'Marketplace Buyer', desc: 'Purchase a Marketplace item', icon: Gift, color: '#d946ef', rewardXP: 300 },
  { id: 'program_completer', name: 'Program Completer', desc: 'Finish an entire training program', icon: Compass, color: '#eab308', rewardXP: 1000 },
  { id: 'century_streak', name: 'Century Streak', desc: 'Reach a 100-day streak', icon: Flame, color: '#b91c1c', rewardXP: 5000 },
  { id: 'early_adopter', name: 'Early Adopter', desc: 'Joined during the platform\'s first year', icon: Key, color: '#fcd34d', rewardXP: 1000 }
];
