import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, maxWidth }) {
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
  return (
    <div
      className="modal-overlay open"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal" style={maxWidth ? { maxWidth } : undefined}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        {title && (
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8, fontSize: '1.3rem' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
