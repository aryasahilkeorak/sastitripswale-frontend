import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { imageUrl, timeAgo } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';
import Loader from '../../components/Loader.jsx';

const CATS = [
  { key: 'all', label: 'All' },
  { key: 'bike', label: 'Bike' },
  { key: 'car', label: 'Car' },
  { key: 'mountain', label: 'Mountains' },
  { key: 'beach', label: 'Beaches' },
  { key: 'camp', label: 'Camping' },
  { key: 'group', label: 'Group' },
  { key: 'other', label: 'Other' },
];

export default function AdminGallery() {
  const [photos, setPhotos] = useState([]);
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/gallery', { params: { category: cat, limit: 60 } })
      .then((r) => setPhotos(r.data.photos))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [cat]);

  const remove = async (id) => {
    if (!window.confirm('Permanently delete this photo from the gallery?')) return;
    try {
      await api.delete(`/admin/gallery/${id}`);
      setPhotos((ps) => ps.filter((p) => p._id !== id));
      toast('fa-solid fa-trash', 'Photo deleted');
    } catch (e) {
      toast('fa-solid fa-circle-xmark', apiError(e));
    }
  };

  return (
    <>
      <div className="filter-chips mb-3">
        {CATS.map((c) => (
          <button key={c.key} className={`chip${cat === c.key ? ' active' : ''}`} onClick={() => setCat(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : photos.length === 0 ? (
        <div className="empty-state"><i className="fa-regular fa-image" /><p>No photos in this category.</p></div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {photos.map((p) => (
            <div className="card" style={{ padding: 10 }} key={p._id}>
              <img
                src={imageUrl(p.photoUrl)}
                alt={p.caption || 'Gallery'}
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
              />
              <div className="row-between mt-2" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  {p.caption && <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.caption}</div>}
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {p.user?.fullName || '—'} · {timeAgo(p.createdAt)}
                  </div>
                  <span className="badge badge-cyan" style={{ marginTop: 4 }}>{p.category}</span>
                </div>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', flexShrink: 0 }}
                  onClick={() => remove(p._id)}
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
