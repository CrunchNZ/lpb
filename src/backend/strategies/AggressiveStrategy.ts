/**
 * Aggressive Strategy Implementation
 * 
 * High-risk, high-reward strategy for volatile meme coins
 * 
 * @reference PRD.md#4.1 - Strategy Execution
 * @reference DTS.md#3.1 - AggressiveStrategy.ts
 */

import { Strategy, StrategyConfig, StrategyType, Token, Position, MarketData } from './types';

export class AggressiveStrategy implements Strategy {
  public readonly config: StrategyConfig;

  constructor(config?: Partial<StrategyConfig>) {
    this.config = {
      type: StrategyType.AGGRESSIVE,
      riskTolerance: 'high',
      maxPositionSize: 0.05, // 5% of portfolio
      stopLoss: 0.15, // 15%
      takeProfit: 0.50, // 50%
      sentimentThreshold: 0.3, // Positive sentiment required
      ...config
    };
  }

  /**
   * Determines if a position should be entered for the given token
   * @reference DTS.md#3.1 - AggressiveStrategy shouldEnter
   */
  async shouldEnter(token: Token, marketData: MarketData): Promise<boolean> {
    try {
      // Entry conditions for aggressive strategy
      const sentiment = token.sentiment;
      const volume = token.volume24h;
      const marketCap = token.marketCap;
      const tvl = token.tvl;
      
      // Check if token meets aggressive entry criteria
      const meetsSentimentCriteria = sentiment > this.config.sentimentThreshold;
      const meetsVolumeCriteria = volume >= 10000; // $10K daily volume minimum
      const meetsMarketCapCriteria = marketCap >= 50000 && marketCap <= 5000000; // $50K-$5M range
      const meetsTvlCriteria = tvl >= 10000; // $10K TVL minimum
      const isTrending = token.trending;

      // Additional volatility check for aggressive strategy
      const volatility = this.calculateVolatility(marketData.priceHistory);
      const meetsVolatilityCriteria = volatility > 0.1; // 10% minimum volatility

      const shouldEnter = meetsSentimentCriteria &&
                         meetsVolumeCriteria &&
                         meetsMarketCapCriteria &&
                         meetsTvlCriteria &&
                         isTrending &&
                         meetsVolatilityCriteria;

      console.log(`AggressiveStrategy: Entry analysis for ${token.symbol}`, {
        sentiment,
        volume,
        marketCap,
        tvl,
        volatility,
        shouldEnter
      });

      return shouldEnter;
    } catch (error) {
      console.error('AggressiveStrategy: Error in shouldEnter', error);
      return false; // Fail safe - don't enter on error
    }
  }

  /**
   * Calculates position size based on sentiment and market cap
   * @reference DTS.md#3.1 - AggressiveStrategy calculatePositionSize
   */
  async calculatePositionSize(token: Token, portfolioValue: number): Promise<number> {
    try {
      // Base position size from config
      const baseSize = portfolioValue * this.config.maxPositionSize;
      
      // Sentiment multiplier (higher sentiment = larger position)
      const sentimentMultiplier = Math.min(token.sentiment * 2, 1.5);
      
      // Market cap multiplier (smaller caps get larger positions)
      const marketCapMultiplier = Math.min(token.marketCap / 1000000, 1);
      
      // Volume multiplier (higher volume = larger position)
      const volumeMultiplier = Math.min(token.volume24h / 100000, 1.2);
      
      // Calculate final position size
      const positionSize = baseSize * sentimentMultiplier * marketCapMultiplier * volumeMultiplier;
      
      // Ensure position size doesn't exceed maximum
      const maxPositionSize = portfolioValue * this.config.maxPositionSize;
      const finalPositionSize = Math.min(positionSize, maxPositionSize);
      
      // Minimum position size check
      const minPositionSize = 100; // $100 minimum
      if (finalPositionSize < minPositionSize) {
        return 0; // Don't enter if position is too small
      }

      console.log(`AggressiveStrategy: Position size calculation for ${token.symbol}`, {
        baseSize,
        sentimentMultiplier,
        marketCapMultiplier,
        volumeMultiplier,
        finalPositionSize
      });

      return finalPositionSize;
    } catch (error) {
      console.error('AggressiveStrategy: Error in calculatePositionSize', error);
      return 0; // Fail safe - no position on error
    }
  }

