import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, timeAgo, AVATAR_FALLBACK } from '../lib/helpers.js';
import usePullToRefresh from '../lib/usePullToRefresh.js';
import TripCard from '../components/TripCard.jsx';
import Loader from '../components/Loader.jsx';

const CATEGORIES = [
  { type: 'bike', label: 'Bike', icon: 'fa-solid fa-motorcycle' },
  { type: 'car', label: 'Car', icon: 'fa-solid fa-car' },
  { type: 'trek', label: 'Trek', icon: 'fa-solid fa-person-hiking' },
  { type: 'beach', label: 'Beach', icon: 'fa-solid fa-umbrella-beach' },
  { type: 'mountain', label: 'Mountain', icon: 'fa-solid fa-mountain' },
  { type: 'budget', label: 'Under ₹3K', icon: 'fa-solid fa-wallet' },
];

const NOTIF_ICON = {
  welcome: 'fa-solid fa-hand-holding-heart',
  trip_interest: 'fa-solid fa-fire',
  payment: 'fa-solid fa-credit-card',
  connection: 'fa-solid fa-user-plus',
  verification: 'fa-solid fa-circle-check',
  system: 'fa-solid fa-circle-info',
  group: 'fa-solid fa-users-rectangle',
  message: 'fa-solid fa-comment-dots',
};

