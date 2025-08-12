/**
 * Performance Monitoring System
 * Tracks database queries, API calls, and UI rendering performance
 */

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  operation: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  lastExecuted: number;
}

export class PerformanceMonitor {
  protected metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 10000;
  private slowQueryThreshold: number = 1000; // 1 second
  private errorThreshold: number = 5000; // 5 seconds

  /**
   * Track a performance metric
   */
  track<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const timestamp = Date.now();

    return fn()
      .then(result => {
        const duration = performance.now() - startTime;
        this.recordMetric({
          operation,
          duration,
          timestamp,
          success: true,
          metadata,
        });

        // Log slow operations
        if (duration > this.slowQueryThreshold) {
          console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
        }

        return result;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        this.recordMetric({
          operation,
          duration,
          timestamp,
          success: false,
          error: error.message,
          metadata,
        });

        // Log error operations
        if (duration > this.errorThreshold) {
          console.error(`Error operation took too long: ${operation} took ${duration.toFixed(2)}ms`, error);
        }

        throw error;
      });
  }

  /**
   * Track a synchronous operation
   */
  trackSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    const timestamp = Date.now();

    try {
      const result = fn();
      const duration = performance.now() - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp,
        success: true,
        metadata,
      });

      if (duration > this.slowQueryThreshold) {
        console.warn(`Slow sync operation: ${operation} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operation,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata,
      });

      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  protected recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation?: string): PerformanceStats[] {
    const filteredMetrics = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    const grouped = this.groupByOperation(filteredMetrics);
    const stats: PerformanceStats[] = [];

    for (const [op, metrics] of grouped.entries()) {
      const durations = metrics.map(m => m.duration);
      const successful = metrics.filter(m => m.success);

      stats.push({
        operation: op,
        count: metrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successRate: successful.length / metrics.length,
        lastExecuted: Math.max(...metrics.map(m => m.timestamp)),
      });
    }

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(operation?: string): PerformanceMetric[] {
    return operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;
  }

  /**
   * Get slow operations
   */
  getSlowOperations(threshold?: number): PerformanceMetric[] {
    const limit = threshold || this.slowQueryThreshold;
    return this.metrics.filter(m => m.duration > limit);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): PerformanceMetric[] {
    return this.metrics.filter(m => !m.success);
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Group metrics by operation
   */
  private groupByOperation(metrics: PerformanceMetric[]): Map<string, PerformanceMetric[]> {
    const grouped = new Map<string, PerformanceMetric[]>();

    for (const metric of metrics) {
      const existing = grouped.get(metric.operation) || [];
      existing.push(metric);
      grouped.set(metric.operation, existing);
    }

    return grouped;
  }

  /**
   * Get overall performance summary
   */
  getSummary(): {
    totalOperations: number;
    avgDuration: number;
    successRate: number;
    slowOperations: number;
    failedOperations: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        avgDuration: 0,
        successRate: 0,
        slowOperations: 0,
        failedOperations: 0,
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const successful = this.metrics.filter(m => m.success);
    const slow = this.metrics.filter(m => m.duration > this.slowQueryThreshold);
    const failed = this.metrics.filter(m => !m.success);

    return {
      totalOperations: this.metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      successRate: successful.length / this.metrics.length,
      slowOperations: slow.length,
      failedOperations: failed.length,
    };
  }
}

/**
 * Database Performance Monitor
 * Specifically tracks database query performance
 */
export class DatabasePerformanceMonitor extends PerformanceMonitor {
  private queryCache: Map<string, { result: any; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Track a database query with caching
   */
  async trackQuery<T>(
    query: string,
    params: any[],
    queryFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = `${query}:${JSON.stringify(params)}`;

    if (useCache) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        // Record cache hit
        this.recordMetric({
          operation: `DB_QUERY:${query}`,
          duration: 0,
          timestamp: Date.now(),
          success: true,
          metadata: { query, params, cached: true },
        });
        return cached.result;
      }
    }

    const result = await this.track(`DB_QUERY:${query}`, queryFn, {
      query,
      params,
      cached: false,
    });

    if (useCache) {
      this.queryCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  /**
   * Invalidate query cache
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      // Clear cache entries matching pattern
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  /**
   * Get database-specific statistics
   */
  getDatabaseStats(): {
    totalQueries: number;
    cachedQueries: number;
    avgQueryTime: number;
    slowQueries: number;
  } {
    const dbMetrics = this.metrics.filter(m => m.operation.startsWith('DB_QUERY:'));
    const cachedMetrics = dbMetrics.filter(m => m.metadata?.cached === true);

    if (dbMetrics.length === 0) {
      return {
        totalQueries: 0,
        cachedQueries: 0,
        avgQueryTime: 0,
        slowQueries: 0,
      };
    }

    const queryTimes = dbMetrics.filter(m => m.duration > 0).map(m => m.duration);
    const slowQueries = dbMetrics.filter(m => m.duration > 1000);

    return {
      totalQueries: dbMetrics.length,
      cachedQueries: cachedMetrics.length,
      avgQueryTime: queryTimes.length > 0 ? queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length : 0,
      slowQueries: slowQueries.length,
    };
  }
}

/**
 * API Performance Monitor
 * Tracks external API call performance
 */
export class APIPerformanceMonitor extends PerformanceMonitor {
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Track an API call with rate limiting
   */
  async trackAPICall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    rateLimit: number = 100 // calls per minute
  ): Promise<T> {
    // Check rate limiting
    if (this.isRateLimited(endpoint, rateLimit)) {
      throw new Error(`Rate limit exceeded for endpoint: ${endpoint}`);
    }

    const result = await this.track(`API_CALL:${endpoint}`, apiCall);
    this.incrementAPICallCount(endpoint);

    return result;
  }

  /**
   * Check if endpoint is rate limited
   */
  private isRateLimited(endpoint: string, limit: number): boolean {
    const tracker = this.rateLimitTracker.get(endpoint);
    if (!tracker) return false;

    const now = Date.now();
    if (now > tracker.resetTime) {
      this.rateLimitTracker.delete(endpoint);
      return false;
    }

    return tracker.count >= limit;
  }

  /**
   * Track API call for rate limiting
   */
  private incrementAPICallCount(endpoint: string): void {
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(endpoint) || { count: 0, resetTime: now + 60000 };

    tracker.count++;
    this.rateLimitTracker.set(endpoint, tracker);
  }

  /**
   * Get API-specific statistics
   */
  getAPIStats(): {
    totalCalls: number;
    avgResponseTime: number;
    failedCalls: number;
    rateLimitedCalls: number;
  } {
    const apiMetrics = this.metrics.filter(m => m.operation.startsWith('API_CALL:'));
    const failedCalls = apiMetrics.filter(m => !m.success);
    const rateLimitedCalls = failedCalls.filter(m => m.error?.includes('Rate limit'));

    if (apiMetrics.length === 0) {
      return {
        totalCalls: 0,
        avgResponseTime: 0,
        failedCalls: 0,
        rateLimitedCalls: 0,
      };
    }

    const responseTimes = apiMetrics.map(m => m.duration);

    return {
      totalCalls: apiMetrics.length,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      failedCalls: failedCalls.length,
      rateLimitedCalls: rateLimitedCalls.length,
    };
  }
}

// Global performance monitor instances
export const dbPerformanceMonitor = new DatabasePerformanceMonitor();
export const apiPerformanceMonitor = new APIPerformanceMonitor();
export const globalPerformanceMonitor = new PerformanceMonitor();
