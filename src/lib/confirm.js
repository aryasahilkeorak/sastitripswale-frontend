// Global confirm dialog - a drop-in Promise-based replacement for
// window.confirm(), so destructive actions get the app's own modal styling
// instead of the browser's native dialog. Mirrors toast.js's pattern: a
// zustand store the imperative confirm() function pushes into, rendered by
// <ConfirmDialog/> (mounted once in Layout/AdminLayout).
import { create } from 'zustand';

export const useConfirmStore = create((set) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  close: () => set({ dialog: null }),
}));

// confirm('Delete this trip?') or confirm({ message, title, confirmLabel,
// cancelLabel, danger }) - resolves true/false, same call sites as
// `if (!window.confirm(...)) return;` just with an `await` in front.
export function confirm(messageOrOpts) {
  const opts = typeof messageOrOpts === 'string' ? { message: messageOrOpts } : messageOrOpts;
  return new Promise((resolve) => {
    useConfirmStore.getState().open({ ...opts, resolve });
  });
}
