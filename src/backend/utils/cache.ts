/**
 * Cache Manager for Performance Optimization
 * Implements LRU caching with TTL for database queries and API responses
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // in milliseconds
  cleanupInterval: number; // in milliseconds
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      ...config,
    };

    this.cache = new Map();
    this.startCleanupTimer();
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU behavior)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
    });
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    missRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // TODO: Implement hit rate tracking
      missRate: 0, // TODO: Implement miss rate tracking
    };
  }

  /**
   * Start cleanup timer to remove expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Remove expired cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Stop the cache manager and cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

/**
 * Database query cache with intelligent key generation
 */
export class DatabaseCache {
  private cache: CacheManager;
  private queryStats: Map<string, { hits: number; misses: number }>;

  constructor() {
    this.cache = new CacheManager({
      maxSize: 500,
      defaultTTL: 2 * 60 * 1000, // 2 minutes for database queries
      cleanupInterval: 30 * 1000, // 30 seconds
    });
    this.queryStats = new Map();
  }

  /**
   * Generate cache key for database queries
   */
  private generateKey(method: string, params: any[]): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  /**
   * Cache a database query result
   */
  async cacheQuery<T>(
    method: string,
    params: any[],
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = this.generateKey(method, params);
    const cached = this.cache.get(key);

    if (cached) {
      this.recordHit(method);
      return cached as T;
    }

    this.recordMiss(method);
    const result = await queryFn();
    this.cache.set(key, result, ttl);
    return result;
  }

  /**
   * Invalidate cache for specific method patterns
   */
  invalidatePattern(pattern: string): void {
    // This is a simplified implementation
    // In a real implementation, you'd want more sophisticated pattern matching
    this.cache.clear();
  }

  /**
   * Record cache hit
   */
  private recordHit(method: string): void {
    const stats = this.queryStats.get(method) || { hits: 0, misses: 0 };
    stats.hits++;
    this.queryStats.set(method, stats);
  }

  /**
   * Record cache miss
   */
  private recordMiss(method: string): void {
    const stats = this.queryStats.get(method) || { hits: 0, misses: 0 };
    stats.misses++;
    this.queryStats.set(method, stats);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheStats: ReturnType<CacheManager['getStats']>;
    queryStats: Record<string, { hits: number; misses: number; hitRate: number }>;
  } {
    const queryStats: Record<string, { hits: number; misses: number; hitRate: number }> = {};

    for (const [method, stats] of this.queryStats.entries()) {
      const total = stats.hits + stats.misses;
      queryStats[method] = {
        ...stats,
        hitRate: total > 0 ? stats.hits / total : 0,
      };
    }

    return {
      cacheStats: this.cache.getStats(),
      queryStats,
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.queryStats.clear();
  }
}

/**
 * API response cache for external service calls
 */
export class APICache {
  private cache: CacheManager;
  private rateLimitTracker: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.cache = new CacheManager({
      maxSize: 200,
      defaultTTL: 30 * 1000, // 30 seconds for API responses
      cleanupInterval: 10 * 1000, // 10 seconds
    });
    this.rateLimitTracker = new Map();
  }

  /**
   * Cache API response with rate limiting awareness
   */
  async cacheAPIResponse<T>(
    endpoint: string,
    params: Record<string, any>,
    apiCall: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = `${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(key);

    if (cached) {
      return cached as T;
    }

    // Check rate limiting
    if (this.isRateLimited(endpoint)) {
      throw new Error(`Rate limit exceeded for endpoint: ${endpoint}`);
    }

    const result = await apiCall();
    this.cache.set(key, result, ttl);
    this.trackAPICall(endpoint);

    return result;
  }

  /**
   * Check if endpoint is rate limited
   */
  private isRateLimited(endpoint: string): boolean {
    const tracker = this.rateLimitTracker.get(endpoint);
    if (!tracker) return false;

    const now = Date.now();
    if (now > tracker.resetTime) {
      this.rateLimitTracker.delete(endpoint);
      return false;
    }

    return tracker.count >= 100; // 100 calls per minute limit
  }

  /**
   * Track API call for rate limiting
   */
  private trackAPICall(endpoint: string): void {
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(endpoint) || { count: 0, resetTime: now + 60000 };

    tracker.count++;
    this.rateLimitTracker.set(endpoint, tracker);
  }

  /**
   * Clear cache for specific endpoint
   */
  invalidateEndpoint(endpoint: string): void {
    // Clear all keys that start with the endpoint
    this.cache.clear(); // Simplified - in real implementation, filter by pattern
  }

  /**
   * Get API cache statistics
   */
  getStats(): ReturnType<CacheManager['getStats']> {
    return this.cache.getStats();
  }
}
