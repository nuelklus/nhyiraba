/**
 * Frontend caching utilities for API responses
 */

import { useState, useEffect } from 'react';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  // Generate cache key based on URL and parameters
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `api_cache_${url}_${btoa(paramString)}`;
  }

  // Get cached data
  get(url: string, params?: Record<string, any>): any | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`🎯 Cache hit: ${key}`);
    return entry.data;
  }

  // Set cached data
  set(url: string, data: any, ttl?: number, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    const expiry = Date.now() + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
    
    console.log(`💾 Cache set: ${key} (TTL: ${ttl || this.defaultTTL}ms)`);
  }

  // Clear cache
  clear(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    console.log(`🗑️ Cache cleared: ${pattern || 'all'}`);
  }

  // Get cache statistics
  getStats(): { size: number; entries: Array<{ key: string; age: number; ttl: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.expiry - Date.now()
    }));
    
    return {
      size: this.cache.size,
      entries
    };
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

// Auto-cleanup every 5 minutes
setInterval(() => {
  apiCache.cleanup();
}, 5 * 60 * 1000);

// Cached fetch wrapper
export async function cachedFetch(
  url: string,
  options: RequestInit = {},
  cacheTTL?: number
): Promise<Response> {
  const method = options.method || 'GET';
  const cacheKey = `${method}_${url}`;
  
  // Only cache GET requests
  if (method === 'GET') {
    const cachedData = apiCache.get(url);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Make actual request
  const response = await fetch(url, options);
  
  // Cache successful GET responses
  if (method === 'GET' && response.ok) {
    const data = await response.clone().json();
    apiCache.set(url, data, cacheTTL);
  }
  
  return response;
}

// React hook for cached API calls
export function useCachedApi<T>(
  url: string,
  options: RequestInit = {},
  cacheTTL?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await cachedFetch(url, options, cacheTTL);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}
