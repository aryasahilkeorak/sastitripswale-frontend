// Extracts the video ID from any YouTube URL shape (watch/shorts/youtu.be/embed).
function getYoutubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
    if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
    return u.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

// Turns a plain YouTube/Instagram link into an <iframe>-embeddable URL.
export function toEmbedUrl(url, platform) {
  if (platform === 'youtube') {
    const id = getYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
  }
  if (platform === 'instagram') {
    const clean = url.split('?')[0].replace(/\/$/, '');
    return `${clean}/embed`;
  }
  return url;
}

// Grid-thumbnail image for a video tile. YouTube always has a predictable
// thumbnail URL; Instagram has no key-less equivalent, so tiles fall back to
// a platform-branded placeholder instead (handled by the caller).
export function getThumbnail(url, platform) {
  if (platform === 'youtube') {
    const id = getYoutubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  }
  return '';
}
