import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';

// One-directional follow/unfollow - no approval needed, separate from the
// mutual Connection system's Connect button.
export default function FollowButton({ userId, isFollowed, followsMe = false, onChange, size = 'sm', block = false, className }) {
  const navigate = useNavigate();
  const accessToken = useAuth((s) => s.accessToken);
  const [following, setFollowing] = useState(Boolean(isFollowed));
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e?.preventDefault();
    if (!accessToken) {
      toast('fa-solid fa-lock', 'Log in to follow members');
      navigate('/login');
      return;
    }
    setBusy(true);
    const next = !following;
    try {
      if (next) await api.post(`/members/${userId}/follow`);
      else await api.delete(`/members/${userId}/follow`);
      setFollowing(next);
      onChange?.(next);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={className || `btn btn-${size} ${following ? 'btn-outline' : 'btn-primary'}`}
      style={block ? { width: '100%', justifyContent: 'center' } : undefined}
      onClick={toggle}
      disabled={busy}
    >
      <i className={following ? 'fa-solid fa-user-check' : 'fa-solid fa-user-plus'} /> {following ? 'Following' : followsMe ? 'Follow Back' : 'Follow'}
    </button>
  );
}
