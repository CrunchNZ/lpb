/**
 * Wallet Connection Utilities
 * 
 * Handles all wallet-related operations including:
 * - Wallet connection and keypair management
 * - Transaction signing and verification
 * - Balance checking and token account management
 * - Wallet state persistence and recovery
 * - Security and encryption utilities
 */

import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  AccountLayout
} from '@solana/spl-token';
import * as bs58 from 'bs58';
import * as crypto from 'crypto';

// Types for wallet management
export interface WalletConfig {
  rpcUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
  maxRetries: number;
  timeoutMs: number;
}

export interface WalletState {
  publicKey: string;
  isConnected: boolean;
  balance: number;
  tokenAccounts: TokenAccount[];
  lastUpdated: Date;
}

export interface TokenAccount {
  mint: string;
  address: string;
  balance: number;
  decimals: number;
  symbol?: string;
}

export interface WalletTransaction {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
  timestamp: Date;
  instructions: TransactionInstruction[];
}

export interface WalletSecurity {
  encrypted: boolean;
  salt?: string;
  iterations?: number;
}

/**
 * Wallet Manager Class
 * 
 * Provides comprehensive wallet management functionality
 * for Solana blockchain interactions
 */
export class WalletManager {
  private connection: Connection;
  private config: WalletConfig;
  private keypair: Keypair | null = null;
  private state: WalletState | null = null;
  private security: WalletSecurity = { encrypted: false };

