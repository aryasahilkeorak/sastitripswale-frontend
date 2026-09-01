import { imageUrl } from './helpers.js';

// Shape every in-scope caller (Gallery feed, a profile's Photos tab, a
// trip's photo grid) maps a raw Gallery API doc into, so Lightbox's rich
// "post" mode always gets the same contract regardless of which page it
// came from.
//
// `fallbackUser` covers MemberDetail's recentPhotos, which don't populate
// `user` per-photo (the backend already knows whose profile this is) - pass
// the profile's own `member` object there.
export function toPostShape(photo, fallbackUser) {
  const user = photo.user || fallbackUser || {};
  return {
    id: photo._id,
    imageUrl: imageUrl(photo.photoUrl),
    caption: photo.caption || '',
    location: photo.location || '',
    createdAt: photo.createdAt,
    user: {
      id: user._id || user.id,
      fullName: user.fullName || '',
      username: user.username || '',
      avatarUrl: user.avatarUrl || '',
      isVerified: Boolean(user.isVerified),
    },
    likesCount: photo.likesCount || 0,
    commentsCount: photo.commentsCount || 0,
    repostsCount: photo.repostsCount || 0,
    likedByMe: Boolean(photo.likedByMe),
    repostOf: photo.repostOf
      ? {
          id: photo.repostOf._id,
          caption: photo.repostOf.caption || '',
          user: {
            fullName: photo.repostOf.user?.fullName || '',
            username: photo.repostOf.user?.username || '',
          },
        }
      : null,
  };
}

export default { toPostShape };
