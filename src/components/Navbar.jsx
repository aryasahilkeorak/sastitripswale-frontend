import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { api } from '../lib/api.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/trips', label: 'Trips' },
  { to: '/members', label: 'Members' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const MOBILE_LINKS = [
  { to: '/', label: 'Home', icon: 'ri-home-5-line' },
  { to: '/trips', label: 'Trips', icon: 'ri-compass-line' },
  { to: '/members', label: 'Members', icon: 'ri-group-line' },
  { to: '/gallery', label: 'Gallery', icon: 'ri-image-line' },
  { to: '/completed-trips', label: 'Completed', icon: 'ri-trophy-line' },
  { to: '/plan-trip', label: 'Plan Trip', icon: 'ri-map-2-line' },
  { to: '/testimonials', label: 'Reviews', icon: 'ri-star-line' },
  { to: '/about', label: 'About', icon: 'ri-information-line' },
  { to: '/contact', label: 'Contact', icon: 'ri-phone-line' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const user = useAuth((s) => s.user);
  const accessToken = useAuth((s) => s.accessToken);
  const clear = useAuth((s) => s.clear);

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

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    clear();
    setMenuOpen(false);
    toast('👋', 'Logged out. See you soon!');
    navigate('/');
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="nav-brand">
          <div className="nav-brand-icon">🏍️</div>
          <span className="nav-brand-text">SastiTripWale</span>
        </Link>

        <div className="nav-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}

          {!accessToken ? (
            <NavLink to="/join" className="nav-cta">
              Join Free 🚀
            </NavLink>
          ) : (
            <div className="nav-user" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{ background: 'none', border: 'none', position: 'relative', padding: 0 }}
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
                    <i className="ri-dashboard-line" /> Dashboard
                  </Link>
                  <Link to="/chat" onClick={() => setMenuOpen(false)}>
                    <i className="ri-chat-3-line" /> Messages
                  </Link>
                  <Link to="/plan-trip" onClick={() => setMenuOpen(false)}>
                    <i className="ri-map-2-line" /> Plan a Trip
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)}>
                      <i className="ri-shield-star-line" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={logout}>
                    <i className="ri-logout-box-line" /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className={`hamburger${mobileOpen ? ' open' : ''}`}
          aria-label="Menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        {MOBILE_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setMobileOpen(false)}>
            <i className={l.icon} /> {l.label}
          </NavLink>
        ))}
        {accessToken ? (
          <>
            <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}>
              <i className="ri-dashboard-line" /> Dashboard
            </NavLink>
            <NavLink to="/chat" onClick={() => setMobileOpen(false)}>
              <i className="ri-chat-3-line" /> Messages
              {unread > 0 && <span className="badge badge-magenta" style={{ marginLeft: 'auto' }}>{unread}</span>}
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" onClick={() => setMobileOpen(false)}>
                <i className="ri-shield-star-line" /> Admin Panel
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
              <i className="ri-logout-box-line" /> Logout
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
            <i className="ri-rocket-line" /> Join Community
          </NavLink>
        )}
      </div>
    </>
  );
}
