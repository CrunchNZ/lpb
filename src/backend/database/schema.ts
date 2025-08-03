import { Database } from 'sqlite3';
// import { promisify } from 'util';

export interface Position {
  id: string;
  strategy: string;
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  amountA: number;
  amountB: number;
  entryPrice: number;
  currentPrice: number;
  timestamp: number;
  status: 'active' | 'closed' | 'pending';
  pnl: number;
  apy: number;
}

export interface PerformanceMetrics {
  id: string;
  timestamp: number;
  totalValue: number;
  totalPnl: number;
  totalApy: number;
  activePositions: number;
  closedPositions: number;
  strategyBreakdown: string; // JSON string
}

export interface BotConfig {
  id: string;
  key: string;
  value: string;
  updatedAt: number;
}

export interface Watchlist {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface WatchlistToken {
  id: number;
  watchlistId: number;
  tokenSymbol: string;
  tokenName: string;
  pairAddress: string;
  chainId: string;
  addedAt: number;
}

export class DatabaseSchema {
  private db: Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.db.serialize(() => {
      this.createTables();
    });
  }

  private createTables(): void {
    // Positions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        strategy TEXT NOT NULL,
        pool_address TEXT NOT NULL,
        token_a TEXT NOT NULL,
        token_b TEXT NOT NULL,
        amount_a REAL NOT NULL,
        amount_b REAL NOT NULL,
        entry_price REAL NOT NULL,
        current_price REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'closed', 'pending')),
        pnl REAL NOT NULL DEFAULT 0,
        apy REAL NOT NULL DEFAULT 0
      )
    `);

    // Performance metrics table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        total_value REAL NOT NULL,
        total_pnl REAL NOT NULL,
        total_apy REAL NOT NULL,
        active_positions INTEGER NOT NULL,
        closed_positions INTEGER NOT NULL,
        strategy_breakdown TEXT NOT NULL
      )
    `);

    // Bot configuration table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS bot_config (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Watchlists table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS watchlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Watchlist tokens junction table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS watchlist_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        watchlist_id INTEGER NOT NULL,
        token_symbol TEXT NOT NULL,
        token_name TEXT NOT NULL,
        pair_address TEXT NOT NULL,
        chain_id TEXT NOT NULL DEFAULT 'solana',
        added_at INTEGER NOT NULL,
        FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_positions_strategy ON positions(strategy)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_positions_timestamp ON positions(timestamp)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_watchlists_name ON watchlists(name)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_watchlist_tokens_watchlist_id ON watchlist_tokens(watchlist_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_watchlist_tokens_symbol ON watchlist_tokens(token_symbol)`);
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getDatabase(): Database {
    return this.db;
  }
}
