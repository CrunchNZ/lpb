/**
 * Core types and interfaces for strategy implementation
 * 
 * @reference PRD.md#4.1 - Core Bot Functionality
 * @reference DTS.md#2.1 - Core Interfaces
 */

export enum StrategyType {
  AGGRESSIVE = 'aggressive',
  BALANCED = 'balanced',
  CONSERVATIVE = 'conservative'
}

export enum PositionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  PENDING = 'pending',
  ERROR = 'error'
}

export enum SentimentLevel {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive'
}

/**
 * Token information interface
 * @reference DTS.md#2.1 - Token Information
 */
export interface Token {
  address: string;
  symbol: string;
  name: string;
  marketCap: number;
  price: number;
  volume24h: number;
  tvl: number;
  sentiment: number; // -1 to 1
  trending: boolean;
}

/**
 * Position data interface
 * @reference DTS.md#2.1 - Position Data
 */
export interface Position {
  id: string;
  tokenAddress: string;
  strategy: StrategyType;
  entryPrice: number;
  currentPrice: number;
  size: number; // USD amount
  range: [number, number]; // price range
  status: PositionStatus;
  pnl: number;
  entryTime: Date;
  exitTime?: Date;
}

/**
 * Strategy configuration interface
 * @reference DTS.md#2.1 - Strategy Configuration
 */
export interface StrategyConfig {
  type: StrategyType;
  riskTolerance: 'low' | 'medium' | 'high';
  maxPositionSize: number; // percentage of portfolio
  stopLoss: number; // percentage
  takeProfit: number; // percentage
  sentimentThreshold: number;
}

/**
 * Market data interface
 * @reference DTS.md#2.1 - Market Data
 */
export interface MarketData {
  token: Token;
  priceHistory: PricePoint[];
  volumeHistory: VolumePoint[];
  sentimentHistory: SentimentPoint[];
}

/**
 * Performance metrics interface
 * @reference DTS.md#2.1 - Performance Metrics
 */
export interface PerformanceMetrics {
  totalPnl: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgTradeDuration: number;
}

/**
 * Price point for historical data
 */
export interface PricePoint {
  timestamp: Date;
  price: number;
}

/**
 * Volume point for historical data
 */
export interface VolumePoint {
  timestamp: Date;
  volume: number;
}

/**
 * Sentiment point for historical data
 */
export interface SentimentPoint {
  timestamp: Date;
  sentiment: number;
}

/**
 * Strategy interface that all strategies must implement
 * @reference DTS.md#3.1 - Strategy Classes
 */
export interface Strategy {
  readonly config: StrategyConfig;
  
  /**
   * Determines if a position should be entered for the given token
   * @param token - Token information
   * @param marketData - Current market data
   * @returns Promise<boolean> - Whether to enter position
   */
  shouldEnter(token: Token, marketData: MarketData): Promise<boolean>;
  
  /**
   * Calculates position size based on strategy and market conditions
   * @param token - Token information
   * @param portfolioValue - Total portfolio value in USD
   * @returns Promise<number> - Position size in USD
   */
  calculatePositionSize(token: Token, portfolioValue: number): Promise<number>;
  
  /**
   * Determines if a position should be exited
   * @param position - Current position
   * @param currentData - Current market data
   * @returns Promise<boolean> - Whether to exit position
   */
  shouldExit(position: Position, currentData: MarketData): Promise<boolean>;
  
  /**
   * Calculates price range for position
   * @param token - Token information
   * @param currentPrice - Current token price
   * @returns Promise<[number, number]> - Min and max price range
   */
  calculatePriceRange(token: Token, currentPrice: number): Promise<[number, number]>;
}

/**
 * Strategy factory for creating strategy instances
 */
export interface StrategyFactory {
  createStrategy(type: StrategyType, config?: Partial<StrategyConfig>): Strategy;
  getAvailableStrategies(): StrategyType[];
}

/**
 * Strategy manager for coordinating multiple strategies
 */
export interface StrategyManager {
  addStrategy(strategy: Strategy): void;
  removeStrategy(strategyId: string): void;
  getStrategies(): Strategy[];
  executeStrategy(token: Token, marketData: MarketData): Promise<StrategyDecision>;
}

/**
 * Strategy decision result
 */
export interface StrategyDecision {
  shouldEnter: boolean;
  positionSize?: number;
  priceRange?: [number, number];
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  riskScore: number; // 0-100
  isSafe: boolean;
  warnings: string[];
  recommendations: string[];
}

/**
 * Market analysis result
 */
export interface MarketAnalysis {
  token: Token;
  sentiment: number;
  volatility: number;
  liquidity: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
} 