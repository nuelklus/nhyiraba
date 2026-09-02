'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';

interface CartDropdownProps {
  children: React.ReactNode;
  className?: string;
}

export const CartDropdown: React.FC<CartDropdownProps> = ({ 
  children, 
  className = '' 
}) => {
  const { items, total, itemCount, removeFromCart, updateQuantity } = useCart();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(productId);
    
    setTimeout(() => {
      updateQuantity(productId, newQuantity);
      setIsUpdating(null);
    }, 150);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  return (
    <div className={className}>
      <Dialog>
        <DialogTrigger asChild>
          <div className="transition-transform hover:scale-105 duration-200">
            {children}
          </div>
        </DialogTrigger>
        
        <DialogContent className="w-96 max-w-[90vw] p-0">
          {}
          <div className="bg-gradient-to-r from-[#2D2E2E] to-[#1a1a1a] px-4 py-3 rounded-t-lg">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-white" />
              <span className="font-semibold text-white">Shopping Cart</span>
              {itemCount > 0 && (
                <Badge className="h-5 px-2 bg-white/20 text-white border-white/30">
                  {itemCount}
                </Badge>
              )}
            </div>
          </div>

          {}
          <div className="max-h-96 overflow-y-auto">
            {itemCount === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-[#FDB813]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-[#FDB813]" />
                </div>
                <p className="text-[#2D2E2E] font-medium mb-2">Your cart is empty</p>
                <p className="text-gray-500 text-sm mb-4">Add some baby essentials to get started</p>
                <Link href="/products" prefetch={true}>
                  <Button className="bg-[#FDB813] hover:bg-[#E5A763] text-[#2D2E2E] px-6">
                    Browse Products
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {}
                <div className="p-4 space-y-4">
                  {items.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200/50 hover:border-[#FDB813]/30 transition-colors">
                      {}
                      <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized={item.image.includes('via.placeholder.com')}
                        />
                      </div>

                      {}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.slug}`} className="block">
                          <h4 className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors truncate">
                            {item.name}
                          </h4>
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.brand}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating === item.id}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">
                              {isUpdating === item.id ? '...' : item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={isUpdating === item.id}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {}
                  {itemCount > 5 && (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">
                        And {itemCount - 5} more items
                      </p>
                    </div>
                  )}
                </div>

                {}
                <div className="border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100 p-4 space-y-3 rounded-b-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#2D2E2E]">Total:</span>
                    <span className="font-bold text-lg text-[#FDB813]">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link href="/cart" prefetch={true} className="flex-1">
                      <Button variant="outline" className="w-full border-[#FDB813]/50 text-[#2D2E2E] hover:bg-[#FDB813]/10">
                        View Cart
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/checkout" prefetch={true} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-[#FDB813] to-[#E5A763] hover:from-[#E5A763] hover:to-[#D99F1A] text-white shadow-lg">
                        Checkout
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
