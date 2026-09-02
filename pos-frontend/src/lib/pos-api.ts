import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { NEXT_PUBLIC_POS_API_URL, NEXT_PUBLIC_API_TIMEOUT } from './env';

// Types for POS API
export interface POSAuth {
  username: string;
  password: string;
  store_id: string;
  device_id: string;
}

export interface POSAuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
  store_id: string;
  device_id: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description: string;
  price: string;
  stock_quantity: number;
  pos_stock_quantity: number;
  last_pos_sync?: string;
  pos_store_id: string;
  stock_sync_version: number;
  stock_update_source: string;
  stock_updated_by?: string;
  category: {
    id: string;
    name: string;
  };
  brand: {
    id: string;
    name: string;
  };
  image_url?: string;
  is_active: boolean;
  expiry_date?: string;
  expiry_status?: {
    status: string;
    message: string;
    days_remaining?: number;
    days_overdue?: number;
  };
}

export interface StockUpdateRequest {
  product_id: string;
  quantity: number;
  change_amount?: number;
  store_id?: string;
  device_id?: string;
  sync_version?: number;
}

export interface StockUpdateResponse {
  status: string;
  product_id: string;
  product_name: string;
  old_quantity: number;
  new_quantity: number;
  change_amount: number;
  sync_version: number;
  sync_log_id: string;
  timestamp: string;
}

export interface BulkStockUpdateRequest {
  updates: StockUpdateRequest[];
  store_id?: string;
  device_id?: string;
}

export interface BulkStockUpdateResponse {
  results: Array<{
    product_id: string;
    status: string;
    new_quantity: number;
    sync_version: number;
  }>;
  errors: Array<{
    product_id: string;
    error: string;
  }>;
  processed: number;
  successful: number;
  failed: number;
}

export interface SyncStatusResponse {
  store_id: string;
  pending_syncs: number;
  failed_syncs: number;
  recent_logs: Array<{
    id: string;
    product_id: string;
    product_name: string;
    old_quantity: number;
    new_quantity: number;
    change_amount: number;
    source: string;
    operator: string;
    sync_status: string;
    timestamp: string;
  }>;
}

export interface LowStockAlert {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price: string;
  category_name: string;
  brand_name: string;
  image_url?: string;
}

export interface LowStockAlertResponse {
  store_id: string;
  threshold: number;
  count: number;
  products: LowStockAlert[];
}

export interface POSHealthResponse {
  status: string;
  timestamp: string;
  user: string;
  version: string;
}

export interface SubscriptionInfo {
  plan: string;
  pricing_type: string;
  plan_features: {
    max_users: number;
    multi_branch: boolean;
    barcode_scanning: boolean;
    supplier_management: boolean;
    stock_adjustments: boolean;
    low_stock_alerts: boolean;
    profit_loss_reports: boolean;
    audit_logs: boolean;
    api_access: boolean;
    role_based_access: boolean;
  };
  subscription_status: string;
  expiry_date: string;
  is_active: boolean;
  is_expiry_warning: boolean;
  max_users: number;
  current_users: number;
  can_add_user: boolean;
}

class POSApiClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = NEXT_PUBLIC_POS_API_URL;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: NEXT_PUBLIC_API_TIMEOUT, // Configurable via environment variable
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('pos_access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add device ID header if available
        const deviceId = localStorage.getItem('pos_device_id');
        if (deviceId) {
          config.headers['X-POS-Device-ID'] = deviceId;
        }
        
        console.log(`🔧 POS API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ POS API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`✅ POS API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle timeout errors - likely token expired
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          console.error('❌ Request timeout - token may be expired');
          // Check if token is expired
          if (!this.isAuthenticated()) {
            console.error('❌ Token expired, forcing logout');
            this.logout();
            return Promise.reject(error);
          }
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const token = localStorage.getItem('pos_access_token');
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        // Suppress 403 errors for restricted features (backend still logs them)
        if (error.response?.status === 403) {
          console.log('⚠️ Feature not available in current plan (403)');
          return Promise.reject(error);
        }

        console.error('❌ POS API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async authenticate(credentials: POSAuth): Promise<POSAuthResponse> {
    try {
      const response = await this.axiosInstance.post('/auth/login/', credentials);
      const data = response.data;
      console.log('data', data)
      // Store tokens
      localStorage.setItem('pos_access_token', data.access);
      localStorage.setItem('pos_refresh_token', data.refresh);
      localStorage.setItem('pos_device_id', credentials.device_id);
      localStorage.setItem('pos_store_id', data.store_id || credentials.store_id);
      // Store user info including staff_role
      localStorage.setItem('pos_user_info', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('❌ POS Authentication failed:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('pos_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.axiosInstance.post('/auth/refresh/', {
        refresh: refreshToken
      });
      
      const newAccessToken = response.data.access;
      localStorage.setItem('pos_access_token', newAccessToken);
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('pos_access_token');
    localStorage.removeItem('pos_refresh_token');
    localStorage.removeItem('pos_device_id');
    localStorage.removeItem('pos_store_id');
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('pos_access_token');
    if (!token) {
      console.log('❌ No token found in localStorage');
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      // No buffer - token is valid until it actually expires
      const isValid = payload.exp > currentTime;
      
      console.log(`🔍 Token check: expires in ${Math.floor(timeUntilExpiry)}s, valid: ${isValid}`);
      
      return isValid;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      // Clear invalid token
      localStorage.removeItem('pos_access_token');
      localStorage.removeItem('pos_refresh_token');
      return false;
    }
  }

  getUserStaffRole(): string | null {
    // Try to get staff_role from stored user info first
    const userInfo = localStorage.getItem('pos_user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return user.staff_role || null;
      } catch (error) {
        console.error('❌ Failed to parse user info:', error);
      }
    }

    // Fallback to token payload (might not have staff_role)
    const token = localStorage.getItem('pos_access_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.staff_role || null;
    } catch (error) {
      console.error('❌ Failed to get staff role from token:', error);
      return null;
    }
  }

  canUpdateStock(): boolean {
    const staffRole = this.getUserStaffRole();
    if (!staffRole) return false;
    // Cashiers cannot update stock
    return staffRole !== 'CASHIER';
  }

  canCreateProduct(): boolean {
    const staffRole = this.getUserStaffRole();
    if (!staffRole) return false;
    // Cashiers cannot create products
    return staffRole !== 'CASHIER';
  }

  canViewSalesSummary(): boolean {
    const staffRole = this.getUserStaffRole();
    if (!staffRole) return false;
    // Only MANAGER and ADMIN can view sales summary
    return staffRole === 'MANAGER' || staffRole === 'ADMIN';
  }

  // Product methods
  async getProducts(params?: {
    store_id?: string;
    barcode?: string;
    search?: string;
  }): Promise<{ results: Product[]; count: number; store_id: string }> {
    const response = await this.axiosInstance.get('/products/', { params });
    return response.data;
  }

  async getProductByBarcode(barcode: string, storeId?: string): Promise<Product | null> {
    try {
      const response = await this.axiosInstance.get('/products/', {
        params: { barcode, store_id: storeId }
      });
      const products = response.data.results;
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error('❌ Failed to get product by barcode:', error);
      return null;
    }
  }

  async searchProducts(query: string, storeId?: string): Promise<Product[]> {
    const response = await this.axiosInstance.get('/products/', {
      params: { search: query, store_id: storeId }
    });
    return response.data.results;
  }

  async createProduct(productData: any): Promise<Product> {
    // If productData is FormData, don't set Content-Type header (let browser set it with boundary)
    const isFormData = productData instanceof FormData;
    
    const response = await this.axiosInstance.post('/products/create_product/', productData, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data',
      } : undefined,
    });
    return response.data;
  }

  async updateProduct(productId: string, productData: any): Promise<Product> {
    const response = await this.axiosInstance.patch(`/products/${productId}/`, productData);
    return response.data;
  }

  async getCategories(): Promise<any[]> {
    const response = await this.axiosInstance.get('/categories/');
    return response.data;
  }

  async createCategory(categoryData: any): Promise<any> {
    const response = await this.axiosInstance.post('/categories/', categoryData);
    return response.data;
  }

  async getBrands(): Promise<any[]> {
    const response = await this.axiosInstance.get('/brands/');
    return response.data;
  }

  async createBrand(brandData: any): Promise<any> {
    const response = await this.axiosInstance.post('/brands/', brandData);
    return response.data;
  }

  // Stock management methods
  async updateStock(request: StockUpdateRequest): Promise<StockUpdateResponse> {
    const response = await this.axiosInstance.post('/products/update_stock/', request);
    return response.data;
  }

  async bulkUpdateStock(request: BulkStockUpdateRequest): Promise<BulkStockUpdateResponse> {
    const response = await this.axiosInstance.post('/products/bulk_stock_update/', request);
    return response.data;
  }

  // Sync and monitoring methods
  async getSyncStatus(storeId?: string): Promise<SyncStatusResponse> {
    const response = await this.axiosInstance.get('/products/sync_status/', {
      params: { store_id: storeId }
    });
    return response.data;
  }

  async getLowStockAlerts(threshold: number = 5, storeId?: string): Promise<LowStockAlertResponse> {
    const response = await this.axiosInstance.get('/alerts/low-stock/', {
      params: { threshold, store_id: storeId }
    });
    return response.data;
  }

  async getExpiryAlerts(months: number = 3, storeId?: string): Promise<{ products: Product[]; count: number; threshold_date: string }> {
    const response = await this.axiosInstance.get('/alerts/expiry/', {
      params: { months, store_id: storeId }
    });
    return response.data;
  }

  async healthCheck(): Promise<POSHealthResponse> {
    const response = await this.axiosInstance.get('/health/');
    return response.data;
  }

  async createTransaction(transactionData: any): Promise<any> {
    const response = await this.axiosInstance.post('/transactions/create/', transactionData);
    return response.data;
  }

  async getTransactionHistory(): Promise<any[]> {
    const response = await this.axiosInstance.get('/transactions/');
    return response.data;
  }

  async getTransactionDetail(transactionId: string): Promise<any> {
    const response = await this.axiosInstance.get(`/transactions/${transactionId}/`);
    return response.data;
  }

  // Subscription methods
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    const response = await this.axiosInstance.get('/subscriptions/subscription/');
    return response.data;
  }

  async checkFeatureAccess(featureName: string): Promise<{ available: boolean; current_plan: string }> {
    const response = await this.axiosInstance.get('/subscriptions/subscription/check_feature/', {
      params: { feature: featureName }
    });
    return response.data;
  }

  async getAvailableFeatures(): Promise<any> {
    const response = await this.axiosInstance.get('/subscriptions/subscription/features/');
    return response.data;
  }

  async createRefund(refundData: any): Promise<any> {
    const response = await this.axiosInstance.post('/refunds/', refundData);
    return response.data;
  }

  async getSalesSummary(dateRange: string = 'today', storeId?: string): Promise<any> {
    const response = await this.axiosInstance.get('/sales-summary/', {
      params: { date_range: dateRange, store_id: storeId }
    });
    return response.data;
  }

  // Utility methods
  getStoreId(): string {
    return localStorage.getItem('pos_store_id') || 'main';
  }

  getDeviceId(): string {
    return localStorage.getItem('pos_device_id') || 'unknown';
  }

  getCurrentUser(): string | null {
    const userInfo = localStorage.getItem('pos_user_info');
    if (!userInfo) return null;

    try {
      const user = JSON.parse(userInfo);
      return user.username;
    } catch (error) {
      return null;
    }
  }
}

// Create singleton instance
export const posApiClient = new POSApiClient();
