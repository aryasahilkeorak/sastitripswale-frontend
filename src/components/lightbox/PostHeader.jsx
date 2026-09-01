import { Link } from 'react-router-dom';
import { imageUrl, timeAgo, AVATAR_FALLBACK } from '../../lib/helpers.js';

function handleOf(user) {
  return user?.username ? `@${user.username}` : user?.fullName || 'a member';
}

export default function PostHeader({ post }) {
  const profilePath = `/members/${post.user.username || post.user.id}`;

  return (
    <div className="ig-post-header">
      {post.repostOf && (
        <div className="ig-repost-credit">
          <i className="fa-solid fa-retweet" /> Reposted from{' '}
          {post.repostOf.user?.username ? (
            <Link to={`/members/${post.repostOf.user.username}`}>{handleOf(post.repostOf.user)}</Link>
          ) : (
            handleOf(post.repostOf.user)
          )}
        </div>
      )}
      <div className="ig-post-header-row">
        <Link to={profilePath} className="ig-post-avatar">
          <img
            src={imageUrl(post.user.avatarUrl, AVATAR_FALLBACK)}
            alt=""
            onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
          />
        </Link>
        <div className="ig-post-header-info">
          <Link to={profilePath} className="ig-post-username">
            {post.user.fullName}
            {post.user.isVerified && <i className="fa-solid fa-circle-check ig-verified" />}
          </Link>
          <div className="ig-post-meta">
            {post.location && <span>{post.location}</span>}
            {post.location && <span className="ig-dot">·</span>}
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>
      {post.caption && <div className="ig-post-caption">{post.caption}</div>}
    </div>
  );
}