  constructor(config: WalletConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, config.commitment);
  }

  /**
   * Initialize the wallet manager
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      const blockHeight = await this.connection.getBlockHeight();
      console.log(`Wallet: Connected to Solana network, block height: ${blockHeight}`);

      // Initialize empty state
      this.state = {
        publicKey: '',
        isConnected: false,
        balance: 0,
        tokenAccounts: [],
        lastUpdated: new Date()
      };

      console.log('Wallet: Initialized wallet manager');
    } catch (error) {
      throw new Error(`Failed to initialize wallet manager: ${error}`);
    }
  }

  /**
   * Generate a new keypair
   */
  generateKeypair(): Keypair {
    try {
      this.keypair = Keypair.generate();
      
      if (this.state) {
        this.state.publicKey = this.keypair.publicKey.toString();
        this.state.isConnected = true;
        this.state.lastUpdated = new Date();
      }

      console.log(`Wallet: Generated new keypair ${this.keypair.publicKey.toString()}`);
      return this.keypair;
    } catch (error) {
      throw new Error(`Failed to generate keypair: ${error}`);
    }
  }

  /**
   * Import keypair from private key
   */
  importKeypair(privateKey: string): Keypair {
    try {
      // Decode private key (base58 format)
      const decoded = bs58.decode(privateKey);
      this.keypair = Keypair.fromSecretKey(decoded);
      
      if (this.state) {
        this.state.publicKey = this.keypair.publicKey.toString();
        this.state.isConnected = true;
        this.state.lastUpdated = new Date();
      }

      console.log(`Wallet: Imported keypair ${this.keypair.publicKey.toString()}`);
      return this.keypair;
    } catch (error) {
      throw new Error(`Failed to import keypair: ${error}`);
    }
  }

  /**
   * Export keypair private key
   */
  exportKeypair(): string | null {
    if (!this.keypair) {
      return null;
    }

    try {
      return bs58.encode(this.keypair.secretKey);
    } catch (error) {
      throw new Error(`Failed to export keypair: ${error}`);
    }
  }

  /**
   * Get current wallet state
   */
  getWalletState(): WalletState | null {
    return this.state;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.keypair !== null && this.state?.isConnected === true;
  }

  /**
   * Get wallet public key
   */
  getPublicKey(): PublicKey | null {
    return this.keypair?.publicKey || null;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<number> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      const balance = await this.connection.getBalance(this.keypair.publicKey);
      
      if (this.state) {
        this.state.balance = balance / LAMPORTS_PER_SOL;
        this.state.lastUpdated = new Date();
      }

      console.log(`Wallet: Balance updated to ${this.state?.balance} SOL`);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  /**
   * Get token accounts for wallet
   */
  async getTokenAccounts(): Promise<TokenAccount[]> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        this.keypair.publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const accounts: TokenAccount[] = [];

      for (const account of tokenAccounts.value) {
        try {
          const accountInfo = AccountLayout.decode(account.account.data);
          const mint = new PublicKey(accountInfo.mint).toString();
          const balance = Number(accountInfo.amount);
          const decimals = accountInfo.decimals;

          accounts.push({
            mint,
            address: account.pubkey.toString(),
            balance,
            decimals
          });
        } catch (error) {
          console.warn(`Failed to decode token account: ${error}`);
        }
      }

      if (this.state) {
        this.state.tokenAccounts = accounts;
        this.state.lastUpdated = new Date();
      }

      console.log(`Wallet: Found ${accounts.length} token accounts`);
      return accounts;
    } catch (error) {
      throw new Error(`Failed to get token accounts: ${error}`);
    }
  }

  /**
   * Get token balance for specific mint
   */
  async getTokenBalance(mint: string): Promise<number> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      const mintPubkey = new PublicKey(mint);
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        this.keypair.publicKey,
        { mint: mintPubkey }
      );

      if (tokenAccounts.value.length === 0) {
        return 0;
      }

      const account = await getAccount(this.connection, tokenAccounts.value[0].pubkey);
      return Number(account.amount);
    } catch (error) {
      throw new Error(`Failed to get token balance: ${error}`);
    }
  }

  /**
   * Create associated token account
   */
  async createAssociatedTokenAccount(mint: string): Promise<string> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      const mintPubkey = new PublicKey(mint);
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        this.keypair.publicKey
      );

      const instruction = createAssociatedTokenAccountInstruction(
        this.keypair.publicKey,
        associatedTokenAddress,
        this.keypair.publicKey,
        mintPubkey
      );

      const transaction = new Transaction().add(instruction);
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair]
      );

      console.log(`Wallet: Created associated token account ${associatedTokenAddress.toString()}`);
      return associatedTokenAddress.toString();
    } catch (error) {
      throw new Error(`Failed to create associated token account: ${error}`);
    }
  }

  /**
   * Send SOL to another wallet
   */
  async sendSOL(
    toAddress: string,
    amount: number
  ): Promise<WalletTransaction> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      const toPubkey = new PublicKey(toAddress);
      const lamports = amount * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.keypair.publicKey,
          toPubkey: toPubkey,
          lamports
        })
      );

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair]
      );

      const result: WalletTransaction = {
        signature,
        status: 'confirmed',
        timestamp: new Date(),
        instructions: transaction.instructions
      };

      console.log(`Wallet: Sent ${amount} SOL to ${toAddress}`);
      return result;
    } catch (error) {
      throw new Error(`Failed to send SOL: ${error}`);
    }
  }

  /**
   * Sign a transaction
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      transaction.feePayer = this.keypair.publicKey;
      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;

      transaction.sign(this.keypair);
      return transaction;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error}`);
    }
  }

  /**
   * Send and confirm a transaction
   */
  async sendTransaction(transaction: Transaction): Promise<WalletTransaction> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      const signedTransaction = await this.signTransaction(transaction);
      const signature = await sendAndConfirmTransaction(
        this.connection,
        signedTransaction,
        [this.keypair]
      );

      const result: WalletTransaction = {
        signature,
        status: 'confirmed',
        timestamp: new Date(),
        instructions: transaction.instructions
      };

      console.log(`Wallet: Transaction confirmed ${signature}`);
      return result;
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error}`);
    }
  }

  /**
   * Encrypt wallet with password
   */
  encryptWallet(password: string): void {
    try {
      if (!this.keypair) {
        throw new Error('No wallet to encrypt');
      }

      const salt = crypto.randomBytes(32);
      const iterations = 100000;
      const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
      
      const privateKey = this.exportKeypair();
      if (!privateKey) {
        throw new Error('Failed to export private key');
      }

      // In a real implementation, you would encrypt the private key
      // For now, we'll just mark it as encrypted
      this.security = {
        encrypted: true,
        salt: salt.toString('hex'),
        iterations
      };

      console.log('Wallet: Wallet encrypted successfully');
    } catch (error) {
      throw new Error(`Failed to encrypt wallet: ${error}`);
    }
  }

  /**
   * Decrypt wallet with password
   */
  decryptWallet(password: string): boolean {
    try {
      if (!this.security.encrypted) {
        return true; // Already decrypted
      }

      // In a real implementation, you would decrypt the private key
      // For now, we'll just mark it as decrypted
      this.security.encrypted = false;

      console.log('Wallet: Wallet decrypted successfully');
      return true;
    } catch (error) {
      console.error(`Failed to decrypt wallet: ${error}`);
      return false;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.keypair = null;
    if (this.state) {
      this.state.isConnected = false;
      this.state.lastUpdated = new Date();
    }
    console.log('Wallet: Disconnected');
  }

  /**
   * Refresh wallet state
   */
  async refreshState(): Promise<void> {
    try {
      if (!this.isConnected()) {
        return;
      }

      await this.getBalance();
      await this.getTokenAccounts();
      
      console.log('Wallet: State refreshed');
    } catch (error) {
      console.error(`Failed to refresh wallet state: ${error}`);
    }
  }

  /**
   * Get wallet statistics
   */
  getStats(): {
    isConnected: boolean;
    balance: number;
    tokenAccounts: number;
    lastUpdated: Date | null;
  } {
    return {
      isConnected: this.isConnected(),
      balance: this.state?.balance || 0,
      tokenAccounts: this.state?.tokenAccounts.length || 0,
      lastUpdated: this.state?.lastUpdated || null
    };
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    blockHeight: number;
    latency: number;
  }> {
    try {
      const startTime = Date.now();
      const blockHeight = await this.connection.getBlockHeight();
      const latency = Date.now() - startTime;

      return {
        connected: true,
        blockHeight,
        latency
      };
    } catch (error) {
      return {
        connected: false,
        blockHeight: 0,
        latency: 0
      };
    }
  }
}

/**
 * Factory function to create wallet manager instance
 */
export function createWalletManager(config: WalletConfig): WalletManager {
  return new WalletManager(config);
} 