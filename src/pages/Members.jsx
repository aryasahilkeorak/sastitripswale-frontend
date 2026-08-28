import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import PageHero from '../components/PageHero.jsx';
import MemberCard from '../components/MemberCard.jsx';
import VerificationBadge from '../components/VerificationBadge.jsx';
import Loader from '../components/Loader.jsx';
import PromoBanner from '../components/PromoBanner.jsx';
import Seo from '../components/Seo.jsx';

const FILTERS = [
  { key: 'all', label: 'All', params: {} },
  { key: 'bike', label: 'Bike Owners', params: { vehicleType: 'Bike' } },
  { key: 'car', label: 'Car Owners', params: { vehicleType: 'Car' } },
  { key: 'male', label: 'Male', params: { gender: 'Male' } },
  { key: 'female', label: 'Female', params: { gender: 'Female' } },
  { key: 'verified', label: 'Verified', params: { verified: 'true' } },
];

// The card grid only ever previews this many - "Show all" switches to the
// full Instagram-style list instead of just growing the grid, so browsing
// the whole directory stays a quick scroll rather than a wall of big cards.
const GRID_PREVIEW_COUNT = 10;
const LIST_PAGE_SIZE = 30;

export default function Members() {
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // 'grid' = card preview (first 10) + "Show all" button.
  // 'list' = full Instagram-style list for the same filter/search, paginated.
  const [view, setView] = useState('grid');
  const [listMembers, setListMembers] = useState([]);
  const [listPagination, setListPagination] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [listLoadingMore, setListLoadingMore] = useState(false);

  const filterParams = () => {
    const f = FILTERS.find((x) => x.key === filter) || FILTERS[0];
    const params = { ...f.params };
    if (search.trim()) params.search = search.trim();
    return params;
  };

  // Grid preview - live search, debounced.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get('/members', { params: { limit: 40, ...filterParams() } })
        .then((r) => {
          setMembers(r.data.members);
          setPagination(r.data.pagination);
        })
        .catch(() => {
          setMembers([]);
          setPagination(null);
        })
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  // Full list view - (re)fetched from page 1 whenever it's opened, or the
  // filter/search changes while it's already open.
  useEffect(() => {
    if (view !== 'list') return;
    setListLoading(true);
    api
      .get('/members', { params: { limit: LIST_PAGE_SIZE, page: 1, ...filterParams() } })
      .then((r) => {
        setListMembers(r.data.members);
        setListPagination(r.data.pagination);
      })
      .catch(() => {
        setListMembers([]);
        setListPagination(null);
      })
      .finally(() => setListLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, filter, search]);

  const loadMoreList = () => {
    if (!listPagination || listPagination.page >= listPagination.pages) return;
    const nextPage = listPagination.page + 1;
    setListLoadingMore(true);
    api
      .get('/members', { params: { limit: LIST_PAGE_SIZE, page: nextPage, ...filterParams() } })
      .then((r) => {
        setListMembers((prev) => [...prev, ...r.data.members]);
        setListPagination(r.data.pagination);
      })
      .catch(() => {})
      .finally(() => setListLoadingMore(false));
  };

  const canShowAll = pagination && pagination.total > GRID_PREVIEW_COUNT;

  return (
    <>
      <Seo
        title="Find Travel Partners in India - Bikers, Car Owners & Backpackers"
        description="Browse verified travel community members across India - filter by bike or car owners, gender and verification status. Find your travel tribe and plan a trip together."
        path="/members"
      />
      <PageHero
        tag="The Community"
        tagIcon="fa-solid fa-users"
        title="Meet the"
        highlight="Travelers"
        sub="Connect with verified bikers, car travelers and backpackers across India."
      />

      <section style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <form
            className="search-bar"
            style={{ maxWidth: 520, marginBottom: 20 }}
            onSubmit={(e) => e.preventDefault()}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-3)' }} />
            <input placeholder="Search by name, city, email, mobile or user ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
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

          {view === 'grid' ? (
            loading ? (
              <Loader label="Loading members…" />
            ) : members.length === 0 ? (
              <div className="empty-state"><i className="fa-solid fa-user" /><p>No members found.</p></div>
            ) : (
              <>
                <div className="member-grid">
                  {members.slice(0, GRID_PREVIEW_COUNT).map((m) => (
                    <MemberCard key={m.id} member={m} />
                  ))}
                </div>
                {canShowAll && (
                  <div style={{ textAlign: 'center', marginTop: 28 }}>
                    <button type="button" className="btn btn-outline" onClick={() => setView('list')}>
                      <i className="fa-solid fa-list-ul" /> Show all {pagination.total} members
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
            <div style={{ maxWidth: 480 }}>
              <button type="button" className="ig-id-btn" style={{ marginBottom: 16 }} onClick={() => setView('grid')} aria-label="Back to grid" title="Back to grid">
                <i className="fa-solid fa-arrow-left" />
              </button>

              {listLoading ? (
                <Loader label="Loading members…" />
              ) : listMembers.length === 0 ? (
                <div className="empty-state"><i className="fa-solid fa-user" /><p>No members found.</p></div>
              ) : (
                <>
                  <div className="ig-follow-list">
                    {listMembers.map((m) => (
                      <div key={m.id} className="ig-follow-row">
                        <Link to={`/members/${m.username || m.id}`} className="ig-follow-avatar">
                          <img
                            src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)}
                            alt={m.fullName}
                            onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                          />
                        </Link>
                        <Link to={`/members/${m.username || m.id}`} className="ig-follow-info">
                          <strong>
                            {m.fullName}
                            <VerificationBadge role={m.role} verificationLevel={m.verificationLevel} isVerified={m.isVerified} icon />
                          </strong>
                          {m.username && <span className="text-muted">@{m.username}</span>}
                        </Link>
                      </div>
                    ))}
                  </div>
                  {listPagination && listPagination.page < listPagination.pages && (
                    <div style={{ textAlign: 'center', marginTop: 20 }}>
                      <button type="button" className="btn btn-outline" onClick={loadMoreList} disabled={listLoadingMore}>
                        {listLoadingMore ? <span className="spinner" /> : 'Load more'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <PromoBanner
            icon="fa-solid fa-user-plus"
            message="Know a traveler who'd love this community? Invite them and earn referral rewards."
            cta="Invite friends"
            to="/referrals"
          />
        </div>
      </section>
    </>
  );
}
