import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import PageHero from '../components/PageHero.jsx';
import Loader from '../components/Loader.jsx';
import Seo from '../components/Seo.jsx';

export default function Influencers() {
  const accessToken = useAuth((s) => s.accessToken);
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/influencers', { params: { limit: 40 } })
      .then((r) => setInfluencers(r.data.influencers))
      .catch(() => setInfluencers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Seo
        title="Become Our Influencer/Promoter"
        description="Join SastiTripsWale's Influencer/Promoter program - get your own coupon code, help travelers save on membership, and earn a commission on every signup."
        path="/influencers"
      />
      <PageHero
        tag="Promoter Program"
        tagIcon="fa-solid fa-star"
        title="Become Our"
        highlight="Influencer"
        sub="Get your own coupon code, share it with your audience, and earn a commission every time someone joins with it."
      />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="grid-3" style={{ marginBottom: 50 }}>
            <div className="why-card">
              <div className="why-icon" style={{ background: 'rgba(255,201,77,0.14)', color: 'var(--gold)' }}><i className="fa-solid fa-tag" /></div>
              <h3>Your Own Coupon</h3>
              <p>A personal code like <strong>SAHIL10</strong> - approved influencers get it named after them, with a real discount for whoever uses it.</p>
            </div>
            <div className="why-card">
              <div className="why-icon" style={{ background: 'rgba(16,185,129,0.14)', color: '#6ee7b7' }}><i className="fa-solid fa-sack-dollar" /></div>
              <h3>Real Commission</h3>
              <p>Earn a percentage of every membership purchased with your code - tracked in a running ledger on your dashboard.</p>
            </div>
            <div className="why-card">
              <div className="why-icon" style={{ background: 'rgba(224,64,251,0.12)', color: 'var(--magenta)' }}><i className="fa-solid fa-people-group" /></div>
              <h3>Grow the Community</h3>
              <p>Help fellow travelers save money while you build your own following on the platform.</p>
            </div>
          </div>

          <div className="text-center" style={{ marginBottom: 40 }}>
            {accessToken ? (
              <Link to="/dashboard?tab=settings&view=influencer" className="btn btn-primary btn-lg">
                <i className="fa-solid fa-paper-plane" /> Apply Now
              </Link>
            ) : (
              <Link to="/join" className="btn btn-primary btn-lg">
                <i className="fa-solid fa-users" /> Join to Apply
              </Link>
            )}
          </div>

          <div className="text-center fade-up" style={{ marginBottom: 32 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-crown" /> Our Influencers</div>
            <h2 className="section-title">Meet the <span className="highlight">Promoters</span></h2>
          </div>

          {loading ? (
            <Loader label="Loading…" />
          ) : influencers.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-star" />
              <p>No approved influencers yet - be the first!</p>
            </div>
          ) : (
            <div className="member-grid">
              {influencers.map((inf) => (
                <Link key={inf.id} to={`/members/${inf.id}`} className="member-card" style={{ color: 'inherit' }}>
                  <div className="member-avatar">
                    <img src={imageUrl(inf.avatarUrl, AVATAR_FALLBACK)} alt={inf.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                  </div>
                  <h3>{inf.fullName}</h3>
                  <p className="member-meta">{inf.city || 'India'}</p>
                  {inf.coupon && (
                    <span className="badge badge-fire" style={{ marginTop: 10 }}>
                      <i className="fa-solid fa-tag" /> {inf.coupon.code}
                      {inf.coupon.discountPct ? ` - ${inf.coupon.discountPct}% off` : ''}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
