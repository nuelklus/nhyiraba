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
  Plus,
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Star,
  Archive,
  ArchiveRestore
} from 'lucide-react';

function ProductsManagementContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: currentPage,
        page_size: 12
      };
      
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (brandFilter) params.brand = brandFilter;
      if (statusFilter !== 'all') params.is_active = statusFilter;
      if (featuredFilter !== 'all') params.is_featured = featuredFilter;
      
      console.log('Fetching products with params:', params);
      const response = await adminApi.getProducts(params);
      console.log('API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response.results:', response?.results);
      console.log('Response.results type:', typeof response?.results);
      
      if (response && response.results && Array.isArray(response.results)) {
        setProducts(response.results);
        setTotalCount(response.count || 0);
        setTotalPages(response.num_pages || 1);
        setCurrentPage(response.current_page || 1);
      } else {
        console.error('Invalid API response structure:', response);
        setProducts([]);
        setTotalCount(0);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); // Run on component mount

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter, brandFilter, statusFilter, featuredFilter, currentPage]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditingProduct({
      name: product.name,
      sku: product.sku,
      description: product.description,
      short_description: product.short_description,
      price: product.price,
      compare_price: product.compare_price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      weight: product.weight,
      dimensions: product.dimensions,
      condition: product.condition,
      track_stock: product.track_stock,
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_digital: product.is_digital,
      category_id: typeof product.category === 'string' ? undefined : product.category.id,
      brand_id: typeof product.brand === 'string' ? undefined : product.brand.id,
    });
    setShowEditModal(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedProduct || !editingProduct) return;
    
    try {
      setUpdatingProduct(true);

      const updateData: any = {};
      if (editingProduct.name !== selectedProduct.name) {
        updateData.name = editingProduct.name;
      }
      if (editingProduct.sku !== selectedProduct.sku) {
        updateData.sku = editingProduct.sku;
      }
      if (editingProduct.description !== selectedProduct.description) {
        updateData.description = editingProduct.description;
      }
      if (editingProduct.short_description !== selectedProduct.short_description) {
        updateData.short_description = editingProduct.short_description;
      }
      if (editingProduct.price !== selectedProduct.price) {
        updateData.price = editingProduct.price;
      }
      if (editingProduct.compare_price !== selectedProduct.compare_price) {
        updateData.compare_price = editingProduct.compare_price;
      }
      if (editingProduct.cost_price !== selectedProduct.cost_price) {
        updateData.cost_price = editingProduct.cost_price;
      }
      if (editingProduct.stock_quantity !== selectedProduct.stock_quantity) {
        updateData.stock_quantity = editingProduct.stock_quantity;
      }
      if (editingProduct.low_stock_threshold !== selectedProduct.low_stock_threshold) {
        updateData.low_stock_threshold = editingProduct.low_stock_threshold;
      }
      if (editingProduct.weight !== selectedProduct.weight) {
        updateData.weight = editingProduct.weight;
      }
      if (editingProduct.dimensions !== selectedProduct.dimensions) {
        updateData.dimensions = editingProduct.dimensions;
      }
      if (editingProduct.condition !== selectedProduct.condition) {
        updateData.condition = editingProduct.condition;
      }
      if (editingProduct.track_stock !== selectedProduct.track_stock) {
        updateData.track_stock = editingProduct.track_stock;
      }
      if (editingProduct.is_active !== selectedProduct.is_active) {
        updateData.is_active = editingProduct.is_active;
      }
      if (editingProduct.is_featured !== selectedProduct.is_featured) {
        updateData.is_featured = editingProduct.is_featured;
      }
      if (editingProduct.is_digital !== selectedProduct.is_digital) {
        updateData.is_digital = editingProduct.is_digital;
      }
      if ((editingProduct as any).image_url !== (selectedProduct as any).image_url) {
        updateData.image_url = (editingProduct as any).image_url;
      }
      if (editingProduct.category_id !== (typeof selectedProduct.category === 'string' ? undefined : selectedProduct.category?.id)) {
        updateData.category_id = editingProduct.category_id;
      }
      if (editingProduct.brand_id !== (typeof selectedProduct.brand === 'string' ? undefined : selectedProduct.brand?.id)) {
        updateData.brand_id = editingProduct.brand_id;
      }

      if (Object.keys(updateData).length === 0) {
        setShowEditModal(false);
        setSelectedProduct(null);
        setEditingProduct({});
        return;
      }
      
      const updatedProduct = await adminApi.updateProduct(parseInt(selectedProduct.id), updateData);

      const normalizedProduct = {
        ...updatedProduct,
        category: updatedProduct.category || { name: 'No Category' },
        brand: updatedProduct.brand || { name: 'No Brand' }
      };

      setProducts((currentProducts) =>
        currentProducts ? currentProducts.map((product) =>
          product.id === selectedProduct.id ? normalizedProduct as any : product
        ) : []
      );
      
      setShowEditModal(false);
      setSelectedProduct(null);
      setEditingProduct({});
    } catch (err: any) {
      console.error('Failed to update product:', err);
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return;
    
    try {
      setUpdatingProduct(true);
      await adminApi.deleteProduct(parseInt(selectedProduct.id));

      setProducts(products.filter(product => product.id !== selectedProduct.id));
      
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      setError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setUpdatingProduct(false);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const updatedProduct = await adminApi.updateProduct(parseInt(product.id), {
        is_active: !product.is_active
      });

      const normalizedProduct = {
        ...updatedProduct,
        category: updatedProduct.category || { name: 'No Category' },
        brand: updatedProduct.brand || { name: 'No Brand' }
      };

      setProducts((currentProducts) =>
        currentProducts ? currentProducts.map((p) =>
          p.id === product.id ? normalizedProduct as any : p
        ) : []
      );
    } catch (err: any) {
      console.error('Failed to toggle product status:', err);
      setError(err.response?.data?.message || 'Failed to toggle product status');
    }
  };

  const toggleFeaturedStatus = async (product: Product) => {
    try {
      const updatedProduct = await adminApi.updateProduct(parseInt(product.id), {
        is_featured: !product.is_featured
      });

      const normalizedProduct = {
        ...updatedProduct,
        category: updatedProduct.category || { name: 'No Category' },
        brand: updatedProduct.brand || { name: 'No Brand' }
      };

      setProducts((currentProducts) =>
        currentProducts ? currentProducts.map((p) =>
          p.id === product.id ? normalizedProduct as any : p
        ) : []
      );
    } catch (err: any) {
      console.error('Failed to toggle featured status:', err);
      setError(err.response?.data?.message || 'Failed to toggle featured status');
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
              <p className="mt-2 text-gray-600">Manage your product catalog</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/admin/products/new">
                <Button className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Products</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                placeholder="Category slug"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <input
                type="text"
                placeholder="Brand slug"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (!products || products.length === 0) ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first product.</p>
              <Link href="/admin/products/new">
                <Button>Add Product</Button>
              </Link>
            </div>
          ) : (
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products && products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {(product as any).image_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={(product as any).image_url}
                                alt={product.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                              {product.is_featured && (
                                <Star className="inline w-4 h-4 text-yellow-400 ml-1" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {typeof product.category === 'string' ? product.category : product.category?.name || 'No Category'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        GHS {parseFloat(product.price?.toString() || '0').toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stock_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(product)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleProductStatus(product)}
                            className={`${
                              product.is_active
                                ? 'text-yellow-600 hover:text-yellow-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={product.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {product.is_active ? (
                              <Archive className="w-4 h-4" />
                            ) : (
                              <ArchiveRestore className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => toggleFeaturedStatus(product)}
                            className={`${
                              product.is_featured
                                ? 'text-yellow-600 hover:text-yellow-900'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={product.is_featured ? 'Remove from Featured' : 'Add to Featured'}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, totalCount)} of{' '}
              {totalCount} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {(selectedProduct as any).image_url ? (
                  <img
                    src={(selectedProduct as any).image_url}
                    alt={selectedProduct.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedProduct.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedProduct.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {selectedProduct.is_featured && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <p className="text-sm text-gray-900">GHS {parseFloat(selectedProduct.price?.toString() || '0').toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                  <p className="text-sm text-gray-900">{selectedProduct.stock_quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{typeof selectedProduct.category === 'string' ? selectedProduct.category : selectedProduct.category?.name || 'No Category'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand</label>
                  <p className="text-sm text-gray-900">{typeof selectedProduct.brand === 'string' ? selectedProduct.brand : selectedProduct.brand?.name || 'No Brand'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedProduct.condition || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                  <p className="text-sm text-gray-900">{selectedProduct.low_stock_threshold}</p>
                </div>
              </div>
              
              {selectedProduct.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedProduct.description}</p>
                </div>
              )}
              
              {selectedProduct.short_description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                  <p className="text-sm text-gray-900">{selectedProduct.short_description}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedProduct);
                }}
              >
                Edit Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0} as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compare Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.compare_price || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, compare_price: parseFloat(e.target.value) || 0} as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.cost_price || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, cost_price: parseFloat(e.target.value) || 0} as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.stock_quantity || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                  <input
                    type="number"
                    value={editingProduct.low_stock_threshold || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, low_stock_threshold: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                <input
                  type="text"
                  value={editingProduct.short_description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, short_description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.weight || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, weight: parseFloat(e.target.value) || 0} as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
                  <input
                    type="text"
                    value={editingProduct.dimensions || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, dimensions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                  <select
                    value={editingProduct.condition || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, condition: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Condition</option>
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="text"
                    value={editingProduct.image_url || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value} as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="track_stock"
                    checked={editingProduct.track_stock || false}
                    onChange={(e) => setEditingProduct({...editingProduct, track_stock: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="track_stock" className="ml-2 block text-sm text-gray-900">
                    Track Stock
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingProduct.is_active || false}
                    onChange={(e) => setEditingProduct({...editingProduct, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={editingProduct.is_featured || false}
                    onChange={(e) => setEditingProduct({...editingProduct, is_featured: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                    Featured
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={updatingProduct}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updatingProduct}
              >
                {updatingProduct ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{selectedProduct.name}"? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={updatingProduct}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteSubmit}
                disabled={updatingProduct}
                className="bg-red-600 hover:bg-red-700"
              >
                {updatingProduct ? 'Deleting...' : 'Delete Product'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsManagementPage() {
  return (
    <ProtectedRoute>
      <ProductsManagementContent />
    </ProtectedRoute>
  );
}
