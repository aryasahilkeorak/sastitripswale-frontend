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
const DEFAULT_AVATAR_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<rect width='100' height='100' fill='#1a1f35'/>" +
  "<circle cx='50' cy='40' r='17' fill='#5a6380'/>" +
  "<path d='M20 90c0-17 13-28 30-28s30 11 30 28z' fill='#5a6380'/></svg>";
export const AVATAR_FALLBACK = `data:image/svg+xml,${encodeURIComponent(DEFAULT_AVATAR_SVG)}`;

// Fallback icon for non-image documents (e.g. PDFs) shown as thumbnails.
const DOC_ICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<rect width='100' height='100' fill='#1a1f35'/>" +
  "<rect x='30' y='22' width='40' height='56' rx='4' fill='#5a6380'/>" +
  "<rect x='37' y='34' width='26' height='4' rx='2' fill='#0f1220'/>" +
  "<rect x='37' y='44' width='26' height='4' rx='2' fill='#0f1220'/>" +
  "<rect x='37' y='54' width='18' height='4' rx='2' fill='#0f1220'/></svg>";
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
