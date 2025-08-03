/**
 * Dexscreener API Integration Tests
 */

import { DexscreenerAPI, getDexScreenerAPI, TokenData, SearchFilters } from '../src/backend/integrations/dexscreener';
import { DatabaseManager } from '../src/backend/database/DatabaseManager';

// Mock fetch
global.fetch = jest.fn();

describe('DexscreenerAPI', () => {
  let dexScreener: DexscreenerAPI;
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
    dexScreener = new DexscreenerAPI(mockDb);
    dexScreener.clearCache();
  });

  describe('searchTokens', () => {
    it('should search tokens successfully', async () => {
      const mockResponse = {
        pairs: [
          {
            baseToken: { symbol: 'PEPE', name: 'Pepe' },
            priceUsd: '0.00000123',
            priceChange: { h24: '15.67', h1: '2.34', h6: '8.91' },
            volume: { h24: '2500000' },
            marketCap: '500000',
            liquidity: { usd: '150000' },
            pairAge: '172800000', // 48 hours in milliseconds
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

      const result = await dexScreener.searchTokens('PEPE');

      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].symbol).toBe('PEPE');
      expect(result.tokens[0].price).toBe(0.00000123);
      expect(result.tokens[0].priceChange24h).toBe(15.67);
      expect(result.tokens[0].volume24h).toBe(2500000);
      expect(result.tokens[0].marketCap).toBe(500000);
      expect(result.tokens[0].age).toBe(48);
    });

    it('should apply filters correctly', async () => {
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
          },
          {
            baseToken: { symbol: 'DOGE', name: 'Dogecoin' },
            priceUsd: '0.078',
            priceChange: { h24: '-5.23' },
            volume: { h24: '500000' }, // Below 1M filter
            marketCap: '1200000',
            liquidity: { usd: '500000' },
            pairAge: '259200000', // 72 hours
            holders: '2100',
            txns: { h24: '1200' },
            pairAddress: '0xabcdef1234567890',
            chainId: 'solana',
            dexId: 'raydium'
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
            priceUsd: '0.001',
            priceChange: { h24: '5.0' },
            volume: { h24: '1000000' },
            marketCap: '50000', // Below 150K minimum
            liquidity: { usd: '50000' },
            pairAge: '3600000', // 1 hour
            holders: '100',
            txns: { h24: '50' },
            pairAddress: '0xlowcap123',
            chainId: 'solana',
            dexId: 'raydium'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await dexScreener.searchTokens('test');

      // Should filter out tokens below minimum market cap
      expect(result.tokens).toHaveLength(0);
    });
  });

  describe('getTokenDetails', () => {
    it('should fetch token details successfully', async () => {
      const mockResponse = {
        pair: {
          baseToken: { symbol: 'PEPE', name: 'Pepe' },
          priceUsd: '0.00000123',
          priceChange: { h24: '15.67', h1: '2.34', h6: '8.91' },
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
            priceUsd: '0.00000123',
            priceChange: { h24: '25.0' },
            volume: { h24: '2500000' },
            marketCap: '500000',
            liquidity: { usd: '150000' },
            pairAge: '172800000',
            holders: '1250',
            txns: { h24: '850' },
            pairAddress: '0x1234567890abcdef',
            chainId: 'solana',
            dexId: 'raydium'
          },
          {
            baseToken: { symbol: 'DOGE', name: 'Dogecoin' },
            priceUsd: '0.078',
            priceChange: { h24: '15.0' },
            volume: { h24: '15000000' },
            marketCap: '1200000',
            liquidity: { usd: '500000' },
            pairAge: '259200000',
            holders: '2100',
            txns: { h24: '1200' },
            pairAddress: '0xabcdef1234567890',
            chainId: 'solana',
            dexId: 'raydium'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await dexScreener.getTrendingTokens('gainers');

      expect(result).toHaveLength(2);
      // Should be sorted by price change (highest first)
      expect(result[0].priceChange24h).toBeGreaterThan(result[1].priceChange24h);
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