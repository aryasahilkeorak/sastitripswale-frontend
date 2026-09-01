import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, maxWidth, centered, zIndex }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  // Portalled to document.body: a `position: fixed` overlay only covers the
  // viewport if none of its ancestors set transform/filter/backdrop-filter
  // (each creates a containing block that traps fixed descendants inside
  // it). Cards on this page use backdrop-filter, so without the portal the
  // overlay collapses to the card's own box instead of covering the screen.
  return createPortal(
    <div
      className={`modal-overlay open${centered ? ' modal-overlay-center' : ''}`}
      style={zIndex ? { zIndex } : undefined}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal" style={maxWidth ? { maxWidth } : undefined}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark" />
        </button>
        {title && (
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8, fontSize: '1.3rem' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
