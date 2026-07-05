import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import TripCard from '../components/TripCard.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import Stars from '../components/Stars.jsx';
import Lightbox from '../components/Lightbox.jsx';

const STATS = [
  { icon: '👥', target: 5240, suffix: '+', label: 'Active Members' },
  { icon: '✈️', target: 320, suffix: '+', label: 'Trips Completed' },
  { icon: '📍', target: 48, suffix: '+', label: 'Cities Covered' },
  { icon: '❤️', target: 12000, suffix: '+', label: 'Connections Made' },
];

const WHY = [
  { glow: 'var(--fire)', bg: 'rgba(255,107,0,0.12)', icon: '🔍', h: 'Find Your Travel Tribe', p: 'Connect with verified bikers, car owners & backpackers. Filter by vehicle, interests, age & destination.' },
  { glow: 'var(--magenta)', bg: 'rgba(224,64,251,0.12)', icon: '💰', h: 'Split Expenses Smartly', p: 'Budget trips from ₹500/day by dividing fuel, hotel & food. Ladakh for ₹8,500 vs ₹40,000 alone.' },
  { glow: 'var(--cyan)', bg: 'rgba(0,212,255,0.1)', icon: '🛡️', h: 'Travel Safely Together', p: 'All members are ID-verified. Women-only sections. Emergency contacts shared within the group.' },
  { glow: 'var(--fire)', bg: 'rgba(255,107,0,0.12)', icon: '🏍️', h: 'Bike & Car Trips', p: 'Royal Enfield or Maruti Swift — find co-travelers for epic road trips across every corner of India.' },
  { glow: 'var(--magenta)', bg: 'rgba(224,64,251,0.12)', icon: '📸', h: 'Make Lifelong Memories', p: 'Shared trips create bonds that last forever. Our gallery has 2000+ real photos from real trips.' },
  { glow: '#25D366', bg: 'rgba(37,211,102,0.1)', icon: '💬', h: 'WhatsApp Group Access', p: 'Join dedicated groups for every trip. Co-ordinate, share live locations & stay connected real-time.' },
];

