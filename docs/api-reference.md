# API Reference - Solana Liquidity Sentinel

## Overview

This document provides comprehensive API documentation for the Solana Liquidity Sentinel bot, including all public interfaces, classes, and functions available for integration and extension.

## Table of Contents

1. [Strategy Classes](#strategy-classes)
2. [Integration SDKs](#integration-sdks)
3. [Utility Functions](#utility-functions)
4. [Database Layer](#database-layer)
5. [Frontend Components](#frontend-components)
6. [State Management](#state-management)

## Strategy Classes

### Base Strategy Interface

```typescript
interface IStrategy {
  name: string;
  riskLevel: RiskLevel;
  execute(position: Position): Promise<StrategyResult>;
  calculatePositionSize(capital: number, risk: number): number;
  shouldExit(position: Position, marketData: MarketData): boolean;
}
```

### AggressiveStrategy

**Location**: `src/backend/strategies/AggressiveStrategy.ts`

**Description**: High-risk, high-reward strategy targeting maximum yield with aggressive position sizing.

**Key Methods**:
- `execute(position: Position): Promise<StrategyResult>`
- `calculatePositionSize(capital: number, risk: number): number`
- `shouldExit(position: Position, marketData: MarketData): boolean`

**Usage Example**:
```typescript
import { AggressiveStrategy } from '../src/backend/strategies/AggressiveStrategy';

const strategy = new AggressiveStrategy();
const result = await strategy.execute(position);
```

### BalancedStrategy

**Location**: `src/backend/strategies/BalancedStrategy.ts`

**Description**: Moderate risk strategy balancing yield and capital preservation.

**Key Methods**:
- `execute(position: Position): Promise<StrategyResult>`
- `calculatePositionSize(capital: number, risk: number): number`
- `shouldExit(position: Position, marketData: MarketData): boolean`

### ConservativeStrategy

**Location**: `src/backend/strategies/ConservativeStrategy.ts`

**Description**: Low-risk strategy prioritizing capital preservation over yield.

**Key Methods**:
- `execute(position: Position): Promise<StrategyResult>`
- `calculatePositionSize(capital: number, risk: number): number`
- `shouldExit(position: Position, marketData: MarketData): boolean`

### StrategyFactory

**Location**: `src/backend/strategies/StrategyFactory.ts`

**Description**: Factory class for creating strategy instances.

**Methods**:
- `createStrategy(type: StrategyType): IStrategy`
- `getAvailableStrategies(): StrategyType[]`

**Usage Example**:
```typescript
import { StrategyFactory } from '../src/backend/strategies/StrategyFactory';

const factory = new StrategyFactory();
const strategy = factory.createStrategy('aggressive');
```

### StrategyManager

**Location**: `src/backend/strategies/StrategyManager.ts`

**Description**: Manages strategy execution and lifecycle.

**Methods**:
- `addStrategy(strategy: IStrategy): void`
- `executeStrategy(strategyName: string, position: Position): Promise<StrategyResult>`
- `getStrategyPerformance(strategyName: string): PerformanceMetrics`

## Integration SDKs

### Meteora Integration

**Location**: `src/backend/integrations/meteora.ts`

**Description**: Integration with Meteora DLMM for liquidity pool operations.

**Key Functions**:
- `createPool(connection: Connection, config: PoolConfig): Promise<Pool>`
- `addLiquidity(pool: Pool, amount: number, range: Range): Promise<Transaction>`
- `removeLiquidity(pool: Pool, position: Position): Promise<Transaction>`
- `collectFees(pool: Pool, position: Position): Promise<Transaction>`

**Usage Example**:
```typescript
import { MeteoraIntegration } from '../src/backend/integrations/meteora';

const meteora = new MeteoraIntegration(connection);
const pool = await meteora.createPool(poolConfig);
const tx = await meteora.addLiquidity(pool, amount, range);
```

### Jupiter Integration

**Location**: `src/backend/integrations/jupiter.ts`

**Description**: Integration with Jupiter for token swaps and routing.

**Key Functions**:
- `getQuote(inputMint: string, outputMint: string, amount: number): Promise<Quote>`
- `executeSwap(quote: Quote, wallet: Wallet): Promise<Transaction>`
- `getRoutes(inputMint: string, outputMint: string, amount: number): Promise<Route[]>`

### Wallet Integration

**Location**: `src/backend/integrations/wallet.ts`

**Description**: Wallet connection and transaction signing utilities.

**Key Functions**:
- `connectWallet(provider: WalletProvider): Promise<Wallet>`
- `signTransaction(transaction: Transaction, wallet: Wallet): Promise<SignedTransaction>`
- `getBalance(wallet: Wallet): Promise<number>`

## Utility Functions

### Sentiment Analysis

**Location**: `src/backend/utils/sentiment.ts`

**Description**: Twitter sentiment analysis using VADER algorithm.

**Key Functions**:
- `analyzeSentiment(text: string): SentimentScore`
- `getTwitterSentiment(symbol: string): Promise<SentimentData>`
- `calculateSentimentScore(tweets: Tweet[]): number`

### Risk Management

**Location**: `src/backend/utils/risk.ts`

**Description**: Risk management and position sizing utilities.

**Key Functions**:
- `calculatePositionSize(capital: number, risk: number): number`
- `calculateStopLoss(position: Position, marketData: MarketData): number`
- `validateRiskLimits(position: Position): boolean`

### Market Data

**Location**: `src/backend/utils/market.ts`

**Description**: Market data utilities and price feeds.

**Key Functions**:
- `getTokenPrice(symbol: string): Promise<number>`
- `getMarketData(symbol: string): Promise<MarketData>`
- `calculateVolatility(prices: number[]): number`

### Performance Analytics

**Location**: `src/backend/utils/performance.ts`

**Description**: Performance calculation and analytics utilities.

**Key Functions**:
- `calculateSharpeRatio(returns: number[]): number`
- `calculateMaxDrawdown(equity: number[]): number`
- `calculateWinRate(trades: Trade[]): number`

## Database Layer

### DatabaseManager

**Location**: `src/backend/database/DatabaseManager.ts`

**Description**: Main database connection and management.

**Methods**:
- `connect(): Promise<void>`
- `disconnect(): Promise<void>`
- `getConnection(): Database`

### PositionDAO

**Location**: `src/backend/database/PositionDAO.ts`

**Description**: Data access object for position management.

**Methods**:
- `createPosition(position: Position): Promise<void>`
- `updatePosition(id: string, updates: Partial<Position>): Promise<void>`
- `getPositions(filters?: PositionFilters): Promise<Position[]>`
- `deletePosition(id: string): Promise<void>`

### PerformanceDAO

**Location**: `src/backend/database/PerformanceDAO.ts`

**Description**: Data access object for performance metrics.

**Methods**:
- `savePerformance(metrics: PerformanceMetrics): Promise<void>`
- `getPerformanceHistory(period: string): Promise<PerformanceMetrics[]>`
- `calculateAggregateMetrics(): Promise<AggregateMetrics>`

## Frontend Components

### PositionCard

**Location**: `src/frontend/components/PositionCard.tsx`

**Description**: Displays individual position information.

**Props**:
- `position: Position`
- `onEdit?: (position: Position) => void`
- `onDelete?: (id: string) => void`

**Usage Example**:
```typescript
import { PositionCard } from '../src/frontend/components/PositionCard';

<PositionCard 
  position={position}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### PerformanceAnalytics

**Location**: `src/frontend/components/PerformanceAnalytics.tsx`

**Description**: Performance charts and analytics display.

**Props**:
- `data: PerformanceData`
- `period: string`
- `onPeriodChange?: (period: string) => void`

### StrategyConfig

**Location**: `src/frontend/components/StrategyConfig.tsx`

**Description**: Strategy configuration interface.

**Props**:
- `strategy: IStrategy`
- `onSave: (config: StrategyConfig) => void`
- `onCancel: () => void`

## State Management

### Bot Slice

**Location**: `src/frontend/store/slices/botSlice.ts`

**Description**: Redux slice for bot state management.

**State Interface**:
```typescript
interface BotState {
  isRunning: boolean;
  currentStrategy: string;
  positions: Position[];
  performance: PerformanceMetrics;
}
```

**Actions**:
- `startBot()`
- `stopBot()`
- `setStrategy(strategy: string)`
- `updatePositions(positions: Position[])`

### Performance Slice

**Location**: `src/frontend/store/slices/performanceSlice.ts`

**Description**: Redux slice for performance data.

**State Interface**:
```typescript
interface PerformanceState {
  metrics: PerformanceMetrics;
  history: PerformanceMetrics[];
  loading: boolean;
  error: string | null;
}
```

### UI Slice

**Location**: `src/frontend/store/slices/uiSlice.ts`

**Description**: Redux slice for UI state management.

**State Interface**:
```typescript
interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  modals: ModalState;
}
```

## Error Handling

### Error Types

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STRATEGY_ERROR = 'STRATEGY_ERROR'
}
```

### Error Handling Pattern

```typescript
try {
  const result = await strategy.execute(position);
  return result;
} catch (error) {
  if (error instanceof NetworkError) {
    // Handle network errors
  } else if (error instanceof TransactionError) {
    // Handle transaction errors
  } else {
    // Handle generic errors
  }
}
```

## Configuration

### Environment Variables

```env
# Required
TWITTER_BEARER_TOKEN=your_twitter_token
SOLANA_RPC_URL=your_rpc_endpoint
METEORA_API_KEY=your_meteora_key
JUPITER_API_KEY=your_jupiter_key

# Optional
LOG_LEVEL=info
ENVIRONMENT=development
MAX_POSITIONS=100
RISK_TOLERANCE=0.02
```

### Configuration Interface

```typescript
interface BotConfig {
  environment: 'development' | 'test' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxPositions: number;
  riskTolerance: number;
  apiKeys: {
    twitter: string;
    solana: string;
    meteora: string;
    jupiter: string;
  };
}
```

## Testing

### Unit Tests

All API functions include comprehensive unit tests located in the `tests/` directory.

**Running Tests**:
```bash
npm test                    # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:e2e          # Run end-to-end tests
```

### Test Examples

```typescript
// Strategy test example
describe('AggressiveStrategy', () => {
  it('should calculate correct position size', () => {
    const strategy = new AggressiveStrategy();
    const size = strategy.calculatePositionSize(1000, 0.02);
    expect(size).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

### Optimization Guidelines

1. **Database Queries**: Use indexes and optimize queries for large datasets
2. **API Calls**: Implement caching and rate limiting
3. **UI Rendering**: Use React.memo and useMemo for expensive calculations
4. **Memory Management**: Dispose of unused connections and listeners

### Monitoring

```typescript
// Performance monitoring example
const startTime = performance.now();
const result = await strategy.execute(position);
const duration = performance.now() - startTime;

if (duration > 2000) {
  logger.warn(`Strategy execution took ${duration}ms`);
}
```

## Security

### Best Practices

1. **API Key Management**: Store keys in environment variables
2. **Transaction Signing**: Use secure wallet integration
3. **Input Validation**: Validate all user inputs
4. **Error Handling**: Don't expose sensitive information in errors

### Security Audit

The codebase includes comprehensive security testing in `tests/security.test.ts`.

---

**Last Updated**: Current session
**Version**: 1.0.0
**Maintainer**: AI Development Team 