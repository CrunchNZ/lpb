/**
 * Transaction Signing Capabilities
 *
 * Handles all transaction-related operations including:
 * - Complex transaction creation and assembly
 * - Multi-signature transaction support
 * - Transaction simulation and validation
 * - Retry mechanisms and error handling
 * - Transaction monitoring and confirmation
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  sendAndConfirmTransaction,
  SimulatedTransactionResponse,
  Commitment,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

// Types for transaction management
export interface TransactionConfig {
  rpcUrl: string;
  commitment: Commitment;
  maxRetries: number;
  timeoutMs: number;
  preflightCommitment: Commitment;
}

export interface TransactionRequest {
  instructions: TransactionInstruction[];
  signers: Keypair[];
  feePayer: PublicKey;
  recentBlockhash?: string;
}

export interface TransactionResult {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
  timestamp: Date;
  slot: number;
  confirmationTime?: number;
}

export interface TransactionSimulation {
  success: boolean;
  error?: string;
  logs?: string[];
  unitsConsumed?: number;
  accounts?: any[];
}

export interface TransactionMonitor {
  signature: string;
  status: 'monitoring' | 'confirmed' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  startTime: Date;
  lastCheck: Date;
}

/**
 * Transaction Manager Class
 *
 * Provides comprehensive transaction management functionality
 * for Solana blockchain interactions
 */
export class TransactionManager {
  private connection: Connection;
  private config: TransactionConfig;
  private monitors: Map<string, TransactionMonitor> = new Map();

