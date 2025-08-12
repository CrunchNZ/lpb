/**
 * Wallet Security Utilities
 * 
 * Provides comprehensive security features for wallet management:
 * - Encrypted key storage
 * - Transaction signing validation
 * - Wallet state persistence
 * - Security audit logging
 * - Rate limiting and protection
 */

import { Transaction } from '@solana/web3.js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Security configuration
export interface SecurityConfig {
  encryptionKey: string;
  maxRetries: number;
  timeoutMs: number;
  auditLogPath: string;
  rateLimitWindow: number;
  maxRequestsPerWindow: number;
}

// Wallet security state
export interface WalletSecurityState {
  publicKey: string;
  isEncrypted: boolean;
  lastUsed: Date;
  transactionCount: number;
  failedAttempts: number;
  isLocked: boolean;
}

// Transaction security info
export interface TransactionSecurity {
  signature: string;
  timestamp: Date;
  amount: number;
  recipient: string;
  fee: number;
  isConfirmed: boolean;
  riskScore: number;
}

// Audit log entry
export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  walletAddress: string;
  details: any;
  riskLevel: 'low' | 'medium' | 'high';
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Wallet Security Manager
 * 
 * Handles all security-related wallet operations
 */
export class WalletSecurityManager {
  private config: SecurityConfig;
  private securityState: Map<string, WalletSecurityState> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private auditLog: AuditLogEntry[] = [];

  constructor(config: SecurityConfig) {
    this.config = config;
    this.loadSecurityState();
  }