// The logged-in "app home" — replaces the marketing landing page at "/" for
// members. Every fetch below reuses an endpoint already called elsewhere
// (Dashboard.jsx / Home.jsx) — no new backend routes.
export default function AppHome() {
  const user = useAuth((s) => s.user);

  const [myTrips, setMyTrips] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(
    () =>
      Promise.all([
        api.get('/trips/my').then((r) => setMyTrips(r.data.trips)).catch(() => {}),
        api.get('/trips', { params: { status: 'upcoming', limit: 8 } }).then((r) => setUpcoming(r.data.trips)).catch(() => {}),
        api.get('/members/notifications').then((r) => setNotifs(r.data.notifications)).catch(() => {}),
      ]),
    []
  );

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Mobile/tablet only in practice — desktop pointers don't fire touch events.
  const { containerRef, pullDistance, refreshing } = usePullToRefresh(loadData);

  if (loading) return <Loader label="Getting things ready…" />;

  const unread = notifs.filter((n) => !n.isRead).length;
  const firstName = (user?.fullName || '').split(' ')[0] || 'Traveler';
  const nextTrip = myTrips[0];
  const daysLeft = user?.membershipActive && user?.membershipExpiresAt
    ? Math.ceil((new Date(user.membershipExpiresAt) - Date.now()) / 86400000)
    : null;

  return (
    <div className="app-home" ref={containerRef}>
      <div className="ptr-indicator" style={{ height: refreshing ? 40 : pullDistance }}>
        {refreshing ? (
          <span className="spinner" />
        ) : pullDistance > 0 ? (
          <i className="fa-solid fa-arrow-down" style={{ transform: `rotate(${Math.min(pullDistance / 70, 1) * 180}deg)` }} />
        ) : null}
      </div>

      <section className="app-home-greeting">
        <div className="container">
          <div className="ahg-row">
            <img
              className="ahg-avatar"
              src={imageUrl(user?.avatarUrl, AVATAR_FALLBACK)}
              alt={user?.fullName}
              onError={(e) => { e.currentTarget.src = AVATAR_FALLBACK; }}
            />
            <div>
              <div className="ahg-hi">Hi, {firstName} <i className="fa-solid fa-hand" style={{ color: 'var(--fire)' }} /></div>
              <div className="ahg-badges">
                <span className={`badge ${user?.membershipActive ? 'badge-green' : 'badge-red'}`}>
                  {user?.membershipActive ? '● Active member' : '○ Membership inactive'}
                </span>
                {daysLeft != null && (
                  <span className="badge badge-gold">{daysLeft > 0 ? `${daysLeft}d left` : 'Expires today'}</span>
                )}
                {!user?.profileComplete && <span className="badge badge-magenta">Profile incomplete</span>}
              </div>
            </div>
          </div>

          <div className="ahg-stats">
            <div className="ahg-stat">
              <strong>{myTrips.length}</strong>
              <span>My trips</span>
            </div>
            <div className="ahg-stat-divider" />
            <div className="ahg-stat">
              <strong>{unread}</strong>
              <span>Alerts</span>
            </div>
            <div className="ahg-stat-divider" />
            <div className="ahg-stat">
              <strong>{upcoming.length}</strong>
              <span>Open trips</span>
            </div>
          </div>

          {(!user?.profileComplete || !user?.membershipPaid) && (
            <div className="ahg-alert-stack">
              {!user?.profileComplete && (
                <Link to="/complete-profile" className="ahg-alert ahg-alert-magenta">
                  <i className="fa-solid fa-user-gear" />
                  <span>Complete your profile to unlock trips</span>
                  <i className="fa-solid fa-chevron-right" />
                </Link>
              )}
              {!user?.membershipPaid && (
                <Link to="/join" className="ahg-alert ahg-alert-fire">
                  <i className="fa-solid fa-crown" />
                  <span>Activate membership to plan &amp; join trips</span>
                  <i className="fa-solid fa-chevron-right" />
                </Link>
              )}
            </div>
          )}

          <div className="app-tile-grid">
            <Link to="/plan-trip" className="app-tile">
              <span className="app-tile-icon"><i className="fa-solid fa-map-location-dot" /></span>
              Plan a Trip
            </Link>
            <Link to="/trips" className="app-tile">
              <span className="app-tile-icon"><i className="fa-solid fa-compass" /></span>
              Explore
            </Link>
            <Link to="/chat" className="app-tile">
              <span className="app-tile-icon">
                <i className="fa-solid fa-comment-dots" />
                {unread > 0 && <span className="app-tile-badge">{unread}</span>}
              </span>
              Messages
            </Link>
            <Link to="/members" className="app-tile">
              <span className="app-tile-icon"><i className="fa-solid fa-users" /></span>
              Members
            </Link>
          </div>
        </div>
      </section>

      {/* Below $bp-lg this is normal stacked document flow (identical to the
          old markup); at $bp-lg+ it becomes a 2-column dashboard grid — see
          .app-home-grid in app.scss. Source order intentionally matches the
          mobile visual order so nothing changes for touch users. */}
      <div className="app-home-grid container">
        <section className="app-section app-home-next fade-up">
          <div className="app-section-head">
            <h2>Your next trip</h2>
          </div>
          {nextTrip ? (
            <div className="app-next-trip">
              <TripCard trip={nextTrip} />
            </div>
          ) : (
            <div className="app-empty-card">
              <i className="fa-solid fa-compass" />
              <p>No trips planned yet.</p>
              <div className="app-empty-actions">
                <Link to="/plan-trip" className="btn btn-primary btn-sm">Plan a Trip</Link>
                <Link to="/trips" className="btn btn-outline btn-sm">Browse Trips</Link>
              </div>
            </div>
          )}
        </section>

        <section className="app-section app-home-cats fade-up">
          <div className="app-section-head">
            <h2>Categories</h2>
          </div>
          <div className="app-scroll-row app-cat-row">
            {CATEGORIES.map((c) => (
              <Link key={c.type} to={`/trips?type=${c.type}`} className="app-cat-chip">
                <i className={c.icon} /> {c.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="app-section app-home-trips fade-up">
          <div className="app-section-head">
            <h2>Trips for you</h2>
            <Link to="/trips">View all <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="empty-state"><i className="fa-solid fa-compass" /><p>No upcoming trips right now.</p></div>
          ) : (
            <div className="app-scroll-row">
              {upcoming.map((t) => (
                <div className="app-scroll-item" key={t._id}>
                  <TripCard trip={t} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="app-section app-home-activity fade-up">
          <div className="app-section-head">
            <h2>Recent activity</h2>
            <Link to="/dashboard">View all <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          {notifs.length === 0 ? (
            <div className="empty-state"><i className="fa-solid fa-bell" /><p>Nothing new yet.</p></div>
          ) : (
            <div className="app-activity-list">
              {notifs.slice(0, 3).map((n) => (
                <div className={`app-activity-item${n.isRead ? '' : ' unread'}`} key={n._id}>
                  <i className={NOTIF_ICON[n.type] || 'fa-solid fa-circle-info'} />
                  <div>
                    <div className="app-activity-title">{n.title}</div>
                    <div className="app-activity-time">{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