const CATS = [
  { img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80', label: 'Bike Trips', sub: '125+ active riders', badge: 'badge-fire', emoji: '🏍️' },
  { img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80', label: 'Road Trips', sub: 'Car & SUV groups', badge: 'badge-cyan', emoji: '🚗' },
  { img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80', label: 'Mountains', sub: 'Himalayas & Ghats', badge: 'badge-magenta', emoji: '⛰️' },
  { img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80', label: 'Camping', sub: 'Stargazing & bonfire', badge: 'badge-gold', emoji: '⛺' },
  { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', label: 'Beach Trips', sub: 'Goa, Gokarna & more', badge: 'badge-cyan', emoji: '🏖️' },
  { img: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80', label: 'Backpacking', sub: 'Budget ₹500/day', badge: 'badge-green', emoji: '🎒' },
];

const FAQS = [
  { q: 'How do I join SastiTripWale?', a: 'Click "Join Community", sign up, pick a membership plan (from ₹199), then complete your profile and upload your ID for verification. Use coupon FREEJOIN to join free!' },
  { q: 'Is it safe to travel with strangers?', a: 'Yes! Every member is verified with Aadhaar/PAN before joining. Emergency contacts are collected, and we have dedicated women-safe groups.' },
  { q: 'How does expense splitting work?', a: 'When a trip is created, the total estimated budget is divided among all confirmed members. A ₹25,000 Goa trip with 5 people costs just ₹5,000/person!' },
  { q: 'I have a bike but no travel friends. Can I join?', a: "Absolutely! That's exactly why SastiTripWale exists. Find hundreds of fellow bikers and car owners and make travel friends for life." },
  { q: 'What is the membership fee?', a: 'Plans start at ₹199 (6 months) or ₹299 (1 year) for single-gender groups, and ₹299 / ₹499 for mixed male+female groups. Use coupon FREEJOIN to waive it entirely!' },
];

const FALLBACK_GALLERY = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=500&q=80',
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=500&q=80',
  'https://images.unsplash.com/photo-1585789575701-f6ec571c1de4?w=500&q=80',
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=500&q=80',
];

export default function Home() {
  const [trips, setTrips] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [slide, setSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [lb, setLb] = useState(null);

  useEffect(() => {
    api.get('/trips', { params: { status: 'upcoming', limit: 3 } }).then((r) => setTrips(r.data.trips)).catch(() => {});
    api.get('/reviews', { params: { featured: 'true', limit: 6 } }).then((r) => setReviews(r.data.reviews)).catch(() => {});
    api.get('/gallery', { params: { limit: 5 } }).then((r) => setGallery(r.data.photos)).catch(() => {});
  }, []);

  // Auto-play testimonial slider.
  useEffect(() => {
    if (reviews.length < 2) return undefined;
    const id = setInterval(() => setSlide((s) => (s + 1) % reviews.length), 5500);
    return () => clearInterval(id);
  }, [reviews]);

  const galleryImgs = (gallery.length ? gallery.map((g) => imageUrl(g.photoUrl)) : FALLBACK_GALLERY);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-canvas" />
        <div className="hero-img">
          <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80" alt="Road trip" />
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <i className="ri-map-pin-2-fill" /> India's #1 Travel Community
            </div>
            <h1 className="hero-title">
              Find Your Tribe,
              <br />
              <span className="line2">Explore India.</span>
            </h1>
            <p className="hero-sub">
              Join 5000+ bikers, car travelers &amp; backpackers. Plan trips, split expenses, and
              travel safely in verified groups.
            </p>
            <div className="hero-btns">
              <Link to="/join" className="btn btn-primary btn-lg">
                <i className="ri-group-line" /> Join Community
              </Link>
              <Link to="/plan-trip" className="btn btn-lg" style={{ background: 'var(--grad-warm)', color: 'var(--text-inv)', boxShadow: '0 0 24px rgba(255,107,0,0.35)' }}>
                <i className="ri-map-2-line" /> Plan a Trip
              </Link>
              <Link to="/trips" className="btn btn-outline btn-lg">
                <i className="ri-compass-line" /> Explore Trips
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* Trust bar */}
      <div className="trust-bar">
        <div className="container">
          <div className="trust-inner">
            <div className="trust-item"><i className="ri-shield-check-fill" /> <strong>Verified</strong> Members</div>
            <div className="trust-item"><i className="ri-motorcycle-fill" /> Bike &amp; Car Trips</div>
            <div className="trust-item"><i className="ri-wallet-3-fill" /> Split Expenses</div>
            <div className="trust-item"><i className="ri-women-fill" /> Women-Safe Groups</div>
            <div className="trust-item"><i className="ri-whatsapp-fill" /> WhatsApp Groups</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s) => (
              <div className="stat-card fade-up" key={s.label}>
                <div className="stat-icon">{s.icon}</div>
                <AnimatedCounter target={s.target} suffix={s.suffix} />
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section>
        <div className="container">
          <div className="text-center fade-up">
            <div className="section-tag"><i className="ri-star-fill" /> Why Choose Us</div>
            <h2 className="section-title">Why <span className="highlight">SastiTripWale?</span></h2>
            <p className="section-sub">We solve real problems of solo travelers — finding partners, managing budgets, staying safe on the road.</p>
          </div>
          <div className="why-grid">
            {WHY.map((w) => (
              <div className="why-card fade-up" key={w.h}>
                <div className="why-icon" style={{ background: w.bg }}>{w.icon}</div>
                <h3>{w.h}</h3>
                <p>{w.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ background: 'var(--bg-2)' }}>
        <div className="container">
          <div className="fade-up">
            <div className="section-tag"><i className="ri-compass-3-fill" /> Explore Categories</div>
            <h2 className="section-title">Choose Your <span className="highlight">Adventure</span></h2>
          </div>
          <div className="cat-grid fade-up">
            {CATS.map((c) => (
              <Link to="/trips" className="cat-card" key={c.label}>
                <img src={c.img} alt={c.label} loading="lazy" />
                <div className="cat-overlay" />
                <div className="cat-label">
                  {c.label}
                  <span>{c.sub}</span>
                </div>
                <div className="cat-badge"><span className={`badge ${c.badge}`}>{c.emoji}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Trips */}
      <section>
        <div className="container">
          <div className="row-between" style={{ alignItems: 'flex-end', marginBottom: 44 }}>
            <div className="fade-left">
              <div className="section-tag"><i className="ri-fire-fill" /> Hot Right Now</div>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Upcoming <span className="highlight">Trips</span></h2>
            </div>
            <Link to="/trips" className="btn btn-outline fade-right">View All <i className="ri-arrow-right-line" /></Link>
          </div>
          {trips.length === 0 ? (
            <div className="empty-state"><i className="ri-compass-3-line" /><p>No trips yet — be the first to plan one!</p></div>
          ) : (
            <div className="trips-grid">
              {trips.map((t) => (
                <TripCard key={t._id} trip={t} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="testi-section">
          <div className="container">
            <div className="text-center fade-up">
              <div className="section-tag"><i className="ri-chat-quote-fill" /> Member Stories</div>
              <h2 className="section-title">What <span className="highlight">Travelers Say</span></h2>
            </div>
            <div className="slider-wrap fade-up">
              <div className="testi-slider">
                {reviews.map((r, i) => (
                  <div className={`slide${i === slide ? ' active' : ''}`} key={r._id}>
                    <div className="testi-card">
                      <img className="testi-avatar" src={imageUrl(r.user?.avatarUrl, AVATAR_FALLBACK)} alt={r.user?.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
                      <Stars value={r.rating} />
                      <p className="testi-quote">&ldquo;{r.message}&rdquo;</p>
                      <div className="testi-name">{r.user?.fullName || 'Traveler'}</div>
                      <div className="testi-role">{r.tripDestination || r.user?.city}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="slider-nav">
                <button className="prev" onClick={() => setSlide((s) => (s - 1 + reviews.length) % reviews.length)}><i className="ri-arrow-left-s-line" /></button>
                <div className="dots">
                  {reviews.map((r, i) => (
                    <div key={r._id} className={`dot${i === slide ? ' active' : ''}`} onClick={() => setSlide(i)} />
                  ))}
                </div>
                <button className="next" onClick={() => setSlide((s) => (s + 1) % reviews.length)}><i className="ri-arrow-right-s-line" /></button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery preview */}
      <section>
        <div className="container">
          <div className="row-between" style={{ alignItems: 'flex-end', marginBottom: 40 }}>
            <div className="fade-left">
              <div className="section-tag"><i className="ri-image-fill" /> Trip Memories</div>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Our <span className="highlight">Gallery</span></h2>
            </div>
            <Link to="/gallery" className="btn btn-outline fade-right">All Photos <i className="ri-arrow-right-line" /></Link>
          </div>
          <div className="gallery-preview-grid fade-up">
            {galleryImgs.slice(0, 5).map((src, i) => (
              <div className="gallery-thumb" key={i} onClick={() => setLb(i)}>
                <img src={src} alt="Trip memory" loading="lazy" />
                <div className="gallery-overlay"><i className="ri-zoom-in-line" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'var(--bg-2)' }}>
        <div className="container">
          <div className="text-center fade-up" style={{ marginBottom: 44 }}>
            <div className="section-tag"><i className="ri-question-fill" /> FAQ</div>
            <h2 className="section-title">Frequently Asked <span className="highlight">Questions</span></h2>
          </div>
          <div style={{ maxWidth: 700, margin: '0 auto' }} className="fade-up">
            {FAQS.map((f, i) => (
              <div className={`faq-item${openFaq === i ? ' open' : ''}`} key={f.q}>
                <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  {f.q}
                  <span className="faq-icon">+</span>
                </div>
                <div className="faq-a" style={{ maxHeight: openFaq === i ? 200 : 0 }}>
                  <div className="faq-a-inner">{f.a}</div>
                </div>
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
              <div className="section-tag" style={{ margin: '0 auto 16px' }}><i className="ri-rocket-fill" /> Limited Spots</div>
              <h2 className="section-title">Ready for Your Next <span className="highlight">Adventure?</span></h2>
              <p style={{ color: 'var(--text-2)', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.75 }}>
                Join 5000+ travelers already exploring India together. Use code{' '}
                <strong style={{ color: 'var(--fire-2)', fontFamily: 'var(--font-mono)' }}>FREEJOIN</strong> for free membership!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/join" className="btn btn-primary btn-lg"><i className="ri-group-line" /> Join Community</Link>
                <Link to="/trips" className="btn btn-outline btn-lg"><i className="ri-compass-line" /> Browse Trips</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Lightbox images={galleryImgs} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
    </>
  );
}
