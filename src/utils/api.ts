import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && originalRequest) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            accessToken,
            newRefreshToken
          );

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed, logout
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; displayName?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/profile'),

  updateProfile: (data: { displayName?: string }) =>
    api.put('/users/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/password', data),

  addCredits: (amount: number) =>
    api.post('/users/credits', { amount }),
};

// Generations API
export const generationsApi = {
  list: (params?: { type?: string; limit?: number; offset?: number }) =>
    api.get('/generations', { params }),

  get: (id: string) => api.get(`/generations/${id}`),

  getStatus: (id: string) => api.get(`/generations/${id}/status`),

  createImage: (data: {
    prompt: string;
    style?: string;
    aspectRatio?: string;
    quality?: string;
    numImages?: number;
  }) => api.post('/generations/image', data),

  createVideo: (data: {
    prompt: string;
    imageUrl?: string;
    duration?: number;
    resolution?: string;
    motionStyle?: string;
  }) => api.post('/generations/video', data),

  createAudio: (data: {
    text: string;
    voice?: string;
    speed?: number;
    emotion?: string;
  }) => api.post('/generations/audio', data),

  delete: (id: string) => api.delete(`/generations/${id}`),
};

// Chat API
export const chatApi = {
  send: (data: { message: string; sessionId?: string }) =>
    api.post('/chat', data),

  getHistory: (params?: { sessionId?: string; limit?: number }) =>
    api.get('/chat/history', { params }),

  clearHistory: (sessionId?: string) =>
    api.delete('/chat/history', { data: { sessionId } }),
};

// Files API
export const filesApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  list: () => api.get('/files'),

  delete: (id: string) => api.delete(`/files/${id}`),
};

export default api;
