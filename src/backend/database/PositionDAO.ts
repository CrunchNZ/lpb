import { Database } from 'sqlite3';
import { promisify } from 'util';
import { Position } from './schema';

export class PositionDAO {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async createPosition(position: Omit<Position, 'id'>): Promise<string> {
    const id = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO positions (
          id, strategy, pool_address, token_a, token_b, 
          amount_a, amount_b, entry_price, current_price, 
          timestamp, status, pnl, apy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        id,
        position.strategy,
        position.poolAddress,
        position.tokenA,
        position.tokenB,
        position.amountA,
        position.amountB,
        position.entryPrice,
        position.currentPrice,
        position.timestamp,
        position.status,
        position.pnl,
        position.apy
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(id);
        }
      });

      stmt.finalize();
    });
  }

  async getPosition(id: string): Promise<Position | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM positions WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? this.mapRowToPosition(row) : null);
          }
        }
      );
    });
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<boolean> {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const values = Object.values(updates);
    
    if (fields.length === 0) return true;

    const setClause = fields.map(field => `${this.camelToSnake(field)} = ?`).join(', ');
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE positions SET ${setClause} WHERE id = ?`,
        [...values, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async getActivePositions(): Promise<Position[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM positions WHERE status = "active" ORDER BY timestamp DESC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => this.mapRowToPosition(row)));
          }
        }
      );
    });
  }

  async getPositionsByStrategy(strategy: string): Promise<Position[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM positions WHERE strategy = ? ORDER BY timestamp DESC',
        [strategy],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => this.mapRowToPosition(row)));
          }
        }
      );
    });
  }

  async getPositionsByTimeRange(startTime: number, endTime: number): Promise<Position[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM positions WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
        [startTime, endTime],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => this.mapRowToPosition(row)));
          }
        }
      );
    });
  }

  async getTotalPnl(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT SUM(pnl) as total FROM positions WHERE status = "closed"',
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.total || 0);
          }
        }
      );
    });
  }

  async getAverageApy(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT AVG(apy) as average FROM positions WHERE status = "active"',
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.average || 0);
          }
        }
      );
    });
  }

  async deletePosition(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM positions WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  private mapRowToPosition(row: any): Position {
    return {
      id: row.id,
      strategy: row.strategy,
      poolAddress: row.pool_address,
      tokenA: row.token_a,
      tokenB: row.token_b,
      amountA: row.amount_a,
      amountB: row.amount_b,
      entryPrice: row.entry_price,
      currentPrice: row.current_price,
      timestamp: row.timestamp,
      status: row.status as 'active' | 'closed' | 'pending',
      pnl: row.pnl,
      apy: row.apy
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 