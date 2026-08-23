import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorBody } from '@/types';

const baseURL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const TOKEN_KEY = 'kc.token';
export const USER_KEY = 'kc.user';

/** Public auth routes where a 401/403 should NOT force a redirect (we handle it in-page). */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
];

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token on every request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// On 401, clear the session and bounce to /login (unless already on a public page).
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      const path = window.location.pathname;
      const onPublic = PUBLIC_PATHS.some(
        (p) => path === p || path.startsWith(`${p}/`),
      );
      if (!onPublic) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a human-readable message from an axios error, honoring the backend envelope. */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.validationErrors) {
      const first = Object.values(body.validationErrors)[0];
      if (first) return first;
    }
    if (body?.message) return body.message;
    if (error.message === 'Network Error') {
      return 'Cannot reach the server. Is the backend running on port 8080?';
    }
  }
  return fallback;
}

/** True when the error is an HTTP response with the given status. */
export function isStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}

export default api;
