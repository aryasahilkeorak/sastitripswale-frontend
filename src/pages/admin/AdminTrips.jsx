import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../../lib/api.js';
import { formatDate } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';

export default function AdminTrips() {
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('');
  const load = () => api.get('/admin/trips', { params: status ? { status } : {} }).then((r) => setTrips(r.data.trips)).catch(() => {});
  useEffect(() => { load(); }, [status]);

  const setTripStatus = async (id, value) => {
    try {
      await api.patch(`/admin/trips/${id}/status`, { status: value });
      setTrips((ts) => ts.map((t) => (t._id === id ? { ...t, status: value } : t)));
      toast('fa-solid fa-circle-check', 'Trip status updated');
    } catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };

  return (
    <>
      <div className="filter-chips">
        {['', 'upcoming', 'ongoing', 'completed', 'cancelled'].map((s) => (
          <button key={s || 'all'} className={`chip${status === s ? ' active' : ''}`} onClick={() => setStatus(s)} style={{ textTransform: 'capitalize' }}>{s || 'All'}</button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Trip</th><th>Organizer</th><th>Dates</th><th>Seats</th><th>Status</th></tr></thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t._id}>
                <td><Link to={`/trips/${t._id}`} className="admin-clickable">{t.title || t.destination}</Link></td>
                <td>{t.organizer?.fullName || '—'}</td>
                <td>{formatDate(t.startDate)}</td>
                <td>{t.filledSeats}/{t.totalSeats}</td>
                <td>
                  <select className="form-input" style={{ padding: '6px 10px', width: 'auto' }} value={t.status} onChange={(e) => setTripStatus(t._id, e.target.value)}>
                    <option value="upcoming">upcoming</option><option value="ongoing">ongoing</option><option value="completed">completed</option><option value="cancelled">cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
