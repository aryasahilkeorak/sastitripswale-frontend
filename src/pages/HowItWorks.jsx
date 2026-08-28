import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import Seo from '../components/Seo.jsx';
import { PLAN_PRICES } from '../lib/helpers.js';

const GETTING_STARTED = [
  {
    n: '01',
    icon: 'fa-solid fa-user-plus',
    h: 'Sign Up',
    p: "Create an account with just your email, mobile number, gender, and who you'd like to travel with (Only Male, Only Female, or Male + Female). It takes under a minute - no long forms up front.",
  },
  {
    n: '02',
    icon: 'fa-solid fa-credit-card',
    h: 'Choose a Plan & Pay',
    p: 'Pick 6 months or 1 year. Have a coupon? Apply it at checkout to bring the price down, then pay securely through Razorpay.',
  },
  {
    n: '03',
    icon: 'fa-solid fa-id-card',
    h: 'Complete Your Profile',
    p: 'Add your name, city, gender, at least one travel interest, and vehicle details if you own one. Upload your Aadhaar (front & back) and a live selfie - vehicle owners also add a Driving Licence and RC.',
  },
  {
    n: '04',
    icon: 'fa-solid fa-route',
    h: 'Start Traveling',
    p: "Once your membership is active and your profile is complete, everything unlocks - host a trip, join one, create a travel club, or just browse the community.",
  },
];

const PRICING = [
  { key: 'single', label: 'Only Male / Only Female', sub: 'Single-gender groups', icon: 'fa-solid fa-user' },
  { key: 'both', label: 'Male + Female', sub: 'Mixed groups', icon: 'fa-solid fa-users' },
];

const SECTIONS = [
  {
    tag: 'Trips',
    icon: 'fa-solid fa-route',
    title: 'Host or Join',
    highlight: 'a Trip',
    body: [
      "Have a route in mind? Host a trip: set your origin, destination and any via-stops, your travel dates, a per-head budget, vehicle type, and how many seats you're offering. Choose exactly what the budget covers - just fuel & toll, fuel + stay, fuel + stay + food, or a fully all-inclusive number - so joiners know precisely what they're paying for.",
      "Don't have a vehicle or a route yet? Browse open trips instead, filtered by destination, vehicle type, budget, or dates - or search BlaBlaCar-style by where you're leaving from, where you're going, and when. Send a request to join; the host reviews it and accepts or declines. Seats fill up in real time, so you always know exactly how many spots are left.",
      'Prefer riding in a fixed-capacity group instead of a one-off trip? Group Trips work the same way but are built around a specific vehicle (a car seats up to 4, a bike takes one pillion) - the host manages requests the same way.',
    ],
    bullets: [
      'Every trip gets its own group chat automatically - organizer plus everyone accepted',
      'Trip photos get mirrored into the community gallery',
      'Completed trips show a full expense breakdown on a public timeline',
    ],
  },
  {
    tag: 'Budgeting',
    icon: 'fa-solid fa-wallet',
    title: 'Split Expenses',
    highlight: '(Split-Contri)',
    body: [
      "The whole point of traveling together is that costs stop being a solo burden. When a trip is created, the total estimated budget is divided evenly among every confirmed member - a ₹25,000 Goa trip with 5 people works out to just ₹5,000 each, instead of ₹25,000 alone.",
      'After a trip wraps up, the organizer can log the actual expense breakdown, so future travelers can see exactly what a similar trip really costs before they commit.',
    ],
    bullets: [],
  },
  {
    tag: 'Comfort & Safety',
    icon: 'fa-solid fa-heart',
    title: 'Special',
    highlight: 'Modes',
    body: [
      'Every trip and membership plan carries a co-traveler preference: Only Male, Only Female, or Male + Female. Gender-restricted trips only ever appear to travelers with a matching preference - you\'ll never see or be matched into a group you didn\'t opt into.',
      "Couples Mode reserves paired seats for travelling duos - it requires a Car (not a bike), an even number of seats (4 or more), and a partner's mobile number plus an uploaded ID, so both halves of the couple are verified before the trip is confirmed.",
      "Want the tightest circle possible? Girls-only and boys-only groups keep travel strictly within one gender for members who prefer that extra layer of comfort.",
    ],
    bullets: [],
  },
  {
    tag: 'New',
    icon: 'fa-solid fa-people-group',
    title: 'Travel',
    highlight: 'Clubs',
    body: [
      "Trips are one-off; clubs are permanent. If you own a bike, a car, or an off-roader, you can start a persistent club - a standing group chat with its own name, description, profile photo and cover banner - instead of re-forming a group every time you plan a ride.",
      'Creating a club requires the right vehicle on your profile: a bike for a Bikers Club, a car for Cars or Offroading, and any vehicle at all for the open "Other" category. The creator becomes the owner and first admin.',
      'Admins - not just the owner - can add members directly by mobile number, username, User ID or email, promote other members to admin, and remove members. Anyone can also request to join a public club; an admin approves or rejects the request. Non-members get a preview - the club\'s description and a handful of members - before deciding to join; the full roster and chat unlock once they\'re in.',
    ],
    bullets: [
      "Only the owner can disband a club, and the owner can never be removed or demoted",
      'Every club gets the same group chat used for trips - message, share photos, coordinate rides',
    ],
  },
  {
    tag: 'Trust',
    icon: 'fa-solid fa-shield-halved',
    title: 'Safety &',
    highlight: 'Verification',
    body: [
      'Every member uploads Aadhaar (front & back) and a live selfie before their profile is complete - vehicle owners additionally upload a Driving Licence and RC. An admin reviews these before a member reaches full "Verified" status; vehicle owners who clear RC review separately earn a "Verified Vehicle Owner" badge.',
      "If a conversation ever goes wrong, any member can block another (instantly cuts off messaging and connection requests both ways) or report a profile for admin review - reports and verification decisions are handled from a dedicated admin panel.",
    ],
    bullets: [],
  },
  {
    tag: 'Community',
    icon: 'fa-solid fa-comments',
    title: 'Chat &',
    highlight: 'Connections',
    body: [
      "Beyond trip and club chats, you can send connection requests to other members from their profile or the members directory, and message anyone you're connected with directly. You can also spin up a custom group yourself and add whoever you want by their User ID, username, mobile number, or email - no trip or club required.",
      'The members directory is searchable by name, city, mobile number, username, or User ID, with filters for bike owners, car owners, gender, and verification status - so finding the right co-travelers never means scrolling forever.',
      "Invite friends through your referral link and earn rewards as they join - growing the community pays you back too.",
    ],
    bullets: [],
  },
];

