

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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
  payment_method: string;
  items: OrderItem[];
}

export interface Order {
  id: string;
  order_number: string;
  customer: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
  shipping_address: string;
  city: string;
  region: string;
  postal_code?: string;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  tracking_number?: string;
  release_code?: string;
}

export interface OrderStatus {
  id: string;
  order: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface OrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export interface OrderFilters {
  status?: string;
  customer?: string;
  date_from?: string;
  date_to?: string;
  payment_status?: string;
}

export interface OrdersResponse {
  results: Order[];
  count: number;
  next: string | null;
  previous: string | null;
}
