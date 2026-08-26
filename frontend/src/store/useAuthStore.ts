import { create } from 'zustand';
import { TOKEN_KEY, USER_KEY } from '@/lib/apiClient';
import type { UserSummary } from '@/types';

interface AuthState {
  token: string | null;
  user: UserSummary | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserSummary) => void;
  setUser: (user: UserSummary) => void;
  logout: () => void;
}

function readUser(): UserSummary | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserSummary) : null;
  } catch {
    return null;
  }
}

const initialToken = localStorage.getItem(TOKEN_KEY);
const initialUser = readUser();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUser,
  isAuthenticated: Boolean(initialToken),
  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
