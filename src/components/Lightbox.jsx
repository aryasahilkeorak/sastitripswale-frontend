import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../i18n/index.js';
import { useAuth } from '../store/auth.js';
import { api, apiError } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import PostHeader from './lightbox/PostHeader.jsx';
import PostActions from './lightbox/PostActions.jsx';
import CommentsPanel from './lightbox/CommentsPanel.jsx';
import SharePhotoModal from './SharePhotoModal.jsx';

// Controlled lightbox with two modes:
//  - plain: `images` = [url...] - a bare full-screen viewer (avatar zoom,
//    hero-image zoom, club cover/avatar zoom - anything that isn't a real
//    Gallery post).
//  - rich: `posts` = [postShape...] (see lib/galleryPost.js) - a full
//    Instagram-style post: header (who/where/when), like/comment/repost/
//    share. `onLike`/`onRepost` are the caller's own list-state updaters;
//    comments are fetched/posted directly against the API here since no
//    caller currently holds a photo's comment list.
export default function Lightbox({ images, posts, index, onClose, onIndex, onLike, onRepost }) {
  const t = useT();
  const currentUserId = useAuth((s) => s.user?.id);
  const isRich = Array.isArray(posts);
  const items = isRich ? posts : images;
  const show = index !== null && index !== undefined && Boolean(items?.length);
  const hasMultiple = (items?.length || 0) > 1;
  const post = isRich && show ? items[index] : null;

  const [commentsOpenFor, setCommentsOpenFor] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const commentsCache = useRef(new Map());
  const [, bump] = useReducer((n) => n + 1, 0);
  const touchStart = useRef(null);

  const go = useCallback(
    (dir) => {
      if (!items?.length) return;
      setCommentsOpenFor(null);
      onIndex((index + dir + items.length) % items.length);
    },
    [items, index, onIndex]
  );

  // Swipe left/right to navigate instead of visible arrow buttons - a
  // vertical drag (scrolling the comments panel, or a rich post's card
  // overflow) is left alone by requiring the horizontal move to dominate.
  const SWIPE_THRESHOLD = 50;
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touchStart.current || !hasMultiple) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [show, go, onClose]);

  // Fresh comments each time the lightbox is (re)opened, rather than a
  // cache that outlives the whole page session.
  useEffect(() => {
    if (!show) {
      commentsCache.current = new Map();
      setCommentsOpenFor(null);
    }
  }, [show]);

  const loadComments = (photoId) => {
    const entry = commentsCache.current.get(photoId);
    if (entry && (entry.comments.length || entry.loading)) return;
    commentsCache.current.set(photoId, { comments: entry?.comments || [], loading: true });
    bump();
    api
      .get(`/gallery/${photoId}/comments`, { params: { limit: 50 } })
      .then((r) => commentsCache.current.set(photoId, { comments: r.data.comments, loading: false }))
      .catch(() => commentsCache.current.set(photoId, { comments: [], loading: false }))
      .finally(bump);
  };

  const toggleComments = (photoId) => {
    setCommentsOpenFor((cur) => {
      if (cur === photoId) return null;
      loadComments(photoId);
      return photoId;
    });
  };

  const submitComment = async (photoId, text) => {
    const { data } = await api.post(`/gallery/${photoId}/comments`, { text });
    const entry = commentsCache.current.get(photoId) || { comments: [], loading: false };
    commentsCache.current.set(photoId, { comments: [...entry.comments, data.comment], loading: false });
    bump();
  };

  const deleteComment = async (photoId, commentId) => {
    try {
      await api.delete(`/gallery/${photoId}/comments/${commentId}`);
      const entry = commentsCache.current.get(photoId);
      if (entry) {
        commentsCache.current.set(photoId, { ...entry, comments: entry.comments.filter((c) => c._id !== commentId) });
        bump();
      }
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  if (!show) return null;

  // Rendered into document.body directly - if left in the normal tree, an
  // ancestor with a CSS transform (e.g. the scroll-reveal "fade-up" class)
  // would trap this `position: fixed` overlay inside itself instead of the
  // real viewport, letting page content (like a sticky sidebar card) paint
  // on top of it instead of being covered.
  return createPortal(
    <>
      <div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={isRich ? 'lb-overlay lb-overlay-rich' : 'lb-overlay'}
      >
        <div className={isRich ? 'lb-stage lb-stage-rich' : 'lb-stage'}>
          {isRich && <PostHeader post={post} />}

          <div className="lb-image-wrap">
            <img src={isRich ? post.imageUrl : images[index]} alt="" className="lb-image" />
          </div>

          {isRich && (
            <>
              <PostActions
                post={post}
                currentUserId={currentUserId}
                commentsOpen={commentsOpenFor === post.id}
                onLike={onLike}
                onRepost={onRepost}
                onShare={setSharePost}
                onToggleComments={toggleComments}
              />
              {commentsOpenFor === post.id && (
                <CommentsPanel
                  photoOwnerId={post.user.id}
                  comments={commentsCache.current.get(post.id)?.comments || []}
                  loading={Boolean(commentsCache.current.get(post.id)?.loading)}
                  onSubmit={(text) => submitComment(post.id, text)}
                  onDelete={(commentId) => deleteComment(post.id, commentId)}
                />
              )}
            </>
          )}
        </div>

        <button className="lb-btn" style={lbBtn()} onClick={onClose} aria-label={t('lightbox.close')}>
          <i className="fa-solid fa-xmark" />
        </button>
        {hasMultiple && (
          <div className="lb-dots">
            {items.map((_, i) => (
              <span key={i} className={`lb-dot${i === index ? ' active' : ''}`} />
            ))}
          </div>
        )}
      </div>
      {isRich && <SharePhotoModal open={Boolean(sharePost)} photo={sharePost} onClose={() => setSharePost(null)} />}
    </>,
    document.body
  );
}

function lbBtn() {
  return {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    fontSize: '1.3rem',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  };
}
