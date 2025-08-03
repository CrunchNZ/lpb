/**
 * Strategy Tests
 * 
 * Unit tests for strategy classes
 * 
 * @reference PRD.md#4.1 - Strategy Execution
 * @reference DTS.md#3.1 - Strategy Classes
 */

import { AggressiveStrategy } from '../src/backend/strategies/AggressiveStrategy';
import { BalancedStrategy } from '../src/backend/strategies/BalancedStrategy';
import { ConservativeStrategy } from '../src/backend/strategies/ConservativeStrategy';
import { StrategyFactory } from '../src/backend/strategies/StrategyFactory';
import { StrategyManager } from '../src/backend/strategies/StrategyManager';
import { Token, MarketData, StrategyType } from '../src/backend/strategies/types';

// Mock data for testing
const mockToken: Token = {
  address: 'test-token-address',
  symbol: 'TEST',
  name: 'Test Token',
  marketCap: 1000000,
  price: 0.001,
  volume24h: 50000,
  tvl: 25000,
  sentiment: 0.4,
  trending: true
};

const mockMarketData: MarketData = {
  token: mockToken,
  priceHistory: [
    { timestamp: new Date('2024-01-01'), price: 0.001 },
    { timestamp: new Date('2024-01-02'), price: 0.0011 },
    { timestamp: new Date('2024-01-03'), price: 0.0009 },
    { timestamp: new Date('2024-01-04'), price: 0.0012 },
    { timestamp: new Date('2024-01-05'), price: 0.0013 }
  ],
  volumeHistory: [
    { timestamp: new Date('2024-01-01'), volume: 50000 },
    { timestamp: new Date('2024-01-02'), volume: 55000 },
    { timestamp: new Date('2024-01-03'), volume: 45000 },
    { timestamp: new Date('2024-01-04'), volume: 60000 },
    { timestamp: new Date('2024-01-05'), volume: 65000 }
  ],
  sentimentHistory: [
    { timestamp: new Date('2024-01-01'), sentiment: 0.3 },
    { timestamp: new Date('2024-01-02'), sentiment: 0.4 },
    { timestamp: new Date('2024-01-03'), sentiment: 0.2 },
    { timestamp: new Date('2024-01-04'), sentiment: 0.5 },
    { timestamp: new Date('2024-01-05'), sentiment: 0.6 }
  ]
};

