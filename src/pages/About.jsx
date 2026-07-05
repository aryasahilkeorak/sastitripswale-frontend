import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';

const VALUES = [
  { icon: '🛡️', h: 'Safety First', p: 'Every member is ID-verified before joining any group.' },
  { icon: '💰', h: 'Budget Travel', p: 'Split costs fairly so anyone can afford to explore India.' },
  { icon: '🤝', h: 'Real Connections', p: 'Turn co-travelers into lifelong friends.' },
  { icon: '🗺️', h: 'Explore India', p: 'From the Himalayas to the beaches of the south.' },
  { icon: '⚡', h: 'Easy Planning', p: 'Post a trip in minutes and let members join.' },
  { icon: '👩', h: 'Women Safety', p: 'Dedicated women-safe verified groups.' },
];

// Edit these names, photos and social links to your real team details.
const TEAM = [
  {
    name: 'Arya Sahil Keorak',
    title: 'Founder & CEO',
    photo: 'https://i.pravatar.cc/400?img=12',
    quote: 'I built SastiTripWale after too many solo trips got cancelled. Travel should never wait — here, you always find your tribe.',
    socials: [
      { icon: 'ri-instagram-line', url: 'https://instagram.com/' },
      { icon: 'ri-linkedin-box-line', url: 'https://linkedin.com/' },
      { icon: 'ri-twitter-x-line', url: 'https://x.com/' },
      { icon: 'ri-whatsapp-line', url: 'https://wa.me/919876543210' },
    ],
  },
  {
    name: 'Co-Founder Name',
    title: 'Co-Founder & COO',
    photo: 'https://i.pravatar.cc/400?img=33',
    quote: 'Every road in India has a story. We help you find the right people to share it with — safely and affordably.',
    socials: [
      { icon: 'ri-instagram-line', url: 'https://instagram.com/' },
      { icon: 'ri-linkedin-box-line', url: 'https://linkedin.com/' },
      { icon: 'ri-twitter-x-line', url: 'https://x.com/' },
      { icon: 'ri-facebook-line', url: 'https://facebook.com/' },
    ],
  },
];

export default function About() {
  return (
    <>
      <PageHero tag="Our Story" tagIcon="ri-information-fill" title="About" highlight="SastiTripWale" sub="India's #1 verified travel community — travel together, split expenses, make friends." />

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="grid-2 mb-4">
            <div className="card" style={{ padding: 32 }}>
              <div className="why-icon" style={{ background: 'rgba(255,107,0,0.12)' }}>🎯</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 10 }}>Our Mission</h3>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.85 }}>
                To make travel affordable, safe and social for every young Indian — by connecting solo
                travelers into verified groups that split costs and explore together.
              </p>
            </div>
            <div className="card" style={{ padding: 32 }}>
              <div className="why-icon" style={{ background: 'rgba(224,64,251,0.12)' }}>🔭</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 10 }}>Our Vision</h3>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.85 }}>
                A India where no one skips a trip for lack of company or budget — where every road,
                mountain and beach is explored with a trusted tribe.
              </p>
            </div>
          </div>

          {/* Team — Founder + Co-Founder */}
          <div className="text-center fade-up mb-4">
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="ri-team-fill" /> Our Team</div>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>Meet the <span className="highlight">Founders</span></h2>
          </div>
          <div className="grid-2 mb-4">
            {TEAM.map((m) => (
              <div className="card fade-up" style={{ padding: 30, textAlign: 'center' }} key={m.name}>
                <img className="member-avatar" style={{ width: 110, height: 110 }} src={m.photo} alt={m.name} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginTop: 12 }}>{m.name}</h3>
                <div className="section-tag" style={{ margin: '8px auto' }}>{m.title}</div>
                <p style={{ color: 'var(--text-2)', lineHeight: 1.8, fontSize: '0.9rem' }}>&ldquo;{m.quote}&rdquo;</p>
                <div className="social-links" style={{ justifyContent: 'center', marginTop: 16 }}>
                  {m.socials.map((s) => (
                    <a key={s.icon} href={s.url} target="_blank" rel="noreferrer" aria-label="social">
                      <i className={s.icon} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mb-4">
            <Link to="/join" className="btn btn-primary"><i className="ri-rocket-line" /> Join the community</Link>
          </div>

          {/* Values */}
          <div className="text-center fade-up mb-4">
            <h2 className="section-title" style={{ fontSize: '2rem' }}>What We <span className="highlight">Stand For</span></h2>
          </div>
          <div className="grid-3">
            {VALUES.map((v) => (
              <div className="why-card fade-up" key={v.h}>
                <div className="why-icon" style={{ background: 'rgba(255,107,0,0.1)' }}>{v.icon}</div>
                <h3>{v.h}</h3>
                <p>{v.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
