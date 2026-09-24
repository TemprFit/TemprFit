'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, LineChart, Users, MessageSquare,
  Apple, Dumbbell, BookOpen, Sparkles, DollarSign, Settings, LogOut,
  Salad, ScanFace, Heart, CalendarDays, Star, TrendingUp, Megaphone, Wallet, Shield, ChevronDown, ChevronRight, Zap, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { displayName } from '@/lib/utils';
import UserAvatar from '@/components/UserAvatar';
import styles from './Sidebar.module.css';

import { traineeCategories, trainerCategories } from '@/lib/navConfig';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openCategory, setOpenCategory] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMode, setActiveMode] = useState('trainee');

  useEffect(() => {
    // Check local storage for collapse preference
    const storedCollapse = localStorage.getItem('sidebarCollapsed');
    if (storedCollapse === 'true') setIsCollapsed(true);
    
    // Check active mode preference
    const storedMode = localStorage.getItem('activeMode');
    if (storedMode) setActiveMode(storedMode);

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if ((data.user.role === 'trainer' || data.user.originalRole === 'trainer') && !storedMode) {
            // Default to trainer mode if they are an approved trainer
            if (data.user.trainerInfo?.isApproved) {
              setActiveMode('trainer');
            }
          }
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('sidebarCollapsed', newVal.toString());
  };

  const handleModeToggle = () => {
    if (!user || (!user.trainerInfo?.isApproved && user.role !== 'trainer' && user.originalRole !== 'trainer')) return;

    if (activeMode === 'trainee') {
      if (!user.trainerInfo?.isApproved) {
        window.appAlert('Your trainer profile is pending admin approval. You cannot access the trainer dashboard yet.');
        return;
      }
      setActiveMode('trainer');
      localStorage.setItem('activeMode', 'trainer');
      router.push('/trainer-dashboard');
    } else {
      setActiveMode('trainee');
      localStorage.setItem('activeMode', 'trainee');
      router.push('/dashboard');
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('activeMode');
      router.push('/login');
      router.refresh();
    }
  };

  const isTrainer = user?.role === 'trainer' || user?.originalRole === 'trainer' || user?.trainerInfo?.isApproved;
  const showTrainerMenu = isTrainer && activeMode === 'trainer' && user?.trainerInfo?.isApproved;
  const categories = showTrainerMenu ? trainerCategories : traineeCategories;

  useEffect(() => {
    if (!categories) return;
    const activeCat = categories.find(cat => cat.links.some(link => pathname === link.href || (link.href !== '/dashboard' && link.href !== '/trainer-dashboard' && pathname.startsWith(link.href))));
    if (activeCat && !openCategory) setOpenCategory(activeCat.title);
  }, [pathname, categories]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.collapseToggle} onClick={toggleCollapse}>
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </div>

      {user && (
        <Link href="/settings" className={styles.profile}>
          <UserAvatar user={user} size="md" />
          <div className={styles.profileInfo}>
            <span className={styles.profileName} style={{ color: user.activeColor || 'inherit' }}>{displayName(user)}</span>
            <Link href="/upgrade" onClick={(e) => e.stopPropagation()}>
              <span className={styles.profilePlan} style={{ cursor: 'pointer' }}>
                {isTrainer ? 'Trainer' : (user.plan || 'free') + ' plan'}
              </span>
            </Link>
          </div>
        </Link>
      )}

      {isTrainer && (
        <div className={styles.modeToggleContainer}>
          <span className={styles.modeLabel}>{activeMode === 'trainer' ? 'Trainer Mode' : 'Trainee Mode'}</span>
          <div 
            className={`${styles.toggleSwitch} ${activeMode === 'trainer' ? styles.toggleOn : ''}`}
            onClick={handleModeToggle}
            title={activeMode === 'trainer' ? 'Switch to Trainee' : 'Switch to Trainer'}
          >
            <div className={styles.toggleKnob}>
              {activeMode === 'trainer' ? <Dumbbell size={10} color="#000" /> : <Users size={10} color="#000" />}
            </div>
          </div>
        </div>
      )}

      <div className={styles.menu}>
        {categories.map(category => (
          <div key={category.title} className={styles.categoryGroup}>
            <button 
              className={styles.categoryHeader} 
              onClick={() => setOpenCategory(openCategory === category.title ? '' : category.title)}
            >
              <span className={styles.categoryTitle}>{category.title}</span>
              {openCategory === category.title ? <ChevronDown size={14} className={styles.catIcon} /> : <ChevronRight size={14} className={styles.catIcon} />}
            </button>
            
            <div className={`${styles.categoryLinks} ${openCategory === category.title ? styles.open : ''}`}>
              {category.links.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/trainer-dashboard' && item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.bottom}>
        {!isTrainer && (
          <>
            <Link href="/upgrade" className={`${styles.menuItem} ${styles.upgradeBtn}`} title={isCollapsed ? 'Upgrade Plan' : ''}>
              <Zap size={20} />
              <span>Upgrade Plan</span>
            </Link>
            <Link href="/become-trainer" className={`${styles.menuItem}`} style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }} title={isCollapsed ? 'Become a Trainer' : ''}>
              <Dumbbell size={20} />
              <span>Become Trainer</span>
            </Link>
          </>
        )}
        {user?.role === 'admin' && (
          <Link href="/admin" className={styles.menuItem} style={{ color: '#ef4444' }} title={isCollapsed ? 'Admin Portal' : ''}>
            <Shield size={20} />
            <span>Admin Portal</span>
          </Link>
        )}
        <Link href="/support" className={`${styles.menuItem} ${pathname === '/support' ? styles.active : ''}`} title={isCollapsed ? 'Support & Complaints' : ''}>
          <MessageSquare size={20} />
          <span>Support & Complaints</span>
        </Link>
        <Link href="/settings" className={`${styles.menuItem} ${pathname === '/settings' ? styles.active : ''}`} title={isCollapsed ? 'Settings' : ''}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <button className={styles.logout} onClick={handleLogout} disabled={loggingOut} title={isCollapsed ? 'Sign Out' : ''}>
          <LogOut size={20} />
          <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
}
