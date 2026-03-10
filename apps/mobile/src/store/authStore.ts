import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  reputationScore: number;
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

const saveAuth = async (accessToken: string, refreshToken: string, user: User) => {
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  // Web fallback
  try {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  } catch {}
};

const clearAuth = async () => {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
  await AsyncStorage.removeItem('user');
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch {}
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ email, password });
      const { user, accessToken, refreshToken } = res.data;
      await saveAuth(accessToken, refreshToken, user);
      set({ user, token: accessToken, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.register({ username, email, password });
      const { user, accessToken, refreshToken } = res.data;
      await saveAuth(accessToken, refreshToken, user);
      set({ user, token: accessToken, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await clearAuth();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      let token = await AsyncStorage.getItem('accessToken');
      let userStr = await AsyncStorage.getItem('user');
      // Web fallback
      if (!token) { try { token = localStorage.getItem('accessToken'); } catch {} }
      if (!userStr) { try { userStr = localStorage.getItem('user'); } catch {} }
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true });
      }
    } catch {}
  },
}));
