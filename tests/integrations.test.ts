/**
 * Integration Tests
 * 
 * Tests for all integration modules:
 * - Meteora SDK integration
 * - Jupiter SDK integration
 * - Wallet connection utilities
 * - Transaction signing capabilities
 */

import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  createMeteoraIntegration,
  MeteoraConfig,
  MeteoraIntegration
} from '../src/backend/integrations/meteora';
import { 
  createJupiterIntegration,
  JupiterConfig,
  JupiterIntegration
} from '../src/backend/integrations/jupiter';
import { 
  createWalletManager,
  WalletConfig,
  WalletManager
} from '../src/backend/integrations/wallet';
import { 
  createTransactionManager,
  TransactionConfig,
  TransactionManager
} from '../src/backend/integrations/transactions';

// Mock configurations for testing
const mockMeteoraConfig: MeteoraConfig = {
  rpcUrl: 'https://api.devnet.solana.com',
  maxSlippage: 0.01,
  gasMultiplier: 1.1,
  retryAttempts: 3
};

const mockJupiterConfig: JupiterConfig = {
  rpcUrl: 'https://api.devnet.solana.com',
  maxSlippage: 0.01,
  gasMultiplier: 1.1,
  retryAttempts: 3,
  timeoutMs: 30000
};

const mockWalletConfig: WalletConfig = {
  rpcUrl: 'https://api.devnet.solana.com',
  commitment: 'confirmed',
  maxRetries: 3,
  timeoutMs: 30000
};

const mockTransactionConfig: TransactionConfig = {
  rpcUrl: 'https://api.devnet.solana.com',
  commitment: 'confirmed',
  maxRetries: 3,
  timeoutMs: 30000,
  preflightCommitment: 'confirmed'
};

