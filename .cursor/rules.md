# Cursor Rules for Solana Liquidity Sentinel

## Autonomous Development Guidelines

### Context Engineering
- Always reference `docs/PRD.md` and `docs/DTS.md` when implementing features
- Use `docs/agent-prompts.md` for structured development workflows
- Maintain dense documentation in code files for quick reference
- Follow the modular development approach outlined in the project structure

### Code Standards
- **TypeScript First**: Use strict TypeScript with proper interfaces and types
- **Modular Design**: Keep files under 300 lines, split when necessary
- **Test-Driven**: Generate unit tests for all new functions and components
- **Error Handling**: Implement comprehensive try-catch blocks for all external calls
- **Documentation**: Include JSDoc comments referencing PRD/DTS sections

### Development Workflow
1. **Load Context**: Reference relevant PRD/DTS sections
2. **Generate Code**: Use agent prompts for structured development
3. **Test First**: Create tests before implementing features
4. **Validate**: Run tests and fix issues before proceeding
5. **Document**: Update documentation with each change

### File Organization
```
src/
├── backend/           # Node.js bot logic
│   ├── strategies/    # Strategy classes (max 300 lines)
│   ├── integrations/  # SDK wrappers
│   ├── utils/         # Helper functions
│   └── index.ts       # Main bot entry
├── frontend/          # React components
│   ├── components/    # UI components
│   ├── pages/         # Page components
│   └── store/         # Redux state
└── main.ts           # Electron main process
```

### Testing Strategy
- **Unit Tests**: Jest for all backend functions and frontend components
- **Integration Tests**: Test SDK integrations and API endpoints
- **E2E Tests**: Playwright for complete user workflows
- **Backtesting**: Historical data validation for strategies

### Security Guidelines
- **API Keys**: Store in environment variables, never in code
- **Input Validation**: Validate all user inputs and API responses
- **Error Handling**: Don't expose sensitive information in error messages
- **Audit Trail**: Log all transactions and important events

### Performance Optimization
- **Caching**: Implement Redis for frequently accessed data
- **Database**: Optimize queries and use proper indexing
- **UI**: Use React.memo and proper dependency arrays
- **Monitoring**: Track performance metrics and error rates

### Autonomous Development Best Practices

#### For AI Agents:
1. **Context Awareness**: Always check PRD/DTS before implementing
2. **Modular Approach**: Break complex features into smaller, testable components
3. **Error Prevention**: Use guardrails and validation throughout
4. **Documentation Density**: Include relevant context in code comments
5. **Test Coverage**: Aim for >80% test coverage on new code

#### Code Quality Standards:
- **Readability**: Write self-documenting code with clear variable names
- **Maintainability**: Follow SOLID principles and clean architecture
- **Scalability**: Design for future expansion and feature additions
- **Reliability**: Implement proper error handling and recovery mechanisms

#### Development Phases:
1. **Phase 1**: Backend foundation (strategies, integrations, utils)
2. **Phase 2**: Frontend development (components, pages, state)
3. **Phase 3**: Testing and validation (unit, integration, E2E)
4. **Phase 4**: Integration and deployment (production readiness)

### Error Handling Patterns
```typescript
// Standard error handling pattern
try {
  const result = await externalApiCall();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  // Log for debugging
  logger.error('API call failed', { error, context });
  // Return safe default or throw user-friendly error
  throw new Error('Service temporarily unavailable');
}
```

### Testing Patterns
```typescript
// Unit test pattern
describe('Component/Function Name', () => {
  it('should handle normal case', async () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = await functionUnderTest(input);
    
    // Assert
    expect(result).toEqual(expectedOutput);
  });

  it('should handle error case', async () => {
    // Arrange
    const invalidInput = { /* invalid data */ };
    
    // Act & Assert
    await expect(functionUnderTest(invalidInput))
      .rejects.toThrow('Expected error message');
  });
});
```

### Documentation Standards
```typescript
/**
 * Calculates position size based on strategy and market conditions
 * 
 * @param token - Token information including market cap and sentiment
 * @param portfolioValue - Total portfolio value in USD
 * @returns Position size in USD
 * 
 * @reference PRD.md#4.1 - Risk Management requirements
 * @reference DTS.md#3.1 - Strategy implementation details
 */
async function calculatePositionSize(
  token: Token, 
  portfolioValue: number
): Promise<number> {
  // Implementation
}
```

### Environment Configuration
```typescript
// Environment validation
const requiredEnvVars = [
  'TWITTER_BEARER_TOKEN',
  'SOLANA_RPC_URL',
  'METEORA_API_KEY',
  'JUPITER_API_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

### Success Metrics
- [ ] All tests pass (>80% coverage)
- [ ] No TypeScript errors
- [ ] ESLint passes with no warnings
- [ ] Performance meets PRD requirements
- [ ] Security audit passes
- [ ] Documentation is complete and accurate

### Continuous Improvement
- **Code Reviews**: Self-review using AI assistance
- **Refactoring**: Regularly refactor large files into smaller modules
- **Dependency Updates**: Keep packages updated and secure
- **Performance Monitoring**: Track and optimize critical paths
- **User Feedback**: Incorporate feedback into development cycles

This rules file ensures consistent, high-quality autonomous development of the Solana Liquidity Sentinel project. 