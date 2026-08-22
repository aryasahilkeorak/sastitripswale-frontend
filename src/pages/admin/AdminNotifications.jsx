import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiError } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { timeAgo } from '../../lib/helpers.js';
import { NOTIF_ICON, notificationHref } from '../../lib/notifications.js';
import { useNotifStore } from '../../store/notifications.js';
import Loader from '../../components/Loader.jsx';

// Admin-side mirror of the member Notifications.jsx page - same endpoints
// (they're scoped to whichever user is logged in, staff included), same
// notif-item styling, but living inside AdminLayout instead of the public
// site chrome, and without the member-only "connection requests" section.
export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const setGlobalUnread = useNotifStore((s) => s.setUnread);
  const decrementGlobalUnread = useNotifStore((s) => s.decrement);

  useEffect(() => {
    api
      .get('/members/notifications')
      .then((r) => {
        setNotifs(r.data.notifications);
        setGlobalUnread(r.data.unread || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setGlobalUnread]);

  const unread = notifs.filter((n) => !n.isRead).length;

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
    if (!window.confirm('Clear all notifications? This cannot be undone.')) return;
    try {
      await api.delete('/members/notifications');
      setNotifs([]);
      setGlobalUnread(0);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  if (loading) return <Loader label="Loading notifications…" />;

  return (
    <div>
      <div className="row-between mb-3">
        <h4 style={{ fontFamily: 'var(--font-display)' }}>Notifications</h4>
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
        <div className="card" style={{ padding: 8 }}>
          {notifs.map((n) => {
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
          })}
        </div>
      )}
    </div>
  );
}
