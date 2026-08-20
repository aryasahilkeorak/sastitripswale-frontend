import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import PageHero from '../components/PageHero.jsx';
import Loader from '../components/Loader.jsx';
import CompletedTripCard from '../components/CompletedTripCard.jsx';
import Seo from '../components/Seo.jsx';

function pooledLabel(v) {
  if (!v) return '₹0';
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${Number(v).toLocaleString('en-IN')}`;
}

export default function CompletedTrips() {
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/trips', { params: { status: 'completed', limit: 40, sort: 'date_desc' } })
      .then((r) => setTrips(r.data.trips))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
    api.get('/stats').then((r) => setStats(r.data.stats)).catch(() => {});
  }, []);

  const STATS = [
    { num: stats?.completedTrips ?? 0, label: 'Trips' },
    { num: stats?.travelers ?? 0, label: 'Travelers' },
    { num: stats?.states ?? 0, label: 'States' },
    { num: pooledLabel(stats?.pooledRupees), label: 'Pooled together' },
  ];

  return (
    <>
      <Seo
        title="Completed Trip Recaps & Expense Breakdowns"
        description="See real completed trips from SastiTripsWale's travel community - actual expense breakdowns showing how much bikers, car travelers and backpackers really spent by splitting costs."
        path="/completed-trips"
      />
      <PageHero tag="Trip Archive" tagIcon="fa-solid fa-trophy" title="Completed" highlight="Journeys" sub="Real trips, real expense breakdowns, real memories." />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="grid-4 mini-stat-grid mb-4">
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
            <div className="empty-state"><i className="fa-solid fa-trophy" /><p>No completed trips yet.</p></div>
          ) : (
            <div className="trips-grid">
              {trips.map((t) => (
                <CompletedTripCard key={t._id} trip={t} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
