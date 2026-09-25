import {
  LayoutDashboard, BarChart3, LineChart, Users, MessageSquare,
  Apple, Dumbbell, BookOpen, Sparkles, DollarSign, Settings, LogOut,
  Salad, ScanFace, Heart, CalendarDays, Star, TrendingUp, Megaphone, Wallet, Shield, Trophy, Store, History
} from 'lucide-react';

export const traineeCategories = [
  {
    title: 'Core',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/favorites', label: 'Favorites', icon: Heart },
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  },
  {
    title: 'Training & AI',
    links: [
      { href: '/workouts', label: 'My Workouts', icon: Dumbbell },
      { href: '/coach', label: 'AI Coach', icon: Sparkles },
      { href: '/form-check', label: 'Form Check', icon: ScanFace },
      { href: '/transformation', label: 'Transformation', icon: Sparkles },
    ]
  },
  {
    title: 'Health & Nutrition',
    links: [
      { href: '/tracker', label: 'BMI and Health Tracker', icon: BarChart3 },
      { href: '/health/calculator', label: 'BMI Calc', icon: BarChart3 },
      { href: '/nutrition', label: 'Diet Plans & Nutrition', icon: Salad },
    ]
  },
  {
    title: 'Community',
    links: [
      { href: '/trainers', label: 'Trainers', icon: Users },
      { href: '/moments', label: 'Moments', icon: Sparkles },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/pods', label: 'Training Pods', icon: Users },
      { href: '/badges', label: 'Shop & Rewards', icon: Store },
      { href: '/shop/marketplace', label: 'Marketplace', icon: Store },
    ]
  },
  {
    title: 'Insights',
    links: [
      { href: '/history', label: 'History', icon: History },
      { href: '/progress', label: 'Progress', icon: LineChart },
      { href: '/notes', label: 'Notes', icon: BookOpen },
    ]
  }
];

export const trainerCategories = [
  {
    title: 'Workspace',
    links: [
      { href: '/trainer-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/trainer-dashboard/schedule', label: 'Schedule', icon: CalendarDays },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ]
  },
  {
    title: 'Clients & Programs',
    links: [
      { href: '/trainer-dashboard/clients', label: 'My Clients', icon: Users },
      { href: '/trainer-dashboard/programs', label: 'My Programs', icon: Dumbbell },
    ]
  },
  {
    title: 'Business & Analytics',
    links: [
      { href: '/trainer-dashboard/earnings', label: 'Escrow & Earnings', icon: Wallet },
      { href: '/trainer-dashboard/analytics', label: 'Analytics', icon: TrendingUp },
      { href: '/trainer-dashboard/reviews', label: 'Reviews', icon: Star },
    ]
  },
  {
    title: 'Growth',
    links: [
      { href: '/upgrade', label: 'Boost Profile', icon: Megaphone },
    ]
  }
];
