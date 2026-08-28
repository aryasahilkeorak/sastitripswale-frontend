// Single source of truth for site-wide SEO constants. Plain ESM (no JSX) so
// it can be imported both by the Vite app (via src/lib/seo.js) and by the
// Node build script (scripts/generate-sitemap.mjs).
export const SITE_URL = 'https://sastitripswale.com';
export const SITE_NAME = 'SastiTripsWale';
export const DEFAULT_TITLE = 'SastiTripsWale - Travel Community | Discover, Host & Join Trips';
export const DEFAULT_DESCRIPTION =
  'SastiTripsWale is a verified travel community. Discover, host or join bike, car & backpacking trips, split expenses fairly, and connect with fellow travelers safely with Couples, girls-only or boys-only modes. Free sign-up.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/pwa/icon-512.png`;

// Single source of truth for the brand's official social profiles - used in
// the footer links and in the Organization JSON-LD's `sameAs` (helps Google
// tie sastitripswale.com to these profiles in the Knowledge Graph).
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/sastitripswale',
  facebook: 'https://www.facebook.com/sastitripswale',
  youtube: 'https://www.youtube.com/sastitripswale',
};
