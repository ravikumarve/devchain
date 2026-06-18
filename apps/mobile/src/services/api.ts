// src/services/api.ts
// ─────────────────────────────────────────────────────────────
// Fixed: AsyncStorage import, correct certificate URL,
// added gigsAPI alias as jobsAPI for CreateJobScreen compat
// ─────────────────────────────────────────────────────────────
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://devchain.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers — web safe ─────────────────────────────────

const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      // On web, AsyncStorage uses localStorage internally but
      // must be awaited — never use localStorage directly
      return await AsyncStorage.getItem('accessToken');
    }
    return await AsyncStorage.getItem('accessToken');
  } catch (err) {
    console.error('[api] getToken error:', err);
    return null;
  }
};

// ─── Request interceptor ──────────────────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    console.error('[api] request interceptor error:', err);
  }
  return config;
});

// ─── Response interceptor ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // Fixed: use individual removes instead of multiRemove
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
      } catch (err) {
        console.error('[api] clearAuth error:', err);
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────
export const authAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
};

// ─── Products API ─────────────────────────────────────────────
export const productsAPI = {
  getAll: (params?: object) => api.get('/products', { params }),
  search: (q: string, page = 1) =>
    api.get('/products/search', { params: { q, page } }),
  trending: (limit = 10) =>
    api.get('/products/trending', { params: { limit } }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: object) => api.post('/products', data),
  update: (id: string, data: object) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// ─── Gigs API ─────────────────────────────────────────────────
export const gigsAPI = {
  getAll: (params?: object) => api.get('/gigs', { params }),
  search: (q: string) => api.get('/gigs/search', { params: { q } }),
  getOne: (id: string) => api.get(`/gigs/${id}`),
  create: (data: object) => api.post('/gigs', data),
  update: (id: string, data: object) => api.put(`/gigs/${id}`, data),
  delete: (id: string) => api.delete(`/gigs/${id}`),
};

// ─── jobsAPI alias — keeps CreateJobScreen working ───────────
// CreateJobScreen still uses jobsAPI — maps to gigsAPI
export const jobsAPI = gigsAPI;

// ─── Orders API ───────────────────────────────────────────────
export const ordersAPI = {
  getAll: (params?: object) => api.get('/orders', { params }),
  getOne: (id: string) => api.get(`/orders/${id}`),
  create: (data: { productId: string }) => api.post('/orders', data),
  refund: (id: string) => api.post(`/orders/${id}/refund`),
};

// ─── Certificates API — FIXED URL ────────────────────────────
export const certificatesAPI = {
  mine: () => api.get('/certificates/mine'),           // was /certificates/user/me — WRONG
  verify: (certId: string) =>
    api.post('/certificates/verify', { certId }),
  getOne: (id: string) => api.get(`/certificates/${id}`),
};

export default api;
