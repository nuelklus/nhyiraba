'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiClient, ProductDetail, SearchFilters, ProductsResponse, CategoryFallback } from '@/lib/api';
import { Product } from '@/types/product';
import { useCache } from './useCache';
import { memoryCache } from './useCache';

interface UseProductsOptions {
  immediate?: boolean;
  filters?: SearchFilters;
}

const transformProduct = (product: any) => {

  let imageUrl = product.image_url;

  if (imageUrl && imageUrl.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    imageUrl = `${baseUrl}${imageUrl}`;
  }
  
  // Add fallback if no image URL exists
  if (!imageUrl) {
    imageUrl = '/images/no-image-available.svg';
  }
  
  return {
    id: product.id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.short_description,
    price: parseFloat(product.price),
    currency: 'GHS' as const,
    originalPrice: product.compare_price ? parseFloat(product.compare_price) : undefined,
    image: imageUrl, 
    category: product.category?.name || 'Unknown',
    brand: product.brand?.name || 'Unknown',
    rating: product.average_rating || 4.5,
    reviewCount: product.reviews?.length || 0,
    technicalSpecs: product.specifications?.map((spec: any) => ({
      label: spec.label,
      value: spec.value,
      type: spec.spec_type || 'other'
    })) || [],
    stockStatus: product.stock_status?.status === 'in_stock' ? 'in_stock' : 
                product.stock_status?.status === 'low_stock' ? 'low_stock' : 'out_of_stock' as const,
    warehouse: {
      id: "1",
      name: "Tema Warehouse",
      location: "Tema",
      phone: "+233 24 123 4567"
    },
    sku: product.sku,
  } as Product;
};

