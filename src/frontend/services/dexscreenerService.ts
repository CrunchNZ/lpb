/**
 * DexScreener Service
 * Handles all frontend API calls to the backend DexScreener integration
 */

import { TokenData, SearchFilters, SearchResult } from '../../backend/integrations/dexscreener';

export interface DexScreenerService {
  searchTokens(query: string, filters?: SearchFilters): Promise<SearchResult>;
  getTrendingTokens(filters?: SearchFilters): Promise<TokenData[]>;
  getTokenDetails(pairAddress: string, chainId?: string): Promise<TokenData | null>;
  getTokenData(symbol: string): Promise<TokenData | null>;
  getTokenPools(tokenAddress: string, chainId?: string): Promise<TokenData[]>;
}

class DexScreenerServiceImpl implements DexScreenerService {
  private baseUrl = '/api/dexscreener'; // This will be proxied to the backend

  async searchTokens(query: string, filters: SearchFilters = {}): Promise<SearchResult> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      
      if (filters.chainId) params.append('chainId', filters.chainId);
      if (filters.minVolume) params.append('minVolume', filters.minVolume.toString());
      if (filters.minMarketCap) params.append('minMarketCap', filters.minMarketCap.toString());
      if (filters.trending) params.append('trending', filters.trending);

      console.log('Searching tokens with URL:', `${this.baseUrl}/search?${params.toString()}`);

      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Search result:', result);
      return result;
    } catch (error) {
      console.error('DexScreener search error:', error);
      throw new Error(`Failed to search tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTrendingTokens(filters: SearchFilters = {}): Promise<TokenData[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.chainId) params.append('chainId', filters.chainId);
      if (filters.minVolume) params.append('minVolume', filters.minVolume.toString());
      if (filters.minMarketCap) params.append('minMarketCap', filters.minMarketCap.toString());

      const response = await fetch(`${this.baseUrl}/trending?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Trending tokens failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DexScreener trending error:', error);
      throw new Error(`Failed to get trending tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTokenDetails(pairAddress: string, chainId: string = 'solana'): Promise<TokenData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/token/${chainId}/${pairAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Token details failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DexScreener token details error:', error);
      return null;
    }
  }

  async getTokenData(symbol: string): Promise<TokenData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/token-data/${symbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Token data failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DexScreener token data error:', error);
      return null;
    }
  }

  async getTokenPools(tokenAddress: string, chainId: string = 'solana'): Promise<TokenData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/token-pools/${chainId}/${tokenAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token pools failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DexScreener token pools error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dexscreenerService = new DexScreenerServiceImpl(); 