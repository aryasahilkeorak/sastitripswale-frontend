import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SOCIAL_LINKS } from '../../seo.config.mjs';

export { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SOCIAL_LINKS };

export function absUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildOrganizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    sameAs: Object.values(SOCIAL_LINKS),
  };
}

export function buildWebSiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/trips?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// `faqs` is the same [{ q, a }] shape already used by the FAQ accordion on
// Home.jsx - keep this in sync with what's visibly rendered, since Google
// requires FAQPage structured data to match on-page content.
export function buildFaqLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

// `items` is [{ name, path }] in breadcrumb order, e.g.
// [{ name: 'Home', path: '/' }, { name: 'Trips', path: '/trips' }, { name: destination }]
// (the last item has no `path` - it's the current page).
export function buildBreadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: absUrl(item.path) } : {}),
    })),
  };
}
