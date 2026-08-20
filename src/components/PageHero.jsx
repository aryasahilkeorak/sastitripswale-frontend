import { useNavigate } from 'react-router-dom';

export default function PageHero({ tag, tagIcon = 'fa-solid fa-wand-magic-sparkles', title, highlight, sub, showBack = false }) {
  const navigate = useNavigate();

  return (
    <section className={`page-hero${showBack ? ' has-back' : ''}`}>
      <div className="page-hero-bg" />
      <div className="container page-hero-content">
        {(showBack || tag) && (
          <div className="page-hero-top-row">
            {showBack && (
              <button type="button" className="ig-id-btn page-hero-back" onClick={() => navigate(-1)} aria-label="Back">
                <i className="fa-solid fa-arrow-left" />
              </button>
            )}
            {tag && (
              <div className="section-tag" style={{ marginBottom: 0 }}>
                <i className={tagIcon} /> {tag}
              </div>
            )}
          </div>
        )}
        <h1 className="page-hero-title">
          {title} {highlight && <span className="highlight">{highlight}</span>}
        </h1>
        {sub && (
          <p className="section-sub" style={{ marginTop: 14, marginBottom: 0 }}>
            {sub}
          </p>
        )}
      </div>
    </section>
  );
}
