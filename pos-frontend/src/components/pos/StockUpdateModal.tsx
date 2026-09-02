'use client';

import { useState } from 'react';
import { X, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { type Product } from '@/lib/pos-api';
import { posApiClient } from '@/lib/pos-api';
import { formatCurrency, formatStockQuantity, getChangeAmountColor, getChangeAmountText } from '@/lib/utils';

interface StockUpdateModalProps {
  product: Product;
  onUpdate: (productId: string, newQuantity: number, changeAmount: number) => void;
  onClose: () => void;
}

export function StockUpdateModal({ product, onUpdate, onClose }: StockUpdateModalProps) {
  const [newQuantity, setNewQuantity] = useState(product.stock_quantity);
  const [adjustment, setAdjustment] = useState(0);
  const [updateReason, setUpdateReason] = useState('');
  const [expiryDate, setExpiryDate] = useState(product.expiry_date || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeAmount = newQuantity - product.stock_quantity;
  const hasExpiryDateChanged = expiryDate !== (product.expiry_date || '');
  const hasChanges = changeAmount !== 0 || hasExpiryDateChanged;

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(0, newQuantity + delta);
    setNewQuantity(newQty);
    setAdjustment(newQty - product.stock_quantity);
  };

  const handleDirectInput = (value: string) => {
    const qty = parseInt(value) || 0;
    const validQty = Math.max(0, qty);
    setNewQuantity(validQty);
    setAdjustment(validQty - product.stock_quantity);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Update stock if changed
      if (changeAmount !== 0) {
        await onUpdate(product.id, newQuantity, changeAmount);
      }
      
      // Update expiry date if changed
      if (expiryDate !== (product.expiry_date || '')) {
        await posApiClient.updateProduct(product.id, { expiry_date: expiryDate || null });
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Failed to update:', error);
      setIsSubmitting(false);
    }
  };

  const handleQuickAdjust = (amount: number) => {
    const newQty = Math.max(0, product.stock_quantity + amount);
    setNewQuantity(newQty);
    setAdjustment(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Update Stock</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Product Info */}
          <div className="p-6 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/images/product-placeholder.png';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(product.price)}</p>
            </div>
          </div>
        </div>

        {/* Stock Update Form */}
        <div className="p-6">
          {/* Current Stock */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Stock</span>
              <span className="text-lg font-bold text-gray-900">
                {formatStockQuantity(product.stock_quantity)}
              </span>
            </div>
          </div>

          {/* Quantity Adjustment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Quantity
            </label>
            
            {/* Quick Adjust Buttons */}
            <div className="flex space-x-2 mb-3">
              <button
                onClick={() => handleQuickAdjust(-10)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                -10
              </button>
              <button
                onClick={() => handleQuickAdjust(-5)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                -5
              </button>
              <button
                onClick={() => handleQuickAdjust(-1)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                -1
              </button>
              <button
                onClick={() => handleQuickAdjust(1)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                +1
              </button>
              <button
                onClick={() => handleQuickAdjust(5)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                +5
              </button>
              <button
                onClick={() => handleQuickAdjust(10)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                +10
              </button>
            </div>

            {/* Quantity Input */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <input
                type="number"
                value={newQuantity}
                onChange={(e) => handleDirectInput(e.target.value)}
                className="flex-1 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              
              <button
                onClick={() => handleQuantityChange(1)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Change Summary */}
          {changeAmount !== 0 && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Change Amount</span>
                <div className="flex items-center space-x-2">
                  {changeAmount > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`font-bold ${getChangeAmountColor(changeAmount)}`}>
                    {getChangeAmountText(changeAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Update Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Reason (Optional)
            </label>
            <textarea
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              placeholder="e.g., Stock received, Customer purchase, Inventory adjustment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Expiry Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if product has no expiry date</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasChanges || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
