import { useState, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const memoryCache = new Map<string, CacheEntry<any>>();

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCachedData = () => {
      const cached = memoryCache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
      return null;
    };

    const setCachedData = (newData: T) => {
      memoryCache.set(key, {
        data: newData,
        timestamp: Date.now(),
        ttl
      });
    };

    const fetchData = async () => {
      
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        setData(result);
        setCachedData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, ttl]);

  const invalidate = () => {
    memoryCache.delete(key);
  };

  return { data, loading, error, invalidate };
}

export function clearCache() {
  memoryCache.clear();
}

export function clearExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      memoryCache.delete(key);
    }
  }
}
