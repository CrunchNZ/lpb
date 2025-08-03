import { DatabaseSchema, Position, PerformanceMetrics, Watchlist, WatchlistToken } from './schema';
import { PositionDAO } from './PositionDAO';
import { PerformanceDAO, StrategyBreakdown } from './PerformanceDAO';
import { ConfigDAO } from './ConfigDAO';
import { WatchlistDAO } from './WatchlistDAO';
import { DatabaseCache } from '../utils/cache';
import { dbPerformanceMonitor } from '../utils/performance';

export class DatabaseManager {
  private schema: DatabaseSchema;
  private positionDAO: PositionDAO;
  private performanceDAO: PerformanceDAO;
  private configDAO: ConfigDAO;
  private watchlistDAO: WatchlistDAO;
  private cache: DatabaseCache;

  constructor(dbPath?: string) {
    this.schema = new DatabaseSchema(dbPath);
    const db = this.schema.getDatabase();
    this.positionDAO = new PositionDAO(db);
    this.performanceDAO = new PerformanceDAO(db);
    this.configDAO = new ConfigDAO(db);
    this.watchlistDAO = new WatchlistDAO(db);
    this.cache = new DatabaseCache();
  }

  // Position Management
  async createPosition(position: Omit<Position, 'id'>): Promise<string> {
    return dbPerformanceMonitor.trackQuery(
      'createPosition',
      [position],
      () => this.positionDAO.createPosition(position),
      false // Don't cache writes
    );
  }

