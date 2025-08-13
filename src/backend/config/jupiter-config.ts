/**
 * Jupiter Configuration
 *
 * Configuration for Jupiter API integration using the free tier
 * - Uses lite-api.jup.ag (free tier, no API key required)
 * - Provides rate limiting and error handling
 * - Configures caching and timeout settings
 */

export interface JupiterConfig {
  // API Configuration
  apiUrl: string;
  quoteApiUrl: string;
  priceApiUrl: string;

  // Connection Settings
  rpcUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';

  // Timeout and Retry Settings
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;

  // Rate Limiting
  maxRequestsPerMinute: number;
  rateLimitWindowMs: number;

  // Caching
  quoteCacheTtlMs: number;
  priceCacheTtlMs: number;
  tokenListCacheTtlMs: number;

  // Slippage Settings
  defaultSlippageBps: number;
  maxSlippageBps: number;

  // Environment
  environment: 'mainnet' | 'devnet' | 'testnet';
  enableLogging: boolean;
}

// Free tier configuration (no API key required)
export const JUPITER_FREE_TIER_CONFIG: JupiterConfig = {
  // Free tier API endpoints
  apiUrl: 'https://lite-api.jup.ag',
  quoteApiUrl: 'https://lite-api.jup.ag/v6/quote',
  priceApiUrl: 'https://lite-api.jup.ag/v4/price',

  // Connection settings
  rpcUrl: process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',

  // Timeout and retry settings
  timeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,

  // Rate limiting (free tier limits)
  maxRequestsPerMinute: 60,
  rateLimitWindowMs: 60000,

  // Caching settings
  quoteCacheTtlMs: 30000, // 30 seconds
  priceCacheTtlMs: 10000, // 10 seconds
  tokenListCacheTtlMs: 300000, // 5 minutes

  // Slippage settings
  defaultSlippageBps: 50, // 0.5%
  maxSlippageBps: 1000, // 10%

  // Environment
  environment: 'mainnet',
  enableLogging: process.env.NODE_ENV === 'development',
};

// Development configuration
export const JUPITER_DEV_CONFIG: JupiterConfig = {
  ...JUPITER_FREE_TIER_CONFIG,
  environment: 'devnet',
  rpcUrl: 'https://api.devnet.solana.com',
  enableLogging: true,
  maxRequestsPerMinute: 120, // Higher limits for development
};

// Production configuration
export const JUPITER_PROD_CONFIG: JupiterConfig = {
  ...JUPITER_FREE_TIER_CONFIG,
  environment: 'mainnet',
  enableLogging: false,
  timeoutMs: 15000, // Faster timeouts for production
};

// Get configuration based on environment
export function getJupiterConfig(): JupiterConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return JUPITER_PROD_CONFIG;
    case 'development':
      return JUPITER_DEV_CONFIG;
    default:
      return JUPITER_FREE_TIER_CONFIG;
  }
}

// Rate limiting utility
export class JupiterRateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private config: JupiterConfig;

  constructor(config: JupiterConfig) {
    this.config = config;
  }

  isRateLimited(endpoint: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindowMs;
    
    const requestData = this.requestCounts.get(endpoint);
    
    if (!requestData || requestData.resetTime < windowStart) {
      this.requestCounts.set(endpoint, { count: 1, resetTime: now });
      return false;
    }

    if (requestData.count >= this.config.maxRequestsPerMinute) {
      return true;
    }

    requestData.count++;
    return false;
  }

  getRemainingRequests(endpoint: string): number {
    const requestData = this.requestCounts.get(endpoint);
    if (!requestData) {
      return this.config.maxRequestsPerMinute;
    }
    
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindowMs;
    
    if (requestData.resetTime < windowStart) {
      return this.config.maxRequestsPerMinute;
    }
    
    return Math.max(0, this.config.maxRequestsPerMinute - requestData.count);
  }

  clearRateLimits(): void {
    this.requestCounts.clear();
  }
}

// Cache utility for Jupiter data
export class JupiterCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private config: JupiterConfig;

  constructor(config: JupiterConfig) {
    this.config = config;
  }

  set(key: string, data: any, ttlMs?: number): void {
    const ttl = ttlMs || this.config.quoteCacheTtlMs;
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.timestamp) {
        this.cache.delete(key);
      }
    }
  }

  getSize(): number {
    return this.cache.size;
  }
}

// Default configuration instance
export const jupiterConfig = getJupiterConfig();
export const jupiterRateLimiter = new JupiterRateLimiter(jupiterConfig);
export const jupiterCache = new JupiterCache(jupiterConfig); 