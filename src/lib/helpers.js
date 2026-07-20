// Shared UI helpers.
const API = import.meta.env.VITE_API_URL || '/api';
// Strip a trailing "/api" so we can resolve "/uploads/..." image paths.
const ORIGIN = API.replace(/\/api\/?$/, '');

// Resolve an image path from the backend (or pass through absolute URLs).
export function imageUrl(path, fallback = '') {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function rupee(n) {
  const num = Number(n) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

export function paiseToRupee(p) {
  return rupee((Number(p) || 0) / 100);
}

export function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dateRange(a, b) {
  const s = formatDate(a);
  const e = formatDate(b);
  return e ? `${s} → ${e}` : s;
}

export function routeLabel(trip) {
  return [trip?.origin, ...(trip?.viaStops || []), trip?.destination].filter(Boolean).join(' → ');
}

export function tripDays(a, b) {
  if (!a || !b) return null;
  const ms = new Date(b) - new Date(a);
  const days = Math.round(ms / (24 * 60 * 60 * 1000)) + 1;
  return days > 0 ? days : null;
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function timeAgo(d) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(d);
}

// Neutral default user icon (inline SVG, no network needed).
const DEFAULT_AVATAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <path d="M100 0H0V100H100V0Z" fill="#1B2F4D"/>
  <path d="M50.477 62.0746C61.2672 62.0746 70.0143 53.3274 70.0143 42.5373C70.0143 31.7471 61.2672 23 50.477 23C39.6868 23 30.9397 31.7471 30.9397 42.5373C30.9397 53.3274 39.6868 62.0746 50.477 62.0746Z" fill="#5C6A87"/>
  <path d="M16 100C16 80.4627 30.9403 67.8209 50.4776 67.8209C70.0149 67.8209 84.9552 80.4627 84.9552 100H16Z" fill="#5C6A87"/>
</svg>
`;

export const AVATAR_FALLBACK = `data:image/svg+xml,${encodeURIComponent(DEFAULT_AVATAR_SVG)}`;

// Neutral "no photo yet" placeholder for a trip cover image — shown while a
// real destination photo is being resolved (see lib/wikiPhoto.js) or if none
// could be found. Deliberately generic (map pin over hills) so it never reads
// as an unrelated stock photo.
const DESTINATION_PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" fill="none">
  <rect width="600" height="400" fill="#132038"/>
  <path d="M0 300L150 200L260 270L400 150L600 260V400H0V300Z" fill="#1c2f4d"/>
  <path d="M0 340L180 260L320 320L480 230L600 300V400H0V340Z" fill="#24395c"/>
  <path d="M300 60C266 60 238 88 238 122C238 158 300 210 300 210C300 210 362 158 362 122C362 88 334 60 300 60Z" fill="#5C6A87"/>
  <circle cx="300" cy="118" r="16" fill="#132038"/>
</svg>
`;
export const DESTINATION_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(DESTINATION_PLACEHOLDER_SVG)}`;

// Fallback icon for non-image documents (e.g. PDFs) shown as thumbnails.
const DOC_ICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<rect width='100' height='100' fill='#1b2f4d'/>" +
  "<rect x='30' y='22' width='40' height='56' rx='4' fill='#5c6a87'/>" +
  "<rect x='37' y='34' width='26' height='4' rx='2' fill='#0e1a2e'/>" +
  "<rect x='37' y='44' width='26' height='4' rx='2' fill='#0e1a2e'/>" +
  "<rect x='37' y='54' width='18' height='4' rx='2' fill='#0e1a2e'/></svg>";
export const DOC_FALLBACK = `data:image/svg+xml,${encodeURIComponent(DOC_ICON_SVG)}`;

// Plan pricing (kept in sync with backend utils/plans.js) for display.
export const PLAN_PRICES = {
  single: { '6m': 199, '1y': 299 },
  both: { '6m': 299, '1y': 499 },
};
export function planPrice(preference, duration) {
  const tier = preference === 'both' ? 'both' : 'single';
  return PLAN_PRICES[tier][duration === '1y' ? '1y' : '6m'];
}
export const PREF_LABEL = { male: 'Only Male', female: 'Only Female', both: 'Male + Female' };

// Social handles are stored bare (no URL) — the base URL is prefixed here so
// members only ever type their username, never a full link.
export const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: 'fa-brands fa-instagram', base: 'https://instagram.com/' },
  { key: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook', base: 'https://facebook.com/' },
  { key: 'twitter', label: 'X (Twitter)', icon: 'fa-brands fa-x-twitter', base: 'https://x.com/' },
  { key: 'youtube', label: 'YouTube', icon: 'fa-brands fa-youtube', base: 'https://youtube.com/@' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'fa-brands fa-linkedin', base: 'https://linkedin.com/in/' },
];
export function socialUrl(platformKey, handle) {
  if (!handle) return '';
  const platform = SOCIAL_PLATFORMS.find((p) => p.key === platformKey);
  if (!platform) return '';
  return `${platform.base}${String(handle).trim().replace(/^@/, '')}`;
}

// Shared between MemberDetail.jsx (viewing someone else) and Dashboard.jsx
// (viewing yourself) — both render a traveler's interests as icon pills.
export const TRAVEL_INTEREST_ICONS = {
  Mountains: 'fa-solid fa-mountain',
  Beaches: 'fa-solid fa-umbrella-beach',
  Camping: 'fa-solid fa-campground',
  Trekking: 'fa-solid fa-person-hiking',
  'Road Trips': 'fa-solid fa-route',
  Backpacking: 'fa-solid fa-backpack',
  Photography: 'fa-solid fa-camera',
  'Food Travel': 'fa-solid fa-utensils',
  'Night Rides': 'fa-solid fa-moon',
};
