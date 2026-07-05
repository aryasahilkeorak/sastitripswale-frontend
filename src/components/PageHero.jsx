export default function PageHero({ tag, tagIcon = 'ri-sparkling-fill', title, highlight, sub }) {
  return (
    <section className="page-hero">
      <div className="page-hero-bg" />
      <div className="container page-hero-content">
        {tag && (
          <div className="section-tag">
            <i className={tagIcon} /> {tag}
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
