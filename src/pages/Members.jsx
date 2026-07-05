import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import PageHero from '../components/PageHero.jsx';
import MemberCard from '../components/MemberCard.jsx';
import Loader from '../components/Loader.jsx';

const FILTERS = [
  { key: 'all', label: 'All', params: {} },
  { key: 'bike', label: 'Bike Owners', params: { vehicleType: 'Bike' } },
  { key: 'car', label: 'Car Owners', params: { vehicleType: 'Car' } },
  { key: 'male', label: 'Male', params: { gender: 'Male' } },
  { key: 'female', label: 'Female', params: { gender: 'Female' } },
  { key: 'verified', label: 'Verified', params: { verified: 'true' } },
];

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const f = FILTERS.find((x) => x.key === filter) || FILTERS[0];
    const params = { limit: 40, ...f.params };
    if (query) params.search = query;
    api
      .get('/members', { params })
      .then((r) => setMembers(r.data.members))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [filter, query]);

  return (
    <>
      <PageHero
        tag="The Community"
        tagIcon="fa-solid fa-users"
        title="Meet the"
        highlight="Travelers"
        sub="Connect with verified bikers, car travelers and backpackers across India."
      />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <form
            className="search-bar"
            style={{ maxWidth: 520, marginBottom: 20 }}
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
            }}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-3)' }} />
            <input placeholder="Search by name, email, mobile or user ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit" className="btn btn-sm btn-primary">Search</button>
          </form>

          <div className="filter-chips">
            {FILTERS.map((f) => (
              <button key={f.key} className={`chip${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Loader label="Loading members…" />
          ) : members.length === 0 ? (
            <div className="empty-state"><i className="fa-solid fa-user" /><p>No members found.</p></div>
          ) : (
            <div className="member-grid">
              {members.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
