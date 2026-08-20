import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, timeAgo, AVATAR_FALLBACK } from '../lib/helpers.js';
import { NOTIF_ICON, notificationHref } from '../lib/notifications.js';
import { useNotifStore } from '../store/notifications.js';
import usePullToRefresh from '../lib/usePullToRefresh.js';
import TripCard from '../components/TripCard.jsx';
import CompletedTripCard from '../components/CompletedTripCard.jsx';
import Loader from '../components/Loader.jsx';
import ScrollRow from '../components/ScrollRow.jsx';

const CATEGORIES = [
  { type: 'bike', label: 'Bike', icon: 'fa-solid fa-motorcycle' },
  { type: 'car', label: 'Car', icon: 'fa-solid fa-car' },
  { type: 'trek', label: 'Trek', icon: 'fa-solid fa-person-hiking' },
  { type: 'beach', label: 'Beach', icon: 'fa-solid fa-umbrella-beach' },
  { type: 'mountain', label: 'Mountain', icon: 'fa-solid fa-mountain' },
  { type: 'budget', label: 'Under ₹3K', icon: 'fa-solid fa-wallet' },
];

// The logged-in "app home" - replaces the marketing landing page at "/" for
// members. Every fetch below reuses an endpoint already called elsewhere
// (Dashboard.jsx / Home.jsx) - no new backend routes.
export default function AppHome() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  const [myTrips, setMyTrips] = useState([]);
  const [joinedTrips, setJoinedTrips] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const setGlobalUnread = useNotifStore((s) => s.setUnread);
  const decrementGlobalUnread = useNotifStore((s) => s.decrement);

  const loadData = useCallback(
    () =>
      Promise.all([
        api.get('/trips/my').then((r) => { setMyTrips(r.data.trips); setJoinedTrips(r.data.joinedTrips || []); }).catch(() => {}),
        api.get('/trips', { params: { status: 'upcoming', limit: 8 } }).then((r) => setUpcoming(r.data.trips)).catch(() => {}),
        api
          .get('/members/notifications')
          .then((r) => {
            setNotifs(r.data.notifications);
            setGlobalUnread(r.data.unread || 0);
          })
          .catch(() => {}),
        // The Messages tile's badge should reflect actual unaccepted DM
        // requests, not the generic notifications-unread count below (which
        // includes unrelated types and never clears just from reading a chat).
        api
          .get('/chat/groups')
          .then((r) => {
            const count = (r.data.groups || []).filter(
              (g) => g.type === 'dm' && g.dmStatus === 'pending' && String(g.requestedBy) !== String(user?.id)
            ).length;
            setPendingRequestCount(count);
          })
          .catch(() => {}),
      ]),
    [user?.id]
  );

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Mobile/tablet only in practice - desktop pointers don't fire touch events.
  const { containerRef, pullDistance, refreshing } = usePullToRefresh(loadData);

  if (loading) return <Loader label="Getting things ready…" />;

  const unread = notifs.filter((n) => !n.isRead).length;
  const firstName = (user?.fullName || '').split(' ')[0] || 'Traveler';
  // "Trips for you" is discovery - trips other hosts are running, not your own.
  const othersTrips = upcoming.filter((t) => String(t.organizer?._id) !== String(user?.id));
  // "Your next trip" means what's still ahead - myTrips includes every trip
  // this member has ever hosted, completed ones included, which doesn't
  // belong here (and TripCard's "Edit Trip" button makes no sense on one).
  const nextTrips = myTrips.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  // Trips this member was actually on (hosted or joined) that are now over -
  // distinct from "Trips for you" above, which is discovery for trips
  // other hosts are running.
  const completedTrips = [...myTrips, ...joinedTrips].filter((t) => t.status === 'completed');
  const daysLeft = user?.membershipActive && user?.membershipExpiresAt
    ? Math.ceil((new Date(user.membershipExpiresAt) - Date.now()) / 86400000)
    : null;

  const openNotification = (n) => {
    if (!n.isRead) {
      api.patch(`/members/notifications/${n._id}/read`).catch(() => {});
      setNotifs((ns) => ns.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      decrementGlobalUnread();
    }
    const href = notificationHref(n);
    if (href) navigate(href);
  };

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
            <Link to={`/members/${user?.username || user?.id}`} className="ahg-stat" style={{ color: 'inherit' }}>
              <strong>{myTrips.length}</strong>
              <span>My trips</span>
            </Link>
            <div className="ahg-stat-divider" />
            <Link to="/notifications" className="ahg-stat" style={{ color: 'inherit' }}>
              <strong>{unread}</strong>
              <span>Alerts</span>
            </Link>
            <div className="ahg-stat-divider" />
            <Link to="/trips" className="ahg-stat" style={{ color: 'inherit' }}>
              <strong>{upcoming.length}</strong>
              <span>Open trips</span>
            </Link>
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
                {pendingRequestCount > 0 && <span className="app-tile-badge">{pendingRequestCount}</span>}
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
          old markup); at $bp-lg+ it becomes a 2-column dashboard grid - see
          .app-home-grid in app.scss. Source order intentionally matches the
          mobile visual order so nothing changes for touch users. */}
      <div className="app-home-grid container">
        <section className="app-section app-home-next fade-up">
          <div className="app-section-head">
            <h2>Your next trip</h2>
          </div>
          {nextTrips.length > 0 ? (
            <ScrollRow>
              {nextTrips.map((t) => (
                <div className="app-scroll-item" key={t._id}>
                  <TripCard trip={t} />
                </div>
              ))}
            </ScrollRow>
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
          {othersTrips.length === 0 ? (
            <div className="empty-state-sm"><i className="fa-solid fa-compass" /><p>No upcoming trips right now.</p></div>
          ) : (
            <ScrollRow>
              {othersTrips.map((t) => (
                <div className="app-scroll-item" key={t._id}>
                  <TripCard trip={t} />
                </div>
              ))}
            </ScrollRow>
          )}
        </section>

      </div>

      <section className="app-section app-home-activity fade-up container">
        <div className="app-section-head">
          <h2>Notifications</h2>
          <Link to="/notifications">View all <i className="fa-solid fa-arrow-right" /></Link>
        </div>
        {notifs.length === 0 ? (
          <div className="empty-state-sm"><i className="fa-solid fa-bell" /><p>Nothing new yet.</p></div>
        ) : (
          <div className="app-activity-list">
            {notifs.slice(0, 5).map((n) => {
              const clickable = Boolean(notificationHref(n));
              return (
                <div
                  key={n._id}
                  className={`app-activity-item${n.isRead ? '' : ' unread'}`}
                  style={clickable ? { cursor: 'pointer' } : undefined}
                  onClick={clickable ? () => openNotification(n) : undefined}
                >
                  <i className={NOTIF_ICON[n.type] || 'fa-solid fa-circle-info'} />
                  <div>
                    <div className="app-activity-title">{n.title}</div>
                    <div className="app-activity-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {clickable && <i className="fa-solid fa-chevron-right" style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: '0.75rem' }} />}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {completedTrips.length > 0 && (
        <section className="app-section fade-up container">
          <div className="app-section-head">
            <h2>Your completed trips</h2>
            <Link to={`/members/${user?.username || user?.id}`}>View all <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          <ScrollRow>
            {completedTrips.map((t) => (
              <div className="app-scroll-item" key={t._id}>
                <CompletedTripCard trip={t} />
              </div>
            ))}
          </ScrollRow>
        </section>
      )}
    </div>
  );
}
