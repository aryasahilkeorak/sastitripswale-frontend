import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, timeAgo, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import { confirm } from '../lib/confirm.js';
import { NOTIF_ICON, notificationHref } from '../lib/notifications.js';
import { useNotifStore } from '../store/notifications.js';
import Loader from '../components/Loader.jsx';

// A dedicated full-page "Activity" screen (Instagram-style) instead of a
// dashboard tab - reached from the bell icon in the header.
export default function Notifications() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [notifs, setNotifs] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const setGlobalUnread = useNotifStore((s) => s.setUnread);
  const decrementGlobalUnread = useNotifStore((s) => s.decrement);

  useEffect(() => {
    Promise.all([
      api
        .get('/members/notifications')
        .then((r) => {
          setNotifs(r.data.notifications);
          setGlobalUnread(r.data.unread || 0);
        })
        .catch(() => {}),
      api.get('/members/connections').then((r) => setConnections(r.data.connections)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [setGlobalUnread]);

  const unread = notifs.filter((n) => !n.isRead).length;
  const pendingReceived = connections.filter((c) => c.status === 'pending' && String(c.receiver?._id) === String(user?.id));

  const respond = async (id, action) => {
    try {
      await api.patch(`/members/connect/${id}`, { action });
      setConnections((cs) => cs.map((c) => (c._id === id ? { ...c, status: action === 'accept' ? 'accepted' : 'rejected' } : c)));
      toast(action === 'accept' ? 'fa-solid fa-handshake' : 'fa-solid fa-hand', action === 'accept' ? 'Connection accepted!' : 'Request declined');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const markRead = async () => {
    await api.patch('/members/notifications/read').catch(() => {});
    setNotifs((ns) => ns.map((n) => ({ ...n, isRead: true })));
    setGlobalUnread(0);
  };

  const openNotification = (n) => {
    if (!n.isRead) {
      api.patch(`/members/notifications/${n._id}/read`).catch(() => {});
      setNotifs((ns) => ns.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      decrementGlobalUnread();
    }
    const href = notificationHref(n);
    if (href) navigate(href);
  };

  const clearNotification = (e, id) => {
    e.stopPropagation();
    const wasUnread = notifs.some((n) => n._id === id && !n.isRead);
    api.delete(`/members/notifications/${id}`).catch(() => {});
    setNotifs((ns) => ns.filter((n) => n._id !== id));
    if (wasUnread) decrementGlobalUnread();
  };

  const clearAllNotifications = async () => {
    if (!(await confirm({ message: 'Clear all notifications? This cannot be undone.', danger: true, confirmLabel: 'Clear' }))) return;
    try {
      await api.delete('/members/notifications');
      setNotifs([]);
      setGlobalUnread(0);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  return (
    <section className="cp-section">
      <div className="container" style={{ maxWidth: 680 }}>
        <div className="edit-profile-head">
          <button className="ig-id-btn" onClick={() => navigate(-1)} aria-label="Back">
            <i className="fa-solid fa-arrow-left" />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: 0 }}>Notifications</h1>
        </div>

        {loading ? (
          <Loader label="Loading notifications…" />
        ) : (
          <>
            {pendingReceived.length > 0 && (
              <div className="card mb-4" style={{ padding: 14 }}>
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
              <h4 style={{ fontFamily: 'var(--font-display)' }}>Recent activity</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                {unread > 0 && <button className="btn btn-sm btn-outline" onClick={markRead}>Mark all read</button>}
                {notifs.length > 0 && (
                  <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={clearAllNotifications}>
                    <i className="fa-solid fa-trash" /> Clear all
                  </button>
                )}
              </div>
            </div>
            {notifs.length === 0 ? (
              <div className="empty-state"><i className="fa-solid fa-bell-slash" /><p>No notifications yet.</p></div>
            ) : (
              notifs.map((n) => {
                const clickable = Boolean(notificationHref(n));
                return (
                  <div
                    key={n._id}
                    className={`notif-item${n.isRead ? '' : ' unread'}`}
                    style={clickable ? { cursor: 'pointer' } : undefined}
                    onClick={clickable ? () => openNotification(n) : undefined}
                  >
                    <div className="notif-icon"><i className={NOTIF_ICON[n.type] || 'fa-solid fa-circle-info'} /></div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.88rem' }}>{n.title}</strong>
                      <p className="text-muted" style={{ fontSize: '0.82rem' }}>{n.message}</p>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>{timeAgo(n.createdAt)}</span>
                    </div>
                    {!n.isRead && <span className="notif-dot" />}
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ padding: '4px 8px', flexShrink: 0, alignSelf: 'center' }}
                      onClick={(e) => clearNotification(e, n._id)}
                      title="Clear this notification"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </section>
  );
}
