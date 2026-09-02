'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Phone,
  MapPin,
  Wrench,
  CheckCircle,
  Upload,
  Package,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from '@/contexts/LocationContext';
import HardwareNavigation from './HardwareNavigation';
import { apiClient } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CartDropdown } from '@/components/cart/CartDropdown';

function SearchComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
    if ((window as any).searchTimeout) {
      clearTimeout((window as any).searchTimeout);
    }

    (window as any).searchTimeout = setTimeout(async () => {
      if (value.trim()) {
        setIsSearching(true);
        try {
          const response = await apiClient.debouncedSearch(value, {}, 300);
          setSearchResults(response.results || []);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
  };

  const handleProductSelect = (product: any) => {
    router.push(`/products/${product.slug}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/products') {
      const searchParam = searchParams.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, [searchParams]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative flex-1 max-w-xl search-container">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search baby food, skincare, clothing, nursery essentials..."
            className="pl-12 pr-12 h-12 bg-gray-50 border-gray-300 focus:border-brand-pink focus:ring-2 focus:ring-brand-pink text-brand-charcoal shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}

          />
          
          {}
          <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 z-50 ${
            searchQuery && (searchResults.length > 0 || isSearching) 
              ? 'opacity-100 visible' 
              : 'opacity-0 invisible'
          }`}>
            {isSearching ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2">
                  {searchResults.slice(0, 5).map((product: any) => (
                    <div
                      key={product.id}
                      className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                        <img
                          src={product.image_url || '/images/product-placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/product-placeholder.png';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.brand?.name} • {product.category?.name}
                        </div>
                        <div className="text-sm font-semibold text-brand-yellow">
                          GHS {parseFloat(product.price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {searchResults.length > 5 && (
                  <div className="p-3 border-t border-gray-100 text-center">
                    <button className="text-sm text-brand-yellow hover:text-brand-yellow/80 font-medium">
                      View all {searchResults.length} results →
                    </button>
                  </div>
                )}
              </div>
            ) : searchQuery ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No products found for "{searchQuery}"
              </div>
            ) : (
              <div className="p-4">
                <div className="text-sm text-gray-500 text-center">
                  Start typing to search for products...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent className="p-0 max-w-2xl">
          <Command className="rounded-lg border shadow-md">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Search baby essentials, skincare, clothing, feeds & care..." 
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                value={searchQuery}
                onValueChange={handleSearchInputChange}
              />
            </div>
            <CommandList>
              {isSearching ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <CommandGroup heading="Products - Click to view category">
                  {searchResults.slice(0, 8).map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => handleProductSelect(product)}
                      className="flex items-center p-2 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                        <img
                          src={product.image_url || '/images/product-placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/product-placeholder.png';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.brand?.name} • {product.category?.name}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-brand-yellow ml-2">
                        GHS {parseFloat(product.price).toLocaleString()}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : searchQuery ? (
                <CommandEmpty>No products found for "{searchQuery}"</CommandEmpty>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Type to search for products...
                </div>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const Header: React.FC = () => {
  const { itemCount: cartItemCount } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLoading, isTokenValid } = useAuth();
  const { selectedWarehouse, setSelectedWarehouse, warehouses } = useLocation();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;

      if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.setItem('previousPage', currentPath);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    if (warehouse) {
      setSelectedWarehouse(warehouse);

      localStorage.setItem('selectedWarehouse', warehouseId);

      console.log(`Warehouse changed to: ${warehouse.name}`);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWarehouseId = localStorage.getItem('selectedWarehouse');
      if (savedWarehouseId) {
        handleWarehouseChange(savedWarehouseId);
      }
    }
  }, [handleWarehouseChange]);

  return (
    <>
      {}
      <header className="sticky top-0 z-50 border-b border-pink-100 bg-white/90 shadow-[0_10px_30px_rgba(17,24,39,0.03)] backdrop-blur-sm">
        <div className="container mx-auto px-4">
          {}
          <div className="hidden lg:flex items-center justify-between py-2 text-sm text-brand-charcoal border-b border-gray-100/80">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-brand-pink" />
                <select
                  value={selectedWarehouse.id}
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  className="bg-transparent border-none text-brand-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-brand-pink rounded px-2 py-1 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-xs text-brand-pink font-medium">
                  {selectedWarehouse.estimatedDelivery}
                </span>
              </div>

              <div className="flex items-center text-brand-charcoal">
                <Phone className="h-4 w-4 mr-1 text-brand-pink" />
                <span>{selectedWarehouse.phone}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="flex items-center text-brand-charcoal">
                <span className="text-brand-pink font-medium">GHS</span>
                <span className="ml-1">Pricing</span>
              </span>
              <span className="flex items-center text-brand-charcoal">
                <CheckCircle className="h-4 w-4 text-brand-green mr-1" />
                <span>Nationwide delivery</span>
              </span>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">We accept:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-8 h-5 bg-gray-800 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                  <div className="w-8 h-5 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">MC</div>
                  <div className="w-8 h-5 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">MoMo</div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-pink-50">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-pink-100 bg-white shadow-[0_8px_20px_rgba(241,39,123,0.25)]">
                <img
                  src="/images/trendykiddosgh-logo.jpeg"
                  alt="Trendy Kiddos logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="leading-tight">
                <div className="text-base font-black tracking-[-0.06em] text-brand-charcoal sm:text-xl md:text-[1.7rem]">Trendy Kiddos</div>
                <div className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">Mother &amp; Baby</div>
              </div>
            </Link>

            <div className="hidden lg:flex flex-1 max-w-3xl mx-8">
              <Suspense fallback={<div className="w-full h-12 bg-gray-100 rounded-lg animate-pulse"></div>}>
                <SearchComponent />
              </Suspense>
            </div>

            {}
            <div className="hidden lg:flex items-center space-x-6">
              {}
              <HardwareNavigation />
              
              {}
              <div className="flex items-center space-x-4">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                ) : isAuthenticated ? (
                  <>
                    {}
                    <div className="relative group">
                      <Link href="/dashboard">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-brand-charcoal hover:text-brand-pink hover:bg-brand-pink/10 px-3"
                        >
                          <User className="h-5 w-5" />
                          <span className="ml-2 hidden xl:inline">{user?.username}</span>
                        </Button>
                      </Link>
                      
                      {}
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="p-4">
                          <div className="border-b border-gray-100 pb-3 mb-3">
                            <p className="text-sm font-medium text-brand-charcoal">{user?.username}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs bg-brand-pink/10 text-brand-charcoal px-2 py-1 rounded">
                                {user?.role}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Link href="/dashboard" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                              Dashboard
                            </Link>
                            {user?.role === 'ADMIN' && isTokenValid && (
                              <>
                                <Link href="/admin/products" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                                  <Package className="inline h-3 w-3 mr-1" />
                                  Manage Products
                                </Link>
                                <Link href="/admin/products/new" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                                  <Plus className="inline h-3 w-3 mr-1" />
                                  Add Product
                                </Link>
                                <Link href="/admin/orders" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                                  <ShoppingCart className="inline h-3 w-3 mr-1" />
                                  Manage Orders
                                </Link>
                                <Link href="/admin/inventory" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                                  <Package className="inline h-3 w-3 mr-1" />
                                  Inventory
                                </Link>
                              </>
                            )}
                            <Link href="/orders" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                              Order History
                            </Link>
                            <div className="border-t border-gray-100 mt-2 pt-2">
                              <button 
                                onClick={handleLogout}
                                className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                Sign Out
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {}
                    <Link href="/login" prefetch={true}>
                      <Button variant="ghost" size="sm" className="rounded-full px-4 text-brand-charcoal hover:bg-brand-pink/10 hover:text-brand-pink">
                        <User className="h-5 w-5 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}

                {}
                <CartDropdown>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="relative rounded-full border-brand-charcoal px-3 hover:border-brand-pink hover:bg-brand-pink/10 hover:text-brand-pink"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {isClient && cartItemCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold bg-brand-pink text-white border-white"
                      >
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </CartDropdown>
              </div>
            </div>

            {}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <div className="space-y-3">
                <Suspense fallback={<div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse"></div>}>
                  <SearchComponent />
                </Suspense>
                
                <div className="flex flex-col space-y-2">
                  <Link href="/products" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-brand-charcoal hover:text-brand-pink hover:bg-brand-pink/10">
                      Collections
                    </Button>
                  </Link>
                  {}
                  
                  {isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-10 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="h-10 w-full bg-gray-200 rounded"></div>
                    </div>
                  ) : isAuthenticated ? (
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-brand-charcoal hover:text-brand-pink hover:bg-brand-pink/10">
                        <User className="h-4 w-4 mr-2" />
                        {user?.username}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" prefetch={true} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-brand-charcoal hover:text-brand-pink hover:bg-brand-pink/10">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full bg-brand-pink hover:bg-brand-pink/90 text-white font-medium rounded-full">Register</Button>
                      </Link>
                    </>
                  )}
                  
                  <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start border-brand-charcoal hover:border-brand-pink hover:text-brand-pink hover:bg-brand-pink/10">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Cart {isClient && cartItemCount > 0 && `(${cartItemCount})`}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
