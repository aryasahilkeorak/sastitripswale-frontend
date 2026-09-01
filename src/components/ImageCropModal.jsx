import { useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';

const MAX_ZOOM = 3;

// Crop modal for uploaded photos. Drag/touch to pan, scroll or pinch to zoom.
// `aspect` (width/height) controls the crop shape: 1 (default) gives the
// square/circular-guide crop used for avatars everywhere in the app; any
// other ratio (e.g. 3 for a wide banner) gives a rectangular crop with no
// guide overlay - the viewport itself is the frame, Facebook/LinkedIn-cover
// style. Always exports a fixed-resolution image at that same aspect ratio.
export default function ImageCropModal({ file, onCancel, onCropped, aspect = 1, guide = 'circle', title = 'Crop your photo' }) {
  const [src, setSrc] = useState('');
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  // Active touch/mouse/pen pointers, keyed by pointerId - lets us tell a
  // single-finger pan from a two-finger pinch instead of letting a second
  // finger's pointerdown silently clobber the first's drag origin (which is
  // what made pinch-zoom feel like the image was jumping/tilting instead of
  // scaling).
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);

  const isSquare = aspect === 1;
  const viewW = isSquare ? 300 : 480;
  const viewH = isSquare ? 300 : Math.round(viewW / aspect);
  // Exported at a much higher resolution than the crop editor's own on-screen
  // viewport - this is what actually gets uploaded/stored, so it's what
  // determines how good the photo looks in the full-screen viewer later.
  // 1600 matches the backend's own compressImage() resize cap (uploadStore.js)
  // so nothing here goes to waste getting downscaled again server-side.
  const outW = isSquare ? 1024 : 1600;
  const outH = isSquare ? 1024 : Math.round(outW / aspect);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setScale(1);
    setPos({ x: 0, y: 0 });
    pointersRef.current.clear();
    pinchRef.current = null;
    dragRef.current = null;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) return null;

  const baseScale = natural.w && natural.h ? Math.max(viewW / natural.w, viewH / natural.h) : 1;
  const renderW = natural.w * baseScale * scale;
  const renderH = natural.h * baseScale * scale;

  // `left`/`top` below re-center the image around pos - i.e. left = (viewW -
  // w)/2 + x - so pos itself must be clamped to a *symmetric* range around 0
  // (half the overflow each way), not to [viewW-w, 0]. That range is only
  // correct for un-centered (raw top-left) positioning; used here, it let
  // one drag direction run too far (a gap past the image's edge) while
  // blocking the opposite direction entirely at pos=0.
  const clamp = (x, y, w = renderW, h = renderH) => {
    const maxX = Math.max(0, (w - viewW) / 2);
    const maxY = Math.max(0, (h - viewH) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const left = (viewW - renderW) / 2 + pos.x;
  const top = (viewH - renderH) / 2 + pos.y;

  const onLoad = () => {
    const el = imgRef.current;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    setNatural({ w, h });
    // A dead-center default crop chops the top of the subject's head off for
    // a typical portrait photo (cover-fit only leaves room to pan vertically
    // when the source is taller than the square frame, and centering it
    // crops evenly top/bottom - but a person's face usually sits nearer the
    // top of the frame, not the middle). Bias the initial framing so most of
    // that crop comes off the bottom instead, so avatars look right without
    // the user having to drag first.
    if (isSquare) {
      const base = Math.max(viewW / w, viewH / h);
      const overflow = h * base - viewH;
      setPos(overflow > 0 ? { x: 0, y: overflow * 0.35 } : { x: 0, y: 0 });
    } else {
      setPos({ x: 0, y: 0 });
    }
  };

  const pinchDistance = (pts) => Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(pointersRef.current.values());
    if (pts.length >= 2) {
      // A second finger just landed - stop panning and start a pinch instead
      // of letting this pointerdown overwrite dragRef with a new origin.
      dragRef.current = null;
      pinchRef.current = { startDist: pinchDistance(pts), startScale: scale, startPos: pos };
    } else {
      pinchRef.current = null;
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    }
  };

  const onPointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(pointersRef.current.values());

    if (pts.length >= 2 && pinchRef.current) {
      const factor = pinchDistance(pts) / pinchRef.current.startDist;
      const next = Math.max(1, Math.min(MAX_ZOOM, pinchRef.current.startScale * factor));
      setScale(next);
      const w = natural.w * baseScale * next;
      const h = natural.h * baseScale * next;
      setPos(clamp(pinchRef.current.startPos.x, pinchRef.current.startPos.y, w, h));
      return;
    }

    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const rawX = dragRef.current.origX + dx;
    const rawY = dragRef.current.origY + dy;
    setPos(clamp(rawX, rawY));
  };

  const onPointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    pinchRef.current = null;
    const remaining = Array.from(pointersRef.current.values());
    // One finger lifted but one is still down (pinch -> pan) - resume
    // panning from here instead of leaving the gesture dead until both lift.
    dragRef.current = remaining.length === 1 ? { startX: remaining[0].x, startY: remaining[0].y, origX: pos.x, origY: pos.y } : null;
  };

  const onWheel = (e) => {
    e.preventDefault();
    const next = Math.max(1, Math.min(MAX_ZOOM, scale - e.deltaY * 0.0015));
    setScale(next);
  };

  const applyCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    const effScale = baseScale * scale;
    const sx = -left / effScale;
    const sy = -top / effScale;
    const sW = viewW / effScale;
    const sH = viewH / effScale;
    ctx.drawImage(imgRef.current, sx, sy, sW, sH, 0, 0, outW, outH);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const cropped = new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
        onCropped(cropped);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    // +80 (not the visually-tighter +40) so the viewport actually fits inside
    // the modal's own 36px padding on each side (72px total) - it used to
    // fall short, which forced the modal into a horizontal scroll/overflow
    // around the crop area and threw off exactly where a drag landed on it.
    <Modal open={Boolean(file)} onClose={onCancel} title={title} maxWidth={viewW + 80}>
      <div
        ref={viewportRef}
        className="crop-viewport"
        style={{ width: viewW, height: viewH }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={onLoad}
          style={{ position: 'absolute', left, top, width: renderW || 'auto', height: renderH || 'auto' }}
        />
        {guide === 'circle' && <div className="crop-circle-guide" />}
      </div>

      <p className="text-muted" style={{ fontSize: '0.78rem', textAlign: 'center', margin: '10px 0 4px' }}>
        <i className="fa-solid fa-arrows-up-down-left-right" /> Drag to reposition · scroll or pinch to zoom
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={applyCrop}>
          <i className="fa-solid fa-crop" /> Apply Crop
        </button>
      </div>
    </Modal>
  );
}
