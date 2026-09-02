'use client';

import React, { useState, memo, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  Clock,
  Star,
  Truck,
  Check
} from 'lucide-react';
import { Product, StockStatus } from '@/types/product';
import { useCart } from '@/contexts/CartContext';

interface HardwareCardProps {
  product: Product;
  onQuickAdd?: (productId: string, quantity: number) => void;
  className?: string;
  priority?: boolean;
}

export const HardwareCard = memo<HardwareCardProps>(({ 
  product, 
  className = '',
  priority = false
}) => {
  const { addToCart, isInCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  const handleQuickAdd = useCallback(async () => {
    if (isInCart(product.id)) {
      window.location.href = '/cart';
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product, 1);
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  }, [product, isInCart, addToCart]);

  const getStockStatusInfo = (status: StockStatus) => {
    switch (status) {
      case 'in_stock':
        return {
          label: 'In Stock',
          color: 'bg-green-100 text-green-800',
          icon: <Check className="h-3 w-3" />,
          message: 'Ready to ship from Tema warehouse'
        };
      case 'low_stock':
        return {
          label: 'Low Stock',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <AlertCircle className="h-3 w-3" />,
          message: 'Only a few items left'
        };
      case 'out_of_stock':
        return {
          label: 'Out of Stock',
          color: 'bg-red-100 text-red-800',
          icon: <Package className="h-3 w-3" />,
          message: 'Currently unavailable'
        };
      case 'pre_order':
        return {
          label: 'Pre-Order',
          color: 'bg-blue-100 text-blue-800',
          icon: <Clock className="h-3 w-3" />,
          message: 'Ships in 5-7 business days'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="h-3 w-3" />,
          message: 'Status unknown'
        };
    }
  };

  const stockInfo = getStockStatusInfo(product.stockStatus);
  const isInStock = product.stockStatus === 'in_stock' || product.stockStatus === 'low_stock';

  const getSpecBadgeVariant = (type: string) => {
    switch (type) {
      case 'voltage':
        return 'default';
      case 'material':
        return 'secondary';
      case 'power':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className={`group overflow-hidden rounded-[1.75rem] border border-pink-100 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,23,42,0.08)] ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#fff8f6]">
        <Link href={`/products/${product.slug}`} prefetch={true}>
          <OptimizedImage
            src={product.image_url || product.image || ''}
            alt={product.name}
            width={product.image_width || 400}
            height={product.image_height || 300}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        </Link>

        <div className="absolute left-3 top-3">
          <Badge className={`${stockInfo.color} flex items-center gap-1 text-[11px] font-semibold`}>
            {stockInfo.icon}
            {stockInfo.label}
          </Badge>
        </div>

        <div className="absolute right-3 top-3">
          <Badge variant="outline" className="border-white/80 bg-white/90 text-[11px] font-medium text-brand-charcoal backdrop-blur-sm">
            <Truck className="mr-1 h-3 w-3 text-brand-pink" />
            {product.warehouse?.location ? product.warehouse.location.split(',')[0] : 'Tema'}
          </Badge>
        </div>

        {isInStock && (
          <div className="absolute bottom-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Button
              size="sm"
              onClick={handleQuickAdd}
              disabled={isAdding || product.stockStatus === 'out_of_stock'}
              className="h-10 w-10 rounded-full bg-brand-pink text-white shadow-[0_12px_24px_rgba(241,39,123,0.25)] hover:bg-brand-pink/90"
            >
              {isAdding ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isInCart(product.id) ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-pink">
            {typeof product.brand === 'string' ? product.brand : product.brand.name}
          </span>
          <span className="text-[11px] text-slate-500">
            {typeof product.category === 'string' ? product.category : product.category.name}
          </span>
        </div>

        <Link href={`/products/${product.slug}`}>
          <h3 className="mb-2 line-clamp-2 text-lg font-bold text-brand-charcoal transition-colors hover:text-brand-pink">
            {product.name}
          </h3>
        </Link>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {product.technicalSpecs && product.technicalSpecs.slice(0, 3).map((spec, index) => (
            <Badge 
              key={index} 
              variant={getSpecBadgeVariant(spec.type)}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600"
            >
              {spec.value}
            </Badge>
          ))}
        </div>

        <div className="mb-3 flex items-center">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating || 0)
                    ? 'fill-current text-brand-yellow'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-sm text-slate-600">
            {product.rating || 0} ({product.reviewCount || 0})
          </span>
        </div>

        <div className="mb-2 flex items-end justify-between gap-2">
          <div className="text-2xl font-black tracking-[-0.05em] text-brand-charcoal">
            GHS {product.price.toLocaleString()}
          </div>
        </div>

        <p className="mb-3 text-xs text-slate-600">
          {stockInfo.message}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex w-full gap-2">
          <Link href={`/products/${product.slug}`} className="flex-1">
            <Button variant="outline" className="w-full rounded-full border-slate-200 bg-white text-sm font-semibold text-brand-charcoal hover:border-brand-pink hover:text-brand-pink">
              View Details
            </Button>
          </Link>

          {isInStock ? (
            <Button 
              onClick={handleQuickAdd}
              disabled={isAdding || product.stockStatus === 'out_of_stock'}
              className="flex-1 rounded-full bg-brand-pink text-sm font-semibold text-white shadow-[0_10px_18px_rgba(241,39,123,0.2)] hover:bg-brand-pink/90"
              variant={isInCart(product.id) ? "secondary" : "default"}
            >
              {isAdding ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Adding...
                </>
              ) : isInCart(product.id) ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  In Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </>
              )}
            </Button>
          ) : (
            <Button variant="outline" disabled className="flex-1 rounded-full border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">
              <Package className="mr-2 h-4 w-4" />
              Out of Stock
            </Button>
          )}
        </div>
      </CardFooter>

      {showAdded && (
        <div className="absolute right-2 top-2 z-10 rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-white shadow-lg">
          Added to cart!
        </div>
      )}
    </Card>
  );
});

HardwareCard.displayName = 'HardwareCard';

export default HardwareCard;
