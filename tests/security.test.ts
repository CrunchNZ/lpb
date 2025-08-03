import { SecurityAuditor, InputSanitizer, TransactionSecurity } from '../src/backend/utils/security';

describe('Security Auditor', () => {
  let auditor: SecurityAuditor;

  beforeEach(() => {
    auditor = new SecurityAuditor();
  });

  test('should perform comprehensive security audit', async () => {
    const result = await auditor.performAudit();
    
    expect(result).toBeDefined();
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.vulnerabilities).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });

  test('should generate audit result with proper structure', async () => {
    const result = await auditor.performAudit();
    
    expect(result.summary.total).toBeGreaterThanOrEqual(0);
    expect(result.summary.critical).toBeGreaterThanOrEqual(0);
    expect(result.summary.high).toBeGreaterThanOrEqual(0);
    expect(result.summary.medium).toBeGreaterThanOrEqual(0);
    expect(result.summary.low).toBeGreaterThanOrEqual(0);
    expect(result.summary.score).toBeGreaterThanOrEqual(0);
    expect(result.summary.score).toBeLessThanOrEqual(100);
  });

  test('should calculate security score correctly', async () => {
    const result = await auditor.performAudit();
    
    // Score should be between 0 and 100
    expect(result.summary.score).toBeGreaterThanOrEqual(0);
    expect(result.summary.score).toBeLessThanOrEqual(100);
    
    // Score should decrease with more vulnerabilities
    const totalVulns = result.summary.critical + result.summary.high + result.summary.medium + result.summary.low;
    if (totalVulns > 0) {
      expect(result.summary.score).toBeLessThan(100);
    }
  });

  test('should generate recommendations based on vulnerabilities', async () => {
    const result = await auditor.performAudit();
    
    expect(Array.isArray(result.recommendations)).toBe(true);
    
    // If there are critical vulnerabilities, should recommend addressing them
    if (result.summary.critical > 0) {
      expect(result.recommendations.some(rec => rec.includes('critical'))).toBe(true);
    }
  });

  test('should maintain audit history', async () => {
    await auditor.performAudit();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure different timestamps
    await auditor.performAudit();
    
    const history = auditor.getAuditHistory();
    expect(history).toHaveLength(2);
    expect(history[0].timestamp).toBeLessThanOrEqual(history[1].timestamp);
  });

  test('should get latest audit result', async () => {
    const result1 = await auditor.performAudit();
    const result2 = await auditor.performAudit();
    
    const latest = auditor.getLatestAudit();
    expect(latest).toEqual(result2);
  });

  test('should export audit report', async () => {
    await auditor.performAudit();
    
    const report = auditor.exportReport();
    expect(typeof report).toBe('string');
    expect(report).not.toBe('No audit data available');
    
    const parsed = JSON.parse(report);
    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('vulnerabilities');
    expect(parsed).toHaveProperty('summary');
  });

  test('should handle empty audit history', () => {
    const latest = auditor.getLatestAudit();
    expect(latest).toBeNull();
    
    const report = auditor.exportReport();
    expect(report).toBe('No audit data available');
  });
});

describe('Input Sanitizer', () => {
  test('should sanitize string input', () => {
    const input = '<script>alert("xss")</script>';
    const sanitized = InputSanitizer.sanitizeString(input);
    
    expect(sanitized).not.toContain('<');
    expect(sanitized).not.toContain('>');
    expect(sanitized).not.toContain('"');
    expect(sanitized).not.toContain("'");
  });

  test('should handle empty string input', () => {
    const sanitized = InputSanitizer.sanitizeString('');
    expect(sanitized).toBe('');
  });

  test('should trim whitespace', () => {
    const sanitized = InputSanitizer.sanitizeString('  test  ');
    expect(sanitized).toBe('test');
  });

  test('should sanitize file path', () => {
    const maliciousPath = '../../../etc/passwd';
    const sanitized = InputSanitizer.sanitizePath(maliciousPath);
    
    expect(sanitized).not.toContain('..');
    expect(sanitized).not.toContain('//');
  });

  test('should validate API key format', () => {
    // Valid API key
    expect(InputSanitizer.validateAPIKey('valid_api_key_123_456_789_012_345_678_901')).toBe(true);
    
    // Invalid API keys
    expect(InputSanitizer.validateAPIKey('short')).toBe(false);
    expect(InputSanitizer.validateAPIKey('invalid key with spaces')).toBe(false);
    expect(InputSanitizer.validateAPIKey('invalid-key-with-special-chars!@#')).toBe(false);
  });

  test('should validate Solana address', () => {
    // Valid Solana address (example)
    const validAddress = '11111111111111111111111111111112';
    expect(InputSanitizer.validateSolanaAddress(validAddress)).toBe(true);
    
    // Invalid addresses
    expect(InputSanitizer.validateSolanaAddress('invalid')).toBe(false);
    expect(InputSanitizer.validateSolanaAddress('')).toBe(false);
    expect(InputSanitizer.validateSolanaAddress('1111111111111111111111111111111')).toBe(false); // Too short
  });

  test('should validate transaction signature', () => {
    // Valid signature (example) - 88+ characters base58
    const validSignature = '5h6xBEauJ3PK6SWCZ1PGjBvj8vDdWG3KpwATGy1jAXKfVGrLZcZmsUwp5Yh1Td7SV7AvA1qC84SR3m1x7hL6qKf5h6xBEauJ3PK6SWCZ1PGjBvj8vDdWG3KpwATGy1jAXKfVGrLZcZmsUwp5Yh1Td7SV7AvA1qC84SR3m1x7hL6qKf';
    expect(InputSanitizer.validateTransactionSignature(validSignature)).toBe(true);
    
    // Invalid signatures
    expect(InputSanitizer.validateTransactionSignature('invalid')).toBe(false);
    expect(InputSanitizer.validateTransactionSignature('')).toBe(false);
    expect(InputSanitizer.validateTransactionSignature('short')).toBe(false);
  });
});

