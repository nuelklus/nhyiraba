'use client';

import { useState } from 'react';
import { Package, Info, Activity, Settings } from 'lucide-react';
import { type Product } from '@/lib/pos-api';
import { formatCurrency, formatStockQuantity, formatTimestamp, getStockStatusColor, getStockStatusText } from '@/lib/utils';

interface CartProps {
  selectedProduct: Product | null;
  onStockUpdate: (productId: string, newQuantity: number, changeAmount: number) => void;
  canUpdateStock?: boolean;
}

export function Cart({ selectedProduct, onStockUpdate, canUpdateStock = true }: CartProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'settings'>('details');

  if (!selectedProduct) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Product Selected</h3>
          <p className="text-sm">Select a product to view details</p>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatusText(selectedProduct.stock_quantity);
  const stockStatusColor = getStockStatusColor(selectedProduct.stock_quantity);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Info className="w-4 h-4 inline mr-2" />
          Details
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          History
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'details' && (
          <div className="p-4">
            {/* Product Image */}
            <div className="mb-4">
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/images/product-placeholder.png';
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {selectedProduct.name}
                </h3>
                <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                {selectedProduct.barcode && (
                  <p className="text-sm text-gray-500 font-mono">Barcode: {selectedProduct.barcode}</p>
                )}
              </div>

              {/* Price */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Price</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedProduct.price)}
                </div>
              </div>

              {/* Stock Status */}
              <div className={`p-3 rounded-lg ${stockStatusColor}`}>
                <div className="text-sm font-medium mb-1">Stock Status</div>
                <div className="text-lg font-bold">{stockStatus}</div>
                <div className="text-sm mt-1">
                  {formatStockQuantity(selectedProduct.stock_quantity)}
                </div>
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Category</div>
                  <div className="font-medium text-gray-900">{selectedProduct.category.name}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Brand</div>
                  <div className="font-medium text-gray-900">{selectedProduct.brand.name}</div>
                </div>
              </div>

              {/* Sync Info */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">Sync Information</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Store ID:</span>
                    <span className="font-medium">{selectedProduct.pos_store_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Sync Version:</span>
                    <span className="font-medium">{selectedProduct.stock_sync_version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Update Source:</span>
                    <span className="font-medium capitalize">{selectedProduct.stock_update_source}</span>
                  </div>
                  {selectedProduct.stock_updated_by && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Updated By:</span>
                      <span className="font-medium">{selectedProduct.stock_updated_by}</span>
                    </div>
                  )}
                  {selectedProduct.last_pos_sync && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Last POS Sync:</span>
                      <span className="font-medium">{formatTimestamp(selectedProduct.last_pos_sync)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedProduct.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4">
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Stock History</h3>
              <p className="text-sm">Stock update history will be available here</p>
              <p className="text-xs text-gray-400 mt-2">Integration with backend sync logs</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4">
            <div className="text-center text-gray-500 py-8">
              <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Product Settings</h3>
              <p className="text-sm">Product settings will be available here</p>
              <p className="text-xs text-gray-400 mt-2">Low stock thresholds, alerts, etc.</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {canUpdateStock && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => onStockUpdate(selectedProduct.id, selectedProduct.stock_quantity, 0)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Update Stock
          </button>
        </div>
      )}
    </div>
  );
}
