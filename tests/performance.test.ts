import { CacheManager, DatabaseCache, APICache } from '../src/backend/utils/cache';
import { PerformanceMonitor, DatabasePerformanceMonitor, APIPerformanceMonitor } from '../src/backend/utils/performance';

describe('Cache Manager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({
      maxSize: 5,
      defaultTTL: 1000, // 1 second
      cleanupInterval: 500 // 500ms
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  test('should store and retrieve values', () => {
    cache.set('test-key', 'test-value');
    expect(cache.get('test-key')).toBe('test-value');
  });

  test('should return null for non-existent keys', () => {
    expect(cache.get('non-existent')).toBeNull();
  });

  test('should respect TTL', async () => {
    cache.set('test-key', 'test-value', 100); // 100ms TTL
    expect(cache.get('test-key')).toBe('test-value');
    
    await new Promise(resolve => setTimeout(resolve, 150)); // Wait for TTL to expire
    expect(cache.get('test-key')).toBeNull();
  });

  test('should implement LRU eviction', () => {
    // Fill cache to capacity
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');
    cache.set('key5', 'value5');

    // All should be present
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
    expect(cache.get('key5')).toBe('value5');

    // Add one more - should evict the oldest (key1)
    cache.set('key6', 'value6');
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key6')).toBe('value6');
  });

  test('should clear cache', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    cache.clear();
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  test('should return cache statistics', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    const stats = cache.getStats();
    
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(5);
  });
});

describe('Database Cache', () => {
  let dbCache: DatabaseCache;

  beforeEach(() => {
    dbCache = new DatabaseCache();
  });

  afterEach(() => {
    dbCache.clear();
  });

  test('should cache database queries', async () => {
    let callCount = 0;
    const queryFn = async () => {
      callCount++;
      return `result-${callCount}`;
    };

    // First call should execute the function
    const result1 = await dbCache.cacheQuery('test-query', ['param1'], queryFn);
    expect(result1).toBe('result-1');
    expect(callCount).toBe(1);

    // Second call should use cache
    const result2 = await dbCache.cacheQuery('test-query', ['param1'], queryFn);
    expect(result2).toBe('result-1');
    expect(callCount).toBe(1); // Should not increment
  });

  test('should generate different keys for different parameters', async () => {
    let callCount = 0;
    const queryFn = async () => {
      callCount++;
      return `result-${callCount}`;
    };

    await dbCache.cacheQuery('test-query', ['param1'], queryFn);
    await dbCache.cacheQuery('test-query', ['param2'], queryFn);

    expect(callCount).toBe(2); // Both should execute
  });

  test('should track query statistics', async () => {
    const queryFn = async () => 'result';

    await dbCache.cacheQuery('test-query', ['param1'], queryFn);
    await dbCache.cacheQuery('test-query', ['param1'], queryFn); // Should hit cache

    const stats = dbCache.getStats();
    expect(stats.queryStats['test-query']).toBeDefined();
    expect(stats.queryStats['test-query'].hits).toBe(1);
    expect(stats.queryStats['test-query'].misses).toBe(1);
  });

  test('should invalidate cache patterns', async () => {
    let callCount = 0;
    const queryFn = async () => {
      callCount++;
      return `result-${callCount}`;
    };

    await dbCache.cacheQuery('getPosition', ['id1'], queryFn);
    await dbCache.cacheQuery('getPosition', ['id1'], queryFn); // Should hit cache

    dbCache.invalidatePattern('getPosition');

    await dbCache.cacheQuery('getPosition', ['id1'], queryFn); // Should miss cache
    expect(callCount).toBe(2);
  });
});

describe('API Cache', () => {
  let apiCache: APICache;

  beforeEach(() => {
    apiCache = new APICache();
  });

  afterEach(() => {
    // Clear any timers
    jest.clearAllTimers();
  });

  test('should cache API responses', async () => {
    let callCount = 0;
    const apiCall = async () => {
      callCount++;
      return { data: `response-${callCount}` };
    };

    const result1 = await apiCache.cacheAPIResponse('test-endpoint', { param: 'value' }, apiCall);
    const result2 = await apiCache.cacheAPIResponse('test-endpoint', { param: 'value' }, apiCall);

    expect(result1).toEqual({ data: 'response-1' });
    expect(result2).toEqual({ data: 'response-1' });
    expect(callCount).toBe(1);
  });

  test('should handle rate limiting', async () => {
    const apiCall = async () => ({ data: 'response' });

    // Make 100 calls (rate limit)
    for (let i = 0; i < 100; i++) {
      await apiCache.cacheAPIResponse('test-endpoint', { param: i }, apiCall);
    }

    // 101st call should be rate limited
    await expect(
      apiCache.cacheAPIResponse('test-endpoint', { param: 101 }, apiCall)
    ).rejects.toThrow('Rate limit exceeded');
  });

  test('should track API call statistics', async () => {
    const apiCall = async () => ({ data: 'response' });

    await apiCache.cacheAPIResponse('test-endpoint', { param: 'value' }, apiCall);

    const stats = apiCache.getStats();
    expect(stats.size).toBeGreaterThan(0);
  });
});

