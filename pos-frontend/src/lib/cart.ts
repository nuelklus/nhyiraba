import { type Product } from './pos-api';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

export class ShoppingCart {
  private items: CartItem[] = [];
  private taxRate: number = 0; // 0% tax rate

  // Add item to cart
  addItem(product: Product, quantity: number = 1): void {
    console.log('🛒 ShoppingCart.addItem called:', product.name, quantity);
    const existingItem = this.items.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      console.log('🛒 Updated existing item, new quantity:', existingItem.quantity);
    } else {
      this.items.push({
        product,
        quantity,
        addedAt: new Date().toISOString()
      });
      console.log('🛒 Added new item, total items:', this.items.length);
    }
    
    console.log('🛒 Cart items after add:', this.items);
  }

  // Remove item from cart
  removeItem(productId: string): void {
    this.items = this.items.filter(item => item.product.id !== productId);
  }

  // Update item quantity
  updateQuantity(productId: string, quantity: number): void {
    const item = this.items.find(item => item.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
      }
    }
  }

  // Get all items
  getItems(): CartItem[] {
    console.log('🛒 ShoppingCart.getItems called, returning:', this.items.length, 'items');
    return [...this.items];
  }

  // Clear cart
  clear(): void {
    this.items = [];
  }

  // Calculate totals
  getTotals(): CartTotals {
    const subtotal = this.items.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    const tax = subtotal * this.taxRate;
    const total = subtotal + tax;
    const itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount
    };
  }

  // Set tax rate
  setTaxRate(rate: number): void {
    this.taxRate = rate;
  }

  // Get tax rate
  getTaxRate(): number {
    return this.taxRate;
  }

  // Check if cart is empty
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  // Get item count
  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Get item by product ID
  getItem(productId: string): CartItem | undefined {
    return this.items.find(item => item.product.id === productId);
  }

  // Calculate total value of specific item
  getItemTotal(item: CartItem): number {
    return Math.round((parseFloat(item.product.price) * item.quantity) * 100) / 100;
  }
}

// Create singleton instance
export const shoppingCart = new ShoppingCart();
