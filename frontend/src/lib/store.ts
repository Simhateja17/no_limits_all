import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User roles matching backend
export type UserRole = 'CLIENT' | 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN';

// Login type for UI display (Admin is hidden)
export type LoginType = 'client' | 'employee' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar?: string | null;
  clientId?: string;
  storeName?: string;
  storeUrl?: string;
  storeType?: 'shopify' | 'woocommerce';
  employeeId?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginType: LoginType | null;
  isLoading: boolean;
}

interface AuthActions {
  login: (user: User, loginType: LoginType) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loginType: null,
      isLoading: false,

      login: (user: User, loginType: LoginType) => {
        set({
          user,
          isAuthenticated: true,
          loginType,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          loginType: null,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        loginType: state.loginType,
      }),
    }
  )
);

// Helper function to get dashboard route based on role
export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'CLIENT':
      return '/client/dashboard';
    case 'EMPLOYEE':
      return '/employee/dashboard';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    default:
      return '/dashboard';
  }
}

// Helper function to check if user has access to a route
export function hasRouteAccess(role: UserRole, path: string): boolean {
  const clientRoutes = ['/client'];
  const employeeRoutes = ['/employee'];
  const adminRoutes = ['/admin'];

  if (role === 'SUPER_ADMIN') return true; // Super admin has access to everything

  if (role === 'ADMIN') {
    return !clientRoutes.some(route => path.startsWith(route)) || adminRoutes.some(route => path.startsWith(route));
  }

  if (role === 'CLIENT') {
    return clientRoutes.some(route => path.startsWith(route));
  }

  if (role === 'EMPLOYEE') {
    return employeeRoutes.some(route => path.startsWith(route));
  }

  return false;
}
