import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

// Equirectangular projection bounds, calibrated against india-map.svg's own
// viewBox (2500x2843) and validated against 10 real reference cities.
const LNG_MIN = 68;
const LNG_MAX = 97.5;
const LAT_MIN = 6.5;
const LAT_MAX = 37.5;

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

function toPct(lat, lng) {
  const xPct = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
  const yPct = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100;
  return { xPct, yPct };
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function touchDist(touches) {
  const [a, b] = touches;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

// Renders india-map.svg with a dot for every city members have joined from.
// Dot size scales with member count; new cities appear automatically as
// members sign up from them (backend geocodes + caches on profile save).
// Supports wheel/pinch zoom + drag-to-pan so dense clusters can be inspected.
export default function IndiaMapDots() {
  const [cities, setCities] = useState([]);
  const [tripDestinations, setTripDestinations] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const wrapRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);

  useEffect(() => {
    api
      .get('/stats/cities')
      .then((r) => {
        setCities(r.data.cities || []);
        setTripDestinations(r.data.tripDestinations || []);
      })
      .catch(() => {});
  }, []);

  const clampPan = (next, z) => {
    const el = wrapRef.current;
    if (!el) return next;
    const maxX = (el.clientWidth * (z - 1)) / 2;
    const maxY = (el.clientHeight * (z - 1)) / 2;
    return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  };

  const zoomBy = (delta) => {
    setZoom((z) => {
      const nz = clamp(z + delta, MIN_ZOOM, MAX_ZOOM);
      setPan((p) => (nz === 1 ? { x: 0, y: 0 } : clampPan(p, nz)));
      return nz;
    });
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel + touch need non-passive native listeners so preventDefault()
  // actually stops the page from scrolling/zooming. touchstart in particular
  // must preventDefault as soon as a 2nd finger lands - some mobile browsers
  // (iOS Safari especially) start their own native pinch-zoom gesture right
  // then, and calling preventDefault later in touchmove is too late to stop
  // it, which is what made pinch feel broken (page zoomed AND the map zoomed
  // at once). The legacy WebKit `gesturestart` event is blocked too, as a
  // second line of defense on older iOS Safari versions.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? -0.3 : 0.3);
    };

    const onTouchStart = (e) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        pinchRef.current = { startDist: touchDist(e.touches), startZoom: zoom };
        dragRef.current = null;
      } else if (e.touches.length === 1 && zoom > 1) {
        const t = e.touches[0];
        dragRef.current = { startX: t.clientX, startY: t.clientY, panX: pan.x, panY: pan.y };
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length >= 2 && pinchRef.current) {
        e.preventDefault();
        const dist = touchDist(e.touches);
        const nz = clamp(pinchRef.current.startZoom * (dist / pinchRef.current.startDist), MIN_ZOOM, MAX_ZOOM);
        setZoom(nz);
        setPan((p) => (nz === 1 ? { x: 0, y: 0 } : clampPan(p, nz)));
      } else if (e.touches.length === 1 && dragRef.current) {
        e.preventDefault();
        const t = e.touches[0];
        const d = dragRef.current;
        setPan(clampPan({ x: d.panX + (t.clientX - d.startX), y: d.panY + (t.clientY - d.startY) }, zoom));
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinchRef.current = null;
      if (e.touches.length === 0) dragRef.current = null;
    };

    const onGestureStart = (e) => e.preventDefault();

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('gesturestart', onGestureStart, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('gesturestart', onGestureStart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const onPointerDown = (e) => {
    if (zoom <= 1 || e.pointerType === 'touch') return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current || e.pointerType === 'touch') return;
    const d = dragRef.current;
    setPan(clampPan({ x: d.panX + (e.clientX - d.startX), y: d.panY + (e.clientY - d.startY) }, zoom));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const maxMemberCount = Math.max(1, ...cities.map((c) => c.count));
  const maxTripCount = Math.max(1, ...tripDestinations.map((c) => c.count));

  const renderDots = (list, kind, maxCount, unitLabel) =>
    list.map((c) => {
      const { xPct, yPct } = toPct(c.lat, c.lng);
      const dotScale = 0.55 + (c.count / maxCount) * 0.75;
      // Counter the canvas zoom so dots keep a roughly constant on-screen
      // size instead of ballooning into overlapping blobs when zoomed in.
      const onScreenScale = dotScale / zoom;
      const key = `${kind}:${c.city}`;
      return (
        <div
          key={key}
          className={`india-map-dot india-map-dot-${kind}`}
          style={{ left: `${xPct}%`, top: `${yPct}%`, transform: `translate(-50%, -50%) scale(${onScreenScale})` }}
          onMouseEnter={() => setHovered(key)}
          onMouseLeave={() => setHovered((h) => (h === key ? null : h))}
        >
          <span className="india-map-dot-ping" />
          {hovered === key && (
            <div className="india-map-tooltip" style={{ transform: `translateX(-50%) scale(${1 / dotScale})` }}>
              <strong>{c.city.replace(/\b\w/g, (ch) => ch.toUpperCase())}</strong>
              <span>{c.count} {c.count === 1 ? unitLabel : `${unitLabel}s`}</span>
            </div>
          )}
        </div>
      );
    });

  return (
    <div
      ref={wrapRef}
      className="india-map-wrap fade-up"
      style={{ cursor: zoom > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="india-map-legend" onPointerDown={(e) => e.stopPropagation()}>
        <span><i className="india-map-legend-dot india-map-legend-dot-member" /> Members</span>
        <span><i className="india-map-legend-dot india-map-legend-dot-trip" /> Trips completed</span>
      </div>

      <div className="india-map-zoom-controls" onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(0.6)} disabled={zoom >= MAX_ZOOM}>
          <i className="fa-solid fa-plus" />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-0.6)} disabled={zoom <= MIN_ZOOM}>
          <i className="fa-solid fa-minus" />
        </button>
        {zoom > 1 && (
          <button type="button" aria-label="Reset zoom" onClick={resetZoom}>
            <i className="fa-solid fa-rotate-left" />
          </button>
        )}
      </div>

      <div
        className="india-map-canvas"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <img src="/india-map.svg" alt="Map of India" className="india-map-img" draggable={false} />
        {renderDots(tripDestinations, 'trip', maxTripCount, 'trip')}
        {renderDots(cities, 'member', maxMemberCount, 'member')}
      </div>
    </div>
  );
}
