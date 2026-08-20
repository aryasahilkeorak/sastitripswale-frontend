import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { CLUB_CATEGORIES } from '../lib/helpers.js';
import PageHero from '../components/PageHero.jsx';
import ClubCard from '../components/ClubCard.jsx';
import Loader from '../components/Loader.jsx';
import PromoBanner from '../components/PromoBanner.jsx';
import Seo from '../components/Seo.jsx';
import ScrollRow from '../components/ScrollRow.jsx';

const FILTERS = [{ key: 'all', label: 'All Clubs' }, ...CLUB_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))];

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/clubs', { params: { limit: 40, category: filter, search: search.trim() || undefined } })
      .then((r) => setClubs(r.data.clubs))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  return (
    <>
      <Seo
        title="Travel Clubs - Bikers, Cars & Offroading Groups"
        description="Join a verified travel club on SastiTripsWale - bikers clubs, car clubs and offroading crews across India. Or create your own club and invite riders/drivers to travel together year-round."
        path="/clubs"
      />
      <PageHero
        tag="Ride & Roll Together"
        tagIcon="fa-solid fa-people-group"
        title="Travel"
        highlight="Clubs"
        sub="Persistent crews for bikers, car owners and offroaders - not just a single trip, a standing group chat you own."
      />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <form className="search-bar" style={{ maxWidth: 520, marginBottom: 20 }} onSubmit={(e) => e.preventDefault()}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-3)' }} />
            <input placeholder="Search clubs by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && (
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setSearch('')}>
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </form>

          <div className="filter-chips">
            {FILTERS.map((f) => (
              <button key={f.key} className={`chip${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Loader label="Loading clubs…" />
          ) : clubs.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-people-group" />
              <p>No clubs yet - be the first to create one!</p>
            </div>
          ) : (
            <ScrollRow>
              {clubs.map((c) => (
                <div className="app-scroll-item" key={c._id}>
                  <ClubCard club={c} />
                </div>
              ))}
            </ScrollRow>
          )}

          <PromoBanner
            icon="fa-solid fa-motorcycle"
            message="Own a bike, car, or off-roader? Start a club and gather your crew in one place."
            cta="Create Your Club"
            to="/plan-club"
          />
        </div>
      </section>
    </>
  );
}
