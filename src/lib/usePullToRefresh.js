import { useEffect, useRef, useState } from 'react';

const MAX_PULL = 90;

// Pull-to-refresh for a normal whole-page-scrolling section (this app scrolls
// the document/window, not an internal overflow container). Only engages
// when the PAGE is already scrolled to the top, so it doesn't hijack normal
// downward scrolling further down. Attach `containerRef` to the wrapping
// element (used only to scope the touch listeners) and render
// `pullDistance`/`refreshing` as a visual indicator above the content.
export default function usePullToRefresh(onRefresh, { threshold = 70 } = {}) {
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const distanceRef = useRef(0);
  const draggingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const atTop = () => (document.scrollingElement || document.documentElement).scrollTop <= 0;

    const onTouchStart = (e) => {
      if (!atTop() || refreshing) return;
      draggingRef.current = true;
      startYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (!draggingRef.current) return;
      const delta = e.touches[0].clientY - startYRef.current;
      const clamped = delta > 0 ? Math.min(delta * 0.5, MAX_PULL) : 0;
      distanceRef.current = clamped;
      setPullDistance(clamped);
    };

    const onTouchEnd = async () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const shouldRefresh = distanceRef.current >= threshold;
      distanceRef.current = 0;
      setPullDistance(0);
      if (shouldRefresh) {
        setRefreshing(true);
        try {
          await onRefreshRef.current?.();
        } finally {
          setRefreshing(false);
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [threshold, refreshing]);

  return { containerRef, pullDistance, refreshing, pulling: pullDistance > 0 };
}
