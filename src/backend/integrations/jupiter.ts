/**
 * Jupiter API Integration (Free Tier)
 *
 * Handles all interactions with Jupiter aggregator using the free tier API:
 * - Token swaps and route discovery
 * - Price quotes and slippage calculation
 * - Transaction signing and execution
 * - Route optimization and best path finding
 * - Real-time price monitoring
 */

import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { jupiterConfig, jupiterRateLimiter, jupiterCache } from '../config/jupiter-config';
import axios from 'axios';

// Types for Jupiter integration
export interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

export interface JupiterRoute {
  id: string;
  inAmount: number;
  outAmount: number;
  priceImpactPct: number;
  marketInfos: any[];
  amount: number;
  slippageBps: number;
  otherAmountThreshold: number;
  swapMode: string;
}

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  otherAmountThreshold: number;
  swapMode: 'ExactIn' | 'ExactOut';
  slippageBps: number;
  priceImpactPct: number;
  routePlan: JupiterRoute[];
  contextSlot: number;
  timeTaken: number;
}

export interface JupiterSwapResult {
  signature: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  error?: string;
}

export interface JupiterConfig {
  rpcUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
  timeoutMs: number;
}

/**
 * Jupiter API Integration Class
 *
 * Provides comprehensive integration with Jupiter aggregator
 * using the free tier API endpoints
 */
export class JupiterIntegration {
  private connection: Connection;
  private config: JupiterConfig;
  private tokens: Map<string, JupiterToken> = new Map();
  private recentQuotes: Map<string, JupiterQuote> = new Map();
  private isInitialized: boolean = false;

