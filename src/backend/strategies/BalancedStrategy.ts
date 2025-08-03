/**
 * Balanced Strategy Implementation
 *
 * Moderate risk strategy with balanced risk-reward profile
 *
 * @reference PRD.md#4.1 - Strategy Execution
 * @reference DTS.md#3.1 - BalancedStrategy.ts
 */

import { Strategy, StrategyConfig, StrategyType, Token, Position, MarketData } from './types';

export class BalancedStrategy implements Strategy {
  public readonly config: StrategyConfig;

  constructor(config?: Partial<StrategyConfig>) {
    this.config = {
      type: StrategyType.BALANCED,
      riskTolerance: 'medium',
      maxPositionSize: 0.03, // 3% of portfolio
      stopLoss: 0.10, // 10%
      takeProfit: 0.30, // 30%
      sentimentThreshold: 0.1, // Lower threshold than aggressive
      ...config,
    };
  }

  /**
   * Determines if a position should be entered for the given token
   * @reference DTS.md#3.1 - BalancedStrategy shouldEnter
   */
  async shouldEnter(token: Token, marketData: MarketData): Promise<boolean> {
    try {
      // Entry conditions for balanced strategy (more conservative than aggressive)
      const {sentiment} = token;
      const volume = token.volume24h;
      const {marketCap} = token;
      const {tvl} = token;

      // More conservative criteria for balanced strategy
      const meetsSentimentCriteria = sentiment > this.config.sentimentThreshold;
      const meetsVolumeCriteria = volume >= 50000; // Higher volume requirement
      const meetsMarketCapCriteria = marketCap >= 100000 && marketCap <= 2000000; // $100K-$2M range
      const meetsTvlCriteria = tvl >= 25000; // Higher TVL requirement
      const isTrending = token.trending;

      // Moderate volatility check for balanced strategy
      const volatility = this.calculateVolatility(marketData.priceHistory);
      const meetsVolatilityCriteria = volatility > 0.05 && volatility < 0.3; // 5-30% volatility range

      // Additional stability checks for balanced strategy
      const hasStablePrice = this.checkPriceStability(marketData.priceHistory);
      const hasConsistentVolume = this.checkVolumeConsistency(marketData.volumeHistory);

      const shouldEnter = meetsSentimentCriteria &&
                         meetsVolumeCriteria &&
                         meetsMarketCapCriteria &&
                         meetsTvlCriteria &&
                         isTrending &&
                         meetsVolatilityCriteria &&
                         hasStablePrice &&
                         hasConsistentVolume;

      console.log(`BalancedStrategy: Entry analysis for ${token.symbol}`, {
        sentiment,
        volume,
        marketCap,
        tvl,
        volatility,
        hasStablePrice,
        hasConsistentVolume,
        shouldEnter,
        meetsSentimentCriteria,
        meetsVolumeCriteria,
        meetsMarketCapCriteria,
        meetsTvlCriteria,
        isTrending,
        meetsVolatilityCriteria,
      });

      console.log(`BalancedStrategy: Entry analysis for ${token.symbol}`, {
        sentiment,
        volume,
        marketCap,
        tvl,
        volatility,
        hasStablePrice,
        hasConsistentVolume,
        shouldEnter,
      });

      return shouldEnter;
    } catch (error) {
      console.error('BalancedStrategy: Error in shouldEnter', error);
      return false; // Fail safe - don't enter on error
    }
  }

