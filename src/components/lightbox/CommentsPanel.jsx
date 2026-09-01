import { useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl, timeAgo, AVATAR_FALLBACK } from '../../lib/helpers.js';
import { useAuth } from '../../store/auth.js';

export default function CommentsPanel({ photoOwnerId, comments, loading, onSubmit, onDelete }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const user = useAuth((s) => s.user);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onSubmit(trimmed);
      setText('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ig-comments-panel">
      <div className="ig-comments-list">
        {loading ? (
          <div className="ig-comments-loading"><span className="spinner" /></div>
        ) : comments.length === 0 ? (
          <div className="text-muted" style={{ fontSize: '0.82rem', padding: '14px 0', textAlign: 'center' }}>
            No comments yet - be the first.
          </div>
        ) : (
          comments.map((c) => {
            const canDelete = user && (String(c.user?._id) === String(user.id) || String(photoOwnerId) === String(user.id));
            return (
              <div key={c._id} className="ig-comment-row">
                <img
                  className="ig-comment-avatar"
                  src={imageUrl(c.user?.avatarUrl, AVATAR_FALLBACK)}
                  alt=""
                  onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                />
                <div className="ig-comment-body">
                  <span>
                    <Link to={`/members/${c.user?.username || c.user?._id}`} className="ig-comment-username">
                      {c.user?.fullName}
                    </Link>{' '}
                    {c.text}
                  </span>
                  <div className="ig-comment-time">{timeAgo(c.createdAt)}</div>
                </div>
                {canDelete && (
                  <button className="ig-comment-delete" onClick={() => onDelete(c._id)} aria-label="Delete comment">
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
      <form className="ig-comment-form" onSubmit={submit}>
        <input
          className="form-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          maxLength={500}
        />
        <button className="btn btn-sm btn-primary" disabled={busy || !text.trim()}>
          {busy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />}
        </button>
      </form>
    </div>
  );
}
