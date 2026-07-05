import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, rupee, dateRange, tripDays } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import { useCanTrip, handleGateError } from './useCanTrip.js';

const VEHICLE_BADGE = {
  Bike: { cls: 'badge-magenta', icon: 'ri-motorcycle-line' },
  Car: { cls: 'badge-green', icon: 'ri-car-line' },
  Bus: { cls: 'badge-cyan', icon: 'ri-bus-line' },
  Train: { cls: 'badge-cyan', icon: 'ri-train-line' },
  Mixed: { cls: 'badge-gold', icon: 'ri-route-line' },
};

export default function TripCard({ trip, onChange }) {
  const navigate = useNavigate();
  const canTrip = useCanTrip();

  const [interested, setInterested] = useState(Boolean(trip.isInterested));
  const [count, setCount] = useState(trip.interestCount || 0);
  const [filled, setFilled] = useState(trip.filledSeats || 0);
  const [busy, setBusy] = useState(false);

  const total = trip.totalSeats || 0;
  const seatsLeft = Math.max(0, total - filled);
  const pct = total ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const days = tripDays(trip.startDate, trip.endDate);
  const vb = VEHICLE_BADGE[trip.vehicleType] || { cls: 'badge-fire', icon: 'ri-map-pin-line' };

  const toggleInterest = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canTrip()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/trips/${trip._id}/interest`);
      setInterested(data.interested);
      setFilled(data.filledSeats);
      setCount((c) => Math.max(0, c + (data.interested ? 1 : -1)));
      toast(data.interested ? '🔥' : '👋', data.interested ? 'Interest registered! The organizer will reach out.' : 'Interest removed');
      onChange?.();
    } catch (err) {
      if (!handleGateError(err, navigate)) toast('❌', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link to={`/trips/${trip._id}`} className="card trip-card fade-up" style={{ color: 'inherit' }}>
      <div className="trip-card-img-wrap">
        <img
          className="trip-card-img"
          src={imageUrl(trip.coverImageUrl, `https://picsum.photos/seed/${trip._id}/600/400`)}
          alt={trip.destination}
          loading="lazy"
        />
        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
          {trip.vehicleType && (
            <span className={`badge ${vb.cls}`}>
              <i className={vb.icon} /> {trip.vehicleType}
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
            <span>{filled} joined</span>
            <span style={{ color: seatsLeft <= 2 ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>
              {seatsLeft} seats left
            </span>
          </div>
        </div>
      </div>

      <div className="trip-card-body">
        <h3 style={{ marginBottom: 6 }}>{trip.title || trip.destination}</h3>
        <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginBottom: 12 }}>
          <i className="ri-map-pin-line" /> {trip.destination}
        </p>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 14, flexWrap: 'wrap' }}>
          <span>
            <i className="ri-calendar-line" /> {dateRange(trip.startDate, trip.endDate)}
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
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Per head</div>
            <div className="trip-price">{rupee(trip.budgetPerHead)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${interested ? 'btn-primary' : 'btn-outline'}`}
              onClick={toggleInterest}
              disabled={busy}
            >
              <i className={interested ? 'ri-heart-fill' : 'ri-heart-line'} /> {count}
            </button>
            <span className="btn btn-sm btn-primary">View</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
