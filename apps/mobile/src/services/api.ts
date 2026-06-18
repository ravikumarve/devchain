// src/services/api.ts — Matches real backend routes
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = __DEV__
  ? 'http://localhost:10000/api/v1'
  : 'https://web-vert-mu-22.vercel.app/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers ──────────────────────────────────────────────
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch {
    return null;
  }
};

// ─── Request interceptor ────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    console.error('[api] request interceptor error:', err);
  }
  return config;
});

// ─── Response interceptor ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
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

// ─── Auth API ───────────────────────────────────────────────────
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// ─── Products API ───────────────────────────────────────────────
export const productsAPI = {
  getAll: (params?: object) => api.get('/products', { params }),
  search: (q: string, page = 1) =>
    api.get('/products/search', { params: { q, page } }),
  trending: (limit = 10) =>
    api.get('/products/trending', { params: { limit } }),
  getOne: (id: string) => api.get(`/products/${id}`),
  myProducts: () => api.get('/products/mine'),
  create: (data: object) => api.post('/products', data),
  update: (id: string, data: object) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// ─── Jobs API ──────────────────────────────────────────────────
export const jobsAPI = {
  getAll: (params?: object) => api.get('/jobs', { params }),
  getOne: (id: string) => api.get(`/jobs/${id}`),
  create: (data: object) => api.post('/jobs', data),
  myJobs: () => api.get('/jobs/me/jobs'),
  myProposals: () => api.get('/jobs/me/proposals'),
  submitProposal: (jobId: string, data: object) =>
    api.post(`/jobs/${jobId}/proposals`, data),
  getJobProposals: (jobId: string) =>
    api.get(`/jobs/${jobId}/proposals`),
  acceptProposal: (proposalId: string) =>
    api.patch(`/jobs/proposals/${proposalId}/accept`),
  rejectProposal: (proposalId: string) =>
    api.patch(`/jobs/proposals/${proposalId}/reject`),
  closeJob: (jobId: string) => api.patch(`/jobs/${jobId}/close`),
};

// ─── Ownership API ──────────────────────────────────────────────
export const ownershipAPI = {
  purchase: (data: { productId: string }) =>
    api.post('/ownership/purchase', data),
  verifyCertificate: (hash: string) =>
    api.get(`/ownership/verify/${hash}`),
  myPurchases: () => api.get('/ownership/my-purchases'),
  mySales: () => api.get('/ownership/my-sales'),
};

// ─── Upload API ─────────────────────────────────────────────────
export const uploadAPI = {
  upload: (productId: string, formData: FormData) =>
    api.post(`/uploads/product/${productId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  download: (productId: string) =>
    api.get(`/uploads/product/${productId}/download`),
  fileInfo: (productId: string) =>
    api.get(`/uploads/product/${productId}/info`),
};

// ─── Payments API ───────────────────────────────────────────────
export const paymentsAPI = {
  createCheckoutSession: (productId: string) =>
    api.post('/payments/create-checkout-session', { productId }),
};

// ─── Escrow API ────────────────────────────────────────────────
export const escrowAPI = {
  getMy: () => api.get('/escrow/mine'),
  get: (proposalId: string) => api.get(`/escrow/${proposalId}`),
  fund: (proposalId: string) => api.post(`/escrow/${proposalId}/fund`),
  requestRelease: (proposalId: string) =>
    api.post(`/escrow/${proposalId}/request-release`),
  releasePayment: (proposalId: string) =>
    api.post(`/escrow/${proposalId}/release`),
};

// ─── Notifications API ─────────────────────────────────────────
export const notificationsAPI = {
  getMy: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// ─── Reviews API ────────────────────────────────────────────────
export const reviewsAPI = {
  create: (data: { productId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),
  getProductReviews: (productId: string) =>
    api.get(`/reviews/product/${productId}`),
  getMyReview: (productId: string) =>
    api.get(`/reviews/product/${productId}/mine`),
  update: (id: string, data: { rating?: number; comment?: string }) =>
    api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  getSellerReviews: (sellerId: string) =>
    api.get(`/reviews/seller/${sellerId}`),
};

// ─── Chat API ──────────────────────────────────────────────────
export const chatAPI = {
  getConversations: () => api.get('/chat'),
  createOrGetConversation: (data: { participantId: string; relatedJobId?: string }) =>
    api.post('/chat', data),
  getMessages: (conversationId: string, params?: { before?: string; limit?: number }) =>
    api.get(`/chat/${conversationId}/messages`, { params }),
  sendMessage: (conversationId: string, data: { content: string }) =>
    api.post(`/chat/${conversationId}/messages`, data),
};

// ─── Analytics API ──────────────────────────────────────────────
export const analyticsAPI = {
  seller: () => api.get('/analytics/seller'),
  reviews: () => api.get('/analytics/reviews'),
};

export default api;
