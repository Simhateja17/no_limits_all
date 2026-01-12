import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const errorMessage = error.response.data?.error;
        
        // Check if account was deleted
        if (errorMessage?.includes('no longer exists') || errorMessage?.includes('Account deleted')) {
          console.log('Account no longer exists:', errorMessage);
        }
        
        // Clear invalid token
        localStorage.removeItem('accessToken');

        // Only redirect if we're in a browser environment
        if (typeof window !== 'undefined') {
          // Import the auth store to trigger logout
          import('./store').then(({ useAuthStore }) => {
            useAuthStore.getState().logout();
          });

          // Redirect to login page if not already there
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);