export function useProducts(options: UseProductsOptions = {}) {
  const { immediate = false, filters: externalFilters = {} } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFallback, setCategoryFallback] = useState<CategoryFallback | null>(null);
  const [isChangingFilters, setIsChangingFilters] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [filters, setFilters] = useState<SearchFilters>(externalFilters);
  const filtersRef = useRef(filters); // Add ref to always get current filters
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref whenever filters change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Sync filters when externalFilters change (this is the key fix!)
  useEffect(() => {
    console.log('🔄 Filter change detected:', externalFilters);
    
    // Clear products immediately and set loading to prevent flash
    setProducts([]);  // Clear old products immediately!
    setLoading(true);
    setIsChangingFilters(true);  // Set flag to prevent cached data
    
    setFilters(externalFilters);
    // Update filtersRef immediately to prevent race condition
    filtersRef.current = externalFilters;
    
    console.log('⏸️ isChangingFilters set to TRUE - blocking old data');
    
    // Increase loading delay to ensure no flash
    const minLoadingTimer = setTimeout(() => {
      console.log('✅ isChangingFilters set to FALSE - allowing new data');
      setIsChangingFilters(false);  // Clear flag after loading
    }, 200);
    
    return () => clearTimeout(minLoadingTimer);
  }, [externalFilters]);

  const memoizedTransformProduct = useMemo(() => transformProduct, []);

  const [filterVersion, setFilterVersion] = useState(0);
  
  const cacheKey = useMemo(() => {
    const key = `products_${JSON.stringify(filters)}_${JSON.stringify({ page: 1 })}_${filterVersion}`;
    console.log('🔑 Cache key generated:', key);
    return key;
  }, [filters, filterVersion]);

  // Create a fetcher that always uses current filters via ref
  const fetcher = useCallback(() => {
    const currentFilters = filtersRef.current; // Always get current filters
    console.log('� ===== MAKING PRODUCTS API CALL =====');
    console.log('� Making API call with filters:', currentFilters);
    console.log('🌐 API URL will be: /api/products/public/ with filters:', currentFilters);
    console.log('🔄 Cache key being used:', cacheKey);
    console.log('🔍 filtersRef.current:', filtersRef.current);
    console.log('🔍 filters state:', filters);
    console.log('🔍 externalFilters:', externalFilters);
    console.log('🚀 ===== END API CALL DETAILS =====');
    // Force skip cache for products to ensure fresh data
    return apiClient.getProducts({ ...currentFilters, page: 1, page_size: 12 }, { skipCache: true });
  }, [cacheKey, filters]); // Add filters dependency to ensure fresh calls

  // Disable cache to fix header dropdown issues
  const { data: cachedData, loading: cacheLoading, error: cacheError, invalidate } = useCache(
    cacheKey,
    fetcher,
    0 // Disable cache for products to ensure fresh data
  );

  useEffect(() => {
    if (cachedData && !cacheLoading && !cacheError && !isChangingFilters) {
      const products = cachedData.results || [];
      const count = cachedData.count || products.length;
      const nextPage = cachedData.next;
      const previousPage = cachedData.previous;

      const transformedProducts = products.map(memoizedTransformProduct) as Product[];
      
      // CRITICAL: Only update products when NOT changing filters
      // This completely prevents old data flash
      if (!isChangingFilters) {
        setProducts(transformedProducts);
        console.log('✅ Products updated - no flash');
      } else {
        console.log('⏸️ Products update blocked - changing filters');
      }

      setPagination({
        currentPage: 1,
        totalPages: Math.ceil(count / 12) || 1,
        totalCount: count,
        hasNext: !!nextPage,
        hasPrevious: !!previousPage,
      });

      if (cachedData.category_fallback) {
        setCategoryFallback(cachedData.category_fallback);
      } else {
        setCategoryFallback(null);
      }
      
      // Only complete loading when not changing filters
      if (!isChangingFilters) {
        setTimeout(() => {
          setLoading(false);
          setError(null);
          console.log('⏳ Loading completed');
        }, 150);
      }
    } else if (cacheLoading) {
      setLoading(true);
      setError(null);
    } else if (cacheError) {
      setLoading(false);
      setError(cacheError);
    }
  }, [cachedData, cacheLoading, cacheError, isChangingFilters]);

  const fetchProducts = useCallback(async (newFilters?: SearchFilters, page: number = 1) => {
    setLoading(true);
    setError(null);
    setCategoryFallback(null);

    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const filtersWithPagination = {
        ...newFilters,
        ...filters,
        page: page,
        page_size: 12, 
      };
      
      console.log('🔍 Fetching products with filters:', filtersWithPagination);
      const response: ProductsResponse = await apiClient.getProducts(filtersWithPagination);
      
      console.log('📦 Full API response:', response);
      console.log('🏷️ Category fallback in response:', response.category_fallback);

      const products = response.results || [];
      const count = response.count || products.length;
      const nextPage = response.next;
      const previousPage = response.previous;

      const transformedProducts = products.map(memoizedTransformProduct) as Product[];

      setProducts(transformedProducts);

      setPagination({
        currentPage: page,
        totalPages: Math.ceil(count / 12) || 1,
        totalCount: count,
        hasNext: !!nextPage,
        hasPrevious: !!previousPage,
      });

      if (response.category_fallback) {
        console.log('🔄 Setting category fallback:', response.category_fallback);
        setCategoryFallback(response.category_fallback);
      } else {
        console.log('🧹 Clearing category fallback - none in response');
        setCategoryFallback(null);
      }
      
      console.log('✅ Loaded products:', transformedProducts.length, 'items');
      console.log('📊 Pagination info:', { count, nextPage, previousPage });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadPage = useCallback((page: number) => {
    fetchProducts(filters, page);
  }, [fetchProducts, filters]);

  const debouncedSearch = useCallback(
    (searchQuery: string, searchFilters: SearchFilters = {}) => {
      
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        fetchProducts({ ...searchFilters, search: searchQuery });
      }, 300); 
    },
    [fetchProducts]
  );

  useEffect(() => {
    if (immediate) {
      console.log('🚀 Immediate fetch triggered');
      fetchProducts();
    }
  }, [immediate, fetchProducts, filters, externalFilters]);

  // Add effect to increment filter version when filters change
  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(externalFilters)) {
      console.log('🔄 Filters changed, incrementing version:', filters);
      console.log('🗑️ Old externalFilters:', externalFilters);
      console.log('🆕 New filters will become externalFilters:', filters);
      setFilterVersion(prev => prev + 1);
      // Don't fetch here - the main useEffect will handle it
    }
  }, [filters, externalFilters, fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    categoryFallback,
    refetch: fetchProducts,
    loadPage,
    debouncedSearch,
    invalidateCache: () => {
      // Invalidate all product caches and increment version to force new cache key
      console.log('🧹 Invalidating cache and incrementing filter version');
      setFilterVersion(prev => prev + 1);
      // Also clear any related cache keys
      for (const [key] of memoryCache.keys()) {
        if (key.startsWith('products_')) {
          memoryCache.delete(key);
        }
      }
    },
  };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getProductBySlug(slug);
      console.log('🔍 Raw product data from API:', data);
      console.log('🔍 product.image_url:', (data as any).image_url);
      console.log('🔍 product.primary_image:', (data as any).primary_image);

      const transformedProduct = {
        ...data,
        image: (data as any).image_url || (data as any).primary_image?.image || '/images/no-image-available.svg',
        price: parseFloat(data.price.toString()),
        originalPrice: (data as any).compare_price ? parseFloat((data as any).compare_price.toString()) : undefined,
        category: typeof data.category === 'string' ? data.category : (data as any).category?.name || 'Unknown',
        categoryId: typeof data.category === 'string' ? undefined : (data as any).category?.id,
        categorySlug: typeof data.category === 'string' ? undefined : (data as any).category?.slug,
        brand: typeof data.brand === 'string' ? data.brand : (data as any).brand?.name || 'Unknown',
        brandId: typeof data.brand === 'string' ? undefined : (data as any).brand?.id,
        brandSlug: typeof data.brand === 'string' ? undefined : (data as any).brand?.slug,
        rating: (data as any).average_rating || 4.5,
        reviewCount: (data as any).reviews?.length || 0,
        stockStatus: (data as any).stock_status?.status === 'in_stock' ? 'in_stock' : 
                    (data as any).stock_status?.status === 'low_stock' ? 'low_stock' : 'out_of_stock' as const,
        technicalSpecs: (data as any).specifications?.map((spec: any) => ({
          label: spec.label,
          value: spec.value,
          type: spec.spec_type || 'other'
        })) || [],
        warehouse: {
          id: "1",
          name: "Tema Warehouse", 
          location: "Tema",
          phone: "+233 24 123 4567"
        }
      };
      
      console.log('🔍 Transformed product image:', transformedProduct.image);
      setProduct(transformedProduct);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}

