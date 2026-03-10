import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://devchain.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Get token from AsyncStorage OR localStorage (web fallback)
const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return token;
  } catch {
    try { return localStorage.getItem('accessToken'); } catch { return null; }
  }
};

// Auto-attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getMine: () => api.get('/products/seller/me'),
};

export const ownershipAPI = {
  purchase: (productId: string) => api.post('/ownership/purchase', { productId }),
  verify: (hash: string) => api.get(`/ownership/verify/${hash}`),
  myPurchases: () => api.get('/ownership/my-purchases'),
  mySales: () => api.get('/ownership/my-sales'),
};

export const jobsAPI = {
  getAll: (params?: any) => api.get('/jobs', { params }),
  getOne: (id: string) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  submitProposal: (jobId: string, data: any) => api.post(`/jobs/${jobId}/proposals`, data),
  myJobs: () => api.get('/jobs/me/jobs'),
  myProposals: () => api.get('/jobs/me/proposals'),
};

export default api;
