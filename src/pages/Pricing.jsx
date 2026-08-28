import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import Seo from '../components/Seo.jsx';
import { PLAN_PRICES, TRIP_PACK_TIERS, TRIP_PACK_PRICES, tripPackLabel } from '../lib/helpers.js';

const FEATURES = [
  'Host your own trips (set route, dates, budget & seats)',
  'Join trips hosted by other verified members',
  'Create and join travel clubs',
  'Send and accept connection requests with other members',
  'Trip & club group chat, plus direct messages',
  'Upload trip photos to the community gallery',
];

const TIERS = [
  {
    key: 'single',
    label: 'Only Male / Only Female',
    sub: 'Single-gender travel groups - e.g. women-only trips for extra comfort and safety',
    icon: 'fa-solid fa-user',
    accent: 'var(--cyan)',
    bg: 'rgba(0,212,255,0.1)',
  },
  {
    key: 'both',
    label: 'Male + Female',
    sub: 'Mixed-gender travel groups',
    icon: 'fa-solid fa-users',
    accent: 'var(--fire)',
    bg: 'rgba(255,122,26,0.12)',
  },
];

const TRIP_PACK_NOTES = [
  'Host and join credits are separate pools - a pass buys that many of each, not a combined total.',
  'Hosting a trip spends one host credit; a join request spends one join credit only once accepted.',
  'A withdrawn or declined join request refunds its credit automatically - no need to contact support.',
  'Buying another pass tops up whatever credits you already have - nothing is lost or reset.',
];

export default function Pricing() {
  return (
    <>
      <Seo
        title="Pricing - Membership Plans"
        description="SastiTripsWale membership pricing: ₹199-₹499 for a one-time, non-recurring 6-month or 1-year platform access period. No hidden fees, no auto-renewal."
        path="/pricing"
      />
      <PageHero
        tag="Membership"
        tagIcon="fa-solid fa-tag"
        title="Simple, Upfront"
        highlight="Pricing"
        sub="One membership fee unlocks the full platform for a fixed period - no hidden charges, no auto-renewal."
      />

      <section>
        <div className="container">
          <div className="grid-2 mb-4">
            {TIERS.map((t) => (
              <div className="card fade-up" style={{ padding: 28 }} key={t.key}>
                <div className="why-icon" style={{ background: t.bg, color: t.accent }}>
                  <i className={t.icon} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginTop: 14, marginBottom: 4 }}>{t.label}</h3>
                <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: 22 }}>{t.sub}</p>
                <div style={{ display: 'flex', gap: 28, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>₹{PLAN_PRICES[t.key]['6m']}</div>
                    <div style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>for 6 months</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>₹{PLAN_PRICES[t.key]['1y']}</div>
                    <div style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>for 1 year</div>
                  </div>
                </div>
                <p className="text-muted" style={{ fontSize: '0.78rem' }}>All prices in INR, one-time payment, taxes as applicable.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--bg-2)' }}>
        <div className="container">
          <div className="text-center fade-up" style={{ marginBottom: 36 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-ticket" /> Or Pay Per Trip</div>
            <h2 className="section-title" style={{ fontSize: '1.7rem' }}>Just Want to Try a <span className="highlight">Few Trips?</span></h2>
            <p className="section-sub" style={{ maxWidth: 520, margin: '10px auto 0' }}>
              A flat, one-time fee for a set number of host and join credits - no duration, no auto-renewal.
            </p>
          </div>

          <div className="grid-3 mb-4">
            {TRIP_PACK_TIERS.map((tier) => {
              const popular = tier === 2;
              return (
                <div
                  className="card fade-up"
                  style={{
                    padding: 24,
                    borderColor: popular ? 'var(--fire)' : undefined,
                  }}
                  key={tier}
                >
                  <div className="row-between" style={{ marginBottom: 14 }}>
                    <div className="why-icon" style={{ background: 'rgba(255,122,26,0.12)', color: 'var(--fire)', marginBottom: 0 }}>
                      <i className="fa-solid fa-ticket" />
                    </div>
                    {popular && <span className="badge badge-fire">Most Popular</span>}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 4 }}>
                    {tier} Trip{tier > 1 ? 's' : ''}
                  </h3>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginBottom: 16 }}>{tripPackLabel(tier)}</p>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                    {`₹${TRIP_PACK_PRICES[tier]}`}
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.76rem' }}>One-time, flat price - no coupons applicable</p>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div className="grid-2" style={{ gap: '10px 32px' }}>
              {TRIP_PACK_NOTES.map((note) => (
                <div key={note} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--fire)', marginTop: 4, flexShrink: 0, fontSize: '0.85rem' }} />
                  <span style={{ color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.6 }}>{note}</span>
                </div>
              ))}
            </div>
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 16, marginBottom: 0 }}>
              A Trip Pass covers hosting and joining trips only - clubs, connections, and messaging still require
              a membership above.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="text-center fade-up" style={{ marginBottom: 36 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-circle-info" /> Details</div>
            <h2 className="section-title" style={{ fontSize: '1.7rem' }}>Everything You <span className="highlight">Need to Know</span></h2>
          </div>

          <div className="card mb-4" style={{ padding: 26 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>What's included</h3>
            <div className="grid-3">
              {FEATURES.map((f) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-2)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--fire)', marginTop: 3, flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 26 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>The fine print</h3>
            <dl className="grid-2" style={{ margin: 0, columnGap: 32, rowGap: 0 }}>
              {[
                ['What am I paying for?', 'A platform/membership fee for access to SastiTripsWale’s premium community features - not a payment for any specific trip, booking, or third-party travel service.'],
                ['One-time or recurring?', 'One-time. Your card/UPI is never auto-charged again - membership simply expires at the end of the period unless you choose to buy another.'],
                ['Why does price vary by preference?', 'Pricing has two tiers based on your travel-group composition preference (single-gender vs. mixed groups) - a safety/comfort setting, not a matching or dating feature.'],
                ['Can I get a discount?', 'Yes, if you have a valid coupon code - apply it at checkout on the Join page before paying. Coupons never apply to the Trip Pass.'],
                ['Is it refundable?', 'Once activated, membership or a Trip Pass is non-refundable except for duplicate charges or a payment that was deducted but never activated. See our Cancellation & Refund Policy.'],
                ['What happens at expiry?', 'Premium features pause until you renew. Nothing is deleted, and you are never charged automatically.'],
                ['What happens when my Trip Pass credits run out?', "Hosting or joining another trip is paused until you buy another pass (or a membership) - your account, past trips, and chat history are unaffected."],
              ].map(([q, a]) => (
                <div key={q} style={{ marginBottom: 18 }}>
                  <dt style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 4 }}>{q}</dt>
                  <dd style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.82rem', lineHeight: 1.65 }}>{a}</dd>
                </div>
              ))}
            </dl>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              <Link to="/refund-policy" className="btn btn-sm btn-outline">Refund Policy</Link>
              <Link to="/terms" className="btn btn-sm btn-outline">Terms &amp; Conditions</Link>
              <Link to="/faq" className="btn btn-sm btn-outline">FAQ</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card fade-up">
            <div className="cta-orb-1" />
            <div className="cta-orb-2" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="section-tag" style={{ margin: '0 auto 16px' }}><i className="fa-solid fa-rocket" /> Ready?</div>
              <h2 className="section-title">Join the <span className="highlight">Community</span></h2>
              <p style={{ color: 'var(--text-2)', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.75 }}>
                Sign up, pick your plan, and start hosting or joining trips.
              </p>
              <Link to="/join" className="btn btn-primary btn-lg"><i className="fa-solid fa-users" /> Join Community</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
