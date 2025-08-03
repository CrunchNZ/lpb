/**
 * Market Data Utilities
 * 
 * Comprehensive market data analysis tools including:
 * - Price feeds and real-time data
 * - Volume analysis and liquidity metrics
 * - Market indicators and technical analysis
 * - Historical data analysis
 * - Market sentiment correlation
 */

import { Connection, PublicKey } from '@solana/web3.js';

// Types for market data
export interface MarketDataConfig {
  rpcUrl: string;
  updateInterval: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  timestamp: Date;
}

export interface VolumeData {
  symbol: string;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  averageVolume: number;
  volumeChange24h: number;
  timestamp: Date;
}

export interface LiquidityData {
  symbol: string;
  totalLiquidity: number;
  lockedLiquidity: number;
  liquidityProviders: number;
  averageLockTime: number;
  liquidityChange24h: number;
  timestamp: Date;
}

export interface MarketIndicator {
  symbol: string;
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  timestamp: Date;
}

export interface MarketSentiment {
  symbol: string;
  sentimentScore: number; // -1 to 1
  socialMentions: number;
  newsSentiment: number;
  communityTrust: number;
  fearGreedIndex: number;
  timestamp: Date;
}

export interface MarketAlert {
  id: string;
  symbol: string;
  type: 'PRICE' | 'VOLUME' | 'LIQUIDITY' | 'SENTIMENT';
  condition: 'ABOVE' | 'BELOW' | 'CHANGE';
  value: number;
  triggered: boolean;
  timestamp: Date;
}

/**
 * Market Data Manager Class
 * 
 * Provides comprehensive market data analysis and monitoring
 */
export class MarketDataManager {
  private connection: Connection;
  private config: MarketDataConfig;
  private priceCache: Map<string, PriceData> = new Map();
  private volumeCache: Map<string, VolumeData> = new Map();
  private liquidityCache: Map<string, LiquidityData> = new Map();
  private alerts: Map<string, MarketAlert> = new Map();