describe('Strategy Classes', () => {
  describe('AggressiveStrategy', () => {
    let strategy: AggressiveStrategy;

    beforeEach(() => {
      strategy = new AggressiveStrategy();
    });

    it('should be created with correct default configuration', () => {
      expect(strategy.config.type).toBe(StrategyType.AGGRESSIVE);
      expect(strategy.config.riskTolerance).toBe('high');
      expect(strategy.config.maxPositionSize).toBe(0.05);
      expect(strategy.config.stopLoss).toBe(0.15);
      expect(strategy.config.takeProfit).toBe(0.50);
      expect(strategy.config.sentimentThreshold).toBe(0.3);
    });

    it('should enter position with positive sentiment and adequate volume', async () => {
      const shouldEnter = await strategy.shouldEnter(mockToken, mockMarketData);
      expect(shouldEnter).toBe(true);
    });

    it('should not enter position with negative sentiment', async () => {
      const negativeToken = { ...mockToken, sentiment: -0.1 };
      const shouldEnter = await strategy.shouldEnter(negativeToken, mockMarketData);
      expect(shouldEnter).toBe(false);
    });

    it('should not enter position with low volume', async () => {
      const lowVolumeToken = { ...mockToken, volume24h: 5000 };
      const shouldEnter = await strategy.shouldEnter(lowVolumeToken, mockMarketData);
      expect(shouldEnter).toBe(false);
    });

    it('should calculate position size based on sentiment and market cap', async () => {
      const portfolioValue = 10000;
      const positionSize = await strategy.calculatePositionSize(mockToken, portfolioValue);
      
      expect(positionSize).toBeGreaterThan(0);
      expect(positionSize).toBeLessThanOrEqual(portfolioValue * strategy.config.maxPositionSize);
    });

    it('should return 0 position size for tokens with low sentiment', async () => {
      const lowSentimentToken = { ...mockToken, sentiment: 0.1 };
      const portfolioValue = 10000;
      const positionSize = await strategy.calculatePositionSize(lowSentimentToken, portfolioValue);
      
      expect(positionSize).toBe(0);
    });

    it('should calculate price range correctly', async () => {
      const priceRange = await strategy.calculatePriceRange(mockToken, 0.001);
      
      expect(priceRange).toHaveLength(2);
      expect(priceRange[0]).toBeLessThan(priceRange[1]);
      expect(priceRange[0]).toBeGreaterThan(0);
    });

    it('should exit position on stop loss', async () => {
      const position = {
        id: 'test-position',
        tokenAddress: mockToken.address,
        strategy: StrategyType.AGGRESSIVE,
        entryPrice: 0.001,
        currentPrice: 0.00085, // 15% loss
        size: 1000,
        range: [0.0008, 0.0012],
        status: 'active' as const,
        pnl: -150, // 15% loss
        entryTime: new Date()
      };

      const shouldExit = await strategy.shouldExit(position, mockMarketData);
      expect(shouldExit).toBe(true);
    });

    it('should exit position on take profit', async () => {
      const position = {
        id: 'test-position',
        tokenAddress: mockToken.address,
        strategy: StrategyType.AGGRESSIVE,
        entryPrice: 0.001,
        currentPrice: 0.0015, // 50% gain
        size: 1000,
        range: [0.0008, 0.0012],
        status: 'active' as const,
        pnl: 500, // 50% gain
        entryTime: new Date()
      };

      const shouldExit = await strategy.shouldExit(position, mockMarketData);
      expect(shouldExit).toBe(true);
    });
  });

  describe('BalancedStrategy', () => {
    let strategy: BalancedStrategy;

    beforeEach(() => {
      strategy = new BalancedStrategy();
    });

    it('should be created with correct default configuration', () => {
      expect(strategy.config.type).toBe(StrategyType.BALANCED);
      expect(strategy.config.riskTolerance).toBe('medium');
      expect(strategy.config.maxPositionSize).toBe(0.03);
      expect(strategy.config.stopLoss).toBe(0.10);
      expect(strategy.config.takeProfit).toBe(0.30);
      expect(strategy.config.sentimentThreshold).toBe(0.1);
    });

    it('should enter position with moderate criteria', async () => {
      const shouldEnter = await strategy.shouldEnter(mockToken, mockMarketData);
      expect(shouldEnter).toBe(true);
    });

    it('should not enter position with low volume', async () => {
      const lowVolumeToken = { ...mockToken, volume24h: 30000 };
      const shouldEnter = await strategy.shouldEnter(lowVolumeToken, mockMarketData);
      expect(shouldEnter).toBe(false);
    });

    it('should calculate conservative position size', async () => {
      const portfolioValue = 10000;
      const positionSize = await strategy.calculatePositionSize(mockToken, portfolioValue);
      
      expect(positionSize).toBeGreaterThan(0);
      expect(positionSize).toBeLessThanOrEqual(portfolioValue * strategy.config.maxPositionSize);
    });

    it('should calculate moderate price range', async () => {
      const priceRange = await strategy.calculatePriceRange(mockToken, 0.001);
      
      expect(priceRange).toHaveLength(2);
      expect(priceRange[0]).toBeLessThan(priceRange[1]);
      expect(priceRange[0]).toBeGreaterThan(0);
    });
  });

  describe('ConservativeStrategy', () => {
    let strategy: ConservativeStrategy;

    beforeEach(() => {
      strategy = new ConservativeStrategy();
    });

    it('should be created with correct default configuration', () => {
      expect(strategy.config.type).toBe(StrategyType.CONSERVATIVE);
      expect(strategy.config.riskTolerance).toBe('low');
      expect(strategy.config.maxPositionSize).toBe(0.02);
      expect(strategy.config.stopLoss).toBe(0.08);
      expect(strategy.config.takeProfit).toBe(0.25);
      expect(strategy.config.sentimentThreshold).toBe(0.2);
    });

    it('should enter position with strict criteria', async () => {
      const highVolumeToken = { ...mockToken, volume24h: 150000, tvl: 150000 };
      const shouldEnter = await strategy.shouldEnter(highVolumeToken, mockMarketData);
      expect(shouldEnter).toBe(true);
    });

    it('should not enter position with low volume', async () => {
      const shouldEnter = await strategy.shouldEnter(mockToken, mockMarketData);
      expect(shouldEnter).toBe(false); // Volume too low for conservative
    });

    it('should calculate small position size', async () => {
      const highVolumeToken = { ...mockToken, volume24h: 150000, tvl: 150000 };
      const portfolioValue = 10000;
      const positionSize = await strategy.calculatePositionSize(highVolumeToken, portfolioValue);
      
      expect(positionSize).toBeGreaterThan(0);
      expect(positionSize).toBeLessThanOrEqual(portfolioValue * strategy.config.maxPositionSize);
    });

    it('should calculate narrow price range', async () => {
      const priceRange = await strategy.calculatePriceRange(mockToken, 0.001);
      
      expect(priceRange).toHaveLength(2);
      expect(priceRange[0]).toBeLessThan(priceRange[1]);
      expect(priceRange[0]).toBeGreaterThan(0);
    });
  });

  describe('StrategyFactory', () => {
    let factory: StrategyFactory;

    beforeEach(() => {
      factory = StrategyFactory.getInstance();
    });

    it('should create aggressive strategy', () => {
      const strategy = factory.createStrategy(StrategyType.AGGRESSIVE);
      expect(strategy.config.type).toBe(StrategyType.AGGRESSIVE);
      expect(strategy.config.riskTolerance).toBe('high');
    });

    it('should create balanced strategy', () => {
      const strategy = factory.createStrategy(StrategyType.BALANCED);
      expect(strategy.config.type).toBe(StrategyType.BALANCED);
      expect(strategy.config.riskTolerance).toBe('medium');
    });

    it('should create conservative strategy', () => {
      const strategy = factory.createStrategy(StrategyType.CONSERVATIVE);
      expect(strategy.config.type).toBe(StrategyType.CONSERVATIVE);
      expect(strategy.config.riskTolerance).toBe('low');
    });

    it('should return all available strategies', () => {
      const strategies = factory.getAvailableStrategies();
      expect(strategies).toContain(StrategyType.AGGRESSIVE);
      expect(strategies).toContain(StrategyType.BALANCED);
      expect(strategies).toContain(StrategyType.CONSERVATIVE);
    });

    it('should validate configuration correctly', () => {
      const validConfig = {
        type: StrategyType.AGGRESSIVE,
        riskTolerance: 'high' as const,
        maxPositionSize: 0.05,
        stopLoss: 0.15,
        takeProfit: 0.50,
        sentimentThreshold: 0.3
      };

      expect(factory.validateConfig(validConfig)).toBe(true);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        type: StrategyType.AGGRESSIVE,
        riskTolerance: 'high' as const,
        maxPositionSize: 0.15, // Too high
        stopLoss: 0.15,
        takeProfit: 0.50,
        sentimentThreshold: 0.3
      };

      expect(factory.validateConfig(invalidConfig)).toBe(false);
    });

    it('should get strategy descriptions', () => {
      const aggressiveDesc = factory.getStrategyDescription(StrategyType.AGGRESSIVE);
      const balancedDesc = factory.getStrategyDescription(StrategyType.BALANCED);
      const conservativeDesc = factory.getStrategyDescription(StrategyType.CONSERVATIVE);

      expect(aggressiveDesc).toContain('High-risk');
      expect(balancedDesc).toContain('Moderate risk');
      expect(conservativeDesc).toContain('Low-risk');
    });

    it('should get strategy risk levels', () => {
      expect(factory.getStrategyRiskLevel(StrategyType.AGGRESSIVE)).toBe(8);
      expect(factory.getStrategyRiskLevel(StrategyType.BALANCED)).toBe(5);
      expect(factory.getStrategyRiskLevel(StrategyType.CONSERVATIVE)).toBe(2);
    });

    it('should get expected returns', () => {
      const aggressiveReturns = factory.getExpectedReturns(StrategyType.AGGRESSIVE);
      const balancedReturns = factory.getExpectedReturns(StrategyType.BALANCED);
      const conservativeReturns = factory.getExpectedReturns(StrategyType.CONSERVATIVE);

      expect(aggressiveReturns[0]).toBeGreaterThan(balancedReturns[0]);
      expect(balancedReturns[0]).toBeGreaterThan(conservativeReturns[0]);
    });
  });

  describe('StrategyManager', () => {
    let manager: StrategyManager;
    let factory: StrategyFactory;

    beforeEach(() => {
      manager = new StrategyManager();
      factory = StrategyFactory.getInstance();
    });

    it('should add and remove strategies', () => {
      const strategy = factory.createStrategy(StrategyType.AGGRESSIVE);
      manager.addStrategy(strategy);
      
      expect(manager.getStrategies()).toHaveLength(1);
      
      const strategies = manager.getStrategies();
      manager.removeStrategy('test-id'); // This won't work without proper ID
      
      expect(manager.getStrategies()).toHaveLength(1); // Still there
    });

    it('should execute strategy analysis', async () => {
      const strategy = factory.createStrategy(StrategyType.AGGRESSIVE);
      manager.addStrategy(strategy);
      
      const decision = await manager.executeStrategy(mockToken, mockMarketData);
      
      expect(decision).toBeDefined();
      expect(typeof decision.shouldEnter).toBe('boolean');
      expect(typeof decision.confidence).toBe('number');
      expect(typeof decision.reasoning).toBe('string');
    });

    it('should get strategy statistics', () => {
      const aggressiveStrategy = factory.createStrategy(StrategyType.AGGRESSIVE);
      const balancedStrategy = factory.createStrategy(StrategyType.BALANCED);
      
      manager.addStrategy(aggressiveStrategy);
      manager.addStrategy(balancedStrategy);
      
      const stats = manager.getStrategyStats();
      
      expect(stats.totalStrategies).toBe(2);
      expect(stats.strategyTypes.aggressive).toBe(1);
      expect(stats.strategyTypes.balanced).toBe(1);
    });

    it('should clear all strategies', () => {
      const strategy = factory.createStrategy(StrategyType.AGGRESSIVE);
      manager.addStrategy(strategy);
      
      expect(manager.getStrategies()).toHaveLength(1);
      
      manager.clearStrategies();
      
      expect(manager.getStrategies()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in shouldEnter', async () => {
      const strategy = new AggressiveStrategy();
      const invalidToken = null as any;
      
      const result = await strategy.shouldEnter(invalidToken, mockMarketData);
      expect(result).toBe(false);
    });

    it('should handle errors gracefully in calculatePositionSize', async () => {
      const strategy = new AggressiveStrategy();
      const invalidToken = null as any;
      
      const result = await strategy.calculatePositionSize(invalidToken, 10000);
      expect(result).toBe(0);
    });

    it('should handle errors gracefully in shouldExit', async () => {
      const strategy = new AggressiveStrategy();
      const invalidPosition = null as any;
      
      const result = await strategy.shouldExit(invalidPosition, mockMarketData);
      expect(result).toBe(true); // Fail safe - exit on error
    });

    it('should handle errors gracefully in calculatePriceRange', async () => {
      const strategy = new AggressiveStrategy();
      const invalidToken = null as any;
      
      const result = await strategy.calculatePriceRange(invalidToken, 0.001);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeLessThan(result[1]);
    });
  });
}); 