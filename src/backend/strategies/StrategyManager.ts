/**
 * Strategy Manager Implementation
 *
 * Coordinates multiple strategies and executes decisions
 *
 * @reference PRD.md#4.1 - Strategy Execution
 * @reference DTS.md#3.1 - Strategy Manager
 */

import { StrategyManager as IStrategyManager, Strategy, Token, MarketData, StrategyDecision } from './types';
import { StrategyFactory } from './StrategyFactory';

export class StrategyManager implements IStrategyManager {
  private strategies: Map<string, Strategy> = new Map();
  private factory: StrategyFactory;

  constructor() {
    this.factory = StrategyFactory.getInstance();
  }

  /**
   * Adds a strategy to the manager
   * @param strategy - Strategy to add
   */
  addStrategy(strategy: Strategy): void {
    try {
      const strategyId = this.generateStrategyId(strategy);
      this.strategies.set(strategyId, strategy);

      console.log(`StrategyManager: Added strategy ${strategyId}`, {
        type: strategy.config.type,
        riskTolerance: strategy.config.riskTolerance,
      });
    } catch (error) {
      console.error('StrategyManager: Error adding strategy', error);
    }
  }

  /**
   * Removes a strategy from the manager
   * @param strategyId - ID of strategy to remove
   */
  removeStrategy(strategyId: string): void {
    try {
      const removed = this.strategies.delete(strategyId);

      if (removed) {
        console.log(`StrategyManager: Removed strategy ${strategyId}`);
      } else {
        console.warn(`StrategyManager: Strategy ${strategyId} not found for removal`);
      }
    } catch (error) {
      console.error('StrategyManager: Error removing strategy', error);
    }
  }

  /**
   * Gets all strategies
   * @returns Array of strategies
   */
  getStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Executes strategy analysis for a token
   * @param token - Token to analyze
   * @param marketData - Current market data
   * @returns Strategy decision
   */
  async executeStrategy(token: Token, marketData: MarketData): Promise<StrategyDecision> {
    try {
      console.log(`StrategyManager: Executing strategy analysis for ${token.symbol}`);

      const decisions: StrategyDecision[] = [];
      let totalConfidence = 0;
      let totalPositionSize = 0;
      let totalReasoning = '';

      // Execute each strategy
      for (const [strategyId, strategy] of this.strategies) {
        try {
          const decision = await this.executeSingleStrategy(strategy, token, marketData);
          decisions.push(decision);

          if (decision.shouldEnter) {
            totalConfidence += decision.confidence;
            totalPositionSize += decision.positionSize || 0;
            totalReasoning += `${strategy.config.type}: ${decision.reasoning}; `;
          }
        } catch (error) {
          console.error(`StrategyManager: Error executing strategy ${strategyId}`, error);
        }
      }

      // Aggregate decisions
      const shouldEnter = decisions.some(d => d.shouldEnter);
      const avgConfidence = decisions.length > 0 ? totalConfidence / decisions.length : 0;
      const avgPositionSize = shouldEnter ? totalPositionSize / decisions.filter(d => d.shouldEnter).length : 0;

      const finalDecision: StrategyDecision = {
        shouldEnter,
        positionSize: shouldEnter ? avgPositionSize : undefined,
        confidence: avgConfidence,
        reasoning: totalReasoning || 'No strategies recommend entry',
      };

      console.log(`StrategyManager: Final decision for ${token.symbol}`, finalDecision);

      return finalDecision;
    } catch (error) {
      console.error('StrategyManager: Error executing strategy', error);

      // Return safe default decision
      return {
        shouldEnter: false,
        confidence: 0,
        reasoning: 'Error occurred during strategy execution',
      };
    }
  }

  /**
   * Executes a single strategy
   * @param strategy - Strategy to execute
   * @param token - Token to analyze
   * @param marketData - Current market data
   * @returns Strategy decision
   */
  private async executeSingleStrategy(
    strategy: Strategy,
    token: Token,
    marketData: MarketData
  ): Promise<StrategyDecision> {
    try {
      // Check if should enter
      const shouldEnter = await strategy.shouldEnter(token, marketData);

      if (!shouldEnter) {
        return {
          shouldEnter: false,
          confidence: 0,
          reasoning: `${strategy.config.type} strategy: Entry criteria not met`,
        };
      }

      // Calculate position size (assuming $10000 portfolio for demo)
      const portfolioValue = 10000;
      const positionSize = await strategy.calculatePositionSize(token, portfolioValue);

      if (positionSize === 0) {
        return {
          shouldEnter: false,
          confidence: 0,
          reasoning: `${strategy.config.type} strategy: Position size too small`,
        };
      }

      // Calculate confidence based on various factors
      const confidence = this.calculateConfidence(strategy, token, marketData);

      // Generate reasoning
      const reasoning = this.generateReasoning(strategy, token, marketData);

      return {
        shouldEnter: true,
        positionSize,
        confidence,
        reasoning,
      };
    } catch (error) {
      console.error('StrategyManager: Error executing single strategy', error);
      return {
        shouldEnter: false,
        confidence: 0,
        reasoning: `Error in ${strategy.config.type} strategy execution`,
      };
    }
  }

