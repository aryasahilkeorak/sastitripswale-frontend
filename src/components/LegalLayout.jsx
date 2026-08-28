import PageHero from './PageHero.jsx';
import Seo from './Seo.jsx';

// Shared shell for the policy pages (Terms, Privacy, Refund & Cancellation,
// Shipping/Delivery) - same hero + card treatment as the rest of the site,
// with a `.legal-content` prose block (see app.scss) instead of hand-styling
// every paragraph in each page.
export default function LegalLayout({ tag = 'Legal', tagIcon = 'fa-solid fa-scale-balanced', title, highlight, sub, seoTitle, seoDescription, path, updated, children }) {
  return (
    <>
      <Seo title={seoTitle} description={seoDescription} path={path} />
      <PageHero tag={tag} tagIcon={tagIcon} title={title} highlight={highlight} sub={sub} />
      <section>
        <div className="container">
          <div className="card" style={{ padding: 'clamp(22px, 4vw, 44px)' }}>
            {updated && (
              <p className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 28 }}>
                Last updated: {updated}
              </p>
            )}
            <div className="legal-content">{children}</div>
          </div>
        </div>
      </section>
    </>
  );
}
