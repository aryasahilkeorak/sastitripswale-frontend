import { Children, useEffect, useRef, useState } from 'react';

// Horizontally-scrolling row with prev/next arrow buttons. The arrows only
// render for fine-pointer devices (mouse/trackpad) via CSS - touch screens
// already scroll the row directly with a swipe, so the buttons would just
// be redundant chrome sitting on top of the content there. Each arrow also
// hides itself once there's nothing left to scroll in that direction.
export default function ScrollRow({ children, className = '' }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const childCount = Children.count(children);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const update = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      setCanPrev(track.scrollLeft > 4);
      setCanNext(track.scrollLeft < maxScroll - 4);
    };

    update();
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      track.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [childCount]);

  const scroll = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 16 : 280;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <div className="scroll-row-wrap">
      {canPrev && (
        <button type="button" className="scroll-row-arrow prev" onClick={() => scroll(-1)} aria-label="Scroll left">
          <i className="fa-solid fa-angle-left" />
        </button>
      )}
      <div className={`app-scroll-row ${className}`} ref={trackRef}>
        {children}
      </div>
      {canNext && (
        <button type="button" className="scroll-row-arrow next" onClick={() => scroll(1)} aria-label="Scroll right">
          <i className="fa-solid fa-angle-right" />
        </button>
      )}
    </div>
  );
}
