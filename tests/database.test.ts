import { DatabaseManager, Position, PerformanceMetrics } from '../src/backend/database';

describe('Database Layer', () => {
  let dbManager: DatabaseManager;

  beforeEach(async () => {
    // Use in-memory database for testing
    dbManager = new DatabaseManager(':memory:');
    await dbManager.initializeDefaultConfigs();
  });

  afterEach(async () => {
    await dbManager.close();
  });

  describe('Position Management', () => {
    const mockPosition: Omit<Position, 'id'> = {
      strategy: 'balanced',
      poolAddress: 'pool123',
      tokenA: 'SOL',
      tokenB: 'USDC',
      amountA: 100,
      amountB: 2000,
      entryPrice: 20.5,
      currentPrice: 21.0,
      timestamp: Date.now(),
      status: 'active',
      pnl: 50,
      apy: 25.5
    };

    it('should create a position', async () => {
      const id = await dbManager.createPosition(mockPosition);
      expect(id).toBeDefined();
      expect(id.startsWith('pos_')).toBe(true);
    });

    it('should retrieve a position by id', async () => {
      const id = await dbManager.createPosition(mockPosition);
      const position = await dbManager.getPosition(id);
      
      expect(position).toBeDefined();
      expect(position?.strategy).toBe(mockPosition.strategy);
      expect(position?.poolAddress).toBe(mockPosition.poolAddress);
    });

    it('should update a position', async () => {
      const id = await dbManager.createPosition(mockPosition);
      const success = await dbManager.updatePosition(id, { pnl: 100, apy: 30 });
      
      expect(success).toBe(true);
      
      const updatedPosition = await dbManager.getPosition(id);
      expect(updatedPosition?.pnl).toBe(100);
      expect(updatedPosition?.apy).toBe(30);
    });

    it('should get active positions', async () => {
      await dbManager.createPosition(mockPosition);
      await dbManager.createPosition({ ...mockPosition, status: 'closed' });
      
      const activePositions = await dbManager.getActivePositions();
      expect(activePositions.length).toBe(1);
      expect(activePositions[0].status).toBe('active');
    });

    it('should get positions by strategy', async () => {
      await dbManager.createPosition(mockPosition);
      await dbManager.createPosition({ ...mockPosition, strategy: 'aggressive' });
      
      const balancedPositions = await dbManager.getPositionsByStrategy('balanced');
      expect(balancedPositions.length).toBe(1);
      expect(balancedPositions[0].strategy).toBe('balanced');
    });

    it('should delete a position', async () => {
      const id = await dbManager.createPosition(mockPosition);
      const success = await dbManager.deletePosition(id);
      
      expect(success).toBe(true);
      
      const deletedPosition = await dbManager.getPosition(id);
      expect(deletedPosition).toBeNull();
    });
  });

  describe('Performance Management', () => {
    const mockMetrics: Omit<PerformanceMetrics, 'id'> = {
      timestamp: Date.now(),
      totalValue: 10000,
      totalPnl: 500,
      totalApy: 25.5,
      activePositions: 5,
      closedPositions: 10,
      strategyBreakdown: JSON.stringify({
        balanced: { totalValue: 5000, totalPnl: 250, totalApy: 25, positionCount: 3 },
        aggressive: { totalValue: 3000, totalPnl: 150, totalApy: 30, positionCount: 2 },
        conservative: { totalValue: 2000, totalPnl: 100, totalApy: 20, positionCount: 1 }
      })
    };

    it('should create performance metrics', async () => {
      const id = await dbManager.createPerformanceMetrics(mockMetrics);
      expect(id).toBeDefined();
      expect(id.startsWith('perf_')).toBe(true);
    });

    it('should get latest performance metrics', async () => {
      await dbManager.createPerformanceMetrics(mockMetrics);
      const latest = await dbManager.getLatestPerformanceMetrics();
      
      expect(latest).toBeDefined();
      expect(latest?.totalValue).toBe(mockMetrics.totalValue);
      expect(latest?.totalPnl).toBe(mockMetrics.totalPnl);
    });

    it('should get performance metrics by time range', async () => {
      const now = Date.now();
      await dbManager.createPerformanceMetrics({ ...mockMetrics, timestamp: now - 1000 });
      await dbManager.createPerformanceMetrics({ ...mockMetrics, timestamp: now });
      
      const metrics = await dbManager.getPerformanceMetricsByTimeRange(now - 2000, now + 1000);
      expect(metrics.length).toBe(2);
    });

    it('should get strategy breakdown', async () => {
      await dbManager.createPerformanceMetrics(mockMetrics);
      const breakdown = await dbManager.getStrategyBreakdown();
      
      expect(breakdown.balanced).toBeDefined();
      expect(breakdown.aggressive).toBeDefined();
      expect(breakdown.conservative).toBeDefined();
    });
  });

  describe('Configuration Management', () => {
    it('should set and get config', async () => {
      await dbManager.setConfig('test.key', 'test.value');
      const value = await dbManager.getConfig('test.key');
      
      expect(value).toBe('test.value');
    });

    it('should get all configs', async () => {
      await dbManager.setConfig('key1', 'value1');
      await dbManager.setConfig('key2', 'value2');
      
      const configs = await dbManager.getAllConfigs();
      expect(configs['key1']).toBe('value1');
      expect(configs['key2']).toBe('value2');
    });

    it('should delete config', async () => {
      await dbManager.setConfig('test.key', 'test.value');
      const success = await dbManager.deleteConfig('test.key');
      
      expect(success).toBe(true);
      
      const value = await dbManager.getConfig('test.key');
      expect(value).toBeNull();
    });

    it('should initialize default configs', async () => {
      const configs = await dbManager.getAllConfigs();
      expect(configs['bot.enabled']).toBe('false');
      expect(configs['bot.strategy']).toBe('balanced');
      expect(configs['bot.maxPositions']).toBe('10');
    });
  });

  describe('Analytics and Reporting', () => {
    beforeEach(async () => {
      // Create some test data
      await dbManager.createPosition({
        strategy: 'balanced',
        poolAddress: 'pool1',
        tokenA: 'SOL',
        tokenB: 'USDC',
        amountA: 100,
        amountB: 2000,
        entryPrice: 20,
        currentPrice: 21,
        timestamp: Date.now(),
        status: 'active',
        pnl: 50,
        apy: 25
      });

      await dbManager.createPerformanceMetrics({
        timestamp: Date.now(),
        totalValue: 10000,
        totalPnl: 500,
        totalApy: 25.5,
        activePositions: 1,
        closedPositions: 0,
        strategyBreakdown: JSON.stringify({
          balanced: { totalValue: 10000, totalPnl: 500, totalApy: 25.5, positionCount: 1 }
        })
      });
    });

    it('should get performance summary', async () => {
      const summary = await dbManager.getPerformanceSummary();
      
      expect(summary.totalValue).toBe(10000);
      expect(summary.totalPnl).toBe(500);
      expect(summary.averageApy).toBe(25);
      expect(summary.activePositions).toBe(1);
      expect(summary.strategyBreakdown.balanced).toBeDefined();
    });

    it('should get database health', async () => {
      const health = await dbManager.getDatabaseHealth();
      
      expect(health.isHealthy).toBe(true);
      expect(health.activePositions).toBe(1);
      expect(health.totalConfigs).toBeGreaterThan(0);
      expect(health.latestMetrics).toBeDefined();
    });
  });

  describe('Maintenance', () => {
    it('should cleanup old data', async () => {
      // Create old metrics
      await dbManager.createPerformanceMetrics({
        timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        totalValue: 1000,
        totalPnl: 100,
        totalApy: 20,
        activePositions: 1,
        closedPositions: 0,
        strategyBreakdown: '{}'
      });

      const result = await dbManager.cleanupOldData(7); // Keep only 7 days
      expect(result.metricsDeleted).toBeGreaterThan(0);
    });
  });
}); 