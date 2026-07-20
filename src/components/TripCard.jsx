import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { rupee, dateRange, tripDays, routeLabel } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import { useCanTrip, handleGateError } from './useCanTrip.js';
import DestinationImage from './DestinationImage.jsx';

const VEHICLE_BADGE = {
  Bike: { cls: 'badge-magenta', icon: 'fa-solid fa-motorcycle' },
  Car: { cls: 'badge-green', icon: 'fa-solid fa-car' },
  Bus: { cls: 'badge-cyan', icon: 'fa-solid fa-bus' },
  Train: { cls: 'badge-cyan', icon: 'fa-solid fa-train' },
  Mixed: { cls: 'badge-gold', icon: 'fa-solid fa-route' },
};

export default function TripCard({ trip, onChange }) {
  const navigate = useNavigate();
  const canTrip = useCanTrip();

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

  const isFreshRequest = !status || status === 'rejected';

  const requestJoin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canTrip()) return;

    // Couples-mode join needs a partner mobile number + ID document upload,
    // which can't be collected from this card — send them to the full page.
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
        pending: 'Request sent! The host will review it.',
        null: 'Request withdrawn',
      };
      toast(data.requestStatus === 'pending' ? 'fa-solid fa-paper-plane' : 'fa-solid fa-hand', messages[data.requestStatus] || 'Updated');
      onChange?.();
    } catch (err) {
      if (!handleGateError(err, navigate)) toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const BUTTON_LABEL = {
    pending: 'Requested',
    accepted: 'Joined',
    rejected: 'Request again',
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
              <i className="fa-solid fa-heart" /> Couples
            </span>
          )}
          {days && <span className="badge badge-gold">{days} Days</span>}
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
                <span>{Math.floor(filled / 2)} couple(s) joined</span>
                <span style={{ color: seatsLeft < 2 ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>
                  {Math.floor(seatsLeft / 2)} couple slot(s) left
                </span>
              </>
            ) : (
              <>
                <span>{filled} joined</span>
                <span style={{ color: seatsLeft <= 2 ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>
                  {seatsLeft} seats left
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="trip-card-body">
        <h3 style={{ marginBottom: 6 }}>{routeLabel(trip)}</h3>
        <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginBottom: 12 }}>
          <i className="fa-solid fa-location-dot" /> {trip.destination}
        </p>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 14, flexWrap: 'wrap' }}>
          <span>
            <i className="fa-solid fa-calendar" /> {dateRange(trip.startDate, trip.endDate)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: 14,
            borderTop: '1px solid var(--glass-bdr)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{trip.isCouplesMode ? 'Per couple' : 'Per head'}</div>
            <div className="trip-price">{rupee(trip.isCouplesMode ? trip.budgetPerHead * 2 : trip.budgetPerHead)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${status === 'accepted' ? 'btn-primary' : 'btn-outline'}`}
              onClick={requestJoin}
              disabled={busy || status === 'pending'}
            >
              <i className={status === 'accepted' ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} /> {status ? BUTTON_LABEL[status] : `Request (${count})`}
            </button>
            <span className="btn btn-sm btn-primary">View</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
