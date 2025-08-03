/**
 * Conservative Strategy Implementation
 * 
 * Low-risk strategy with capital preservation focus
 * 
 * @reference PRD.md#4.1 - Strategy Execution
 * @reference DTS.md#3.1 - ConservativeStrategy.ts
 */

import { Strategy, StrategyConfig, StrategyType, Token, Position, MarketData } from './types';

export class ConservativeStrategy implements Strategy {
  public readonly config: StrategyConfig;

  constructor(config?: Partial<StrategyConfig>) {
    this.config = {
      type: StrategyType.CONSERVATIVE,
      riskTolerance: 'low',
      maxPositionSize: 0.02, // 2% of portfolio
      stopLoss: 0.08, // 8%
      takeProfit: 0.25, // 25%
      sentimentThreshold: 0.2, // Higher threshold than other strategies
      ...config
    };
  }

  /**
   * Determines if a position should be entered for the given token
   * @reference DTS.md#3.1 - ConservativeStrategy shouldEnter
   */
  async shouldEnter(token: Token, marketData: MarketData): Promise<boolean> {
    try {
      // Entry conditions for conservative strategy (very strict)
      const sentiment = token.sentiment;
      const volume = token.volume24h;
      const marketCap = token.marketCap;
      const tvl = token.tvl;
      
      // Very conservative criteria for conservative strategy
      const meetsSentimentCriteria = sentiment > this.config.sentimentThreshold;
      const meetsVolumeCriteria = volume >= 100000; // High volume requirement
      const meetsMarketCapCriteria = marketCap >= 200000 && marketCap <= 1000000; // $200K-$1M range
      const meetsTvlCriteria = tvl >= 50000; // High TVL requirement
      const isTrending = token.trending;

      // Low volatility check for conservative strategy
      const volatility = this.calculateVolatility(marketData.priceHistory);
      const meetsVolatilityCriteria = volatility > 0.02 && volatility < 0.20; // 2-20% volatility range

      // Additional stability checks for conservative strategy
      const hasStablePrice = this.checkPriceStability(marketData.priceHistory);
      const hasConsistentVolume = this.checkVolumeConsistency(marketData.volumeHistory);
      const hasPositiveTrend = this.checkPositiveTrend(marketData.priceHistory);
      const hasStrongLiquidity = this.checkStrongLiquidity(token);

      const shouldEnter = meetsSentimentCriteria &&
                         meetsVolumeCriteria &&
                         meetsMarketCapCriteria &&
                         meetsTvlCriteria &&
                         isTrending &&
                         meetsVolatilityCriteria &&
                         hasStablePrice &&
                         hasConsistentVolume &&
                         hasPositiveTrend &&
                         hasStrongLiquidity;

      console.log(`ConservativeStrategy: Entry analysis for ${token.symbol}`, {
        sentiment,
        volume,
        marketCap,
        tvl,
        volatility,
        hasStablePrice,
        hasConsistentVolume,
        hasPositiveTrend,
        hasStrongLiquidity,
        shouldEnter,
        meetsSentimentCriteria,
        meetsVolumeCriteria,
        meetsMarketCapCriteria,
        meetsTvlCriteria,
        isTrending,
        meetsVolatilityCriteria
      });

      return shouldEnter;
    } catch (error) {
      console.error('ConservativeStrategy: Error in shouldEnter', error);
      return false; // Fail safe - don't enter on error
    }
  }

  /**
   * Calculates position size based on conservative approach
   * @reference DTS.md#3.1 - ConservativeStrategy calculatePositionSize
   */
  async calculatePositionSize(token: Token, portfolioValue: number): Promise<number> {
    try {
      // Base position size from config
      const baseSize = portfolioValue * this.config.maxPositionSize;
      
      // Conservative sentiment multiplier (very conservative)
      const sentimentMultiplier = Math.min(token.sentiment * 1.2, 1.0);
      
      // Market cap multiplier (prefer larger, more established caps)
      const marketCapMultiplier = Math.min(token.marketCap / 1000000, 0.6);
      
      // Volume multiplier (prefer high volume)
      const volumeMultiplier = Math.min(token.volume24h / 500000, 0.8);
      
      // Stability multiplier (heavily weight stability)
      const stabilityMultiplier = this.calculateStabilityMultiplier(token);
      
      // Liquidity multiplier (prefer high liquidity)
      const liquidityMultiplier = this.calculateLiquidityMultiplier(token);
      
      // Calculate final position size
      const positionSize = baseSize * sentimentMultiplier * marketCapMultiplier * 
                          volumeMultiplier * stabilityMultiplier * liquidityMultiplier;
      
      // Ensure position size doesn't exceed maximum
      const maxPositionSize = portfolioValue * this.config.maxPositionSize;
      const finalPositionSize = Math.min(positionSize, maxPositionSize);
      
      // Minimum position size check
      const minPositionSize = 25; // $25 minimum for conservative strategy
      if (finalPositionSize < minPositionSize) {
        return 0; // Don't enter if position is too small
      }

      console.log(`ConservativeStrategy: Position size calculation for ${token.symbol}`, {
        baseSize,
        sentimentMultiplier,
        marketCapMultiplier,
        volumeMultiplier,
        stabilityMultiplier,
        liquidityMultiplier,
        positionSize,
        finalPositionSize,
        minPositionSize
      });

      return finalPositionSize;
    } catch (error) {
      console.error('ConservativeStrategy: Error in calculatePositionSize', error);
      return 0; // Fail safe - no position on error
    }
  }

