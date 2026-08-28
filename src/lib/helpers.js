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

// Same as imageUrl, but for a protected file (ID documents, live selfie,
// withdrawal QR codes - anything NOT in fileController's PUBLIC_KINDS).
// Those routes require the access token, which a plain <img>/<a> tag can't
// send as a header - so it's appended as ?token= instead (the backend's
// attachUserFromQuery middleware accepts either). Never use this for public
// images (avatars, covers, trip/gallery photos) - they don't need it.
export function authedFileUrl(path, token, fallback = '') {
  const url = imageUrl(path, fallback);
  if (!url || !token || url === fallback) return url;
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
}

export function rupee(n) {
  const num = Number(n) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

export function paiseToRupee(p) {
  return rupee((Number(p) || 0) / 100);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

// Catches the common mistake of typing the vehicle's year (e.g. "2023")
// into the model field instead of its name (e.g. "Royal Enfield Classic 350").
export function isVehicleModelYearMistake(value) {
  return /^\d+$/.test(String(value || '').trim());
}
export const VEHICLE_MODEL_YEAR_MISTAKE_MSG = "Enter the vehicle's model name (e.g. Honda Activa), not the model year";

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

// Neutral "no photo yet" placeholder for a trip cover image - shown while a
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

// Single source of truth for every club/group cover photo's crop ratio
// (width / height) - passed to ImageCropModal's `aspect` prop at upload
// time AND used as the CSS `aspect-ratio` (never a fixed pixel height) on
// every place a cover renders, so the same cropped image displays
// identically on the club card, club detail banner and chat group cover
// regardless of container width or screen size.
export const COVER_ASPECT_RATIO = 3;

// Fallback icon for non-image documents (e.g. PDFs) shown as thumbnails.
const DOC_ICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<rect width='100' height='100' fill='#1b2f4d'/>" +
  "<rect x='30' y='22' width='40' height='56' rx='4' fill='#5c6a87'/>" +
  "<rect x='37' y='34' width='26' height='4' rx='2' fill='#0e1a2e'/>" +
  "<rect x='37' y='44' width='26' height='4' rx='2' fill='#0e1a2e'/>" +
  "<rect x='37' y='54' width='18' height='4' rx='2' fill='#0e1a2e'/></svg>";
export const DOC_FALLBACK = `data:image/svg+xml,${encodeURIComponent(DOC_ICON_SVG)}`;

// Shown wherever the real (member-uploaded) gallery has nothing yet - Home's
// gallery preview and the full Gallery page both fall back to this so the
// site never shows an empty grid. North India, since that's where most of
// this community's bike/road-trip groups actually go.
export const NORTH_INDIA_GALLERY = [
  { url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80', place: 'Taj Mahal, Agra', category: 'group' },
  { url: 'https://images.unsplash.com/photo-1623059508779-2542c6e83753?w=800&q=80', place: 'Golden Temple, Amritsar', category: 'group' },
  { url: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800&q=80', place: 'Shimla', category: 'mountain' },
  { url: 'https://images.unsplash.com/photo-1712388430474-ace0c16051e2?w=800&q=80', place: 'Manali', category: 'mountain' },
  { url: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&q=80', place: 'Leh-Ladakh', category: 'bike' },
  { url: 'https://images.unsplash.com/photo-1720819029162-8500607ae232?w=800&q=80', place: 'Rishikesh', category: 'camp' },
  { url: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=800&q=80', place: 'Jaipur', category: 'car' },
  { url: 'https://images.unsplash.com/photo-1564329494258-3f72215ba175?w=800&q=80', place: 'Dal Lake, Srinagar', category: 'mountain' },
  { url: 'https://images.unsplash.com/photo-1667029838861-2fe3a590a1d2?w=800&q=80', place: 'Nainital', category: 'mountain' },
  { url: 'https://images.unsplash.com/photo-1698753935121-153a106616d5?w=800&q=80', place: 'Spiti Valley', category: 'bike' },
];

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

// Trip Pass (pay-per-trip) pricing - kept in sync with backend
// utils/plans.js. Flat price regardless of co-traveler preference. Each
// tier grants that many HOST credits AND that many JOIN credits (two
// separate pools, not a combined total) - buying tops up existing
// credits rather than resetting them.
export const TRIP_PACK_TIERS = [1, 2, 3];
export const TRIP_PACK_PRICES = { 1: 29, 2: 49, 3: 59 };
export function tripPackLabel(tier) {
  return `${tier} host + ${tier} join credit${tier > 1 ? 's' : ''}`;
}

// Travel club categories (bikers/cars/offroading/other) - kept in sync with
// backend clubController's CATEGORY_VEHICLE map, so the create-club form can
// tell a member up front which vehicle type they need on their profile.
export const CLUB_CATEGORIES = [
  { key: 'bikers', label: 'Bikers Club', icon: 'fa-solid fa-motorcycle', needsVehicle: 'Bike', needsLabel: 'a bike' },
  { key: 'cars', label: 'Cars Club', icon: 'fa-solid fa-car', needsVehicle: 'Car', needsLabel: 'a car' },
  { key: 'offroading', label: 'Offroading Club', icon: 'fa-solid fa-mountain', needsVehicle: 'Car', needsLabel: 'a car' },
  { key: 'other', label: 'Other', icon: 'fa-solid fa-people-group', needsVehicle: null, needsLabel: 'a vehicle' },
];
export const CLUB_CATEGORY_LABEL = Object.fromEntries(CLUB_CATEGORIES.map((c) => [c.key, c.label]));
export const CLUB_CATEGORY_ICON = Object.fromEntries(CLUB_CATEGORIES.map((c) => [c.key, c.icon]));

// Social handles are stored bare (no URL) - the base URL is prefixed here so
// members only ever type their username, never a full link.
export const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: 'fa-brands fa-instagram', base: 'https://instagram.com/' },
  { key: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook', base: 'https://facebook.com/' },
  { key: 'twitter', label: 'X (Twitter)', icon: 'fa-brands fa-x-twitter', base: 'https://x.com/' },
  { key: 'youtube', label: 'YouTube', icon: 'fa-brands fa-youtube', base: 'https://youtube.com/' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'fa-brands fa-linkedin', base: 'https://linkedin.com/in/' },
];
export function socialUrl(platformKey, handle) {
  if (!handle) return '';
  const platform = SOCIAL_PLATFORMS.find((p) => p.key === platformKey);
  if (!platform) return '';
  return `${platform.base}${String(handle).trim().replace(/^@/, '')}`;
}

// What the per-head budget actually covers - shown as a select when
// planning/editing a trip, and as a label on the trip detail page so
// joiners know what they're paying for.
export const BUDGET_INCLUDES = [
  { value: 'fuel_toll', label: 'Only fuel & toll' },
  { value: 'fuel_toll_stay', label: 'Fuel + toll + stay' },
  { value: 'fuel_toll_stay_food', label: 'Fuel + toll + stay + food' },
  { value: 'all_inclusive', label: 'All inclusive (fuel, stay, food & activities)' },
];
export const BUDGET_INCLUDES_LABEL = Object.fromEntries(BUDGET_INCLUDES.map((o) => [o.value, o.label]));

// Who a trip is open to - 'Any' (default) or restricted to one gender.
// Enforced server-side too (hidden from listings, blocked from joining).
export const GENDER_PREFERENCE = [
  { value: 'Any', label: 'Anyone' },
  { value: 'Male', label: 'Male only' },
  { value: 'Female', label: 'Female only' },
];

// Shared between MemberDetail.jsx (viewing someone else) and Dashboard.jsx
// (viewing yourself) - both render a traveler's interests as icon pills.
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

// Shared between CompleteProfile.jsx (setting your own habit) and
// ProfileHeader.jsx (showing the badge on a profile, when visible - see
// getMember's smokes/drinks gating in memberController.js).
export const SMOKES_ICON = 'fa-solid fa-smoking';
export const DRINKS_ICON = 'fa-solid fa-wine-bottle';