  /**
   * Calculates position size based on balanced approach
   * @reference DTS.md#3.1 - BalancedStrategy calculatePositionSize
   */
  async calculatePositionSize(token: Token, portfolioValue: number): Promise<number> {
    try {
      // Base position size from config
      const baseSize = portfolioValue * this.config.maxPositionSize;

      // Balanced sentiment multiplier (more conservative than aggressive)
      const sentimentMultiplier = Math.min(token.sentiment * 1.5, 1.2);

      // Market cap multiplier (prefer mid-range caps)
      const marketCapMultiplier = Math.min(token.marketCap / 2000000, 0.8);

      // Volume multiplier (moderate volume preference)
      const volumeMultiplier = Math.min(token.volume24h / 200000, 1.0);

      // Stability multiplier (prefer stable tokens)
      const stabilityMultiplier = this.calculateStabilityMultiplier(token);

      // Calculate final position size
      const positionSize = baseSize * sentimentMultiplier * marketCapMultiplier * volumeMultiplier * stabilityMultiplier;

      // Ensure position size doesn't exceed maximum
      const maxPositionSize = portfolioValue * this.config.maxPositionSize;
      const finalPositionSize = Math.min(positionSize, maxPositionSize);

      // Minimum position size check
      const minPositionSize = 25; // $25 minimum for balanced strategy
      if (finalPositionSize < minPositionSize) {
        return 0; // Don't enter if position is too small
      }

      console.log(`BalancedStrategy: Position size calculation for ${token.symbol}`, {
        baseSize,
        sentimentMultiplier,
        marketCapMultiplier,
        volumeMultiplier,
        stabilityMultiplier,
        positionSize,
        finalPositionSize,
        minPositionSize,
      });

      return finalPositionSize;
    } catch (error) {
      console.error('BalancedStrategy: Error in calculatePositionSize', error);
      return 0; // Fail safe - no position on error
    }
  }

  /**
   * Determines if a position should be exited
   * @reference DTS.md#3.1 - BalancedStrategy shouldExit
   */
  async shouldExit(position: Position, currentData: MarketData): Promise<boolean> {
    try {
      const {pnl} = position;
      const pnlPercentage = pnl / position.size;
      const {sentiment} = currentData.token;

      // Exit conditions for balanced strategy (more conservative)
      const stopLossTriggered = pnlPercentage <= -this.config.stopLoss;
      const takeProfitTriggered = pnlPercentage >= this.config.takeProfit;
      const negativeSentimentSpike = sentiment < -0.3; // More conservative sentiment exit

      // Additional exit conditions for balanced strategy
      const volumeDrop = currentData.token.volume24h < position.entryPrice * 2000; // Volume dropped
      const marketCapDrop = currentData.token.marketCap < position.entryPrice * 100000; // Market cap dropped
      const volatilitySpike = this.calculateVolatility(currentData.priceHistory) > 0.5; // High volatility

      const shouldExit = stopLossTriggered ||
                        takeProfitTriggered ||
                        negativeSentimentSpike ||
                        volumeDrop ||
                        marketCapDrop ||
                        volatilitySpike;

      console.log(`BalancedStrategy: Exit analysis for position ${position.id}`, {
        pnlPercentage,
        sentiment,
        stopLossTriggered,
        takeProfitTriggered,
        negativeSentimentSpike,
        volumeDrop,
        marketCapDrop,
        volatilitySpike,
        shouldExit,
      });

      return shouldExit;
    } catch (error) {
      console.error('BalancedStrategy: Error in shouldExit', error);
      return true; // Fail safe - exit on error
    }
  }

  /**
   * Calculates price range for position
   * @reference DTS.md#3.1 - BalancedStrategy calculatePriceRange
   */
  async calculatePriceRange(token: Token, currentPrice: number): Promise<[number, number]> {
    try {
      // Balanced strategy uses moderate price ranges
      const volatility = this.calculateVolatility(token.priceHistory || []);

      // Base range percentage (moderate for balanced strategy)
      const baseRangePercentage = 0.10; // 10% base range

      // Adjust range based on volatility (more conservative than aggressive)
      const volatilityMultiplier = Math.min(volatility * 1.5, 1.5);
      const rangePercentage = baseRangePercentage * volatilityMultiplier;

      // Calculate min and max prices
      const range = rangePercentage / 2;
      const minPrice = currentPrice * (1 - range);
      const maxPrice = currentPrice * (1 + range);

      console.log(`BalancedStrategy: Price range calculation for ${token.symbol}`, {
        currentPrice,
        volatility,
        rangePercentage,
        minPrice,
        maxPrice,
      });

      return [minPrice, maxPrice];
    } catch (error) {
      console.error('BalancedStrategy: Error in calculatePriceRange', error);
      // Return a safe default range
      const defaultRange = 0.08; // 8% default range
      return [
        currentPrice * (1 - defaultRange / 2),
        currentPrice * (1 + defaultRange / 2),
      ];
    }
  }