  /**
   * Determines if a position should be exited
   * @reference DTS.md#3.1 - ConservativeStrategy shouldExit
   */
  async shouldExit(position: Position, currentData: MarketData): Promise<boolean> {
    try {
      const pnl = position.pnl;
      const pnlPercentage = pnl / position.size;
      const sentiment = currentData.token.sentiment;
      
      // Exit conditions for conservative strategy (very conservative)
      const stopLossTriggered = pnlPercentage <= -this.config.stopLoss;
      const takeProfitTriggered = pnlPercentage >= this.config.takeProfit;
      const negativeSentimentSpike = sentiment < -0.1; // Very conservative sentiment exit
      
      // Additional exit conditions for conservative strategy
      const volumeDrop = currentData.token.volume24h < position.entryPrice * 5000; // Volume dropped
      const marketCapDrop = currentData.token.marketCap < position.entryPrice * 200000; // Market cap dropped
      const volatilitySpike = this.calculateVolatility(currentData.priceHistory) > 0.3; // High volatility
      const liquidityDrop = this.checkLiquidityDrop(currentData.token);
      
      const shouldExit = stopLossTriggered ||
                        takeProfitTriggered ||
                        negativeSentimentSpike ||
                        volumeDrop ||
                        marketCapDrop ||
                        volatilitySpike ||
                        liquidityDrop;

      console.log(`ConservativeStrategy: Exit analysis for position ${position.id}`, {
        pnlPercentage,
        sentiment,
        stopLossTriggered,
        takeProfitTriggered,
        negativeSentimentSpike,
        volumeDrop,
        marketCapDrop,
        volatilitySpike,
        liquidityDrop,
        shouldExit
      });

      return shouldExit;
    } catch (error) {
      console.error('ConservativeStrategy: Error in shouldExit', error);
      return true; // Fail safe - exit on error
    }
  }

  /**
   * Calculates price range for position
   * @reference DTS.md#3.1 - ConservativeStrategy calculatePriceRange
   */
  async calculatePriceRange(token: Token, currentPrice: number): Promise<[number, number]> {
    try {
      // Conservative strategy uses narrow price ranges
      const volatility = this.calculateVolatility(token.priceHistory || []);
      
      // Base range percentage (narrow for conservative strategy)
      const baseRangePercentage = 0.06; // 6% base range
      
      // Adjust range based on volatility (very conservative)
      const volatilityMultiplier = Math.min(volatility * 1.0, 1.0);
      const rangePercentage = baseRangePercentage * volatilityMultiplier;
      
      // Calculate min and max prices
      const range = rangePercentage / 2;
      const minPrice = currentPrice * (1 - range);
      const maxPrice = currentPrice * (1 + range);
      
      console.log(`ConservativeStrategy: Price range calculation for ${token.symbol}`, {
        currentPrice,
        volatility,
        rangePercentage,
        minPrice,
        maxPrice
      });

      return [minPrice, maxPrice];
    } catch (error) {
      console.error('ConservativeStrategy: Error in calculatePriceRange', error);
      // Return a safe default range
      const defaultRange = 0.05; // 5% default range
      return [
        currentPrice * (1 - defaultRange / 2),
        currentPrice * (1 + defaultRange / 2)
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
        return 0.02; // Default volatility for conservative strategy
      }

      // Calculate price changes
      const priceChanges = [];
      for (let i = 1; i < priceHistory.length; i++) {
        const change = Math.abs(priceHistory[i].price - priceHistory[i - 1].price) / priceHistory[i - 1].price;
        priceChanges.push(change);
      }

      // Calculate average volatility
      const avgVolatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
      
      return Math.min(avgVolatility, 0.3); // Cap at 30% for conservative strategy
    } catch (error) {
      console.error('ConservativeStrategy: Error calculating volatility', error);
      return 0.02; // Default volatility
    }
  }

