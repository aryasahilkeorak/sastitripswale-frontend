import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';

// Live "add member" search - queries the real member directory as you type
// (name, city, email, mobile, username or user ID all match, same as the
// Members page search) and lets you click a result to add them straight
// away. The typed text is still handed to `onAdd` as a manual fallback (via
// the Add button) for anyone the search doesn't surface.
export default function MemberSearchInput({ onAdd, busy, placeholder = 'Search by name, mobile, username, or user ID', submitLabel = 'Add' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get('/members', { params: { search: q, limit: 8 } })
        .then((r) => setResults(r.data.members || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const select = (member) => {
    onAdd(member.id);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const submitManual = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onAdd(query.trim());
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <form onSubmit={submitManual} className="search-bar mb-3">
        <i className="fa-solid fa-user-plus" style={{ color: 'var(--text-3)' }} />
        <input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        <button className="btn btn-sm btn-primary" disabled={busy || !query.trim()}>
          {busy ? <span className="spinner" /> : submitLabel}
        </button>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="member-search-dropdown">
          {loading ? (
            <div className="member-search-status">
              <span className="spinner" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="member-search-status">
              <i className="fa-solid fa-circle-info" /> No members found - use the Add button to try an exact ID, mobile, or email.
            </div>
          ) : (
            results.map((m) => (
              <button type="button" key={m.id} onMouseDown={(e) => e.preventDefault()} onClick={() => select(m)} className="member-search-row">
                <img
                  src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)}
                  alt=""
                  className="member-search-avatar"
                  onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="member-search-name">{m.fullName}</span>
                  <span className="member-search-meta">{m.city || 'India'}</span>
                </div>
                {m.isVerified && <i className="fa-solid fa-circle-check" style={{ color: 'var(--fire)', fontSize: '0.8rem' }} title="Verified" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
