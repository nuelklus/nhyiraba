'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { posApiClient, type Product } from '@/lib/pos-api';
import { formatCurrency } from '@/lib/utils';

interface ExpiryAlertsProps {
  storeId: string;
}

export function ExpiryAlerts({ storeId }: ExpiryAlertsProps) {
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check authentication before loading alerts
    if (!posApiClient.isAuthenticated()) {
      console.log('⚠️ User not authenticated, skipping expiry alerts');
      setLoading(false);
      return;
    }
    loadAlerts();
  }, [storeId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await posApiClient.getExpiryAlerts(3, storeId);
      setAlerts(response.products);
    } catch (error: any) {
      // Suppress 403 errors for restricted features (backend still logs them)
      if (error.response?.status === 403) {
        console.log('⚠️ Feature not available in current plan (403)');
        setAlerts([]);
        return;
      }
      console.error('❌ Failed to load expiry alerts:', error);
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.error('❌ Authentication failed, clearing alerts');
        setAlerts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'critical':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getExpiryIcon = (status: string) => {
    switch (status) {
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'critical':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
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
          <Clock className="w-5 h-5 text-orange-600" />
          <h3 className="font-medium text-gray-900">
            Expiry Alerts ({alerts.length})
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
            {alerts.map((alert) => {
              const expiryStatus = alert.expiry_status || { status: 'warning', message: 'N/A' };
              const statusColor = getExpiryStatusColor(expiryStatus.status);
              
              return (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${statusColor}`}
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
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                    )}

                    {/* Product Info */}
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {alert.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {alert.category?.name} • {alert.brand?.name}
                      </div>
                      <div className="text-xs font-medium mt-1">
                        {expiryStatus.message}
                        {expiryStatus.days_remaining !== undefined && (
                          <span className="ml-1">
                            ({expiryStatus.days_remaining} days remaining)
                          </span>
                        )}
                        {expiryStatus.days_overdue !== undefined && (
                          <span className="ml-1">
                            ({expiryStatus.days_overdue} days overdue)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price and Expiry Date */}
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(alert.price)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {alert.expiry_date ? new Date(alert.expiry_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={loadAlerts}
              className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
            >
              Refresh Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
