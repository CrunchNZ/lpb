/**
 * Bot Orchestrator
 *
 * Manages the main bot polling loop and prioritizes watchlisted tokens
 *
 * @reference PRD.md#4.2 - Bot Orchestration
 * @reference DTS.md#3.2 - Bot Orchestrator
 */

import { StrategyManager } from '../strategies/StrategyManager';
import { DatabaseManager } from '../database/DatabaseManager';
import { DexscreenerAPI } from '../integrations/dexscreener';
import { TokenData } from '../integrations/dexscreener';

export interface BotConfig {
  pollingInterval: number; // milliseconds
  maxPositions: number;
  maxInvestment: number;
  strategy: 'aggressive' | 'balanced' | 'conservative';
  prioritizeWatchlisted: boolean;
  watchlistCheckInterval: number; // milliseconds
}

export interface BotStatus {
  isRunning: boolean;
  lastPoll: number;
  activePositions: number;
  totalValue: number;
  error?: string;
}

export class BotOrchestrator {
  private strategyManager: StrategyManager;
  private databaseManager: DatabaseManager;
  private dexscreenerAPI: DexscreenerAPI;
  private config: BotConfig;
  private status: BotStatus;
  private pollingInterval?: NodeJS.Timeout;
  private watchlistInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(
    strategyManager: StrategyManager,
    databaseManager: DatabaseManager,
    dexscreenerAPI: DexscreenerAPI,
    config: BotConfig
  ) {
    this.strategyManager = strategyManager;
    this.databaseManager = databaseManager;
    this.dexscreenerAPI = dexscreenerAPI;
    this.config = config;
    this.status = {
      isRunning: false,
      lastPoll: 0,
      activePositions: 0,
      totalValue: 0,
    };
  }

