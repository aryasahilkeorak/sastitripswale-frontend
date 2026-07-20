import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import {
  imageUrl,
  rupee,
  paiseToRupee,
  timeAgo,
  formatDate,
  PREF_LABEL,
  AVATAR_FALLBACK,
  SOCIAL_PLATFORMS,
  socialUrl,
  TRAVEL_INTEREST_ICONS,
} from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import ProfileEditForm from '../components/ProfileEditForm.jsx';
import DestinationImage from '../components/DestinationImage.jsx';

const TABS = [
  { key: 'trips', label: 'My Trips', icon: 'fa-solid fa-map-location-dot' },
  { key: 'overview', label: 'Overview', icon: 'fa-solid fa-gauge-high' },
  { key: 'notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
  { key: 'payments', label: 'Payments', icon: 'fa-solid fa-credit-card' },
  { key: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
];

const NOTIF_ICON = {
  welcome: 'fa-solid fa-hand-holding-heart',
  trip_interest: 'fa-solid fa-fire',
  payment: 'fa-solid fa-credit-card',
  connection: 'fa-solid fa-user-plus',
  verification: 'fa-solid fa-circle-check',
  system: 'fa-solid fa-circle-info',
};

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const viewMode = useAuth((s) => s.viewMode);
  const [tab, setTab] = useState('trips');

  const [trips, setTrips] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [connections, setConnections] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/trips/my').then((r) => setTrips(r.data.trips)).catch(() => {});
    api.get('/members/notifications').then((r) => setNotifs(r.data.notifications)).catch(() => {});
    api.get('/members/connections').then((r) => setConnections(r.data.connections)).catch(() => {});
    api.get('/payments/history').then((r) => setPayments(r.data.payments)).catch(() => {});
  }, []);

  // Admins get the dedicated admin dashboard, not the member one — unless
  // they chose "Continue as User" at login.
  if (viewMode !== 'user' && user && (user.role === 'admin' || user.role === 'superadmin')) {
    return <Navigate to="/admin" replace />;
  }

  const unread = notifs.filter((n) => !n.isRead).length;
  const pendingReceived = connections.filter((c) => c.status === 'pending' && String(c.receiver?._id) === String(user?.id));
  const acceptedCount = connections.filter((c) => c.status === 'accepted').length;

  const markRead = async () => {
    await api.patch('/members/notifications/read').catch(() => {});
    setNotifs((ns) => ns.map((n) => ({ ...n, isRead: true })));
  };

  const respond = async (id, action) => {
    try {
      await api.patch(`/members/connect/${id}`, { action });
      setConnections((cs) => cs.map((c) => (c._id === id ? { ...c, status: action === 'accept' ? 'accepted' : 'rejected' } : c)));
      toast(action === 'accept' ? 'fa-solid fa-handshake' : 'fa-solid fa-hand', action === 'accept' ? 'Connection accepted!' : 'Request declined');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const removeTrip = async (id) => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    try {
      await api.delete(`/trips/${id}`);
      setTrips((ts) => ts.filter((t) => t._id !== id));
      toast('fa-solid fa-trash', 'Trip deleted');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const copyId = () => {
    navigator.clipboard?.writeText(String(user?.id || ''));
    toast('fa-solid fa-clipboard', 'User ID copied — share it to be added to groups');
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/members/${user?.id}`;
    if (navigator.share) {
      navigator.share({ title: `${user?.fullName} on SastiTripsWale`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast('fa-solid fa-clipboard', 'Profile link copied!');
    }
  };

  return (
    <section style={{ paddingTop: 110, paddingBottom: 60 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Profile header — matches the real Instagram profile layout: a
            top row of avatar + stats, then name/bio/links full-width below. */}
        <div className="ig-header">
          <div className="ig-top-row">
            <img
              className="ig-avatar"
              src={imageUrl(user?.avatarUrl, AVATAR_FALLBACK)}
              alt={user?.fullName}
              onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
            />
            <div className="ig-stats">
              <div className="ig-stat"><strong>{trips.length}</strong><span>Trips</span></div>
              <div className="ig-stat"><strong>{acceptedCount}</strong><span>Connections</span></div>
              <div className="ig-stat"><strong>{unread}</strong><span>Alerts</span></div>
              <div className="ig-stat"><strong>{payments.length}</strong><span>Payments</span></div>
            </div>
          </div>

          <div className="ig-header-body">
            <div className="ig-name-row">
              <h1>{user?.fullName}</h1>
              {user?.role === 'superadmin' ? (
                <span className="verified-badge founder-badge"><i className="fa-solid fa-crown" /> Founder</span>
              ) : user?.isVerified && (
                <span className="verified-badge"><i className="fa-solid fa-circle-check" /> Verified</span>
              )}
              <button className="ig-id-btn" onClick={copyId} title="Copy user ID">
                <i className="fa-solid fa-copy" />
              </button>
              <button className="ig-id-btn" style={{ marginLeft: 'auto' }} onClick={() => setTab('settings')} title="Settings">
                <i className="fa-solid fa-gear" />
              </button>
            </div>

            {user?.username && <p className="ig-username">@{user.username}</p>}
            <p className="ig-joined">Member since {formatDate(user?.createdAt)}</p>

            <p className="ig-meta">
              {user?.profession && <span><i className="fa-solid fa-briefcase" /> {user.profession}</span>}
              <span><i className="fa-solid fa-location-dot" /> {user?.city || 'India'}{user?.vehicleType ? ` · ${user.vehicleType}` : ''}</span>
              <span><i className="fa-solid fa-envelope" /> {user?.email}</span>
            </p>

            {user?.bio && <p className="ig-bio">{user.bio}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span className={`badge ${user?.membershipActive ? 'badge-green' : 'badge-red'}`}>
                {user?.membershipActive ? '● Active member' : '○ Membership inactive'}
              </span>
              {user?.membershipActive && user?.membershipExpiresAt && (
                <span className="badge badge-gold">Valid till {formatDate(user.membershipExpiresAt)}</span>
              )}
              {!user?.profileComplete && <span className="badge badge-magenta">Profile incomplete</span>}
            </div>

            {SOCIAL_PLATFORMS.some((p) => user?.[p.key]) && (
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                {SOCIAL_PLATFORMS.filter((p) => user?.[p.key]).map((p) => (
                  <a key={p.key} href={socialUrl(p.key, user[p.key])} target="_blank" rel="noreferrer" title={p.label} style={{ fontSize: '1.2rem', color: 'var(--text-2)' }}>
                    <i className={p.icon} />
                  </a>
                ))}
              </div>
            )}

            {user?.travelInterests?.length > 0 && (
              <div className="interest-pill-row" style={{ marginTop: 12 }}>
                {user.travelInterests.map((t) => (
                  <span key={t} className="interest-pill">
                    <i className={TRAVEL_INTEREST_ICONS[t] || 'fa-solid fa-star'} /> {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Complete-profile gate banner */}
        {!user?.profileComplete && (
          <div className="card mt-3" style={{ padding: 20, borderColor: 'rgba(224,64,251,0.4)' }}>
            <div className="row-between">
              <div>
                <strong>Complete your profile to unlock trips</strong>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Add your name, city, interests, vehicle &amp; ID. You can't plan or join trips until it's done.</p>
              </div>
              <Link to="/complete-profile" className="btn btn-primary btn-sm"><i className="fa-solid fa-user-gear" /> Complete now</Link>
            </div>
          </div>
        )}

        {!user?.membershipPaid && (
          <div className="card mt-3" style={{ padding: 20, borderColor: 'rgba(255,107,0,0.3)' }}>
            <div className="row-between">
              <div>
                <strong>Activate your membership</strong>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Unlock trip creation, joining and connections.</p>
              </div>
              <Link to="/join" className="btn btn-primary btn-sm"><i className="fa-solid fa-crown" /> View Plans</Link>
            </div>
          </div>
        )}

        <div className="ig-action-row mt-3">
          <button className="ig-flat-btn" onClick={() => setTab('settings')}><i className="fa-solid fa-pen" /> Edit profile</button>
          <button className="ig-flat-btn" onClick={shareProfile}><i className="fa-solid fa-share-nodes" /> Share profile</button>
        </div>

        <div className="ig-highlights mt-3">
          <Link to="/plan-trip" className="ig-highlight-item">
            <span className="ig-highlight-avatar ig-highlight-new"><i className="fa-solid fa-plus" /></span>
            <span className="ig-highlight-label">New</span>
          </Link>
          {trips.map((t) => (
            <Link to={`/trips/${t._id}`} key={t._id} className="ig-highlight-item">
              <span className="ig-highlight-avatar"><DestinationImage trip={t} loading="lazy" /></span>
              <span className="ig-highlight-label">{t.destination}</span>
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <div className="ig-tabs mt-4">
          {TABS.map((t) => (
            <button key={t.key} className={`ig-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)} title={t.label}>
              <i className={t.icon} /> <span>{t.label}</span>
              {t.key === 'notifications' && unread > 0 && <span className="ig-tab-dot" />}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="grid-2">
            <div className="card" style={{ padding: 24 }}>
              <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Profile</h3>
              <Detail label="Profession" value={user?.profession} />
              <Detail label="City / State" value={[user?.city, user?.state].filter(Boolean).join(', ')} />
              <Detail label="Age" value={user?.age} />
              <Detail label="Vehicle" value={[user?.vehicleType, user?.vehicleModel].filter(Boolean).join(' · ')} />
              <Detail label="Mobile" value={user?.mobile} />
              <Detail label="Travels with" value={PREF_LABEL[user?.coTravelerPreference]} />
              <Detail
                label="Membership"
                value={user?.membershipActive ? `${user?.membershipDuration === '1y' ? '1 year' : '6 months'} · till ${formatDate(user?.membershipExpiresAt)}` : 'Inactive'}
              />
            </div>
            <div>
              <div className="card" style={{ padding: 24 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Quick actions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to="/trips" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}><i className="fa-solid fa-compass" /> Browse Trips</Link>
                  <Link to="/plan-trip" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}><i className="fa-solid fa-map-location-dot" /> Plan a Trip</Link>
                  <Link to="/chat" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}><i className="fa-solid fa-comment-dots" /> Messages</Link>
                  <Link to="/members" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}><i className="fa-solid fa-users" /> Find Members</Link>
                  <Link to="/gallery" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}><i className="fa-regular fa-image" /> Gallery</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MY TRIPS */}
        {tab === 'trips' && (
          <>
            <div className="row-between mb-3">
              <h4 style={{ fontFamily: 'var(--font-display)' }}>Trips you host</h4>
              <Link to="/plan-trip" className="btn btn-sm btn-primary"><i className="fa-solid fa-plus" /> Host a Trip</Link>
            </div>
            {trips.length === 0 ? (
              <div className="empty-state"><i className="fa-solid fa-map-location-dot" /><p>You haven't hosted any trips yet.</p><Link to="/plan-trip" className="btn btn-primary mt-3">Host a Trip</Link></div>
            ) : (
              <div className="ig-grid">
                {trips.map((t) => (
                  <Link to={`/trips/${t._id}`} key={t._id} className="ig-tile">
                    <DestinationImage trip={t} loading="lazy" />
                    <div className="ig-tile-overlay">
                      <div className="ig-tile-dest">{t.destination}</div>
                      <div className="ig-tile-meta">{rupee(t.budgetPerHead)}</div>
                    </div>
                    <button
                      className="ig-tile-delete"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeTrip(t._id); }}
                      title="Delete trip"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* NOTIFICATIONS */}
        {tab === 'notifications' && (
          <div style={{ maxWidth: 680 }}>
            {pendingReceived.length > 0 && (
              <div className="card mb-4" style={{ padding: 20 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Connection requests</h4>
                {pendingReceived.map((c) => (
                  <div key={c._id} className="row-between" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={imageUrl(c.sender?.avatarUrl, AVATAR_FALLBACK)} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                      <span style={{ fontSize: '0.88rem' }}>{c.sender?.fullName}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-primary" onClick={() => respond(c._id, 'accept')}>Accept</button>
                      <button className="btn btn-sm btn-outline" onClick={() => respond(c._id, 'reject')}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="row-between mb-3">
              <h4 style={{ fontFamily: 'var(--font-display)' }}>Notifications</h4>
              {unread > 0 && <button className="btn btn-sm btn-outline" onClick={markRead}>Mark all read</button>}
            </div>
            {notifs.length === 0 ? (
              <div className="empty-state"><i className="fa-solid fa-bell-slash" /><p>No notifications yet.</p></div>
            ) : (
              notifs.map((n) => (
                <div key={n._id} className={`notif-item${n.isRead ? '' : ' unread'}`}>
                  <div className="notif-icon"><i className={NOTIF_ICON[n.type] || 'fa-solid fa-circle-info'} /></div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.88rem' }}>{n.title}</strong>
                    <p className="text-muted" style={{ fontSize: '0.82rem' }}>{n.message}</p>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.isRead && <span className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        )}

        {/* PAYMENTS */}
        {tab === 'payments' && (
          <div style={{ maxWidth: 680 }}>
            {payments.length === 0 ? (
              <div className="empty-state"><i className="fa-solid fa-credit-card" /><p>No payments yet.</p>{!user?.membershipActive && <Link to="/join" className="btn btn-primary mt-3">View plans</Link>}</div>
            ) : (
              payments.map((p) => (
                <div key={p._id} className="notif-item">
                  <div className="notif-icon"><i className="fa-solid fa-credit-card" /></div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.88rem', textTransform: 'capitalize' }}>{p.purpose}</strong>
                    <p className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {p.razorpayPaymentId || p._id}{p.couponUsed ? ` · ${p.couponUsed}` : ''} · {timeAgo(p.createdAt)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{paiseToRupee(p.amount)}</div>
                    <span className={`badge ${p.status === 'success' ? 'badge-green' : p.status === 'failed' ? 'badge-red' : 'badge-gold'}`}>{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && <SettingsForm user={user} setUser={setUser} />}
      </div>
    </section>
  );
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div className="row-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--glass-bdr)' }}>
      <span className="text-muted" style={{ fontSize: '0.8rem' }}>{label}</span>
      <span style={{ fontSize: '0.85rem' }}>{value}</span>
    </div>
  );
}

function SettingsForm({ user, setUser }) {
  const clear = useAuth((s) => s.clear);

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    clear();
    toast('fa-solid fa-hand', 'Logged out');
  };

  return (
    <div className="grid-2">
      <ProfileEditForm user={user} onSaved={setUser} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DocumentsCard />
        <div className="card" style={{ padding: 24, borderColor: 'rgba(239,68,68,0.25)' }}>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>Account</h4>
          <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>Sign out of your account on this device.</p>
          <button className="btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={logout}><i className="fa-solid fa-right-from-bracket" /> Logout</button>
        </div>
      </div>
    </div>
  );
}

const DOC_TYPE_LABEL = {
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  voter_id: 'Voter ID',
  driving_license: 'Driving Licence',
  rc: 'RC',
};
const DOC_STATUS_BADGE = { pending: 'badge-gold', verified: 'badge-green', rejected: 'badge-red' };

function DocumentsCard() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reuploadingId, setReuploadingId] = useState(null);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get('/members/documents').then((r) => setDocs(r.data.documents)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const pickReupload = (id) => {
    setReuploadingId(id);
    setTimeout(() => fileRef.current?.click(), 0);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !reuploadingId) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.put(`/members/documents/${reuploadingId}`, fd);
      toast('fa-solid fa-circle-check', 'Document re-uploaded — pending review');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setReuploadingId(null);
    }
  };

  if (loading) return null;
  if (docs.length === 0) return null;

  return (
    <div className="card" style={{ padding: 24 }}>
      <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>My Documents</h4>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={onFile} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {docs.map((d) => (
          <div key={d._id} className="row-between" style={{ alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem' }}>{DOC_TYPE_LABEL[d.docType] || d.docType}{d.side ? ` (${d.side})` : ''}</div>
              <span className={`badge ${DOC_STATUS_BADGE[d.status] || 'badge-gold'}`} style={{ fontSize: '0.62rem', marginTop: 4 }}>{d.status}</span>
            </div>
            {d.status === 'rejected' && (
              <button className="btn btn-sm btn-outline" onClick={() => pickReupload(d._id)}>
                <i className="fa-solid fa-rotate" /> Reupload
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