export default function HowItWorks() {
  return (
    <>
      <Seo
        title="How SastiTripsWale Works - Full Guide"
        description="A complete walkthrough of SastiTripsWale - signing up, membership pricing, hosting or joining trips, splitting expenses, Couples/girls-only/boys-only modes, travel clubs, verification and safety, and chat."
        path="/how-it-works"
      />
      <PageHero
        tag="The Full Picture"
        tagIcon="fa-solid fa-book-open"
        title="How We"
        highlight="Work"
        sub="Everything that happens between signing up and setting off - membership, trips, expense splitting, safety, travel clubs, and the community itself."
      />

      {/* Getting Started */}
      <section>
        <div className="container">
          <div className="text-center fade-up" style={{ marginBottom: 44 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-flag-checkered" /> Getting Started</div>
            <h2 className="section-title">From Sign-Up to <span className="highlight">Send-Off</span></h2>
          </div>
          <div className="grid-4">
            {GETTING_STARTED.map((s) => (
              <div className="card fade-up" style={{ padding: 20 }} key={s.n}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
                  STEP {s.n}
                </div>
                <div className="why-icon" style={{ background: 'rgba(255,122,26,0.1)', color: 'var(--fire)', marginTop: 10, marginBottom: 16 }}>
                  <i className={s.icon} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 8 }}>{s.h}</h3>
                <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', lineHeight: 1.75 }}>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: 'var(--bg-2)' }}>
        <div className="container">
          <div className="text-center fade-up" style={{ marginBottom: 44 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-tag" /> Membership</div>
            <h2 className="section-title">Simple, <span className="highlight">Upfront Pricing</span></h2>
            <p className="section-sub">Have a coupon? Apply it at checkout to bring the price down.</p>
          </div>
          <div className="grid-2">
            {PRICING.map((p) => (
              <div className="card fade-up" style={{ padding: 28 }} key={p.key}>
                <div className="why-icon" style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)' }}>
                  <i className={p.icon} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginTop: 14, marginBottom: 4 }}>{p.label}</h3>
                <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: 20 }}>{p.sub}</p>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>₹{PLAN_PRICES[p.key]['6m']}</div>
                    <div style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>6 months</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>₹{PLAN_PRICES[p.key]['1y']}</div>
                    <div style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>1 year</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-muted" style={{ marginTop: 28, fontSize: '0.88rem' }}>
            Just want to try a few trips instead? The <Link to="/pricing">Trip Pass</Link> starts at ₹29 for a
            single host + join credit - no coupon needed, no commitment.
          </p>
        </div>
      </section>

      {/* Detailed sections */}
      {SECTIONS.map((s, i) => (
        <section key={s.title} style={{ background: i % 2 === 1 ? 'var(--bg-2)' : undefined }}>
          <div className="container">
            <div className="grid-2" style={{ alignItems: 'start', gap: 48 }}>
              <div>
                <div className="section-tag"><i className={s.icon} /> {s.tag}</div>
                <h2 className="section-title" style={{ fontSize: '1.8rem' }}>
                  {s.title} <span className="highlight">{s.highlight}</span>
                </h2>
              </div>
              <div>
                {s.body.map((para, j) => (
                  <p key={j} style={{ color: 'var(--text-2)', lineHeight: 1.9, marginBottom: j === s.body.length - 1 && !s.bullets.length ? 0 : 16 }}>
                    {para}
                  </p>
                ))}
                {s.bullets.length > 0 && (
                  <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: 'none' }}>
                    {s.bullets.map((b) => (
                      <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-2)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 10 }}>
                        <i className="fa-solid fa-circle-check" style={{ color: 'var(--fire)', marginTop: 4, flexShrink: 0 }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card fade-up">
            <div className="cta-orb-1" />
            <div className="cta-orb-2" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="section-tag" style={{ margin: '0 auto 16px' }}><i className="fa-solid fa-rocket" /> Ready When You Are</div>
              <h2 className="section-title">Now You Know <span className="highlight">How It Works</span></h2>
              <p style={{ color: 'var(--text-2)', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.75 }}>
                Join the community, host or join a trip, or start your own travel club.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/join" className="btn btn-primary btn-lg"><i className="fa-solid fa-users" /> Join Community</Link>
                <Link to="/trips" className="btn btn-outline btn-lg"><i className="fa-solid fa-compass" /> Browse Trips</Link>
                <Link to="/clubs" className="btn btn-outline btn-lg"><i className="fa-solid fa-people-group" /> Explore Clubs</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