  constructor(config: MarketDataConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  /**
   * Initialize the market data manager
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      const blockHeight = await this.connection.getBlockHeight();
      console.log(`Market: Connected to Solana network, block height: ${blockHeight}`);

      console.log('Market: Initialized market data manager');
    } catch (error) {
      throw new Error(`Failed to initialize market data manager: ${error}`);
    }
  }

  /**
   * Get real-time price data
   */
  async getPriceData(symbol: string): Promise<PriceData> {
    try {
      // Check cache first
      const cached = this.priceCache.get(symbol);
      if (cached && Date.now() - cached.timestamp.getTime() < 60000) {
        return cached;
      }

      // In a real implementation, this would fetch from price APIs
      const priceData: PriceData = {
        symbol,
        price: this.generateMockPrice(symbol),
        change24h: this.generateMockChange(),
        changePercent24h: this.generateMockChangePercent(),
        volume24h: this.generateMockVolume(),
        marketCap: this.generateMockMarketCap(),
        timestamp: new Date()
      };

      // Cache the result
      this.priceCache.set(symbol, priceData);

      console.log(`Market: Fetched price data for ${symbol}`);
      return priceData;
    } catch (error) {
      throw new Error(`Failed to get price data: ${error}`);
    }
  }

  /**
   * Get volume data
   */
  async getVolumeData(symbol: string): Promise<VolumeData> {
    try {
      // Check cache first
      const cached = this.volumeCache.get(symbol);
      if (cached && Date.now() - cached.timestamp.getTime() < 300000) {
        return cached;
      }

      // In a real implementation, this would fetch from volume APIs
      const volumeData: VolumeData = {
        symbol,
        volume24h: this.generateMockVolume(),
        volume7d: this.generateMockVolume() * 7,
        volume30d: this.generateMockVolume() * 30,
        averageVolume: this.generateMockVolume() * 5,
        volumeChange24h: this.generateMockChangePercent(),
        timestamp: new Date()
      };

      // Cache the result
      this.volumeCache.set(symbol, volumeData);

      console.log(`Market: Fetched volume data for ${symbol}`);
      return volumeData;
    } catch (error) {
      throw new Error(`Failed to get volume data: ${error}`);
    }
  }

  /**
   * Get liquidity data
   */
  async getLiquidityData(symbol: string): Promise<LiquidityData> {
    try {
      // Check cache first
      const cached = this.liquidityCache.get(symbol);
      if (cached && Date.now() - cached.timestamp.getTime() < 600000) {
        return cached;
      }

      // In a real implementation, this would fetch from DEX APIs
      const liquidityData: LiquidityData = {
        symbol,
        totalLiquidity: this.generateMockLiquidity(),
        lockedLiquidity: this.generateMockLiquidity() * 0.8,
        liquidityProviders: Math.floor(Math.random() * 100) + 50,
        averageLockTime: Math.floor(Math.random() * 30) + 7,
        liquidityChange24h: this.generateMockChangePercent(),
        timestamp: new Date()
      };

      // Cache the result
      this.liquidityCache.set(symbol, liquidityData);

      console.log(`Market: Fetched liquidity data for ${symbol}`);
      return liquidityData;
    } catch (error) {
      throw new Error(`Failed to get liquidity data: ${error}`);
    }
  }

  /**
   * Calculate technical indicators
   */
  async getMarketIndicators(symbol: string): Promise<MarketIndicator> {
    try {
      // In a real implementation, this would calculate based on historical data
      const indicators: MarketIndicator = {
        symbol,
        rsi: this.generateMockRSI(),
        macd: {
          value: this.generateMockMACD(),
          signal: this.generateMockMACD() * 0.9,
          histogram: this.generateMockMACD() * 0.1
        },
        bollingerBands: {
          upper: this.generateMockPrice(symbol) * 1.1,
          middle: this.generateMockPrice(symbol),
          lower: this.generateMockPrice(symbol) * 0.9
        },
        movingAverages: {
          sma20: this.generateMockPrice(symbol) * 0.98,
          sma50: this.generateMockPrice(symbol) * 0.95,
          ema12: this.generateMockPrice(symbol) * 0.99,
          ema26: this.generateMockPrice(symbol) * 0.97
        },
        timestamp: new Date()
      };

      console.log(`Market: Calculated indicators for ${symbol}`);
      return indicators;
    } catch (error) {
      throw new Error(`Failed to calculate indicators: ${error}`);
    }
  }

  /**
   * Get market sentiment
   */
  async getMarketSentiment(symbol: string): Promise<MarketSentiment> {
    try {
      // In a real implementation, this would analyze social media and news
      const sentiment: MarketSentiment = {
        symbol,
        sentimentScore: this.generateMockSentiment(),
        socialMentions: Math.floor(Math.random() * 1000) + 100,
        newsSentiment: this.generateMockSentiment(),
        communityTrust: Math.random() * 0.5 + 0.5,
        fearGreedIndex: Math.floor(Math.random() * 100),
        timestamp: new Date()
      };

      console.log(`Market: Analyzed sentiment for ${symbol}`);
      return sentiment;
    } catch (error) {
      throw new Error(`Failed to get market sentiment: ${error}`);
    }
  }

  /**
   * Create a market alert
   */
  createAlert(
    symbol: string,
    type: MarketAlert['type'],
    condition: MarketAlert['condition'],
    value: number
  ): string {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: MarketAlert = {
      id: alertId,
      symbol,
      type,
      condition,
      value,
      triggered: false,
      timestamp: new Date()
    };

    this.alerts.set(alertId, alert);
    console.log(`Market: Created alert ${alertId} for ${symbol}`);
    return alertId;
  }

  /**
   * Remove a market alert
   */
  removeAlert(alertId: string): boolean {
    const removed = this.alerts.delete(alertId);
    if (removed) {
      console.log(`Market: Removed alert ${alertId}`);
    }
    return removed;
  }

  /**
   * Get all active alerts
   */
  getAlerts(): MarketAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Check if alerts are triggered
   */
  async checkAlerts(): Promise<MarketAlert[]> {
    const triggeredAlerts: MarketAlert[] = [];

    for (const alert of this.alerts.values()) {
      try {
        let currentValue: number;
        let shouldTrigger = false;

        switch (alert.type) {
          case 'PRICE':
            const priceData = await this.getPriceData(alert.symbol);
            currentValue = priceData.price;
            break;
          case 'VOLUME':
            const volumeData = await this.getVolumeData(alert.symbol);
            currentValue = volumeData.volume24h;
            break;
          case 'LIQUIDITY':
            const liquidityData = await this.getLiquidityData(alert.symbol);
            currentValue = liquidityData.totalLiquidity;
            break;
          case 'SENTIMENT':
            const sentimentData = await this.getMarketSentiment(alert.symbol);
            currentValue = sentimentData.sentimentScore;
            break;
          default:
            continue;
        }

        switch (alert.condition) {
          case 'ABOVE':
            shouldTrigger = currentValue > alert.value;
            break;
          case 'BELOW':
            shouldTrigger = currentValue < alert.value;
            break;
          case 'CHANGE':
            shouldTrigger = Math.abs(currentValue - alert.value) > 0.1;
            break;
        }

        if (shouldTrigger && !alert.triggered) {
          alert.triggered = true;
          triggeredAlerts.push(alert);
          console.log(`Market: Alert ${alert.id} triggered for ${alert.symbol}`);
        }
      } catch (error) {
        console.error(`Failed to check alert ${alert.id}: ${error}`);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Get market summary for multiple symbols
   */
  async getMarketSummary(symbols: string[]): Promise<{
    [symbol: string]: {
      price: PriceData;
      volume: VolumeData;
      liquidity: LiquidityData;
      indicators: MarketIndicator;
      sentiment: MarketSentiment;
    };
  }> {
    const summary: any = {};

    for (const symbol of symbols) {
      try {
        const [price, volume, liquidity, indicators, sentiment] = await Promise.all([
          this.getPriceData(symbol),
          this.getVolumeData(symbol),
          this.getLiquidityData(symbol),
          this.getMarketIndicators(symbol),
          this.getMarketSentiment(symbol)
        ]);

        summary[symbol] = {
          price,
          volume,
          liquidity,
          indicators,
          sentiment
        };
      } catch (error) {
        console.error(`Failed to get summary for ${symbol}: ${error}`);
      }
    }

    return summary;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.priceCache.clear();
    this.volumeCache.clear();
    this.liquidityCache.clear();
    console.log('Market: Cleared all caches');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    priceCacheSize: number;
    volumeCacheSize: number;
    liquidityCacheSize: number;
    alertCount: number;
  } {
    return {
      priceCacheSize: this.priceCache.size,
      volumeCacheSize: this.volumeCache.size,
      liquidityCacheSize: this.liquidityCache.size,
      alertCount: this.alerts.size
    };
  }

  // Mock data generators for development
  private generateMockPrice(symbol: string): number {
    const basePrice = symbol === 'SOL' ? 100 : symbol === 'USDC' ? 1 : 0.5;
    return basePrice + (Math.random() - 0.5) * basePrice * 0.1;
  }

  private generateMockChange(): number {
    return (Math.random() - 0.5) * 10;
  }

  private generateMockChangePercent(): number {
    return (Math.random() - 0.5) * 20;
  }

  private generateMockVolume(): number {
    return Math.random() * 1000000 + 100000;
  }

  private generateMockMarketCap(): number {
    return Math.random() * 1000000000 + 10000000;
  }

  private generateMockLiquidity(): number {
    return Math.random() * 500000 + 100000;
  }

  private generateMockRSI(): number {
    return Math.random() * 100;
  }

  private generateMockMACD(): number {
    return (Math.random() - 0.5) * 2;
  }

  private generateMockSentiment(): number {
    return Math.random() * 2 - 1; // -1 to 1
  }
}

/**
 * Factory function to create market data manager instance
 */
export function createMarketDataManager(config: MarketDataConfig): MarketDataManager {
  return new MarketDataManager(config);
} 