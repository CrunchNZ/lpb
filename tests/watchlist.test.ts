/**
 * Watchlist DAO Tests
 */

import { WatchlistDAO } from '../src/backend/database/WatchlistDAO';
import { Database } from 'sqlite3';

// Mock sqlite3
jest.mock('sqlite3', () => ({
  Database: jest.fn()
}));

describe('WatchlistDAO', () => {
  let watchlistDAO: WatchlistDAO;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a proper mock database with correct this context
    mockDb = {
      prepare: jest.fn().mockReturnValue({
        run: jest.fn().mockImplementation(function(this: any, params: any[], callback: any) {
          this.lastID = 1;
          if (callback) callback.call(this, null);
        })
      }),
      run: jest.fn().mockImplementation(function(this: any, query: string, params: any[], callback: any) {
        this.changes = 1;
        if (callback) callback.call(this, null);
      }),
      all: jest.fn().mockImplementation(function(this: any, query: string, callback: any) {
        if (callback) callback.call(this, null, []);
      }),
      get: jest.fn().mockImplementation(function(this: any, query: string, params: any[], callback: any) {
        if (callback) callback.call(this, null, null);
      }),
      close: jest.fn().mockImplementation(function(this: any, callback: any) {
        if (callback) callback.call(this, null);
      })
    };
    
    watchlistDAO = new WatchlistDAO(mockDb as Database);
  });

  describe('createWatchlist', () => {
    it('should create a new watchlist', async () => {
      const name = 'Test Watchlist';
      const result = await watchlistDAO.createWatchlist(name);

      expect(result).toEqual({
        id: 1,
        name,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO watchlists')
      );
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      mockDb.prepare = jest.fn().mockReturnValue({
        run: jest.fn().mockImplementation(function(this: any, params: any[], callback: any) {
          callback.call(this, mockError);
        })
      });

      await expect(watchlistDAO.createWatchlist('Test')).rejects.toThrow('Database error');
    });
  });

  describe('getAllWatchlists', () => {
    it('should return all watchlists', async () => {
      const mockWatchlists = [
        { id: 1, name: 'Watchlist 1', createdAt: Date.now(), updatedAt: Date.now() },
        { id: 2, name: 'Watchlist 2', createdAt: Date.now(), updatedAt: Date.now() }
      ];

      mockDb.all = jest.fn().mockImplementation(function(this: any, query: string, callback: any) {
        callback.call(this, null, mockWatchlists);
      });

      const result = await watchlistDAO.getAllWatchlists();

      expect(result).toEqual(mockWatchlists);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, created_at as createdAt, updated_at as updatedAt'),
        expect.any(Function)
      );
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      mockDb.all = jest.fn().mockImplementation(function(this: any, query: string, callback: any) {
        callback.call(this, mockError);
      });

      await expect(watchlistDAO.getAllWatchlists()).rejects.toThrow('Database error');
    });
  });

  describe('getWatchlistById', () => {
    it('should return watchlist by ID', async () => {
      const mockWatchlist = {
        id: 1,
        name: 'Test Watchlist',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockDb.get = jest.fn().mockImplementation((query: string, params: any[], callback: any) => {
        callback(null, mockWatchlist);
      });

      const result = await watchlistDAO.getWatchlistById(1);

      expect(result).toEqual(mockWatchlist);
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, created_at as createdAt, updated_at as updatedAt'),
        [1],
        expect.any(Function)
      );
    });

    it('should return null for non-existent watchlist', async () => {
      mockDb.get = jest.fn().mockImplementation((query: string, params: any[], callback: any) => {
        callback(null, null);
      });

      const result = await watchlistDAO.getWatchlistById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateWatchlist', () => {
    it('should update watchlist name', async () => {
      const result = await watchlistDAO.updateWatchlist(1, 'Updated Name');

      expect(result).toBe(true);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE watchlists'),
        expect.arrayContaining(['Updated Name', expect.any(Number), 1]),
        expect.any(Function)
      );
    });

    it('should return false when no rows affected', async () => {
      mockDb.run = jest.fn().mockImplementation(function(this: any, query: string, params: any[], callback: any) {
        this.changes = 0;
        callback.call(this, null);
      });

      const result = await watchlistDAO.updateWatchlist(999, 'Updated Name');

      expect(result).toBe(false);
    });
  });

  describe('deleteWatchlist', () => {
    it('should delete watchlist', async () => {
      const result = await watchlistDAO.deleteWatchlist(1);

      expect(result).toBe(true);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM watchlists'),
        [1],
        expect.any(Function)
      );
    });
  });

  describe('addTokenToWatchlist', () => {
    it('should add token to watchlist', async () => {
      const result = await watchlistDAO.addTokenToWatchlist(
        1,
        'PEPE',
        'Pepe',
        '0x1234567890abcdef',
        'solana'
      );

      expect(result).toEqual({
        id: 1,
        watchlistId: 1,
        tokenSymbol: 'PEPE',
        tokenName: 'Pepe',
        pairAddress: '0x1234567890abcdef',
        chainId: 'solana',
        addedAt: expect.any(Number)
      });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO watchlist_tokens')
      );
    });
  });

  describe('removeTokenFromWatchlist', () => {
    it('should remove token from watchlist', async () => {
      const result = await watchlistDAO.removeTokenFromWatchlist(1, 'PEPE');

      expect(result).toBe(true);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM watchlist_tokens'),
        [1, 'PEPE'],
        expect.any(Function)
      );
    });
  });

  describe('getWatchlistTokens', () => {
    it('should return tokens in watchlist', async () => {
      const mockTokens = [
        {
          id: 1,
          watchlistId: 1,
          tokenSymbol: 'PEPE',
          tokenName: 'Pepe',
          pairAddress: '0x1234567890abcdef',
          chainId: 'solana',
          addedAt: Date.now()
        }
      ];

      mockDb.all = jest.fn().mockImplementation((query: string, params: any[], callback: any) => {
        callback(null, mockTokens);
      });

      const result = await watchlistDAO.getWatchlistTokens(1);

      expect(result).toEqual(mockTokens);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, watchlist_id as watchlistId'),
        [1],
        expect.any(Function)
      );
    });
  });

  describe('getAllWatchlistedTokens', () => {
    it('should return all watchlisted tokens', async () => {
      const mockTokens = [
        {
          id: 1,
          watchlistId: 1,
          tokenSymbol: 'PEPE',
          tokenName: 'Pepe',
          pairAddress: '0x1234567890abcdef',
          chainId: 'solana',
          addedAt: Date.now()
        }
      ];

      mockDb.all = jest.fn().mockImplementation(function(this: any, query: string, callback: any) {
        callback.call(this, null, mockTokens);
      });

      const result = await watchlistDAO.getAllWatchlistedTokens();

      expect(result).toEqual(mockTokens);
    });
  });

  describe('isTokenWatchlisted', () => {
    it('should return true for watchlisted token', async () => {
      mockDb.get = jest.fn().mockImplementation(function(this: any, query: string, params: any[], callback: any) {
        callback.call(this, null, { count: 1 });
      });

      const result = await watchlistDAO.isTokenWatchlisted('PEPE');

      expect(result).toBe(true);
    });

    it('should return false for non-watchlisted token', async () => {
      mockDb.get = jest.fn().mockImplementation(function(this: any, query: string, params: any[], callback: any) {
        callback.call(this, null, { count: 0 });
      });

      const result = await watchlistDAO.isTokenWatchlisted('UNKNOWN');

      expect(result).toBe(false);
    });
  });

  describe('getWatchlistsForToken', () => {
    it('should return watchlists containing token', async () => {
      const mockWatchlists = [
        { id: 1, name: 'Watchlist 1', createdAt: Date.now(), updatedAt: Date.now() }
      ];

      mockDb.all = jest.fn().mockImplementation(function(this: any, query: string, params: any[], callback: any) {
        callback(null, mockWatchlists);
      });

      const result = await watchlistDAO.getWatchlistsForToken('PEPE');

      expect(result).toEqual(mockWatchlists);
    });
  });

  describe('getWatchlistWithTokenCount', () => {
    it('should return watchlist with token count', async () => {
      const mockWatchlist = {
        id: 1,
        name: 'Test Watchlist',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tokenCount: 5
      };

      mockDb.get = jest.fn().mockImplementation(function(this: any, query: string, params: any[], callback: any) {
        callback.call(this, null, mockWatchlist);
      });

      const result = await watchlistDAO.getWatchlistWithTokenCount(1);

      expect(result).toEqual(mockWatchlist);
    });
  });

  describe('getAllWatchlistsWithTokenCounts', () => {
    it('should return all watchlists with token counts', async () => {
      const mockWatchlists = [
        { id: 1, name: 'Watchlist 1', createdAt: Date.now(), updatedAt: Date.now(), tokenCount: 3 },
        { id: 2, name: 'Watchlist 2', createdAt: Date.now(), updatedAt: Date.now(), tokenCount: 0 }
      ];

      mockDb.all = jest.fn().mockImplementation(function(this: any, query: string, callback: any) {
        callback.call(this, null, mockWatchlists);
      });

      const result = await watchlistDAO.getAllWatchlistsWithTokenCounts();

      expect(result).toEqual(mockWatchlists);
    });
  });
}); 