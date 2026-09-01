import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import Modal from './Modal.jsx';
import Loader from './Loader.jsx';

// Sits above the Lightbox (z-index 100600) since it's opened from within it.
const Z_INDEX = 100700;

export default function SharePhotoModal({ open, photo, onClose }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
  const myId = useAuth((s) => s.user?.id);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get('/chat/groups')
      .then((r) => setGroups(r.data.groups))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!photo) return null;

  const rowFor = (g) => {
    if (g.type === 'dm') {
      const other = (g.members || []).find((m) => String(m._id) !== String(myId));
      return { name: other?.fullName || 'Member', avatar: other?.avatarUrl };
    }
    return { name: g.name, avatar: g.photoUrl };
  };

  const sendTo = async (groupId) => {
    setSendingTo(groupId);
    try {
      await api.post(`/chat/groups/${groupId}/messages`, { sharedPhotoId: photo.id });
      toast('fa-solid fa-paper-plane', 'Photo sent!');
      onClose();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setSendingTo(null);
    }
  };

  const shareExternal = () => {
    const url = `${window.location.origin}/gallery?photo=${photo.id}`;
    if (navigator.share) {
      navigator.share({ title: 'Check out this photo on SastiTripsWale', url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast('fa-solid fa-clipboard', 'Link copied!');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share photo" centered zIndex={Z_INDEX}>
      <button type="button" className="ig-flat-btn mb-3" style={{ width: '100%' }} onClick={shareExternal}>
        <i className="fa-solid fa-share-nodes" /> Share link / copy link
      </button>

      {loading ? (
        <Loader label="Loading conversations…" />
      ) : groups.length === 0 ? (
        <div className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>
          No conversations yet.
        </div>
      ) : (
        <div className="share-picker-list">
          {groups.map((g) => {
            const row = rowFor(g);
            return (
              <button
                key={g._id}
                type="button"
                className="share-picker-row"
                disabled={sendingTo === g._id}
                onClick={() => sendTo(g._id)}
              >
                <img
                  src={imageUrl(row.avatar, AVATAR_FALLBACK)}
                  alt=""
                  onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                />
                <span>{row.name}</span>
                {sendingTo === g._id && <span className="spinner" />}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
