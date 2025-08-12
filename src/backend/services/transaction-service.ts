/**
 * Transaction Service
 * 
 * Handles all transaction-related operations:
 * - Transaction building utilities
 * - Signing workflow management
 * - Transaction validation
 * - Error handling and retry logic
 * - Transaction monitoring and confirmation
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
  sendAndConfirmTransaction,
  ConfirmOptions,
  Commitment,
} from '@solana/web3.js';
import { walletSecurity } from '../utils/wallet-security';

// Transaction configuration
export interface TransactionConfig {
  connection: Connection;
  commitment: Commitment;
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
}

// Transaction request
export interface TransactionRequest {
  instructions: TransactionInstruction[];
  signers: Keypair[];
  feePayer: PublicKey;
  recentBlockhash?: string;
  expectedAmount?: number;
  expectedRecipient?: string;
}

// Transaction result
export interface TransactionResult {
  signature: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  confirmations?: number;
  timestamp: Date;
  fee?: number;
  blockTime?: number;
}

// Transaction monitoring
export interface TransactionMonitor {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  lastChecked: Date;
  retryCount: number;
}

/**
 * Transaction Service
 * 
 * Provides comprehensive transaction management
 */
export class TransactionService {
  private config: TransactionConfig;
  private monitors: Map<string, TransactionMonitor> = new Map();

  constructor(config: TransactionConfig) {
    this.config = config;
  }

  /**
   * Build a transaction
   */
  buildTransaction(request: TransactionRequest): Transaction {
    try {
      const transaction = new Transaction();

      // Add instructions
      request.instructions.forEach(instruction => {
        transaction.add(instruction);
      });

      // Add signers
      request.signers.forEach(signer => {
        transaction.partialSign(signer);
      });

      // Set fee payer
      transaction.feePayer = request.feePayer;

      // Set recent blockhash if provided
      if (request.recentBlockhash) {
        transaction.recentBlockhash = request.recentBlockhash;
      }

      return transaction;
    } catch (error) {
      throw new Error(`Failed to build transaction: ${error}`);
    }
  }

  /**
   * Validate transaction before sending
   */
  validateTransaction(
    transaction: Transaction,
    walletAddress: string,
    expectedAmount?: number,
    expectedRecipient?: string
  ): { isValid: boolean; warnings: string[] } {
    try {
      // Use wallet security validation
      const validation = walletSecurity.validateTransaction(
        transaction,
        walletAddress,
        expectedAmount,
        expectedRecipient
      );

      if (!validation.isValid) {
        walletSecurity.recordFailedAttempt(walletAddress, 'Transaction validation failed');
      }

      return {
        isValid: validation.isValid,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        warnings: [`Validation error: ${error}`],
      };
    }
  }

