/**
 * Strategy Factory Implementation
 * 
 * Creates and manages strategy instances
 * 
 * @reference PRD.md#4.1 - Strategy Execution
 * @reference DTS.md#3.1 - Strategy Factory
 */

import { StrategyFactory as IStrategyFactory, StrategyType, StrategyConfig } from './types';
import { AggressiveStrategy } from './AggressiveStrategy';
import { BalancedStrategy } from './BalancedStrategy';
import { ConservativeStrategy } from './ConservativeStrategy';

export class StrategyFactory implements IStrategyFactory {
  private static instance: StrategyFactory;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): StrategyFactory {
    if (!StrategyFactory.instance) {
      StrategyFactory.instance = new StrategyFactory();
    }
    return StrategyFactory.instance;
  }

  /**
   * Creates a strategy instance based on type
   * @param type - Strategy type to create
   * @param config - Optional configuration overrides
   * @returns Strategy instance
   */
  createStrategy(type: StrategyType, config?: Partial<StrategyConfig>): Strategy {
    try {
      switch (type) {
        case StrategyType.AGGRESSIVE:
          return new AggressiveStrategy(config);
        
        case StrategyType.BALANCED:
          return new BalancedStrategy(config);
        
        case StrategyType.CONSERVATIVE:
          return new ConservativeStrategy(config);
        
        default:
          throw new Error(`Unknown strategy type: ${type}`);
      }
    } catch (error) {
      console.error('StrategyFactory: Error creating strategy', error);
      // Return balanced strategy as fallback
      return new BalancedStrategy(config);
    }
  }

  /**
   * Gets all available strategy types
   * @returns Array of available strategy types
   */
  getAvailableStrategies(): StrategyType[] {
    return [
      StrategyType.AGGRESSIVE,
      StrategyType.BALANCED,
      StrategyType.CONSERVATIVE
    ];
  }

  /**
   * Gets default configuration for a strategy type
   * @param type - Strategy type
   * @returns Default configuration
   */
  getDefaultConfig(type: StrategyType): StrategyConfig {
    switch (type) {
      case StrategyType.AGGRESSIVE:
        return {
          type: StrategyType.AGGRESSIVE,
          riskTolerance: 'high',
          maxPositionSize: 0.05,
          stopLoss: 0.15,
          takeProfit: 0.50,
          sentimentThreshold: 0.3
        };
      
      case StrategyType.BALANCED:
        return {
          type: StrategyType.BALANCED,
          riskTolerance: 'medium',
          maxPositionSize: 0.03,
          stopLoss: 0.10,
          takeProfit: 0.30,
          sentimentThreshold: 0.1
        };
      
      case StrategyType.CONSERVATIVE:
        return {
          type: StrategyType.CONSERVATIVE,
          riskTolerance: 'low',
          maxPositionSize: 0.02,
          stopLoss: 0.08,
          takeProfit: 0.25,
          sentimentThreshold: 0.2
        };
      
      default:
        throw new Error(`Unknown strategy type: ${type}`);
    }
  }

  /**
   * Validates strategy configuration
   * @param config - Configuration to validate
   * @returns boolean - Whether configuration is valid
   */
  validateConfig(config: StrategyConfig): boolean {
    try {
      // Check required fields
      if (!config.type || !config.riskTolerance || config.maxPositionSize === undefined ||
          config.stopLoss === undefined || config.takeProfit === undefined || config.sentimentThreshold === undefined) {
        return false;
      }

      // Validate ranges
      if (config.maxPositionSize <= 0 || config.maxPositionSize > 0.1) {
        return false; // Max 10% of portfolio
      }

      if (config.stopLoss <= 0 || config.stopLoss > 0.5) {
        return false; // Max 50% stop loss
      }

      if (config.takeProfit <= 0 || config.takeProfit > 2.0) {
        return false; // Max 200% take profit
      }

      if (config.sentimentThreshold < -1 || config.sentimentThreshold > 1) {
        return false; // Sentiment between -1 and 1
      }

      return true;
    } catch (error) {
      console.error('StrategyFactory: Error validating config', error);
      return false;
    }
  }

  /**
   * Gets strategy description
   * @param type - Strategy type
   * @returns Strategy description
   */
  getStrategyDescription(type: StrategyType): string {
    switch (type) {
      case StrategyType.AGGRESSIVE:
        return 'High-risk, high-reward strategy for volatile meme coins with positive sentiment and adequate volume';
      
      case StrategyType.BALANCED:
        return 'Moderate risk strategy with balanced risk-reward profile for stable meme coins';
      
      case StrategyType.CONSERVATIVE:
        return 'Low-risk strategy with capital preservation focus for established meme coins';
      
      default:
        return 'Unknown strategy type';
    }
  }

  /**
   * Gets strategy risk level
   * @param type - Strategy type
   * @returns Risk level (1-10)
   */
  getStrategyRiskLevel(type: StrategyType): number {
    switch (type) {
      case StrategyType.AGGRESSIVE:
        return 8;
      
      case StrategyType.BALANCED:
        return 5;
      
      case StrategyType.CONSERVATIVE:
        return 2;
      
      default:
        return 5; // Default to balanced
    }
  }

  /**
   * Gets expected returns range for strategy
   * @param type - Strategy type
   * @returns Expected returns range (min, max)
   */
  getExpectedReturns(type: StrategyType): [number, number] {
    switch (type) {
      case StrategyType.AGGRESSIVE:
        return [0.30, 1.00]; // 30-100% expected returns
      
      case StrategyType.BALANCED:
        return [0.15, 0.50]; // 15-50% expected returns
      
      case StrategyType.CONSERVATIVE:
        return [0.08, 0.25]; // 8-25% expected returns
      
      default:
        return [0.15, 0.50]; // Default to balanced
    }
  }
} 