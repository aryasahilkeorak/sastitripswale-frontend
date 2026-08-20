import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import usePullToRefresh from '../lib/usePullToRefresh.js';
import { todayISO } from '../lib/helpers.js';
import PageHero from '../components/PageHero.jsx';
import PromoBanner from '../components/PromoBanner.jsx';
import TripCard from '../components/TripCard.jsx';
import CompletedTripCard from '../components/CompletedTripCard.jsx';
import Loader from '../components/Loader.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import CustomDatePicker from '../components/CustomDatePicker.jsx';
import CustomNumberStepper from '../components/CustomNumberStepper.jsx';
import PlaceAutocomplete from '../components/PlaceAutocomplete.jsx';
import Modal from '../components/Modal.jsx';
import Seo from '../components/Seo.jsx';

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

// Recent "Leaving from"/"Going to" picks, kept in localStorage (not the
// account) so re-opening the search later re-suggests them - capped small
// since this is a quick-recall list, not a full history.
const RECENT_PLACES_KEY = 'sstw_recent_trip_places';
const MAX_RECENT_PLACES = 6;

function loadRecentPlaces() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_PLACES_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function pushRecentPlace(list, place) {
  const trimmed = place.trim();
  if (!trimmed) return list;
  const next = [trimmed, ...list.filter((p) => p.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT_PLACES);
  try {
    localStorage.setItem(RECENT_PLACES_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable (private mode, quota) - recent suggestions just won't persist */
  }
  return next;
}

export default function Trips() {
  // Seeded once from the URL (e.g. ?status=&type=&from=&to=&date=&seats=)
  // so a shared/bookmarked filtered link works too.
  const [searchParams] = useSearchParams();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(() => (searchParams.get('status') === 'completed' ? 'completed' : 'upcoming'));
  const [filter, setFilter] = useState(() => searchParams.get('type') || 'all');
  const [sort, setSort] = useState(() => searchParams.get('sort') || '');
  const [from, setFrom] = useState(() => searchParams.get('from') || '');
  const [to, setTo] = useState(() => searchParams.get('to') || '');
  const [date, setDate] = useState(() => searchParams.get('date') || '');
  const [seats, setSeats] = useState(() => Number(searchParams.get('seats')) || 1);
  const [noResultsOpen, setNoResultsOpen] = useState(false);
  const [recentPlaces, setRecentPlaces] = useState(loadRecentPlaces);

  const rememberPlace = (place) => setRecentPlaces((list) => pushRecentPlace(list, place));

  const swapFromTo = () => {
    setFrom(to);
    setTo(from);
  };

  const fetchTrips = useCallback(() => {
    const params = { status, limit: 30 };
    if (filter !== 'all') params.type = filter;
    if (sort) params.sort = sort;
    if (status === 'upcoming') {
      if (from.trim()) params.from = from.trim();
      if (to.trim()) params.to = to.trim();
      if (date) params.date = date;
      if (seats > 1) params.seats = seats;
    }
    return api
      .get('/trips', { params })
      .then((r) => {
        setTrips(r.data.trips);
        return r.data.trips;
      })
      .catch(() => {
        setTrips([]);
        return [];
      });
  }, [status, filter, sort, from, to, date, seats]);

  // Explicit "Search" click - runs the fetch immediately (not the debounced
  // live one) and pops up "No trips found" only from this direct action,
  // not from every keystroke that happens to match nothing yet.
  const runSearch = async () => {
    if (from.trim()) rememberPlace(from);
    if (to.trim()) rememberPlace(to);
    setLoading(true);
    const results = await fetchTrips();
    setLoading(false);
    setNoResultsOpen(results.length === 0);
  };

  // Pull-to-refresh re-runs the same fetch immediately, with whatever
  // filters are currently applied (mobile/tablet only, in practice).
  const { containerRef, pullDistance, refreshing } = usePullToRefresh(fetchTrips);

  // Live search - debounced so every keystroke doesn't fire a request.
  useEffect(() => {
    setLoading(true);
    setNoResultsOpen(false);
    const t = setTimeout(() => {
      fetchTrips().finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [fetchTrips]);

  return (
    <>
      <Seo
        title="Bike, Car & Backpacking Trips Across India"
        description="Browse verified travel groups across India - bike trips, road trips, treks and beach getaways. Join a trip and split the budget, or plan your own and find co-travelers."
        path="/trips"
      />
      <PageHero
        tag="Upcoming Adventures"
        tagIcon="fa-solid fa-compass"
        title="Explore"
        highlight="Trips"
        sub="Find your next adventure. Filter by vehicle, budget or destination and join a verified group."
      />

      <section className="trips-section" ref={containerRef}>
        <div className="container">
          <div className="ptr-indicator" style={{ height: refreshing ? 40 : pullDistance }}>
            {refreshing ? (
              <span className="spinner" />
            ) : pullDistance > 0 ? (
              <i className="fa-solid fa-arrow-down" style={{ transform: `rotate(${Math.min(pullDistance / 70, 1) * 180}deg)` }} />
            ) : null}
          </div>

          <PromoBanner
            icon="fa-solid fa-ticket"
            message="Have a coupon? Save on your next membership renewal."
            cta="Redeem now"
            to="/join"
          />

          <div className="row-between mt-3" style={{ alignItems: 'center' }}>
            <div className="filter-chips" style={{ marginBottom: 0 }}>
              <button className={`chip${status === 'upcoming' ? ' active' : ''}`} onClick={() => setStatus('upcoming')}>
                <i className="fa-solid fa-compass" /> Upcoming
              </button>
              <button className={`chip${status === 'completed' ? ' active' : ''}`} onClick={() => setStatus('completed')}>
                <i className="fa-solid fa-trophy" /> Completed
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/plan-trip" className="btn btn-sm btn-primary">
                <i className="fa-solid fa-plus" /> Plan a Trip
              </Link>
              <Link to="/plan-group-trip" className="btn btn-sm btn-outline">
                <i className="fa-solid fa-people-group" /> Plan a Group Trip
              </Link>
            </div>
          </div>

          {status === 'upcoming' && (
          <form
            className="ride-search ride-search-prominent mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch();
            }}
          >
            <div className="ride-search-field">
              <label>Leaving from</label>
              <div className="ride-search-input">
                <i className="fa-regular fa-circle-dot" />
                <PlaceAutocomplete
                  placeholder="Any city"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  onSelect={(s) => rememberPlace(s.label)}
                  recentPlaces={recentPlaces}
                />
              </div>
            </div>

            <button type="button" className="ride-search-swap" onClick={swapFromTo} aria-label="Swap origin and destination">
              <i className="fa-solid fa-right-left" />
            </button>

            <div className="ride-search-field">
              <label>Going to</label>
              <div className="ride-search-input">
                <i className="fa-solid fa-location-dot" />
                <PlaceAutocomplete
                  placeholder="Any destination"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onSelect={(s) => rememberPlace(s.label)}
                  recentPlaces={recentPlaces}
                />
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
          )}

          <div className="row-between mb-3 trips-filter-bar mt-3" style={{ alignItems: 'center' }}>
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
              <i className={status === 'completed' ? 'fa-solid fa-trophy' : 'fa-solid fa-compass'} />
              <p>{status === 'completed' ? 'No completed trips match your filters.' : 'No trips match your filters.'}</p>
              {status === 'upcoming' && (
                <Link to="/plan-trip" className="btn btn-primary mt-3 plan-trip-btn">
                  <i className="fa-solid fa-plus" /> Plan a Trip
                </Link>
              )}
            </div>
          ) : (
            <div className="trips-grid">
              {trips.map((t) =>
                status === 'completed' ? <CompletedTripCard key={t._id} trip={t} /> : <TripCard key={t._id} trip={t} />
              )}
            </div>
          )}
        </div>
      </section>

      <Modal open={noResultsOpen} onClose={() => setNoResultsOpen(false)} title="No trips found">
        <div className="empty-state-sm" style={{ padding: 0 }}>
          <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '2rem', color: 'var(--fire)', marginBottom: 12 }} />
          <p className="text-muted">
            No trips match {from.trim() && to.trim() ? `${from.trim()} → ${to.trim()}` : 'this route'}
            {date ? ' on this date' : ''}. Please try another date or route.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setDate('');
              setNoResultsOpen(false);
            }}
          >
            Clear date
          </button>
          <Link to="/plan-trip" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setNoResultsOpen(false)}>
            <i className="fa-solid fa-plus" /> Plan a Trip
          </Link>
        </div>
      </Modal>
    </>
  );
}
