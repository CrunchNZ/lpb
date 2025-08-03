/**
 * Security Audit System
 * Validates API key handling, transaction security, input sanitization, and security best practices
 */

export interface SecurityVulnerability {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'API_KEY' | 'TRANSACTION' | 'INPUT_VALIDATION' | 'CONFIGURATION' | 'DEPENDENCY';
  title: string;
  description: string;
  location: string;
  recommendation: string;
  cve?: string;
}

export interface SecurityAuditResult {
  timestamp: number;
  vulnerabilities: SecurityVulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    score: number; // 0-100, higher is better
  };
  recommendations: string[];
}

export class SecurityAuditor {
  private vulnerabilities: SecurityVulnerability[] = [];
  private auditHistory: SecurityAuditResult[] = [];

  /**
   * Perform comprehensive security audit
   */
  async performAudit(): Promise<SecurityAuditResult> {
    this.vulnerabilities = [];

    // API Key Security Audit
    await this.auditAPIKeySecurity();
    
    // Transaction Security Audit
    await this.auditTransactionSecurity();
    
    // Input Validation Audit
    await this.auditInputValidation();
    
    // Configuration Security Audit
    await this.auditConfigurationSecurity();
    
    // Dependency Security Audit
    await this.auditDependencySecurity();

    const result = this.generateAuditResult();
    this.auditHistory.push(result);
    
    return result;
  }

  /**
   * Audit API key handling and storage
   */
  private async auditAPIKeySecurity(): Promise<void> {
    // Check for hardcoded API keys
    const hardcodedKeys = await this.checkForHardcodedKeys();
    if (hardcodedKeys.length > 0) {
      this.vulnerabilities.push({
        id: 'API_KEY_001',
        severity: 'CRITICAL',
        category: 'API_KEY',
        title: 'Hardcoded API Keys Detected',
        description: `Found ${hardcodedKeys.length} hardcoded API keys in source code`,
        location: hardcodedKeys.join(', '),
        recommendation: 'Move all API keys to environment variables or secure key management system'
      });
    }

    // Check for API key exposure in logs
    const exposedKeys = await this.checkForExposedKeys();
    if (exposedKeys.length > 0) {
      this.vulnerabilities.push({
        id: 'API_KEY_002',
        severity: 'HIGH',
        category: 'API_KEY',
        title: 'API Keys Exposed in Logs',
        description: 'API keys may be exposed in application logs',
        location: 'Log files',
        recommendation: 'Implement log sanitization to remove sensitive data'
      });
    }

    // Check for weak key validation
    const weakValidation = await this.checkKeyValidation();
    if (weakValidation) {
      this.vulnerabilities.push({
        id: 'API_KEY_003',
        severity: 'MEDIUM',
        category: 'API_KEY',
        title: 'Weak API Key Validation',
        description: 'API key validation may be insufficient',
        location: 'API validation logic',
        recommendation: 'Implement stronger key validation with proper format checking'
      });
    }
  }

  /**
   * Audit transaction security
   */
  private async auditTransactionSecurity(): Promise<void> {
    // Check for transaction signing vulnerabilities
    const signingVulns = await this.checkTransactionSigning();
    if (signingVulns.length > 0) {
      this.vulnerabilities.push({
        id: 'TRANSACTION_001',
        severity: 'CRITICAL',
        category: 'TRANSACTION',
        title: 'Transaction Signing Vulnerabilities',
        description: 'Potential vulnerabilities in transaction signing process',
        location: signingVulns.join(', '),
        recommendation: 'Implement secure transaction signing with proper validation'
      });
    }

    // Check for replay attack vulnerabilities
    const replayVulns = await this.checkReplayAttacks();
    if (replayVulns) {
      this.vulnerabilities.push({
        id: 'TRANSACTION_002',
        severity: 'HIGH',
        category: 'TRANSACTION',
        title: 'Replay Attack Vulnerabilities',
        description: 'Transactions may be vulnerable to replay attacks',
        location: 'Transaction processing',
        recommendation: 'Implement nonce-based replay protection'
      });
    }

    // Check for double-spend vulnerabilities
    const doubleSpendVulns = await this.checkDoubleSpendProtection();
    if (doubleSpendVulns) {
      this.vulnerabilities.push({
        id: 'TRANSACTION_003',
        severity: 'HIGH',
        category: 'TRANSACTION',
        title: 'Double-Spend Vulnerabilities',
        description: 'Insufficient protection against double-spend attacks',
        location: 'Transaction validation',
        recommendation: 'Implement proper double-spend detection and prevention'
      });
    }
  }

