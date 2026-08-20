import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import FollowButton from '../components/FollowButton.jsx';
import VerificationBadge from '../components/VerificationBadge.jsx';
import Loader from '../components/Loader.jsx';
import Seo from '../components/Seo.jsx';

// Shared by both /members/:id/followers and /members/:id/following -
// `mode` picks which endpoint/copy to use. Styled as an Instagram-style
// vertical list (avatar, name/username, Follow button) rather than the
// big-card grid used on the main Members directory.
export default function MemberFollowList({ mode }) {
  const { id } = useParams();
  const myId = useAuth((s) => s.user?.id);
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/members/${id}`).then((r) => setName(r.data.member.fullName)).catch(() => {});
    api
      .get(`/members/${id}/${mode}`, { params: { limit: 60 } })
      .then((r) => setMembers(r.data.members))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [id, mode]);

  const isFollowers = mode === 'followers';
  const isMyOwnFollowers = isFollowers && id === myId;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.fullName?.toLowerCase().includes(q) || m.username?.toLowerCase().includes(q)
    );
  }, [members, search]);

  const toggleSelect = (memberId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const cancelSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const removeSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Remove ${selected.size} follower${selected.size > 1 ? 's' : ''}? They can follow you again later.`)) return;
    setRemoving(true);
    try {
      await Promise.all([...selected].map((followerId) => api.delete(`/members/followers/${followerId}`)));
      setMembers((ms) => ms.filter((m) => !selected.has(m.id)));
      toast('fa-solid fa-user-minus', `Removed ${selected.size} follower${selected.size > 1 ? 's' : ''}`);
      cancelSelecting();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <Seo noindex title={`${isFollowers ? 'Followers' : 'Following'}${name ? ` - ${name}` : ''}`} />
      <PageHero
        tag="Community"
        tagIcon={isFollowers ? 'fa-solid fa-users' : 'fa-solid fa-user-check'}
        title={isFollowers ? 'Followers' : 'Following'}
        sub={name ? `Everyone ${isFollowers ? 'following' : 'followed by'} ${name}.` : ''}
      />
      <section style={{ paddingTop: 40 }}>
        <div className="container" style={{ maxWidth: 480 }}>
          <div className="row-between" style={{ alignItems: 'center', marginBottom: 20 }}>
            <Link to={`/members/${id}`} className="ig-id-btn" aria-label="Back to profile" title="Back to profile">
              <i className="fa-solid fa-arrow-left" />
            </Link>
            {isMyOwnFollowers && members.length > 0 && (
              <button type="button" className="btn btn-sm btn-outline" onClick={() => (selecting ? cancelSelecting() : setSelecting(true))}>
                {selecting ? 'Cancel' : 'Select'}
              </button>
            )}
          </div>

          {loading ? (
            <Loader label="Loading…" />
          ) : members.length === 0 ? (
            <div className="empty-state">
              <i className={isFollowers ? 'fa-solid fa-user-slash' : 'fa-solid fa-user-check'} />
              <p>{isFollowers ? 'No followers yet.' : 'Not following anyone yet.'}</p>
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 4 }}>
                <input
                  className="form-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                />
              </div>
              <div className="ig-follow-list">
                {filtered.map((m) => (
                  <div key={m.id} className="ig-follow-row">
                    {selecting ? (
                      <label className="ig-follow-avatar" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selected.has(m.id)}
                          onChange={() => toggleSelect(m.id)}
                          style={{ width: 20, height: 20 }}
                        />
                      </label>
                    ) : (
                      <Link to={`/members/${m.username || m.id}`} className="ig-follow-avatar">
                        <img
                          src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)}
                          alt={m.fullName}
                          onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                        />
                      </Link>
                    )}
                    <Link to={`/members/${m.username || m.id}`} className="ig-follow-info" onClick={(e) => selecting && e.preventDefault()}>
                      <strong>
                        {m.fullName}
                        <VerificationBadge role={m.role} verificationLevel={m.verificationLevel} isVerified={m.isVerified} icon />
                      </strong>
                      {m.username && <span className="text-muted">@{m.username}</span>}
                    </Link>
                    {!selecting && m.id !== myId && (
                      <FollowButton userId={m.id} isFollowed={m.isFollowedByMe} followsMe={m.followsMe} size="sm" />
                    )}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>No matches.</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {selecting && (
        <div
          className="card"
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 500,
            width: 'calc(100% - 32px)',
            maxWidth: 448,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>{selected.size} selected</span>
          <button type="button" className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={removeSelected} disabled={selected.size === 0 || removing}>
            {removing ? <span className="spinner" /> : <i className="fa-solid fa-user-minus" />} Remove
          </button>
        </div>
      )}
    </>
  );
}
