import { useEffect, useCallback } from 'react';

// Controlled lightbox: `images` = [url...], `index` = active index or null.
export default function Lightbox({ images, index, onClose, onIndex }) {
  const show = index !== null && index !== undefined;

  const go = useCallback(
    (dir) => {
      if (!images.length) return;
      onIndex((index + dir + images.length) % images.length);
    },
    [images, index, onIndex]
  );

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

  if (!show) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        background: 'rgba(6,7,13,0.96)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <img
        src={images[index]}
        alt=""
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: 16,
          boxShadow: '0 0 80px rgba(255,107,0,0.2), 0 32px 80px rgba(0,0,0,0.7)',
        }}
      />
      <button className="lb-btn" style={lbBtn('top')} onClick={onClose} aria-label="Close">
        <i className="fa-solid fa-xmark" />
      </button>
      <button className="lb-btn" style={lbBtn('left')} onClick={() => go(-1)} aria-label="Previous">
        <i className="fa-solid fa-angle-left" />
      </button>
      <button className="lb-btn" style={lbBtn('right')} onClick={() => go(1)} aria-label="Next">
        <i className="fa-solid fa-angle-right" />
      </button>
    </div>
  );
}

function lbBtn(pos) {
  const base = {
    position: 'absolute',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  if (pos === 'top') return { ...base, top: 20, right: 20, width: 44, height: 44, fontSize: '1.3rem' };
  if (pos === 'left')
    return { ...base, left: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, fontSize: '1.6rem' };
  return { ...base, right: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, fontSize: '1.6rem' };
}
