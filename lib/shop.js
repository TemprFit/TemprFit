import { Sparkles, Crown, Zap, Shield, Image as ImageIcon, Paintbrush, Diamond } from 'lucide-react';

export const SHOP_ITEMS = [
  // Username Colors (Permanent)
  { id: 'color_neon_green', name: 'Neon Green', desc: 'Custom username color', type: 'color', value: '#22c55e', cost: 10, icon: Paintbrush, category: 'cosmetic' },
  { id: 'color_cyber_blue', name: 'Cyber Blue', desc: 'Custom username color', type: 'color', value: '#06b6d4', cost: 10, icon: Paintbrush, category: 'cosmetic' },
  { id: 'color_gold', name: 'Solid Gold', desc: 'Custom username color', type: 'color', value: '#fbbf24', cost: 750, icon: Paintbrush, category: 'cosmetic' },
  { id: 'color_neon_pink', name: 'Neon Pink', desc: 'Custom username color', type: 'color', value: '#ec4899', cost: 750, icon: Paintbrush, category: 'cosmetic' },
  { id: 'color_crimson', name: 'Crimson Red', desc: 'Custom username color', type: 'color', value: '#dc2626', cost: 1000, icon: Paintbrush, category: 'cosmetic' },
  { id: 'color_violet', name: 'Neon Violet', desc: 'Custom username color', type: 'color', value: '#8b5cf6', cost: 1000, icon: Paintbrush, category: 'cosmetic' },
  { id: 'color_cyber_yellow', name: 'Cyber Yellow', desc: 'Custom username color', type: 'color', value: '#eab308', cost: 1000, icon: Paintbrush, category: 'cosmetic' },
  { id: 'color_sunset', name: 'Sunset Orange', desc: 'Custom username color', type: 'color', value: '#f97316', cost: 1000, icon: Paintbrush, category: 'cosmetic' },

  // Avatar Borders (Permanent)
  { id: 'border_fire', name: 'Fire Aura', desc: 'Glowing animated avatar border', type: 'border', value: 'fire', cost: 200, icon: Sparkles, category: 'cosmetic' },
  { id: 'border_lightning', name: 'Lightning Ring', desc: 'Electric avatar border', type: 'border', value: 'lightning', cost: 1000, icon: Zap, category: 'cosmetic' },
  { id: 'border_gold', name: 'Gold Frame', desc: 'Premium gold border', type: 'border', value: 'gold', cost: 1500, icon: Crown, category: 'cosmetic' },
  { id: 'border_nebula', name: 'Cosmic Nebula', desc: 'Swirling purple galaxy effect', type: 'border', value: 'nebula', cost: 2000, icon: Sparkles, category: 'cosmetic' },
  { id: 'border_matrix', name: 'The Matrix', desc: 'Falling digital code effect', type: 'border', value: 'matrix', cost: 2200, icon: Sparkles, category: 'cosmetic' },
  { id: 'border_ocean', name: 'Ocean Waves', desc: 'Flowing blue water ripples', type: 'border', value: 'ocean', cost: 1800, icon: Sparkles, category: 'cosmetic' },
  { id: 'border_plasma', name: 'Plasma Arc', desc: 'Sizzling high-energy pink arc', type: 'border', value: 'plasma', cost: 2500, icon: Zap, category: 'cosmetic' },
  { id: 'border_sakura', name: 'Sakura Breeze', desc: 'Falling cherry blossom petals', type: 'border', value: 'sakura', cost: 2500, icon: Sparkles, category: 'cosmetic' },
  { id: 'border_glitch', name: 'Cyber Glitch', desc: 'Chaotic digital glitch effect', type: 'border', value: 'glitch', cost: 1500, icon: Sparkles, category: 'cosmetic' },
  { id: 'border_toxic', name: 'Toxic Slime', desc: 'Bubbling neon green acid', type: 'border', value: 'toxic', cost: 1200, icon: Sparkles, category: 'cosmetic' },
  { id: 'border_holy', name: 'Holy Light', desc: 'Angelic glowing aura', type: 'border', value: 'holy_light', cost: 3000, icon: Sparkles, category: 'cosmetic' },
  { id: 'border_shadow', name: 'Shadow Void', desc: 'Swirling dark smoke energy', type: 'border', value: 'shadow', cost: 3000, icon: Sparkles, category: 'cosmetic' },
  { id: 'border_neon_pulse', name: 'Neon Pulse', desc: 'Rhythmic heartbeat pulse ring', type: 'border', value: 'neon_pulse', cost: 800, icon: Sparkles, category: 'cosmetic' },

  // Consumables
  { id: 'streak_freeze', name: 'Streak Freeze', desc: 'Protects your streak for 1 missed day.', type: 'consumable', value: 'streak_freeze', cost: 800, icon: Shield, category: 'utility' },

  // Weekend Exclusive
  { id: 'border_diamond', name: 'Diamond Crown', desc: 'Weekend Exclusive! Glowing diamond border.', type: 'border', value: 'diamond', cost: 3000, icon: Crown, category: 'cosmetic', weekendOnly: true },

  // Premium Badges
  { id: 'vip_gold', name: 'VIP Gold Badge', desc: 'Show off your VIP Gold status on your profile.', type: 'badge', value: 'vip_gold', cost: 5000, icon: Crown, category: 'cosmetic' },
  { id: 'diamond_tier', name: 'Diamond Tier Badge', desc: 'Premium Diamond Status.', type: 'badge', value: 'diamond_tier', cost: 10000, icon: Diamond, category: 'cosmetic' },
  { id: 'rocket_fuel', name: 'Rocket Fuel Badge', desc: 'Boosted profile visibility.', type: 'badge', value: 'rocket_fuel', cost: 2500, icon: Zap, category: 'cosmetic' },

  // Subscriptions (Temporary Tiers)
  { id: 'sub_pro_7d', name: '1 Week PRO', desc: 'Unlock all PRO features for 1 week', type: 'subscription', value: 'pro', durationDays: 7, cost: 30000, icon: Shield, category: 'utility' },
  { id: 'sub_max_7d', name: '1 Week MAX', desc: 'Unlock MAX tier and unlimited AI coaching', type: 'subscription', value: 'max', durationDays: 7, cost: 50000, icon: Crown, category: 'utility' },
  { id: 'premium_ai_7d', name: '1 Week Premium AI', desc: 'Unlock premium AI workout builder for 1 week', type: 'utility', value: 'premium_ai', durationDays: 7, cost: 2500, icon: Zap, category: 'utility' },
];
