'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { posApiClient, type POSAuth } from '@/lib/pos-api';
import { generateDeviceId } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<POSAuth>({
    username: '',
    password: '',
    store_id: 'main',
    device_id: generateDeviceId(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await posApiClient.authenticate(formData);
      router.push('/pos');
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      // Extract error message from API response
      const errorMessage = error.response?.data?.error || 'Invalid credentials. Please try again.';
      const subscriptionStatus = error.response?.data?.subscription_status;
      const expiryDate = error.response?.data?.expiry_date;
      
      if (subscriptionStatus === 'expired') {
        setError(`Subscription expired on ${expiryDate}. Please renew your subscription to continue.`);
      } else {
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

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">
            NEXLOGS POS Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the Point of Sale system
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
                placeholder="Enter your username"
              />
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
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm text-gray-900"
                placeholder="Enter your password"
              />
            </div>

            {/* Store ID */}
            <div>
              <label htmlFor="store_id" className="block text-sm font-medium text-gray-700">
                Store Location
              </label>
              <select
                id="store_id"
                name="store_id"
                value={formData.store_id}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm text-gray-900"
              >
                <option value="main">Main Store</option>
                <option value="warehouse">Warehouse</option>
                <option value="branch1">Branch 1</option>
                <option value="branch2">Branch 2</option>
              </select>
            </div>

            {/* Device ID */}
            <div>
              <label htmlFor="device_id" className="block text-sm font-medium text-gray-700">
                Terminal/Device ID
              </label>
              <input
                id="device_id"
                name="device_id"
                type="text"
                value={formData.device_id}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm text-gray-900"
                placeholder="Terminal identifier"
              />
              <p className="mt-1 text-xs text-gray-500">
                Unique identifier for this POS terminal
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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <details className="sm:block">
            <summary className="cursor-pointer sm:hidden text-sm font-medium text-blue-900 mb-2">
              Show Demo Credentials
            </summary>
            <div className="text-xs text-blue-700 space-y-1">
              <h3 className="hidden sm:block text-sm font-medium text-blue-900 mb-2">Demo Credentials</h3>
              <p><strong>Username:</strong> admin</p>
              <p><strong>Password:</strong> admin123</p>
              <p><strong>Store:</strong> Main Store</p>
              <p className="mt-2 text-blue-600">Use these credentials to test the POS system</p>
            </div>
          </details>
        </div>

      </div>
    </div>
  );
}
