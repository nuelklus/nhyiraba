
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
const Cookies = require('js-cookie');

import { 
  Product, 
  ProductImage, 
  TechnicalSpec, 
  StockStatus, 
  Warehouse, 
  SearchFilters,
  SearchResult 
} from '../types/product';
import { DatabaseErrorHandler } from '../utils/databaseErrorHandler';

export type { SearchFilters };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'CUSTOMER' | 'PRO_CONTRACTOR' | 'ADMIN';
  phone_number: string;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  phone_number: string;
}

export interface LoginData {
  username: string;
  password: string;
}

const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  USER: 'user_data',
};

const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; 

const pendingRequests = new Map<string, Promise<any>>();

export interface ProductDetail extends Omit<Product, 'weight' | 'cost_price' | 'dimensions' | 'condition' | 'track_stock' | 'stock_quantity' | 'low_stock_threshold' | 'is_active' | 'is_digital'> {
  description: string;
  barcode: string | null;
  cost_price: number | null;
  condition: string;
  weight?: string | null;
  dimensions: string;
  track_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_digital: boolean;
  images: {
    id: number;
    image: string;
    alt_text: string;
    is_primary: boolean;
    sort_order: number;
  }[];
  specifications: {
    label: string;
    value: string;
    spec_type: string;
  }[];
  warehouse_stock: {
    warehouse: {
      id: number;
      name: string;
      code: string;
    };
    quantity: number;
    last_updated: string;
  }[];
  reviews: {
    id: number;
    user: string;
    rating: number;
    title: string;
    content: string;
    is_verified: boolean;
    created_at: string;
  }[];
  average_rating: number;
  meta_title: string;
  meta_description: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  parent: number | null;
  is_active: boolean;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  website: string | null;
  is_active: boolean;
}

export interface CategoryFallback {
  occurred: boolean;
  requested_category: string;
  message: string;
}

export interface ProductsResponse {
  results: Product[];
  count: number;
  next: string | null;
  previous: string | null;
  category_fallback?: CategoryFallback;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private debouncedRequests: Map<string, NodeJS.Timeout> = new Map();
  private hasApiPrefix: boolean;

  constructor() {
    // Check if base URL already has /api
    this.hasApiPrefix = API_BASE_URL.includes('/api');
    
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.getAuthToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          const tokens = this.getTokens();
          
          if (tokens?.refresh) {
            try {
              const response = await this.refreshToken(tokens.refresh);
              this.setTokens(response, this.getUser()!);
              error.config.headers.Authorization = `Bearer ${response.access}`;
              return this.axiosInstance(error.config);
            } catch (refreshError) {
              this.clearTokens();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          } else {
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
        
        // Auto-logout on any 401 or 403 (forbidden)
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Check if there's an active transaction before auto-logout
          const hasActiveTransaction = this.checkActiveTransaction();
          
          if (hasActiveTransaction) {
            // Store the error for later handling after transaction ends
            this.storeAuthError(error);
            return Promise.reject(error);
          } else {
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private getCacheKey(endpoint: string, params: any = {}): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    cache.set(key, { data, timestamp: Date.now(), ttl: CACHE_TTL });
  }

  private parseJwtPayload(token: string): any | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  private isTokenUsable(token: string | null): boolean {
    if (!token) return false;

    const payload = this.parseJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') {
      return false;
    }

    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime + 5;
  }

  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      const cookieToken = Cookies.get(TOKEN_KEYS.ACCESS);
      const storageToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const token = cookieToken || storageToken;

      if (!token) {
        return null;
      }

      if (!this.isTokenUsable(token)) {
        this.clearAuthToken();
        return null;
      }

      return token;
    }
    return null;
  }