  /**
   * Calculates volatility from price history
   * @param priceHistory - Array of price points
   * @returns number - Volatility percentage
   */
  private calculateVolatility(priceHistory: any[]): number {
    try {
      if (priceHistory.length < 2) {
        return 0.05; // Default volatility for balanced strategy
      }

      // Calculate price changes
      const priceChanges = [];
      for (let i = 1; i < priceHistory.length; i++) {
        const change = Math.abs(priceHistory[i].price - priceHistory[i - 1].price) / priceHistory[i - 1].price;
        priceChanges.push(change);
      }

      // Calculate average volatility
      const avgVolatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;

      return Math.min(avgVolatility, 0.5); // Cap at 50% for balanced strategy
    } catch (error) {
      console.error('BalancedStrategy: Error calculating volatility', error);
      return 0.05; // Default volatility
    }
  }

  /**
   * Checks price stability over time
   * @param priceHistory - Array of price points
   * @returns boolean - Whether price is stable
   */
  private checkPriceStability(priceHistory: any[]): boolean {
    try {
      if (priceHistory.length < 5) {
        return true; // Assume stable if not enough data
      }

      // Calculate price variance
      const prices = priceHistory.map(p => p.price);
      const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;

      // Consider stable if coefficient of variation is less than 20%
      return coefficientOfVariation < 0.2;
    } catch (error) {
      console.error('BalancedStrategy: Error checking price stability', error);
      return true; // Assume stable on error
    }
  }

  /**
   * Checks volume consistency over time
   * @param volumeHistory - Array of volume points
   * @returns boolean - Whether volume is consistent
   */
  private checkVolumeConsistency(volumeHistory: any[]): boolean {
    try {
      if (volumeHistory.length < 3) {
        return true; // Assume consistent if not enough data
      }

      // Calculate volume variance
      const volumes = volumeHistory.map(v => v.volume);
      const mean = volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length;
      const variance = volumes.reduce((sum, volume) => sum + Math.pow(volume - mean, 2), 0) / volumes.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;

      // Consider consistent if coefficient of variation is less than 50%
      return coefficientOfVariation < 0.5;
    } catch (error) {
      console.error('BalancedStrategy: Error checking volume consistency', error);
      return true; // Assume consistent on error
    }
  }

  /**
   * Calculates stability multiplier based on token characteristics
   * @param token - Token information
   * @returns number - Stability multiplier
   */
  private calculateStabilityMultiplier(token: Token): number {
    try {
      let multiplier = 1.0;

      // Higher market cap = more stable
      if (token.marketCap > 500000) {
        multiplier *= 1.1;
      }

      // Higher TVL = more stable
      if (token.tvl > 50000) {
        multiplier *= 1.1;
      }

      // Higher volume = more stable
      if (token.volume24h > 100000) {
        multiplier *= 1.05;
      }

      // Positive sentiment = more stable
      if (token.sentiment > 0.2) {
        multiplier *= 1.1;
      }

      return Math.min(multiplier, 1.3); // Cap at 1.3
    } catch (error) {
      console.error('BalancedStrategy: Error calculating stability multiplier', error);
      return 1.0; // Default multiplier
    }
  }

  /**
   * Gets strategy name for logging
   */
  getStrategyName(): string {
    return 'BalancedStrategy';
  }

  /**
   * Gets strategy description
   */
  getStrategyDescription(): string {
    return 'Moderate risk strategy with balanced risk-reward profile for stable meme coins';
  }
}