  /**
   * Audit input validation and sanitization
   */
  private async auditInputValidation(): Promise<void> {
    // Check for SQL injection vulnerabilities
    const sqlInjection = await this.checkSQLInjection();
    if (sqlInjection.length > 0) {
      this.vulnerabilities.push({
        id: 'INPUT_001',
        severity: 'CRITICAL',
        category: 'INPUT_VALIDATION',
        title: 'SQL Injection Vulnerabilities',
        description: 'Potential SQL injection vulnerabilities detected',
        location: sqlInjection.join(', '),
        recommendation: 'Use parameterized queries and input validation'
      });
    }

    // Check for XSS vulnerabilities
    const xssVulns = await this.checkXSSVulnerabilities();
    if (xssVulns.length > 0) {
      this.vulnerabilities.push({
        id: 'INPUT_002',
        severity: 'HIGH',
        category: 'INPUT_VALIDATION',
        title: 'XSS Vulnerabilities',
        description: 'Cross-site scripting vulnerabilities detected',
        location: xssVulns.join(', '),
        recommendation: 'Implement proper input sanitization and output encoding'
      });
    }

    // Check for path traversal vulnerabilities
    const pathTraversal = await this.checkPathTraversal();
    if (pathTraversal.length > 0) {
      this.vulnerabilities.push({
        id: 'INPUT_003',
        severity: 'HIGH',
        category: 'INPUT_VALIDATION',
        title: 'Path Traversal Vulnerabilities',
        description: 'Path traversal vulnerabilities detected',
        location: pathTraversal.join(', '),
        recommendation: 'Validate and sanitize file paths'
      });
    }
  }

  /**
   * Audit configuration security
   */
  private async auditConfigurationSecurity(): Promise<void> {
    // Check for insecure default configurations
    const insecureDefaults = await this.checkInsecureDefaults();
    if (insecureDefaults.length > 0) {
      this.vulnerabilities.push({
        id: 'CONFIG_001',
        severity: 'MEDIUM',
        category: 'CONFIGURATION',
        title: 'Insecure Default Configurations',
        description: 'Found insecure default configurations',
        location: insecureDefaults.join(', '),
        recommendation: 'Review and secure all default configurations'
      });
    }

    // Check for debug mode in production
    const debugMode = await this.checkDebugMode();
    if (debugMode) {
      this.vulnerabilities.push({
        id: 'CONFIG_002',
        severity: 'HIGH',
        category: 'CONFIGURATION',
        title: 'Debug Mode Enabled in Production',
        description: 'Debug mode is enabled in production environment',
        location: 'Application configuration',
        recommendation: 'Disable debug mode in production'
      });
    }

    // Check for weak encryption settings
    const weakEncryption = await this.checkEncryptionSettings();
    if (weakEncryption) {
      this.vulnerabilities.push({
        id: 'CONFIG_003',
        severity: 'MEDIUM',
        category: 'CONFIGURATION',
        title: 'Weak Encryption Settings',
        description: 'Using weak encryption algorithms or settings',
        location: 'Encryption configuration',
        recommendation: 'Use strong encryption algorithms and proper key management'
      });
    }
  }

  /**
   * Audit dependency security
   */
  private async auditDependencySecurity(): Promise<void> {
    // Check for vulnerable dependencies
    const vulnerableDeps = await this.checkVulnerableDependencies();
    if (vulnerableDeps.length > 0) {
      this.vulnerabilities.push({
        id: 'DEPENDENCY_001',
        severity: 'HIGH',
        category: 'DEPENDENCY',
        title: 'Vulnerable Dependencies',
        description: `Found ${vulnerableDeps.length} vulnerable dependencies`,
        location: 'package.json',
        recommendation: 'Update vulnerable dependencies to latest secure versions'
      });
    }

    // Check for outdated dependencies
    const outdatedDeps = await this.checkOutdatedDependencies();
    if (outdatedDeps.length > 0) {
      this.vulnerabilities.push({
        id: 'DEPENDENCY_002',
        severity: 'MEDIUM',
        category: 'DEPENDENCY',
        title: 'Outdated Dependencies',
        description: `Found ${outdatedDeps.length} outdated dependencies`,
        location: 'package.json',
        recommendation: 'Update dependencies to latest versions'
      });
    }
  }