  /**
   * Send and confirm transaction
   */
  async sendAndConfirmTransaction(
    transaction: Transaction,
    walletAddress: string,
    retryCount: number = 0
  ): Promise<TransactionResult> {
    try {
      // Check rate limiting
      if (walletSecurity.isRateLimited(walletAddress)) {
        throw new Error('Rate limit exceeded');
      }

      // Validate transaction
      const validation = this.validateTransaction(transaction, walletAddress);
      if (!validation.isValid) {
        throw new Error(`Transaction validation failed: ${validation.warnings.join(', ')}`);
      }

      // Send transaction
      const signature = await this.config.connection.sendTransaction(transaction, {
        skipPreflight: false,
        preflightCommitment: this.config.commitment,
        maxRetries: this.config.maxRetries,
      });

      // Start monitoring
      this.startMonitoring(signature);

      // Wait for confirmation
      const confirmation = await this.config.connection.confirmTransaction(
        signature,
        this.config.commitment
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      // Record successful transaction
      walletSecurity.recordSuccessfulTransaction(
        walletAddress,
        signature,
        0, // Amount will be determined from transaction
        '', // Recipient will be determined from transaction
      );

      const result: TransactionResult = {
        signature,
        status: 'success',
        timestamp: new Date(),
        confirmations: confirmation.value.confirmations || 0,
        blockTime: confirmation.context.blockTime,
      };

      console.log(`Transaction successful: ${signature}`);
      return result;

    } catch (error) {
      console.error(`Transaction failed: ${error}`);

      // Record failed attempt
      walletSecurity.recordFailedAttempt(walletAddress, `Transaction failed: ${error}`);

      // Retry logic
      if (retryCount < this.config.maxRetries) {
        console.log(`Retrying transaction (${retryCount + 1}/${this.config.maxRetries})`);
        await this.delay(this.config.retryDelay);
        return this.sendAndConfirmTransaction(transaction, walletAddress, retryCount + 1);
      }

      return {
        signature: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send transaction without confirmation
   */
  async sendTransaction(
    transaction: Transaction,
    walletAddress: string
  ): Promise<TransactionResult> {
    try {
      // Check rate limiting
      if (walletSecurity.isRateLimited(walletAddress)) {
        throw new Error('Rate limit exceeded');
      }

      // Validate transaction
      const validation = this.validateTransaction(transaction, walletAddress);
      if (!validation.isValid) {
        throw new Error(`Transaction validation failed: ${validation.warnings.join(', ')}`);
      }

      // Send transaction
      const signature = await this.config.connection.sendTransaction(transaction, {
        skipPreflight: false,
        preflightCommitment: this.config.commitment,
        maxRetries: this.config.maxRetries,
      });

      // Start monitoring
      this.startMonitoring(signature);

      return {
        signature,
        status: 'pending',
        timestamp: new Date(),
      };

    } catch (error) {
      console.error(`Transaction failed: ${error}`);

      // Record failed attempt
      walletSecurity.recordFailedAttempt(walletAddress, `Transaction failed: ${error}`);

      return {
        signature: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Start monitoring a transaction
   */
  startMonitoring(signature: string): void {
    const monitor: TransactionMonitor = {
      signature,
      status: 'pending',
      confirmations: 0,
      lastChecked: new Date(),
      retryCount: 0,
    };

    this.monitors.set(signature, monitor);

    // Start monitoring in background
    this.monitorTransaction(signature);
  }

  /**
   * Monitor transaction status
   */
  private async monitorTransaction(signature: string): Promise<void> {
    const monitor = this.monitors.get(signature);
    if (!monitor) return;

    try {
      // Get transaction status
      const status = await this.config.connection.getSignatureStatus(signature);

      if (status.value) {
        monitor.status = status.value.confirmationStatus || 'pending';
        monitor.confirmations = status.value.confirmations || 0;
        monitor.lastChecked = new Date();

        // Update monitor
        this.monitors.set(signature, monitor);

        // If confirmed, stop monitoring
        if (monitor.status === 'confirmed') {
          console.log(`Transaction confirmed: ${signature}`);
          return;
        }

        // If failed, stop monitoring
        if (status.value.err) {
          monitor.status = 'failed';
          console.error(`Transaction failed: ${signature}`, status.value.err);
          return;
        }
      }

      // Continue monitoring if still pending
      if (monitor.status === 'pending' && monitor.retryCount < 10) {
        monitor.retryCount++;
        setTimeout(() => this.monitorTransaction(signature), 2000);
      }

    } catch (error) {
      console.error(`Error monitoring transaction ${signature}:`, error);
      
      // Retry monitoring
      if (monitor.retryCount < 5) {
        monitor.retryCount++;
        setTimeout(() => this.monitorTransaction(signature), 5000);
      }
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string): Promise<TransactionResult | null> {
    try {
      const status = await this.config.connection.getSignatureStatus(signature);
      
      if (!status.value) {
        return null;
      }

      return {
        signature,
        status: status.value.err ? 'failed' : (status.value.confirmationStatus || 'pending'),
        error: status.value.err ? JSON.stringify(status.value.err) : undefined,
        confirmations: status.value.confirmations || 0,
        timestamp: new Date(),
      };

    } catch (error) {
      console.error(`Error getting transaction status: ${error}`);
      return null;
    }
  }

  /**
   * Get recent blockhash
   */
  async getRecentBlockhash(): Promise<string> {
    try {
      const { blockhash } = await this.config.connection.getLatestBlockhash();
      return blockhash;
    } catch (error) {
      throw new Error(`Failed to get recent blockhash: ${error}`);
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateTransactionFee(
    instructions: TransactionInstruction[],
    signers: Keypair[]
  ): Promise<number> {
    try {
      const transaction = new Transaction();
      instructions.forEach(instruction => transaction.add(instruction));
      
      const { blockhash } = await this.config.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      const fee = await this.config.connection.getFeeForMessage(
        transaction.compileMessage(),
        this.config.commitment
      );

      return fee.value || 0;
    } catch (error) {
      console.error(`Error estimating transaction fee: ${error}`);
      return 5000; // Default fee
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    walletAddress: string,
    limit: number = 20
  ): Promise<TransactionResult[]> {
    try {
      const signatures = await this.config.connection.getSignaturesForAddress(
        new PublicKey(walletAddress),
        { limit }
      );

      const transactions: TransactionResult[] = [];

      for (const sigInfo of signatures) {
        const status = await this.getTransactionStatus(sigInfo.signature);
        if (status) {
          transactions.push(status);
        }
      }

      return transactions;
    } catch (error) {
      console.error(`Error getting transaction history: ${error}`);
      return [];
    }
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(signature: string): Promise<boolean> {
    try {
      // Note: Solana doesn't support direct transaction cancellation
      // This would typically involve sending a replacement transaction
      console.log(`Cannot cancel transaction: ${signature}`);
      return false;
    } catch (error) {
      console.error(`Error canceling transaction: ${error}`);
      return false;
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(signature: string): TransactionMonitor | null {
    return this.monitors.get(signature) || null;
  }

  /**
   * Get all active monitors
   */
  getActiveMonitors(): TransactionMonitor[] {
    return Array.from(this.monitors.values());
  }

  /**
   * Clear old monitors
   */
  clearOldMonitors(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;
    
    for (const [signature, monitor] of this.monitors.entries()) {
      if (monitor.lastChecked.getTime() < cutoffTime) {
        this.monitors.delete(signature);
      }
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default transaction configuration
export const DEFAULT_TRANSACTION_CONFIG: TransactionConfig = {
  connection: new Connection(process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'),
  commitment: 'confirmed',
  maxRetries: 3,
  retryDelay: 1000,
  timeoutMs: 30000,
};

// Create default instance
export const transactionService = new TransactionService(DEFAULT_TRANSACTION_CONFIG); 