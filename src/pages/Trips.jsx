import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import PageHero from '../components/PageHero.jsx';
import TripCard from '../components/TripCard.jsx';
import Loader from '../components/Loader.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'bike', label: 'Bike' },
  { key: 'car', label: 'Car' },
  { key: 'trek', label: 'Trek' },
  { key: 'beach', label: 'Beach' },
  { key: 'mountain', label: 'Mountain' },
  { key: 'budget', label: 'Under ₹3K' },
];

const SORTS = [
  { value: '', label: 'Newest' },
  { value: 'budget_asc', label: 'Price: Low to High' },
  { value: 'budget_desc', label: 'Price: High to Low' },
  { value: 'date_asc', label: 'Date: Soonest' },
  { value: 'date_desc', label: 'Date: Latest' },
];

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { status: 'upcoming', limit: 30 };
    if (filter !== 'all') params.type = filter;
    if (sort) params.sort = sort;
    if (query) params.search = query;
    api
      .get('/trips', { params })
      .then((r) => setTrips(r.data.trips))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [filter, sort, query]);

  return (
    <>
      <PageHero
        tag="Upcoming Adventures"
        tagIcon="ri-compass-3-fill"
        title="Explore"
        highlight="Trips"
        sub="Find your next adventure. Filter by vehicle, budget or destination and join a verified group."
      />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <form
            className="search-bar"
            style={{ maxWidth: 560, marginBottom: 20 }}
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
            }}
          >
            <i className="ri-search-line" style={{ color: 'var(--text-3)' }} />
            <input
              placeholder="Search destination or trip name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary">
              Search
            </button>
          </form>

          <div className="row-between mb-3" style={{ alignItems: 'center' }}>
            <div className="filter-chips" style={{ marginBottom: 0 }}>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`chip${filter === f.key ? ' active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <select className="form-input" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <Loader label="Loading trips…" />
          ) : trips.length === 0 ? (
            <div className="empty-state">
              <i className="ri-compass-3-line" />
              <p>No trips match your filters.</p>
              <Link to="/plan-trip" className="btn btn-primary mt-3">
                <i className="ri-add-line" /> Plan a Trip
              </Link>
            </div>
          ) : (
            <div className="trips-grid">
              {trips.map((t) => (
                <TripCard key={t._id} trip={t} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