describe('Transaction Security', () => {
  test('should generate secure nonce', () => {
    const nonce1 = TransactionSecurity.generateNonce();
    const nonce2 = TransactionSecurity.generateNonce();
    
    expect(nonce1).toBeDefined();
    expect(nonce1).not.toBe(nonce2); // Should be unique
    expect(nonce1.length).toBeGreaterThan(10);
  });

  test('should validate transaction structure', () => {
    // Valid transaction
    const validTransaction = {
      instructions: [
        { programId: '11111111111111111111111111111111', data: Buffer.from([]) }
      ]
    };
    expect(TransactionSecurity.validateTransaction(validTransaction)).toBe(true);
    
    // Invalid transactions
    expect(TransactionSecurity.validateTransaction(null)).toBe(false);
    expect(TransactionSecurity.validateTransaction({})).toBe(false);
    expect(TransactionSecurity.validateTransaction({ instructions: [] })).toBe(false);
    expect(TransactionSecurity.validateTransaction({ instructions: 'not an array' })).toBe(false);
  });

  test('should detect double-spend attempts', () => {
    const transaction = {
      from: 'sender123',
      amount: 100,
      timestamp: Date.now()
    };
    
    const recentTransactions = [
      {
        from: 'sender123',
        amount: 100,
        timestamp: Date.now() - 30000 // 30 seconds ago
      }
    ];
    
    expect(TransactionSecurity.checkDoubleSpend(transaction, recentTransactions)).toBe(true);
    
    // Different amount should not be considered double-spend
    const differentAmountTransaction = {
      from: 'sender123',
      amount: 200,
      timestamp: Date.now()
    };
    
    expect(TransactionSecurity.checkDoubleSpend(differentAmountTransaction, recentTransactions)).toBe(false);
    
    // Old transaction should not be considered double-spend
    const oldTransaction = {
      from: 'sender123',
      amount: 100,
      timestamp: Date.now() - 120000 // 2 minutes ago
    };
    
    expect(TransactionSecurity.checkDoubleSpend(transaction, [oldTransaction])).toBe(false);
  });

  test('should handle empty recent transactions', () => {
    const transaction = {
      from: 'sender123',
      amount: 100,
      timestamp: Date.now()
    };
    
    expect(TransactionSecurity.checkDoubleSpend(transaction, [])).toBe(false);
  });
});

describe('Security Integration Tests', () => {
  test('should perform end-to-end security validation', async () => {
    const auditor = new SecurityAuditor();
    
    // Perform audit
    const auditResult = await auditor.performAudit();
    
    // Validate input sanitization
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitizedInput = InputSanitizer.sanitizeString(maliciousInput);
    expect(sanitizedInput).not.toContain('<script>');
    
    // Validate transaction security
    const transaction = {
      instructions: [{ programId: '11111111111111111111111111111111', data: Buffer.from([]) }]
    };
    expect(TransactionSecurity.validateTransaction(transaction)).toBe(true);
    
    // Validate API key
    const apiKey = 'valid_api_key_123_456_789_012_345_678_901';
    expect(InputSanitizer.validateAPIKey(apiKey)).toBe(true);
    
    // All security checks should pass
    expect(auditResult.summary.score).toBeGreaterThanOrEqual(0);
  });

  test('should handle security edge cases', () => {
    // Test with null/undefined inputs
    expect(InputSanitizer.sanitizeString('')).toBe('');
    expect(TransactionSecurity.validateTransaction(null)).toBe(false);
    expect(TransactionSecurity.checkDoubleSpend(null, [])).toBe(false);
    
    // Test with very long inputs
    const longInput = 'a'.repeat(10000);
    const sanitized = InputSanitizer.sanitizeString(longInput);
    expect(sanitized.length).toBeLessThanOrEqual(10000);
    
    // Test with special characters
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const sanitizedSpecial = InputSanitizer.sanitizeString(specialChars);
    expect(sanitizedSpecial).toBeDefined();
  });
}); 