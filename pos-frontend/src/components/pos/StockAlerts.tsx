'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, TrendingDown } from 'lucide-react';
import { posApiClient, type LowStockAlert } from '@/lib/pos-api';
import { formatCurrency, formatStockQuantity } from '@/lib/utils';

interface StockAlertsProps {
  storeId: string;
}

export function StockAlerts({ storeId }: StockAlertsProps) {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check authentication before loading alerts
    if (!posApiClient.isAuthenticated()) {
      console.log('⚠️ User not authenticated, skipping stock alerts');
      setLoading(false);
      return;
    }
    loadAlerts();
  }, [storeId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await posApiClient.getLowStockAlerts(5, storeId);
      setAlerts(response.products);
    } catch (error: any) {
      // Suppress 403 errors for restricted features (backend still logs them)
      if (error.response?.status === 403) {
        console.log('⚠️ Feature not available in current plan (403)');
        setAlerts([]);
        return;
      }
      console.error('❌ Failed to load stock alerts:', error);
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.error('❌ Authentication failed, clearing alerts');
        setAlerts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Alert Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h3 className="font-medium text-gray-900">
            Low Stock Alerts ({alerts.length})
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Alert Items */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {/* Product Image */}
                  {alert.image_url ? (
                    <img
                      src={alert.image_url}
                      alt={alert.name}
                      className="w-10 h-10 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/images/product-placeholder.png';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-gray-400" />
                    </div>
                  )}

                  {/* Product Info */}
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {alert.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {alert.category_name} • {alert.brand_name}
                    </div>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">
                    {formatStockQuantity(alert.stock_quantity)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(alert.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <button
              onClick={loadAlerts}
              className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
            >
              Refresh Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
