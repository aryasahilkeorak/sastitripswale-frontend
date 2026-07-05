import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import Stars from '../components/Stars.jsx';
import Loader from '../components/Loader.jsx';

export default function Testimonials() {
  const accessToken = useAuth((s) => s.accessToken);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, count: 0, breakdown: {} });
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [destination, setDestination] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/reviews', { params: { limit: 30 } })
      .then((r) => {
        setReviews(r.data.reviews);
        setStats(r.data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/reviews', { rating, message, tripDestination: destination });
      toast('fa-solid fa-star', 'Review submitted — thank you for sharing!');
      setMessage('');
      setDestination('');
      setRating(5);
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const total = stats.count || 0;

  return (
    <>
      <PageHero tag="Member Stories" tagIcon="fa-solid fa-quote-left" title="What Travelers" highlight="Say" sub="Honest reviews from members who found their tribe." />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          {/* Overall stats */}
          <div className="grid-2 mb-4" style={{ alignItems: 'center' }}>
            <div className="card" style={{ padding: 28, textAlign: 'center' }}>
              <div className="stat-number" style={{ background: 'var(--grad-fire)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.average || '5.0'}</div>
              <Stars value={stats.average || 5} />
              <p className="text-muted mt-2">{total} member reviews</p>
            </div>
            <div className="card" style={{ padding: 28 }}>
              {[5, 4, 3, 2, 1].map((n) => {
                const c = stats.breakdown?.[n] || 0;
                const pct = total ? Math.round((c / total) * 100) : 0;
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ width: 30, fontSize: '0.8rem', color: 'var(--text-3)' }}>{n}★</span>
                    <div className="seats-bar" style={{ flex: 1, margin: 0, height: 6 }}><div className="seats-fill" style={{ width: `${pct}%` }} /></div>
                    <span style={{ width: 34, fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'right' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write a review */}
          {accessToken ? (
            <form className="card mb-4" style={{ padding: 28 }} onSubmit={submit}>
              <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Write a review</h3>
              <div className="form-group">
                <label>Your rating</label>
                <div className="star-rating" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`star-btn${n <= (hover || rating) ? ' selected' : ''}`}
                      onMouseEnter={() => setHover(n)}
                      onClick={() => setRating(n)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group"><label>Trip / destination (optional)</label><input className="form-input" value={destination} onChange={(e) => setDestination(e.target.value)} /></div>
              <div className="form-group"><label>Your review *</label><textarea className="form-input" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share your experience…" /></div>
              <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />} Submit review</button>
            </form>
          ) : (
            <div className="card mb-4" style={{ padding: 20, textAlign: 'center' }}>
              <span className="text-muted"><Link to="/login">Log in</Link> to write a review.</span>
            </div>
          )}

          {/* Reviews grid */}
          {loading ? (
            <Loader />
          ) : reviews.length === 0 ? (
            <div className="empty-state"><i className="fa-solid fa-comment-dots" /><p>No reviews yet — be the first!</p></div>
          ) : (
            <div className="grid-3">
              {reviews.map((r) => (
                <div className="card fade-up" style={{ padding: 24 }} key={r._id}>
                  <i className="fa-solid fa-quote-left" style={{ color: 'var(--fire)', fontSize: '1.6rem' }} />
                  <p style={{ color: 'var(--text-2)', lineHeight: 1.8, margin: '8px 0 16px', fontSize: '0.9rem' }}>{r.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={imageUrl(r.user?.avatarUrl, AVATAR_FALLBACK)} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{r.user?.fullName || 'Traveler'}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{r.tripDestination || r.user?.city}</div>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
