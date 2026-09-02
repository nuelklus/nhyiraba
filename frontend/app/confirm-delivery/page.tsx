'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/admin-api';
import { CheckCircle, AlertCircle, Package } from 'lucide-react';

export default function ConfirmDelivery() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [releaseCode, setReleaseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim() || !releaseCode.trim()) {
      setError('Please enter both order ID and release code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      const order = await adminApi.getOrder(orderId.trim());

      if (order.release_code === releaseCode.trim()) {
        
        const updatedOrder = await adminApi.updateOrderStatus(orderId.trim(), 'delivered');
        
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        setError('Invalid release code. Please check and try again.');
      }
    } catch (err: any) {
      console.error('Failed to confirm delivery:', err);
      if (err.response?.status === 404) {
        setError('Order not found. Please check the order ID.');
      } else {
        setError('Failed to confirm delivery. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <Package className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Confirm Delivery
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter order ID and release code to confirm delivery
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-2xl font-semibold text-green-600 mb-2">
                Delivery Confirmed!
              </h3>
              <p className="text-gray-600">
                Order {orderId} has been marked as delivered.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="order_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Order ID *
                </label>
                <input
                  id="order_id"
                  name="order_id"
                  type="text"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter order ID (e.g., ORD-1234567890-1234)"
                />
              </div>

              <div>
                <label htmlFor="release_code" className="block text-sm font-medium text-gray-700 mb-2">
                  Release Code *
                </label>
                <input
                  id="release_code"
                  name="release_code"
                  type="text"
                  required
                  value={releaseCode}
                  onChange={(e) => setReleaseCode(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter 6-digit release code"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the 6-digit code generated when funds were verified
                </p>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-t-2 border-blue-600 mr-2"></div>
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Delivery
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
