'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Bell, Sun, Moon, ChevronDown, Menu, X, User,
  Settings, LogOut, Compass, BrainCircuit, LineChart, Users,
  Dumbbell, History, Activity, Sparkles, LayoutDashboard,
  Apple, Salad, BookOpen, Loader2, MessageCircle, Calendar, CreditCard,
  ChevronRight, ArrowRight, Zap, Heart, Briefcase
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { displayName } from '@/lib/utils';
import BackButton from '@/components/BackButton';
import UserAvatar from '@/components/UserAvatar';
import styles from './Navbar.module.css';

import { traineeCategories, trainerCategories } from '@/lib/navConfig';

const APP_PAGES = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Workouts', url: '/workouts', icon: Dumbbell },
  { title: 'Generate Workout', url: '/workouts/generate', icon: Sparkles },
  { title: 'Progress Tracker', url: '/progress', icon: LineChart },
  { title: 'Bodyweight & Diet Tracker', url: '/tracker', icon: Activity },
  { title: 'BMI & Health Calculator', url: '/health/calculator', icon: Activity },
  { title: 'Nutrition & Diet Plans', url: '/nutrition', icon: Apple },
  { title: 'AI Coach', url: '/coach', icon: BrainCircuit },
  { title: 'Form Check', url: '/form-check', icon: Activity },
  { title: 'Transformation Journey', url: '/transformation', icon: Sparkles },
  { title: 'Trainers', url: '/trainers', icon: Users },
  { title: 'Moments', url: '/moments', icon: Users },
  { title: 'Notes', url: '/notes', icon: BookOpen },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [activeMode, setActiveMode] = useState('trainee');

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ pages: [], exercises: [] });
  const searchTimeoutRef = useRef(null);
  const navRef = useRef(null);
  
  const [openCategory, setOpenCategory] = useState('');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setNotifOpen(false);
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'forum': return <Users size={16} className={styles.iconForum} />;
      case 'social': return <Heart size={16} className={styles.iconForum} />;
      case 'message': return <MessageCircle size={16} className={styles.iconMessage} />;
      case 'appointment': return <Calendar size={16} className={styles.iconAppt} />;
      case 'system': return <Activity size={16} className={styles.iconSystem} />;
      case 'subscription': return <CreditCard size={16} className={styles.iconSub} />;
      case 'plan': return <Apple size={16} className={styles.iconPlan} />;
      default: return <Bell size={16} className={styles.iconGen} />;
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  const loadSession = () => {
    setActiveMode(localStorage.getItem('activeMode') || 'trainee');
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        if (data.user) fetchNotifications();
      })
      .catch(() => setUser(null))
      .finally(() => setCheckedAuth(true));
  };

  useEffect(loadSession, [pathname]);

  const markNotificationsRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    await fetch('/api/notifications', { method: 'PUT' });
  };

  const toggleNotif = () => {
    const newState = !notifOpen;
    setNotifOpen(newState);
    setUserMenuOpen(false);
    setSearchOpen(false);
    if (newState) markNotificationsRead();
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (!query.trim()) {
      setSearchResults({ pages: [], exercises: [] });
      setIsSearching(false);
      return;
    }

    // Filter pages instantly
    const matchedPages = APP_PAGES.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 4);
    setSearchResults(prev => ({ ...prev, pages: matchedPages }));
    
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/exercises?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(prev => ({ ...prev, exercises: (data.items || []).slice(0, 4) }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    window.location.href = '/';
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

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin');
  if (isAuthPage) return null;

  return (
    <nav ref={navRef} className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className="container">
        <div className={styles.navInner}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {pathname !== '/' && pathname !== '/dashboard' && pathname !== '/trainer-dashboard' && (
              <BackButton className={styles.navbarBackBtn} />
            )}
            <Link href="/" className={styles.logo}>
              <Image src="/images/brand/my-logo.png" alt="TemprFit" width={32} height={32} className={styles.logoMark} priority />
              <span className={styles.logoText}>TemprFit</span>
            </Link>
          </div>

          <div className={styles.desktopNav}>
            {user?.role === 'trainer' && activeMode === 'trainer' ? (
              <>
                <Link href="/trainer-dashboard" className={`${styles.navLink} ${pathname === '/trainer-dashboard' ? styles.active : ''}`}>Dashboard</Link>
                <Link href="/trainer-dashboard/clients" className={`${styles.navLink} ${pathname.startsWith('/trainer-dashboard/clients') ? styles.active : ''}`}>My Clients</Link>
                <Link href="/trainer-dashboard/programs" className={`${styles.navLink} ${pathname.startsWith('/trainer-dashboard/programs') ? styles.active : ''}`}>Programs</Link>
                <Link href="/trainer-dashboard/schedule" className={`${styles.navLink} ${pathname.startsWith('/trainer-dashboard/schedule') ? styles.active : ''}`}>Schedule</Link>
              </>
            ) : (
              <>
                <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>Home</Link>
                <Link href="/explore" className={`${styles.navLink} ${pathname.startsWith('/explore') ? styles.active : ''}`}>Exercise Library</Link>
                <Link href="/workouts" className={`${styles.navLink} ${pathname.startsWith('/workouts') ? styles.active : ''}`}>My Workouts</Link>
                <Link href="/coach" className={`${styles.navLink} ${pathname.startsWith('/coach') ? styles.active : ''}`}>My AI Coach</Link>
                <Link href="/moments" className={`${styles.navLink} ${pathname.startsWith('/moments') ? styles.active : ''}`}>Moments</Link>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={styles.desktopActions}>
            <div className={styles.searchWrapper}>
              <button 
                className={styles.searchBarBtn} 
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setUserMenuOpen(false);
                  setNotifOpen(false);
                }}
              >
                <Search size={16} className={styles.searchBarIcon} />
                <span className={styles.searchBarText}>Search...</span>
                <span className={styles.searchBarKbd}>⌘K</span>
              </button>
              
              {searchOpen && (
                <div className={styles.omniDropdown}>
                  <div className={styles.omniInputWrap}>
                    <Search size={18} className={styles.omniIcon} />
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Search pages, exercises..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className={styles.omniInput}
                    />
                    {isSearching && <Loader2 size={16} className={styles.spin} />}
                  </div>
                  
                  {(searchQuery.trim() !== '') && (
                    <div className={styles.omniResults}>
                      {searchResults.pages.length > 0 && (
                        <div className={styles.omniSection}>
                          <span className={styles.omniSectionTitle}>Pages & Features</span>
                          {searchResults.pages.map(p => (
                            <Link key={p.url} href={p.url} className={styles.omniResultItem} onClick={() => setSearchOpen(false)}>
                              <p.icon size={16} /> {p.title}
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.exercises.length > 0 && (
                        <div className={styles.omniSection}>
                          <span className={styles.omniSectionTitle}>Exercises</span>
                          {searchResults.exercises.map(ex => (
                            <Link key={ex.slug} href={`/explore/${ex.slug}`} className={styles.omniResultItem} onClick={() => setSearchOpen(false)}>
                              <Dumbbell size={16} /> {ex.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.pages.length === 0 && searchResults.exercises.length === 0 && !isSearching && (
                        <div className={styles.omniEmpty}>No results found.</div>
                      )}
                      <Link href={`/explore?q=${encodeURIComponent(searchQuery)}`} className={styles.omniSeeAll} onClick={() => setSearchOpen(false)}>
                        See all results for &quot;{searchQuery}&quot; <Compass size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme" data-theme-state={theme}>
              <Sun size={14} className={styles.themeIconSun} />
              <Moon size={14} className={styles.themeIconMoon} />
              <span className={styles.themeKnob} />
            </button>

            <div className={styles.notifWrapper}>
              <button className={styles.iconBtn} aria-label="Notifications" onClick={toggleNotif}>
                <Bell size={18} />
                {unreadCount > 0 && <span className={styles.notifDot} />}
              </button>
              {notifOpen && (
                <div className={styles.premiumNotifDropdown}>
                  <div className={styles.notifHeader}>
                    <h4>Notifications</h4>
                    {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount} New</span>}
                  </div>
                  <div className={styles.notifBody}>
                    {notifications.length === 0 ? (
                      <div className={styles.emptyNotifs}>
                        <Bell size={32} className={styles.emptyBell} />
                        <p>You're all caught up!</p>
                      </div>
                    ) : (
                      <div className={styles.notifList}>
                        {notifications.map(n => {
                          // Simple relative time
                          const diff = Math.floor((new Date() - new Date(n.createdAt)) / 1000);
                          let timeStr = 'just now';
                          if (diff > 86400) timeStr = Math.floor(diff / 86400) + 'd ago';
                          else if (diff > 3600) timeStr = Math.floor(diff / 3600) + 'h ago';
                          else if (diff > 60) timeStr = Math.floor(diff / 60) + 'm ago';

                          return (
                            <div 
                              key={n._id} 
                              className={`${styles.notifItem} ${n.read ? styles.read : ''}`}
                              onClick={() => setSelectedNotif(n)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className={styles.notifIconWrap}>
                                {getNotifIcon(n.type)}
                              </div>
                              <div className={styles.notifContent}>
                                <strong>{n.title} {!n.read && <span className={styles.unreadDot} />}</strong>
                                <p>{n.message}</p>
                                <span className={styles.notifTime}>{timeStr}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.userMenu}>
              {!checkedAuth ? (
                <span className={styles.authSkeleton} />
              ) : user ? (
                <>
                  <button className={styles.userBtn} onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); setSearchOpen(false); }}>
                    <UserAvatar user={user} size="sm" />
                    <span className={styles.userName}>{displayName(user).split(' ')[0] || 'Account'}</span>
                    <ChevronDown size={14} />
                  </button>
                  {userMenuOpen && (
                    <div className={styles.dropdown}>
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}><User size={14} /> Dashboard</Link>
                      <Link href="/workouts" onClick={() => setUserMenuOpen(false)}><Dumbbell size={14} /> My Workouts</Link>
                      <Link href="/history" onClick={() => setUserMenuOpen(false)}><History size={14} /> History</Link>
                      <Link href="/progress" onClick={() => setUserMenuOpen(false)}><LineChart size={14} /> Progress</Link>
                      <Link href="/escrow" onClick={() => setUserMenuOpen(false)}><Briefcase size={14} /> My Bookings</Link>
                      <Link href="/settings" onClick={() => setUserMenuOpen(false)}><Settings size={14} /> Settings</Link>
                      <hr />
                      <button className={styles.logoutBtn} onClick={handleLogout}><LogOut size={14} /> Sign Out</button>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.authButtons}>
                  <Link href="/login" className={styles.signInBtn}>Sign In</Link>
                  <Link href="/register" className={styles.signUpBtn}>Get Started</Link>
                </div>
              )}
            </div>
            </div>
            <button className={styles.mobileToggle} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <>
          <div className={styles.mobileMenuOverlay} onClick={() => setMenuOpen(false)} />
          <div className={styles.mobileMenu}>
            <div className={styles.mobileSectionTitle}>Navigation</div>
            <Link href="/" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Home</Link>
            
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {(user.role === 'trainer' || user.originalRole === 'trainer' || user.trainerInfo?.isApproved) && (
                  <div className={styles.mobileModeToggleContainer}>
                    <span className={styles.mobileModeLabel}>{activeMode === 'trainer' ? 'Trainer Mode' : 'Trainee Mode'}</span>
                    <div 
                      className={`${styles.mobileToggleSwitch} ${activeMode === 'trainer' ? styles.mobileToggleOn : ''}`}
                      onClick={() => {
                        handleModeToggle();
                        setMenuOpen(false);
                      }}
                    >
                      <div className={styles.mobileToggleKnob}>
                        {activeMode === 'trainer' ? <Dumbbell size={10} color="#000" /> : <Users size={10} color="#000" />}
                      </div>
                    </div>
                  </div>
                )}
                
                {(user.role === 'trainer' && activeMode === 'trainer' ? trainerCategories : traineeCategories).map(cat => (
                  <div key={cat.title} className={styles.mobileCategoryGroup}>
                    <button 
                      className={styles.mobileCategoryHeader}
                      onClick={() => setOpenCategory(openCategory === cat.title ? '' : cat.title)}
                    >
                      <span className={styles.mobileCategoryTitle}>{cat.title}</span>
                      {openCategory === cat.title ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {openCategory === cat.title && (
                      <div className={styles.mobileCategoryLinks}>
                        {cat.links.map(link => (
                          <Link 
                            key={link.href} 
                            href={link.href} 
                            className={`${styles.mobileLink} ${pathname === link.href ? styles.activeMobileLink : ''}`} 
                            onClick={() => setMenuOpen(false)}
                          >
                            <link.icon size={16} style={{ display: 'inline', marginRight: '8px' }} /> {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <hr className={styles.mobileDivider} />
                
                {user.role !== 'trainer' && (
                  <>
                    <Link href="/upgrade" className={`${styles.mobileLink} ${styles.mobileUpgradeBtn}`} onClick={() => setMenuOpen(false)}>
                      <Zap size={16} style={{ display: 'inline', marginRight: '8px' }} /> Upgrade Plan
                    </Link>
                    <Link href="/become-trainer" className={`${styles.mobileLink}`} style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }} onClick={() => setMenuOpen(false)}>
                      <Dumbbell size={16} style={{ display: 'inline', marginRight: '8px' }} /> Become a Trainer
                    </Link>
                  </>
                )}
                <button className={styles.mobileAuth} onClick={handleLogout}>Sign Out ({displayName(user).split(' ')[0]})</button>
              </div>
            ) : (
            <>
              <Link href="/register" className={styles.mobileDashboard} onClick={() => setMenuOpen(false)}>Get Started</Link>
              <Link href="/login" className={styles.mobileAuth} onClick={() => setMenuOpen(false)}>Sign In</Link>
            </>
          )}
        </div>
        </>
      )}

      {selectedNotif && (
        <div className={styles.modalOverlay} onClick={() => setSelectedNotif(null)}>
          <div className={styles.notifModal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setSelectedNotif(null)}><X size={20} /></button>
            <div className={styles.notifModalHeader}>
              <div className={styles.notifModalIcon}>
                {getNotifIcon(selectedNotif.type)}
              </div>
              <h3>{selectedNotif.title}</h3>
            </div>
            <div className={styles.notifModalBody}>
              <p>{selectedNotif.message}</p>
              {selectedNotif.link && (
                <Link href={selectedNotif.link} className={styles.notifModalLink} onClick={() => setSelectedNotif(null)}>
                  View Details <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <div className={styles.notifModalFooter}>
              <span>{new Date(selectedNotif.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
