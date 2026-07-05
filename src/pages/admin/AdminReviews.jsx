import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { timeAgo } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';
import Stars from '../../components/Stars.jsx';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const load = () => api.get('/admin/reviews').then((r) => setReviews(r.data.reviews)).catch(() => {});
  useEffect(() => { load(); }, []);

  const feature = async (id, featured) => {
    try { await api.patch(`/admin/reviews/${id}/feature`, { featured }); setReviews((rs) => rs.map((r) => (r._id === id ? { ...r, isFeatured: featured } : r))); toast('fa-solid fa-star', featured ? 'Featured' : 'Unfeatured'); }
    catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try { await api.delete(`/admin/reviews/${id}`); setReviews((rs) => rs.filter((r) => r._id !== id)); toast('fa-solid fa-trash', 'Review deleted'); }
    catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };

  if (reviews.length === 0) return <div className="empty-state"><i className="fa-solid fa-star" /><p>No reviews yet.</p></div>;

  return (
    <div className="grid-2">
      {reviews.map((r) => (
        <div className="card" style={{ padding: 20 }} key={r._id}>
          <div className="row-between mb-2">
            <div>
              <strong style={{ fontSize: '0.9rem' }}>{r.user?.fullName || '—'}</strong>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{r.tripDestination || r.user?.city} · {timeAgo(r.createdAt)}</div>
            </div>
            <Stars value={r.rating} />
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', lineHeight: 1.6 }}>{r.message}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className={`btn btn-sm ${r.isFeatured ? 'btn-primary' : 'btn-outline'}`} onClick={() => feature(r._id, !r.isFeatured)}>
              <i className="fa-solid fa-star" /> {r.isFeatured ? 'Featured' : 'Feature'}
            </button>
            <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => remove(r._id)}><i className="fa-solid fa-trash" /> Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
