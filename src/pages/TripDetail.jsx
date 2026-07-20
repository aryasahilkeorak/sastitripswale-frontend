import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, rupee, dateRange, tripDays, routeLabel, AVATAR_FALLBACK, DOC_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Loader from '../components/Loader.jsx';
import Lightbox from '../components/Lightbox.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import DestinationImage from '../components/DestinationImage.jsx';
import { useCanTrip, handleGateError } from '../components/useCanTrip.js';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const canTrip = useCanTrip();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lb, setLb] = useState(null);
  const hasPartnerInfo = Boolean(user?.partnerMobile && user?.partnerDocUrl);

  const load = () => {
    setLoading(true);
    api
      .get(`/trips/${id}`)
      .then((r) => setTrip(r.data.trip))
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const isFreshRequest = !trip?.requestStatus || trip.requestStatus === 'rejected';

  const needsCoupleInfo = trip?.isCouplesMode && isFreshRequest;

  const requestJoin = async () => {
    if (!canTrip()) return;
    if (needsCoupleInfo && !hasPartnerInfo) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/trips/${id}/interest`);
      const messages = { pending: 'Request sent! The host will review it.' };
      toast(data.requestStatus === 'pending' ? 'fa-solid fa-paper-plane' : 'fa-solid fa-hand', messages[data.requestStatus] || 'Request withdrawn');
      load();
    } catch (err) {
      if (!handleGateError(err, navigate)) toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const respond = async (userId, action) => {
    try {
      await api.patch(`/trips/${id}/requests/${userId}`, { action });
      toast(action === 'accept' ? 'fa-solid fa-handshake' : 'fa-solid fa-hand', action === 'accept' ? 'Request accepted' : 'Request declined');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const removeTrip = async () => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    try {
      await api.delete(`/trips/${id}`);
      toast('fa-solid fa-trash', 'Trip deleted');
      navigate('/dashboard');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const changeStatus = async (status) => {
    try {
      await api.put(`/trips/${id}`, { status });
      toast('fa-solid fa-circle-check', 'Trip status updated');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  if (loading) return <div style={{ paddingTop: 120 }}><Loader label="Loading trip…" /></div>;
  if (!trip)
    return (
      <div className="empty-state" style={{ paddingTop: 160 }}>
        <i className="fa-solid fa-triangle-exclamation" />
        <p>Trip not found.</p>
        <Link to="/trips" className="btn btn-primary mt-3">Browse trips</Link>
      </div>
    );

  const total = trip.totalSeats || 0;
  const filled = trip.filledSeats || 0;
  const reserved = trip.isCouplesMode ? 2 : 0;
  const seatsLeft = Math.max(0, total - reserved - filled);
  const pct = total ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const days = tripDays(trip.startDate, trip.endDate);
  const photos = (trip.photos || []).map((p) => imageUrl(p.photoUrl));
  const isOrganizer = user && trip.organizer && String(trip.organizer._id) === String(user.id);
  const isAdminViewer = user?.role === 'admin' || user?.role === 'superadmin';
  const coupleSafetyEntries = isAdminViewer
    ? [
        ...(trip.isCouplesMode ? [{ key: 'host', label: `${trip.organizer?.fullName} (host)`, mobile: trip.organizer?.partnerMobile, doc: trip.organizer?.partnerDocUrl }] : []),
        ...(trip.pendingRequests || [])
          .filter((r) => r.isCouple)
          .map((r) => ({ key: `p-${r._id}`, label: `${r.fullName} (pending)`, mobile: r.partnerMobile, doc: r.partnerDocUrl })),
        ...(trip.members || [])
          .filter((m) => m.isCouple)
          .map((m) => ({ key: `m-${m._id}`, label: `${m.fullName} (joined)`, mobile: m.partnerMobile, doc: m.partnerDocUrl })),
      ]
    : [];

  return (
    <>
      <section style={{ paddingTop: 110 }}>
        <div className="container">
          <Link to="/trips" style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-arrow-left" /> All trips
          </Link>

          <div className="detail-grid mt-3">
            {/* LEFT */}
            <div>
              <DestinationImage trip={trip} className="trip-hero-img" />

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {trip.vehicleType && <span className="badge badge-magenta">{trip.vehicleType}</span>}
                {trip.isCouplesMode && <span className="badge badge-magenta"><i className="fa-solid fa-heart" /> Couples Mode</span>}
                {days && <span className="badge badge-gold">{days} Days</span>}
                <span className={`badge ${trip.status === 'completed' ? 'badge-green' : 'badge-fire'}`}>{trip.status}</span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: '14px 0 6px' }}>
                {routeLabel(trip)}
              </h1>
              <p className="text-muted mb-3">
                <i className="fa-solid fa-location-dot" /> {trip.destination}
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
                      {m.fullName}{m.isCouple ? ' + partner' : ''}
                      {m.isVerified && <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} />}
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
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{trip.isCouplesMode ? 'Per couple' : 'Per head'}</div>
              <div className="trip-price" style={{ fontSize: '2rem' }}>{rupee(trip.isCouplesMode ? trip.budgetPerHead * 2 : trip.budgetPerHead)}</div>
              {trip.isCouplesMode && (
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  Fuel &amp; toll split with the host couple — cheaper &amp; comfier than public transport.
                </p>
              )}

              <div className="seats-bar mt-3"><div className="seats-fill" style={{ width: `${pct}%` }} /></div>
              {trip.isCouplesMode ? (
                <div className="row-between" style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                  <span>{Math.floor(filled / 2)} couple(s) joined</span>
                  <span style={{ color: seatsLeft < 2 ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>{Math.floor(seatsLeft / 2)} couple slot(s) left</span>
                </div>
              ) : (
                <div className="row-between" style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                  <span>{filled} joined</span>
                  <span style={{ color: seatsLeft <= 2 ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>{seatsLeft} seats left</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: 'var(--text-2)', margin: '18px 0' }}>
                <div><i className="fa-solid fa-calendar" style={{ color: 'var(--fire)' }} /> {dateRange(trip.startDate, trip.endDate)}</div>
                <div><i className="fa-solid fa-people-group" style={{ color: 'var(--fire)' }} /> {trip.interestCount} interested</div>
              </div>

              {/* Organizer */}
              {trip.organizer && (
                <Link to={`/members/${trip.organizer._id}`} className="member-pill" style={{ width: '100%', marginBottom: 14 }}>
                  <img src={imageUrl(trip.organizer.avatarUrl, AVATAR_FALLBACK)} alt={trip.organizer.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                  <span>
                    Organized by <strong>{trip.organizer.fullName}{trip.isCouplesMode ? ' + partner' : ''}</strong>
                  </span>
                </Link>
              )}

              {trip.status === 'upcoming' && needsCoupleInfo && !hasPartnerInfo && (
                <div className="couples-safety-alert">
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#fca5a5' }} />
                  <span>
                    Add your partner's mobile number and ID document in your{' '}
                    <Link to="/complete-profile" style={{ color: 'var(--fire-2)', textDecoration: 'underline' }}>profile</Link> to join couples-mode trips.
                  </span>
                </div>
              )}

              {trip.status === 'upcoming' && (
                <button
                  className={`btn btn-lg ${trip.requestStatus === 'accepted' ? 'btn-outline' : 'btn-primary'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={requestJoin}
                  disabled={busy || trip.requestStatus === 'pending' || (needsCoupleInfo && !hasPartnerInfo)}
                >
                  {busy ? <span className="spinner" /> : <i className={trip.requestStatus === 'accepted' ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />}
                  {trip.requestStatus === 'accepted'
                    ? ' Joined — leave'
                    : trip.requestStatus === 'pending'
                    ? ' Request pending'
                    : trip.requestStatus === 'rejected'
                    ? ' Request again'
                    : trip.isCouplesMode
                    ? ' Request to join as a couple'
                    : ' Request to join'}
                </button>
              )}

              {(isOrganizer || user?.role === 'admin') && trip.pendingRequests?.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-bdr)' }}>
                  <div className="text-muted" style={{ fontSize: '0.72rem', marginBottom: 8 }}>
                    <i className="fa-solid fa-inbox" /> Pending requests ({trip.pendingRequests.length})
                  </div>
                  {trip.pendingRequests.map((r) => (
                    <div key={r._id} className="row-between" style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={imageUrl(r.avatarUrl, AVATAR_FALLBACK)} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                        <span style={{ fontSize: '0.85rem' }}>{r.fullName}{r.isCouple ? ' + partner' : ''}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => respond(r._id, 'accept')}>Accept</button>
                        <button className="btn btn-sm btn-outline" onClick={() => respond(r._id, 'reject')}>Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(isOrganizer || user?.role === 'admin') && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-bdr)' }}>
                  <div className="text-muted" style={{ fontSize: '0.72rem', marginBottom: 8 }}>
                    <i className="fa-solid fa-gear" /> Organizer controls
                  </div>
                  <CustomSelect
                    className="mb-2"
                    value={trip.status}
                    onChange={(e) => changeStatus(e.target.value)}
                    options={[
                      { value: 'upcoming', label: 'Upcoming' },
                      { value: 'ongoing', label: 'Ongoing' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                  />
                  <Link to={`/trips/${id}/edit`} className="btn btn-sm btn-outline mb-2" style={{ width: '100%', justifyContent: 'center' }}>
                    <i className="fa-solid fa-pen-to-square" /> Edit Trip
                  </Link>
                  <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={removeTrip}>
                    <i className="fa-solid fa-trash" /> Delete Trip
                  </button>
                </div>
              )}

              {coupleSafetyEntries.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-bdr)' }}>
                  <div className="text-muted" style={{ fontSize: '0.72rem', marginBottom: 8 }}>
                    <i className="fa-solid fa-shield-halved" /> Couple safety info (admin only)
                  </div>
                  {coupleSafetyEntries.map((c) => (
                    <div key={c.key} className="row-between" style={{ marginBottom: 10, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem' }}>{c.label}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{c.mobile || 'No mobile on file'}</div>
                      </div>
                      {c.doc ? (
                        <a href={imageUrl(c.doc)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                          <i className="fa-solid fa-file-shield" /> View ID
                        </a>
                      ) : (
                        <img src={DOC_FALLBACK} alt="" style={{ width: 28, height: 28, opacity: 0.4 }} />
                      )}
                    </div>
                  ))}
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
