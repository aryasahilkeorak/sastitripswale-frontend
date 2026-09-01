import { useState } from 'react';

export default function PostActions({ post, currentUserId, commentsOpen, onLike, onRepost, onShare, onToggleComments }) {
  const [busy, setBusy] = useState(false);
  const isOwnPhoto = currentUserId && post.user.id === currentUserId;

  const run = (fn) => async () => {
    setBusy(true);
    try {
      await fn(post.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ig-post-actions">
      <button
        className={`ig-action-btn${post.likedByMe ? ' liked' : ''}`}
        onClick={run(onLike)}
        disabled={busy}
        aria-label={post.likedByMe ? 'Unlike' : 'Like'}
      >
        <i className={post.likedByMe ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
        <span>{post.likesCount}</span>
      </button>
      <button
        className={`ig-action-btn${commentsOpen ? ' active' : ''}`}
        onClick={() => onToggleComments(post.id)}
        aria-label="Comments"
      >
        <i className="fa-regular fa-comment" />
        <span>{post.commentsCount}</span>
      </button>
      <button
        className="ig-action-btn"
        onClick={run(onRepost)}
        disabled={busy || isOwnPhoto}
        aria-label="Repost"
        title={isOwnPhoto ? "You can't repost your own photo" : 'Repost to your profile'}
      >
        <i className="fa-solid fa-retweet" />
        {post.repostsCount > 0 && <span>{post.repostsCount}</span>}
      </button>
      <button className="ig-action-btn" onClick={() => onShare(post)} aria-label="Share">
        <i className="fa-solid fa-paper-plane" />
      </button>
    </div>
  );
}