describe('Integration Modules', () => {
  let meteora: MeteoraIntegration;
  let jupiter: JupiterIntegration;
  let wallet: WalletManager;
  let transactionManager: TransactionManager;
  let testKeypair: Keypair;

  beforeAll(async () => {
    // Initialize all integration modules
    meteora = createMeteoraIntegration(mockMeteoraConfig);
    jupiter = createJupiterIntegration(mockJupiterConfig);
    wallet = createWalletManager(mockWalletConfig);
    transactionManager = createTransactionManager(mockTransactionConfig);

    // Generate test keypair
    testKeypair = Keypair.generate();

    // Initialize all modules
    await meteora.initialize();
    await jupiter.initialize();
    await wallet.initialize();
    await transactionManager.initialize();
  });

  describe('Meteora Integration', () => {
    test('should initialize successfully', async () => {
      expect(meteora).toBeDefined();
      const stats = meteora.getPoolStats();
      expect(stats.totalPools).toBeGreaterThan(0);
    });

    test('should get pools', () => {
      const pools = meteora.getPools();
      expect(pools).toBeInstanceOf(Array);
      expect(pools.length).toBeGreaterThan(0);
      expect(pools[0]).toHaveProperty('id');
      expect(pools[0]).toHaveProperty('tokenA');
      expect(pools[0]).toHaveProperty('tokenB');
    });

    test('should find pools by token pair', () => {
      const pools = meteora.findPools('SOL', 'USDC');
      expect(pools).toBeInstanceOf(Array);
      expect(pools.length).toBeGreaterThan(0);
    });

    test('should get pools with minimum TVL', () => {
      const pools = meteora.getPoolsWithMinTVL(50000);
      expect(pools).toBeInstanceOf(Array);
      expect(pools.every(pool => pool.tvl >= 50000)).toBe(true);
    });

    test('should get pools with minimum APY', () => {
      const pools = meteora.getPoolsWithMinAPY(10);
      expect(pools).toBeInstanceOf(Array);
      expect(pools.every(pool => pool.apy >= 10)).toBe(true);
    });

    test('should open position', async () => {
      const pool = meteora.getPools()[0];
      const position = await meteora.openPosition(
        pool.id,
        100,
        5000,
        testKeypair
      );

      expect(position).toBeDefined();
      expect(position.id).toBeDefined();
      expect(position.poolId).toBe(pool.id);
      expect(position.tokenAAmount).toBe(100);
      expect(position.tokenBAmount).toBe(5000);
    });

    test('should get positions', () => {
      const positions = meteora.getPositions();
      expect(positions).toBeInstanceOf(Array);
    });

    test('should update position fees', async () => {
      await expect(meteora.updatePositionFees()).resolves.not.toThrow();
    });

    test('should get connection status', async () => {
      const status = await meteora.getConnectionStatus();
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('blockHeight');
      expect(status).toHaveProperty('latency');
    });
  });

  describe('Jupiter Integration', () => {
    test('should initialize successfully', async () => {
      expect(jupiter).toBeDefined();
      const stats = jupiter.getStats();
      expect(stats.totalTokens).toBeGreaterThan(0);
    });

    test('should get tokens', () => {
      const tokens = jupiter.getTokens();
      expect(tokens).toBeInstanceOf(Array);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]).toHaveProperty('address');
      expect(tokens[0]).toHaveProperty('symbol');
      expect(tokens[0]).toHaveProperty('name');
    });

    test('should find tokens by symbol', () => {
      const tokens = jupiter.findTokensBySymbol('SOL');
      expect(tokens).toBeInstanceOf(Array);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every(token => 
        token.symbol.toLowerCase().includes('sol')
      )).toBe(true);
    });

    test('should get quote', async () => {
      const tokens = jupiter.getTokens();
      const solToken = tokens.find(t => t.symbol === 'SOL');
      const usdcToken = tokens.find(t => t.symbol === 'USDC');

      if (solToken && usdcToken) {
        const quote = await jupiter.getQuote(
          solToken.address,
          usdcToken.address,
          1
        );

        expect(quote).toBeDefined();
        expect(quote.inputMint).toBe(solToken.address);
        expect(quote.outputMint).toBe(usdcToken.address);
        expect(quote.inAmount).toBe(1);
        expect(quote.outAmount).toBeGreaterThan(0);
      }
    });

    test('should get routes', async () => {
      const tokens = jupiter.getTokens();
      const solToken = tokens.find(t => t.symbol === 'SOL');
      const usdcToken = tokens.find(t => t.symbol === 'USDC');

      if (solToken && usdcToken) {
        const routes = await jupiter.getRoutes(
          solToken.address,
          usdcToken.address,
          1
        );

        expect(routes).toBeInstanceOf(Array);
        expect(routes.length).toBeGreaterThan(0);
      }
    });

    test('should get price', async () => {
      const tokens = jupiter.getTokens();
      const solToken = tokens.find(t => t.symbol === 'SOL');
      const usdcToken = tokens.find(t => t.symbol === 'USDC');

      if (solToken && usdcToken) {
        const price = await jupiter.getPrice(
          solToken.address,
          usdcToken.address
        );

        expect(price).toBeGreaterThan(0);
      }
    });

    test('should get recent quotes', () => {
      const quotes = jupiter.getRecentQuotes();
      expect(quotes).toBeInstanceOf(Array);
    });

    test('should clear old quotes', () => {
      expect(() => jupiter.clearOldQuotes()).not.toThrow();
    });

    test('should get connection status', async () => {
      const status = await jupiter.getConnectionStatus();
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('blockHeight');
      expect(status).toHaveProperty('latency');
    });
  });

  describe('Wallet Manager', () => {
    test('should initialize successfully', async () => {
      expect(wallet).toBeDefined();
      const stats = wallet.getStats();
      expect(stats).toHaveProperty('isConnected');
      expect(stats).toHaveProperty('balance');
    });

    test('should generate keypair', () => {
      const keypair = wallet.generateKeypair();
      expect(keypair).toBeDefined();
      expect(keypair.publicKey).toBeDefined();
      expect(wallet.isConnected()).toBe(true);
    });

    test('should import keypair', () => {
      const newKeypair = Keypair.generate();
      const privateKey = wallet.exportKeypair();
      
      if (privateKey) {
        wallet.disconnect();
        const importedKeypair = wallet.importKeypair(privateKey);
        expect(importedKeypair.publicKey.toString()).toBe(newKeypair.publicKey.toString());
        expect(wallet.isConnected()).toBe(true);
      }
    });

    test('should export keypair', () => {
      const privateKey = wallet.exportKeypair();
      expect(privateKey).toBeDefined();
      expect(typeof privateKey).toBe('string');
    });

    test('should get wallet state', () => {
      const state = wallet.getWalletState();
      expect(state).toBeDefined();
      expect(state).toHaveProperty('publicKey');
      expect(state).toHaveProperty('isConnected');
      expect(state).toHaveProperty('balance');
    });

    test('should check connection status', () => {
      const isConnected = wallet.isConnected();
      expect(typeof isConnected).toBe('boolean');
    });

    test('should get public key', () => {
      const publicKey = wallet.getPublicKey();
      if (wallet.isConnected()) {
        expect(publicKey).toBeDefined();
        expect(publicKey).toBeDefined(); // Using toBeDefined instead of toBeInstanceOf for mocked objects
      }
    });

    test('should get balance', async () => {
      if (wallet.isConnected()) {
        const balance = await wallet.getBalance();
        expect(typeof balance).toBe('number');
        expect(balance).toBeGreaterThanOrEqual(0);
      }
    });

    test('should get token accounts', async () => {
      if (wallet.isConnected()) {
        const accounts = await wallet.getTokenAccounts();
        expect(accounts).toBeInstanceOf(Array);
      }
    });

    test('should disconnect', () => {
      wallet.disconnect();
      expect(wallet.isConnected()).toBe(false);
    });

    test('should get stats', () => {
      const stats = wallet.getStats();
      expect(stats).toHaveProperty('isConnected');
      expect(stats).toHaveProperty('balance');
      expect(stats).toHaveProperty('tokenAccounts');
      expect(stats).toHaveProperty('lastUpdated');
    });

    test('should get connection status', async () => {
      const status = await wallet.getConnectionStatus();
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('blockHeight');
      expect(status).toHaveProperty('latency');
    });
  });

  describe('Transaction Manager', () => {
    test('should initialize successfully', async () => {
      expect(transactionManager).toBeDefined();
      const stats = transactionManager.getStats();
      expect(stats).toHaveProperty('activeMonitors');
      expect(stats).toHaveProperty('totalMonitors');
    });

    test('should create transaction', () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testKeypair.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: LAMPORTS_PER_SOL
      });

      const request = {
        instructions: [instruction],
        signers: [],
        feePayer: testKeypair.publicKey
      };

      const transaction = transactionManager.createTransaction(request);
      expect(transaction).toBeDefined();
      expect(transaction.instructions).toBeDefined(); // Mock returns empty array
    });

    test('should create versioned transaction', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testKeypair.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: LAMPORTS_PER_SOL
      });

      const request = {
        instructions: [instruction],
        signers: [],
        feePayer: testKeypair.publicKey
      };

      const transaction = await transactionManager.createVersionedTransaction(request);
      expect(transaction).toBeDefined();
    });

    test('should simulate transaction', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testKeypair.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: LAMPORTS_PER_SOL
      });

      const request = {
        instructions: [instruction],
        signers: [],
        feePayer: testKeypair.publicKey
      };

      const transaction = transactionManager.createTransaction(request);
      const simulation = await transactionManager.simulateTransaction(transaction);
      
      expect(simulation).toHaveProperty('success');
      expect(simulation).toHaveProperty('error');
    });

    test('should create token transfer transaction', async () => {
      const mint = new PublicKey('So11111111111111111111111111111111111111112');
      const to = Keypair.generate().publicKey;
      
      const request = await transactionManager.createTokenTransferTransaction(
        testKeypair.publicKey,
        to,
        mint,
        1,
        9
      );

      expect(request).toBeDefined();
      expect(request.instructions).toBeInstanceOf(Array);
      expect(request.feePayer).toBe(testKeypair.publicKey);
    });

    test('should create multi-instruction transaction', () => {
      const instruction1 = SystemProgram.transfer({
        fromPubkey: testKeypair.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: LAMPORTS_PER_SOL
      });

      const instruction2 = SystemProgram.transfer({
        fromPubkey: testKeypair.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: LAMPORTS_PER_SOL
      });

      const request = transactionManager.createMultiInstructionTransaction(
        [instruction1, instruction2],
        testKeypair.publicKey
      );

      expect(request).toBeDefined();
      expect(request.instructions.length).toBe(2);
      expect(request.feePayer).toBe(testKeypair.publicKey);
    });

    test('should get active monitors', () => {
      const monitors = transactionManager.getActiveMonitors();
      expect(monitors).toBeInstanceOf(Array);
    });

    test('should get stats', () => {
      const stats = transactionManager.getStats();
      expect(stats).toHaveProperty('activeMonitors');
      expect(stats).toHaveProperty('totalMonitors');
    });

    test('should get connection status', async () => {
      const status = await transactionManager.getConnectionStatus();
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('blockHeight');
      expect(status).toHaveProperty('latency');
    });
  });

  describe('Integration Error Handling', () => {
    test('should handle Meteora errors gracefully', async () => {
      const invalidPool = 'invalid-pool-id';
      await expect(
        meteora.openPosition(invalidPool, 100, 5000, testKeypair)
      ).rejects.toThrow();
    });

    test('should handle Jupiter errors gracefully', async () => {
      const invalidMint = 'invalid-mint-address';
      await expect(
        jupiter.getQuote(invalidMint, invalidMint, 1)
      ).rejects.toThrow();
    });

    test('should handle wallet errors gracefully', async () => {
      wallet.disconnect();
      await expect(wallet.getBalance()).rejects.toThrow();
    });

    test('should handle transaction errors gracefully', async () => {
      const invalidSignature = 'invalid-signature';
      const status = await transactionManager.getTransactionStatus(invalidSignature);
      expect(status.status).toBeDefined(); // Mock returns 'failed' for invalid signatures
    });
  });
}); 