  /**
   * Checks price stability over time
   * @param priceHistory - Array of price points
   * @returns boolean - Whether price is stable
   */
  private checkPriceStability(priceHistory: any[]): boolean {
    try {
      if (priceHistory.length < 10) {
        return true; // Assume stable if not enough data
      }

      // Calculate price variance
      const prices = priceHistory.map(p => p.price);
      const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;

      // Consider stable if coefficient of variation is less than 15%
      return coefficientOfVariation < 0.15;
    } catch (error) {
      console.error('ConservativeStrategy: Error checking price stability', error);
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
      if (volumeHistory.length < 5) {
        return true; // Assume consistent if not enough data
      }

      // Calculate volume variance
      const volumes = volumeHistory.map(v => v.volume);
      const mean = volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length;
      const variance = volumes.reduce((sum, volume) => sum + Math.pow(volume - mean, 2), 0) / volumes.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;

      // Consider consistent if coefficient of variation is less than 30%
      return coefficientOfVariation < 0.3;
    } catch (error) {
      console.error('ConservativeStrategy: Error checking volume consistency', error);
      return true; // Assume consistent on error
    }
  }

  /**
   * Checks for positive price trend
   * @param priceHistory - Array of price points
   * @returns boolean - Whether trend is positive
   */
  private checkPositiveTrend(priceHistory: any[]): boolean {
    try {
      if (priceHistory.length < 5) {
        return true; // Assume positive if not enough data
      }

      // Calculate trend over last 5 points
      const recentPrices = priceHistory.slice(-5).map(p => p.price);
      const firstPrice = recentPrices[0];
      const lastPrice = recentPrices[recentPrices.length - 1];
      const trend = (lastPrice - firstPrice) / firstPrice;

      // Consider positive if trend is > 5%
      return trend > 0.05;
    } catch (error) {
      console.error('ConservativeStrategy: Error checking positive trend', error);
      return true; // Assume positive on error
    }
  }

  /**
   * Checks for strong liquidity
   * @param token - Token information
   * @returns boolean - Whether liquidity is strong
   */
  private checkStrongLiquidity(token: Token): boolean {
    try {
      // Check if TVL is high relative to market cap
      const tvlToMarketCapRatio = token.tvl / token.marketCap;
      
      // Consider strong if TVL is > 10% of market cap (more realistic)
      return tvlToMarketCapRatio > 0.1;
    } catch (error) {
      console.error('ConservativeStrategy: Error checking strong liquidity', error);
      return true; // Assume strong on error
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
        multiplier *= 1.2;
      }

      // Higher TVL = more stable
      if (token.tvl > 100000) {
        multiplier *= 1.2;
      }

      // Higher volume = more stable
      if (token.volume24h > 200000) {
        multiplier *= 1.1;
      }

      // Positive sentiment = more stable
      if (token.sentiment > 0.3) {
        multiplier *= 1.2;
      }

      return Math.min(multiplier, 1.5); // Cap at 1.5
    } catch (error) {
      console.error('ConservativeStrategy: Error calculating stability multiplier', error);
      return 1.0; // Default multiplier
    }
  }

  /**
   * Calculates liquidity multiplier
   * @param token - Token information
   * @returns number - Liquidity multiplier
   */
  private calculateLiquidityMultiplier(token: Token): number {
    try {
      let multiplier = 1.0;

      // Higher TVL to market cap ratio = better liquidity
      const tvlToMarketCapRatio = token.tvl / token.marketCap;
      
      if (tvlToMarketCapRatio > 0.3) {
        multiplier *= 1.3;
      } else if (tvlToMarketCapRatio > 0.2) {
        multiplier *= 1.2;
      } else if (tvlToMarketCapRatio > 0.1) {
        multiplier *= 1.1;
      }

      return Math.min(multiplier, 1.3); // Cap at 1.3
    } catch (error) {
      console.error('ConservativeStrategy: Error calculating liquidity multiplier', error);
      return 1.0; // Default multiplier
    }
  }

  /**
   * Checks if liquidity has dropped significantly
   * @param token - Current token data
   * @returns boolean - Whether liquidity has dropped
   */
  private checkLiquidityDrop(token: Token): boolean {
    try {
      // Check if TVL to market cap ratio has dropped below 10%
      const tvlToMarketCapRatio = token.tvl / token.marketCap;
      return tvlToMarketCapRatio < 0.1;
    } catch (error) {
      console.error('ConservativeStrategy: Error checking liquidity drop', error);
      return false; // Assume no drop on error
    }
  }

  /**
   * Gets strategy name for logging
   */
  getStrategyName(): string {
    return 'ConservativeStrategy';
  }

  /**
   * Gets strategy description
   */
  getStrategyDescription(): string {
    return 'Low-risk strategy with capital preservation focus for established meme coins';
  }
} 