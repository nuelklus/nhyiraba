'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { adminApi, Product } from '@/lib/admin-api';
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Edit,
  Plus
} from 'lucide-react';

function InventoryManagementContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (stockFilter !== 'all') params.stock_status = stockFilter;
      
      const response = await adminApi.getInventory(params);
      setProducts(response.results);
      setTotalCount(response.count);
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchTerm, stockFilter]);

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { status: 'out', color: 'bg-red-100 text-red-800', text: 'Out of Stock' };
    if (stock <= threshold) return { status: 'low', color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' };
    return { status: 'good', color: 'bg-green-100 text-green-800', text: 'In Stock' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleRestock = (product: Product) => {
    setSelectedProduct(product);
    setRestockQuantity('');
    setShowRestockModal(true);
  };

  const handleEdit = (product: Product) => {
    
    const currentProduct = products.find(p => p.id === product.id);
    console.log('handleEdit - product from list:', product);
    console.log('handleEdit - currentProduct from state:', currentProduct);
    
    setSelectedProduct(currentProduct || product);
    setEditingProduct({
      name: currentProduct?.name || product.name,
      sku: currentProduct?.sku || product.sku,
      price: currentProduct?.price || product.price,
      stock_quantity: currentProduct?.stock_quantity || product.stock_quantity,
      low_stock_threshold: currentProduct?.low_stock_threshold || product.low_stock_threshold,
      description: currentProduct?.description || product.description,
    });
    setShowEditModal(true);
  };

  const handleRestockSubmit = async () => {
    if (!selectedProduct || !restockQuantity) return;
    
    try {
      setUpdatingStock(true);
      const currentStock = selectedProduct.stock_quantity || 0;
      const addQuantity = parseInt(restockQuantity);
      
      if (isNaN(addQuantity) || addQuantity <= 0) {
        setError('Please enter a valid positive quantity');
        return;
      }
      
      const newStock = currentStock + addQuantity;
      const updatedProduct = await adminApi.restockProduct(parseInt(selectedProduct.id), addQuantity);

      const normalizedProduct = {
        ...updatedProduct,
        category: updatedProduct.category || { name: 'No Category' },
        brand: updatedProduct.brand || { name: 'No Brand' }
      };

      setProducts(products.map(product => 
        product.id === selectedProduct.id ? normalizedProduct as any : product
      ) as any);
      
      setShowRestockModal(false);
      setSelectedProduct(null);
      setRestockQuantity('');
    } catch (err: any) {
      console.error('Failed to update stock:', err);
      setError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedProduct || !editingProduct) return;
    
    try {
      setUpdatingStock(true);

      const updateData: Partial<Product> = {};
      
      if (editingProduct.name !== selectedProduct.name) {
        updateData.name = editingProduct.name;
      }
      if (editingProduct.sku !== selectedProduct.sku) {
        updateData.sku = editingProduct.sku;
      }
      if (editingProduct.price !== selectedProduct.price) {
        updateData.price = editingProduct.price;
      }
      if (editingProduct.stock_quantity !== selectedProduct.stock_quantity) {
        updateData.stock_quantity = editingProduct.stock_quantity;
      }
      if (editingProduct.low_stock_threshold !== selectedProduct.low_stock_threshold) {
        updateData.low_stock_threshold = editingProduct.low_stock_threshold;
      }
      if (editingProduct.description !== selectedProduct.description) {
        updateData.description = editingProduct.description;
      }

      if (Object.keys(updateData).length === 0) {
        setShowEditModal(false);
        setSelectedProduct(null);
        setEditingProduct({});
        return;
      }
      
      const updatedProduct = await adminApi.updateStock(parseInt(selectedProduct.id), updateData as any);
      
      console.log('API Response:', updatedProduct);
      console.log('Selected Product before update:', selectedProduct);

      const normalizedProduct = {
        ...updatedProduct,
        category: updatedProduct.category || { name: 'No Category' },
        brand: updatedProduct.brand || { name: 'No Brand' }
      };
      
      console.log('Normalized Product:', normalizedProduct);

      setProducts(products.map(product => 
        product.id === selectedProduct.id ? normalizedProduct as any : product
      ) as any);
      
      setShowEditModal(false);
      setSelectedProduct(null);
      setEditingProduct({});
    } catch (err: any) {
      console.error('Failed to update product:', err);
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setUpdatingStock(false);
    }
  };

  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= (p.low_stock_threshold || 0));
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="outline" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Inventory
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {}
          {!loading && (lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  Stock Alerts
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outOfStockProducts.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="font-medium text-red-800 mb-2">Out of Stock ({outOfStockProducts.length})</h3>
                      <div className="space-y-2">
                        {outOfStockProducts.slice(0, 5).map(product => (
                          <div key={product.id} className="text-sm text-gray-500">
                            {product.name} ({product.sku})
                          </div>
                        ))}
                        {outOfStockProducts.length > 5 && (
                          <div className="text-sm text-red-600 font-medium">
                            ... and {outOfStockProducts.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {lowStockProducts.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="font-medium text-yellow-800 mb-2">Low Stock ({lowStockProducts.length})</h3>
                      <div className="space-y-2">
                        {lowStockProducts.slice(0, 5).map(product => (
                          <div key={product.id} className="text-sm text-yellow-700">
                            {product.name} ({product.stock_quantity} left)
                          </div>
                        ))}
                        {lowStockProducts.length > 5 && (
                          <div className="text-sm text-yellow-600 font-medium">
                            ... and {lowStockProducts.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name, SKU, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Products</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                  <option value="good">In Stock</option>
                </select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error loading inventory</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchInventory}
                  className="ml-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Products ({totalCount})
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
                        <p className="text-gray-600">Loading inventory...</p>
                      </td>
                    </tr>
                  ) : products.length > 0 ? (
                    products.map((product) => {
                      const stockStatus = getStockStatus(product.stock_quantity || 0, product.low_stock_threshold || 0);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{typeof product.category === 'string' ? product.category : product.category?.name || 'Unknown Category'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            GHS {parseFloat(product.price?.toString() || '0').toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.stock_quantity || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.low_stock_threshold}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRestock(product)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Restock
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{products.length}</span> of{' '}
              <span className="font-medium">{totalCount}</span> results
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" disabled>Previous</Button>
              <Button variant="outline" disabled>Next</Button>
            </div>
          </div>
        </div>
      </div>

      {}
      {showRestockModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Restock Product</h3>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertTriangle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product: {selectedProduct.name}
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Stock: {(selectedProduct.stock_quantity || 0).toString()}
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Quantity:
              </label>
              <input
                type="number"
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                placeholder="Enter quantity to add"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {restockQuantity && (
                <p className="mt-2 text-sm text-gray-600">
                  New stock will be: {(selectedProduct.stock_quantity || 0) + parseInt(restockQuantity || '0')}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRestockModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleRestockSubmit}
                disabled={!restockQuantity || updatingStock}
              >
                {updatingStock ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Restock
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Product Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertTriangle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (GHS)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0} as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{typeof selectedProduct.category === 'string' ? selectedProduct.category : selectedProduct.category?.name || 'No Category'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.stock_quantity || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Stock quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.low_stock_threshold || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, low_stock_threshold: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Low stock threshold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product description"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowEditModal(false);
                      handleRestock(selectedProduct);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Quick Restock
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditSubmit}
                disabled={updatingStock}
              >
                {updatingStock ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryManagementPage() {
  return (
    <ProtectedRoute>
      <InventoryManagementContent />
    </ProtectedRoute>
  );
}