  async getPosition(id: string): Promise<Position | null> {
    return this.cache.cacheQuery(
      'getPosition',
      [id],
      () => this.positionDAO.getPosition(id),
      60 * 1000 // 1 minute cache
    );
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<boolean> {
    const result = await dbPerformanceMonitor.trackQuery(
      'updatePosition',
      [id, updates],
      () => this.positionDAO.updatePosition(id, updates),
      false
    );

    // Invalidate related caches
    this.cache.invalidatePattern('getPosition');
    this.cache.invalidatePattern('getActivePositions');
    this.cache.invalidatePattern('getPositionsByStrategy');

    return result;
  }

  async getActivePositions(): Promise<Position[]> {
    return this.cache.cacheQuery(
      'getActivePositions',
      [],
      () => this.positionDAO.getActivePositions(),
      30 * 1000 // 30 seconds cache
    );
  }

  async getPositionsByStrategy(strategy: string): Promise<Position[]> {
    return this.cache.cacheQuery(
      'getPositionsByStrategy',
      [strategy],
      () => this.positionDAO.getPositionsByStrategy(strategy),
      60 * 1000 // 1 minute cache
    );
  }

  async getPositionsByTimeRange(startTime: number, endTime: number): Promise<Position[]> {
    return this.cache.cacheQuery(
      'getPositionsByTimeRange',
      [startTime, endTime],
      () => this.positionDAO.getPositionsByTimeRange(startTime, endTime),
      30 * 1000 // 30 seconds cache
    );
  }

  async deletePosition(id: string): Promise<boolean> {
    const result = await dbPerformanceMonitor.trackQuery(
      'deletePosition',
      [id],
      () => this.positionDAO.deletePosition(id),
      false
    );

    // Invalidate related caches
    this.cache.invalidatePattern('getPosition');
    this.cache.invalidatePattern('getActivePositions');
    this.cache.invalidatePattern('getPositionsByStrategy');

    return result;
  }

  // Performance Management
  async createPerformanceMetrics(metrics: Omit<PerformanceMetrics, 'id'>): Promise<string> {
    return dbPerformanceMonitor.trackQuery(
      'createPerformanceMetrics',
      [metrics],
      () => this.performanceDAO.createMetrics(metrics),
      false
    );
  }

  async getLatestPerformanceMetrics(): Promise<PerformanceMetrics | null> {
    return this.cache.cacheQuery(
      'getLatestPerformanceMetrics',
      [],
      () => this.performanceDAO.getLatestMetrics(),
      10 * 1000 // 10 seconds cache for latest metrics
    );
  }

  async getPerformanceMetricsByTimeRange(startTime: number, endTime: number): Promise<PerformanceMetrics[]> {
    return this.cache.cacheQuery(
      'getPerformanceMetricsByTimeRange',
      [startTime, endTime],
      () => this.performanceDAO.getMetricsByTimeRange(startTime, endTime),
      60 * 1000 // 1 minute cache
    );
  }

  async getPerformanceMetricsGrouped(
    startTime: number,
    endTime: number,
    interval: number
  ): Promise<PerformanceMetrics[]> {
    return this.cache.cacheQuery(
      'getPerformanceMetricsGrouped',
      [startTime, endTime, interval],
      () => this.performanceDAO.getMetricsByTimeRangeGrouped(startTime, endTime, interval),
      60 * 1000 // 1 minute cache
    );
  }

  async getStrategyBreakdown(): Promise<StrategyBreakdown> {
    return this.cache.cacheQuery(
      'getStrategyBreakdown',
      [],
      () => this.performanceDAO.getStrategyBreakdown(),
      30 * 1000 // 30 seconds cache
    );
  }

  // Configuration Management
  async setConfig(key: string, value: string): Promise<string> {
    const result = await dbPerformanceMonitor.trackQuery(
      'setConfig',
      [key, value],
      () => this.configDAO.setConfig(key, value),
      false
    );

    // Invalidate config cache
    this.cache.invalidatePattern('getConfig');
    this.cache.invalidatePattern('getAllConfigs');

    return result;
  }

  async getConfig(key: string): Promise<string | null> {
    return this.cache.cacheQuery(
      'getConfig',
      [key],
      () => this.configDAO.getConfig(key),
      5 * 60 * 1000 // 5 minutes cache for config
    );
  }

  async getAllConfigs(): Promise<Record<string, string>> {
    return this.cache.cacheQuery(
      'getAllConfigs',
      [],
      async () => {
        const configs = await this.configDAO.getAllConfigs();
        const result: Record<string, string> = {};
        configs.forEach(config => {
          result[config.key] = config.value;
        });
        return result;
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async deleteConfig(key: string): Promise<boolean> {
    const result = await dbPerformanceMonitor.trackQuery(
      'deleteConfig',
      [key],
      () => this.configDAO.deleteConfig(key),
      false
    );

    // Invalidate config cache
    this.cache.invalidatePattern('getConfig');
    this.cache.invalidatePattern('getAllConfigs');

    return result;
  }

  // Watchlist Management
  async createWatchlist(name: string): Promise<Watchlist> {
    const result = await dbPerformanceMonitor.trackQuery(
      'createWatchlist',
      [name],
      () => this.watchlistDAO.createWatchlist(name),
      false
    );

    // Invalidate watchlist caches
    this.cache.invalidatePattern('getAllWatchlists');
    this.cache.invalidatePattern('getAllWatchlistsWithTokenCounts');

    return result;
  }

  async getAllWatchlists(): Promise<Watchlist[]> {
    return this.cache.cacheQuery(
      'getAllWatchlists',
      [],
      () => this.watchlistDAO.getAllWatchlists(),
      30 * 1000 // 30 seconds cache
    );
  }

  async getWatchlistById(id: number): Promise<Watchlist | null> {
    return this.cache.cacheQuery(
      'getWatchlistById',
      [id],
      () => this.watchlistDAO.getWatchlistById(id),
      60 * 1000 // 1 minute cache
    );
  }

  async updateWatchlist(id: number, name: string): Promise<boolean> {
    const result = await dbPerformanceMonitor.trackQuery(
      'updateWatchlist',
      [id, name],
      () => this.watchlistDAO.updateWatchlist(id, name),
      false
    );

    // Invalidate watchlist caches
    this.cache.invalidatePattern('getAllWatchlists');
    this.cache.invalidatePattern('getWatchlistById');
    this.cache.invalidatePattern('getAllWatchlistsWithTokenCounts');

    return result;
  }

  async deleteWatchlist(id: number): Promise<boolean> {
    const result = await dbPerformanceMonitor.trackQuery(
      'deleteWatchlist',
      [id],
      () => this.watchlistDAO.deleteWatchlist(id),
      false
    );

    // Invalidate watchlist caches
    this.cache.invalidatePattern('getAllWatchlists');
    this.cache.invalidatePattern('getWatchlistById');
    this.cache.invalidatePattern('getAllWatchlistsWithTokenCounts');
    this.cache.invalidatePattern('getWatchlistTokens');

    return result;
  }

  async addTokenToWatchlist(
    watchlistId: number,
    tokenSymbol: string,
    tokenName: string,
    pairAddress: string,
    chainId: string = 'solana'
  ): Promise<WatchlistToken> {
    const result = await dbPerformanceMonitor.trackQuery(
      'addTokenToWatchlist',
      [watchlistId, tokenSymbol, tokenName, pairAddress, chainId],
      () => this.watchlistDAO.addTokenToWatchlist(watchlistId, tokenSymbol, tokenName, pairAddress, chainId),
      false
    );

    // Invalidate related caches
    this.cache.invalidatePattern('getWatchlistTokens');
    this.cache.invalidatePattern('getAllWatchlistedTokens');
    this.cache.invalidatePattern('isTokenWatchlisted');
    this.cache.invalidatePattern('getAllWatchlistsWithTokenCounts');

    return result;
  }

  async removeTokenFromWatchlist(watchlistId: number, tokenSymbol: string): Promise<boolean> {
    const result = await dbPerformanceMonitor.trackQuery(
      'removeTokenFromWatchlist',
      [watchlistId, tokenSymbol],
      () => this.watchlistDAO.removeTokenFromWatchlist(watchlistId, tokenSymbol),
      false
    );

    // Invalidate related caches
    this.cache.invalidatePattern('getWatchlistTokens');
    this.cache.invalidatePattern('getAllWatchlistedTokens');
    this.cache.invalidatePattern('isTokenWatchlisted');
    this.cache.invalidatePattern('getAllWatchlistsWithTokenCounts');

    return result;
  }

  async getWatchlistTokens(watchlistId: number): Promise<WatchlistToken[]> {
    return this.cache.cacheQuery(
      'getWatchlistTokens',
      [watchlistId],
      () => this.watchlistDAO.getWatchlistTokens(watchlistId),
      30 * 1000 // 30 seconds cache
    );
  }

  async getAllWatchlistedTokens(): Promise<WatchlistToken[]> {
    return this.cache.cacheQuery(
      'getAllWatchlistedTokens',
      [],
      () => this.watchlistDAO.getAllWatchlistedTokens(),
      30 * 1000 // 30 seconds cache
    );
  }

  async isTokenWatchlisted(tokenSymbol: string): Promise<boolean> {
    return this.cache.cacheQuery(
      'isTokenWatchlisted',
      [tokenSymbol],
      () => this.watchlistDAO.isTokenWatchlisted(tokenSymbol),
      60 * 1000 // 1 minute cache
    );
  }

  async getWatchlistsForToken(tokenSymbol: string): Promise<Watchlist[]> {
    return this.cache.cacheQuery(
      'getWatchlistsForToken',
      [tokenSymbol],
      () => this.watchlistDAO.getWatchlistsForToken(tokenSymbol),
      60 * 1000 // 1 minute cache
    );
  }

  async getWatchlistWithTokenCount(watchlistId: number): Promise<Watchlist & { tokenCount: number } | null> {
    return this.cache.cacheQuery(
      'getWatchlistWithTokenCount',
      [watchlistId],
      () => this.watchlistDAO.getWatchlistWithTokenCount(watchlistId),
      30 * 1000 // 30 seconds cache
    );
  }

  async getAllWatchlistsWithTokenCounts(): Promise<(Watchlist & { tokenCount: number })[]> {
    return this.cache.cacheQuery(
      'getAllWatchlistsWithTokenCounts',
      [],
      () => this.watchlistDAO.getAllWatchlistsWithTokenCounts(),
      30 * 1000 // 30 seconds cache
    );
  }

  // Analytics and Reporting
  async getTotalPnl(): Promise<number> {
    return this.cache.cacheQuery(
      'getTotalPnl',
      [],
      () => this.positionDAO.getTotalPnl(),
      30 * 1000 // 30 seconds cache
    );
  }

  async getAverageApy(): Promise<number> {
    return this.cache.cacheQuery(
      'getAverageApy',
      [],
      () => this.positionDAO.getAverageApy(),
      30 * 1000 // 30 seconds cache
    );
  }

  async getTotalValue(): Promise<number> {
    return this.cache.cacheQuery(
      'getTotalValue',
      [],
      () => this.performanceDAO.getTotalValue(),
      30 * 1000 // 30 seconds cache
    );
  }

  async getPerformanceSummary(): Promise<{
    totalValue: number;
    totalPnl: number;
    averageApy: number;
    activePositions: number;
    strategyBreakdown: StrategyBreakdown;
  }> {
    const [totalValue, totalPnl, averageApy, activePositions, strategyBreakdown] = await Promise.all([
      this.performanceDAO.getTotalValue(),
      this.performanceDAO.getTotalPnl(),
      this.positionDAO.getAverageApy(),
      this.positionDAO.getActivePositions().then(positions => positions.length),
      this.performanceDAO.getStrategyBreakdown(),
    ]);

    return {
      totalValue,
      totalPnl,
      averageApy,
      activePositions,
      strategyBreakdown,
    };
  }

  // Maintenance
  async cleanupOldData(olderThanDays: number): Promise<{
    metricsDeleted: number;
    configsDeleted: number;
  }> {
    const [metricsDeleted, configsDeleted] = await Promise.all([
      this.performanceDAO.cleanupOldMetrics(olderThanDays),
      this.configDAO.cleanupOldConfigs(olderThanDays),
    ]);

    return { metricsDeleted, configsDeleted };
  }

  // Database lifecycle
  async close(): Promise<void> {
    return this.schema.close();
  }

  // Utility methods
  async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs = {
      'bot.enabled': 'false',
      'bot.strategy': 'balanced',
      'bot.maxPositions': '10',
      'bot.maxInvestment': '1000',
      'bot.riskLevel': 'medium',
      'notifications.enabled': 'true',
      'notifications.email': '',
      'logging.level': 'info',
      'performance.tracking': 'true',
    };

    await this.configDAO.setConfigs(defaultConfigs);
  }

  async getDatabaseHealth(): Promise<{
    isHealthy: boolean;
    activePositions: number;
    totalConfigs: number;
    latestMetrics: PerformanceMetrics | null;
    totalWatchlists: number;
  }> {
    try {
      const [activePositions, configKeys, latestMetrics, watchlists] = await Promise.all([
        this.positionDAO.getActivePositions().then(positions => positions.length),
        this.configDAO.getConfigKeys().then(keys => keys.length),
        this.performanceDAO.getLatestMetrics(),
        this.watchlistDAO.getAllWatchlists().then(lists => lists.length),
      ]);

      return {
        isHealthy: true,
        activePositions,
        totalConfigs: configKeys,
        latestMetrics,
        totalWatchlists: watchlists,
      };
    } catch (error) {
      return {
        isHealthy: false,
        activePositions: 0,
        totalConfigs: 0,
        latestMetrics: null,
        totalWatchlists: 0,
      };
    }
  }

  // Performance Monitoring Methods
  getCacheStats() {
    return this.cache.getStats();
  }

  getPerformanceStats() {
    return dbPerformanceMonitor.getDatabaseStats();
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern?: string) {
    this.cache.invalidatePattern(pattern);
  }
}
