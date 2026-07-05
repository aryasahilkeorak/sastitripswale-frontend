import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { api } from '../lib/api.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import ErrorBoundary from './ErrorBoundary.jsx';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: 'fa-solid fa-gauge-high', end: true },
  { to: '/admin/users', label: 'Users', icon: 'fa-solid fa-users' },
  { to: '/admin/trips', label: 'Trips', icon: 'fa-solid fa-route' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'fa-solid fa-ticket' },
  { to: '/admin/reviews', label: 'Reviews', icon: 'fa-solid fa-star' },
  { to: '/admin/messages', label: 'Queries', icon: 'fa-solid fa-headset' },
];

export default function AdminLayout() {
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);
  const navigate = useNavigate();
  const location = useLocation();
  const isSuper = user?.role === 'superadmin';

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    clear();
    toast('fa-solid fa-hand', 'Logged out');
    navigate('/');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="badge-shield"><i className="fa-solid fa-shield-halved" /></span>
          Admin
        </div>

        <div className="admin-nav-label">Manage</div>
        {LINKS.map((l) => (
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
          <Link to="/" className="admin-link"><i className="fa-solid fa-arrow-left" /> View Site</Link>
          <button className="admin-link" onClick={logout}><i className="fa-solid fa-right-from-bracket" /> Logout</button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Admin Dashboard</h1>
            <div className="sub">Manage members, trips, revenue &amp; support</div>
          </div>
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
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