  constructor(config: TransactionConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, config.commitment);
  }

  /**
   * Initialize the transaction manager
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      const blockHeight = await this.connection.getBlockHeight();
      console.log(`Transactions: Connected to Solana network, block height: ${blockHeight}`);

      console.log('Transactions: Initialized transaction manager');
    } catch (error) {
      throw new Error(`Failed to initialize transaction manager: ${error}`);
    }
  }

  /**
   * Create a new transaction
   */
  createTransaction(request: TransactionRequest): Transaction {
    try {
      const transaction = new Transaction();

      // Add instructions
      request.instructions.forEach(instruction => {
        transaction.add(instruction);
      });

      // Set fee payer
      transaction.feePayer = request.feePayer;

      // Add signers
      request.signers.forEach(signer => {
        transaction.partialSign(signer);
      });

      console.log(`Transactions: Created transaction with ${request.instructions.length} instructions`);
      return transaction;
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error}`);
    }
  }

  /**
   * Create a versioned transaction (for newer Solana features)
   */
  async createVersionedTransaction(request: TransactionRequest): Promise<VersionedTransaction> {
    try {
      const blockhash = await this.connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: request.feePayer,
        recentBlockhash: blockhash.blockhash,
        instructions: request.instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);

      // Add signers
      request.signers.forEach(signer => {
        transaction.sign([signer]);
      });

      console.log(`Transactions: Created versioned transaction with ${request.instructions.length} instructions`);
      return transaction;
    } catch (error) {
      throw new Error(`Failed to create versioned transaction: ${error}`);
    }
  }

  /**
   * Simulate a transaction before sending
   */
  async simulateTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<TransactionSimulation> {
    try {
      const simulation = await this.connection.simulateTransaction(
        transaction,
        undefined,
        this.config.preflightCommitment
      );

      const result: TransactionSimulation = {
        success: !simulation.value.err,
        error: simulation.value.err ? simulation.value.err.toString() : undefined,
        logs: simulation.value.logs,
        unitsConsumed: simulation.value.unitsConsumed,
        accounts: simulation.value.accounts,
      };

      if (result.success) {
        console.log(`Transactions: Simulation successful, units consumed: ${result.unitsConsumed}`);
      } else {
        console.warn(`Transactions: Simulation failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Simulation error: ${error}`,
      };
    }
  }

  /**
   * Send and confirm a transaction with retry logic
   */
  async sendAndConfirmTransaction(
    transaction: Transaction | VersionedTransaction,
    signers: Keypair[] = []
  ): Promise<TransactionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`Transactions: Sending transaction (attempt ${attempt}/${this.config.maxRetries})`);

        const signature = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          signers,
          {
            commitment: this.config.commitment,
            preflightCommitment: this.config.preflightCommitment,
          }
        );

        const result: TransactionResult = {
          signature,
          status: 'confirmed',
          timestamp: new Date(),
          slot: await this.connection.getSlot(),
        };

        console.log(`Transactions: Transaction confirmed ${signature}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Transactions: Attempt ${attempt} failed: ${error}`);

        if (attempt < this.config.maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const result: TransactionResult = {
      signature: '',
      status: 'failed',
      error: lastError?.message || 'Transaction failed after all retries',
      timestamp: new Date(),
      slot: 0,
    };

    console.error(`Transactions: Transaction failed after ${this.config.maxRetries} attempts`);
    return result;
  }

  /**
   * Send a transaction without confirmation (for faster execution)
   */
  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    signers: Keypair[] = []
  ): Promise<TransactionResult> {
    try {
      console.log('Transactions: Sending transaction without confirmation');

      const signature = await this.connection.sendTransaction(
        transaction,
        signers,
        {
          preflightCommitment: this.config.preflightCommitment,
        }
      );

      const result: TransactionResult = {
        signature,
        status: 'pending',
        timestamp: new Date(),
        slot: await this.connection.getSlot(),
      };

      console.log(`Transactions: Transaction sent ${signature}`);
      return result;
    } catch (error) {
      const result: TransactionResult = {
        signature: '',
        status: 'failed',
        error: `Send error: ${error}`,
        timestamp: new Date(),
        slot: 0,
      };

      console.error(`Transactions: Failed to send transaction: ${error}`);
      return result;
    }
  }

  /**
   * Monitor a transaction for confirmation
   */
  async monitorTransaction(
    signature: string,
    requiredConfirmations: number = 1
  ): Promise<TransactionResult> {
    try {
      console.log(`Transactions: Monitoring transaction ${signature}`);

      const monitor: TransactionMonitor = {
        signature,
        status: 'monitoring',
        confirmations: 0,
        requiredConfirmations,
        startTime: new Date(),
        lastCheck: new Date(),
      };

      this.monitors.set(signature, monitor);

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(
        signature,
        this.config.commitment
      );

      if (confirmation.value.err) {
        const result: TransactionResult = {
          signature,
          status: 'failed',
          error: confirmation.value.err.toString(),
          timestamp: new Date(),
          slot: confirmation.context.slot,
        };

        console.error(`Transactions: Transaction failed ${signature}`);
        return result;
      }

      const result: TransactionResult = {
        signature,
        status: 'confirmed',
        timestamp: new Date(),
        slot: confirmation.context.slot,
        confirmationTime: Date.now() - monitor.startTime.getTime(),
      };

      console.log(`Transactions: Transaction confirmed ${signature}`);
      return result;
    } catch (error) {
      const result: TransactionResult = {
        signature,
        status: 'failed',
        error: `Monitor error: ${error}`,
        timestamp: new Date(),
        slot: 0,
      };

      console.error(`Transactions: Failed to monitor transaction: ${error}`);
      return result;
    } finally {
      this.monitors.delete(signature);
    }
  }

  /**
   * Create a token transfer transaction
   */
  async createTokenTransferTransaction(
    from: PublicKey,
    to: PublicKey,
    mint: PublicKey,
    amount: number,
    decimals: number = 6
  ): Promise<TransactionRequest> {
    try {
      const instructions: TransactionInstruction[] = [];

      // Get associated token addresses
      const fromTokenAccount = await getAssociatedTokenAddress(mint, from);
      const toTokenAccount = await getAssociatedTokenAddress(mint, to);

      // Check if destination token account exists
      const toTokenAccountInfo = await this.connection.getAccountInfo(toTokenAccount);

      if (!toTokenAccountInfo) {
        // Create associated token account for destination
        instructions.push(
          createAssociatedTokenAccountInstruction(
            from,
            toTokenAccount,
            to,
            mint
          )
        );
      }

      // Add transfer instruction
      instructions.push(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          from,
          BigInt(amount * Math.pow(10, decimals))
        )
      );

      const request: TransactionRequest = {
        instructions,
        signers: [],
        feePayer: from,
      };

      console.log(`Transactions: Created token transfer transaction for ${amount} tokens`);
      return request;
    } catch (error) {
      throw new Error(`Failed to create token transfer transaction: ${error}`);
    }
  }

  /**
   * Create a multi-instruction transaction
   */
  createMultiInstructionTransaction(
    instructions: TransactionInstruction[],
    feePayer: PublicKey,
    signers: Keypair[] = []
  ): TransactionRequest {
    try {
      const request: TransactionRequest = {
        instructions,
        signers,
        feePayer,
      };

      console.log(`Transactions: Created multi-instruction transaction with ${instructions.length} instructions`);
      return request;
    } catch (error) {
      throw new Error(`Failed to create multi-instruction transaction: ${error}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations?: number;
    error?: string;
  }> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: this.config.commitment,
      });

      if (!transaction) {
        return { status: 'pending' };
      }

      if (transaction.meta?.err) {
        return {
          status: 'failed',
          error: transaction.meta.err.toString(),
        };
      }

      return {
        status: 'confirmed',
        confirmations: transaction.meta?.confirmationStatus === 'confirmed' ? 1 : 0,
      };
    } catch (error) {
      return {
        status: 'failed',
        error: `Status check error: ${error}`,
      };
    }
  }

  /**
   * Get active transaction monitors
   */
  getActiveMonitors(): TransactionMonitor[] {
    return Array.from(this.monitors.values());
  }

  /**
   * Cancel a transaction monitor
   */
  cancelMonitor(signature: string): boolean {
    return this.monitors.delete(signature);
  }

  /**
   * Get transaction statistics
   */
  getStats(): {
    activeMonitors: number;
    totalMonitors: number;
  } {
    return {
      activeMonitors: this.monitors.size,
      totalMonitors: this.monitors.size, // In a real implementation, you'd track total
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
        latency,
      };
    } catch (error) {
      return {
        connected: false,
        blockHeight: 0,
        latency: 0,
      };
    }
  }
}

/**
 * Factory function to create transaction manager instance
 */
export function createTransactionManager(config: TransactionConfig): TransactionManager {
  return new TransactionManager(config);
}
