'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginData } from '@/lib/auth';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginFormOptimized: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const redirectTo = searchParams.get('redirect');

  const getRedirectUrl = (userRole?: string) => {
    
    if (redirectTo && redirectTo !== '/' && !redirectTo.includes('/login') && !redirectTo.includes('/register')) {
      return redirectTo;
    }

    if (userRole === 'CUSTOMER' || userRole === 'PRO_CONTRACTOR') {
      
      if (typeof window !== 'undefined') {
        const previousPage = sessionStorage.getItem('previousPage');
        if (previousPage && previousPage !== '/login' && previousPage !== '/register') {
          return previousPage;
        }
      }

      return '/';
    }

    return '/dashboard';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    setError(null);
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.username.trim()) {
      return 'Username or email is required';
    }
    if (!formData.password.trim()) {
      return 'Password is required';
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      
      console.log('FORM DEBUG: formData.username:', formData.username);
      console.log('FORM DEBUG: formData.password:', formData.password ? '***' : 'undefined');
      console.log('FORM DEBUG: Form data object:', {
        username: formData.username,
        password: formData.password
      });

      const response = await login({
        username: formData.username,
        password: formData.password
      });
      
      onSuccess?.();

      const userRole = response.user.role;
      const redirectUrl = getRedirectUrl(userRole);
      router.push(redirectUrl);
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData?.error) {
          setError(errorData.error);
        } else if (errorData?.non_field_errors) {
          setError(errorData.non_field_errors[0]);
        } else if (errorData?.username) {
          setError(errorData.username[0]);
        } else if (errorData?.password) {
          setError(errorData.password[0]);
        } else {
          setError('Invalid login data. Please check your credentials.');
        }
      } else if (err.response?.status === 401) {
        setError('Invalid username or password. Please try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
            
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username or Email
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your username or email"
            disabled={isLoading}
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
            disabled={isLoading}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Login Error</h3>
                <div className="mt-1 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default LoginFormOptimized;
