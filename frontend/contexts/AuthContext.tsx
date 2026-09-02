'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { User, AuthTokens, authAPI, apiClient, LoginData, RegisterData, LoginResponse, RegisterResponse } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isTokenValid: boolean;
  hasActiveTransaction: boolean;
  login: (data: LoginData) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  startTransaction: () => void;
  endTransaction: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [hasActiveTransaction, setHasActiveTransaction] = useState(false);
  const pathname = usePathname();

  // Initialize transaction state from localStorage
  useEffect(() => {
    const storedTransactionState = localStorage.getItem('hasActiveTransaction');
    if (storedTransactionState === 'true') {
      setHasActiveTransaction(true);
    }
  }, []);

  const isAuthenticated = !!user && isTokenValid;

  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    const initAuth = async () => {
      try {
        // First check if we have a stored user and token
        const storedUser = apiClient.getUser();
        const storedToken = apiClient.getAuthToken();
        
        if (storedUser && storedToken) {
          console.log('Auth: Found stored user and token, setting initial state');
          setUser(storedUser);
          setIsTokenValid(true);
          
          // Then validate token in background (non-blocking)
          try {
            console.log('Auth: Starting token validation...');
            console.log('Auth: Token preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'none');
            console.log('Auth: User preview:', storedUser ? { id: storedUser.id, role: storedUser.role } : null);
            
            const isValid = await apiClient.validateTokenWithServer(storedToken);
            console.log('Auth: Token validation result:', isValid);
            
            if (!isValid) {
              console.log('Auth: Token validation failed, logging out');
              await apiClient.logout();
            } else {
              console.log('Auth: Token validation successful, user remains logged in');
            }
          } catch (validationError: unknown) {
            const validationMessage = validationError instanceof Error
              ? validationError.message
              : String(validationError);

            console.log('Auth: Token validation error, keeping user logged in:', validationError);
            console.log('Auth: Error details:', validationMessage);
            // Don't log out on validation errors - could be network issues
          }
        } else {
          console.log('Auth: No stored user or token found');
          setUser(null);
          setIsTokenValid(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsTokenValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthPage) {
      setIsLoading(false);
    }

    initAuth();
  }, [pathname]); 

  const login = async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      
      setUser(response.user);
      setIsTokenValid(true);
      return response; 
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      
      setUser(response.user);
      setIsTokenValid(true);
      return response; 
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsTokenValid(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await apiClient.getCurrentUserWithValidation();
      
      if (profile) {
        setUser(profile);
        setIsTokenValid(true);
      } else {
        setUser(null);
        setIsTokenValid(false);
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
      throw error;
    }
  };

  const startTransaction = () => {
    console.log('🔄 Transaction started - preventing auto-logout');
    setHasActiveTransaction(true);
    localStorage.setItem('hasActiveTransaction', 'true');
  };

  const endTransaction = async () => {
    console.log('✅ Transaction ended - resuming normal auth checks');
    setHasActiveTransaction(false);
    localStorage.removeItem('hasActiveTransaction');
    
    // Check for any pending auth errors that occurred during transaction
    const pendingError = apiClient.getPendingAuthError();
    if (pendingError) {
      console.log('🔐 Pending auth error found after transaction - handling now');
      apiClient.clearPendingAuthError();
      
      // Handle the pending auth error
      if (pendingError.status === 401 || pendingError.status === 403) {
        console.log('🔐 Processing pending auth error - logging out');
        await apiClient.logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isTokenValid,
    hasActiveTransaction,
    login,
    register,
    logout,
    refreshProfile,
    startTransaction,
    endTransaction
  };

  // Session monitoring effect
  useEffect(() => {
    if (!user) return;
    
    const checkAuth = async () => {
      try {
        // Skip token validation if there's an active transaction
        if (hasActiveTransaction) {
          console.log('🔄 Active transaction detected - skipping token validation');
          return;
        }
        
        await apiClient.checkTokenExpiryAndLogout();
      } catch (error) {
        console.log('Session monitoring error:', error);
        // Don't log out on monitoring errors
      }
    };

    // Check authentication every 30 seconds
    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, [user, hasActiveTransaction]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