const fallbackFeaturedProducts: Product[] = [
  {
    id: 'fallback-baby-food-1',
    name: 'Organic Baby Food Starter Pack',
    slug: 'organic-baby-food-starter-pack',
    description: 'Gentle, nutrient-rich meals for little ones.',
    price: 180,
    currency: 'GHS',
    image: '/images/no-image-available.svg',
    category: 'Baby Food',
    brand: 'Trendy Kiddos',
    rating: 4.9,
    reviewCount: 18,
    technicalSpecs: [{ label: 'Age', value: '6-24 months', type: 'other' }],
    stockStatus: 'in_stock',
    warehouse: {
      id: '1',
      name: 'Tema Warehouse',
      location: 'Tema',
      phone: '+233 24 123 4567',
    },
    sku: 'BK-ORG-001',
  },
  {
    id: 'fallback-skin-care-2',
    name: 'Gentle Baby Skin Cream',
    slug: 'gentle-baby-skin-cream',
    description: 'Soothing daily hydration for soft, healthy skin.',
    price: 120,
    currency: 'GHS',
    image: '/images/no-image-available.svg',
    category: 'Skin & Care',
    brand: 'Mama Glow',
    rating: 4.8,
    reviewCount: 14,
    technicalSpecs: [{ label: 'Skin Type', value: 'Sensitive', type: 'material' }],
    stockStatus: 'in_stock',
    warehouse: {
      id: '1',
      name: 'Tema Warehouse',
      location: 'Tema',
      phone: '+233 24 123 4567',
    },
    sku: 'SC-GLW-014',
  },
  {
    id: 'fallback-clothing-3',
    name: 'Cotton Baby Outfit Set',
    slug: 'cotton-baby-outfit-set',
    description: 'Soft cotton essentials for comfortable everyday wear.',
    price: 150,
    currency: 'GHS',
    image: '/images/no-image-available.svg',
    category: 'Clothing',
    brand: 'Tiny Threads',
    rating: 4.7,
    reviewCount: 11,
    technicalSpecs: [{ label: 'Fabric', value: '100% Cotton', type: 'material' }],
    stockStatus: 'low_stock',
    warehouse: {
      id: '1',
      name: 'Tema Warehouse',
      location: 'Tema',
      phone: '+233 24 123 4567',
    },
    sku: 'CL-TT-033',
  },
];

