'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, ShieldCheck, Users, Tag, Dumbbell, 
  MessageSquare, Settings, LogOut, Megaphone, Sun, Moon
} from 'lucide-react';
import Image from 'next/image';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [counters, setCounters] = useState({ trainers: 0, users: 0, bookings: 0 });
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => {
    fetch('/api/admin/sidebar-counters')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCounters(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    window.location.href = '/admin/login';
  };

  const menuItems = [
    { href: '/admin', label: 'Overview', icon: Activity, exact: true },
    { href: '/admin/trainers', label: 'Trainers', icon: ShieldCheck, exact: false, count: counters.trainers },
    { href: '/admin/users', label: 'Users', icon: Users, exact: false, count: counters.users },
    { href: '/admin/notifications', label: 'Broadcasts', icon: Megaphone, exact: false },
    { href: '/admin/complaints', label: 'Complaints', icon: MessageSquare, exact: false },
    { href: '/admin/coupons', label: 'Coupons', icon: Tag, exact: false },
    { href: '/admin/exercises', label: 'Exercises', icon: Dumbbell, exact: false },
    { href: '/admin/moderation', label: 'Moderation', icon: ShieldCheck, exact: false },
    { href: '/admin/bookings', label: 'Bookings', icon: Activity, exact: false, count: counters.bookings },
  ];

  return (
    <aside className={styles.sidebar}>
      <Link href="/admin" className={styles.logo}>
        <Image src="/images/brand/my-logo.png" alt="TemprFit" width={32} height={32} priority />
        <span className={styles.logoText}>TemprFit</span>
        <span className={styles.logoAdmin}>Admin</span>
      </Link>

      <div className={styles.menu}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          
          return (
            <Link key={item.href} href={item.href} className={`${styles.menuItem} ${isActive ? styles.active : ''}`}>
              <Icon size={20} />
              <span>{item.label}</span>
              {item.count > 0 && <span className={styles.badge}>{item.count}</span>}
            </Link>
          );
        })}
      </div>

      <div className={styles.bottom}>
        <button onClick={toggleTheme} className={styles.menuItem} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--color-text)' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <Link href="/admin/settings" className={`${styles.menuItem} ${pathname.startsWith('/admin/settings') ? styles.active : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <button onClick={handleLogout} className={styles.menuItem} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: '#ef4444' }}>
          <LogOut size={20} />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}
