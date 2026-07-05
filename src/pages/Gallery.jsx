import { useEffect, useRef, useState } from 'react';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import Loader from '../components/Loader.jsx';
import Lightbox from '../components/Lightbox.jsx';

const CATS = [
  { key: 'all', label: 'All' },
  { key: 'bike', label: 'Bike' },
  { key: 'car', label: 'Car' },
  { key: 'mountain', label: 'Mountains' },
  { key: 'beach', label: 'Beaches' },
  { key: 'camp', label: 'Camping' },
  { key: 'group', label: 'Group' },
];

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [lb, setLb] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const accessToken = useAuth((s) => s.accessToken);

  const load = () => {
    setLoading(true);
    api
      .get('/gallery', { params: { category: cat, limit: 60 } })
      .then((r) => setPhotos(r.data.photos))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [cat]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('category', cat === 'all' ? 'other' : cat);
    setUploading(true);
    try {
      await api.post('/gallery', fd);
      toast('📸', 'Photo uploaded to the community gallery!');
      load();
    } catch (err) {
      toast('❌', apiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const imgs = photos.map((p) => imageUrl(p.photoUrl));

  return (
    <>
      <PageHero tag="Trip Memories" tagIcon="ri-image-fill" title="Community" highlight="Gallery" sub="Real photos from real trips shared by our members." />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="row-between mb-3">
            <div className="filter-chips" style={{ marginBottom: 0 }}>
              {CATS.map((c) => (
                <button key={c.key} className={`chip${cat === c.key ? ' active' : ''}`} onClick={() => setCat(c.key)}>
                  {c.label}
                </button>
              ))}
            </div>
            {accessToken && (
              <>
                <button className="btn btn-sm btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <span className="spinner" /> : <i className="ri-upload-2-line" />} Share Photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
              </>
            )}
          </div>

          {loading ? (
            <Loader label="Loading gallery…" />
          ) : photos.length === 0 ? (
            <div className="empty-state"><i className="ri-image-line" /><p>No photos yet in this category.</p></div>
          ) : (
            <div className="masonry">
              {photos.map((p, i) => (
                <div className="masonry-item" key={p._id} onClick={() => setLb(i)}>
                  <img className="gallery-img" src={imageUrl(p.photoUrl)} alt={p.caption || 'Trip'} loading="lazy" />
                  {(p.caption || p.user?.fullName) && (
                    <div className="masonry-cap">
                      {p.caption && <div style={{ fontWeight: 600 }}>{p.caption}</div>}
                      {p.user?.fullName && <div style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>by {p.user.fullName}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Lightbox images={imgs} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
    </>
  );
}