  /**
   * Calculates confidence score for a strategy decision
   * @param strategy - Strategy used
   * @param token - Token analyzed
   * @param marketData - Market data
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(strategy: Strategy, token: Token, marketData: MarketData): number {
    try {
      let confidence = 0.5; // Base confidence

      // Sentiment factor
      if (token.sentiment > 0.5) {
        confidence += 0.2;
      } else if (token.sentiment > 0.3) {
        confidence += 0.1;
      } else if (token.sentiment < 0) {
        confidence -= 0.1;
      }

      // Volume factor
      if (token.volume24h > 100000) {
        confidence += 0.1;
      } else if (token.volume24h < 10000) {
        confidence -= 0.1;
      }

      // Market cap factor
      if (token.marketCap > 500000) {
        confidence += 0.1;
      } else if (token.marketCap < 100000) {
        confidence -= 0.1;
      }

      // TVL factor
      if (token.tvl > 50000) {
        confidence += 0.1;
      } else if (token.tvl < 10000) {
        confidence -= 0.1;
      }

      // Strategy-specific adjustments
      switch (strategy.config.type) {
        case 'aggressive':
          if (token.sentiment > 0.4) confidence += 0.1;
          break;
        case 'balanced':
          if (token.sentiment > 0.2) confidence += 0.1;
          break;
        case 'conservative':
          if (token.sentiment > 0.3) confidence += 0.1;
          break;
      }

      return Math.max(0, Math.min(1, confidence)); // Clamp between 0 and 1
    } catch (error) {
      console.error('StrategyManager: Error calculating confidence', error);
      return 0.5; // Default confidence
    }
  }

  /**
   * Generates reasoning for a strategy decision
   * @param strategy - Strategy used
   * @param token - Token analyzed
   * @param marketData - Market data
   * @returns Reasoning string
   */
  private generateReasoning(strategy: Strategy, token: Token, marketData: MarketData): string {
    try {
      const reasons: string[] = [];

      // Sentiment reasoning
      if (token.sentiment > 0.3) {
        reasons.push('positive sentiment');
      } else if (token.sentiment < 0) {
        reasons.push('negative sentiment');
      }

      // Volume reasoning
      if (token.volume24h > 50000) {
        reasons.push('high volume');
      } else if (token.volume24h < 10000) {
        reasons.push('low volume');
      }

      // Market cap reasoning
      if (token.marketCap > 500000) {
        reasons.push('established market cap');
      } else if (token.marketCap < 100000) {
        reasons.push('small market cap');
      }

      // TVL reasoning
      if (token.tvl > 25000) {
        reasons.push('good liquidity');
      } else if (token.tvl < 10000) {
        reasons.push('low liquidity');
      }

      // Trending status
      if (token.trending) {
        reasons.push('trending token');
      }

      return `${strategy.config.type} strategy: ${reasons.join(', ')}`;
    } catch (error) {
      console.error('StrategyManager: Error generating reasoning', error);
      return `${strategy.config.type} strategy: Analysis completed`;
    }
  }

  /**
   * Generates a unique ID for a strategy
   * @param strategy - Strategy to generate ID for
   * @returns Strategy ID
   */
  private generateStrategyId(strategy: Strategy): string {
    return `${strategy.config.type}-${strategy.config.riskTolerance}-${Date.now()}`;
  }

  /**
   * Gets strategy statistics
   * @returns Statistics about managed strategies
   */
  getStrategyStats(): {
    totalStrategies: number;
    strategyTypes: Record<string, number>;
    riskLevels: Record<string, number>;
  } {
    try {
      const stats = {
        totalStrategies: this.strategies.size,
        strategyTypes: {} as Record<string, number>,
        riskLevels: {} as Record<string, number>,
      };

      for (const strategy of this.strategies.values()) {
        // Count strategy types
        const {type} = strategy.config;
        stats.strategyTypes[type] = (stats.strategyTypes[type] || 0) + 1;

        // Count risk levels
        const riskLevel = strategy.config.riskTolerance;
        stats.riskLevels[riskLevel] = (stats.riskLevels[riskLevel] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('StrategyManager: Error getting strategy stats', error);
      return {
        totalStrategies: 0,
        strategyTypes: {},
        riskLevels: {},
      };
    }
  }

  /**
   * Clears all strategies
   */
  clearStrategies(): void {
    try {
      this.strategies.clear();
      console.log('StrategyManager: Cleared all strategies');
    } catch (error) {
      console.error('StrategyManager: Error clearing strategies', error);
    }
  }

  /**
   * Gets strategy by ID
   * @param strategyId - Strategy ID
   * @returns Strategy or undefined
   */
  getStrategy(strategyId: string): Strategy | undefined {
    return this.strategies.get(strategyId);
  }

  /**
   * Updates strategy configuration
   * @param strategyId - Strategy ID
   * @param config - New configuration
   * @returns boolean - Whether update was successful
   */
  updateStrategy(strategyId: string, config: Partial<Strategy['config']>): boolean {
    try {
      const strategy = this.strategies.get(strategyId);
      if (!strategy) {
        return false;
      }

      // Create new strategy with updated config
      const updatedStrategy = this.factory.createStrategy(strategy.config.type, {
        ...strategy.config,
        ...config,
      });

      // Replace old strategy
      this.strategies.set(strategyId, updatedStrategy);

      console.log(`StrategyManager: Updated strategy ${strategyId}`, config);
      return true;
    } catch (error) {
      console.error('StrategyManager: Error updating strategy', error);
      return false;
    }
  }
}
