
export interface Product {
  id: string;
  name: string;
  description: string;
  short_description?: string;
  category: string | { id: string; name: string; slug: string };
  price: number;
  currency: 'GHS';
  image: string;
  image_width?: number;
  image_height?: number;
  slug: string; 
  brand: string | { id: string; name: string; slug: string };
  rating: number;
  reviewCount: number;
  technicalSpecs: TechnicalSpec[];
  stockStatus: StockStatus;
  warehouse: Warehouse;
  sku: string;
  weight?: string;

  compare_price?: number;
  cost_price?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  dimensions?: string;
  condition?: string;
  track_stock?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  is_digital?: boolean;
  category_id?: string;
  brand_id?: string;
  image_url?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface TechnicalSpec {
  label: string;
  value: string;
  type: 'voltage' | 'material' | 'size' | 'capacity' | 'power' | 'other';
}

export type StockStatus = 
  | 'in_stock' 
  | 'low_stock' 
  | 'out_of_stock' 
  | 'pre_order';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  phone: string;
}

export interface SearchFilters {
  category?: string;
  priceRange?: [number, number];
  inStock?: boolean;
  brand?: string;
  specs?: Record<string, string>;
  page?: number;
  page_size?: number;
  search?: string;
  condition?: string;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  category_slug?: string;
  brand_slug?: string;
  ordering?: string;
}

export interface SearchResult {
  products: Product[];
  total: number;
  facets: {
    categories: Array<{ name: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
  };
}
