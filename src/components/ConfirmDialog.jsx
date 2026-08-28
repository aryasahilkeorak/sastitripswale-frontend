import { useEffect } from 'react';
import { useConfirmStore } from '../lib/confirm.js';
import { useT } from '../i18n/index.js';

// Renders whatever confirm() last pushed onto the store. Mounted once
// (Layout.jsx / AdminLayout.jsx, alongside Toaster) - every call site just
// awaits the confirm() promise, no per-page modal state needed.
export default function ConfirmDialog() {
  const t = useT();
  const dialog = useConfirmStore((s) => s.dialog);
  const close = useConfirmStore((s) => s.close);

  const settle = (result) => {
    dialog?.resolve(result);
    close();
  };

  useEffect(() => {
    if (!dialog) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') settle(false);
      if (e.key === 'Enter') settle(true);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  if (!dialog) return null;

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && settle(false)}>
      <div className="modal confirm-modal" style={{ maxWidth: 420 }}>
        <button className="modal-close" onClick={() => settle(false)} aria-label={t('confirmDialog.close')}>
          <i className="fa-solid fa-xmark" />
        </button>
        <div className={`confirm-modal-icon${dialog.danger ? ' danger' : ''}`}>
          <i className={dialog.danger ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-question'} />
        </div>
        {dialog.title && (
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 8, textAlign: 'center' }}>
            {dialog.title}
          </h2>
        )}
        <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', margin: '0 0 20px' }}>
          {dialog.message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={() => settle(false)}>
            {dialog.cancelLabel || t('confirmDialog.cancel')}
          </button>
          <button
            className="btn btn-primary"
            style={dialog.danger ? { background: '#ef4444', borderColor: '#ef4444' } : undefined}
            onClick={() => settle(true)}
            autoFocus
          >
            {dialog.confirmLabel || t('confirmDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
