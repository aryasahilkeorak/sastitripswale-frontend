import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { imageUrl, rupee, dateRange, tripDays } from '../lib/helpers.js';
import PageHero from '../components/PageHero.jsx';
import Loader from '../components/Loader.jsx';

const STATS = [
  { num: '320+', label: 'Trips' },
  { num: '4,800+', label: 'Travelers' },
  { num: '48', label: 'States' },
  { num: '₹72L', label: 'Saved together' },
];

export default function CompletedTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/trips', { params: { status: 'completed', limit: 40, sort: 'date_desc' } })
      .then((r) => setTrips(r.data.trips))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHero tag="Trip Archive" tagIcon="ri-trophy-fill" title="Completed" highlight="Journeys" sub="Real trips, real expense breakdowns, real memories." />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="grid-4 mb-4">
            {STATS.map((s) => (
              <div className="mini-stat" key={s.label}>
                <div className="num">{s.num}</div>
                <div className="lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <Loader label="Loading journeys…" />
          ) : trips.length === 0 ? (
            <div className="empty-state"><i className="ri-trophy-line" /><p>No completed trips yet.</p></div>
          ) : (
            <div className="timeline">
              {trips.map((t) => {
                const perHead = t.expenses?.length ? t.expenses.reduce((a, e) => a + e.amount, 0) : t.budgetPerHead;
                return (
                  <div className="tl-item" key={t._id}>
                    <div className="tl-date">{dateRange(t.startDate, t.endDate)}</div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr' }} className="tl-card">
                        <img src={imageUrl(t.coverImageUrl, `https://picsum.photos/seed/${t._id}/500/400`)} alt={t.destination} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 180 }} />
                        <div style={{ padding: 22 }}>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>{t.title || t.destination}</h3>
                          <p className="text-muted mb-2"><i className="ri-map-pin-line" /> {t.destination}</p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            {tripDays(t.startDate, t.endDate) && <span className="badge badge-gold">{tripDays(t.startDate, t.endDate)} Days</span>}
                            {t.vehicleType && <span className="badge badge-magenta">{t.vehicleType}</span>}
                            <span className="badge badge-green">{t.filledSeats} travelers</span>
                          </div>
                          {t.expenses?.length > 0 && (
                            <table className="expense-table">
                              <tbody>
                                {t.expenses.map((e, i) => (
                                  <tr key={i}><td style={{ textTransform: 'capitalize' }}>{e.category}{e.description ? ` — ${e.description}` : ''}</td><td>{rupee(e.amount)}</td></tr>
                                ))}
                                <tr><td style={{ fontWeight: 700 }}>Total</td><td style={{ fontWeight: 700 }}>{rupee(perHead)}</td></tr>
                              </tbody>
                            </table>
                          )}
                          <Link to={`/trips/${t._id}`} className="btn btn-sm btn-outline mt-3"><i className="ri-arrow-right-line" /> View trip</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