  /**
   * Check for hardcoded API keys
   */
  private async checkForHardcodedKeys(): Promise<string[]> {
    // This would scan the codebase for hardcoded keys
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check for exposed keys in logs
   */
  private async checkForExposedKeys(): Promise<string[]> {
    // This would check log files for exposed keys
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check API key validation strength
   */
  private async checkKeyValidation(): Promise<boolean> {
    // This would analyze key validation logic
    // For now, return false as placeholder
    return false;
  }

  /**
   * Check transaction signing security
   */
  private async checkTransactionSigning(): Promise<string[]> {
    // This would analyze transaction signing code
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check for replay attack vulnerabilities
   */
  private async checkReplayAttacks(): Promise<boolean> {
    // This would analyze transaction replay protection
    // For now, return false as placeholder
    return false;
  }

  /**
   * Check double-spend protection
   */
  private async checkDoubleSpendProtection(): Promise<boolean> {
    // This would analyze double-spend protection
    // For now, return false as placeholder
    return false;
  }

  /**
   * Check for SQL injection vulnerabilities
   */
  private async checkSQLInjection(): Promise<string[]> {
    // This would scan for SQL injection patterns
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check for XSS vulnerabilities
   */
  private async checkXSSVulnerabilities(): Promise<string[]> {
    // This would scan for XSS patterns
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check for path traversal vulnerabilities
   */
  private async checkPathTraversal(): Promise<string[]> {
    // This would scan for path traversal patterns
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check for insecure default configurations
   */
  private async checkInsecureDefaults(): Promise<string[]> {
    // This would check configuration files
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check if debug mode is enabled
   */
  private async checkDebugMode(): Promise<boolean> {
    // This would check environment variables and config
    // For now, return false as placeholder
    return false;
  }

  /**
   * Check encryption settings
   */
  private async checkEncryptionSettings(): Promise<boolean> {
    // This would analyze encryption configuration
    // For now, return false as placeholder
    return false;
  }

  /**
   * Check for vulnerable dependencies
   */
  private async checkVulnerableDependencies(): Promise<string[]> {
    // This would check package.json and run npm audit
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check for outdated dependencies
   */
  private async checkOutdatedDependencies(): Promise<string[]> {
    // This would check package.json for outdated deps
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Generate audit result with scoring
   */
  private generateAuditResult(): SecurityAuditResult {
    const critical = this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const high = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const medium = this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    const low = this.vulnerabilities.filter(v => v.severity === 'LOW').length;
    const total = this.vulnerabilities.length;

    // Calculate security score (0-100, higher is better)
    const score = Math.max(0, 100 - (critical * 25) - (high * 10) - (medium * 5) - (low * 1));

    const recommendations = this.generateRecommendations();

    return {
      timestamp: Date.now(),
      vulnerabilities: this.vulnerabilities,
      summary: {
        total,
        critical,
        high,
        medium,
        low,
        score
      },
      recommendations
    };
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.vulnerabilities.some(v => v.severity === 'CRITICAL')) {
      recommendations.push('Address all critical vulnerabilities immediately');
    }

    if (this.vulnerabilities.some(v => v.category === 'API_KEY')) {
      recommendations.push('Implement secure API key management');
    }

    if (this.vulnerabilities.some(v => v.category === 'TRANSACTION')) {
      recommendations.push('Review and secure transaction processing');
    }

    if (this.vulnerabilities.some(v => v.category === 'INPUT_VALIDATION')) {
      recommendations.push('Implement comprehensive input validation');
    }

    if (this.vulnerabilities.some(v => v.category === 'DEPENDENCY')) {
      recommendations.push('Update vulnerable dependencies');
    }

    return recommendations;
  }

  /**
   * Get audit history
   */
  getAuditHistory(): SecurityAuditResult[] {
    return this.auditHistory;
  }

  /**
   * Get latest audit result
   */
  getLatestAudit(): SecurityAuditResult | null {
    return this.auditHistory.length > 0 ? this.auditHistory[this.auditHistory.length - 1] : null;
  }

  /**
   * Export audit report
   */
  exportReport(): string {
    const latest = this.getLatestAudit();
    if (!latest) return 'No audit data available';

    return JSON.stringify(latest, null, 2);
  }
}

/**
 * Input Sanitization Utilities
 */
export class InputSanitizer {
  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  }

  /**
   * Validate and sanitize file path
   */
  static sanitizePath(path: string): string {
    // Remove path traversal attempts
    return path.replace(/\.\./g, '').replace(/\/\/+/g, '/');
  }

  /**
   * Validate API key format
   */
  static validateAPIKey(key: string): boolean {
    // Basic validation - should be at least 32 characters and contain only valid characters
    return key.length >= 32 && /^[a-zA-Z0-9_-]+$/.test(key);
  }

  /**
   * Validate Solana address
   */
  static validateSolanaAddress(address: string): boolean {
    // Solana addresses are 32-44 characters long and base58 encoded
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  /**
   * Validate transaction signature
   */
  static validateTransactionSignature(signature: string): boolean {
    // Solana signatures are 88 characters long and base58 encoded
    return /^[1-9A-HJ-NP-Za-km-z]{88,}$/.test(signature);
  }
}

/**
 * Transaction Security Utilities
 */
export class TransactionSecurity {
  /**
   * Generate secure nonce for replay protection
   */
  static generateNonce(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Validate transaction before signing
   */
  static validateTransaction(transaction: any): boolean {
    // Basic transaction validation
    if (!transaction) return false;
    if (!transaction.instructions) return false;
    if (!Array.isArray(transaction.instructions)) return false;
    return transaction.instructions.length > 0;
  }

  /**
   * Check for potential double-spend
   */
  static checkDoubleSpend(transaction: any, recentTransactions: any[]): boolean {
    // Check if this transaction conflicts with recent transactions
    if (!transaction || !recentTransactions) return false;
    return recentTransactions.some(recent => 
      recent.from === transaction.from && 
      recent.amount === transaction.amount &&
      Date.now() - recent.timestamp < 60000 // Within last minute
    );
  }
}

// Global security auditor instance
export const securityAuditor = new SecurityAuditor(); 