'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, type CartItem, shoppingCart } from '@/lib/cart';
import { PricingCalculator } from '@/lib/pricing';
import { formatStockQuantity } from '@/lib/utils';
import { Plus, Minus, X, ShoppingCart as CartIcon } from 'lucide-react';

interface ShoppingCartProps {
  onCartUpdate?: (items: CartItem[]) => void;
  className?: string;
}

export function ShoppingCartComponent({ onCartUpdate, className = '' }: ShoppingCartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart items on mount
  useEffect(() => {
    setItems(shoppingCart.getItems());
  }, []);

  // Update items when cart opens
  useEffect(() => {
    if (isOpen) {
      setItems(shoppingCart.getItems());
    }
  }, [isOpen]);

  const updateCart = () => {
    const currentItems = shoppingCart.getItems();
    setItems(currentItems);
    onCartUpdate?.(currentItems);
  };

  const handleAddQuantity = (productId: string) => {
    shoppingCart.updateQuantity(productId, shoppingCart.getItem(productId)?.quantity! + 1);
    updateCart();
  };

  const handleRemoveQuantity = (productId: string) => {
    const currentItem = shoppingCart.getItem(productId);
    if (currentItem && currentItem.quantity > 1) {
      shoppingCart.updateQuantity(productId, currentItem.quantity - 1);
    } else {
      shoppingCart.removeItem(productId);
    }
    updateCart();
  };

  const handleRemoveItem = (productId: string) => {
    shoppingCart.removeItem(productId);
    updateCart();
  };

  const handleClearCart = () => {
    shoppingCart.clear();
    updateCart();
    setIsOpen(false);
  };

  const totals = shoppingCart.getTotals();
  const itemCount = shoppingCart.getItemCount();

  return (
    <div className={`relative ${className}`}>
      {/* Cart Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <CartIcon className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* Cart Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Shopping Cart</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CartIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    {/* Product Image */}
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <CartIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* Product Details */}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                      <p className="text-xs text-gray-500">{item.product.sku}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Stock: {formatStockQuantity(item.product.stock_quantity)}
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          {PricingCalculator.formatCurrency(parseFloat(item.product.price))}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRemoveQuantity(item.product.id)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleAddQuantity(item.product.id)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{PricingCalculator.formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({PricingCalculator.getTaxPercentage()}):</span>
                  <span>{PricingCalculator.formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{PricingCalculator.formatCurrency(totals.total)}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleClearCart}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Clear Cart
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
