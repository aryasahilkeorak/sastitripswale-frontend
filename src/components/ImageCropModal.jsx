import { useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';

const MAX_ZOOM = 3;

// Crop modal for uploaded photos. Drag to pan, slider (or wheel) to zoom.
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

  const isSquare = aspect === 1;
  const viewW = isSquare ? 300 : 480;
  const viewH = isSquare ? 300 : Math.round(viewW / aspect);
  const outW = isSquare ? 480 : 960;
  const outH = isSquare ? 480 : Math.round(outW / aspect);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setScale(1);
    setPos({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) return null;

  const baseScale = natural.w && natural.h ? Math.max(viewW / natural.w, viewH / natural.h) : 1;
  const renderW = natural.w * baseScale * scale;
  const renderH = natural.h * baseScale * scale;

  const clamp = (x, y, w = renderW, h = renderH) => {
    const minX = Math.min(0, viewW - w);
    const minY = Math.min(0, viewH - h);
    return {
      x: Math.max(minX, Math.min(0, x)),
      y: Math.max(minY, Math.min(0, y)),
    };
  };

  const left = (viewW - renderW) / 2 + pos.x;
  const top = (viewH - renderH) / 2 + pos.y;

  const onLoad = () => {
    const el = imgRef.current;
    setNatural({ w: el.naturalWidth, h: el.naturalHeight });
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const rawX = dragRef.current.origX + dx;
    const rawY = dragRef.current.origY + dy;
    setPos(clamp(rawX, rawY));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (e) => {
    e.preventDefault();
    const next = Math.max(1, Math.min(MAX_ZOOM, scale - e.deltaY * 0.0015));
    setScale(next);
  };

  const changeZoom = (e) => {
    const next = Number(e.target.value);
    setScale(next);
    // Re-clamp against the new render size so the image never leaves a gap.
    const w = natural.w * baseScale * next;
    const h = natural.h * baseScale * next;
    setPos((p) => clamp(p.x, p.y, w, h));
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
    <Modal open={Boolean(file)} onClose={onCancel} title={title} maxWidth={viewW + 40}>
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

      <div className="form-group mt-3">
        <label><i className="fa-solid fa-magnifying-glass-plus" /> Zoom</label>
        <input type="range" min="1" max={MAX_ZOOM} step="0.01" value={scale} onChange={changeZoom} className="crop-zoom-slider" />
      </div>

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
