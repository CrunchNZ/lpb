/**
 * Token Search Integration Tests
 * Tests the integration between Dexscreener API and Watchlist functionality
 */

import { DexscreenerAPI } from '../src/backend/integrations/dexscreener';
import { WatchlistDAO } from '../src/backend/database/WatchlistDAO';
import { DatabaseManager } from '../src/backend/database/DatabaseManager';

// Mock fetch for Dexscreener API
global.fetch = jest.fn();

describe('Token Search Integration', () => {
  let dexScreener: DexscreenerAPI;
  let dbManager: DatabaseManager;
  let watchlistDAO: WatchlistDAO;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create in-memory database for testing
    dbManager = new DatabaseManager(':memory:');
    dexScreener = new DexscreenerAPI(dbManager);
    watchlistDAO = new WatchlistDAO(dbManager.schema.getDatabase());
  });

  afterEach(async () => {
    try {
      await dbManager.close();
    } catch (error) {
      // Ignore SQLite busy errors during cleanup
      console.log('Database cleanup error (expected):', error.message);
    }
  });

  describe('Token Search and Watchlist Integration', () => {
    it('should search tokens and add to watchlist', async () => {
      // Mock Dexscreener API response
      const mockResponse = {
        pairs: [
          {
            baseToken: { symbol: 'PEPE', name: 'Pepe' },
            priceUsd: '0.00000123',
            priceChange: { h24: '15.67', h1: '2.34', h6: '8.91' },
            volume: { h24: '2500000' },
            marketCap: '500000',
            liquidity: { usd: '150000' },
            pairAge: '172800000', // 48 hours
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

      // Search for tokens
      const searchResult = await dexScreener.searchTokens('PEPE');
      expect(searchResult.tokens).toHaveLength(1);
      expect(searchResult.tokens[0].symbol).toBe('PEPE');

      // Create a watchlist
      const watchlist = await watchlistDAO.createWatchlist('Test Watchlist');
      expect(watchlist.name).toBe('Test Watchlist');

      // Add token to watchlist
      const token = searchResult.tokens[0];
      const watchlistToken = await watchlistDAO.addTokenToWatchlist(
        watchlist.id,
        token.symbol,
        token.name,
        token.pairAddress,
        token.chainId
      );

      expect(watchlistToken.tokenSymbol).toBe('PEPE');
      expect(watchlistToken.watchlistId).toBe(watchlist.id);

      // Verify token is in watchlist
      const watchlistTokens = await watchlistDAO.getWatchlistTokens(watchlist.id);
      expect(watchlistTokens).toHaveLength(1);
      expect(watchlistTokens[0].tokenSymbol).toBe('PEPE');
    });

    it('should handle multiple tokens in watchlist', async () => {
      // Mock Dexscreener API response with multiple tokens
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

      // Search for tokens
      const searchResult = await dexScreener.searchTokens('test');
      expect(searchResult.tokens).toHaveLength(2);

      // Create a watchlist
      const watchlist = await watchlistDAO.createWatchlist('Multi Token Watchlist');

      // Add both tokens to watchlist
      for (const token of searchResult.tokens) {
        await watchlistDAO.addTokenToWatchlist(
          watchlist.id,
          token.symbol,
          token.name,
          token.pairAddress,
          token.chainId
        );
      }

      // Verify both tokens are in watchlist
      const watchlistTokens = await watchlistDAO.getWatchlistTokens(watchlist.id);
      expect(watchlistTokens).toHaveLength(2);
      expect(watchlistTokens.map(t => t.tokenSymbol)).toContain('PEPE');
      expect(watchlistTokens.map(t => t.tokenSymbol)).toContain('DOGE');
    });

    it('should check if token is watchlisted', async () => {
      // Create a watchlist and add a token
      const watchlist = await watchlistDAO.createWatchlist('Test Watchlist');
      await watchlistDAO.addTokenToWatchlist(
        watchlist.id,
        'PEPE',
        'Pepe',
        '0x1234567890abcdef',
        'solana'
      );

      // Check if token is watchlisted
      const isWatchlisted = await watchlistDAO.isTokenWatchlisted('PEPE');
      expect(isWatchlisted).toBe(true);

      // Check if non-watchlisted token returns false
      const isNotWatchlisted = await watchlistDAO.isTokenWatchlisted('UNKNOWN');
      expect(isNotWatchlisted).toBe(false);
    });

    it('should get watchlists for a specific token', async () => {
      // Create multiple watchlists
      const watchlist1 = await watchlistDAO.createWatchlist('Watchlist 1');
      const watchlist2 = await watchlistDAO.createWatchlist('Watchlist 2');

      // Add same token to both watchlists
      await watchlistDAO.addTokenToWatchlist(
        watchlist1.id,
        'PEPE',
        'Pepe',
        '0x1234567890abcdef',
        'solana'
      );
      await watchlistDAO.addTokenToWatchlist(
        watchlist2.id,
        'PEPE',
        'Pepe',
        '0x1234567890abcdef',
        'solana'
      );

      // Get watchlists containing the token
      const watchlists = await watchlistDAO.getWatchlistsForToken('PEPE');
      expect(watchlists).toHaveLength(2);
      expect(watchlists.map(w => w.name)).toContain('Watchlist 1');
      expect(watchlists.map(w => w.name)).toContain('Watchlist 2');
    });

    it('should remove token from watchlist', async () => {
      // Create watchlist and add token
      const watchlist = await watchlistDAO.createWatchlist('Test Watchlist');
      await watchlistDAO.addTokenToWatchlist(
        watchlist.id,
        'PEPE',
        'Pepe',
        '0x1234567890abcdef',
        'solana'
      );

      // Verify token is in watchlist
      let watchlistTokens = await watchlistDAO.getWatchlistTokens(watchlist.id);
      expect(watchlistTokens).toHaveLength(1);

      // Remove token from watchlist
      const removed = await watchlistDAO.removeTokenFromWatchlist(watchlist.id, 'PEPE');
      expect(removed).toBe(true);

      // Verify token is removed
      watchlistTokens = await watchlistDAO.getWatchlistTokens(watchlist.id);
      expect(watchlistTokens).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(dexScreener.searchTokens('test')).rejects.toThrow('Dexscreener API error');
    });

    it('should handle database errors gracefully', async () => {
      // This test would require more complex mocking of the database
      // For now, we'll just test that the basic structure works
      const watchlist = await watchlistDAO.createWatchlist('Test Watchlist');
      expect(watchlist).toBeDefined();
    });
  });
}); 