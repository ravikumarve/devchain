import { create } from 'zustand';
import { authAPI } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  reputationScore: number;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  refreshSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ email, password });
      const { user, accessToken, refreshToken } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken || '');
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, refreshToken: refreshToken || null, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.register({ username, email, password });
      const { user, accessToken, refreshToken } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken || '');
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, refreshToken: refreshToken || null, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  loadUser: () => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    const rt = localStorage.getItem('refreshToken');
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr), refreshToken: rt, isAuthenticated: true });
    }
  },

  refreshSession: async () => {
    const rt = get().refreshToken || localStorage.getItem('refreshToken');
    if (!rt) return false;
    try {
      const res = await authAPI.refresh({ refreshToken: rt });
      const { accessToken, refreshToken: newRt } = res.data;
      localStorage.setItem('accessToken', accessToken);
      if (newRt) localStorage.setItem('refreshToken', newRt);
      set({ token: accessToken, refreshToken: newRt || null });
      return true;
    } catch {
      return false;
    }
  },
}));
