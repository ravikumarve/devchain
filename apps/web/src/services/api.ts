import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

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

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const res = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = res.data;
        localStorage.setItem('accessToken', accessToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  refresh: (data: { refreshToken: string }) => api.post('/auth/refresh', data),
  updateProfile: (data: { bio?: string; avatarUrl?: string }) => api.put('/auth/me', data),
};

export const productsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  getMine: () => api.get('/products/seller/me'),
};

export const ownershipAPI = {
  purchase: (productId: string) => api.post('/ownership/purchase', { productId }),
  verify: (hash: string) => api.get(`/ownership/verify/${hash}`),
  myPurchases: () => api.get('/ownership/my-purchases'),
  mySales: () => api.get('/ownership/my-sales'),
};

export const jobsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/jobs', { params }),
  getOne: (id: string) => api.get(`/jobs/${id}`),
  create: (data: Record<string, unknown>) => api.post('/jobs', data),
  myJobs: () => api.get('/jobs/me/jobs'),
  myProposals: () => api.get('/jobs/me/proposals'),
  submitProposal: (jobId: string, data: Record<string, unknown>) => api.post(`/jobs/${jobId}/proposals`, data),
  getJobProposals: (jobId: string) => api.get(`/jobs/${jobId}/proposals`),
  acceptProposal: (proposalId: string) => api.patch(`/jobs/proposals/${proposalId}/accept`),
  rejectProposal: (proposalId: string) => api.patch(`/jobs/proposals/${proposalId}/reject`),
};

export default api;

// Extra methods
export const extraAPI = {
  myProducts: () => api.get('/products/seller/me'),
  myJobs: () => api.get('/jobs/me/jobs'),
  myProposals: () => api.get('/jobs/me/proposals'),
};

export const uploadAPI = {
  uploadFile: (productId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/uploads/product/${productId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFileInfo: (productId: string) => api.get(`/uploads/product/${productId}/info`),
  getDownloadUrl: (productId: string) =>
    `${api.defaults.baseURL}/uploads/product/${productId}/download`,
};

export const paymentsAPI = {
  createCheckoutSession: (productId: string) =>
    api.post('/payments/create-checkout-session', { productId }),
};

export const escrowAPI = {
  getMy: () => api.get('/escrow/mine'),
  get: (proposalId: string) => api.get(`/escrow/${proposalId}`),
  fund: (proposalId: string) => api.post(`/escrow/${proposalId}/fund`),
  requestRelease: (proposalId: string) => api.post(`/escrow/${proposalId}/request-release`),
  releasePayment: (proposalId: string) => api.post(`/escrow/${proposalId}/release`),
};

export const notificationsAPI = {
  getMy: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

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

export const chatAPI = {
  getConversations: () => api.get('/chat'),
  createOrGetConversation: (data: { participantId: string; relatedJobId?: string }) =>
    api.post('/chat', data),
  getMessages: (conversationId: string, params?: { before?: string; limit?: number }) =>
    api.get(`/chat/${conversationId}/messages`, { params }),
  sendMessage: (conversationId: string, data: { content: string }) =>
    api.post(`/chat/${conversationId}/messages`, data),
};
