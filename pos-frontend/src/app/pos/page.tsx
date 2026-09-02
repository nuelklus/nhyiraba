'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { posApiClient, type Product, type SubscriptionInfo as SubscriptionInfoType } from '@/lib/pos-api';
// WebSocket imports removed - single terminal mode
import { formatCurrency, formatStockQuantity, getStockStatusColor, getStockStatusText } from '@/lib/utils';
import { BarcodeScanner } from '@/components/barcode/BarcodeScanner';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { ShoppingCartComponent } from '@/components/pos/ShoppingCart';
import { CartSummary } from '@/components/pos/CartSummary';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { shoppingCart, type CartItem } from '@/lib/cart';
// ConnectionStatus removed - single terminal mode
import { SearchBar } from '@/components/pos/SearchBar';
import { StockAlerts } from '@/components/pos/StockAlerts';
import { ExpiryAlerts } from '@/components/pos/ExpiryAlerts';
import { ProductCreateModal } from '@/components/pos/ProductCreateModal';
import SalesSummary from '@/components/pos/SalesSummary';
import { SubscriptionInfo } from '@/components/pos/SubscriptionInfo';

export default function POSPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCartSummary, setShowCartSummary] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<'cart' | 'details'>('cart');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductCreateModal, setShowProductCreateModal] = useState(false);
  const [isMobilePanelCollapsed, setIsMobilePanelCollapsed] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfoType | null>(null);
  const [showSubscriptionInfo, setShowSubscriptionInfo] = useState(false);
  const [salesSummaryKey, setSalesSummaryKey] = useState(0);
  // ConnectionStatus removed - single terminal mode
  useEffect(() => {
    // Check authentication
    if (!posApiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Initialize POS (WebSocket temporarily disabled for testing)
    initializePOS();
    
    return () => {
      // stockSyncManager.disconnect();
    };
  }, [router]);

  const initializePOS = async () => {
    try {
      // Load products first (critical for UI)
      await loadProducts();
      
      // Load stock alerts
      await loadStockAlerts();
      
      // Fetch subscription info
      await fetchSubscriptionInfo();

      
    } catch (error) {
      console.error('❌ Failed to initialize POS:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await posApiClient.getProducts({
        store_id: posApiClient.getStoreId()
      });
      setProducts(data.results);
      setFilteredProducts(data.results);
    } catch (error: any) {
      console.error('❌ Failed to load products:', error);
      // Only redirect on actual 401 authentication errors, not aborted requests
      if (error.response?.status === 401) {
        console.error('❌ Authentication failed, redirecting to login');
        posApiClient.logout();
        router.push('/login');
      }
      // Ignore aborted requests (component unmounting, navigation, etc.)
      if (error.code === 'ECONNABORTED' || error.message?.includes('aborted')) {
        console.log('⚠️ Request aborted (likely due to component unmounting)');
      }
    }
  };

  const loadStockAlerts = async () => {
    try {
      const alerts = await posApiClient.getLowStockAlerts(5, posApiClient.getStoreId());
      console.log('📊 Stock alerts:', alerts);
    } catch (error: any) {
      // Suppress 403 errors for restricted features (backend still logs them)
      if (error.response?.status === 403) {
        console.log('⚠️ Feature not available in current plan (403)');
        return;
      }
      console.error('❌ Failed to load stock alerts:', error);
      // Only redirect on actual 401 authentication errors, not aborted requests
      if (error.response?.status === 401) {
        console.error('❌ Authentication failed, redirecting to login');
        posApiClient.logout();
        router.push('/login');
      }
      // Ignore aborted requests (component unmounting, navigation, etc.)
      if (error.code === 'ECONNABORTED' || error.message?.includes('aborted')) {
        console.log('⚠️ Request aborted (likely due to component unmounting)');
      }
    }
  };

  const fetchSubscriptionInfo = async () => {
    try {
      const info = await posApiClient.getSubscriptionInfo();
      setSubscriptionInfo(info);
      console.log('📋 Subscription info loaded:', info);
    } catch (error) {
      console.error('❌ Failed to fetch subscription info:', error);
    }
  };

  const handleAddToCart = useCallback((product: Product) => {
    console.log('🛒 Adding to cart:', product.name);
    shoppingCart.addItem(product, 1);
    const updatedItems = shoppingCart.getItems();
    console.log('🛒 Cart items after add:', updatedItems);
    setCartItems(updatedItems);
  }, []);

  const handleCartUpdate = useCallback((items: CartItem[]) => {
    setCartItems(items);
  }, []);

  const handleCheckout = useCallback((totals: { subtotal: number; tax: number; total: number; itemCount: number }) => {
    console.log('🛒 Checkout clicked:', totals);
    console.log('🔍 Setting showPaymentModal to true');
    setShowPaymentModal(true);
    console.log('🔍 showPaymentModal state should now be true');
  }, []);

  const handlePaymentComplete = useCallback(async () => {
    console.log('💳 Payment completed, refreshing products, alerts, and sales summary');
    await loadProducts();
    await loadStockAlerts();
    setSalesSummaryKey(prev => prev + 1);
    setCartItems([]);
  }, []);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    try {
      const product = await posApiClient.getProductByBarcode(barcode, posApiClient.getStoreId());
      if (product) {
        setSelectedProduct(product);
        console.log(`🔍 Found product by barcode: ${product.name}`);
      } else {
        console.log(`❌ No product found for barcode: ${barcode}`);
        // Could show "Product not found" message
      }
    } catch (error) {
      console.error('❌ Failed to scan barcode:', error);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredProducts(products);
    } else {
      try {
        const searchResults = await posApiClient.searchProducts(query, posApiClient.getStoreId());
        setFilteredProducts(searchResults);
      } catch (error) {
        console.error('❌ Failed to search products:', error);
        // Fallback to client-side filtering
        const filtered = products.filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.sku.toLowerCase().includes(query.toLowerCase()) ||
          (product.barcode && product.barcode.includes(query))
        );
        setFilteredProducts(filtered);
      }
    }
  }, [products]);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setRightPanelView('details');
    console.log('📋 Selected product:', product.name);
  }, []);

  const handleStockUpdateRequest = useCallback(async (productId: string, newQuantity: number, changeAmount: number) => {
    try {
      const response = await posApiClient.updateStock({
        product_id: productId,
        quantity: newQuantity,
        change_amount: changeAmount,
        store_id: posApiClient.getStoreId(),
        device_id: posApiClient.getDeviceId()
      });

      console.log('✅ Stock update successful:', response);

      // Real-time sync is disabled in single-terminal mode, so update local state immediately
      const updatedFields = (p: Product): Product => ({
        ...p,
        stock_quantity: newQuantity,
        stock_sync_version: response?.sync_version ?? (p.stock_sync_version || 0) + 1,
        stock_update_source: 'pos',
        stock_updated_by: posApiClient.getCurrentUser() ?? p.stock_updated_by,
        last_pos_sync: response?.timestamp ?? new Date().toISOString(),
      });

      setProducts(prev => prev.map(p => (p.id === productId ? updatedFields(p) : p)));
      setFilteredProducts(prev => prev.map(p => (p.id === productId ? updatedFields(p) : p)));
      setSelectedProduct(prev => (prev && prev.id === productId ? updatedFields(prev) : prev));

    } catch (error) {
      console.error('❌ Failed to update stock:', error);
      // Could show error message to user
    }
  }, []);

  const handleProductCreateSuccess = useCallback(async () => {
    // Reload products after successful creation
    await loadProducts();
  }, [loadProducts]);

  // Memoize filtered products to avoid unnecessary recalculations
  const memoizedFilteredProducts = useMemo(() => {
    return filteredProducts;
  }, [filteredProducts]);

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredProducts(products);
      } else {
        // Client-side filtering for immediate feedback
        const filtered = products.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.barcode && product.barcode.includes(searchQuery))
        );
        setFilteredProducts(filtered);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img src="/GG.webp" alt="Logo" className="h-8 sm:h-10 w-auto" />
              <h1 className="text-xl sm:text-2xl font-bold" style={{
                background: 'linear-gradient(180deg, #FAE8D5 0%, #E1CF58 25%, #C59F64 55%, #91732F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                LOGO
              </h1>
              <div className="text-xs sm:text-sm text-gray-500">
                Store: {posApiClient.getStoreId()} | User: {posApiClient.getCurrentUser()}
              </div>
            </div>
            <div className="flex items-center justify-between sm:space-x-4">
              <div className="text-xs sm:text-sm text-green-600 font-medium">
                Single Terminal Mode
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSubscriptionInfo(true)}
                  className="px-2 sm:px-3 py-1 sm:py-1 text-xs sm:text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  View Subscription
                </button>
                {posApiClient.canCreateProduct() && (
                  <button
                    onClick={() => setShowProductCreateModal(true)}
                    className="px-2 sm:px-3 py-1 sm:py-1 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Create Product
                  </button>
                )}
                {posApiClient.getUserStaffRole() === 'ADMIN' && (
                  <button
                    onClick={() => router.push('/register')}
                    className="px-2 sm:px-3 py-1 sm:py-1 text-xs sm:text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    + Register Staff
                  </button>
                )}
                <button
                  onClick={() => posApiClient.logout()}
                  className="px-2 sm:px-3 py-1 sm:py-1 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-screen pt-16 sm:pt-16 pb-20 lg:pb-0">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col w-full lg:w-auto">
          {/* Search and Scanner */}
          <div className="bg-white p-3 sm:p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <SearchBar
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search products..."
                className="flex-1"
              />
              <BarcodeScanner onScan={handleBarcodeScan} className="w-full sm:w-auto" />
            </div>
          </div>

          {/* Stock Alerts */}
          <StockAlerts storeId={posApiClient.getStoreId()} />

          {/* Expiry Alerts */}
          <ExpiryAlerts storeId={posApiClient.getStoreId()} />

          {/* Sales Summary - only visible to MANAGER and ADMIN */}
          {posApiClient.canViewSalesSummary() && (
            <div className="p-2 sm:p-4">
              <SalesSummary refreshKey={salesSummaryKey} />
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 p-2 sm:p-4 overflow-auto">
            <ProductGrid
              products={memoizedFilteredProducts}
              selectedProduct={selectedProduct}
              onProductSelect={handleProductSelect}
              onStockUpdate={handleStockUpdateRequest}
              onAddToCart={handleAddToCart}
              canUpdateStock={posApiClient.canUpdateStock()}
            />
          </div>
        </div>

        {/* Right Panel - Shopping Cart */}
        <div className={`fixed inset-x-0 bottom-0 lg:sticky lg:top-16 lg:inset-auto lg:w-96 bg-white border-t lg:border-l border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out ${isMobilePanelCollapsed ? 'h-16' : 'h-[70vh]'} lg:h-[calc(100vh-4rem)]`}>
          {/* Mobile Handle for Drag Gesture */}
          <div className="lg:hidden flex justify-center py-2 border-b border-gray-200">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          {/* Panel Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => setRightPanelView('cart')}
                  className={`px-2 sm:px-3 py-1 sm:py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    rightPanelView === 'cart'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cart
                </button>
                <button
                  onClick={() => setRightPanelView('details')}
                  className={`px-2 sm:px-3 py-1 sm:py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    rightPanelView === 'details'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Details
                </button>
              </div>
              <div className="flex items-center space-x-2">
                {/* Mobile Collapse/Expand Button */}
                <button
                  onClick={() => setIsMobilePanelCollapsed(!isMobilePanelCollapsed)}
                  className="lg:hidden p-3 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors border border-gray-300"
                  aria-label={isMobilePanelCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  {isMobilePanelCollapsed ? (
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
                <ShoppingCartComponent onCartUpdate={handleCartUpdate} />
              </div>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 flex flex-col">
            {rightPanelView === 'cart' ? (
              /* Cart View */
              cartItems.length > 0 ? (
                <>
                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                    <div className="space-y-3 sm:space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.product.id} className="flex items-center space-x-2 sm:space-x-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                          {/* Product Image */}
                          {item.product.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              loading="lazy"
                              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded flex items-center justify-center">
                              <div className="text-xl sm:text-2xl text-gray-400">📦</div>
                            </div>
                          )}

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.product.name}</h4>
                            <p className="text-xs text-gray-500">{item.product.sku}</p>
                            <div className="flex items-center justify-between mt-1 sm:mt-2">
                              <span className="text-sm font-medium text-green-600">
                                {formatCurrency(parseFloat(item.product.price))}
                              </span>
                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      shoppingCart.updateQuantity(item.product.id, item.quantity - 1);
                                      setCartItems(shoppingCart.getItems());
                                    }
                                  }}
                                  className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    shoppingCart.updateQuantity(item.product.id, item.quantity + 1);
                                    setCartItems(shoppingCart.getItems());
                                  }}
                                  className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Item Total and Remove */}
                          <div className="text-right">
                            <span className="font-medium text-gray-900 block mb-2">
                              {formatCurrency(parseFloat(item.product.price) * item.quantity)}
                            </span>
                            <button
                              onClick={() => {
                                shoppingCart.removeItem(item.product.id);
                                setCartItems(shoppingCart.getItems());
                              }}
                              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cart Footer */}
                  <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-2 mb-3 sm:mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(shoppingCart.getTotals().subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (12%):</span>
                        <span>{formatCurrency(shoppingCart.getTotals().tax)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">{formatCurrency(shoppingCart.getTotals().total)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => {
                          shoppingCart.clear();
                          setCartItems([]);
                        }}
                        className="flex-1 px-4 py-3 sm:py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm sm:text-base"
                      >
                        Clear Cart
                      </button>
                      <button
                        onClick={() => handleCheckout(shoppingCart.getTotals())}
                        className="flex-1 px-4 py-3 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm sm:text-base font-semibold"
                      >
                        Checkout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty Cart */
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                    <p className="text-sm">Add products to get started</p>
                  </div>
                </div>
              )
            ) : (
              /* Product Details View */
              selectedProduct ? (
                <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                  <Cart
                    selectedProduct={selectedProduct}
                    onStockUpdate={handleStockUpdateRequest}
                    canUpdateStock={posApiClient.canUpdateStock()}
                  />
                </div>
              ) : (
                /* No Product Selected */
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium mb-2">No Product Selected</h3>
                    <p className="text-sm">Click "Select" on a product to view details</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          cartItems={cartItems}
          totals={shoppingCart.getTotals()}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Product Create Modal */}
      {showProductCreateModal && (
        <ProductCreateModal
          onClose={() => setShowProductCreateModal(false)}
          onSuccess={handleProductCreateSuccess}
        />
      )}

      {/* Subscription Info Modal */}
      {showSubscriptionInfo && subscriptionInfo && (
        <SubscriptionInfo 
          subscription={subscriptionInfo} 
          onClose={() => setShowSubscriptionInfo(false)} 
        />
      )}
    </div>
  );
}