describe('Performance Monitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  test('should track successful operations', async () => {
    const operation = async () => 'success';
    
    const result = await monitor.track('test-operation', operation);
    
    expect(result).toBe('success');
    
    const metrics = monitor.getMetrics('test-operation');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].operation).toBe('test-operation');
    expect(metrics[0].success).toBe(true);
  });

  test('should track failed operations', async () => {
    const operation = async () => {
      throw new Error('Test error');
    };
    
    await expect(monitor.track('test-operation', operation)).rejects.toThrow('Test error');
    
    const metrics = monitor.getMetrics('test-operation');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].operation).toBe('test-operation');
    expect(metrics[0].success).toBe(false);
  });

  test('should track synchronous operations', () => {
    const operation = () => 'success';
    
    const result = monitor.trackSync('test-sync-operation', operation);
    
    expect(result).toBe('success');
    
    const metrics = monitor.getMetrics('test-sync-operation');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].operation).toBe('test-sync-operation');
    expect(metrics[0].success).toBe(true);
  });

  test('should identify slow operations', async () => {
    const slowOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds
      return 'slow';
    };
    
    await monitor.track('slow-operation', slowOperation);
    
    const slowOps = monitor.getSlowOperations();
    expect(slowOps).toHaveLength(1);
    expect(slowOps[0].operation).toBe('slow-operation');
  });

  test('should get performance summary', async () => {
    const fastOperation = async () => 'fast';
    const slowOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
      return 'slow';
    };
    
    await monitor.track('fast-op', fastOperation);
    await monitor.track('slow-op', slowOperation);
    
    const summary = monitor.getSummary();
    expect(summary.totalOperations).toBe(2);
    expect(summary.slowOperations).toBe(1);
    expect(summary.successRate).toBe(1);
  });

  test('should clear old metrics', async () => {
    const operation = async () => 'result';
    
    await monitor.track('test-operation', operation);
    
    // Simulate old metrics by manipulating timestamps
    const metrics = (monitor as any).metrics;
    if (metrics.length > 0) {
      metrics[0].timestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
    }
    
    monitor.clearOldMetrics(24); // Clear older than 24 hours
    
    const summary = monitor.getSummary();
    expect(summary.totalOperations).toBe(0);
  });
});

describe('Database Performance Monitor', () => {
  let dbMonitor: DatabasePerformanceMonitor;

  beforeEach(() => {
    dbMonitor = new DatabasePerformanceMonitor();
  });

  test('should track database queries with caching', async () => {
    let callCount = 0;
    const queryFn = async () => {
      callCount++;
      return `result-${callCount}`;
    };

    const result1 = await dbMonitor.trackQuery('SELECT * FROM positions', ['param1'], queryFn);
    const result2 = await dbMonitor.trackQuery('SELECT * FROM positions', ['param1'], queryFn);

    expect(result1).toBe('result-1');
    expect(result2).toBe('result-1'); // Should be cached
    expect(callCount).toBe(1);
  });

  test('should invalidate query cache', async () => {
    let callCount = 0;
    const queryFn = async () => {
      callCount++;
      return `result-${callCount}`;
    };

    await dbMonitor.trackQuery('SELECT * FROM positions', ['param1'], queryFn);
    await dbMonitor.trackQuery('SELECT * FROM positions', ['param1'], queryFn); // Hit cache

    dbMonitor.invalidateCache('positions');

    await dbMonitor.trackQuery('SELECT * FROM positions', ['param1'], queryFn); // Miss cache
    expect(callCount).toBe(2);
  });

  test('should get database-specific statistics', async () => {
    const queryFn = async () => 'result';

    await dbMonitor.trackQuery('SELECT * FROM positions', ['param1'], queryFn);
    await dbMonitor.trackQuery('SELECT * FROM positions', ['param1'], queryFn); // Hit cache

    const stats = dbMonitor.getDatabaseStats();
    expect(stats.totalQueries).toBe(2);
    expect(stats.cachedQueries).toBe(1);
  });
});

describe('API Performance Monitor', () => {
  let apiMonitor: APIPerformanceMonitor;

  beforeEach(() => {
    apiMonitor = new APIPerformanceMonitor();
  });

  test('should track API calls with rate limiting', async () => {
    const apiCall = async () => ({ data: 'response' });

    const result = await apiMonitor.trackAPICall('test-endpoint', apiCall);
    expect(result).toEqual({ data: 'response' });
  });

  test('should enforce rate limits', async () => {
    const apiCall = async () => ({ data: 'response' });

    // Make 100 calls (rate limit)
    for (let i = 0; i < 100; i++) {
      await apiMonitor.trackAPICall('test-endpoint', apiCall);
    }

    // 101st call should be rate limited
    await expect(
      apiMonitor.trackAPICall('test-endpoint', apiCall)
    ).rejects.toThrow('Rate limit exceeded');
  });

  test('should get API-specific statistics', async () => {
    const apiCall = async () => ({ data: 'response' });

    await apiMonitor.trackAPICall('test-endpoint', apiCall);

    const stats = apiMonitor.getAPIStats();
    expect(stats.totalCalls).toBe(1);
    expect(stats.failedCalls).toBe(0);
  });
}); 