  private clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      
      Cookies.remove(TOKEN_KEYS.ACCESS);
      Cookies.remove(TOKEN_KEYS.REFRESH);
      Cookies.remove(TOKEN_KEYS.USER);
    }
  }

  private setTokens(tokens: AuthTokens, user: User): void {
    if (typeof window !== 'undefined') {
      
      Cookies.set(TOKEN_KEYS.ACCESS, tokens.access, {
        expires: 1, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      
      Cookies.set(TOKEN_KEYS.REFRESH, tokens.refresh, {
        expires: 7, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
    }
  }

  private getTokens(): AuthTokens | null {
    if (typeof window !== 'undefined') {
      const access = Cookies.get(TOKEN_KEYS.ACCESS);
      const refresh = Cookies.get(TOKEN_KEYS.REFRESH);
      
      if (access && refresh) {
        return { access, refresh };
      }
    }
    return null;
  }

  getUser(): User | null {
    try {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem(TOKEN_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      Cookies.remove(TOKEN_KEYS.ACCESS);
      Cookies.remove(TOKEN_KEYS.REFRESH);
      localStorage.removeItem(TOKEN_KEYS.USER);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeRemaining = payload.exp - currentTime;
      
      if (timeRemaining <= 0) {
        return true;
      }
      
      return false;
    } catch {
      return true;
    }
  }

  private async ensureValidToken(): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      return;
    }
    
    // Check token expiration and validity
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeRemaining = payload.exp - currentTime;
      
      // Only refresh if less than 5 minutes remaining
      if (timeRemaining <= 300) {
        const tokens = this.getTokens();
        
        if (tokens?.refresh) {
          try {
            const response = await this.refreshToken(tokens.refresh);
            this.setTokens(response, this.getUser()!);
          } catch (error) {
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
      }
    } catch (error) {
      // Silently ignore token parsing errors
    }
  }

  async validateTokenWithServer(token: string): Promise<boolean> {
    try {
      const response = await this.request<{ valid: boolean }>('/accounts/validate-token/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      return response.valid === true;
    } catch (error) {
      return false;
    }
  }

  async checkTokenExpiryAndLogout(): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      return;
    }
    
    // Skip validation if there's an active transaction
    if (this.checkActiveTransaction()) {
      return;
    }
  
    // Validate token with server
    const isValid = await this.validateTokenWithServer(token);
    if (!isValid) {
      this.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  private checkActiveTransaction(): boolean {
    // Check if there's an active transaction flag in localStorage
    const hasActiveTransaction = localStorage.getItem('hasActiveTransaction');
    return hasActiveTransaction === 'true';
  }

  private storeAuthError(error: any): void {
    // Store the auth error for later handling
    localStorage.setItem('pendingAuthError', JSON.stringify({
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      timestamp: Date.now()
    }));
  }

  clearPendingAuthError(): void {
    localStorage.removeItem('pendingAuthError');
  }

  getPendingAuthError(): any {
    const error = localStorage.getItem('pendingAuthError');
    return error ? JSON.parse(error) : null;
  }

  async request<T>(
    endpoint: string,
    options: AxiosRequestConfig & { skipCache?: boolean } = {}
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, options.params);
    
    // Create a unique deduplication key that includes params
    const deduplicationKey = `${endpoint}_${JSON.stringify(options.params || {})}`;
     
    if (options.method?.toUpperCase() === 'PATCH' || options.skipCache) {
      // Skip cache for PATCH requests or when skipCache is true
    } else {
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Request deduplication with unique key
    const pendingRequest = pendingRequests.get(deduplicationKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    const fullUrl = `${this.axiosInstance.defaults.baseURL}${endpoint}`;
    const paramString = options.params ? `?${new URLSearchParams(options.params).toString()}` : '';
    const absoluteUrl = `${fullUrl}${paramString}`;
    

    const requestPromise = (async () => {
      try {
        const response: AxiosResponse<T> = await this.axiosInstance.request({
          url: endpoint,
          ...options,
        });

       
        if (response.status === 200 && (!options.method || options.method.toUpperCase() === 'GET')) {
          this.setCache(cacheKey, response.data);
        }

        return response.data;
      } catch (error: any) {
        // Handle API request errors

        if (error.response) {

          const { status, data } = error.response;
          let errorMessage = `API Error: ${status}`;

          if (status === 500) {
            errorMessage = 'Internal Server Error - The server encountered an unexpected error';
          } else if (status === 404) {
            errorMessage = 'Endpoint not found - The requested resource does not exist';
          } else if (status === 403) {
            errorMessage = 'Forbidden - You do not have permission to access this resource';
          } else if (status === 401) {
            errorMessage = 'Unauthorized - Authentication required';
          } else if (data?.error) {
            errorMessage = data.error;
            // Clean up the error message if it contains ErrorDetail wrapper
            if (errorMessage.includes('ErrorDetail')) {
              // Extract the actual message from ErrorDetail
              const match = errorMessage.match(/string="([^"]+)"/);
              if (match) {
                errorMessage = match[1].replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
              }
            }
          } else if (data?.message) {
            errorMessage = data.message;
          }

          // Create error with response information
          const apiError = new Error(errorMessage) as any;
          apiError.response = error.response;
          apiError.status = status;
          apiError.data = data;
          throw apiError;
        } else if (error.request) {
          
          const networkError = new Error('Network error - Unable to connect to the server. Please check your internet connection.');
          return DatabaseErrorHandler.handleDatabaseError(networkError, () => this.request(endpoint, options));
        } else {
          
          const unexpectedError = new Error(error.message || 'An unexpected error occurred');
          return DatabaseErrorHandler.handleDatabaseError(unexpectedError, () => this.request(endpoint, options));
        }
      } finally {
        
        pendingRequests.delete(deduplicationKey);
      }
    })();

    pendingRequests.set(deduplicationKey, requestPromise);

    return requestPromise;
  }

  debouncedSearch(
    query: string, 
    filters: SearchFilters = {}, 
    delay: number = 300
  ): Promise<ProductsResponse> {
    const cacheKey = `search_${query}_${JSON.stringify(filters)}`;

    if (this.debouncedRequests.has(cacheKey)) {
      clearTimeout(this.debouncedRequests.get(cacheKey)!);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        try {
          const result = await this.getProducts({ ...filters, search: query });
          resolve(result);
          this.debouncedRequests.delete(cacheKey);
        } catch (error) {
          reject(error);
          this.debouncedRequests.delete(cacheKey);
        }
      }, delay);

      this.debouncedRequests.set(cacheKey, timeoutId);
    });
  }

  async getInitialData(): Promise<{
    featured_products: Product[];
    categories: Category[];
    brands: Brand[];
  }> {
    console.log('🌐 apiClient.getInitialData - Starting...');
    console.log('🌐 apiClient.getInitialData - Base URL:', this.axiosInstance.defaults.baseURL);

    try {
      const [featuredProductsResult, categoriesResult, brandsResult] = await Promise.allSettled([
        this.getFeaturedProducts(),
        this.getCategories(),
        this.getBrands()
      ]);

      const featured_products = featuredProductsResult.status === 'fulfilled' ? featuredProductsResult.value : [];
      const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
      const brands = brandsResult.status === 'fulfilled' ? brandsResult.value : [];

      console.log('✅ apiClient.getInitialData - Data fetch complete');
      console.log('✅ apiClient.getInitialData - Featured products:', featured_products.length);
      console.log('✅ apiClient.getInitialData - Categories:', categories.length);
      console.log('✅ apiClient.getInitialData - Brands:', brands.length);

      if (featuredProductsResult.status === 'rejected' && categoriesResult.status === 'rejected' && brandsResult.status === 'rejected') {
        throw featuredProductsResult.reason;
      }

      return { featured_products, categories, brands };
    } catch (error) {
      console.error('❌ apiClient.getInitialData - Error:', error);
      throw error;
    }
  }

  async getProducts(filters: SearchFilters = {}, options: { skipCache?: boolean } = {}): Promise<ProductsResponse> {
    const params: any = {};

    if (filters.category) params.category = filters.category.toString();
    if (filters.brand) params.brand = filters.brand.toString();
    if (filters.condition) params.condition = filters.condition;
    if (filters.is_featured) params.is_featured = 'true';
    if (filters.inStock) params.in_stock = 'true';
    if (filters.min_price) params.min_price = filters.min_price.toString();
    if (filters.max_price) params.max_price = filters.max_price.toString();
    if (filters.search) params.search = filters.search;
    if (filters.category_slug) params.category_slug = filters.category_slug;
    if (filters.brand_slug) params.brand_slug = filters.brand_slug;
    if (filters.ordering) params.ordering = filters.ordering;
    if (filters.page) params.page = filters.page.toString();
    if (filters.page_size) params.page_size = filters.page_size.toString();

    const endpoint = '/products/public/';  
    
    const result = await this.request<ProductsResponse>(endpoint, {
      method: 'GET',
      params,
      skipCache: options.skipCache,
    });
    
    return result;
  }

  async getProductBySlug(slug: string): Promise<ProductDetail> {
    return this.request<ProductDetail>(`/products/${slug}/`);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    console.log('🌐 apiClient.getFeaturedProducts - Starting...');
    console.log('🌐 apiClient.getFeaturedProducts - Endpoint: /products/featured/');

    try {
      const result = await this.request<Product[]>('/products/featured/');
      console.log('✅ apiClient.getFeaturedProducts - Success:', result.length, 'products');
      return result;
    } catch (error) {
      console.error('❌ apiClient.getFeaturedProducts - Error:', error);
      throw error;
    }
  }

  async getSearchSuggestions(query: string): Promise<{
    products: Array<{ id: number; name: string; slug: string; sku: string }>;
    categories: Array<{ id: number; name: string; slug: string }>;
    brands: Array<{ id: number; name: string; slug: string }>;
  }> {
    return this.request('/products/search/', {
      method: 'GET',
      params: { q: query },
    });
  }

  async getCategories(): Promise<Category[]> {
    try {
      // Add timeout and use direct fetch as fallback
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Categories request timeout')), 5000)
      );
      
      const requestPromise = this.request<Category[]>('/products/categories/', { skipCache: true });
      
      const result = await Promise.race([requestPromise, timeoutPromise]) as Category[];
      return result;
    } catch (error) {
      try {
        const response = await fetch(`${this.axiosInstance.defaults.baseURL}/products/categories/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data;
      } catch (fallbackError) {
        throw error; // Throw original error
      }
    }
  }

  async getCategoryBySlug(slug: string): Promise<{
    category: Category;
    products: Product[];
  }> {
    return this.request(`/products/categories/${slug}/`);
  }

  async getBrands(): Promise<Brand[]> {
    try {
      // Add timeout and use direct fetch as fallback
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Brands request timeout')), 5000)
      );
      
      const requestPromise = this.request<Brand[]>('/products/brands/', { skipCache: true });
      
      const result = await Promise.race([requestPromise, timeoutPromise]) as Brand[];
      return result;
    } catch (error) {
      try {
        const response = await fetch(`${this.axiosInstance.defaults.baseURL}/products/brands/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data;
      } catch (fallbackError) {
        throw error; // Throw original error
      }
    }
  }

  async getBrandBySlug(slug: string): Promise<{
    brand: Brand;
    products: Product[];
  }> {
    return this.request(`/products/brands/${slug}/`);
  }

  async getWarehouses(): Promise<Warehouse[]> {
    return this.request<Warehouse[]>('/products/warehouses/');
  }

  async createProduct(productData: {
    name: string
    slug: string
    sku?: string
    short_description: string
    description?: string
    price: string
    compare_price?: string
    category: number
    brand: number
    condition: string
    weight?: string
    dimensions: string
    track_stock: boolean
    stock_quantity: number
    low_stock_threshold: number
    is_active: boolean
    is_featured: boolean
    is_digital: boolean
    image_url?: string
  }) {
    return this.request('/products/create/', {
      method: 'POST',
      data: productData,
    });
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const requestData = { username, password };
    const response: AxiosResponse<LoginResponse> = await this.axiosInstance.post('/accounts/login/', requestData);

    this.setTokens(response.data.tokens, response.data.user);
    return response.data;
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response: AxiosResponse<RegisterResponse> = await this.axiosInstance.post('/accounts/register/', data);

    this.setTokens(response.data.tokens, response.data.user);
    return response.data;
  }

  async logout(): Promise<{ message: string }> {
    try {
      const tokens = this.getTokens();
      if (tokens?.refresh) {
        const response: AxiosResponse<{ message: string }> = await this.axiosInstance.post('/accounts/logout/', {
          refresh: tokens.refresh,
        });
        this.clearTokens();
        return response.data;
      }
    } catch (error) {
      // Logout request failed
    } finally {
      this.clearTokens();
    }
    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const response: AxiosResponse<AuthTokens> = await axios.post(
        `${API_BASE_URL}/accounts/refresh/`,
        { refresh: refreshToken }
      );
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.axiosInstance.get('/accounts/profile/');
    return response.data;
  }

  isAuthenticated(): boolean {
    const tokens = this.getTokens();
    return !!tokens && !this.isTokenExpired(tokens.access);
  }

  async getCurrentUserWithValidation(): Promise<User | null> {
    const user = this.getUser();
    if (!user) {
      return null;
    }

    const token = this.getAuthToken();
    if (!token) {
      return null;
    }

    // Validate token with server
    const isValid = await this.validateTokenWithServer(token);
    if (!isValid) {
      this.clearTokens();
      return null;
    }

    return user;
  }

  getCurrentUser(): User | null {
    return this.getUser();
  }
}

export const apiClient = new ApiClient();

export const {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getSearchSuggestions,
  getCategories,
  getCategoryBySlug,
  getBrands,
  getBrandBySlug,
  getWarehouses,
  login,
  register,
  logout,
  refreshToken,
  getProfile,
  isAuthenticated,
  getCurrentUser,
  getCurrentUserWithValidation,
  validateTokenWithServer,
  checkTokenExpiryAndLogout,
} = apiClient;
