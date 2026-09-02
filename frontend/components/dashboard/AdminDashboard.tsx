'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { adminApi, DashboardStats, Order, Product } from '@/lib/admin-api';
import { InventoryManagement } from '@/components/admin/InventoryManagement';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Settings,
  BarChart3,
  DollarSign,
  Truck,
  AlertCircle,
  RefreshCw,
  Star,
  Archive,
  ArchiveRestore,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showFundsVerifiedModal, setShowFundsVerifiedModal] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [selectedEscrowStatus, setSelectedEscrowStatus] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await adminApi.getDashboardStats();
      setStats(dashboardStats);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const params: any = {};
      if (orderSearchTerm) params.search = orderSearchTerm;
      if (orderStatusFilter !== 'all') params.status = orderStatusFilter;
      
      const response = await adminApi.getOrders(params);
      setOrders(response.results);
      setOrdersTotalCount(response.count);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setOrdersError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cod':
        return 'Cash on Delivery';
      case 'card':
        return 'Bank Card';
      case 'mobile_money':
        return 'Mobile Money';
      default:
        return method;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'paid':
        return 'Paid';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEscrowStatusText = (status: string) => {
    switch (status) {
      case 'awaiting_payment':
        return 'Awaiting Payment';
      case 'held':
        return 'Held';
      case 'released':
        return 'Released';
      case 'non_escrow':
        return 'Non-Escrow (COD)';
      default:
        return status;
    }
  };

  const getEscrowStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'held':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'non_escrow':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewOrder = async (order: any) => {
    try {
      const orderDetails = await adminApi.getOrder(order.id);
      setSelectedOrder(orderDetails);
      setShowOrderDetails(true);
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      setOrdersError(err.response?.data?.message || 'Failed to load order details');
    }
  };

  const handleUpdateStatus = (order: any) => {
    setSelectedOrder(order);
    setSelectedEscrowStatus(order.escrow_status || '');
    setShowStatusModal(true);
  };

  const handleFundsVerified = (order: any) => {
    setSelectedOrder(order);
    setShowFundsVerifiedModal(true);
    setPaymentRef('');
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    
    try {
      setUpdatingStatus(true);

      const updateData: any = { status: newStatus };

      if (selectedEscrowStatus && selectedEscrowStatus !== selectedOrder.escrow_status) {
        updateData.escrow_status = selectedEscrowStatus;
      }
      
      const updatedOrder = await adminApi.updateOrderWithFundsVerified(selectedOrder.id, updateData);

      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id ? updatedOrder : order
        )
      );
      
      setShowStatusModal(false);
      setSelectedOrder(null);
      setSelectedEscrowStatus('');
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      setOrdersError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFundsVerifiedSubmit = async () => {
    if (!selectedOrder || !paymentRef.trim()) return;
    
    try {
      setUpdatingStatus(true);

      const releaseCode = Math.floor(100000 + Math.random() * 900000).toString();

      const updatedOrder = await adminApi.updateOrderWithFundsVerified(selectedOrder.id, {
        status: 'processing',
        escrow_status: 'held',
        payment_ref: paymentRef.trim(),
        release_code: releaseCode
      });

      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id ? updatedOrder : order
        )
      );
      
      setShowFundsVerifiedModal(false);
      setSelectedOrder(null);
      setPaymentRef('');
      
      alert(`Funds verified successfully!\nRelease Code: ${releaseCode}\nPlease save this code for delivery confirmation.`);
    } catch (err: any) {
      console.error('Failed to verify funds:', err);
      setOrdersError(err.response?.data?.message || 'Failed to verify funds');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const params: any = {
        page: currentPage || 1,
        page_size: 12
      };
      
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (brandFilter) params.brand = brandFilter;
      if (statusFilter !== 'all') params.is_active = statusFilter;
      if (featuredFilter !== 'all') params.is_featured = featuredFilter;

      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      console.log('Fetching products with params:', params);
      const response = await adminApi.getProducts(params);
      console.log('API response:', response);
      setProducts(response.results);
      setTotalCount(response.count);
      setTotalPages(response.num_pages);
      setCurrentPage(response.current_page);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setProductsError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, currentPage, searchTerm, categoryFilter, brandFilter, statusFilter, featuredFilter]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, orderSearchTerm, orderStatusFilter]);

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
      image_url: product.image_url,
      category_id: (product.category as any)?.id,
      brand_id: (product.brand as any)?.id,
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
      if (editingProduct.image_url !== selectedProduct.image_url) {
        updateData.image_url = editingProduct.image_url;
      }
      if (editingProduct.category_id !== (selectedProduct.category as any)?.id) {
        updateData.category_id = editingProduct.category_id;
      }
      if (editingProduct.brand_id !== (selectedProduct.brand as any)?.id) {
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

      setProducts((prevProducts: Product[]) => 
        prevProducts ? prevProducts.map(product => 
          product.id === selectedProduct.id ? normalizedProduct as any : product
        ) : []
      );
      
      setShowEditModal(false);
      setSelectedProduct(null);
      setEditingProduct({});
    } catch (err: any) {
      console.error('Failed to update product:', err);
      setProductsError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return;
    
    try {
      setUpdatingProduct(true);
      await adminApi.deleteProduct(parseInt(selectedProduct.id));

      setProducts(products ? products.filter(product => product.id !== selectedProduct.id) : []);
      
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      setProductsError(err.response?.data?.message || 'Failed to delete product');
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
      
      setProducts((products: Product[]) => 
        (products as any[]).map(p => 
          p.id === product.id ? normalizedProduct as any : p
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle product status:', err);
      setProductsError(err.response?.data?.message || 'Failed to toggle product status');
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
      
      setProducts((products: Product[]) => 
        (products as any[]).map(p => 
          p.id === product.id ? normalizedProduct as any : p
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle featured status:', err);
      setProductsError(err.response?.data?.message || 'Failed to toggle featured status');
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats?.total_orders?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `GHS ${stats?.total_revenue?.toLocaleString() || '0'}`}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customers</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats?.total_customers?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Products</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats?.total_products?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardStats}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">Loading orders...</p>
              </div>
            ) : stats?.recent_orders && stats.recent_orders.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.customer.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">GHS {order.total_amount}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-green-100 text-green-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No recent orders</p>
                <Link href="/admin/orders">
                  <Button variant="outline">View All Orders</Button>
                </Link>
              </div>
            )}
            {stats?.recent_orders && stats.recent_orders.length > 0 && (
              <div className="mt-4">
                <Link href="/admin/orders">
                  <Button variant="outline" className="w-full">View All Orders</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
            {stats?.low_stock_items && stats.low_stock_items > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                {stats.low_stock_items} items
              </span>
            )}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">Loading inventory...</p>
              </div>
            ) : stats?.low_stock_products && stats.low_stock_products.length > 0 ? (
              <div className="space-y-4">
                {stats.low_stock_products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{product.stock_quantity} left</p>
                      <p className="text-sm text-gray-600">Min: {product.low_stock_threshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">All products are well stocked</p>
                <Link href="/admin/inventory">
                  <Button variant="outline">Manage Inventory</Button>
                </Link>
              </div>
            )}
            {stats?.low_stock_products && stats.low_stock_products.length > 0 && (
              <div className="mt-4">
                <Link href="/admin/inventory">
                  <Button variant="outline" className="w-full">Manage Inventory</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      {}
      <div className="bg-white rounded-lg shadow-sm p-6">
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
              placeholder="Category name or slug (e.g., Power Tools)"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <input
              type="text"
              placeholder="Brand name or slug (e.g., Dewalt)"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {}
      {productsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{productsError}</span>
          </div>
        </div>
      )}

      {}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Product Management</h2>
          <div className="flex space-x-2">
            <Link href="/admin/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
        
        {productsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !products || products.length === 0 ? (
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
                          {product.image_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={product.image_url}
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
        <div className="flex items-center justify-between">
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
  );

  const renderOrders = () => (
    <div className="space-y-6">
      {}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by ID, customer, or email..."
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {}
      {ordersError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
              <p className="text-sm text-red-700 mt-1">{ordersError}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Orders ({ordersTotalCount})
            </h2>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Orders
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Escrow Status
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
              {ordersLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
                    <p className="text-gray-600">Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer?.username || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.customer?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items_count || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      GHS {(order.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentMethodText(order.payment_method || 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status || 'pending')}`}>
                        {getPaymentStatusText(order.payment_status || 'pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEscrowStatusColor(order.escrow_status || 'awaiting_payment')}`}>
                        {getEscrowStatusText(order.escrow_status || 'awaiting_payment')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(order)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {order.status === 'pending' && order.payment_status === 'paid' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleFundsVerified(order)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your mother &amp; baby boutique</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'inventory' && <InventoryManagement />}
        </div>
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
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
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
                <AlertCircle className="h-6 w-6 text-red-600" />
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

      {}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 flex items-center">
                    {getStatusIcon(selectedOrder.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer?.username || 'N/A'}</p>
                <p className="text-sm text-gray-500">{selectedOrder.customer?.email || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">GHS {(selectedOrder.total_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="mt-1 text-sm text-gray-900">{getPaymentMethodText(selectedOrder.payment_method || 'N/A')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Items Count</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.items_count || 0} items</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Order Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
              </div>

              {selectedOrder.shipping_address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.shipping_address}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.city}, {selectedOrder.region}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order: {selectedOrder.order_number}
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status: {getStatusText(selectedOrder.status)}
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">New Status:</label>
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange('pending')}
                  disabled={updatingStatus}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                  Pending
                </button>
                <button
                  onClick={() => handleStatusChange('processing')}
                  disabled={updatingStatus}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <Package className="h-4 w-4 text-blue-600 mr-2" />
                  Processing
                </button>
                <button
                  onClick={() => handleStatusChange('shipped')}
                  disabled={updatingStatus}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <Truck className="h-4 w-4 text-green-600 mr-2" />
                  Shipped
                </button>
                <button
                  onClick={() => handleStatusChange('delivered')}
                  disabled={updatingStatus}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Delivered
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updatingStatus}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  Cancelled
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Escrow Status (Optional):</label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedEscrowStatus('')}
                  disabled={updatingStatus}
                  className={`w-full text-left px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center ${
                    selectedEscrowStatus === '' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <span className="h-4 w-4 mr-2">⚪</span>
                  No Change
                </button>
                <button
                  onClick={() => setSelectedEscrowStatus('awaiting_payment')}
                  disabled={updatingStatus}
                  className={`w-full text-left px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center ${
                    selectedEscrowStatus === 'awaiting_payment' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                  Awaiting Payment
                </button>
                <button
                  onClick={() => setSelectedEscrowStatus('held')}
                  disabled={updatingStatus}
                  className={`w-full text-left px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center ${
                    selectedEscrowStatus === 'held' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <Package className="h-4 w-4 text-blue-600 mr-2" />
                  Held
                </button>
                <button
                  onClick={() => setSelectedEscrowStatus('released')}
                  disabled={updatingStatus}
                  className={`w-full text-left px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center ${
                    selectedEscrowStatus === 'released' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Released
                </button>
                <button
                  onClick={() => setSelectedEscrowStatus('non_escrow')}
                  disabled={updatingStatus}
                  className={`w-full text-left px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center ${
                    selectedEscrowStatus === 'non_escrow' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <Package className="h-4 w-4 text-gray-600 mr-2" />
                  Non-Escrow (COD)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use for COD orders or manual escrow management
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {showFundsVerifiedModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Verify Funds</h3>
              <button
                onClick={() => setShowFundsVerifiedModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order: {selectedOrder.order_number}
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status: {getStatusText(selectedOrder.status)}
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount: GHS {(selectedOrder.total_amount || 0).toLocaleString()}
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference *
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter payment reference number"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the payment reference from the payment system
              </p>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> This will:
              </p>
              <ul className="text-sm text-yellow-800 mt-1 ml-4 list-disc">
                <li>Set order status to <strong>Processing</strong></li>
                <li>Set escrow status to <strong>Held</strong></li>
                <li>Generate a 6-digit release code for delivery confirmation</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFundsVerifiedModal(false)}
                disabled={updatingStatus}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFundsVerifiedSubmit}
                disabled={updatingStatus || !paymentRef.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {updatingStatus ? 'Verifying...' : 'Verify Funds'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
