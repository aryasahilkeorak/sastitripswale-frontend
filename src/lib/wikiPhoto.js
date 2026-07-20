// Best-effort real photo lookup for a trip destination, using Wikipedia's
// free, keyless REST summary API — no backend route or API key needed.
// Organizers rarely upload a cover photo, so without this the app fell back
// to a random unrelated stock photo per trip id; this resolves an actual
// photo of the place instead. Never throws — callers get null on any
// failure and keep showing their existing placeholder.
const cache = new Map();

async function fetchSummaryImage(title) {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

// `destination` is freeform text like "Gokarna, Karnataka" — try it as-is
// first, then just the leading place name before the first comma, since
// Wikipedia article titles rarely include the state/region suffix.
export async function destinationPhoto(destination) {
  const key = (destination || '').trim();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key);

  const shortName = key.split(',')[0].trim();
  const candidates = shortName && shortName !== key ? [key, shortName] : [key];

  let photo = null;
  for (const candidate of candidates) {
    photo = await fetchSummaryImage(candidate);
    if (photo) break;
  }
  cache.set(key, photo);
  return photo;
}
