import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency for Ghana (GHS)
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Format phone number for Ghana (+233)
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('233') && cleaned.length === 12) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+233${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    return `+233${cleaned}`;
  }
  
  return phone; // Return original if can't format
}

// Generate device ID for POS terminals
export function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `pos_${timestamp}_${random}`;
}

// Format timestamp for display
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  return new Intl.DateTimeFormat('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Accra',
  }).format(date);
}

// Format relative time (e.g., "2 minutes ago")
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatTimestamp(date);
  }
}

// Format stock quantity with proper pluralization
export function formatStockQuantity(quantity: number): string {
  if (quantity === 0) {
    return 'Out of stock';
  } else if (quantity === 1) {
    return '1 item';
  } else {
    return `${quantity.toLocaleString()} items`;
  }
}

// Get stock status color
export function getStockStatusColor(quantity: number, lowStockThreshold: number = 5): string {
  if (quantity === 0) {
    return 'text-red-600 bg-red-50 border-red-200';
  } else if (quantity <= lowStockThreshold) {
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  } else {
    return 'text-green-600 bg-green-50 border-green-200';
  }
}

// Get stock status text
export function getStockStatusText(quantity: number, lowStockThreshold: number = 5): string {
  if (quantity === 0) {
    return 'Out of Stock';
  } else if (quantity <= lowStockThreshold) {
    return 'Low Stock';
  } else {
    return 'In Stock';
  }
}

// Validate barcode format
export function validateBarcode(barcode: string): boolean {
  // Remove spaces and check if it's alphanumeric
  const cleaned = barcode.replace(/\s/g, '');
  return /^[A-Za-z0-9]{8,20}$/.test(cleaned);
}

// Format barcode for display
export function formatBarcode(barcode: string): string {
  if (!barcode) return '';
  
  // Add spaces every 4 characters for better readability
  const cleaned = barcode.replace(/\s/g, '');
  if (cleaned.length <= 8) return cleaned;
  
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
}

// Calculate change amount
export function calculateChangeAmount(oldQuantity: number, newQuantity: number): number {
  return newQuantity - oldQuantity;
}

// Get change amount color
export function getChangeAmountColor(changeAmount: number): string {
  if (changeAmount > 0) {
    return 'text-green-600'; // Stock increased
  } else if (changeAmount < 0) {
    return 'text-red-600'; // Stock decreased
  } else {
    return 'text-gray-600'; // No change
  }
}

// Get change amount text
export function getChangeAmountText(changeAmount: number): string {
  if (changeAmount > 0) {
    return `+${changeAmount} added`;
  } else if (changeAmount < 0) {
    return `${Math.abs(changeAmount)} sold`;
  } else {
    return 'No change';
  }
}

// Debounce function for search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for frequent updates
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Local storage helpers
export const storage = {
  get: (key: string): any => {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Error handling utilities
export class POSError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'POSError';
  }
}

export function handleApiError(error: any): POSError {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 401:
        return new POSError('Authentication failed', 'AUTH_ERROR', data);
      case 403:
        return new POSError('Permission denied', 'PERMISSION_ERROR', data);
      case 404:
        return new POSError('Resource not found', 'NOT_FOUND', data);
      case 409:
        return new POSError('Stock version conflict', 'CONFLICT_ERROR', data);
      case 500:
        return new POSError('Server error', 'SERVER_ERROR', data);
      default:
        return new POSError(data.message || 'Unknown error', 'API_ERROR', data);
    }
  } else if (error.request) {
    // Network error
    return new POSError('Network connection failed', 'NETWORK_ERROR', error);
  } else {
    // Other error
    return new POSError(error.message || 'Unknown error', 'UNKNOWN_ERROR', error);
  }
}

// Validation utilities
export function validateProduct(product: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name is required');
  }
  
  if (!product.sku || product.sku.trim().length === 0) {
    errors.push('Product SKU is required');
  }
  
  if (!product.price || parseFloat(product.price) <= 0) {
    errors.push('Product price must be greater than 0');
  }
  
  if (typeof product.stock_quantity !== 'number' || product.stock_quantity < 0) {
    errors.push('Stock quantity must be a non-negative number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Generate unique ID for cart items
export function generateCartId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Calculate cart total
export function calculateCartTotal(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Calculate cart item count
export function calculateCartItemCount(items: Array<{ quantity: number }>): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}
