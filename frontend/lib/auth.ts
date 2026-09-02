

import { apiClient } from './api';

export type {
  User,
  AuthTokens,
  LoginResponse,
  RegisterResponse,
  RegisterData,
  LoginData,
} from './api';

export { apiClient } from './api';

export const authAPI = {
  register: apiClient.register.bind(apiClient),
  login: async (data: { username: string; password: string }) => {
    console.log('AUTH DEBUG: authAPI.login received data:', data);
    console.log('AUTH DEBUG: Extracted username:', data.username);
    console.log('AUTH DEBUG: Extracted password:', data.password ? '***' : 'undefined');
    const result = await apiClient.login(data.username, data.password);
    console.log('AUTH DEBUG: apiClient.login result:', result);
    return result;
  },
  logout: apiClient.logout.bind(apiClient),
  refreshToken: apiClient.refreshToken.bind(apiClient),
  getProfile: apiClient.getProfile.bind(apiClient),
};

export const tokenManager = {
  setTokens: (tokens: any, user: any) => {
    
  },
  getTokens: () => {
    
    return null;
  },
  getUser: () => {
    return apiClient.getCurrentUser();
  },
  clearTokens: () => {
    
  },
  isTokenExpired: (token: string) => {
    
    return false;
  },
  getAuthHeader: () => {
    
    return null;
  }
};
