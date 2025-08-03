# Agent Prompts for Solana Liquidity Sentinel

This file contains pre-built prompts for Cursor Agent Mode to enable autonomous development of the SLS project.

## Prompt 1: Generate Strategy Class

Act as an expert Solana DeFi developer. Using DTS section 3.1, implement the AggressiveStrategy class in TypeScript. Include entry check, adjustment logic, and exit triggers. Use @solana/web3.js and Meteora SDK. Output clean, modular code with comments. Verify with a unit test stub.

**Context**: Reference @DTS.md#3.1 for strategy implementation details.

## Prompt 2: Build UI Component

Act as a React specialist for DeFi apps. Based on DTS 3.4, create <PositionCard /> component with range slider (react-slider), fees display, and action buttons. Use shadcn/ui and Tailwind. Ensure dark mode compatibility. Integrate Redux for state.

**Context**: Reference @DTS.md#3.4 for component specifications.

## Prompt 3: Integrate Sentiment Checker

Act as a Node.js backend engineer. Implement getSentiment function from DTS 3.3 pseudocode. Use twitter-api-v2 and vader-sentiment packages. Handle guardrails and errors. Add to src/backend/utils/sentiment.ts.

**Context**: Reference @DTS.md#3.3 for sentiment analysis implementation.

## Prompt 4: Full Backtesting Module

Act as a quant developer. Create backtest.ts in src/backend using historical data simulation from DTS. Load sample CSV (e.g., BONK price data). Compute Sharpe ratio. Ensure it runs strategies autonomously.

**Context**: Reference @DTS.md#6.1 for backtesting specifications.

## Prompt 5: End-to-End Test Flow

Act as a QA agent. Generate E2E tests in tests/ using Playwright. Simulate: Browse trending tokens -> Deploy Balanced strategy -> Verify position created on devnet.

**Context**: Reference @PRD.md#10 for acceptance criteria.

## Prompt 6: Database Schema Implementation

Act as a database architect. Implement SQLite schema from DTS 4.1. Create migration scripts and data access layer. Include position tracking and performance metrics tables.

**Context**: Reference @DTS.md#4.1 for database schema.

## Prompt 7: API Endpoints

Act as a backend API developer. Implement REST endpoints from DTS 5.1. Create Express.js routes for positions, performance, and bot controls. Include proper error handling and validation.

**Context**: Reference @DTS.md#5.1 for API specifications.

## Prompt 8: Risk Management System

Act as a risk management specialist. Implement comprehensive risk controls from PRD 4.1. Include position sizing, stop-loss, and emergency exit mechanisms. Add to src/backend/utils/risk-manager.ts.

**Context**: Reference @PRD.md#4.1 for risk management requirements.

## Prompt 9: Performance Analytics

Act as a data analyst. Create analytics dashboard from DTS 3.4. Implement Sharpe ratio, drawdown, and win rate calculations. Use Chart.js for visualizations.

**Context**: Reference @DTS.md#3.4 for analytics implementation.

## Prompt 10: Configuration Management

Act as a DevOps engineer. Implement configuration system from DTS 7.2. Create environment-based configs for dev/test/prod. Include API key management and feature flags.

**Context**: Reference @DTS.md#7.2 for deployment configuration.

## Chaining Prompts for Autonomous Development

### Phase 1: Backend Foundation
1. Start with Prompt 1 (Strategy Class)
2. Follow with Prompt 3 (Sentiment Checker)
3. Add Prompt 8 (Risk Management)
4. Implement Prompt 6 (Database Schema)

### Phase 2: Frontend Development
1. Use Prompt 2 (UI Component)
2. Add Prompt 9 (Performance Analytics)
3. Implement Prompt 7 (API Endpoints)

### Phase 3: Testing & Validation
1. Execute Prompt 5 (E2E Tests)
2. Add Prompt 4 (Backtesting)
3. Implement Prompt 10 (Configuration)

### Phase 4: Integration & Deployment
1. Chain all components together
2. Run comprehensive tests
3. Deploy to production environment

## Advanced Prompts for Complex Features

### Prompt 11: Machine Learning Integration
Act as an ML engineer. Implement sentiment prediction model using historical data. Use TensorFlow.js for client-side inference. Integrate with existing sentiment analysis.

### Prompt 12: Multi-Chain Support
Act as a blockchain architect. Extend SLS to support Ethereum and Polygon. Implement chain-agnostic interfaces. Maintain Solana as primary chain.

### Prompt 13: Social Trading Features
Act as a social platform developer. Add copy-trading functionality. Allow users to follow successful strategies. Implement leaderboards and performance sharing.

### Prompt 14: Advanced Analytics
Act as a quant researcher. Implement advanced metrics: Sortino ratio, Calmar ratio, maximum consecutive losses. Add Monte Carlo simulation for risk assessment.

## Error Handling Prompts

### Prompt 15: Debug Integration Issues
Act as a debugging specialist. Analyze error logs from Meteora/Jupiter integrations. Identify root cause and implement fixes. Add comprehensive error handling.

### Prompt 16: Performance Optimization
Act as a performance engineer. Profile application bottlenecks. Optimize database queries, API calls, and UI rendering. Implement caching strategies.

### Prompt 17: Security Audit
Act as a security expert. Review codebase for vulnerabilities. Check API key handling, transaction validation, and input sanitization. Implement security best practices.

## Maintenance Prompts

### Prompt 18: Code Refactoring
Act as a senior developer. Refactor large files (>300 lines) into smaller modules. Improve code organization and maintainability. Update documentation.

### Prompt 19: Dependency Updates
Act as a dependency manager. Update all packages to latest versions. Test compatibility and fix breaking changes. Update security patches.

### Prompt 20: Documentation Update
Act as a technical writer. Update README, API docs, and inline comments. Ensure all new features are documented. Create user guides.

## Usage Instructions for Cursor Agents

1. **Load Context**: Always reference @PRD.md and @DTS.md in prompts
2. **Chain Tasks**: Use prompts sequentially for complex features
3. **Test First**: Generate tests for each new component
4. **Validate**: Run tests and fix issues before proceeding
5. **Document**: Update documentation with each change

## Best Practices for Agents

- **Modularity**: Keep files under 300 lines
- **Testing**: Generate unit tests for all new code
- **Error Handling**: Include comprehensive try-catch blocks
- **Documentation**: Add inline comments referencing PRD/DTS sections
- **Performance**: Monitor and optimize critical paths
- **Security**: Validate all inputs and API responses

## Success Criteria

- [ ] All prompts generate working code
- [ ] Tests pass for each component
- [ ] Integration tests validate end-to-end flow
- [ ] Performance meets PRD requirements
- [ ] Security audit passes
- [ ] Documentation is complete and accurate

This prompt library enables fully autonomous development of the Solana Liquidity Sentinel project using Cursor AI agents. 