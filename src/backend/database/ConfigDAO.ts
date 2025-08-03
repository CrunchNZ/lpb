import { Database } from 'sqlite3';
import { BotConfig } from './schema';

export class ConfigDAO {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async setConfig(key: string, value: string): Promise<string> {
    const id = `config_${key}_${Date.now()}`;
    const updatedAt = Date.now();
    
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO bot_config (id, key, value, updated_at)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run([id, key, value, updatedAt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(id);
        }
      });

      stmt.finalize();
    });
  }

  async getConfig(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT value FROM bot_config WHERE key = ? ORDER BY updated_at DESC LIMIT 1',
        [key],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.value || null);
          }
        }
      );
    });
  }

  async getConfigWithTimestamp(key: string): Promise<BotConfig | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM bot_config WHERE key = ? ORDER BY updated_at DESC LIMIT 1',
        [key],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? this.mapRowToConfig(row) : null);
          }
        }
      );
    });
  }

  async getAllConfigs(): Promise<BotConfig[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM bot_config ORDER BY key ASC, updated_at DESC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // Get only the latest version of each config key
            const configMap = new Map<string, BotConfig>();
            rows.forEach(row => {
              const config = this.mapRowToConfig(row);
              if (!configMap.has(config.key)) {
                configMap.set(config.key, config);
              }
            });
            resolve(Array.from(configMap.values()));
          }
        }
      );
    });
  }

  async deleteConfig(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM bot_config WHERE key = ?',
        [key],
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

  async getConfigHistory(key: string): Promise<BotConfig[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM bot_config WHERE key = ? ORDER BY updated_at DESC',
        [key],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => this.mapRowToConfig(row)));
          }
        }
      );
    });
  }

  async setConfigs(configs: Record<string, string>): Promise<string[]> {
    const promises = Object.entries(configs).map(([key, value]) => 
      this.setConfig(key, value)
    );
    return Promise.all(promises);
  }

  async getConfigs(keys: string[]): Promise<Record<string, string>> {
    const promises = keys.map(async (key) => {
      const value = await this.getConfig(key);
      return { key, value };
    });
    
    const results = await Promise.all(promises);
    const configs: Record<string, string> = {};
    
    results.forEach(({ key, value }) => {
      if (value !== null) {
        configs[key] = value;
      }
    });
    
    return configs;
  }

  async hasConfig(key: string): Promise<boolean> {
    const value = await this.getConfig(key);
    return value !== null;
  }

  async getConfigKeys(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT DISTINCT key FROM bot_config ORDER BY key ASC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => row.key));
          }
        }
      );
    });
  }

  async cleanupOldConfigs(olderThanDays: number): Promise<number> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM bot_config WHERE updated_at < ?',
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

  private mapRowToConfig(row: any): BotConfig {
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      updatedAt: row.updated_at
    };
  }
} 