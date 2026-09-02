
import { apiClient } from './api';
import Cookies from 'js-cookie';
import { cachedFetch } from './cache';

import { Product } from '@/types/product';
import { Order as UnifiedOrder } from '@/types/order';

const adminApiClient = {
  request: async (endpoint: string, options: any = {}) => {
    
    const getAuthToken = (): string | null => {
      if (typeof window !== 'undefined') {
        
        const token = Cookies.get('access_token');
        if (token) {
          return token;
        }

        return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      }
      return null;
    };

    const token = getAuthToken();
    if (!token) {
      console.error('Admin authentication required - no token found');
      throw new Error('Admin authentication required');
    }
    
    console.log('Admin API request with token:', token.substring(0, 20) + '...');
    
    return apiClient.request(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products: number;
  pending_orders: number;
  low_stock_items: number;
  recent_orders: Order[];
  low_stock_products: Product[];
}

export interface Order {
  id: string;
  order_number: string;
  customer: {
    id: number;
    username: string;
    email: string;
  };
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  escrow_status: 'awaiting_payment' | 'held' | 'released' | 'non_escrow';
  payment_method: 'cod' | 'card' | 'mobile_money';
  release_code?: string;
  created_at: string;
  items_count: number;
}

export type { Product };

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description: string;
  price: string;
  compare_price: string | null;
  cost_price: string | null;
  barcode: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  weight: string | null;
  dimensions: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  brand: {
    id: number;
    name: string;
    slug: string;
  };
  images: {
    id: number;
    image: string;
    alt_text: string;
  }[];
  specifications: Record<string, string>;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export const adminApi = {
  
  getDashboardStats: async (): Promise<DashboardStats> => {
    return await apiClient.request('/admin/dashboard/stats/');
  },

  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ results: Order[]; count: number; next: string | null; previous: string | null }> => {
    return await apiClient.request('/admin/orders/', { params });
  },

  getOrder: async (orderId: string): Promise<Order> => {
    return await apiClient.request(`/admin/orders/${orderId}/`);
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<Order> => {
    return await apiClient.request(`/admin/orders/${orderId}/`, {
      method: 'PATCH',
      data: { status }
    });
  },

  updateOrderWithFundsVerified: async (orderId: string, data: {
    status: string;
    escrow_status: 'awaiting_payment' | 'held' | 'released' | 'non_escrow';
    payment_ref: string;
    release_code: string;
  }): Promise<Order> => {
    return await apiClient.request(`/admin/orders/${orderId}/`, {
      method: 'PATCH',
      data
    });
  },

  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    condition?: string;
    is_active?: string;
    is_featured?: string;
  }): Promise<{count: number, num_pages: number, current_page: number, results: Product[]}> => {
    const token = Cookies.get('access_token') || 
                 (typeof window !== 'undefined' ? localStorage.getItem('access_token') || sessionStorage.getItem('access_token') : null);
    
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/products/`;
    const paramString = params ? new URLSearchParams(params as any).toString() : '';
    const fullUrl = paramString ? `${url}?${paramString}` : url;
    
    const response = await cachedFetch(fullUrl, {
      method: 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Content-Type': 'application/json',
      }
    }, 180000); // Cache for 3 minutes
    
    return await response.json() as {count: number, num_pages: number, current_page: number, results: Product[]};
  },

  getProductDetail: async (productId: number): Promise<Product> => {
    return await adminApiClient.request(`/products/${productId}/`, {
      method: 'GET'
    }) as Product;
  },

  updateProduct: async (productId: number, productData: Partial<Product>): Promise<Product> => {
    return await adminApiClient.request(`/products/${productId}/update/`, {
      method: 'PATCH',
      data: productData
    }) as Product;
  },

  deleteProduct: async (productId: number): Promise<{message: string}> => {
    return await adminApiClient.request(`/products/${productId}/delete/`, {
      method: 'DELETE'
    }) as {message: string};
  },

  getInventory: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    stock_status?: string;
  }): Promise<{ results: Product[]; count: number; next: string | null; previous: string | null }> => {
    return await apiClient.request('/admin/inventory/', { params });
  },

  updateStock: async (productId: number, productData: Partial<Product>): Promise<Product> => {
    return await apiClient.request(`/admin/inventory/${productId}/`, {
      method: 'PATCH',
      data: productData
    });
  },

  restockProduct: async (productId: number, addQuantity: number): Promise<Product> => {
    return await apiClient.request(`/admin/inventory/${productId}/restock/`, {
      method: 'PATCH',
      data: { add_quantity: addQuantity }
    });
  },

  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{ results: any[]; count: number; next: string | null; previous: string | null }> => {
    return await apiClient.request('/admin/customers/', { params });
  },

  getCustomer: async (customerId: number): Promise<any> => {
    return await apiClient.request(`/admin/customers/${customerId}/`);
  },

  getSalesAnalytics: async (params?: {
    start_date?: string;
    end_date?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<any> => {
    return await apiClient.request('/admin/analytics/sales/', { params });
  },

  getTopProducts: async (params?: {
    limit?: number;
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<any[]> => {
    return await apiClient.request('/admin/analytics/top-products/', { params });
  },

  getTopCustomers: async (params?: {
    limit?: number;
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<any[]> => {
    return await apiClient.request('/admin/analytics/top-customers/', { params });
  },
};