export function useInitialData() {
  const [data, setData] = useState<{
    featured_products: Product[];
    categories: any[];
    brands: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    console.log('🔄 useInitialData - Starting fetch...');
    console.log('🔄 useInitialData - API URL:', process.env.NEXT_PUBLIC_API_URL);
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 useInitialData - Calling apiClient.getInitialData()...');
      const initialData = await apiClient.getInitialData();
      console.log('✅ useInitialData - API response received:', initialData);
      console.log('✅ useInitialData - Featured products count:', initialData.featured_products?.length);
      console.log('✅ useInitialData - Featured products data:', initialData.featured_products);
      setData(initialData);
      console.log('✅ Real API data loaded:', initialData.featured_products.length, 'products');
    } catch (err) {
      console.error('❌ useInitialData - Failed to fetch initial data:', err);
      const fallbackData = {
        featured_products: fallbackFeaturedProducts,
        categories: [
          { id: 1, name: 'Baby Food', slug: 'baby-food' },
          { id: 2, name: 'Skin & Care', slug: 'skin-care' },
          { id: 3, name: 'Clothing', slug: 'clothing' },
          { id: 4, name: 'Nursery', slug: 'nursery' },
        ],
        brands: [
          { id: 1, name: 'Trendy Kiddos', slug: 'trendy-kiddos' },
          { id: 2, name: 'Mama Glow', slug: 'mama-glow' },
          { id: 3, name: 'Tiny Threads', slug: 'tiny-threads' },
        ],
      };
      setData(fallbackData);
      setError(null);
    } finally {
      console.log('🔄 useInitialData - Fetch completed, loading:', false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Use setTimeout to delay non-critical data loading
    const timer = setTimeout(() => {
      fetchInitialData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchInitialData]);

  return {
    data,
    loading,
    error,
    refetch: fetchInitialData,
  };
}

export function useFeaturedProducts() {
  console.log('=== useFeaturedProducts HOOK START ===');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('=== State initialized ===');

  const fetchFeaturedProducts = useCallback(async () => {
    console.log('=== FETCH STARTED ===');
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching featured products from API...');
      const data = await apiClient.getFeaturedProducts();
      console.log('Got featured products:', data);
      setProducts(data);
      
    } catch (err) {
      console.error('=== ERROR IN FETCH ===', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch featured products');
    } finally {
      console.log('=== FETCH FINISHED ===');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('useFeaturedProducts hook mounted');
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  console.log('=== HOOK RETURNING ===');
  return {
    products,
    loading,
    error,
    refetch: fetchFeaturedProducts,
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    console.log('🏷️ useCategories - Starting fetch...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏷️ useCategories - Using direct fetch for categories...');
      // Use direct fetch to bypass axios hanging issue
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/products/categories/`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('🏷️ useCategories - Categories fetched:', data);
      setCategories(data);
    } catch (err) {
      console.error('🏷️ useCategories - Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

export function useBrands() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getBrands();
      setBrands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return {
    brands,
    loading,
    error,
    refetch: fetchBrands,
  };
}

export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<any>({
    products: [],
    categories: [],
    brands: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions({ products: [], categories: [], brands: [] });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getSearchSuggestions(query);
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
  };
}
