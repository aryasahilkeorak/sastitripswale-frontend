import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useTheme } from '../store/theme.js';
import { useNotifStore } from '../store/notifications.js';
import { api } from '../lib/api.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import { enablePushNotifications, pushPermissionState } from '../lib/push.js';
import { useT } from '../i18n/index.js';
import BrandLogo from './BrandLogo.jsx';

const LINKS = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/trips', key: 'nav.trips' },
  { to: '/clubs', key: 'nav.clubs', matchExtra: ['/plan-club'] },
  { to: '/members', key: 'nav.members' },
  { to: '/gallery', key: 'nav.gallery' },
  { to: '/how-it-works', key: 'nav.howItWorks' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
];

const MOBILE_LINKS = [
  { to: '/', key: 'nav.home', icon: 'fa-solid fa-house' },
  { to: '/trips', key: 'nav.trips', icon: 'fa-solid fa-compass' },
  { to: '/clubs', key: 'nav.clubs', icon: 'fa-solid fa-people-group', matchExtra: ['/plan-club'] },
  { to: '/members', key: 'nav.members', icon: 'fa-solid fa-users' },
  { to: '/gallery', key: 'nav.gallery', icon: 'fa-regular fa-image' },
  { to: '/completed-trips', key: 'nav.completedTrips', icon: 'fa-solid fa-trophy' },
  { to: '/how-it-works', key: 'nav.howItWorks', icon: 'fa-solid fa-book-open' },
  { to: '/plan-trip', key: 'nav.planTrip', icon: 'fa-solid fa-map-location-dot' },
  { to: '/testimonials', key: 'nav.reviews', icon: 'fa-regular fa-star' },
  { to: '/about', key: 'nav.about', icon: 'fa-solid fa-circle-info' },
  { to: '/contact', key: 'nav.contact', icon: 'fa-solid fa-phone' },
];