  /**
   * Encrypt wallet data
   */
  encryptWalletData(data: any): string {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return JSON.stringify({
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      });
    } catch (error) {
      throw new Error(`Failed to encrypt wallet data: ${error}`);
    }
  }

  /**
   * Decrypt wallet data
   */
  decryptWalletData(encryptedData: string): any {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
      const data = JSON.parse(encryptedData);
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
      
      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Failed to decrypt wallet data: ${error}`);
    }
  }

  /**
   * Validate transaction before signing
   */
  validateTransaction(
    transaction: Transaction,
    walletAddress: string,
    expectedAmount?: number,
    expectedRecipient?: string
  ): { isValid: boolean; riskScore: number; warnings: string[] } {
    const warnings: string[] = [];
    let riskScore = 0;

    try {
      // Check transaction size
      const transactionSize = transaction.serialize().length;
      if (transactionSize > 10000) {
        warnings.push('Large transaction detected');
        riskScore += 20;
      }

      // Check for suspicious instructions
      const instructions = transaction.instructions;
      if (instructions.length > 10) {
        warnings.push('High number of instructions');
        riskScore += 15;
      }

      // Check for known malicious programs
      const knownMaliciousPrograms = [
        // Add known malicious program IDs here
      ];

      for (const instruction of instructions) {
        if (knownMaliciousPrograms.includes(instruction.programId.toString())) {
          warnings.push('Suspicious program detected');
          riskScore += 50;
        }
      }

      // Validate amount if provided
      if (expectedAmount && expectedRecipient) {
        // Additional validation logic here
      }

      // Check wallet security state
      const walletState = this.securityState.get(walletAddress);
      if (walletState) {
        if (walletState.failedAttempts > 3) {
          warnings.push('Multiple failed attempts detected');
          riskScore += 25;
        }

        if (walletState.isLocked) {
          warnings.push('Wallet is locked');
          riskScore += 100;
        }
      }

      return {
        isValid: riskScore < 80,
        riskScore,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        riskScore: 100,
        warnings: [`Transaction validation error: ${error}`],
      };
    }
  }

  /**
   * Rate limiting for wallet operations
   */
  isRateLimited(walletAddress: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    const requestData = this.requestCounts.get(walletAddress);
    
    if (!requestData || requestData.resetTime < windowStart) {
      this.requestCounts.set(walletAddress, { count: 1, resetTime: now });
      return false;
    }

    if (requestData.count >= this.config.maxRequestsPerWindow) {
      return true;
    }

    requestData.count++;
    return false;
  }

  /**
   * Log security audit event
   */
  logAuditEvent(
    action: string,
    walletAddress: string,
    details: any,
    riskLevel: 'low' | 'medium' | 'high' = 'low',
    ipAddress?: string,
    userAgent?: string
  ): void {
    const auditEntry: AuditLogEntry = {
      timestamp: new Date(),
      action,
      walletAddress,
      details,
      riskLevel,
      ipAddress,
      userAgent,
    };

    this.auditLog.push(auditEntry);
    
    // Save to file
    this.saveAuditLog(auditEntry);
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Audit:', auditEntry);
    }
  }

  /**
   * Update wallet security state
   */
  updateWalletState(
    walletAddress: string,
    updates: Partial<WalletSecurityState>
  ): void {
    const currentState = this.securityState.get(walletAddress) || {
      publicKey: walletAddress,
      isEncrypted: false,
      lastUsed: new Date(),
      transactionCount: 0,
      failedAttempts: 0,
      isLocked: false,
    };

    const updatedState = { ...currentState, ...updates };
    this.securityState.set(walletAddress, updatedState);
    
    this.saveSecurityState();
  }

  /**
   * Get wallet security state
   */
  getWalletState(walletAddress: string): WalletSecurityState | null {
    return this.securityState.get(walletAddress) || null;
  }

  /**
   * Lock wallet for security
   */
  lockWallet(walletAddress: string, reason: string): void {
    this.updateWalletState(walletAddress, { isLocked: true });
    this.logAuditEvent('wallet_locked', walletAddress, { reason }, 'high');
  }

  /**
   * Unlock wallet
   */
  unlockWallet(walletAddress: string): void {
    this.updateWalletState(walletAddress, { 
      isLocked: false,
      failedAttempts: 0 
    });
    this.logAuditEvent('wallet_unlocked', walletAddress, {}, 'medium');
  }

  /**
   * Record failed attempt
   */
  recordFailedAttempt(walletAddress: string, reason: string): void {
    const currentState = this.getWalletState(walletAddress);
    const failedAttempts = (currentState?.failedAttempts || 0) + 1;
    
    this.updateWalletState(walletAddress, { failedAttempts });
    
    if (failedAttempts >= 5) {
      this.lockWallet(walletAddress, 'Too many failed attempts');
    }
    
    this.logAuditEvent('failed_attempt', walletAddress, { reason, failedAttempts }, 'high');
  }

  /**
   * Record successful transaction
   */
  recordSuccessfulTransaction(
    walletAddress: string,
    signature: string,
    amount: number,
    recipient: string
  ): void {
    const currentState = this.getWalletState(walletAddress);
    const transactionCount = (currentState?.transactionCount || 0) + 1;
    
    this.updateWalletState(walletAddress, { 
      transactionCount,
      lastUsed: new Date(),
      failedAttempts: 0 
    });
    
    this.logAuditEvent('successful_transaction', walletAddress, {
      signature,
      amount,
      recipient,
      transactionCount,
    }, 'low');
  }

  /**
   * Save security state to file
   */
  private saveSecurityState(): void {
    try {
      const data = JSON.stringify(Array.from(this.securityState.entries()));
      const encryptedData = this.encryptWalletData(data);
      
      const securityDir = path.dirname(this.config.auditLogPath);
      if (!fs.existsSync(securityDir)) {
        fs.mkdirSync(securityDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(securityDir, 'wallet-security.json'),
        encryptedData
      );
    } catch (error) {
      console.error('Failed to save security state:', error);
    }
  }

  /**
   * Load security state from file
   */
  private loadSecurityState(): void {
    try {
      const securityFile = path.join(
        path.dirname(this.config.auditLogPath),
        'wallet-security.json'
      );
      
      if (fs.existsSync(securityFile)) {
        const encryptedData = fs.readFileSync(securityFile, 'utf8');
        const decryptedData = this.decryptWalletData(encryptedData);
        const entries = JSON.parse(decryptedData);
        
        this.securityState = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load security state:', error);
    }
  }

  /**
   * Save audit log entry
   */
  private saveAuditLog(entry: AuditLogEntry): void {
    try {
      const auditDir = path.dirname(this.config.auditLogPath);
      if (!fs.existsSync(auditDir)) {
        fs.mkdirSync(auditDir, { recursive: true });
      }
      
      const logFile = path.join(auditDir, 'security-audit.log');
      const logEntry = JSON.stringify(entry) + '\n';
      
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }

  /**
   * Get audit log entries
   */
  getAuditLogs(
    walletAddress?: string,
    startDate?: Date,
    endDate?: Date
  ): AuditLogEntry[] {
    let filteredLogs = this.auditLog;

    if (walletAddress) {
      filteredLogs = filteredLogs.filter(log => log.walletAddress === walletAddress);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear old audit logs
   */
  clearOldAuditLogs(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.auditLog = this.auditLog.filter(log => log.timestamp >= cutoffDate);
  }
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  encryptionKey: process.env.WALLET_ENCRYPTION_KEY || 'default-key-change-in-production',
  maxRetries: 3,
  timeoutMs: 30000,
  auditLogPath: './logs/security-audit.log',
  rateLimitWindow: 60000, // 1 minute
  maxRequestsPerWindow: 10,
};

// Create default instance
export const walletSecurity = new WalletSecurityManager(DEFAULT_SECURITY_CONFIG); 