import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { imageUrl } from '../lib/helpers.js';
import PageHero from '../components/PageHero.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';

const STAT_META = [
  { icon: 'fa-solid fa-users', label: 'Verified Members', key: 'members' },
  { icon: 'fa-solid fa-route', label: 'Trips Completed', key: 'completedTrips' },
  { icon: 'fa-solid fa-location-dot', label: 'Cities Covered', key: 'cities' },
  { icon: 'fa-solid fa-handshake', label: 'Connections Made', key: 'connections' },
];

const STEPS = [
  { n: '01', icon: 'fa-solid fa-user-plus', h: 'Sign Up', p: 'Create your account with just an email, mobile number & travel preference — under a minute.' },
  { n: '02', icon: 'fa-solid fa-id-card', h: 'Get Verified', p: 'Pick a plan, complete your profile and upload an ID. Every member is verified before joining a group.' },
  { n: '03', icon: 'fa-solid fa-map-location-dot', h: 'Plan or Join a Trip', p: 'Host your own trip, or browse verified trips by destination, vehicle type and budget.' },
  { n: '04', icon: 'fa-solid fa-people-carry-box', h: 'Travel & Split Costs', p: 'Chat with your group, coordinate logistics, and split the budget fairly — for a fraction of the solo cost.' },
];

const VALUES = [
  { icon: 'fa-solid fa-shield-halved', h: 'Safety First', p: 'Every member is ID-verified before joining any group.', c: 'fire' },
  { icon: 'fa-solid fa-wallet', h: 'Budget Travel', p: 'Split costs fairly so anyone can afford to explore India.', c: 'blue' },
  { icon: 'fa-solid fa-handshake', h: 'Real Connections', p: 'Turn co-travelers into lifelong friends.', c: 'gold' },
  { icon: 'fa-solid fa-map-location-dot', h: 'Explore India', p: 'From the Himalayas to the beaches of the south.', c: 'fire' },
  { icon: 'fa-solid fa-bolt', h: 'Easy Planning', p: 'Post a trip in minutes and let members join.', c: 'blue' },
  { icon: 'fa-solid fa-venus', h: 'Women Safety', p: 'Dedicated women-safe verified groups.', c: 'gold' },
];

const VALUE_STYLE = {
  fire: { background: 'rgba(255,122,26,0.12)', color: 'var(--fire)' },
  blue: { background: 'rgba(62,142,247,0.12)', color: 'var(--cyan)' },
  gold: { background: 'rgba(255,201,77,0.14)', color: 'var(--gold)' },
};

