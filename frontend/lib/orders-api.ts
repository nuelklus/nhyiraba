import { apiClient } from './api';

import { Order as UnifiedOrder, CreateOrderRequest as UnifiedCreateOrderRequest, OrderItem as UnifiedOrderItem } from '@/types/order';

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  price: number;
  quantity: number;
}

export interface CreateOrderRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  shipping_address: string;
  city: string;
  region: string;
  postal_code?: string;
  order_notes?: string;
  total_amount: number;
  payment_method: 'cod' | 'mobile_money' | 'card';
  items: OrderItem[];
}

export interface Order {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  shipping_address: string;
  city: string;
  region: string;
  postal_code?: string;
  order_notes?: string;
  total_amount: number;
  shipping_cost: number;
  tax_amount: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
}

export const ordersApi = {
  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    const response = await apiClient.request<Order>('/orders/create/', {
      method: 'POST',
      data: orderData,
    });
    return response;
  },

  getOrder: async (orderNumber: string): Promise<Order> => {
    const response = await apiClient.request<Order>(`/orders/${orderNumber}/`, {
      method: 'GET',
    });
    return response;
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.request<Order[]>('/orders/list/', {
      method: 'GET',
    });
    return response;
  },

  updateOrderStatus: async (orderNumber: string, status: string, notes?: string): Promise<void> => {
    await apiClient.request(`/orders/${orderNumber}/update-status/`, {
      method: 'POST',
      data: {
        status,
        notes
      }
    });
  },

  trackOrder: async (orderNumber: string): Promise<any> => {
    const response = await apiClient.request(`/orders/${orderNumber}/track/`, {
      method: 'GET',
    });
    return response;
  },

  confirmDelivery: async (orderNumber: string, releaseCode: string): Promise<any> => {
    const response = await apiClient.request(`/orders/${orderNumber}/confirm-delivery/`, {
      method: 'POST',
      data: {
        release_code: releaseCode
      }
    });
    return response;
  },

  getOrderDetails: async (orderNumber: string): Promise<any> => {
    const response = await apiClient.request(`/orders/${orderNumber}/`, {
      method: 'GET',
    });
    return response;
  }
};
