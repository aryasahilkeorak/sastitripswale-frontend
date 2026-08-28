import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/index.js';

// Single camera-icon button that opens a small dropdown ("Change photo" /
// "Remove photo") instead of two separate overlay buttons crowding the
// avatar/cover corner. `size` controls the trigger button's diameter.
export default function PhotoActionMenu({ hasPhoto, onChange, onRemove, size = 34, style }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', ...style }}>
      <button
        type="button"
        className="btn btn-sm"
        style={{ borderRadius: '50%', width: size, height: size, padding: 0, justifyContent: 'center', background: 'var(--fire)', color: '#fff' }}
        onClick={() => setOpen((v) => !v)}
        title={t('photoActionMenu.photoOptions')}
      >
        <i className="fa-solid fa-camera" />
      </button>
      {open && (
        <div className="nav-menu menu-left">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onChange();
            }}
          >
            <i className="fa-solid fa-camera" /> {t('photoActionMenu.changePhoto')}
          </button>
          {hasPhoto && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onRemove();
              }}
            >
              <i className="fa-solid fa-trash" /> {t('photoActionMenu.removePhoto')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
