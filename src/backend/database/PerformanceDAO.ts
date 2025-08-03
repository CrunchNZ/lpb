import { Database } from 'sqlite3';
import { PerformanceMetrics } from './schema';

export interface StrategyBreakdown {
  [strategy: string]: {
    totalValue: number;
    totalPnl: number;
    totalApy: number;
    positionCount: number;
  };
}

export class PerformanceDAO {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async createMetrics(metrics: Omit<PerformanceMetrics, 'id'>): Promise<string> {
    const id = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO performance_metrics (
          id, timestamp, total_value, total_pnl, total_apy,
          active_positions, closed_positions, strategy_breakdown
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        id,
        metrics.timestamp,
        metrics.totalValue,
        metrics.totalPnl,
        metrics.totalApy,
        metrics.activePositions,
        metrics.closedPositions,
        metrics.strategyBreakdown,
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

  async getMetrics(id: string): Promise<PerformanceMetrics | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM performance_metrics WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? this.mapRowToMetrics(row) : null);
          }
        }
      );
    });
  }

  async getLatestMetrics(): Promise<PerformanceMetrics | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM performance_metrics ORDER BY timestamp DESC LIMIT 1',
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? this.mapRowToMetrics(row) : null);
          }
        }
      );
    });
  }

  async getMetricsByTimeRange(startTime: number, endTime: number): Promise<PerformanceMetrics[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM performance_metrics WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp ASC',
        [startTime, endTime],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => this.mapRowToMetrics(row)));
          }
        }
      );
    });
  }

  async getMetricsByTimeRangeGrouped(
    startTime: number,
    endTime: number,
    interval: number
  ): Promise<PerformanceMetrics[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          'perf_' || (timestamp / ?) * ? || '_' || RANDOM() as id,
          (timestamp / ?) * ? as timestamp,
          AVG(total_value) as total_value,
          AVG(total_pnl) as total_pnl,
          AVG(total_apy) as total_apy,
          AVG(active_positions) as active_positions,
          AVG(closed_positions) as closed_positions,
          strategy_breakdown
        FROM performance_metrics 
        WHERE timestamp BETWEEN ? AND ?
        GROUP BY (timestamp / ?)
        ORDER BY timestamp ASC
      `, [interval, interval, interval, interval, startTime, endTime, interval],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => this.mapRowToMetrics(row)));
          }
        }
      );
    });
  }

  async getTotalValue(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT total_value FROM performance_metrics ORDER BY timestamp DESC LIMIT 1',
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.total_value || 0);
          }
        }
      );
    });
  }

  async getTotalPnl(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT total_pnl FROM performance_metrics ORDER BY timestamp DESC LIMIT 1',
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.total_pnl || 0);
          }
        }
      );
    });
  }

  async getAverageApy(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT AVG(total_apy) as average FROM performance_metrics WHERE timestamp > ?',
        [Date.now() - 24 * 60 * 60 * 1000], // Last 24 hours
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

  async getStrategyBreakdown(): Promise<StrategyBreakdown> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT strategy_breakdown FROM performance_metrics ORDER BY timestamp DESC LIMIT 1',
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            try {
              const breakdown = row?.strategy_breakdown ? JSON.parse(row.strategy_breakdown) : {};
              resolve(breakdown);
            } catch (parseError) {
              resolve({});
            }
          }
        }
      );
    });
  }

  async deleteMetrics(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM performance_metrics WHERE id = ?',
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

  async cleanupOldMetrics(olderThanDays: number): Promise<number> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM performance_metrics WHERE timestamp < ?',
        [cutoffTime],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  private mapRowToMetrics(row: any): PerformanceMetrics {
    return {
      id: row.id,
      timestamp: row.timestamp,
      totalValue: row.total_value,
      totalPnl: row.total_pnl,
      totalApy: row.total_apy,
      activePositions: row.active_positions,
      closedPositions: row.closed_positions,
      strategyBreakdown: row.strategy_breakdown,
    };
  }
}
