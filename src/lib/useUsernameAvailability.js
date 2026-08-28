import { useEffect, useState } from 'react';
import { api } from './api.js';

const USERNAME_RX = /^[a-z0-9_.]{3,30}$/;
const DEBOUNCE_MS = 450;

// Instagram-style live availability check for a username field - debounced
// so it doesn't fire on every keystroke. Mirrors the backend's USERNAME_RX
// (utils/username.js) so an obviously-invalid value shows instantly without
// even hitting the network.
export function useUsernameAvailability(username, { skip = false, currentUsername = '' } = {}) {
  const [status, setStatus] = useState('idle'); // idle | checking | available | taken | invalid

  useEffect(() => {
    const clean = (username || '').toLowerCase().trim();
    if (skip || !clean) {
      setStatus('idle');
      return undefined;
    }
    // Editing your own profile and leaving the field unchanged - it's
    // trivially "available" (to you), no need to ask the server.
    if (currentUsername && clean === currentUsername.toLowerCase().trim()) {
      setStatus('available');
      return undefined;
    }
    if (!USERNAME_RX.test(clean)) {
      setStatus('invalid');
      return undefined;
    }
    setStatus('checking');
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .get('/auth/check-username', { params: { username: clean } })
        .then((r) => {
          if (!cancelled) setStatus(r.data.available ? 'available' : 'taken');
        })
        .catch(() => {
          if (!cancelled) setStatus('idle');
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [username, skip, currentUsername]);

  return status;
}

export default useUsernameAvailability;
