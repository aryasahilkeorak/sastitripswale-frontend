import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { rupee, dateRange, tripDays, routeLabel, BUDGET_INCLUDES_LABEL } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import { useCanTrip, handleGateError } from './useCanTrip.js';
import DestinationImage from './DestinationImage.jsx';
import { useT } from '../i18n/index.js';

const VEHICLE_BADGE = {
  Bike: { cls: 'badge-magenta', icon: 'fa-solid fa-motorcycle' },
  Car: { cls: 'badge-green', icon: 'fa-solid fa-car' },
  Bus: { cls: 'badge-cyan', icon: 'fa-solid fa-bus' },
  Train: { cls: 'badge-cyan', icon: 'fa-solid fa-train' },
  Mixed: { cls: 'badge-gold', icon: 'fa-solid fa-route' },
};

export default function TripCard({ trip, onChange }) {
  const t = useT();
  const navigate = useNavigate();
  const canTrip = useCanTrip('join');
  const user = useAuth((s) => s.user);

  const [status, setStatus] = useState(trip.requestStatus || null);
  const [count, setCount] = useState(trip.interestCount || 0);
  const [filled, setFilled] = useState(trip.filledSeats || 0);
  const [busy, setBusy] = useState(false);

  const total = trip.totalSeats || 0;
  const reserved = trip.isCouplesMode ? 2 : 0;
  const seatsLeft = Math.max(0, total - reserved - filled);
  const pct = total ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const days = tripDays(trip.startDate, trip.endDate);
  const vb = VEHICLE_BADGE[trip.vehicleType] || { cls: 'badge-fire', icon: 'fa-solid fa-location-dot' };
  const isOwner = Boolean(user && trip.organizer && String(trip.organizer._id) === String(user.id));

  const isFreshRequest = !status || status === 'rejected';

  const goToEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/trips/${trip._id}/edit`);
  };

  const requestJoin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canTrip()) return;

    // Couples-mode join needs a partner mobile number + ID document upload,
    // which can't be collected from this card - send them to the full page.
    if (trip.isCouplesMode && isFreshRequest) {
      navigate(`/trips/${trip._id}`);
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post(`/trips/${trip._id}/interest`);
      const wasAccepted = status === 'accepted';
      setStatus(data.requestStatus);
      setFilled(data.filledSeats);
      if (wasAccepted && !data.requestStatus) setCount((c) => Math.max(0, c - 1));
      const messages = {
        pending: t('tripCard.toastRequestSent'),
        null: t('tripCard.toastRequestWithdrawn'),
      };
      toast(data.requestStatus === 'pending' ? 'fa-solid fa-paper-plane' : 'fa-solid fa-hand', messages[data.requestStatus] || t('tripCard.toastUpdated'));
      onChange?.();
    } catch (err) {
      if (!handleGateError(err, navigate)) toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const BUTTON_LABEL = {
    pending: t('tripCard.statusRequested'),
    accepted: t('tripCard.statusJoined'),
    rejected: t('tripCard.statusRequestAgain'),
  };

  return (
    <Link to={`/trips/${trip._id}`} className="card trip-card fade-up" style={{ color: 'inherit' }}>
      <div className="trip-card-img-wrap">
        <DestinationImage trip={trip} className="trip-card-img" loading="lazy" />
        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
          {trip.vehicleType && (
            <span className={`badge ${vb.cls}`}>
              <i className={vb.icon} /> {trip.vehicleType}
            </span>
          )}
          {trip.isCouplesMode && (
            <span className="badge badge-magenta">
              <i className="fa-solid fa-heart" /> {t('tripCard.couples')}
            </span>
          )}
          {trip.genderPreference && trip.genderPreference !== 'Any' && (
            <span className="badge badge-magenta">
              <i className={trip.genderPreference === 'Male' ? 'fa-solid fa-mars' : 'fa-solid fa-venus'} /> {t('tripCard.genderOnly').replace('{gender}', trip.genderPreference)}
            </span>
          )}
          {days && <span className="badge badge-gold">{t('tripCard.daysBadge').replace('{days}', days)}</span>}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '10px 16px',
            background: 'linear-gradient(to top,rgba(6,7,13,0.9),transparent)',
          }}
        >
          <div className="seats-bar">
            <div className="seats-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-3)' }}>
            {trip.isCouplesMode ? (
              <>
                <span>{t('tripCard.couplesJoinedCount').replace('{count}', Math.floor(filled / 2))}</span>
                <span style={{ color: seatsLeft < 2 ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>
                  {t('tripCard.coupleSlotsLeftCount').replace('{count}', Math.floor(seatsLeft / 2))}
                </span>
              </>
            ) : (
              <>
                <span>{t('tripCard.joinedCount').replace('{count}', filled)}</span>
                <span style={{ color: seatsLeft <= 2 ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>
                  {t('tripCard.seatsLeftCount').replace('{count}', seatsLeft)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="trip-card-body">
        <h3 style={{ marginBottom: 6 }}>{routeLabel(trip)}</h3>
        <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginBottom: 8 }}>
          <i className="fa-solid fa-location-dot" /> {trip.destination}
        </p>
        {trip.organizer && (
          <p style={{ color: 'var(--text-3)', fontSize: '0.76rem', marginBottom: 12 }}>
            <i className="fa-solid fa-user" /> {t('tripCard.hostedBy').split('{name}')[0]}
            <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{trip.organizer.username || trip.organizer.fullName}</strong>
            {t('tripCard.hostedBy').split('{name}')[1]}
            {trip.organizer.vehicleModel && (
              <>
                <span style={{ margin: '0 8px' }}>·</span>
                <i className="fa-solid fa-car-side" style={{ marginRight: 6 }} />
                <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{trip.organizer.vehicleModel}</strong>
              </>
            )}
          </p>
        )}
        <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 14, flexWrap: 'wrap' }}>
          <span>
            <i className="fa-solid fa-calendar" /> {dateRange(trip.startDate, trip.endDate)}
          </span>
        </div>
        <div className="trip-card-footer">
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{trip.isCouplesMode ? t('tripCard.perCouple') : t('tripCard.perHead')}</div>
            <div className="trip-price">{rupee(trip.isCouplesMode ? trip.budgetPerHead * 2 : trip.budgetPerHead)}</div>
            {trip.budgetIncludes && BUDGET_INCLUDES_LABEL[trip.budgetIncludes] && (
              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 2 }}>
                <i className="fa-solid fa-circle-info" /> {BUDGET_INCLUDES_LABEL[trip.budgetIncludes]}
              </div>
            )}
          </div>
          <div className="trip-card-actions">
            {isOwner ? (
              <button className="btn btn-sm btn-outline" onClick={goToEdit}>
                <i className="fa-solid fa-pen" /> {t('tripCard.editTrip')}
              </button>
            ) : (
              <button
                className={`btn btn-sm ${status === 'accepted' ? 'btn-primary' : 'btn-outline'}`}
                onClick={requestJoin}
                disabled={busy || status === 'pending'}
              >
                <i className={status === 'accepted' ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} /> {status ? BUTTON_LABEL[status] : t('tripCard.requestWithCount').replace('{count}', count)}
              </button>
            )}
            <span className="btn btn-sm btn-primary">{t('tripCard.view')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
