import { type CartItem, type CartTotals } from './cart';

export interface TaxConfig {
  rate: number;
  name: string;
  enabled: boolean;
}

export class PricingCalculator {
  private static defaultTaxRate: number = 0; // 0% tax

  // Calculate subtotal from cart items
  static calculateSubtotal(items: CartItem[]): number {
    const subtotal = items.reduce((sum, item) => {
      const itemPrice = parseFloat(item.product.price) || 0;
      return sum + (itemPrice * item.quantity);
    }, 0);
    
    return Math.round(subtotal * 100) / 100;
  }

  // Calculate tax amount
  static calculateTax(subtotal: number, taxRate: number = this.defaultTaxRate): number {
    const tax = subtotal * taxRate;
    return Math.round(tax * 100) / 100;
  }

  // Calculate total including tax
  static calculateTotal(subtotal: number, taxRate: number = this.defaultTaxRate): number {
    const tax = this.calculateTax(subtotal, taxRate);
    const total = subtotal + tax;
    return Math.round(total * 100) / 100;
  }

  // Calculate complete totals
  static calculateTotals(items: CartItem[], taxRate: number = this.defaultTaxRate): CartTotals {
    const subtotal = this.calculateSubtotal(items);
    const tax = this.calculateTax(subtotal, taxRate);
    const total = this.calculateTotal(subtotal, taxRate);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      tax,
      total,
      itemCount
    };
  }

  // Format currency for display
  static formatCurrency(amount: number, currency: string = 'GHS'): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Calculate change amount
  static calculateChange(totalPaid: number, totalAmount: number): number {
    const change = totalPaid - totalAmount;
    return Math.round(Math.max(0, change) * 100) / 100;
  }

  // Validate payment amount
  static isValidPaymentAmount(amount: number, totalAmount: number): boolean {
    return amount >= totalAmount && amount > 0;
  }

  // Set default tax rate
  static setDefaultTaxRate(rate: number): void {
    this.defaultTaxRate = Math.max(0, Math.min(1, rate)); // Clamp between 0 and 1
  }

  // Get default tax rate
  static getDefaultTaxRate(): number {
    return this.defaultTaxRate;
  }

  // Get tax percentage for display
  static getTaxPercentage(rate: number = this.defaultTaxRate): string {
    return `${Math.round(rate * 100)}%`;
  }

  // Calculate discount amount
  static calculateDiscount(subtotal: number, discountPercentage: number): number {
    const discount = subtotal * (discountPercentage / 100);
    return Math.round(discount * 100) / 100;
  }

  // Apply discount to subtotal
  static applyDiscount(subtotal: number, discountPercentage: number): number {
    const discount = this.calculateDiscount(subtotal, discountPercentage);
    return Math.round((subtotal - discount) * 100) / 100;
  }

  // Calculate item line total
  static calculateItemTotal(item: CartItem): number {
    const itemPrice = parseFloat(item.product.price) || 0;
    const total = itemPrice * item.quantity;
    return Math.round(total * 100) / 100;
  }
}

// Tax configurations for different regions
export const taxConfigs: { [key: string]: TaxConfig } = {
  'Ghana': { rate: 0, name: 'VAT', enabled: true },
  'Nigeria': { rate: 0.075, name: 'VAT', enabled: true },
  'Kenya': { rate: 0.16, name: 'VAT', enabled: true },
  'Default': { rate: 0, name: 'Tax', enabled: true }
};

// Get tax config by country
export const getTaxConfig = (country: string = 'Ghana'): TaxConfig => {
  return taxConfigs[country] || taxConfigs['Default'];
};