  /**
   * Determines if a position should be exited
   * @reference DTS.md#3.1 - AggressiveStrategy shouldExit
   */
  async shouldExit(position: Position, currentData: MarketData): Promise<boolean> {
    try {
      const pnl = position.pnl;
      const pnlPercentage = pnl / position.size;
      const sentiment = currentData.token.sentiment;
      
      // Exit conditions for aggressive strategy
      const stopLossTriggered = pnlPercentage <= -this.config.stopLoss;
      const takeProfitTriggered = pnlPercentage >= this.config.takeProfit;
      const negativeSentimentSpike = sentiment < -0.2; // Emergency exit on negative sentiment
      
      // Additional exit conditions for aggressive strategy
      const volumeDrop = currentData.token.volume24h < position.entryPrice * 1000; // Volume dropped significantly
      const marketCapDrop = currentData.token.marketCap < position.entryPrice * 50000; // Market cap dropped
      
      const shouldExit = stopLossTriggered ||
                        takeProfitTriggered ||
                        negativeSentimentSpike ||
                        volumeDrop ||
                        marketCapDrop;

      console.log(`AggressiveStrategy: Exit analysis for position ${position.id}`, {
        pnlPercentage,
        sentiment,
        stopLossTriggered,
        takeProfitTriggered,
        negativeSentimentSpike,
        volumeDrop,
        marketCapDrop,
        shouldExit
      });

      return shouldExit;
    } catch (error) {
      console.error('AggressiveStrategy: Error in shouldExit', error);
      return true; // Fail safe - exit on error
    }
  }

  /**
   * Calculates price range for position
   * @reference DTS.md#3.1 - AggressiveStrategy calculatePriceRange
   */
  async calculatePriceRange(token: Token, currentPrice: number): Promise<[number, number]> {
    try {
      // Aggressive strategy uses wider price ranges for higher volatility
      const volatility = this.calculateVolatility(token.priceHistory || []);
      
      // Base range percentage (wider for aggressive strategy)
      const baseRangePercentage = 0.15; // 15% base range
      
      // Adjust range based on volatility
      const volatilityMultiplier = Math.min(volatility * 2, 2.0);
      const rangePercentage = baseRangePercentage * volatilityMultiplier;
      
      // Calculate min and max prices
      const range = rangePercentage / 2;
      const minPrice = currentPrice * (1 - range);
      const maxPrice = currentPrice * (1 + range);
      
      console.log(`AggressiveStrategy: Price range calculation for ${token.symbol}`, {
        currentPrice,
        volatility,
        rangePercentage,
        minPrice,
        maxPrice
      });

      return [minPrice, maxPrice];
    } catch (error) {
      console.error('AggressiveStrategy: Error in calculatePriceRange', error);
      // Return a safe default range
      const defaultRange = 0.1; // 10% default range
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
        return 0.1; // Default volatility
      }

      // Calculate price changes
      const priceChanges = [];
      for (let i = 1; i < priceHistory.length; i++) {
        const change = Math.abs(priceHistory[i].price - priceHistory[i - 1].price) / priceHistory[i - 1].price;
        priceChanges.push(change);
      }

      // Calculate average volatility
      const avgVolatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
      
      return Math.min(avgVolatility, 1.0); // Cap at 100%
    } catch (error) {
      console.error('AggressiveStrategy: Error calculating volatility', error);
      return 0.1; // Default volatility
    }
  }

  /**
   * Gets strategy name for logging
   */
  getStrategyName(): string {
    return 'AggressiveStrategy';
  }

  /**
   * Gets strategy description
   */
  getStrategyDescription(): string {
    return 'High-risk, high-reward strategy for volatile meme coins with positive sentiment and adequate volume';
  }
} 