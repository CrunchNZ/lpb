/**
 * Dexscreener API Integration
 * Provides token search, filtering, and data fetching capabilities
 * Rate limited to ~60 requests per minute (free tier)
 */

import { DatabaseManager } from '../database/DatabaseManager';

export interface TokenData {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChange1h: number;
  priceChange6h: number;
  volume24h: number;
  volume1h: number;
  volume5m: number;
  marketCap: number;
  liquidity: number;
  age: number; // in hours
  holders: number;
  transactions24h: number;
  pairAddress: string;
  chainId: string;
  dexId: string;
  contractAddress?: string;
}

export interface SearchFilters {
  chainId?: string;
  minVolume?: number;
  minMarketCap?: number;
  trending?: string;
}

export interface SearchResult {
  tokens: TokenData[];
  totalCount: number;
  hasMore: boolean;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5?: number; // 5-minute volume (may not be available in all API responses)
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  pairCreatedAt: number;
}

export interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}

class DexscreenerAPI {
  private baseUrl = 'https://api.dexscreener.com/latest/dex';
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(private db: DatabaseManager) {}

  /**
   * Search for tokens with filters
   */
  async searchTokens(query: string, filters: SearchFilters = {}): Promise<SearchResult> {
    // Validate query length to avoid 400 errors
    if (!query || query.trim().length < 2) {
      return {
        tokens: [],
        totalCount: 0,
        hasMore: false,
      };
    }

    const cacheKey = this.generateCacheKey(query, filters);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached as SearchResult;
    }

    await this.rateLimit();

