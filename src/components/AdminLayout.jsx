import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useTheme } from '../store/theme.js';
import { api } from '../lib/api.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import ErrorBoundary from './ErrorBoundary.jsx';
import BrandLogo from './BrandLogo.jsx';
import Toaster from './Toaster.jsx';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: 'fa-solid fa-gauge-high', end: true },
  { to: '/admin/users', label: 'Users', icon: 'fa-solid fa-users', perm: 'users' },
  { to: '/admin/trips', label: 'Trips', icon: 'fa-solid fa-route', perm: 'trips' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'fa-solid fa-ticket', perm: 'coupons' },
  { to: '/admin/reviews', label: 'Reviews', icon: 'fa-solid fa-star', perm: 'reviews' },
  { to: '/admin/gallery', label: 'Gallery', icon: 'fa-solid fa-image', perm: 'gallery' },
  { to: '/admin/messages', label: 'Queries', icon: 'fa-solid fa-headset', perm: 'messages' },
];

// The bottom tab bar (mobile only) surfaces the 3 most-used sections directly;
// everything else lives one tap away in the "Menu" drawer.
const BOTTOM_TABS = [
  { to: '/admin', label: 'Home', icon: 'fa-solid fa-gauge-high', end: true },
  { to: '/admin/users', label: 'Users', icon: 'fa-solid fa-users', perm: 'users' },
  { to: '/admin/trips', label: 'Trips', icon: 'fa-solid fa-route', perm: 'trips' },
];

export default function AdminLayout() {
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);
  const setViewMode = useAuth((s) => s.setViewMode);
  const navigate = useNavigate();
  const location = useLocation();
  const isSuper = user?.role === 'superadmin';
  const perms = user?.permissions || [];
  const hasPerm = (key) => isSuper || perms.includes(key);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggleTheme);

  const visibleLinks = LINKS.filter((l) => !l.perm || hasPerm(l.perm));
  const visibleTabs = BOTTOM_TABS.filter((l) => !l.perm || hasPerm(l.perm));
  const blockedLink = LINKS.find((l) => l.perm && location.pathname.startsWith(l.to) && !hasPerm(l.perm));
  const currentLabel = [...LINKS, { to: '/admin/admins', label: 'Admins' }, { to: '/admin/profile', label: 'My Profile' }]
    .filter((l) => location.pathname === l.to || (l.to !== '/admin' && location.pathname.startsWith(l.to)))
    .sort((a, b) => b.to.length - a.to.length)[0]?.label || 'Overview';

  // Close the drawer whenever the route changes (tapping a link inside it).
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const switchToUser = () => setViewMode('user');

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    clear();
    toast('fa-solid fa-hand', 'Logged out');
    navigate('/');
  };

  return (
    <div className="admin-shell">
      {drawerOpen && <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

      <aside className={`admin-sidebar${drawerOpen ? ' open' : ''}`}>
        <div className="admin-brand">
          <BrandLogo variant="mark" />
          Admin
          <button className="admin-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="admin-nav-label">Manage</div>
        {visibleLinks.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `admin-link${isActive ? ' active' : ''}`}>
            <i className={l.icon} /> {l.label}
          </NavLink>
        ))}

        {isSuper && (
          <>
            <div className="admin-nav-label">Super Admin</div>
            <NavLink to="/admin/admins" className={({ isActive }) => `admin-link${isActive ? ' active' : ''}`}>
              <i className="fa-solid fa-user-shield" /> Admins
            </NavLink>
          </>
        )}

        <div className="admin-sidebar-footer">
          <NavLink to="/admin/profile" className={({ isActive }) => `admin-link${isActive ? ' active' : ''}`}>
            <i className="fa-solid fa-id-badge" /> My Profile
          </NavLink>
          <Link to="/dashboard" className="admin-link" onClick={switchToUser}>
            <i className="fa-solid fa-user" /> Switch to User Mode
          </Link>
          <Link to="/?view=site" className="admin-link"><i className="fa-solid fa-arrow-left" /> View Site</Link>
          <button className="admin-link" onClick={logout}><i className="fa-solid fa-right-from-bracket" /> Logout</button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <button className="admin-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <i className="fa-solid fa-bars" />
          </button>

          <div className="admin-topbar-title">
            <h1>{currentLabel}</h1>
            <div className="sub">Manage members, trips, revenue &amp; support</div>
          </div>

          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} />
          </button>

          <Link to="/admin/profile" className="admin-user-chip">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user?.fullName}</div>
              <span className={`role-badge ${isSuper ? 'super' : 'admin'}`}>
                <i className={isSuper ? 'fa-solid fa-crown' : 'fa-solid fa-shield-halved'} /> {isSuper ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <img src={imageUrl(user?.avatarUrl, AVATAR_FALLBACK)} alt={user?.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
          </Link>
        </div>

        <div className="admin-content">
          {blockedLink ? (
            <div className="empty-state">
              <i className="fa-solid fa-lock" />
              <p>You don't have permission to access {blockedLink.label}. Ask a super admin to grant it.</p>
            </div>
          ) : (
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          )}
        </div>
      </div>

      <nav className="admin-bottom-nav">
        {visibleTabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
            <i className={t.icon} />
            <span>{t.label}</span>
          </NavLink>
        ))}
        <button className="admin-bottom-tab" onClick={() => setDrawerOpen(true)}>
          <i className="fa-solid fa-bars" />
          <span>Menu</span>
        </button>
      </nav>

      <Toaster />
    </div>
  );
}
