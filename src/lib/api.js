// Axios instance with JWT Bearer + silent refresh on TOKEN_EXPIRED.
import axios from 'axios';
import { useAuth } from '../store/auth.js';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL });

// Attach access token on every request.
api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single in-flight refresh shared across concurrent 401s.
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401 && code === 'TOKEN_EXPIRED' && original && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          const rt = useAuth.getState().refreshToken;
          if (!rt) throw new Error('no refresh token');
          refreshing = axios
            .post(`${baseURL}/auth/refresh`, { refreshToken: rt })
            .then((r) => {
              useAuth.getState().setSession({
                accessToken: r.data.accessToken,
                refreshToken: r.data.refreshToken,
              });
              return r.data.accessToken;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const newToken = await refreshing;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        useAuth.getState().clear();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(e, fallback = 'Something went wrong. Please try again.') {
  return e?.response?.data?.message || e?.message || fallback;
}

export default api;
