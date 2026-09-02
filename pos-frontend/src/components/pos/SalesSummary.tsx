'use client';

import { useState, useEffect } from 'react';
import { posApiClient } from '@/lib/pos-api';

interface SalesSummaryData {
  store_id: string;
  date_range: string;
  start_date: string;
  end_date: string;
  total_sales: number;
  transaction_count: number;
  average_transaction_value: number;
  payment_method_breakdown: Array<{
    payment_method: string;
    count: number;
    total: number;
  }>;
}

interface SalesSummaryProps {
  refreshKey?: number;
}

export default function SalesSummary({ refreshKey }: SalesSummaryProps) {
  const [summary, setSummary] = useState<SalesSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    fetchSalesSummary();
  }, [dateRange, refreshKey]);

  const fetchSalesSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await posApiClient.getSalesSummary(dateRange);
      setSummary(data);
    } catch (err: any) {
      // Suppress 403 errors for restricted features (backend still logs them)
      if (err.response?.status === 403) {
        console.log('⚠️ Feature not available in current plan (403)');
        setError('Feature not available in current plan');
        return;
      }
      console.error('Failed to fetch sales summary:', err);
      setError('Failed to load sales summary');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      {/* Header with date range selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Sales Summary</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {formatDate(summary.start_date)} - {formatDate(summary.end_date)}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
              dateRange === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
              dateRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
              dateRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Total Sales */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Total Sales</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-900">
            {formatCurrency(summary.total_sales)}
          </p>
        </div>

        {/* Transaction Count */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-xs sm:text-sm font-medium text-green-700 mb-1">Transactions</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-900">
            {summary.transaction_count}
          </p>
        </div>

        {/* Average Transaction Value */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1">Avg. Transaction</p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-900">
            {formatCurrency(summary.average_transaction_value)}
          </p>
        </div>

        {/* Store ID */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Store</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">
            {summary.store_id}
          </p>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {summary.payment_method_breakdown && summary.payment_method_breakdown.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Method Breakdown</h3>
          <div className="space-y-2">
            {summary.payment_method_breakdown.map((item) => (
              <div
                key={item.payment_method}
                className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.payment_method}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({item.count} transactions)
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
