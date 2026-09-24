'use client';

import { useState, memo, useCallback } from 'react';
import { Package, Search, AlertTriangle } from 'lucide-react';
import { type Product, type ProductUnit } from '@/lib/pos-api';
import { formatCurrency, formatQuantity, formatStockQuantity, getStockStatusColor, getStockStatusText } from '@/lib/utils';
import { StockUpdateModal } from './StockUpdateModal';

interface ProductGridProps {
  products: Product[];
  selectedProduct: Product | null;
  onProductSelect: (product: Product) => void;
  onStockUpdate: (productId: string, newQuantity: number, changeAmount: number) => void;
  onAddToCart?: (product: Product, unit?: ProductUnit) => void;
  canUpdateStock?: boolean;
}

export function ProductGrid({ products, selectedProduct, onProductSelect, onStockUpdate, onAddToCart, canUpdateStock = true }: ProductGridProps) {
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdateProduct, setStockUpdateProduct] = useState<Product | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, number>>({});

  const handleStockUpdateClick = useCallback((product: Product) => {
    setStockUpdateProduct(product);
    setShowStockModal(true);
  }, []);

  const handleStockUpdate = useCallback((productId: string, newQuantity: number, changeAmount: number) => {
    onStockUpdate(productId, newQuantity, changeAmount);
    setShowStockModal(false);
    setStockUpdateProduct(null);
  }, [onStockUpdate]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Search className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No products found</h3>
        <p className="text-sm">Try adjusting your search or scan a barcode</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
        {products.map((product) => {
          const isSelected = selectedProduct?.id === product.id;
          const stockStatus = getStockStatusText(product.stock_quantity);
          const stockStatusColor = getStockStatusColor(product.stock_quantity);
          const activeUnits = product.units?.filter(unit => unit.active) || [];
          const selectedUnit = activeUnits.find(unit => unit.id === selectedUnits[product.id]) ||
            activeUnits.find(unit => unit.is_base) || activeUnits[0];
          
          return (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${
                isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
              }`}
              onClick={() => onProductSelect(product)}
            >
              {/* Product Image */}
              <div className="relative h-24 sm:h-32 bg-gray-100 rounded-t-lg overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder
                      e.currentTarget.src = '/images/product-placeholder.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Stock Status Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${stockStatusColor}`}>
                  {stockStatus}
                </div>
                
                {/* Low Stock Warning */}
                {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                  <div className="absolute top-2 left-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 sm:p-4">
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">
                  {product.name}
                </h3>
                
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {selectedUnit?.name || product.base_unit}
                    </p>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(selectedUnit?.selling_price || product.price)}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <span className="block text-xs text-gray-500">Stock</span>
                    <span className="font-medium">
                      {formatQuantity(product.stock_quantity)} {product.base_unit}
                    </span>
                  </div>
                </div>

                {activeUnits.length > 1 && (
                  <label className="block mb-3 text-xs font-medium text-gray-700">
                    Sell as
                    <select
                      value={selectedUnit?.id ?? ''}
                      onChange={(e) => setSelectedUnits(current => ({
                        ...current,
                        [product.id]: Number(e.target.value),
                      }))}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-full rounded border-2 border-blue-300 bg-blue-50 px-2 py-2 text-sm text-gray-900"
                    >
                      {activeUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}{unit.selling_price ? ` - ${formatCurrency(unit.selling_price)}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {onAddToCart && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product, selectedUnit);
                      }}
                      className="w-full px-3 py-2 sm:py-2 text-xs sm:text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      disabled={product.stock_quantity <= 0}
                    >
                      Add to Cart
                    </button>
                  )}
                  
                  {/* Secondary Action - Update Stock (hidden for cashiers) */}
                  {canUpdateStock && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStockUpdateClick(product);
                      }}
                      className="w-full px-3 py-2 sm:py-2 text-xs sm:text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Update Stock
                    </button>
                  )}
                </div>

                {/* Last Updated Info */}
                {product.stock_updated_by && (
                  <div className="mt-2 text-xs text-gray-500">
                    Last updated: {product.stock_updated_by} ({product.stock_update_source})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Update Modal */}
      {showStockModal && stockUpdateProduct && (
        <StockUpdateModal
          product={stockUpdateProduct}
          onUpdate={handleStockUpdate}
          onClose={() => {
            setShowStockModal(false);
            setStockUpdateProduct(null);
          }}
        />
      )}
    </>
  );
}

export default memo(ProductGrid);
