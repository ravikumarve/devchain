import axios from 'axios';

const API_URL = 'https://devchain.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
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
  myJobs: () => api.get('/jobs/me/jobs'),
  submitProposal: (jobId: string, data: any) => api.post(`/jobs/${jobId}/proposals`, data),
};

export default api;

// Extra methods
export const extraAPI = {
  myProducts: () => api.get('/products/seller/me'),
  myJobs: () => api.get('/jobs/me/jobs'),
  myProposals: () => api.get('/jobs/me/proposals'),
};
