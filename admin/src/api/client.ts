import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:4000/api/v1`;
  }
  return 'http://localhost:4000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach staff JWT token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ayngaran_admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap response data and handle auth expiration
adminApi.interceptors.response.use(
  (response) => {
    // If wrapped in standard response { success: true, data: ... }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      if ('pagination' in response.data) {
        return {
          data: response.data.data,
          items: response.data.items || response.data.data,
          pagination: response.data.pagination,
          ...response.data,
        };
      }
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ayngaran_admin_token');
      localStorage.removeItem('ayngaran_admin_staff');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
