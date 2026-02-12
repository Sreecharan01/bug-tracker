import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 & token refresh ──────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken }, { withCredentials: true });
        const newToken = data.data.accessToken;

        localStorage.setItem('accessToken', newToken);
        if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);

        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        original.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ───────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Bug API ────────────────────────────────────────────────────
export const bugAPI = {
  getAll: (params) => api.get('/bugs', { params }),
  getById: (id) => api.get(`/bugs/${id}`),
  create: (data) => api.post('/bugs', data),
  update: (id, data) => api.put(`/bugs/${id}`, data),
  delete: (id) => api.delete(`/bugs/${id}`),
  getStats: () => api.get('/bugs/stats'),
  addComment: (id, data) => api.post(`/bugs/${id}/comments`, data),
  deleteComment: (id, commentId) => api.delete(`/bugs/${id}/comments/${commentId}`),
  toggleWatch: (id) => api.post(`/bugs/${id}/watch`),
};

// ── User API ───────────────────────────────────────────────────
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  getStats: (id) => api.get(`/users/${id}/stats`),
};

// ── Report API ─────────────────────────────────────────────────
export const reportAPI = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  generate: (data) => api.post('/reports', data),
  delete: (id) => api.delete(`/reports/${id}`),
};

// ── Settings API ───────────────────────────────────────────────
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get(`/settings/${key}`),
  create: (data) => api.post('/settings', data),
  update: (key, data) => api.put(`/settings/${key}`, data),
  delete: (key) => api.delete(`/settings/${key}`),
  bulkUpdate: (settings) => api.put('/settings', { settings }),
};

export default api;
