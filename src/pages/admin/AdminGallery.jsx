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
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setSelected(new Set());
    api.get('/admin/gallery', { params: { category: cat, limit: 60 } })
      .then((r) => setPhotos(r.data.photos))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [cat]);

  const toggleSelect = (id) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(photos.map((p) => p._id)));
  const clearSelection = () => setSelected(new Set());

  const remove = async (id) => {
    if (!window.confirm('Permanently delete this photo from the gallery?')) return;
    try {
      await api.delete(`/admin/gallery/${id}`);
      setPhotos((ps) => ps.filter((p) => p._id !== id));
      setSelected((s) => { const next = new Set(s); next.delete(id); return next; });
      toast('fa-solid fa-trash', 'Photo deleted');
    } catch (e) {
      toast('fa-solid fa-circle-xmark', apiError(e));
    }
  };

  const removeSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Permanently delete ${selected.size} selected photo(s)?`)) return;
    setBulkBusy(true);
    try {
      const ids = [...selected];
      await api.post('/admin/gallery/bulk-delete', { ids });
      setPhotos((ps) => ps.filter((p) => !selected.has(p._id)));
      setSelected(new Set());
      toast('fa-solid fa-trash', `${ids.length} photo(s) deleted`);
    } catch (e) {
      toast('fa-solid fa-circle-xmark', apiError(e));
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <>
      <div className="row-between mb-3" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="filter-chips" style={{ marginBottom: 0 }}>
          {CATS.map((c) => (
            <button key={c.key} className={`chip${cat === c.key ? ' active' : ''}`} onClick={() => setCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selected.size > 0 ? (
              <>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{selected.size} selected</span>
                <button className="btn btn-sm btn-outline" onClick={clearSelection}>Clear</button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                  onClick={removeSelected}
                  disabled={bulkBusy}
                >
                  {bulkBusy ? <span className="spinner" /> : <i className="fa-solid fa-trash" />} Delete selected ({selected.size})
                </button>
              </>
            ) : (
              <button className="btn btn-sm btn-outline" onClick={selectAll}>
                <i className="fa-regular fa-square-check" /> Select all
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : photos.length === 0 ? (
        <div className="empty-state"><i className="fa-regular fa-image" /><p>No photos in this category.</p></div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {photos.map((p) => (
            <div
              className="card"
              style={{ padding: 10, position: 'relative', outline: selected.has(p._id) ? '2px solid var(--fire)' : 'none' }}
              key={p._id}
            >
              <label
                style={{ position: 'absolute', top: 18, left: 18, zIndex: 1, width: 20, height: 20, cursor: 'pointer' }}
                title="Select"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p._id)}
                  onChange={() => toggleSelect(p._id)}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
              </label>
              <img
                src={imageUrl(p.photoUrl)}
                alt={p.caption || 'Gallery'}
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
              />
              <div className="row-between mt-2" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  {p.caption && <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.caption}</div>}
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Uploaded by {p.user?.fullName || '—'} · {timeAgo(p.createdAt)}
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
