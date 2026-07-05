import { useToastStore } from '../lib/toast.js';

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className="toast show">
          <span className="toast-icon">
            {typeof t.icon === 'string' && t.icon.startsWith('fa') ? <i className={t.icon} /> : t.icon}
          </span>
          <span className="toast-text">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