  /**
   * Starts the bot polling loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('BotOrchestrator: Bot is already running');
      return;
    }

    console.log('BotOrchestrator: Starting bot...');
    this.isRunning = true;
    this.status.isRunning = true;

    // Start main polling loop
    this.pollingInterval = setInterval(
      () => this.pollForOpportunities(),
      this.config.pollingInterval
    );

    // Start watchlist polling if enabled
    if (this.config.prioritizeWatchlisted) {
      this.watchlistInterval = setInterval(
        () => this.pollWatchlistedTokens(),
        this.config.watchlistCheckInterval
      );
    }

    // Initial poll
    await this.pollForOpportunities();
    if (this.config.prioritizeWatchlisted) {
      await this.pollWatchlistedTokens();
    }

    console.log('BotOrchestrator: Bot started successfully');
  }

  /**
   * Stops the bot polling loop
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('BotOrchestrator: Bot is not running');
      return;
    }

    console.log('BotOrchestrator: Stopping bot...');
    this.isRunning = false;
    this.status.isRunning = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    if (this.watchlistInterval) {
      clearInterval(this.watchlistInterval);
      this.watchlistInterval = undefined;
    }

    console.log('BotOrchestrator: Bot stopped');
  }

  /**
   * Main polling loop for market opportunities
   */
  private async pollForOpportunities(): Promise<void> {
    try {
      console.log('BotOrchestrator: Polling for market opportunities...');
      this.status.lastPoll = Date.now();

      // Get trending tokens from Dexscreener
      const trendingTokens = await this.dexscreenerAPI.getTrendingTokens({
        chainId: 'solana',
        minVolume: 1000000, // $1M minimum
        minMarketCap: 150000, // $150K minimum
      });

      // Filter out tokens we already have positions in
      const activePositions = await this.databaseManager.getActivePositions();
      const existingTokens = new Set(activePositions.map(p => p.tokenA));

      const availableTokens = trendingTokens.filter(token =>
        !existingTokens.has(token.symbol) &&
        activePositions.length < this.config.maxPositions
      );

      // Analyze each token
      for (const token of availableTokens) {
        await this.analyzeToken(token);
      }

      // Update status
      this.status.activePositions = activePositions.length;
      this.status.totalValue = activePositions.reduce((sum, pos) => sum + pos.amountA * pos.currentPrice, 0);

    } catch (error) {
      console.error('BotOrchestrator: Error in polling loop', error);
      this.status.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Polls watchlisted tokens with higher priority
   */
  private async pollWatchlistedTokens(): Promise<void> {
    try {
      console.log('BotOrchestrator: Polling watchlisted tokens...');

      // Get all watchlists and their tokens
      const watchlists = await this.databaseManager.getWatchlists();
      const activePositions = await this.databaseManager.getActivePositions();
      const existingTokens = new Set(activePositions.map(p => p.tokenA));

      for (const watchlist of watchlists) {
        const watchlistTokens = await this.databaseManager.getWatchlistTokens(watchlist.id);

        for (const watchlistToken of watchlistTokens) {
          // Skip if we already have a position
          if (existingTokens.has(watchlistToken.tokenSymbol)) {
            continue;
          }

          // Get current token data
          const tokenData = await this.dexscreenerAPI.getTokenData(watchlistToken.tokenSymbol);
          if (!tokenData) {
            continue;
          }

          // Analyze with higher priority (lower thresholds)
          await this.analyzeToken(tokenData, true);
        }
      }

    } catch (error) {
      console.error('BotOrchestrator: Error polling watchlisted tokens', error);
    }
  }

  /**
   * Analyzes a token and potentially opens a position
   */
  private async analyzeToken(token: TokenData, isWatchlisted: boolean = false): Promise<void> {
    try {
      console.log(`BotOrchestrator: Analyzing ${token.symbol}${isWatchlisted ? ' (watchlisted)' : ''}`);

      // Get market data
      const marketData = {
        price: token.price,
        volume24h: token.volume24h,
        marketCap: token.marketCap,
        priceChange24h: token.priceChange24h,
        liquidity: token.liquidity,
        age: token.age,
      };

      // Execute strategy analysis
      const decision = await this.strategyManager.executeStrategy(
        {
          symbol: token.symbol,
          name: token.name,
          address: token.pairAddress,
        },
        marketData
      );

      // Apply watchlist priority adjustments
      if (isWatchlisted && decision.shouldEnter) {
        decision.confidence = Math.min(decision.confidence * 1.2, 1.0); // Boost confidence by 20%
        decision.reasoning += ' (Watchlisted token - priority boost)';
      }

      // Check if we should enter a position
      if (decision.shouldEnter && decision.confidence > 0.7) {
        await this.openPosition(token, decision);
      }

    } catch (error) {
      console.error(`BotOrchestrator: Error analyzing token ${token.symbol}`, error);
    }
  }

  /**
   * Opens a new position
   */
  private async openPosition(token: TokenData, decision: any): Promise<void> {
    try {
      console.log(`BotOrchestrator: Opening position for ${token.symbol}`);

      // Calculate position size based on decision and config
      const positionSize = Math.min(
        decision.positionSize || this.config.maxInvestment,
        this.config.maxInvestment
      );

      // Create position record
      const position = {
        id: `pos_${Date.now()}`,
        strategy: this.config.strategy,
        poolAddress: token.pairAddress,
        tokenA: token.symbol,
        tokenB: 'USDC',
        amountA: positionSize / token.price,
        amountB: positionSize,
        entryPrice: token.price,
        currentPrice: token.price,
        timestamp: Date.now(),
        status: 'active' as const,
        pnl: 0,
        apy: 0,
      };

      // Save to database
      await this.databaseManager.createPosition(position);

      console.log(`BotOrchestrator: Position opened for ${token.symbol}`, {
        size: positionSize,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
      });

    } catch (error) {
      console.error(`BotOrchestrator: Error opening position for ${token.symbol}`, error);
    }
  }

  /**
   * Gets current bot status
   */
  getStatus(): BotStatus {
    return { ...this.status };
  }

  /**
   * Updates bot configuration
   */
  updateConfig(newConfig: Partial<BotConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('BotOrchestrator: Configuration updated', this.config);
  }

  /**
   * Checks if bot is running
   */
  isBotRunning(): boolean {
    return this.isRunning;
  }
}
