'use client';

import { type SubscriptionInfo as SubscriptionInfoType } from '@/lib/pos-api';

interface SubscriptionInfoProps {
  subscription: SubscriptionInfoType;
  onClose: () => void;
}

export function SubscriptionInfo({ subscription, onClose }: SubscriptionInfoProps) {
  const featureList = [
    { key: 'barcode_scanning', label: 'Barcode Scanning' },
    { key: 'stock_adjustments', label: 'Stock Adjustments' },
    { key: 'low_stock_alerts', label: 'Low Stock Alerts' },
    { key: 'profit_loss_reports', label: 'Profit/Loss Reports' },
    { key: 'multi_branch', label: 'Multi-Branch' },
    { key: 'supplier_management', label: 'Supplier Management' },
    { key: 'audit_logs', label: 'Audit Logs' },
    { key: 'api_access', label: 'API Access' },
    { key: 'role_based_access', label: 'Role-Based Access' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Subscription Information</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p><strong>Plan:</strong> {subscription.plan}</p>
            <p><strong>Pricing Type:</strong> {subscription.pricing_type}</p>
            <p><strong>Status:</strong> {subscription.subscription_status}</p>
            <p><strong>Expiry Date:</strong> {subscription.expiry_date}</p>
            <p><strong>Active:</strong> {subscription.is_active ? 'Yes' : 'No'}</p>
            <p><strong>Users:</strong> {subscription.current_users} / {subscription.max_users}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Unlock More Features by Upgrading Your Plan</h3>
            <div className="grid grid-cols-2 gap-2">
              {featureList.map(feature => (
                <div 
                  key={feature.key}
                  className={`p-2 rounded ${
                    subscription.plan_features[feature.key as keyof typeof subscription.plan_features]
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {feature.label}: {
                    subscription.plan_features[feature.key as keyof typeof subscription.plan_features]
                      ? '✓ Available'
                      : '✗ Not Available'
                  }
                </div>
              ))}
            </div>
          </div>
          
          {subscription.is_expiry_warning && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-yellow-800">⚠️ Your subscription expires soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