  constructor(config: JupiterConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, config.commitment);
  }

  /**
   * Initialize the Jupiter integration
   * Sets up connection and loads token list
   */
  async initialize(): Promise<void> {
    try {
      // Load token list
      await this.loadTokenList();
      
      this.isInitialized = true;
      console.log('Jupiter: Initialized with free tier API');
    } catch (error) {
      console.error('Failed to initialize Jupiter integration:', error);
      throw new Error(`Failed to initialize Jupiter: ${error}`);
    }
  }

  /**
   * Load token list from Jupiter API
   */
  private async loadTokenList(): Promise<void> {
    try {
      // Check cache first
      const cachedTokens = jupiterCache.get('token-list');
      if (cachedTokens) {
        this.tokens = new Map(cachedTokens);
        console.log(`Jupiter: Loaded ${this.tokens.size} tokens from cache`);
        return;
      }

      // Fetch token list from Jupiter API
      const response = await axios.get(`${jupiterConfig.apiUrl}/v4/tokens`, {
        timeout: jupiterConfig.timeoutMs,
      });

      const tokens: JupiterToken[] = response.data.tokens || [];
      
      // Convert to Map
      tokens.forEach((token: JupiterToken) => {
        this.tokens.set(token.address, token);
      });

      // Cache the token list
      jupiterCache.set('token-list', Array.from(this.tokens.entries()), jupiterConfig.tokenListCacheTtlMs);

      console.log(`Jupiter: Loaded ${this.tokens.size} tokens`);
    } catch (error) {
      console.error('Failed to load token list:', error);
      throw new Error(`Failed to load token list: ${error}`);
    }
  }

  /**
   * Get all available tokens
   */
  getTokens(): JupiterToken[] {
    return Array.from(this.tokens.values());
  }

  /**
   * Get token by address
   */
  getToken(address: string): JupiterToken | undefined {
    return this.tokens.get(address);
  }

  /**
   * Find tokens by symbol
   */
  findTokensBySymbol(symbol: string): JupiterToken[] {
    return Array.from(this.tokens.values()).filter((token: JupiterToken) =>
      token.symbol.toLowerCase().includes(symbol.toLowerCase())
    );
  }

  /**
   * Get quote for a token swap using Jupiter API
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50
  ): Promise<JupiterQuote> {
    try {
      // Check rate limiting
      if (jupiterRateLimiter.isRateLimited('quote')) {
        throw new Error('Rate limit exceeded for quote requests');
      }

      // Check cache first
      const cacheKey = `quote-${inputMint}-${outputMint}-${amount}-${slippageBps}`;
      const cachedQuote = jupiterCache.get(cacheKey);
      if (cachedQuote) {
        console.log('Jupiter: Returning cached quote');
        return cachedQuote;
      }

      // Validate tokens
      const inputToken = this.getToken(inputMint);
      const outputToken = this.getToken(outputMint);

      if (!inputToken || !outputToken) {
        throw new Error('Invalid token addresses');
      }

      // Get quote from Jupiter API
      const response = await axios.get(jupiterConfig.quoteApiUrl, {
        params: {
          inputMint,
          outputMint,
          amount: amount.toString(),
          slippageBps,
          onlyDirectRoutes: false,
          asLegacyTransaction: false,
        },
        timeout: jupiterConfig.timeoutMs,
      });

      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from Jupiter API');
      }

      const quoteData = response.data.data;
      
      const jupiterQuote: JupiterQuote = {
        inputMint,
        outputMint,
        inAmount: parseInt(quoteData.inAmount),
        outAmount: parseInt(quoteData.outAmount),
        otherAmountThreshold: parseInt(quoteData.otherAmountThreshold),
        swapMode: quoteData.swapMode,
        slippageBps,
        priceImpactPct: quoteData.priceImpactPct,
        routePlan: quoteData.routePlan,
        contextSlot: quoteData.contextSlot,
        timeTaken: quoteData.timeTaken,
      };

      // Cache the quote
      jupiterCache.set(cacheKey, jupiterQuote, jupiterConfig.quoteCacheTtlMs);
      this.recentQuotes.set(cacheKey, jupiterQuote);

      console.log(`Jupiter: Generated quote for ${inputToken.symbol} -> ${outputToken.symbol}`);
      return jupiterQuote;
    } catch (error) {
      console.error('Failed to get Jupiter quote:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get quote: ${error.message}`);
      }
      throw new Error(`Failed to get quote: ${error}`);
    }
  }

  /**
   * Execute a token swap using Jupiter API
   */
  async executeSwap(
    quote: JupiterQuote,
    wallet: Keypair
  ): Promise<JupiterSwapResult> {
    try {
      // Check rate limiting
      if (jupiterRateLimiter.isRateLimited('swap')) {
        throw new Error('Rate limit exceeded for swap requests');
      }

      // Validate quote
      if (!quote.routePlan || quote.routePlan.length === 0) {
        throw new Error('Invalid quote: no route plan');
      }

      // Get swap transaction from Jupiter API
      const response = await axios.post(`${jupiterConfig.apiUrl}/v6/swap`, {
        quoteResponse: {
          inputMint: quote.inputMint,
          outputMint: quote.outputMint,
          inAmount: quote.inAmount.toString(),
          outAmount: quote.outAmount.toString(),
          otherAmountThreshold: quote.otherAmountThreshold.toString(),
          swapMode: quote.swapMode,
          slippageBps: quote.slippageBps,
          routePlan: quote.routePlan,
        },
        userPublicKey: wallet.publicKey.toString(),
        wrapUnwrapSOL: true,
      }, {
        timeout: jupiterConfig.timeoutMs,
      });

      if (!response.data || !response.data.swapTransaction) {
        throw new Error('Invalid swap response from Jupiter API');
      }

      // Deserialize and sign the transaction
      const swapTransaction = Transaction.from(Buffer.from(response.data.swapTransaction, 'base64'));
      swapTransaction.sign(wallet);

      // Send the transaction
      const signature = await this.connection.sendTransaction(swapTransaction, [wallet], {
        skipPreflight: false,
        preflightCommitment: this.config.commitment,
      });

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, this.config.commitment);

      const result: JupiterSwapResult = {
        signature,
        status: confirmation.value.err ? 'failed' : 'success',
        timestamp: Date.now(),
        inputAmount: quote.inAmount,
        outputAmount: quote.outAmount,
        priceImpact: quote.priceImpactPct,
        error: confirmation.value.err ? JSON.stringify(confirmation.value.err) : undefined,
      };

      console.log(`Jupiter: Executed swap ${result.signature}`);
      return result;
    } catch (error) {
      console.error('Failed to execute Jupiter swap:', error);
      throw new Error(`Failed to execute swap: ${error}`);
    }
  }

  /**
   * Get best routes for a swap
   */
  async getRoutes(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50
  ): Promise<JupiterRoute[]> {
    try {
      // Check rate limiting
      if (jupiterRateLimiter.isRateLimited('routes')) {
        throw new Error('Rate limit exceeded for route requests');
      }

      const response = await axios.get(`${jupiterConfig.apiUrl}/v6/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amount.toString(),
          slippageBps,
          onlyDirectRoutes: false,
          asLegacyTransaction: false,
        },
        timeout: jupiterConfig.timeoutMs,
      });

      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from Jupiter API');
      }

      const routes: JupiterRoute[] = response.data.data.routes || [];
      return routes;
    } catch (error) {
      console.error('Failed to get Jupiter routes:', error);
      throw new Error(`Failed to get routes: ${error}`);
    }
  }

  /**
   * Get token price from Jupiter API
   */
  async getTokenPrice(tokenMint: string): Promise<number> {
    try {
      // Check cache first
      const cacheKey = `price-${tokenMint}`;
      const cachedPrice = jupiterCache.get(cacheKey);
      if (cachedPrice) {
        return cachedPrice;
      }

      // Check rate limiting
      if (jupiterRateLimiter.isRateLimited('price')) {
        throw new Error('Rate limit exceeded for price requests');
      }

      const response = await axios.get(jupiterConfig.priceApiUrl, {
        params: {
          ids: tokenMint,
        },
        timeout: jupiterConfig.timeoutMs,
      });

      if (!response.data || !response.data.data || !response.data.data[tokenMint]) {
        throw new Error('Invalid price response from Jupiter API');
      }

      const price = response.data.data[tokenMint].price;
      
      // Cache the price
      jupiterCache.set(cacheKey, price, jupiterConfig.priceCacheTtlMs);

      return price;
    } catch (error) {
      console.error('Failed to get token price:', error);
      throw new Error(`Failed to get price: ${error}`);
    }
  }

  /**
   * Get recent quotes
   */
  getRecentQuotes(): Map<string, JupiterQuote> {
    return new Map(this.recentQuotes);
  }

  /**
   * Clear recent quotes
   */
  clearRecentQuotes(): void {
    this.recentQuotes.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.isInitialized;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; lastCheck: number } {
    return {
      connected: this.isInitialized,
      lastCheck: Date.now(),
    };
  }

  /**
   * Get integration stats
   */
  getStats(): {
    tokensLoaded: number;
    recentQuotes: number;
    lastQuoteTime: number | null;
    cacheSize: number;
    rateLimitRemaining: number;
  } {
    return {
      tokensLoaded: this.tokens.size,
      recentQuotes: this.recentQuotes.size,
      lastQuoteTime: this.recentQuotes.size > 0 ? Date.now() : null,
      cacheSize: jupiterCache.getSize(),
      rateLimitRemaining: jupiterRateLimiter.getRemainingRequests('quote'),
    };
  }

  /**
   * Clear old quotes
   */
  clearOldQuotes(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, quote] of this.recentQuotes.entries()) {
      if (now - quote.timeTaken > maxAge) {
        this.recentQuotes.delete(key);
      }
    }
  }
}

// Factory function to create Jupiter integration
export function getJupiterIntegration(config?: JupiterConfig): JupiterIntegration {
  const finalConfig = config || {
    rpcUrl: jupiterConfig.rpcUrl,
    commitment: jupiterConfig.commitment,
    timeoutMs: jupiterConfig.timeoutMs,
  };

  return new JupiterIntegration(finalConfig);
}