// Small decorative "journey" divider used to separate major sections —
// a dashed route with a waypoint dot, echoing the brand's road/pin motif.
function RouteDivider() {
  return (
    <div className="about-divider" aria-hidden="true">
      <svg width="180" height="24" viewBox="0 0 180 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="12" x2="72" y2="12" stroke="var(--glass-bdr-2)" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" />
        <circle cx="90" cy="12" r="11" stroke="var(--fire)" strokeWidth="1.5" opacity="0.35" fill="none" />
        <circle cx="90" cy="12" r="6" fill="var(--fire)" />
        <line x1="108" y1="12" x2="180" y2="12" stroke="var(--glass-bdr-2)" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Edit this name, photo and social links to your real founder details.
const TEAM = [
  {
    name: 'Arya Sahil Keorak',
    title: 'Founder & CEO',
    photo: 'https://i.pravatar.cc/400?img=12',
    quote: 'I built SastiTripsWale after too many solo trips got cancelled. Travel should never wait — here, you always find your tribe.',
    socials: [
      { icon: 'fa-brands fa-instagram', url: 'https://instagram.com/aryasahilkeorak' },
      { icon: 'fa-brands fa-linkedin', url: 'https://linkedin.com/aryasahilkeorak' },
      { icon: 'fa-brands fa-x-twitter', url: 'https://x.com/aryasahilkeorak' }
    ],
  },
];

export default function About() {
  const [stats, setStats] = useState(null);
  const [founderPhoto, setFounderPhoto] = useState('');

  useEffect(() => {
    api.get('/stats').then((r) => setStats(r.data.stats)).catch(() => {});
    // Use the real super admin's uploaded profile photo for the founder
    // card instead of the placeholder pravatar image, when available.
    api
      .get('/members', { params: { limit: 60 } })
      .then((r) => {
        const founder = r.data.members?.find((m) => m.role === 'superadmin');
        if (founder?.avatarUrl) setFounderPhoto(imageUrl(founder.avatarUrl));
      })
      .catch(() => {});
  }, []);

  const team = founderPhoto ? [{ ...TEAM[0], photo: founderPhoto }, ...TEAM.slice(1)] : TEAM;

  return (
    <>
      <PageHero tag="Our Story" tagIcon="fa-solid fa-circle-info" title="About" highlight="SastiTripsWale" sub="India's #1 verified travel community — travel together, split expenses, make friends." />

      {/* Story */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="orb orb-fire" style={{ width: 320, height: 320, top: -140, right: -80 }} />
        <div className="orb orb-cyan" style={{ width: 260, height: 260, bottom: -120, left: -100 }} />
        <div className="container">
          <div className="row-between" style={{ alignItems: 'center', gap: 48, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 380px' }} className="fade-left">
              <div className="section-tag"><i className="fa-solid fa-book-open" /> Why We Started</div>
              <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: 18 }}>
                A Cancelled Trip <span className="highlight">Changed Everything</span>
              </h2>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.9, marginBottom: 16 }}>
                It started with a solo Spiti Valley ride that never happened. Every riding buddy dropped out
                one by one, leaving a choice between an expensive solo trip or no trip at all — a frustration
                shared by thousands of travelers across India who skip adventures every year simply because
                they can't find the right people to go with, or can't justify the cost alone.
              </p>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.9 }}>
                <strong style={{ color: 'var(--text)' }}>SastiTripsWale</strong> ("budget traveler" in Hindi) was
                built to fix exactly that — a verified community where bikers, car travelers and backpackers
                find each other, split costs fairly, and turn strangers into travel companions. Every member is
                ID-verified, every group is safety-checked, and every trip is built around one idea: nobody
                should skip an adventure for lack of company or budget.
              </p>
            </div>
            <div style={{ flex: '1 1 320px' }} className="fade-right">
              <div className="card" style={{ padding: 36 }}>
                <i className="fa-solid fa-quote-left" style={{ fontSize: '1.8rem', color: 'var(--fire)' }} />
                <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--text)', margin: '16px 0 20px', lineHeight: 1.8 }}>
                  &ldquo;{team[0].quote}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={team[0].photo} alt={team[0].name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>{team[0].name}</strong>
                    <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{team[0].title}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RouteDivider />

      {/* By the numbers */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STAT_META.map((s) => {
              const value = stats?.[s.key] ?? 0;
              return (
                <div className="stat-card fade-up" key={s.label}>
                  <div className="stat-icon"><i className={s.icon} /></div>
                  <AnimatedCounter key={value} target={value} suffix="" />
                  <div className="stat-label">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="orb orb-cyan" style={{ width: 280, height: 280, top: 240, right: -120 }} />
        <div className="container">
          {/* Mission / Vision */}
          <div className="grid-2" style={{ marginBottom: 70 }}>
            <div className="card fade-up" style={{ padding: 32 }}>
              <div className="why-icon" style={{ background: 'rgba(255,122,26,0.12)', color: 'var(--fire)' }}><i className="fa-solid fa-bullseye" /></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 10 }}>Our Mission</h3>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.85 }}>
                To make travel affordable, safe and social for every young Indian — by connecting solo
                travelers into verified groups that split costs and explore together.
              </p>
            </div>
            <div className="card fade-up" style={{ padding: 32 }}>
              <div className="why-icon" style={{ background: 'rgba(62,142,247,0.12)', color: 'var(--cyan)' }}><i className="fa-solid fa-binoculars" /></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 10 }}>Our Vision</h3>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.85 }}>
                An India where no one skips a trip for lack of company or budget — where every road,
                mountain and beach is explored with a trusted tribe.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="text-center fade-up" style={{ marginBottom: 44 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-diagram-project" /> How It Works</div>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>From Sign-Up to <span className="highlight">Send-Off</span></h2>
          </div>
          <div className="grid-4" style={{ marginBottom: 70 }}>
            {STEPS.map((s) => (
              <div className="card fade-up" style={{ padding: 26 }} key={s.n}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
                  STEP {s.n}
                </div>
                <div className="why-icon" style={{ background: 'rgba(255,122,26,0.1)', color: 'var(--fire)', marginTop: 10, marginBottom: 16 }}>
                  <i className={s.icon} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 6 }}>{s.h}</h3>
                <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', lineHeight: 1.7 }}>{s.p}</p>
              </div>
            ))}
          </div>

          <RouteDivider />

          {/* Team — Founder */}
          <div className="text-center fade-up" style={{ marginBottom: 44 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-people-group" /> Leadership</div>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>Meet the <span className="highlight">Founder</span></h2>
          </div>
          <div style={{ marginBottom: 70 }}>
            {team.map((m) => (
              <div className="founder-showcase fade-up" key={m.name}>
                <div className="founder-orb" aria-hidden="true" />
                <div className="founder-photo-wrap">
                  <img src={m.photo} alt={m.name} />
                  <span className="founder-ribbon"><i className="fa-solid fa-star" /> Founder</span>
                </div>
                <div className="founder-info">
                  <h3>{m.name}</h3>
                  <div className="section-tag" style={{ margin: '10px 0 20px' }}>{m.title}</div>
                  <div className="founder-quote">
                    <i className="fa-solid fa-quote-left" aria-hidden="true" />
                    <p>{m.quote}</p>
                  </div>
                  <div className="social-links">
                    {m.socials.map((s) => (
                      <a key={s.icon} href={s.url} target="_blank" rel="noreferrer" aria-label="social">
                        <i className={s.icon} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <RouteDivider />

          {/* Values */}
          <div className="text-center fade-up" style={{ marginBottom: 44 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-star" /> Our Values</div>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>What We <span className="highlight">Stand For</span></h2>
          </div>
          <div className="grid-3" style={{ marginBottom: 30 }}>
            {VALUES.map((v) => (
              <div className="why-card fade-up" key={v.h}>
                <div className="why-icon" style={VALUE_STYLE[v.c]}><i className={v.icon} /></div>
                <h3>{v.h}</h3>
                <p>{v.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card fade-up">
            <div className="cta-orb-1" />
            <div className="cta-orb-2" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="section-tag" style={{ margin: '0 auto 16px' }}><i className="fa-solid fa-rocket" /> Ready When You Are</div>
              <h2 className="section-title">Your Next <span className="highlight">Adventure</span> Starts Here</h2>
              <p style={{ color: 'var(--text-2)', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.75 }}>
                Join thousands of verified travelers already splitting costs and making memories across India.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/join" className="btn btn-primary btn-lg"><i className="fa-solid fa-users" /> Join Community</Link>
                <Link to="/contact" className="btn btn-outline btn-lg"><i className="fa-solid fa-envelope" /> Get in Touch</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
