import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, rupee, dateRange, tripDays, routeLabel, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Loader from '../components/Loader.jsx';
import Lightbox from '../components/Lightbox.jsx';
import DestinationImage from '../components/DestinationImage.jsx';
import ProfileGateCard from '../components/ProfileGateCard.jsx';
import AdSlot from '../components/AdSlot.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import { useCanTrip, handleGateError } from '../components/useCanTrip.js';
import Seo from '../components/Seo.jsx';
import { buildBreadcrumbLd } from '../lib/seo.js';

const VEHICLE_BADGE = {
  Bike: { cls: 'badge-magenta', icon: 'fa-solid fa-motorcycle' },
  Car: { cls: 'badge-green', icon: 'fa-solid fa-car' },
};

export default function GroupTripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const canTrip = useCanTrip();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [heroZoom, setHeroZoom] = useState(null);

  const load = () => {
    api
      .get(`/group-trips/${id}`)
      .then((r) => setTrip(r.data.groupTrip))
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const requestJoin = async () => {
    if (!canTrip()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/group-trips/${id}/interest`);
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
      await api.patch(`/group-trips/${id}/requests/${userId}`, { action });
      toast(action === 'accept' ? 'fa-solid fa-handshake' : 'fa-solid fa-hand', action === 'accept' ? 'Request accepted' : 'Request declined');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const removeTrip = async () => {
    if (!window.confirm('Delete this group trip? This cannot be undone.')) return;
    try {
      await api.delete(`/group-trips/${id}`);
      toast('fa-solid fa-trash', 'Group trip deleted');
      navigate('/dashboard');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const changeStatus = async (status) => {
    try {
      await api.put(`/group-trips/${id}`, { status });
      toast('fa-solid fa-circle-check', 'Group trip status updated');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  if (loading) return <div className="detail-section-loading"><Loader label="Loading group trip…" /></div>;
  if (!trip)
    return (
      <div className="empty-state detail-section-empty">
        <i className="fa-solid fa-triangle-exclamation" />
        <p>Group trip not found.</p>
        <Link to="/trips?mode=group" className="btn btn-primary mt-3">Browse group trips</Link>
      </div>
    );

  const days = tripDays(trip.startDate, trip.endDate);
  const vb = VEHICLE_BADGE[trip.vehicleType] || { cls: 'badge-fire', icon: 'fa-solid fa-route' };
  const isOrganizer = user && trip.organizer && String(trip.organizer._id) === String(user.id);

  return (
    <section className="detail-section">
      <Seo
        title={`${trip.destination} Group Trip - Join or Split Costs`}
        description={`Join this ${trip.destination} group trip on SastiTripsWale for ${rupee(trip.budgetPerHead)}/person. Verified co-travelers, split expenses, travel safely together.`}
        path={`/group-trips/${trip._id}`}
        image={trip.coverImageUrl ? imageUrl(trip.coverImageUrl) : undefined}
        jsonLd={buildBreadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Trips', path: '/trips' },
          { name: trip.destination },
        ])}
      />
      <div className="container">
        <Link to="/trips?mode=group" className="ig-id-btn" aria-label="All group trips" title="All group trips">
          <i className="fa-solid fa-arrow-left" />
        </Link>

        <div className="detail-grid mt-3">
          {/* LEFT */}
          <div>
            <DestinationImage
              trip={trip}
              className="trip-hero-img"
              onClick={(e) => setHeroZoom(e.currentTarget.src)}
              style={{ cursor: 'pointer' }}
            />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <span className={`badge ${vb.cls}`}>
                <i className={vb.icon} /> {trip.vehicleType} Group
              </span>
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

            <div className="cost-estimator-box mt-3">
              <div className="couples-safety-header">
                <span className="couples-safety-icon" style={{ background: 'rgba(255,107,0,0.15)', color: 'var(--fire)' }}>
                  <i className={vb.icon} />
                </span>
                <div>
                  <strong>{trip.vehiclesNeeded} {trip.vehicleType.toLowerCase()}{trip.vehiclesNeeded > 1 ? 's' : ''} needed</strong>
                  <p className="text-muted" style={{ fontSize: '0.78rem', margin: '2px 0 0' }}>
                    {trip.vehicleType === 'Bike'
                      ? 'One bike carries the rider plus one pillion (2 people).'
                      : 'One car carries up to 4 people.'}{' '}
                    {trip.currentHeadcount} traveler{trip.currentHeadcount === 1 ? '' : 's'} so far.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="section-title" style={{ fontSize: '1.3rem', margin: '28px 0 14px' }}>
              Who's <span className="highlight">going</span>
            </h3>
            {trip.members?.length ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {trip.members.map((m) => (
                  <Link key={m._id} to={`/members/${m.username || m._id}`} className="member-pill">
                    <img src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)} alt={m.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                    {m.fullName}
                    {m.isVerified && <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} />}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted">No one has joined yet - be the first!</p>
            )}
            <AdSlot placement="detail" />
          </div>

          {/* RIGHT */}
          <div className="card trip-side-card" style={{ padding: 16 }}>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Per head</div>
            <div className="trip-price" style={{ fontSize: '2rem' }}>{rupee(trip.budgetPerHead)}</div>

            <div className="row-between mt-3" style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
              <span>{trip.currentHeadcount} traveler{trip.currentHeadcount === 1 ? '' : 's'} so far</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: 'var(--text-2)', margin: '18px 0' }}>
              <div><i className="fa-solid fa-calendar" style={{ color: 'var(--fire)' }} /> {dateRange(trip.startDate, trip.endDate)}</div>
              <div><i className={vb.icon} style={{ color: 'var(--fire)' }} /> {trip.vehiclesNeeded} {trip.vehicleType.toLowerCase()}{trip.vehiclesNeeded > 1 ? 's' : ''} needed</div>
              <div><i className="fa-solid fa-people-group" style={{ color: 'var(--fire)' }} /> {trip.interestCount} interested</div>
            </div>

            {trip.organizer && (
              <Link to={`/members/${trip.organizer.username || trip.organizer._id}`} className="member-pill" style={{ width: '100%', marginBottom: 14 }}>
                <img src={imageUrl(trip.organizer.avatarUrl, AVATAR_FALLBACK)} alt={trip.organizer.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                <span>
                  Organized by <strong>{trip.organizer.fullName}</strong>
                </span>
              </Link>
            )}

            {trip.status === 'upcoming' && !isOrganizer && <ProfileGateCard action="join a trip" />}

            {trip.status === 'upcoming' && !isOrganizer && (
              <button
                className={`btn btn-lg ${trip.requestStatus === 'accepted' ? 'btn-outline' : 'btn-primary'}`}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={requestJoin}
                disabled={busy || trip.requestStatus === 'pending'}
              >
                {busy ? <span className="spinner" /> : <i className={trip.requestStatus === 'accepted' ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />}
                {trip.requestStatus === 'accepted'
                  ? ' Joined - leave group'
                  : trip.requestStatus === 'pending'
                  ? ' Request pending'
                  : trip.requestStatus === 'rejected'
                  ? ' Request again'
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
                      <span style={{ fontSize: '0.85rem' }}>{r.fullName}</span>
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
                    <Link to={`/group-trips/${id}/edit`} className="btn btn-sm btn-outline mb-2" style={{ width: '100%', justifyContent: 'center' }}>
                      <i className="fa-solid fa-pen-to-square" /> Edit Group Trip
                    </Link>
                    <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={removeTrip}>
                      <i className="fa-solid fa-trash" /> Delete Group Trip
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Lightbox images={heroZoom ? [heroZoom] : []} index={heroZoom ? 0 : null} onClose={() => setHeroZoom(null)} onIndex={() => {}} />
    </section>
  );
}
