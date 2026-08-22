import { useEffect, useRef, useState } from 'react';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, timeAgo, NORTH_INDIA_GALLERY } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import Loader from '../components/Loader.jsx';
import Lightbox from '../components/Lightbox.jsx';
import AdSlot from '../components/AdSlot.jsx';
import Seo from '../components/Seo.jsx';

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
      toast('fa-solid fa-camera', 'Photo uploaded to the community gallery!');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Fall back to curated North India shots whenever the real (member-uploaded)
  // gallery has nothing for the selected category yet, so the page is never empty.
  const fallback = photos.length === 0 ? NORTH_INDIA_GALLERY.filter((g) => cat === 'all' || g.category === cat) : [];
  const imgs = photos.length ? photos.map((p) => imageUrl(p.photoUrl)) : fallback.map((g) => g.url);

  return (
    <>
      <Seo
        title="Trip Photos - Community Gallery"
        description="Real photos from real SastiTripsWale trips - bike rides, road trips, treks, beaches and camping shared by verified members across India."
        path="/gallery"
      />
      <PageHero tag="Trip Memories" tagIcon="fa-solid fa-image" title="Community" highlight="Gallery" sub="Real photos from real trips shared by our members." />

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
                  {uploading ? <span className="spinner" /> : <i className="fa-solid fa-upload" />} Share Photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
              </>
            )}
          </div>

          <AdSlot placement="gallery" />

          {loading ? (
            <Loader label="Loading gallery…" />
          ) : photos.length > 0 ? (
            <div className="masonry">
              {photos.map((p, i) => (
                <div className="masonry-item" key={p._id} onClick={() => setLb(i)}>
                  <img className="gallery-img" src={imageUrl(p.photoUrl)} alt={p.caption || 'Trip'} loading="lazy" />
                  {(p.caption || p.user?.fullName) && (
                    <div className="masonry-cap">
                      {p.caption && <div style={{ fontWeight: 600 }}>{p.caption}</div>}
                      {p.user?.fullName && (
                        <div style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>
                          by {p.user.fullName} · {timeAgo(p.createdAt)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : fallback.length > 0 ? (
            <div className="masonry">
              {fallback.map((g, i) => (
                <div className="masonry-item" key={g.url} onClick={() => setLb(i)}>
                  <img className="gallery-img" src={g.url} alt={g.place} loading="lazy" />
                  <div className="masonry-cap">
                    <div style={{ fontWeight: 600 }}>{g.place}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><i className="fa-regular fa-image" /><p>No photos yet in this category.</p></div>
          )}
        </div>
      </section>

      <Lightbox images={imgs} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
    </>
  );
}
