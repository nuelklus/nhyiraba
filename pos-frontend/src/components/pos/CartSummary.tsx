'use client';

import { useState, useEffect } from 'react';
import { shoppingCart, type CartItem } from '@/lib/cart';
import { PricingCalculator } from '@/lib/pricing';
import { Receipt, CreditCard, Smartphone, DollarSign } from 'lucide-react';

interface CartSummaryProps {
  onCheckout?: (totals: { subtotal: number; tax: number; total: number; itemCount: number }) => void;
  className?: string;
}

export function CartSummary({ onCheckout, className = '' }: CartSummaryProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');

  // Load cart items on mount
  useEffect(() => {
    setItems(shoppingCart.getItems());
  }, []);

  const updateCart = () => {
    setItems(shoppingCart.getItems());
  };

  const totals = shoppingCart.getTotals();

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    onCheckout?.(totals);
  };

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: DollarSign, description: 'Pay with cash' },
    { id: 'card', name: 'Card', icon: CreditCard, description: 'Credit/Debit card' },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, description: 'Mobile money' }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Order Summary</h3>
      </div>

      {/* Cart Items */}
      <div className="p-4 max-h-64 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No items in cart</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between items-start py-2 border-b border-gray-100">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                  <p className="text-xs text-gray-500">{item.product.sku}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-600">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-sm text-gray-900">
                      {PricingCalculator.formatCurrency(parseFloat(item.product.price))}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900">
                    {PricingCalculator.formatCurrency(PricingCalculator.calculateItemTotal(item))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span>{PricingCalculator.formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Tax ({PricingCalculator.getTaxPercentage()}):
            </span>
            <span>{PricingCalculator.formatCurrency(totals.tax)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total:</span>
            <span className="text-green-600">{PricingCalculator.formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-xs font-medium">{method.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Checkout Button */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleCheckout}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Receipt className="w-5 h-5" />
            <span>Proceed to Checkout</span>
            <span className="ml-auto font-bold">
              {PricingCalculator.formatCurrency(totals.total)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
