import type { CachedData } from '../types/movie';

class MovieCacheService {
  private readonly CACHE_PREFIX = 'movie_cache_';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Get cached data if it exists and is not expired
   */
  get<T>(key: string): T | null {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const parsedCache: CachedData<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if cache has expired
      if (now - parsedCache.timestamp > parsedCache.ttl) {
        this.remove(key);
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
      // If localStorage is full, try to clear old cache entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldEntries();
        // Try once more
        try {
          const cacheKey = this.CACHE_PREFIX + key;
          const cacheData: CachedData<T> = {
            data,
            timestamp: Date.now(),
            ttl,
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (retryError) {
          console.error('Failed to cache even after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Remove a specific cached item
   */
  remove(key: string): void {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }

  /**
   * Clear all movie cache entries
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearOldEntries(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const parsedCache: CachedData<any> = JSON.parse(cached);
              if (now - parsedCache.timestamp > parsedCache.ttl) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // If we can't parse it, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Error clearing old cache entries:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { count: number; size: number; oldestEntry: number | null } {
    let count = 0;
    let size = 0;
    let oldestTimestamp: number | null = null;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          count++;
          const value = localStorage.getItem(key);
          if (value) {
            size += key.length + value.length;
            try {
              const cached: CachedData<any> = JSON.parse(value);
              if (oldestTimestamp === null || cached.timestamp < oldestTimestamp) {
                oldestTimestamp = cached.timestamp;
              }
            } catch (error) {
              // Ignore parse errors
            }
          }
        }
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }

    return { count, size, oldestEntry: oldestTimestamp };
  }

  /**
   * Create a cache key for movie discovery queries
   */
  createDiscoverKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      }, {} as Record<string, any>);

    return `discover_${JSON.stringify(sortedParams)}`;
  }

  /**
   * Create a cache key for movie details
   */
  createDetailsKey(movieId: number): string {
    return `details_${movieId}`;
  }

  /**
   * Create a cache key for search queries
   */
  createSearchKey(query: string, page: number = 1): string {
    return `search_${query.toLowerCase()}_${page}`;
  }

  /**
   * Create a cache key for genre combinations
   */
  createGenreKey(genreIds: number[], requireAll: boolean = false): string {
    const sortedIds = [...genreIds].sort();
    return `genres_${sortedIds.join('_')}_${requireAll ? 'all' : 'any'}`;
  }
}

// Export singleton instance
export const movieCache = new MovieCacheService();