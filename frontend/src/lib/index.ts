export { api } from './api';
export { QueryProvider } from './query-provider';
export { useAuthStore, getDashboardRoute, hasRouteAccess } from './store';
export type { User, UserRole, LoginType } from './store';
export { useClients, getClientNames, useOnboarding } from './hooks';
export type { ClientData } from './hooks';
export { onboardingApi } from './onboarding-api';
export type { 
  OnboardingStatus, 
  JTLCredentialsInput, 
  ShopifyChannelInput, 
  WooCommerceChannelInput,
  OnboardingResult 
} from './onboarding-api';
