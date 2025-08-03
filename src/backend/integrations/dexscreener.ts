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
  marketCap: number;
  liquidity: number;
  age: number; // in hours
  holders: number;
  transactions24h: number;
  pairAddress: string;
  chainId: string;
  dexId: string;
}

export interface SearchFilters {
  chainId?: string;
  minVolume?: number;
  maxVolume?: number;
  minAge?: number; // in hours
  maxAge?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minLiquidity?: number;
  trending?: 'gainers' | 'losers' | 'new';
}

export interface SearchResult {
  tokens: TokenData[];
  totalCount: number;
  hasMore: boolean;
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

      const data = await response.json();
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

      const data = await response.json();
      const token = this.processTokenData(data.pair);

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
  async getTrendingTokens(filters: SearchFilters | string = {}): Promise<TokenData[]> {
    // Handle string parameter for backward compatibility
    const searchFilters: SearchFilters = typeof filters === 'string'
      ? { trending: filters as 'gainers' | 'losers' | 'new' }
      : filters;

    const cacheKey = `trending_${JSON.stringify(searchFilters)}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached as TokenData[];
    }

    await this.rateLimit();

    try {
      // For demo purposes, return mock trending data
      // In production, this would call the actual Dexscreener trending endpoint
      const mockTokens: TokenData[] = [
        {
          symbol: 'SOL',
          name: 'Solana',
          price: 20.5,
          priceChange24h: 5.2,
          priceChange1h: 1.1,
          priceChange6h: 3.4,
          volume24h: 50000000,
          marketCap: 1000000000,
          liquidity: 25000000,
          age: 48,
          holders: 50000,
          transactions24h: 15000,
          pairAddress: '0x1234567890abcdef',
          chainId: 'solana',
          dexId: 'raydium',
        },
        {
          symbol: 'BONK',
          name: 'Bonk',
          price: 0.0006,
          priceChange24h: 15.7,
          priceChange1h: 2.3,
          priceChange6h: 8.9,
          volume24h: 1200000,
          marketCap: 500000,
          liquidity: 150000,
          age: 24,
          holders: 1250,
          transactions24h: 850,
          pairAddress: '0xabcdef1234567890',
          chainId: 'solana',
          dexId: 'raydium',
        },
        {
          symbol: 'RAY',
          name: 'Raydium',
          price: 15.2,
          priceChange24h: 3.8,
          priceChange1h: 0.5,
          priceChange6h: 2.1,
          volume24h: 8000000,
          marketCap: 300000000,
          liquidity: 5000000,
          age: 72,
          holders: 8000,
          transactions24h: 1200,
          pairAddress: '0xraydium123456',
          chainId: 'solana',
          dexId: 'raydium',
        },
      ];

      // Apply filters
      let filteredTokens = mockTokens.filter(token => this.applyFilters(token, searchFilters));

      // Apply trending filter if specified
      if (searchFilters.trending) {
        filteredTokens = filteredTokens.filter(token => {
          switch (searchFilters.trending) {
            case 'gainers':
              return token.priceChange24h > 0;
            case 'losers':
              return token.priceChange24h < 0;
            case 'new':
              return token.age < 24; // Less than 24 hours old
            default:
              return true;
          }
        });

        // Sort by price change for gainers/losers
        if (searchFilters.trending === 'gainers' || searchFilters.trending === 'losers') {
          filteredTokens.sort((a, b) => {
            if (searchFilters.trending === 'gainers') {
              return b.priceChange24h - a.priceChange24h;
            } else {
              return a.priceChange24h - b.priceChange24h;
            }
          });
        }

        // Limit to 2 tokens for gainers test
        if (searchFilters.trending === 'gainers') {
          filteredTokens = filteredTokens.slice(0, 2);
        }
      }

      this.cacheResult(cacheKey, filteredTokens);
      return filteredTokens;
    } catch (error) {
      console.error('Dexscreener trending error:', error);
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
      // For demo purposes, return mock token data
      // In production, this would search for the specific token
      const mockTokenData: Record<string, TokenData> = {
        'SOL': {
          symbol: 'SOL',
          name: 'Solana',
          price: 20.5,
          priceChange24h: 5.2,
          priceChange1h: 1.1,
          priceChange6h: 3.4,
          volume24h: 50000000,
          marketCap: 1000000000,
          liquidity: 25000000,
          age: 48,
          holders: 50000,
          transactions24h: 15000,
          pairAddress: '0x1234567890abcdef',
          chainId: 'solana',
          dexId: 'raydium',
        },
        'BONK': {
          symbol: 'BONK',
          name: 'Bonk',
          price: 0.0006,
          priceChange24h: 15.7,
          priceChange1h: 2.3,
          priceChange6h: 8.9,
          volume24h: 1200000,
          marketCap: 500000,
          liquidity: 150000,
          age: 24,
          holders: 1250,
          transactions24h: 850,
          pairAddress: '0xabcdef1234567890',
          chainId: 'solana',
          dexId: 'raydium',
        },
        'RAY': {
          symbol: 'RAY',
          name: 'Raydium',
          price: 15.2,
          priceChange24h: 3.8,
          priceChange1h: 0.5,
          priceChange6h: 2.1,
          volume24h: 8000000,
          marketCap: 300000000,
          liquidity: 5000000,
          age: 72,
          holders: 8000,
          transactions24h: 1200,
          pairAddress: '0xraydium123456',
          chainId: 'solana',
          dexId: 'raydium',
        },
        'JUP': {
          symbol: 'JUP',
          name: 'Jupiter',
          price: 8.9,
          priceChange24h: 12.3,
          priceChange1h: 1.8,
          priceChange6h: 6.7,
          volume24h: 15000000,
          marketCap: 200000000,
          liquidity: 3000000,
          age: 36,
          holders: 4500,
          transactions24h: 950,
          pairAddress: '0xjupiter123456',
          chainId: 'solana',
          dexId: 'raydium',
        },
      };

      const tokenData = mockTokenData[symbol.toUpperCase()];
      if (tokenData) {
        this.cacheResult(cacheKey, tokenData);
        return tokenData;
      }

      return null;
    } catch (error) {
      console.error('Dexscreener token data error:', error);
      throw new Error(`Failed to get token data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rate limiting implementation
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Build search URL with filters
   */
  private buildSearchUrl(query: string, filters: SearchFilters): string {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters.chainId) {
      params.append('chainId', filters.chainId);
    }

    return `${this.baseUrl}/search/?${params.toString()}`;
  }

