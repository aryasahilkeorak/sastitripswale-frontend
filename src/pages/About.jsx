import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { imageUrl } from '../lib/helpers.js';
import PageHero from '../components/PageHero.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import IndiaMapDots from '../components/IndiaMapDots.jsx';
import Seo from '../components/Seo.jsx';
import { useT } from '../i18n/index.js';

const STAT_META = [
  { icon: 'fa-solid fa-users', labelKey: 'about.statMembers', key: 'members' },
  { icon: 'fa-solid fa-route', labelKey: 'about.statTrips', key: 'completedTrips' },
  { icon: 'fa-solid fa-location-dot', labelKey: 'about.statCities', key: 'cities' },
  { icon: 'fa-solid fa-handshake', labelKey: 'about.statConnections', key: 'connections' },
];

const STEPS = [
  { n: '01', icon: 'fa-solid fa-user-plus', hKey: 'about.step1Title', pKey: 'about.step1Desc' },
  { n: '02', icon: 'fa-solid fa-id-card', hKey: 'about.step2Title', pKey: 'about.step2Desc' },
  { n: '03', icon: 'fa-solid fa-map-location-dot', hKey: 'about.step3Title', pKey: 'about.step3Desc' },
  { n: '04', icon: 'fa-solid fa-people-carry-box', hKey: 'about.step4Title', pKey: 'about.step4Desc' },
];

const VALUES = [
  { icon: 'fa-solid fa-shield-halved', hKey: 'about.value1Title', pKey: 'about.value1Desc', c: 'fire' },
  { icon: 'fa-solid fa-wallet', hKey: 'about.value2Title', pKey: 'about.value2Desc', c: 'blue' },
  { icon: 'fa-solid fa-handshake', hKey: 'about.value3Title', pKey: 'about.value3Desc', c: 'gold' },
  { icon: 'fa-solid fa-map-location-dot', hKey: 'about.value4Title', pKey: 'about.value4Desc', c: 'fire' },
  { icon: 'fa-solid fa-bolt', hKey: 'about.value5Title', pKey: 'about.value5Desc', c: 'blue' },
  { icon: 'fa-solid fa-venus', hKey: 'about.value6Title', pKey: 'about.value6Desc', c: 'gold' },
];

const VALUE_STYLE = {
  fire: { background: 'rgba(255,122,26,0.12)', color: 'var(--fire)' },
  blue: { background: 'rgba(62,142,247,0.12)', color: 'var(--cyan)' },
  gold: { background: 'rgba(255,201,77,0.14)', color: 'var(--gold)' },
};

// Small decorative "journey" divider used to separate major sections -
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
// `photo` is the founder's actual uploaded avatar (not a stock placeholder)
// so there's no flash of a wrong photo before the /members fetch below
// resolves - that fetch just keeps it in sync if the photo is ever updated.
const TEAM = [
  {
    name: 'Arya Sahil Keorak',
    titleKey: 'about.founderTitle',
    photo: imageUrl('/api/files/6a86dee7883baffc2b4c6893'),
    quoteKey: 'about.founderQuote',
    socials: [
      { icon: 'fa-brands fa-instagram', url: 'https://instagram.com/aryasahilkeorak' },
      { icon: 'fa-brands fa-linkedin', url: 'https://linkedin.com/aryasahilkeorak' },
      { icon: 'fa-brands fa-x-twitter', url: 'https://x.com/aryasahilkeorak' }
    ],
  },
];

