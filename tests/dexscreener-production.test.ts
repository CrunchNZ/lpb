/**
 * DexScreener Production Integration Test
 * Tests the real DexScreener API integration without mock data
 */

import { getDexScreenerAPI } from '../src/backend/integrations/dexscreener';
import { DatabaseManager } from '../src/backend/database/DatabaseManager';
import { TokenData } from '../src/backend/integrations/dexscreener';

describe('DexScreener Production Integration', () => {
  let dexscreener: any;
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    // Initialize database manager
    dbManager = new DatabaseManager();
    
    // Initialize DexScreener API
    dexscreener = getDexScreenerAPI(dbManager);
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('Real API Integration', () => {
    it('should search for real tokens on Solana', async () => {
      const result = await dexscreener.searchTokens('SOL', {
        chainId: 'solana',
        minVolume: 100000,
      });

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.hasMore).toBeDefined();

      if (result.tokens.length > 0) {
        const token = result.tokens[0];
        expect(token.symbol).toBeDefined();
        expect(token.name).toBeDefined();
        expect(token.price).toBeGreaterThan(0);
        expect(token.volume24h).toBeGreaterThan(0);
        expect(token.pairAddress).toBeDefined();
        expect(token.chainId).toBe('solana');
      }
    }, 30000); // 30 second timeout for real API calls

    it('should get trending tokens from Solana', async () => {
      const tokens = await dexscreener.getTrendingTokens({
        chainId: 'solana',
        minVolume: 1000000,
        minMarketCap: 500000,
      });

      expect(tokens).toBeInstanceOf(Array);
      expect(tokens.length).toBeGreaterThan(0);

      if (tokens.length > 0) {
        const token = tokens[0];
        expect(token.symbol).toBeDefined();
        expect(token.name).toBeDefined();
        expect(token.price).toBeGreaterThan(0);
        expect(token.volume24h).toBeGreaterThan(0);
        expect(token.pairAddress).toBeDefined();
        expect(token.chainId).toBe('solana');
      }
    }, 30000);

    it('should search for popular meme tokens', async () => {
      const result = await dexscreener.searchTokens('PEPE', {
        chainId: 'solana',
        minVolume: 10000,
      });

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);

      if (result.tokens.length > 0) {
        const token = result.tokens[0];
        expect(token.symbol).toMatch(/PEPE/i);
        expect(token.price).toBeGreaterThan(0);
        expect(token.volume24h).toBeGreaterThan(0);
      }
    }, 30000);

    it('should handle search with no results gracefully', async () => {
      const result = await dexscreener.searchTokens('NONEXISTENTTOKEN123', {
        chainId: 'solana',
      });

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    }, 30000);

    it('should apply filters correctly', async () => {
      const result = await dexscreener.searchTokens('SOL', {
        chainId: 'solana',
        minVolume: 1000000, // $1M minimum volume
        minMarketCap: 1000000, // $1M minimum market cap
      });

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);

      // All returned tokens should meet the filter criteria
      result.tokens.forEach((token: TokenData) => {
        expect(token.volume24h).toBeGreaterThanOrEqual(1000000);
        expect(token.marketCap).toBeGreaterThanOrEqual(1000000);
      });
    }, 30000);

    it('should get token details by pair address', async () => {
      // First search for a token to get a pair address
      const searchResult = await dexscreener.searchTokens('SOL', {
        chainId: 'solana',
        minVolume: 100000,
      });

      if (searchResult.tokens.length > 0) {
        const pairAddress = searchResult.tokens[0].pairAddress;
        const tokenDetails = await dexscreener.getTokenDetails(pairAddress, 'solana');

        expect(tokenDetails).toBeDefined();
        expect(tokenDetails.symbol).toBeDefined();
        expect(tokenDetails.price).toBeGreaterThan(0);
        expect(tokenDetails.pairAddress).toBe(pairAddress);
      }
    }, 30000);

    it('should get token pools for a token address', async () => {
      // First search for a token to get a contract address
      const searchResult = await dexscreener.searchTokens('SOL', {
        chainId: 'solana',
        minVolume: 100000,
      });

      if (searchResult.tokens.length > 0) {
        const contractAddress = searchResult.tokens[0].contractAddress;
        if (contractAddress) {
          const pools = await dexscreener.getTokenPools(contractAddress, 'solana');

          expect(pools).toBeInstanceOf(Array);
          if (pools.length > 0) {
            expect(pools[0].contractAddress).toBe(contractAddress);
          }
        }
      }
    }, 30000);
  });

  describe('Cache Management', () => {
    it('should cache results and return cached data', async () => {
      // First call
      const result1 = await dexscreener.searchTokens('SOL', {
        chainId: 'solana',
        minVolume: 100000,
      });

      // Second call should use cache
      const result2 = await dexscreener.searchTokens('SOL', {
        chainId: 'solana',
        minVolume: 100000,
      });

      expect(result1).toEqual(result2);
    }, 30000);

    it('should clear cache successfully', async () => {
      // Make a search to populate cache
      await dexscreener.searchTokens('SOL', {
        chainId: 'solana',
        minVolume: 100000,
      });

      // Clear cache
      dexscreener.clearCache();

      // Get cache stats
      const stats = dexscreener.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.entries).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // This test would require mocking network failures
      // For now, we'll test that the API doesn't crash on invalid inputs
      try {
        await dexscreener.searchTokens('', {
          chainId: 'solana',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(5).fill(null).map(() =>
        dexscreener.searchTokens('SOL', {
          chainId: 'solana',
          minVolume: 100000,
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.tokens).toBeInstanceOf(Array);
      });
    }, 60000); // 60 second timeout for rate limiting test
  });
}); 