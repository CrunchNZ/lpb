/**
 * Watchlist Data Access Object
 * Handles CRUD operations for watchlists and watchlist tokens
 */

import { Database } from 'sqlite3';
import { promisify } from 'util';
import { Watchlist, WatchlistToken } from './schema';

export class WatchlistDAO {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Create a new watchlist
   */
  async createWatchlist(name: string): Promise<Watchlist> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO watchlists (name, created_at, updated_at)
      VALUES (?, ?, ?)
    `);

    return new Promise((resolve, reject) => {
      stmt.run([name, now, now], function(err) {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          id: this.lastID,
          name,
          createdAt: now,
          updatedAt: now
        });
      });
    });
  }

  /**
   * Get all watchlists
   */
  async getAllWatchlists(): Promise<Watchlist[]> {
    const query = `
      SELECT id, name, created_at as createdAt, updated_at as updatedAt
      FROM watchlists
      ORDER BY created_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  /**
   * Get watchlist by ID
   */
  async getWatchlistById(id: number): Promise<Watchlist | null> {
    const query = `
      SELECT id, name, created_at as createdAt, updated_at as updatedAt
      FROM watchlists
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row || null);
      });
    });
  }

  /**
   * Update watchlist name
   */
  async updateWatchlist(id: number, name: string): Promise<boolean> {
    const now = Date.now();
    const query = `
      UPDATE watchlists
      SET name = ?, updated_at = ?
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(query, [name, now, id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Delete watchlist and all its tokens
   */
  async deleteWatchlist(id: number): Promise<boolean> {
    const query = `DELETE FROM watchlists WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(query, [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Add token to watchlist
   */
  async addTokenToWatchlist(
    watchlistId: number,
    tokenSymbol: string,
    tokenName: string,
    pairAddress: string,
    chainId: string = 'solana'
  ): Promise<WatchlistToken> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO watchlist_tokens (watchlist_id, token_symbol, token_name, pair_address, chain_id, added_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    return new Promise((resolve, reject) => {
      stmt.run([watchlistId, tokenSymbol, tokenName, pairAddress, chainId, now], function(err) {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          id: this.lastID,
          watchlistId,
          tokenSymbol,
          tokenName,
          pairAddress,
          chainId,
          addedAt: now
        });
      });
    });
  }

  /**
   * Remove token from watchlist
   */
  async removeTokenFromWatchlist(watchlistId: number, tokenSymbol: string): Promise<boolean> {
    const query = `
      DELETE FROM watchlist_tokens
      WHERE watchlist_id = ? AND token_symbol = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(query, [watchlistId, tokenSymbol], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Get all tokens in a watchlist
   */
  async getWatchlistTokens(watchlistId: number): Promise<WatchlistToken[]> {
    const query = `
      SELECT id, watchlist_id as watchlistId, token_symbol as tokenSymbol, 
             token_name as tokenName, pair_address as pairAddress, 
             chain_id as chainId, added_at as addedAt
      FROM watchlist_tokens
      WHERE watchlist_id = ?
      ORDER BY added_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, [watchlistId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  /**
   * Get all watchlisted tokens across all watchlists
   */
  async getAllWatchlistedTokens(): Promise<WatchlistToken[]> {
    const query = `
      SELECT id, watchlist_id as watchlistId, token_symbol as tokenSymbol, 
             token_name as tokenName, pair_address as pairAddress, 
             chain_id as chainId, added_at as addedAt
      FROM watchlist_tokens
      ORDER BY added_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  /**
   * Check if token is in any watchlist
   */
  async isTokenWatchlisted(tokenSymbol: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM watchlist_tokens
      WHERE token_symbol = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.get(query, [tokenSymbol], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((row?.count || 0) > 0);
      });
    });
  }

  /**
   * Get watchlists containing a specific token
   */
  async getWatchlistsForToken(tokenSymbol: string): Promise<Watchlist[]> {
    const query = `
      SELECT DISTINCT w.id, w.name, w.created_at as createdAt, w.updated_at as updatedAt
      FROM watchlists w
      JOIN watchlist_tokens wt ON w.id = wt.watchlist_id
      WHERE wt.token_symbol = ?
      ORDER BY w.created_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, [tokenSymbol], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  /**
   * Get watchlist with token count
   */
  async getWatchlistWithTokenCount(watchlistId: number): Promise<Watchlist & { tokenCount: number } | null> {
    const query = `
      SELECT w.id, w.name, w.created_at as createdAt, w.updated_at as updatedAt,
             COUNT(wt.id) as tokenCount
      FROM watchlists w
      LEFT JOIN watchlist_tokens wt ON w.id = wt.watchlist_id
      WHERE w.id = ?
      GROUP BY w.id
    `;

    return new Promise((resolve, reject) => {
      this.db.get(query, [watchlistId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row || null);
      });
    });
  }

  /**
   * Get all watchlists with token counts
   */
  async getAllWatchlistsWithTokenCounts(): Promise<(Watchlist & { tokenCount: number })[]> {
    const query = `
      SELECT w.id, w.name, w.created_at as createdAt, w.updated_at as updatedAt,
             COUNT(wt.id) as tokenCount
      FROM watchlists w
      LEFT JOIN watchlist_tokens wt ON w.id = wt.watchlist_id
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }
} 