/**
 * Jupiter Integration Tests
 * 
 * Comprehensive test suite for Jupiter API integration:
 * - Free tier API endpoints
 * - Quote fetching and caching
 * - Token list loading
 * - Rate limiting
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { JupiterIntegration } from '../src/backend/integrations/jupiter';
import { jupiterConfig, jupiterRateLimiter, jupiterCache } from '../src/backend/config/jupiter-config';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Solana Web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    sendTransaction: jest.fn().mockResolvedValue('test-signature'),
    confirmTransaction: jest.fn().mockResolvedValue({
      value: { err: null, confirmations: 32 },
      context: { blockTime: 1234567890 }
    }),
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({ toString: () => key })),
  Keypair: jest.fn().mockImplementation(() => ({
    publicKey: { toString: () => 'test-public-key' },
    secretKey: new Uint8Array(64),
  })),
  Transaction: {
    from: jest.fn().mockImplementation(() => ({
      sign: jest.fn(),
    })),
  },
}));

describe('Jupiter Integration', () => {
  let jupiterIntegration: JupiterIntegration;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Clear cache and rate limiter
    jupiterCache.clear();
    jupiterRateLimiter.clearRateLimits();
    
    // Create new instance
    jupiterIntegration = new JupiterIntegration({
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      commitment: 'confirmed',
      timeoutMs: 30000,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      // Mock token list response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          tokens: [
            {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
              logoURI: 'https://solana.com/logo.png',
            },
            {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
              logoURI: 'https://usdc.com/logo.png',
            },
          ],
        },
      });

      await jupiterIntegration.initialize();

      expect(jupiterIntegration.isConnected()).toBe(true);
      expect(jupiterIntegration.getTokens()).toHaveLength(2);
    });

    it('should handle initialization errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(jupiterIntegration.initialize()).rejects.toThrow('Failed to initialize Jupiter');
    });
  });

  describe('Token Management', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          tokens: [
            {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
            },
            {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
          ],
        },
      });

      await jupiterIntegration.initialize();
    });

    it('should get all tokens', () => {
      const tokens = jupiterIntegration.getTokens();
      expect(tokens).toHaveLength(2);
      expect(tokens[0].symbol).toBe('SOL');
      expect(tokens[1].symbol).toBe('USDC');
    });

    it('should get token by address', () => {
      const solToken = jupiterIntegration.getToken('So11111111111111111111111111111111111111112');
      expect(solToken).toBeDefined();
      expect(solToken?.symbol).toBe('SOL');
    });

    it('should find tokens by symbol', () => {
      const solTokens = jupiterIntegration.findTokensBySymbol('SOL');
      expect(solTokens).toHaveLength(1);
      expect(solTokens[0].symbol).toBe('SOL');
    });

    it('should return undefined for non-existent token', () => {
      const token = jupiterIntegration.getToken('non-existent-token');
      expect(token).toBeUndefined();
    });
  });

  describe('Quote Fetching', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          tokens: [
            {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
            },
            {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
          ],
        },
      });

      await jupiterIntegration.initialize();
    });

    it('should get quote successfully', async () => {
      // Mock quote response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            inAmount: '1000000000',
            outAmount: '98000000',
            otherAmountThreshold: '97000000',
            swapMode: 'ExactIn',
            priceImpactPct: 0.5,
            routePlan: [
              {
                swapInfo: {
                  ammLabel: 'Raydium',
                  inputMint: 'So11111111111111111111111111111111111111112',
                  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                },
              },
            ],
            contextSlot: 123456,
            timeTaken: 100,
          },
        },
      });

      const quote = await jupiterIntegration.getQuote(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        1000000000,
        50
      );

      expect(quote.inputMint).toBe('So11111111111111111111111111111111111111112');
      expect(quote.outputMint).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      expect(quote.inAmount).toBe(1000000000);
      expect(quote.outAmount).toBe(98000000);
      expect(quote.slippageBps).toBe(50);
    });

    it('should handle quote errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      await expect(
        jupiterIntegration.getQuote(
          'So11111111111111111111111111111111111111112',
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          1000000000
        )
      ).rejects.toThrow('Failed to get quote');
    });

    it('should validate token addresses', async () => {
      await expect(
        jupiterIntegration.getQuote(
          'invalid-token',
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          1000000000
        )
      ).rejects.toThrow('Invalid token addresses');
    });
  });

  describe('Price Fetching', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          tokens: [
            {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
            },
          ],
        },
      });

      await jupiterIntegration.initialize();
    });

    it('should get token price successfully', async () => {
      // Mock price response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            'So11111111111111111111111111111111111111112': {
              price: 98.45,
            },
          },
        },
      });

      const price = await jupiterIntegration.getTokenPrice('So11111111111111111111111111111111111111112');
      expect(price).toBe(98.45);
    });

    it('should handle price errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Price API error'));

      await expect(
        jupiterIntegration.getTokenPrice('So11111111111111111111111111111111111111112')
      ).rejects.toThrow('Failed to get price');
    });
  });

  describe('Route Fetching', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          tokens: [
            {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
            },
            {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
          ],
        },
      });

      await jupiterIntegration.initialize();
    });

    it('should get routes successfully', async () => {
      // Mock routes response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            routes: [
              {
                id: 'route-1',
                inAmount: '1000000000',
                outAmount: '98000000',
                priceImpactPct: 0.5,
                marketInfos: [],
                amount: 1000000000,
                slippageBps: 50,
                otherAmountThreshold: '97000000',
                swapMode: 'ExactIn',
              },
            ],
          },
        },
      });

      const routes = await jupiterIntegration.getRoutes(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        1000000000
      );

      expect(routes).toHaveLength(1);
      expect(routes[0].id).toBe('route-1');
    });

    it('should handle route errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Route API error'));

      await expect(
        jupiterIntegration.getRoutes(
          'So11111111111111111111111111111111111111112',
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          1000000000
        )
      ).rejects.toThrow('Failed to get routes');
    });
  });

  describe('Caching', () => {
    beforeEach(async () => {
      // Mock successful initialization with tokens
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          tokens: [
            {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
            },
            {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
          ],
        },
      });

      await jupiterIntegration.initialize();
    });

    it('should cache quotes', async () => {
      // Mock quote response
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            inAmount: '1000000000',
            outAmount: '98000000',
            otherAmountThreshold: '97000000',
            swapMode: 'ExactIn',
            priceImpactPct: 0.5,
            routePlan: [],
            contextSlot: 123456,
            timeTaken: 100,
          },
        },
      });

      // First call should hit the API
      await jupiterIntegration.getQuote(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        1000000000
      );

      // Second call should use cache
      await jupiterIntegration.getQuote(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        1000000000
      );

      // Should have made two API calls (one for tokens, one for quote)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          tokens: [],
        },
      });

      await jupiterIntegration.initialize();
    });

    it('should respect rate limits', async () => {
      // Mock quote response
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            inAmount: '1000000000',
            outAmount: '98000000',
            otherAmountThreshold: '97000000',
            swapMode: 'ExactIn',
            priceImpactPct: 0.5,
            routePlan: [],
            contextSlot: 123456,
            timeTaken: 100,
          },
        },
      });

      // Make multiple requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 70; i++) {
        promises.push(
          jupiterIntegration.getQuote(
            'So11111111111111111111111111111111111111112',
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            1000000000
          )
        );
      }

      // Some should fail due to rate limiting
      const results = await Promise.allSettled(promises);
      const rejected = results.filter(result => result.status === 'rejected');
      expect(rejected.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          tokens: [
            {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
            },
          ],
        },
      });

      await jupiterIntegration.initialize();
    });

    it('should return correct stats', () => {
      const stats = jupiterIntegration.getStats();
      
      expect(stats.tokensLoaded).toBe(1);
      expect(stats.recentQuotes).toBe(0);
      expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
      expect(stats.rateLimitRemaining).toBeGreaterThan(0);
      expect(stats.lastQuoteTime).toBeNull();
    });

    it('should return connection status', () => {
      const status = jupiterIntegration.getConnectionStatus();
      
      expect(status.connected).toBe(true);
      expect(status.lastCheck).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(jupiterIntegration.initialize()).rejects.toThrow('Failed to initialize Jupiter');
    });

    it('should handle invalid API responses', async () => {
      // Mock successful initialization
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          tokens: [
            {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
            },
            {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
          ],
        },
      });

      await jupiterIntegration.initialize();

      // Mock invalid quote response
      mockedAxios.get.mockResolvedValueOnce({
        data: null, // Invalid response
      });

      await expect(
        jupiterIntegration.getQuote(
          'So11111111111111111111111111111111111111112',
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          1000000000
        )
      ).rejects.toThrow('Invalid response from Jupiter API');
    });
  });
}); 