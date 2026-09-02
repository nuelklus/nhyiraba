'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { NEXT_PUBLIC_POS_API_URL } from '@/lib/env';

// Accounts API is at /api/accounts/, not /api/pos/accounts/
const ACCOUNTS_API_URL = NEXT_PUBLIC_POS_API_URL.replace(/\/pos\/?$/, '');

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  phone_number: string;
  role: string;
  staff_role: string;
  organization_id: number | null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    phone_number: '',
    role: 'STAFF',
    staff_role: 'CASHIER',
    organization_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is an admin
  useEffect(() => {
    const token = localStorage.getItem('pos_access_token');
    const userInfo = localStorage.getItem('pos_user_info');
    if (!token || !userInfo) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userInfo);
      if (user.staff_role !== 'ADMIN') {
        // Not an admin - redirect to POS page
        router.push('/pos');
        return;
      }
      setIsAdmin(true);
    } catch {
      router.push('/login');
      return;
    } finally {
      setAuthChecking(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('pos_access_token');
      const response = await axios.post(
        `${ACCOUNTS_API_URL}/accounts/register/`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess(true);
      setTimeout(() => {
        router.push('/pos');
      }, 2000);
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => router.push('/login'), 2000);
      } else if (error.response?.status === 403) {
        setError('Only admin users can register new staff members.');
      } else {
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          (error.response?.data && typeof error.response.data === 'object'
            ? Object.values(error.response.data).flat().join(', ')
            : 'Registration failed. Please try again.');
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Show loading while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If not admin, show access denied (will redirect via useEffect)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admin users can register new staff members.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">Registration Successful!</h2>
            <p className="text-green-700">The staff account has been created. Redirecting to POS...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">
            POS Staff Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create a new staff account for the Point of Sale system
          </p>
          <p className="mt-1 text-center text-xs text-blue-600 font-medium">
            Admin access required
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm text-gray-900"
                placeholder="Enter username"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm text-gray-900"
                placeholder="Enter email address"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                required
                value={formData.phone_number}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm text-gray-900"
                placeholder="e.g., 0202729861 or +233202729861"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ghana phone number format (e.g., 0202729861)
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm text-gray-900"
                placeholder="Enter password (min 8 characters)"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                required
                minLength={8}
                value={formData.password_confirm}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm text-gray-900"
                placeholder="Confirm password"
              />
            </div>

            {/* Role - Fixed to STAFF for POS registration */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                User Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 text-base sm:text-sm"
              >
                <option value="STAFF">Staff</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                POS registration is for staff members only
              </p>
            </div>

            {/* Staff Role */}
            <div>
              <label htmlFor="staff_role" className="block text-sm font-medium text-gray-700">
                Staff Role
              </label>
              <select
                id="staff_role"
                name="staff_role"
                value={formData.staff_role}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm text-gray-900"
              >
                <option value="CASHIER">Cashier</option>
                <option value="MANAGER">Manager</option>
                <option value="INVENTORY_STAFF">Inventory Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the appropriate staff role for this user
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent text-base sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Staff Account'}
            </button>
          </div>
        </form>

        {/* Back to POS */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            <a href="/pos" className="font-medium text-blue-600 hover:text-blue-500">
              ← Back to POS
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}