    try {
      const url = this.buildSearchUrl(query, filters);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Dexscreener API error: ${response.status} ${response.statusText}`);
      }

      const data: DexScreenerResponse = await response.json();
      const tokens = this.processSearchResults(data.pairs || [], filters);

      const result: SearchResult = {
        tokens,
        totalCount: tokens.length,
        hasMore: tokens.length >= 30, // API limit
      };

      this.cacheResult(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Dexscreener search error:', error);
      throw new Error(`Failed to search tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed token information
   */
  async getTokenDetails(pairAddress: string, chainId: string = 'solana'): Promise<TokenData | null> {
    const cacheKey = `token_details_${chainId}_${pairAddress}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached as TokenData;
    }

    await this.rateLimit();

    try {
      const url = `${this.baseUrl}/pairs/${chainId}/${pairAddress}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Dexscreener API error: ${response.status} ${response.statusText}`);
      }

      const data: DexScreenerResponse = await response.json();
      const token = this.processTokenData(data.pairs?.[0]);

      if (token) {
        this.cacheResult(cacheKey, token);
      }

      return token;
    } catch (error) {
      console.error('Dexscreener token details error:', error);
      return null;
    }
  }

  /**
   * Get trending tokens with filters
   */
  async getTrendingTokens(filters: SearchFilters = {}): Promise<TokenData[]> {
    const cacheKey = `trending_${JSON.stringify(filters)}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached as TokenData[];
    }

    await this.rateLimit();

    try {
      // Get trending tokens from multiple chains
      const chains = filters.chainId ? [filters.chainId] : ['solana', 'ethereum', 'bsc'];
      const allTokens: TokenData[] = [];

      for (const chain of chains) {
        const url = `${this.baseUrl}/tokens/${chain}`;
        const response = await fetch(url);

        if (response.ok) {
          const data: DexScreenerResponse = await response.json();
          const tokens = this.processSearchResults(data.pairs || [], filters);
          allTokens.push(...tokens);
        }
      }

      // Sort by volume and apply filters
      const filteredTokens = allTokens
        .filter(token => {
          if (filters.minVolume && token.volume24h < filters.minVolume) return false;
          if (filters.minMarketCap && token.marketCap < filters.minMarketCap) return false;
          return true;
        })
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 50); // Top 50 trending tokens

      this.cacheResult(cacheKey, filteredTokens);
      return filteredTokens;
    } catch (error) {
      console.error('Dexscreener trending tokens error:', error);
      throw new Error(`Failed to get trending tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get specific token data by symbol
   */
  async getTokenData(symbol: string): Promise<TokenData | null> {
    const cacheKey = `token_data_${symbol}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached as TokenData;
    }

    await this.rateLimit();

    try {
      // Search for the specific token
      const searchResult = await this.searchTokens(symbol, {});
      const token = searchResult.tokens.find(
        (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
      );

      if (token) {
        this.cacheResult(cacheKey, token);
      }

      return token || null;
    } catch (error) {
      console.error('Dexscreener get token data error:', error);
      return null;
    }
  }

  /**
   * Get liquidity pools for a specific token
   */
  async getTokenPools(tokenAddress: string, chainId: string = 'solana'): Promise<TokenData[]> {
    const cacheKey = `token_pools_${chainId}_${tokenAddress}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached as TokenData[];
    }

    await this.rateLimit();

    try {
      const url = `${this.baseUrl}/tokens/${chainId}/${tokenAddress}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Dexscreener API error: ${response.status} ${response.statusText}`);
      }

      const data: DexScreenerResponse = await response.json();
      const pools = this.processSearchResults(data.pairs || [], {});

      this.cacheResult(cacheKey, pools);
      return pools;
    } catch (error) {
      console.error('Dexscreener get token pools error:', error);
      return [];
    }
  }

  private buildSearchUrl(query: string, filters: SearchFilters): string {
    const params = new URLSearchParams();
    
    if (query.trim()) {
      params.append('q', query.trim());
    }
    
    // Ensure chainId is properly formatted for DexScreener API
    if (filters.chainId) {
      // DexScreener expects lowercase chain IDs
      const normalizedChainId = filters.chainId.toLowerCase();
      params.append('chainId', normalizedChainId);
    }

    return `${this.baseUrl}/search?${params.toString()}`;
  }

  private processSearchResults(pairs: DexScreenerPair[], filters: SearchFilters): TokenData[] {
    const filteredPairs = pairs.filter(pair => {
      // Apply chain filter first
      if (filters.chainId) {
        const expectedChainId = filters.chainId.toLowerCase();
        const actualChainId = pair.chainId.toLowerCase();
        
        if (actualChainId !== expectedChainId) {
          return false;
        }
      }
      
      // Apply volume filter
      if (filters.minVolume && pair.volume.h24 < filters.minVolume) {
        return false;
      }
      
      // Apply market cap filter
      if (filters.minMarketCap && pair.fdv < filters.minMarketCap) {
        return false;
      }
      
      return true;
    });

    const tokens = filteredPairs
      .map(pair => this.convertPairToTokenData(pair))
      .filter(Boolean) as TokenData[];
    
    return tokens;
  }

  private processTokenData(pair?: DexScreenerPair): TokenData | null {
    if (!pair) return null;
    return this.convertPairToTokenData(pair);
  }

  private convertPairToTokenData(pair: DexScreenerPair): TokenData {
    const now = Date.now();
    const ageHours = (now - pair.pairCreatedAt) / (1000 * 60 * 60);

    return {
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      price: parseFloat(pair.priceUsd) || 0,
      priceChange24h: pair.priceChange.h24 || 0,
      priceChange1h: pair.priceChange.h1 || 0,
      priceChange6h: pair.priceChange.h6 || 0,
      volume24h: pair.volume.h24 || 0,
      volume1h: pair.volume.h1 || 0,
      volume5m: pair.volume.m5 || (pair.volume.h1 ? pair.volume.h1 / 12 : 0), // Use actual 5m data or estimate
      marketCap: pair.fdv || 0,
      liquidity: pair.liquidity.usd || 0,
      age: Math.max(0, ageHours),
      holders: 0, // Not available in DexScreener API
      transactions24h: (pair.txns.h24.buys + pair.txns.h24.sells) || 0,
      pairAddress: pair.pairAddress,
      chainId: pair.chainId,
      dexId: pair.dexId,
      contractAddress: pair.baseToken.address,
    };
  }

  private generateCacheKey(query: string, filters: SearchFilters): string {
    return `search_${query}_${JSON.stringify(filters)}`;
  }

  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  private cacheResult(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number; keys: string[] } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
let dexscreenerInstance: DexscreenerAPI | null = null;

export function getDexScreenerAPI(db: DatabaseManager): DexscreenerAPI {
  if (!dexscreenerInstance) {
    if (!db) {
      throw new Error('DatabaseManager is required for DexScreenerAPI initialization');
    }
    dexscreenerInstance = new DexscreenerAPI(db);
  }
  return dexscreenerInstance;
}