export default function About() {
  const t = useT();
  const [stats, setStats] = useState(null);
  const [founderPhoto, setFounderPhoto] = useState('');

  useEffect(() => {
    api.get('/stats').then((r) => setStats(r.data.stats)).catch(() => {});
    // Use the real founder's dedicated admin/founder photo (adminAvatarUrl -
    // set separately from their personal member avatar in Admin Profile),
    // falling back to their member avatar if they haven't set one yet.
    api
      .get('/members', { params: { limit: 60 } })
      .then((r) => {
        const founder = r.data.members?.find((m) => m.role === 'superadmin');
        const photo = founder?.adminAvatarUrl || founder?.avatarUrl;
        if (photo) setFounderPhoto(imageUrl(photo));
      })
      .catch(() => {});
  }, []);

  const team = founderPhoto ? [{ ...TEAM[0], photo: founderPhoto }, ...TEAM.slice(1)] : TEAM;

  return (
    <>
      <Seo
        title="About Us - A Verified Travel Community"
        description="SastiTripsWale is a community-driven budget travel platform - host or join trips with bikers, car owners and backpackers, split expenses fairly, and travel safely in verified groups across India."
        path="/about"
      />
      <PageHero tag={t('about.tagOurStory')} tagIcon="fa-solid fa-circle-info" title={t('about.heroTitle')} highlight="SastiTripsWale" sub={t('about.heroSub')} />

      {/* Story */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="orb orb-fire" style={{ width: 320, height: 320, top: -140, right: -80 }} />
        <div className="orb orb-cyan" style={{ width: 260, height: 260, bottom: -120, left: -100 }} />
        <div className="container">
          <div className="row-between" style={{ alignItems: 'center', gap: 48, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 380px' }}>
              <div className="section-tag"><i className="fa-solid fa-book-open" /> {t('about.tagWhyStarted')}</div>
              <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: 18 }}>
                {t('about.storyTitle')} <span className="highlight">{t('about.storyTitleHighlight')}</span>
              </h2>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.9, marginBottom: 16 }}>
                {t('about.storyPara1')}
              </p>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.9 }}>
                <strong style={{ color: 'var(--text)' }}>SastiTripsWale</strong> {t('about.storyPara2')}
              </p>
            </div>
            <div style={{ flex: '1 1 320px' }}>
              <div className="card" style={{ padding: 24 }}>
                <i className="fa-solid fa-quote-left" style={{ fontSize: '1.8rem', color: 'var(--fire)' }} />
                <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--text)', margin: '16px 0 20px', lineHeight: 1.8 }}>
                  &ldquo;{t(team[0].quoteKey)}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={team[0].photo} alt={team[0].name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>{team[0].name}</strong>
                    <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{t(team[0].titleKey)}</span>
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
                <div className="stat-card fade-up" key={s.labelKey}>
                  <div className="stat-icon"><i className={s.icon} /></div>
                  <AnimatedCounter key={value} target={value} suffix="" />
                  <div className="stat-label">{t(s.labelKey)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <RouteDivider />

      {/* Cities we cover */}
      <section>
        <div className="container">
          <div className="text-center fade-up" style={{ marginBottom: 34 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-map-location-dot" /> {t('about.tagWhereWeTravel')}</div>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>{t('about.citiesTitle')} <span className="highlight">{t('about.citiesTitleHighlight')}</span></h2>
            <p style={{ color: 'var(--text-2)', maxWidth: 520, margin: '12px auto 0' }}>
              {t('about.citiesDesc')}
            </p>
          </div>
          <IndiaMapDots />
        </div>
      </section>

      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="orb orb-cyan" style={{ width: 280, height: 280, top: 240, right: -120 }} />
        <div className="container">
          {/* Mission / Vision */}
          <div className="grid-2" style={{ marginBottom: 70 }}>
            <div className="card fade-up" style={{ padding: 22 }}>
              <div className="why-icon" style={{ background: 'rgba(255,122,26,0.12)', color: 'var(--fire)' }}><i className="fa-solid fa-bullseye" /></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 10 }}>{t('about.missionTitle')}</h3>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.85 }}>
                {t('about.missionDesc')}
              </p>
            </div>
            <div className="card fade-up" style={{ padding: 22 }}>
              <div className="why-icon" style={{ background: 'rgba(62,142,247,0.12)', color: 'var(--cyan)' }}><i className="fa-solid fa-binoculars" /></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 10 }}>{t('about.visionTitle')}</h3>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.85 }}>
                {t('about.visionDesc')}
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="text-center fade-up" style={{ marginBottom: 44 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-diagram-project" /> {t('about.tagHowItWorks')}</div>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>{t('about.howTitle')} <span className="highlight">{t('about.howTitleHighlight')}</span></h2>
          </div>
          <div className="grid-4" style={{ marginBottom: 70 }}>
            {STEPS.map((s) => (
              <div className="card fade-up" style={{ padding: 18 }} key={s.n}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
                  {t('about.stepLabel')} {s.n}
                </div>
                <div className="why-icon" style={{ background: 'rgba(255,122,26,0.1)', color: 'var(--fire)', marginTop: 10, marginBottom: 16 }}>
                  <i className={s.icon} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 6 }}>{t(s.hKey)}</h3>
                <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', lineHeight: 1.7 }}>{t(s.pKey)}</p>
              </div>
            ))}
          </div>

          <RouteDivider />

          {/* Team - Founder */}
          <div className="text-center fade-up" style={{ marginBottom: 44 }}>
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-people-group" /> {t('about.tagLeadership')}</div>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>{t('about.teamTitle')} <span className="highlight">{t('about.teamTitleHighlight')}</span></h2>
          </div>
          <div style={{ marginBottom: 70 }}>
            {team.map((m) => (
              <div className="founder-showcase fade-up" key={m.name}>
                <div className="founder-orb" aria-hidden="true" />
                <div className="founder-photo-wrap">
                  <img src={m.photo} alt={m.name} />
                  <span className="founder-ribbon"><i className="fa-solid fa-star" /> {t('about.founderBadge')}</span>
                </div>
                <div className="founder-info">
                  <h3>{m.name}</h3>
                  <div className="section-tag" style={{ margin: '10px 0 20px' }}>{t(m.titleKey)}</div>
                  <div className="founder-quote">
                    <i className="fa-solid fa-quote-left" aria-hidden="true" />
                    <p>{t(m.quoteKey)}</p>
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
            <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-star" /> {t('about.tagValues')}</div>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>{t('about.valuesTitle')} <span className="highlight">{t('about.valuesTitleHighlight')}</span></h2>
          </div>
          <div className="grid-3" style={{ marginBottom: 30 }}>
            {VALUES.map((v) => (
              <div className="why-card fade-up" key={v.hKey}>
                <div className="why-icon" style={VALUE_STYLE[v.c]}><i className={v.icon} /></div>
                <h3>{t(v.hKey)}</h3>
                <p>{t(v.pKey)}</p>
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
              <div className="section-tag" style={{ margin: '0 auto 16px' }}><i className="fa-solid fa-rocket" /> {t('about.tagReady')}</div>
              <h2 className="section-title">{t('about.ctaTitlePre')} <span className="highlight">{t('about.ctaTitleHighlight')}</span> {t('about.ctaTitlePost')}</h2>
              <p style={{ color: 'var(--text-2)', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.75 }}>
                {t('about.ctaDesc')}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/join" className="btn btn-primary btn-lg"><i className="fa-solid fa-users" /> {t('about.joinCommunityBtn')}</Link>
                <Link to="/contact" className="btn btn-outline btn-lg"><i className="fa-solid fa-envelope" /> {t('about.getInTouchBtn')}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
