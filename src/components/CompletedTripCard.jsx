import { Link } from 'react-router-dom';
import { rupee, dateRange, tripDays, routeLabel } from '../lib/helpers.js';
import DestinationImage from './DestinationImage.jsx';

const VEHICLE_BADGE = {
  Bike: { cls: 'badge-magenta', icon: 'fa-solid fa-motorcycle' },
  Car: { cls: 'badge-green', icon: 'fa-solid fa-car' },
  Bus: { cls: 'badge-cyan', icon: 'fa-solid fa-bus' },
  Train: { cls: 'badge-cyan', icon: 'fa-solid fa-train' },
  Mixed: { cls: 'badge-gold', icon: 'fa-solid fa-route' },
};

// A finished trip, shown wherever completed journeys are browsed (home page
// teaser, the Trips page "Completed" tab). Unlike TripCard there's no join
// button — the trip is already over — just the real per-head cost and a
// link through to the full expense breakdown.
export default function CompletedTripCard({ trip }) {
  const perHead = trip.expenses?.length ? trip.expenses.reduce((a, e) => a + e.amount, 0) : trip.budgetPerHead;
  const days = tripDays(trip.startDate, trip.endDate);
  const vb = VEHICLE_BADGE[trip.vehicleType] || { cls: 'badge-fire', icon: 'fa-solid fa-location-dot' };

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
          {days && <span className="badge badge-gold">{days} Days</span>}
          <span className="badge badge-green"><i className="fa-solid fa-trophy" /> Completed</span>
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
          <span>
            <i className="fa-solid fa-users" /> {trip.filledSeats || 0} travelers
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
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Actual cost / head</div>
            <div className="trip-price">{rupee(perHead)}</div>
          </div>
          <span className="btn btn-sm btn-primary">View recap</span>
        </div>
      </div>
    </Link>
  );
}
