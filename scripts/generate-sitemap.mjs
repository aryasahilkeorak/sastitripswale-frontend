// Runs as the `prebuild` npm lifecycle hook (see package.json), before every
// `vite build`. Writes public/sitemap.xml so Vite copies a fresh copy into
// dist/ on every deploy. Static marketing routes are always included; trip
// detail pages are appended by querying the live API - if that fails for any
// reason (env not set, backend cold-starting, network hiccup) we fall back to
// the static-only sitemap rather than failing the build.
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { SITE_URL } from '../seo.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '..', 'public', 'sitemap.xml');
const FETCH_TIMEOUT_MS = 15000;
const MAX_PAGES_PER_STATUS = 5; // 5 * 60/page = up to 300 trips per status, well past what a launch needs

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/trips', changefreq: 'hourly', priority: 0.9 },
  { path: '/clubs', changefreq: 'hourly', priority: 0.8 },
  { path: '/members', changefreq: 'daily', priority: 0.7 },
  { path: '/gallery', changefreq: 'weekly', priority: 0.6 },
  { path: '/completed-trips', changefreq: 'daily', priority: 0.7 },
  { path: '/testimonials', changefreq: 'weekly', priority: 0.6 },
  { path: '/about', changefreq: 'monthly', priority: 0.5 },
  { path: '/how-it-works', changefreq: 'monthly', priority: 0.6 },
  { path: '/contact', changefreq: 'monthly', priority: 0.4 },
  { path: '/join', changefreq: 'monthly', priority: 0.8 },
];

async function resolveApiUrl() {
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
  try {
    const envFile = await readFile(path.join(__dirname, '..', '.env.production'), 'utf8');
    const match = envFile.match(/^VITE_API_URL=(.+)$/m);
    if (match) return match[1].trim();
  } catch {
    // no .env.production - fine, caller handles the empty return
  }
  return '';
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTripUrls(apiUrl) {
  const urls = [];
  for (const status of ['upcoming', 'completed']) {
    for (let page = 1; page <= MAX_PAGES_PER_STATUS; page++) {
      let data;
      try {
        data = await fetchJson(`${apiUrl}/trips?status=${status}&limit=60&page=${page}`);
      } catch (err) {
        console.warn(`[sitemap] failed to fetch ${status} trips page ${page}: ${err.message}`);
        break;
      }
      const trips = data?.trips || [];
      for (const t of trips) {
        urls.push({
          path: `/trips/${t._id}`,
          changefreq: status === 'upcoming' ? 'daily' : 'monthly',
          priority: 0.6,
          lastmod: t.updatedAt,
        });
      }
      if (trips.length < 60) break; // last page
    }
  }
  return urls;
}

function toXml(urls) {
  const items = urls
    .map((u) => {
      const loc = `${SITE_URL}${u.path}`;
      const lastmod = u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : '';
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

async function main() {
  let tripUrls = [];
  const apiUrl = await resolveApiUrl();
  if (apiUrl) {
    try {
      tripUrls = await fetchTripUrls(apiUrl);
    } catch (err) {
      console.warn(`[sitemap] skipping trip URLs, falling back to static routes only: ${err.message}`);
    }
  } else {
    console.warn('[sitemap] VITE_API_URL not set - writing static routes only');
  }

  const xml = toXml([...STATIC_ROUTES, ...tripUrls]);
  await writeFile(OUT_FILE, xml, 'utf8');
  console.log(`[sitemap] wrote ${STATIC_ROUTES.length + tripUrls.length} URLs to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(`[sitemap] unexpected failure, writing static-only sitemap: ${err.message}`);
  writeFile(OUT_FILE, toXml(STATIC_ROUTES), 'utf8').finally(() => process.exit(0));
});
