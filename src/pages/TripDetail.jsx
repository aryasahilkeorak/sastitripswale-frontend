import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, rupee, dateRange, tripDays, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Loader from '../components/Loader.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { useCanTrip, handleGateError } from '../components/useCanTrip.js';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const accessToken = useAuth((s) => s.accessToken);
  const canTrip = useCanTrip();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lb, setLb] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get(`/trips/${id}`)
      .then((r) => setTrip(r.data.trip))
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const toggleInterest = async () => {
    if (!canTrip()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/trips/${id}/interest`);
      toast(data.interested ? '🔥' : '👋', data.interested ? 'You joined this trip!' : 'Interest removed');
      load();
    } catch (err) {
      if (!handleGateError(err, navigate)) toast('❌', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const openChat = async () => {
    if (!accessToken) {
      toast('🔒', 'Log in to open the trip chat');
      navigate('/login');
      return;
    }
    try {
      const { data } = await api.get(`/chat/trip/${id}`);
      navigate(`/chat/${data.groupId}`);
    } catch (err) {
      toast('💬', apiError(err, 'Only the organizer and joined members can chat'));
    }
  };

  const removeTrip = async () => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    try {
      await api.delete(`/trips/${id}`);
      toast('🗑️', 'Trip deleted');
      navigate('/dashboard');
    } catch (err) {
      toast('❌', apiError(err));
    }
  };

  const changeStatus = async (status) => {
    try {
      await api.put(`/trips/${id}`, { status });
      toast('✅', 'Trip status updated');
      load();
    } catch (err) {
      toast('❌', apiError(err));
    }
  };

  if (loading) return <div style={{ paddingTop: 120 }}><Loader label="Loading trip…" /></div>;
  if (!trip)
    return (
      <div className="empty-state" style={{ paddingTop: 160 }}>
        <i className="ri-error-warning-line" />
        <p>Trip not found.</p>
        <Link to="/trips" className="btn btn-primary mt-3">Browse trips</Link>
      </div>
    );

  const total = trip.totalSeats || 0;
  const filled = trip.filledSeats || 0;
  const seatsLeft = Math.max(0, total - filled);
  const pct = total ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const days = tripDays(trip.startDate, trip.endDate);
  const photos = (trip.photos || []).map((p) => imageUrl(p.photoUrl));
  const isOrganizer = user && trip.organizer && String(trip.organizer._id) === String(user.id);

  return (
    <>
      <section style={{ paddingTop: 110 }}>
        <div className="container">
          <Link to="/trips" style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
            <i className="ri-arrow-left-line" /> All trips
          </Link>

          <div className="detail-grid mt-3">
            {/* LEFT */}
            <div>
              <img className="trip-hero-img" src={imageUrl(trip.coverImageUrl, `https://picsum.photos/seed/${trip._id}/1000/600`)} alt={trip.destination} />

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {trip.vehicleType && <span className="badge badge-magenta">{trip.vehicleType}</span>}
                {days && <span className="badge badge-gold">{days} Days</span>}
                <span className={`badge ${trip.status === 'completed' ? 'badge-green' : 'badge-fire'}`}>{trip.status}</span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: '14px 0 6px' }}>
                {trip.title || trip.destination}
              </h1>
              <p className="text-muted mb-3">
                <i className="ri-map-pin-line" /> {trip.destination}
                {trip.pickupLocation ? ` · Pickup: ${trip.pickupLocation}` : ''}
              </p>

              {trip.description && <p style={{ color: 'var(--text-2)', lineHeight: 1.85 }}>{trip.description}</p>}

              {/* Members */}
              <h3 className="section-title" style={{ fontSize: '1.3rem', margin: '28px 0 14px' }}>
                Who's <span className="highlight">going</span>
              </h3>
              {trip.members?.length ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {trip.members.map((m) => (
                    <Link key={m._id} to={`/members/${m._id}`} className="member-pill">
                      <img src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)} alt={m.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                      {m.fullName}
                      {m.isVerified && <i className="ri-verified-badge-fill" style={{ color: '#6ee7b7' }} />}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No one has joined yet — be the first!</p>
              )}

              {/* Expenses (completed) */}
              {trip.expenses?.length > 0 && (
                <>
                  <h3 className="section-title" style={{ fontSize: '1.3rem', margin: '28px 0 8px' }}>
                    Expense <span className="highlight">breakdown</span>
                  </h3>
                  <table className="expense-table">
                    <tbody>
                      {trip.expenses.map((ex, i) => (
                        <tr key={i}>
                          <td style={{ textTransform: 'capitalize' }}>{ex.category}{ex.description ? ` — ${ex.description}` : ''}</td>
                          <td>{rupee(ex.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Photos */}
              {photos.length > 0 && (
                <>
                  <h3 className="section-title" style={{ fontSize: '1.3rem', margin: '28px 0 14px' }}>
                    Trip <span className="highlight">photos</span>
                  </h3>
                  <div className="masonry">
                    {trip.photos.map((p, i) => (
                      <div className="masonry-item" key={p._id} onClick={() => setLb(i)}>
                        <img src={imageUrl(p.photoUrl)} alt={p.caption || 'Trip'} loading="lazy" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* RIGHT — sticky action card (static on mobile) */}
            <div className="card trip-side-card" style={{ padding: 24 }}>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Per head</div>
              <div className="trip-price" style={{ fontSize: '2rem' }}>{rupee(trip.budgetPerHead)}</div>

              <div className="seats-bar mt-3"><div className="seats-fill" style={{ width: `${pct}%` }} /></div>
              <div className="row-between" style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                <span>{filled} joined</span>
                <span style={{ color: seatsLeft <= 2 ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>{seatsLeft} seats left</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: 'var(--text-2)', margin: '18px 0' }}>
                <div><i className="ri-calendar-line" style={{ color: 'var(--fire)' }} /> {dateRange(trip.startDate, trip.endDate)}</div>
                <div><i className="ri-team-line" style={{ color: 'var(--fire)' }} /> {trip.interestCount} interested</div>
              </div>

              {/* Organizer */}
              {trip.organizer && (
                <Link to={`/members/${trip.organizer._id}`} className="member-pill" style={{ width: '100%', marginBottom: 14 }}>
                  <img src={imageUrl(trip.organizer.avatarUrl, AVATAR_FALLBACK)} alt={trip.organizer.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                  <span>Organized by <strong>{trip.organizer.fullName}</strong></span>
                </Link>
              )}

              {trip.status === 'upcoming' && (
                <button className={`btn btn-lg ${trip.isInterested ? 'btn-outline' : 'btn-primary'}`} style={{ width: '100%', justifyContent: 'center' }} onClick={toggleInterest} disabled={busy}>
                  {busy ? <span className="spinner" /> : <i className={trip.isInterested ? 'ri-heart-fill' : 'ri-heart-line'} />}
                  {trip.isInterested ? ' Joined — leave' : ' Show Interest'}
                </button>
              )}

              {(trip.isInterested || isOrganizer || user?.role === 'admin') && (
                <button className="btn btn-lg btn-neon mt-2" style={{ width: '100%', justifyContent: 'center' }} onClick={openChat}>
                  <i className="ri-chat-3-line" /> Open Trip Chat
                </button>
              )}

              {trip.whatsappGroup && (
                <a href={trip.whatsappGroup} target="_blank" rel="noreferrer" className="btn btn-lg mt-2" style={{ width: '100%', justifyContent: 'center', background: '#25D366', color: '#06070d' }}>
                  <i className="ri-whatsapp-line" /> WhatsApp Group
                </a>
              )}

              {(isOrganizer || user?.role === 'admin') && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-bdr)' }}>
                  <div className="text-muted" style={{ fontSize: '0.72rem', marginBottom: 8 }}>
                    <i className="ri-settings-3-line" /> Organizer controls
                  </div>
                  <select className="form-input mb-2" value={trip.status} onChange={(e) => changeStatus(e.target.value)}>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={removeTrip}>
                    <i className="ri-delete-bin-line" /> Delete Trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Lightbox images={photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
    </>
  );
}
