// src/store/authStore.ts
// Fixed: individual AsyncStorage removes instead of multiRemove
// multiRemove is not supported in all AsyncStorage web implementations
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { authAPI } from '../services/api';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'buyer' | 'seller' | 'admin';
  avatarUrl?: string | null;
  bio?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

// ─── Storage helpers — fixed for web ─────────────────────────

const saveAuth = async (accessToken: string, refreshToken: string, user: User) => {
  try {
    // Use individual setItem calls — multiSet can fail on web
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (err) {
    console.error('[authStore] saveAuth error:', err);
  }
};

const clearAuth = async () => {
  try {
    // Fixed: individual removes — multiRemove not supported on web
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  } catch (err) {
    console.error('[authStore] clearAuth error:', err);
  }
};

// ─── Store ────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.login({ email, password });
      const { user, accessToken, refreshToken } = res.data.data;
      await saveAuth(accessToken, refreshToken, user);
      set({ user, token: accessToken, isAuthenticated: true });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      console.error('[authStore] login error:', message);
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async ({ username, email, password, displayName }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.register({ username, email, password, displayName });
      const { user, accessToken, refreshToken } = res.data.data;
      await saveAuth(accessToken, refreshToken, user);
      set({ user, token: accessToken, isAuthenticated: true });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed.';
      console.error('[authStore] register error:', message);
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Best effort — log but don't block logout
      console.warn('[authStore] logout API call failed:', err);
    }
    await clearAuth();
    set({ user: null, token: null, isAuthenticated: false, error: null });

    // On web — force reload to reset all React Navigation state
    if (Platform.OS === 'web') {
      setTimeout(() => { window.location.href = '/'; }, 100);
    }
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      }
    } catch (err) {
      console.error('[authStore] loadUser error:', err);
    }
  },
}));