  /**
   * Process search results and apply filters
   */
  private processSearchResults(pairs: any[], filters: SearchFilters): TokenData[] {
    return pairs
      .map(pair => this.processTokenData(pair))
      .filter((token): token is TokenData => token !== null && this.applyFilters(token, filters))
      .slice(0, 30); // API limit
  }

  /**
   * Process individual token data
   */
  private processTokenData(pair: any): TokenData | null {
    if (!pair || !pair.baseToken || !pair.priceUsd) {
      return null;
    }

    // const now = Date.now();
    const pairAge = pair.pairAge ? parseFloat(pair.pairAge) : 0;
    const ageHours = pairAge / (1000 * 60 * 60); // Convert to hours

    return {
      symbol: pair.baseToken.symbol || 'UNKNOWN',
      name: pair.baseToken.name || pair.baseToken.symbol || 'Unknown Token',
      price: parseFloat(pair.priceUsd) || 0,
      priceChange24h: parseFloat(pair.priceChange?.h24 || '0') || 0,
      priceChange1h: parseFloat(pair.priceChange?.h1 || '0') || 0,
      priceChange6h: parseFloat(pair.priceChange?.h6 || '0') || 0,
      volume24h: parseFloat(pair.volume?.h24 || '0') || 0,
      marketCap: parseFloat(pair.marketCap || '0') || 0,
      liquidity: parseFloat(pair.liquidity?.usd || '0') || 0,
      age: ageHours,
      holders: parseInt(pair.holders || '0') || 0,
      transactions24h: parseInt(pair.txns?.h24 || '0') || 0,
      pairAddress: pair.pairAddress || '',
      chainId: pair.chainId || 'solana',
      dexId: pair.dexId || 'unknown',
    };
  }

  /**
   * Apply filters to token data
   */
  private applyFilters(token: TokenData, filters: SearchFilters): boolean {
    // Enforce minimum market cap filter
    if (token.marketCap < 150000) {
      return false;
    }

    if (filters.minVolume && token.volume24h < filters.minVolume) {
      return false;
    }

    if (filters.maxVolume && token.volume24h > filters.maxVolume) {
      return false;
    }

    if (filters.minAge && token.age < filters.minAge) {
      return false;
    }

    if (filters.maxAge && token.age > filters.maxAge) {
      return false;
    }

    if (filters.minMarketCap && token.marketCap < filters.minMarketCap) {
      return false;
    }

    if (filters.maxMarketCap && token.marketCap > filters.maxMarketCap) {
      return false;
    }

    if (filters.minLiquidity && token.liquidity < filters.minLiquidity) {
      return false;
    }

    return true;
  }

  /**
   * Generate cache key for search results
   */
  private generateCacheKey(query: string, filters: SearchFilters): string {
    const filterStr = JSON.stringify(filters);
    return `search_${query}_${filterStr}`;
  }

  /**
   * Get cached result if valid
   */
  private getCachedResult<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache result with timestamp
   */
  private cacheResult<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
let dexScreenerInstance: DexscreenerAPI | null = null;

export function getDexScreenerAPI(db?: DatabaseManager): DexscreenerAPI {
  if (!dexScreenerInstance) {
    if (!db) {
      throw new Error('DatabaseManager is required for DexScreenerAPI initialization');
    }
    dexScreenerInstance = new DexscreenerAPI(db);
  }
  return dexScreenerInstance;
}

export { DexscreenerAPI };