export default function Navbar() {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = useNotifStore((s) => s.unread);
  const setUnread = useNotifStore((s) => s.setUnread);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [showEnablePush, setShowEnablePush] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // A link can also light up on extra routes beyond its own `to` (e.g. Clubs
  // should stay active on /plan-club, which isn't a sub-path of /clubs).
  const linkClassName = (l) => ({ isActive }) =>
    isActive || (l.matchExtra || []).some((p) => location.pathname.startsWith(p)) ? 'active' : '';

  const user = useAuth((s) => s.user);
  const accessToken = useAuth((s) => s.accessToken);
  const clear = useAuth((s) => s.clear);
  const setViewMode = useAuth((s) => s.setViewMode);
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggleTheme);
  const isAdminAccount = user?.role === 'admin' || user?.role === 'superadmin';

  const goToAdmin = () => {
    setViewMode('admin');
    setMenuOpen(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Poll unread notifications for the badge.
  useEffect(() => {
    if (!accessToken) {
      setUnread(0);
      return undefined;
    }
    let active = true;
    const load = () =>
      api
        .get('/members/notifications')
        .then((r) => active && setUnread(r.data.unread || 0))
        .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [accessToken]);

  // The "Messages" badge should reflect actual unaccepted DM requests, not
  // the generic notifications-unread count (which includes unrelated types
  // like follows/connections and never clears just from reading a chat).
  useEffect(() => {
    if (!accessToken) {
      setPendingRequestCount(0);
      return undefined;
    }
    let active = true;
    const load = () =>
      api
        .get('/chat/groups')
        .then((r) => {
          if (!active) return;
          const count = (r.data.groups || []).filter(
            (g) => g.type === 'dm' && g.dmStatus === 'pending' && String(g.requestedBy) !== String(user?.id)
          ).length;
          setPendingRequestCount(count);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [accessToken, user?.id]);

  // Offer to enable browser push once per session, only if the browser
  // supports it and the user hasn't already granted/denied permission.
  useEffect(() => {
    if (accessToken && pushPermissionState() === 'default') setShowEnablePush(true);
  }, [accessToken]);

  const handleEnablePush = async () => {
    setMenuOpen(false);
    setShowEnablePush(false);
    try {
      await enablePushNotifications();
      toast('fa-solid fa-bell', "You're all set - we'll notify you of new activity right in your browser.");
    } catch (err) {
      toast('fa-solid fa-bell-slash', err.message || 'Could not enable notifications');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    clear();
    setMenuOpen(false);
    toast('fa-solid fa-hand', 'Logged out. See you soon!');
    navigate('/');
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="nav-brand">
          <BrandLogo variant="horizontal" />
        </Link>

        <div className="nav-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClassName(l)}>
              {t(l.key)}
            </NavLink>
          ))}

          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('menu.switchToLight') : t('menu.switchToDark')}
            aria-label="Toggle theme"
          >
            <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} />
          </button>

          {!accessToken ? (
            <NavLink to="/join" className="nav-cta">
              {t('nav.joinNow')} <i className="fa-solid fa-rocket" />
            </NavLink>
          ) : (
            <div className="nav-user" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="nav-avatar-btn"
                style={{ background: 'none', border: 'none', position: 'relative' }}
                aria-label="Account menu"
              >
                <img
                  className="nav-avatar"
                  src={imageUrl(user?.avatarUrl, AVATAR_FALLBACK)}
                  alt={user?.fullName}
                  onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                />
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {menuOpen && (
                <div className="nav-menu">
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--glass-bdr)', marginBottom: 6 }}>
                    <strong style={{ fontSize: '0.85rem' }}>{user?.fullName}</strong>
                    <div style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>{user?.email}</div>
                  </div>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                    <i className="fa-solid fa-user" /> {t('menu.myProfile')}
                  </Link>
                  <Link to="/notifications" onClick={() => setMenuOpen(false)}>
                    <i className="fa-regular fa-bell" /> {t('menu.notifications')}
                    {unread > 0 && <span className="badge badge-magenta" style={{ marginLeft: 'auto' }}>{unread}</span>}
                  </Link>
                  <Link to="/dashboard?tab=settings" onClick={() => setMenuOpen(false)}>
                    <i className="fa-solid fa-gear" /> {t('menu.settings')}
                  </Link>
                  <Link to="/chat" onClick={() => setMenuOpen(false)}>
                    <i className="fa-solid fa-comment-dots" /> {t('menu.messages')}
                  </Link>
                  <Link to="/referrals" onClick={() => setMenuOpen(false)}>
                    <i className="fa-solid fa-gift" /> {t('menu.referrals')}
                  </Link>
                  <Link to="/plan-trip" onClick={() => setMenuOpen(false)}>
                    <i className="fa-solid fa-map-location-dot" /> {t('menu.planTrip')}
                  </Link>
                  <Link to="/plan-group-trip" onClick={() => setMenuOpen(false)}>
                    <i className="fa-solid fa-people-group" /> {t('menu.planGroupTrip')}
                  </Link>
                  <Link to="/plan-club" onClick={() => setMenuOpen(false)}>
                    <i className="fa-solid fa-people-roof" /> {t('menu.createClub')}
                  </Link>
                  {showEnablePush && (
                    <button onClick={handleEnablePush}>
                      <i className="fa-solid fa-bell" /> {t('menu.enableNotifications')}
                    </button>
                  )}
                  {isAdminAccount && (
                    <Link to="/admin" onClick={goToAdmin}>
                      <i className="fa-solid fa-shield-halved" /> {t('menu.adminPanel')}
                    </Link>
                  )}
                  <button onClick={logout}>
                    <i className="fa-solid fa-right-from-bracket" /> {t('menu.logout')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="nav-mobile-actions">
          {accessToken && (
            <Link to="/notifications" className="nav-bell-btn" aria-label="Notifications">
              <i className="fa-regular fa-bell" />
              {unread > 0 && <span className="notif-badge">{unread}</span>}
            </Link>
          )}

          <button
            className={`hamburger${mobileOpen ? ' open' : ''}`}
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        <button className="theme-toggle-row" onClick={toggleTheme}>
          <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} />
          {theme === 'dark' ? t('menu.lightMode') : t('menu.darkMode')}
        </button>
        {MOBILE_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setMobileOpen(false)} className={linkClassName(l)}>
            <i className={l.icon} /> {t(l.key)}
          </NavLink>
        ))}
        {accessToken ? (
          <>
            <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}>
              <i className="fa-solid fa-user" /> {t('menu.myProfile')}
            </NavLink>
            <NavLink to="/notifications" onClick={() => setMobileOpen(false)}>
              <i className="fa-regular fa-bell" /> {t('menu.notifications')}
              {unread > 0 && <span className="badge badge-magenta" style={{ marginLeft: 'auto' }}>{unread}</span>}
            </NavLink>
            <NavLink to="/dashboard?tab=settings" onClick={() => setMobileOpen(false)}>
              <i className="fa-solid fa-gear" /> {t('menu.settings')}
            </NavLink>
            <NavLink to="/chat" onClick={() => setMobileOpen(false)}>
              <i className="fa-solid fa-comment-dots" /> {t('menu.messages')}
              {pendingRequestCount > 0 && <span className="badge badge-magenta" style={{ marginLeft: 'auto' }}>{pendingRequestCount}</span>}
            </NavLink>
            <NavLink to="/referrals" onClick={() => setMobileOpen(false)}>
              <i className="fa-solid fa-gift" /> {t('menu.referrals')}
            </NavLink>
            {showEnablePush && (
              <button onClick={() => { setMobileOpen(false); handleEnablePush(); }}>
                <i className="fa-solid fa-bell" /> {t('menu.enableNotifications')}
              </button>
            )}
            {isAdminAccount && (
              <NavLink to="/admin" onClick={goToAdmin}>
                <i className="fa-solid fa-shield-halved" /> {t('menu.adminPanel')}
              </NavLink>
            )}
            <button
              onClick={logout}
              style={{
                background: 'var(--grad-fire)',
                color: 'var(--text-inv)',
                borderRadius: 'var(--r-pill)',
                fontWeight: 700,
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 6,
                border: 'none',
                padding: '13px 16px',
              }}
            >
              <i className="fa-solid fa-right-from-bracket" /> {t('menu.logout')}
            </button>
          </>
        ) : (
          <NavLink
            to="/join"
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'var(--grad-fire)',
              color: 'var(--text-inv)',
              borderRadius: 'var(--r-pill)',
              fontWeight: 700,
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
            }}
          >
            <i className="fa-solid fa-rocket" /> {t('nav.joinCommunity')}
          </NavLink>
        )}
      </div>
    </>
  );
}
