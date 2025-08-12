/**
 * Dexscreener API Integration Tests
 */

import { getDexScreenerAPI, TokenData, SearchFilters } from '../src/backend/integrations/dexscreener';
import { DatabaseManager } from '../src/backend/database/DatabaseManager';

// Mock fetch
global.fetch = jest.fn();

describe('DexscreenerAPI', () => {
  let dexScreener: any;
  let mockDb: DatabaseManager;

  beforeEach(() => {
    // Reset modules and mocks
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    
    // Create mock database manager
    mockDb = {
      // Add minimal mock methods needed
    } as any;
    
    // Always create a new DexscreenerAPI instance for each test
    dexScreener = getDexScreenerAPI(mockDb);
    dexScreener.clearCache();
  });

  describe('searchTokens', () => {
    it('should search tokens successfully', async () => {
      const mockResponse = {
        pairs: [
          {
            baseToken: { symbol: 'PEPE', name: 'Pepe' },
            quoteToken: { symbol: 'USDC', name: 'USD Coin' },
            priceUsd: '0.00000123',
            priceNative: '0.000000000123',
            priceChange: { h24: 15.67, h6: 5.23, h1: 1.45 },
            volume: { h24: 2500000, h6: 1200000, h1: 500000 },
            liquidity: { usd: 150000, base: 1000000, quote: 150000 },
            fdv: 500000,
            pairCreatedAt: Date.now() - (48 * 60 * 60 * 1000), // 48 hours ago
            txns: { h24: { buys: 850, sells: 650 } },
            pairAddress: '0x1234567890abcdef',
            chainId: 'solana',
            dexId: 'raydium',
            url: 'https://dexscreener.com/solana/0x1234567890abcdef'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await dexScreener.searchTokens('PEPE');

      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].symbol).toBe('PEPE');
      expect(result.tokens[0].price).toBe(0.00000123);
      expect(result.tokens[0].priceChange24h).toBe(15.67);
      expect(result.tokens[0].volume24h).toBe(2500000);
      expect(result.tokens[0].marketCap).toBe(500000);
      expect(result.tokens[0].age).toBeCloseTo(48, 1);
    });

    it('should apply filters correctly', async () => {
      const mockResponse = {
        pairs: [
          {
            baseToken: { symbol: 'PEPE', name: 'Pepe' },
            quoteToken: { symbol: 'USDC', name: 'USD Coin' },
            priceUsd: '0.00000123',
            priceNative: '0.000000000123',
            priceChange: { h24: 15.67, h6: 5.23, h1: 1.45 },
            volume: { h24: 2500000, h6: 1200000, h1: 500000 },
            liquidity: { usd: 150000, base: 1000000, quote: 150000 },
            fdv: 500000,
            pairCreatedAt: Date.now() - (48 * 60 * 60 * 1000),
            txns: { h24: { buys: 850, sells: 650 } },
            pairAddress: '0x1234567890abcdef',
            chainId: 'solana',
            dexId: 'raydium',
            url: 'https://dexscreener.com/solana/0x1234567890abcdef'
          },
          {
            baseToken: { symbol: 'DOGE', name: 'Dogecoin' },
            quoteToken: { symbol: 'USDC', name: 'USD Coin' },
            priceUsd: '0.078',
            priceNative: '0.000000078',
            priceChange: { h24: -5.23, h6: -2.1, h1: -0.5 },
            volume: { h24: 500000, h6: 250000, h1: 100000 }, // Below 1M filter
            liquidity: { usd: 500000, base: 1000000, quote: 500000 },
            fdv: 1200000,
            pairCreatedAt: Date.now() - (72 * 60 * 60 * 1000), // 72 hours
            txns: { h24: { buys: 1200, sells: 800 } },
            pairAddress: '0xabcdef1234567890',
            chainId: 'solana',
            dexId: 'raydium',
            url: 'https://dexscreener.com/solana/0xabcdef1234567890'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const filters: SearchFilters = {
        minVolume: 1000000, // $1M minimum
        minMarketCap: 150000 // $150K minimum
      };

      const result = await dexScreener.searchTokens('test', filters);

      // Should only return PEPE (DOGE filtered out due to low volume)
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].symbol).toBe('PEPE');
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(dexScreener.searchTokens('test')).rejects.toThrow('Dexscreener API error: 429 Too Many Requests');
    });

    it('should enforce minimum market cap filter', async () => {
      const mockResponse = {
        pairs: [
          {
            baseToken: { symbol: 'LOW', name: 'Low Cap Token' },
            quoteToken: { symbol: 'USDC', name: 'USD Coin' },
            priceUsd: '0.001',
            priceNative: '0.000000001',
            priceChange: { h24: 5.0, h6: 2.1, h1: 0.5 },
            volume: { h24: 1000000, h6: 500000, h1: 200000 },
            liquidity: { usd: 50000, base: 1000000, quote: 50000 },
            fdv: 50000, // Below 150K minimum
            pairCreatedAt: Date.now() - (1 * 60 * 60 * 1000), // 1 hour
            txns: { h24: { buys: 50, sells: 30 } },
            pairAddress: '0xlowcap123',
            chainId: 'solana',
            dexId: 'raydium',
            url: 'https://dexscreener.com/solana/0xlowcap123'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const filters: SearchFilters = {
        minMarketCap: 150000 // $150K minimum
      };

      const result = await dexScreener.searchTokens('test', filters);

      // Should filter out tokens below minimum market cap
      expect(result.tokens).toHaveLength(0);
    });
  });

  describe('getTokenDetails', () => {
    it('should fetch token details successfully', async () => {
      const mockResponse = {
        pairs: [
          {
            baseToken: { symbol: 'PEPE', name: 'Pepe' },
            quoteToken: { symbol: 'USDC', name: 'USD Coin' },
            priceUsd: '0.00000123',
            priceNative: '0.000000000123',
            priceChange: { h24: 15.67, h6: 5.23, h1: 1.45 },
            volume: { h24: 2500000, h6: 1200000, h1: 500000 },
            liquidity: { usd: 150000, base: 1000000, quote: 150000 },
            fdv: 500000,
            pairCreatedAt: Date.now() - (48 * 60 * 60 * 1000),
            txns: { h24: { buys: 850, sells: 650 } },
            pairAddress: '0x1234567890abcdef',
            chainId: 'solana',
            dexId: 'raydium',
            url: 'https://dexscreener.com/solana/0x1234567890abcdef'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await dexScreener.getTokenDetails('0x1234567890abcdef');

      expect(result).not.toBeNull();
      expect(result?.symbol).toBe('PEPE');
      expect(result?.price).toBe(0.00000123);
    });

    it('should return null for invalid token', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await dexScreener.getTokenDetails('invalid');

      expect(result).toBeNull();
    });
  });

  describe('getTrendingTokens', () => {
    it('should fetch trending gainers', async () => {
      const mockResponse = {
        pairs: [
          {
            baseToken: { symbol: 'PEPE', name: 'Pepe' },
            quoteToken: { symbol: 'USDC', name: 'USD Coin' },
            priceUsd: '0.00000123',
            priceNative: '0.000000000123',
            priceChange: { h24: 25.67, h6: 15.23, h1: 5.45 },
            volume: { h24: 5000000, h6: 2500000, h1: 1000000 },
            liquidity: { usd: 300000, base: 2000000, quote: 300000 },
            fdv: 1000000,
            pairCreatedAt: Date.now() - (24 * 60 * 60 * 1000),
            txns: { h24: { buys: 1500, sells: 800 } },
            pairAddress: '0x1234567890abcdef',
            chainId: 'solana',
            dexId: 'raydium',
            url: 'https://dexscreener.com/solana/0x1234567890abcdef'
          }
        ]
      };

      // Mock the fetch to return the response for the trending tokens endpoint
      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/tokens/solana')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockResponse
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });
      });

      const filters: SearchFilters = {
        trending: 'gainers'
      };

      const result = await dexScreener.getTrendingTokens(filters);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('PEPE');
      expect(result[0].priceChange24h).toBe(25.67);
    });
  });

  describe('caching', () => {
    it('should cache search results', async () => {
      const mockResponse = {
        pairs: [
          {
            baseToken: { symbol: 'PEPE', name: 'Pepe' },
            priceUsd: '0.00000123',
            priceChange: { h24: '15.67' },
            volume: { h24: '2500000' },
            marketCap: '500000',
            liquidity: { usd: '150000' },
            pairAge: '172800000',
            holders: '1250',
            txns: { h24: '850' },
            pairAddress: '0x1234567890abcdef',
            chainId: 'solana',
            dexId: 'raydium'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // First call
      const result1 = await dexScreener.searchTokens('PEPE');
      expect(result1.tokens).toHaveLength(1);

      // Second call should use cache
      const result2 = await dexScreener.searchTokens('PEPE');
      expect(result2.tokens).toHaveLength(1);

      // Should only call fetch once
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should provide cache statistics', () => {
      const stats = dexScreener.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('should clear cache', () => {
      dexScreener.clearCache();
      const stats = dexScreener.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limits', async () => {
      const mockResponse = { pairs: [] };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const startTime = Date.now();
      
      // Make sequential calls to test rate limiting
      await dexScreener.searchTokens('test1');
      await dexScreener.searchTokens('test2');
      await dexScreener.searchTokens('test3');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 2 seconds (1 second delay between calls)
      expect(duration).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('getDexScreenerAPI', () => {
    it('should create singleton instance', () => {
      const instance1 = getDexScreenerAPI(mockDb);
      const instance2 = getDexScreenerAPI(mockDb);
      
      expect(instance1).toBe(instance2);
    });

    it('should require DatabaseManager', () => {
      // Reset modules to clear singleton
      jest.resetModules();
      
      // Re-import the function after reset
      const { getDexScreenerAPI: freshGetDexScreenerAPI } = require('../src/backend/integrations/dexscreener');
      
      expect(() => freshGetDexScreenerAPI()).toThrow('DatabaseManager is required for DexScreenerAPI initialization');
    });
  });
}); 