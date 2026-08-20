import { Helmet } from 'react-helmet-async';
import { SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, absUrl } from '../lib/seo.js';

// Per-route <head> tags: title, description, canonical, Open Graph, Twitter
// card, robots directive, and any number of JSON-LD structured-data blocks.
// Renders on top of the static defaults in index.html (which only matter
// pre-hydration / for crawlers that don't run JS).
export default function Seo({ title, description, path = '/', image, noindex = false, jsonLd = [] }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = absUrl(path);
  const ogImage = image || DEFAULT_OG_IMAGE;
  const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {schemas.filter(Boolean).map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
