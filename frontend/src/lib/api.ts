import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // IMPORTANT: Send cookies with every request for httpOnly cookie auth
  withCredentials: true,
});

// Request interceptor
// Note: Primary auth is via httpOnly cookies (sent automatically with withCredentials)
// localStorage token is only used as fallback for backward compatibility
api.interceptors.request.use(
  (config) => {
    // Only add Authorization header if we have a token in memory/localStorage
    // This is a fallback - primary auth should be via httpOnly cookies
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
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
  async (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const errorMessage = error.response.data?.error;
        const originalRequest = error.config;

        // If this is a refresh request that failed, don't retry
        if (originalRequest.url?.includes('/auth/refresh')) {
          // Session expired - clear local storage and redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            import('./store').then(({ useAuthStore }) => {
              useAuthStore.getState().logout();
            });
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            }
          }
          return Promise.reject(error);
        }

        // Try to refresh the token
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshResponse = await api.post('/auth/refresh');
            if (refreshResponse.data.accessToken) {
              // Store new token for fallback header auth
              localStorage.setItem('accessToken', refreshResponse.data.accessToken);
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - logout
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('user');
              import('./store').then(({ useAuthStore }) => {
                useAuthStore.getState().logout();
              });
              if (window.location.pathname !== '/') {
                window.location.href = '/';
              }
            }
          }
        }

        // Check if account was deleted or deactivated
        if (errorMessage?.includes('no longer exists') || errorMessage?.includes('deactivated')) {
          console.log('Account issue:', errorMessage);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            import('./store').then(({ useAuthStore }) => {
              useAuthStore.getState().logout();
            });
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            }
          }
        }
      }
    }
    return Promise.reject(error);
  }
);
