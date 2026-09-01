import { useEffect, useRef, useState } from 'react';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, timeAgo, NORTH_INDIA_GALLERY } from '../lib/helpers.js';
import { toPostShape } from '../lib/galleryPost.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import Loader from '../components/Loader.jsx';
import Lightbox from '../components/Lightbox.jsx';
import Modal from '../components/Modal.jsx';
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
  const [pendingFile, setPendingFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
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

  // A shared photo's copied link (`?photo=<id>`, see SharePhotoModal) opens
  // straight to that photo once the feed has loaded.
  useEffect(() => {
    if (loading) return;
    const photoId = new URLSearchParams(window.location.search).get('photo');
    if (!photoId) return;
    const idx = photos.findIndex((p) => p._id === photoId);
    if (idx >= 0) setLb(idx);
  }, [loading, photos]);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setCaption('');
    setLocation('');
  };

  const submitUpload = async (e) => {
    e.preventDefault();
    if (!pendingFile) return;
    const fd = new FormData();
    fd.append('photo', pendingFile);
    fd.append('category', cat === 'all' ? 'other' : cat);
    if (caption.trim()) fd.append('caption', caption.trim());
    if (location.trim()) fd.append('location', location.trim());
    setUploading(true);
    try {
      await api.post('/gallery', fd);
      toast('fa-solid fa-camera', 'Photo uploaded to the community gallery!');
      setPendingFile(null);
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleLike = async (photoId) => {
    try {
      const { data } = await api.post(`/gallery/${photoId}/like`);
      setPhotos((prev) => prev.map((p) => (p._id === photoId ? { ...p, likedByMe: data.liked, likesCount: data.likesCount } : p)));
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const handleRepost = async (photoId) => {
    try {
      const { data } = await api.post(`/gallery/${photoId}/repost`);
      setPhotos((prev) => [data.photo, ...prev]);
      toast('fa-solid fa-retweet', 'Reposted to your profile!');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  // Fall back to curated North India shots whenever the real (member-uploaded)
  // gallery has nothing for the selected category yet, so the page is never empty.
  const usingFallback = photos.length === 0;
  const fallback = usingFallback ? NORTH_INDIA_GALLERY.filter((g) => cat === 'all' || g.category === cat) : [];
  const posts = photos.map((p) => toPostShape(p));

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
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
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

      {usingFallback ? (
        <Lightbox images={fallback.map((g) => g.url)} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
      ) : (
        <Lightbox posts={posts} index={lb} onClose={() => setLb(null)} onIndex={setLb} onLike={handleLike} onRepost={handleRepost} />
      )}

      <Modal open={Boolean(pendingFile)} onClose={() => (uploading ? null : setPendingFile(null))} title="Share a photo" centered>
        <form onSubmit={submitUpload}>
          <div className="form-group">
            <label>Caption (optional)</label>
            <input className="form-input" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} placeholder="Say something about this photo…" />
          </div>
          <div className="form-group">
            <label>Location (optional)</label>
            <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} placeholder="e.g. Rishikesh, Uttarakhand" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={uploading}>
            {uploading ? <span className="spinner" /> : <i className="fa-solid fa-upload" />} Post
          </button>
        </form>
      </Modal>
    </>
  );
}
