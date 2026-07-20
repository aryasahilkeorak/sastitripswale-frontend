import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import PageHero from '../components/PageHero.jsx';
import TripCard from '../components/TripCard.jsx';
import Loader from '../components/Loader.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import CustomDatePicker from '../components/CustomDatePicker.jsx';
import CustomNumberStepper from '../components/CustomNumberStepper.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'bike', label: 'Bike' },
  { key: 'car', label: 'Car' },
  { key: 'trek', label: 'Trek' },
  { key: 'beach', label: 'Beach' },
  { key: 'mountain', label: 'Mountain' },
  { key: 'couples', label: 'Couples' },
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
  // Seeded once from the URL (e.g. ?type=&from=&to=&date=&seats=) so a
  // shared/bookmarked filtered link works too.
  const [searchParams] = useSearchParams();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(() => searchParams.get('type') || 'all');
  const [sort, setSort] = useState(() => searchParams.get('sort') || '');
  const [from, setFrom] = useState(() => searchParams.get('from') || '');
  const [to, setTo] = useState(() => searchParams.get('to') || '');
  const [date, setDate] = useState(() => searchParams.get('date') || '');
  const [seats, setSeats] = useState(() => Number(searchParams.get('seats')) || 1);

  const swapFromTo = () => {
    setFrom(to);
    setTo(from);
  };

  // Live search — debounced so every keystroke doesn't fire a request.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const params = { status: 'upcoming', limit: 30 };
      if (filter !== 'all') params.type = filter;
      if (sort) params.sort = sort;
      if (from.trim()) params.from = from.trim();
      if (to.trim()) params.to = to.trim();
      if (date) params.date = date;
      if (seats > 1) params.seats = seats;
      api
        .get('/trips', { params })
        .then((r) => setTrips(r.data.trips))
        .catch(() => setTrips([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [filter, sort, from, to, date, seats]);

  return (
    <>
      <PageHero
        tag="Upcoming Adventures"
        tagIcon="fa-solid fa-compass"
        title="Explore"
        highlight="Trips"
        sub="Find your next adventure. Filter by vehicle, budget or destination and join a verified group."
      />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <form className="ride-search" onSubmit={(e) => e.preventDefault()}>
            <div className="ride-search-field">
              <label>Leaving from</label>
              <div className="ride-search-input">
                <i className="fa-regular fa-circle-dot" />
                <input placeholder="Any city" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
            </div>

            <button type="button" className="ride-search-swap" onClick={swapFromTo} aria-label="Swap origin and destination">
              <i className="fa-solid fa-right-left" />
            </button>

            <div className="ride-search-field">
              <label>Going to</label>
              <div className="ride-search-input">
                <i className="fa-solid fa-location-dot" />
                <input placeholder="Any destination" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            <div className="ride-search-field">
              <label>Date</label>
              <CustomDatePicker value={date} onChange={(e) => setDate(e.target.value)} min={todayISO()} placeholder="Any date" />
            </div>

            <div className="ride-search-field ride-search-seats">
              <label>Seats</label>
              <CustomNumberStepper value={seats} onChange={(e) => setSeats(e.target.value)} min={1} max={10} />
            </div>

            <button type="submit" className="btn btn-primary ride-search-btn">
              <i className="fa-solid fa-magnifying-glass" /> Search
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
            <CustomSelect style={{ width: 200 }} value={sort} onChange={(e) => setSort(e.target.value)} options={SORTS} />
          </div>

          {loading ? (
            <Loader label="Loading trips…" />
          ) : trips.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-compass" />
              <p>No trips match your filters.</p>
              <Link to="/plan-trip" className="btn btn-primary mt-3 plan-trip-btn">
                <i className="fa-solid fa-plus" /> Plan a Trip
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
