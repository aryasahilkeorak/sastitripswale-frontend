import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, rupee, dateRange, tripDays, routeLabel, timeAgo, AVATAR_FALLBACK, DOC_FALLBACK, BUDGET_INCLUDES_LABEL } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Loader from '../components/Loader.jsx';
import Lightbox from '../components/Lightbox.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import DestinationImage from '../components/DestinationImage.jsx';
import Stars from '../components/Stars.jsx';
import { useCanTrip, handleGateError } from '../components/useCanTrip.js';
import Seo from '../components/Seo.jsx';
import { buildBreadcrumbLd } from '../lib/seo.js';

// Same mapping used by TripCard/CompletedTripCard, so a trip's vehicle
// badge looks identical whether seen on a listing card or this detail page.
const VEHICLE_BADGE = {
  Bike: { cls: 'badge-magenta', icon: 'fa-solid fa-motorcycle' },
  Car: { cls: 'badge-green', icon: 'fa-solid fa-car' },
  Bus: { cls: 'badge-cyan', icon: 'fa-solid fa-bus' },
  Train: { cls: 'badge-cyan', icon: 'fa-solid fa-train' },
  Mixed: { cls: 'badge-gold', icon: 'fa-solid fa-route' },
};

// One "how was it travelling with this person" card per co-traveler on a
// completed trip - distinct from the trip-level review below. Defined at
// module scope (not nested in TripDetail) so it isn't torn down and
// rebuilt on every parent re-render.
function MemberRatingCard({ person, existing, onSubmit }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState(existing?.message || '');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(!existing);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setBusy(true);
    try {
      await onSubmit(rating, message);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (!editing && existing) {
    return (
      <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={imageUrl(person.avatarUrl, AVATAR_FALLBACK)}
          alt=""
          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{person.fullName}</div>
          <Stars value={rating} />
          {message && <p className="text-muted" style={{ fontSize: '0.78rem', margin: '4px 0 0' }}>{message}</p>}
        </div>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(true)}>Edit</button>
      </div>
    );
  }

  return (
    <form className="card" style={{ padding: 14 }} onSubmit={submit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <img
          src={imageUrl(person.avatarUrl, AVATAR_FALLBACK)}
          alt=""
          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
        />
        <strong style={{ fontSize: '0.88rem' }}>{person.fullName}</strong>
      </div>
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
      <textarea
        className="form-input mt-2"
        maxLength={500}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`Optional note about travelling with ${person.fullName}`}
      />
      <button className="btn btn-sm btn-primary mt-2" disabled={busy || !rating}>
        {busy ? <span className="spinner" /> : <i className="fa-solid fa-star" />} {existing ? 'Update rating' : 'Submit rating'}
      </button>
    </form>
  );
}

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const canTrip = useCanTrip();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lb, setLb] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  const hasPartnerInfo = Boolean(user?.partnerMobile && user?.partnerDocUrl);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get(`/trips/${id}`)
      .then((r) => setTrip(r.data.trip))
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  // Seed the review form from the member's existing review (if any) once
  // the trip loads, so re-submitting edits it instead of starting blank.
  useEffect(() => {
    if (trip?.myReview) {
      setReviewRating(trip.myReview.rating);
      setReviewMessage(trip.myReview.message);
    }
  }, [trip?.myReview]);

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

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      await api.post(`/trips/${id}/photos`, fd);
      toast('fa-solid fa-images', 'Photo added to the trip gallery!');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewBusy(true);
    try {
      await api.post(`/trips/${id}/reviews`, { rating: reviewRating, message: reviewMessage });
      toast('fa-solid fa-star', trip?.myReview ? 'Review updated!' : 'Review posted - thanks for sharing!');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setReviewBusy(false);
    }
  };

  const rateMember = async (rateeId, rating, message) => {
    try {
      await api.post(`/trips/${id}/member-reviews`, { rateeId, rating, message });
      toast('fa-solid fa-star', 'Rating saved!');
      load();
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

  if (loading) return <div className="detail-section-loading"><Loader label="Loading trip…" /></div>;
  if (!trip)
    return (
      <div className="empty-state detail-section-empty">
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
  const vb = VEHICLE_BADGE[trip.vehicleType] || { cls: 'badge-fire', icon: 'fa-solid fa-location-dot' };
  const photos = (trip.photos || []).map((p) => imageUrl(p.photoUrl));
  const isOrganizer = user && trip.organizer && String(trip.organizer._id) === String(user.id);
  const isAdminViewer = user?.role === 'admin' || user?.role === 'superadmin';
  // Strictly trip members only (not admins) - matches the backend check.
  const canAddPhoto = Boolean(isOrganizer || trip.requestStatus === 'accepted');
  // Everyone else who was actually on the trip - organizer plus accepted
  // co-travelers, minus the viewer themself - available to rate.
  const otherParticipants = [
    ...(trip.organizer && !isOrganizer ? [trip.organizer] : []),
    ...(trip.members || []).filter((m) => String(m._id) !== String(user?.id)),
  ];
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
      <Seo
        title={`${trip.destination} Trip - Join or Split Costs`}
        description={`Join this ${trip.destination} trip on SastiTripsWale for ${rupee(trip.budgetPerHead)}/person. ${Math.max(0, (trip.totalSeats || 0) - (trip.filledSeats || 0))} seats left - verified co-travelers, split expenses, travel safely together.`}
        path={`/trips/${trip._id}`}
        image={trip.coverImageUrl ? imageUrl(trip.coverImageUrl) : undefined}
        jsonLd={buildBreadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Trips', path: '/trips' },
          { name: trip.destination },
        ])}
      />
      <section className="detail-section">
        <div className="container">
          <Link to="/trips" className="ig-id-btn" aria-label="All trips" title="All trips">
            <i className="fa-solid fa-arrow-left" />
          </Link>

          <div className="detail-grid mt-3">
            {/* LEFT */}
            <div>
              <DestinationImage trip={trip} className="trip-hero-img" />

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {trip.vehicleType && (
                  <span className={`badge ${vb.cls}`}>
                    <i className={vb.icon} /> {trip.vehicleType}
                  </span>
                )}
                {trip.isCouplesMode && <span className="badge badge-magenta"><i className="fa-solid fa-heart" /> Couples Mode</span>}
                {trip.genderPreference && trip.genderPreference !== 'Any' && (
                  <span className="badge badge-magenta">
                    <i className={trip.genderPreference === 'Male' ? 'fa-solid fa-mars' : 'fa-solid fa-venus'} /> {trip.genderPreference} only
                  </span>
                )}
                {days && <span className="badge badge-gold">{days} Days</span>}
                {trip.status === 'completed' ? (
                  <span className="badge badge-green"><i className="fa-solid fa-trophy" /> Completed</span>
                ) : (
                  <span className={`badge ${trip.status === 'cancelled' ? 'badge-red' : 'badge-fire'}`}>{trip.status}</span>
                )}
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
                    <Link key={m._id} to={`/members/${m.username || m._id}`} className="member-pill">
                      <img src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)} alt={m.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                      {m.fullName}{m.isCouple ? ' + partner' : ''}
                      {m.isVerified && <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} />}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No one has joined yet - be the first!</p>
              )}

              {/* Rate co-travelers - only once the trip is over, only for
                  people who were actually on it. */}
              {trip.canRateMembers && otherParticipants.length > 0 && (
                <>
                  <h3 className="section-title" style={{ fontSize: '1.3rem', margin: '28px 0 14px' }}>
                    Rate your <span className="highlight">co-travelers</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {otherParticipants.map((p) => (
                      <MemberRatingCard
                        key={p._id}
                        person={p}
                        existing={trip.myMemberReviews?.find((r) => String(r.ratee) === String(p._id)) || null}
                        onSubmit={(rating, message) => rateMember(p._id, rating, message)}
                      />
                    ))}
                  </div>
                </>
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
                          <td style={{ textTransform: 'capitalize' }}>{ex.category}{ex.description ? ` - ${ex.description}` : ''}</td>
                          <td>{rupee(ex.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Photos - only the organizer, an accepted co-traveler, or an
                  admin can add to a trip's gallery. */}
              {(photos.length > 0 || canAddPhoto) && (
                <>
                  <div className="row-between" style={{ margin: '28px 0 14px', alignItems: 'center' }}>
                    <h3 className="section-title" style={{ fontSize: '1.3rem', margin: 0 }}>
                      Trip <span className="highlight">photos</span>
                    </h3>
                    {canAddPhoto && (
                      <>
                        <button className="btn btn-sm btn-outline" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                          {uploadingPhoto ? <span className="spinner" /> : <i className="fa-solid fa-camera" />} Add photo
                        </button>
                        <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={uploadPhoto} />
                      </>
                    )}
                  </div>
                  {photos.length > 0 ? (
                    <div className="masonry">
                      {trip.photos.map((p, i) => (
                        <div className="masonry-item" key={p._id} onClick={() => setLb(i)}>
                          <img src={imageUrl(p.photoUrl)} alt={p.caption || 'Trip'} loading="lazy" />
                          <div className="masonry-cap">
                            {p.user?.fullName && <div style={{ fontWeight: 600 }}>{p.user.fullName}</div>}
                            <div style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>{timeAgo(p.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No photos yet - be the first to add one!</p>
                  )}
                </>
              )}

              {/* Reviews - same eligibility as photos, but only once the
                  trip is actually over. */}
              {(trip.reviews?.length > 0 || trip.canReview) && (
                <>
                  <h3 className="section-title" style={{ fontSize: '1.3rem', margin: '28px 0 14px' }}>
                    Traveler <span className="highlight">reviews</span>
                  </h3>

                  {trip.canReview && (
                    <form className="card mb-3" style={{ padding: 16 }} onSubmit={submitReview}>
                      <div className="form-group">
                        <label>{trip.myReview ? 'Update your rating' : 'Your rating'}</label>
                        <div className="star-rating" onMouseLeave={() => setReviewHover(0)}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              type="button"
                              key={n}
                              className={`star-btn${n <= (reviewHover || reviewRating) ? ' selected' : ''}`}
                              onMouseEnter={() => setReviewHover(n)}
                              onClick={() => setReviewRating(n)}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Your review *</label>
                        <textarea
                          className="form-input"
                          required
                          minLength={3}
                          maxLength={2000}
                          value={reviewMessage}
                          onChange={(e) => setReviewMessage(e.target.value)}
                          placeholder="How was the trip? Would you travel with this group again?"
                        />
                      </div>
                      <button className="btn btn-primary btn-sm" disabled={reviewBusy}>
                        {reviewBusy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />}
                        {trip.myReview ? 'Update review' : 'Post review'}
                      </button>
                    </form>
                  )}

                  {trip.reviews?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {trip.reviews.map((r) => (
                        <div className="card" style={{ padding: 16 }} key={r._id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                            <img
                              src={imageUrl(r.user?.avatarUrl, AVATAR_FALLBACK)}
                              alt=""
                              style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                              onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{r.user?.fullName || 'Traveler'}</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{timeAgo(r.createdAt)}</div>
                            </div>
                            <Stars value={r.rating} />
                          </div>
                          <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>{r.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No reviews yet - be the first to share how it went!</p>
                  )}
                </>
              )}
            </div>

            {/* RIGHT - sticky action card (static on mobile) */}
            <div className="card trip-side-card" style={{ padding: 16 }}>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{trip.isCouplesMode ? 'Per couple' : 'Per head'}</div>
              <div className="trip-price" style={{ fontSize: '2rem' }}>{rupee(trip.isCouplesMode ? trip.budgetPerHead * 2 : trip.budgetPerHead)}</div>
              {trip.budgetIncludes && BUDGET_INCLUDES_LABEL[trip.budgetIncludes] && (
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  <i className="fa-solid fa-circle-info" /> Includes: {BUDGET_INCLUDES_LABEL[trip.budgetIncludes]}
                </p>
              )}
              {trip.isCouplesMode && (
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  Fuel &amp; toll split with the host couple - cheaper &amp; comfier than public transport.
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
                <Link to={`/members/${trip.organizer.username || trip.organizer._id}`} className="member-pill" style={{ width: '100%', marginBottom: 14 }}>
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
                    ? ' Joined - leave'
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
                  {trip.status !== 'completed' && (
                    <>
                      <Link to={`/trips/${id}/edit`} className="btn btn-sm btn-outline mb-2" style={{ width: '100%', justifyContent: 'center' }}>
                        <i className="fa-solid fa-pen-to-square" /> Edit Trip
                      </Link>
                      <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={removeTrip}>
                        <i className="fa-solid fa-trash" /> Delete Trip
                      </button>
                    </>
                  )}
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
