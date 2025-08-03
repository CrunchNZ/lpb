# Design Technical Specification (DTS)
## Solana Liquidity Sentinel

### 1. System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Electron)    │◄──►│   (Node.js)     │◄──►│   APIs          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Database     │◄─────────────┘
                        │   (SQLite)     │
                        └─────────────────┘
```

### 2. Data Models

#### 2.1 Core Interfaces

```typescript
// Token Information
interface Token {
  address: string;
  symbol: string;
  name: string;
  marketCap: number;
  price: number;
  volume24h: number;
  tvl: number;
  sentiment: number; // -1 to 1
  trending: boolean;
}

// Position Data
interface Position {
  id: string;
  tokenAddress: string;
  strategy: StrategyType;
  entryPrice: number;
  currentPrice: number;
  size: number; // USD amount
  range: [number, number]; // price range
  status: 'active' | 'closed' | 'pending';
  pnl: number;
  entryTime: Date;
  exitTime?: Date;
}

// Strategy Configuration
interface StrategyConfig {
  type: StrategyType;
  riskTolerance: 'low' | 'medium' | 'high';
  maxPositionSize: number; // percentage of portfolio
  stopLoss: number; // percentage
  takeProfit: number; // percentage
  sentimentThreshold: number;
}

// Market Data
interface MarketData {
  token: Token;
  priceHistory: PricePoint[];
  volumeHistory: VolumePoint[];
  sentimentHistory: SentimentPoint[];
}

// Performance Metrics
interface PerformanceMetrics {
  totalPnl: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgTradeDuration: number;
}
```

#### 2.2 Enums and Types

```typescript
enum StrategyType {
  AGGRESSIVE = 'aggressive',
  BALANCED = 'balanced',
  CONSERVATIVE = 'conservative'
}

enum PositionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  PENDING = 'pending',
  ERROR = 'error'
}

enum SentimentLevel {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive'
}
```

### 3. Core Components Implementation

#### 3.1 Strategy Classes

**AggressiveStrategy.ts**
```typescript
class AggressiveStrategy implements Strategy {
  private config: StrategyConfig;
  
  constructor(config: StrategyConfig) {
    this.config = {
      ...config,
      type: StrategyType.AGGRESSIVE,
      maxPositionSize: 0.05, // 5% of portfolio
      stopLoss: 0.15, // 15%
      takeProfit: 0.50, // 50%
      sentimentThreshold: 0.3 // Positive sentiment required
    };
  }

  async shouldEnter(token: Token, marketData: MarketData): Promise<boolean> {
    // Entry conditions for aggressive strategy
    const sentiment = token.sentiment;
    const volume = token.volume24h;
    const marketCap = token.marketCap;
    
    return (
      sentiment > this.config.sentimentThreshold &&
      volume > 10000 && // $10K daily volume
      marketCap >= 50000 && marketCap <= 5000000 &&
      token.tvl > 10000 // $10K TVL minimum
    );
  }

  async calculatePositionSize(token: Token, portfolioValue: number): Promise<number> {
    // Aggressive position sizing based on sentiment and market cap
    const baseSize = portfolioValue * this.config.maxPositionSize;
    const sentimentMultiplier = Math.min(token.sentiment * 2, 1.5);
    const marketCapMultiplier = Math.min(token.marketCap / 1000000, 1);
    
    return baseSize * sentimentMultiplier * marketCapMultiplier;
  }

  async shouldExit(position: Position, currentData: MarketData): Promise<boolean> {
    const pnl = position.pnl;
    const sentiment = currentData.token.sentiment;
    
    // Exit conditions
    return (
      pnl <= -this.config.stopLoss * position.size || // Stop loss
      pnl >= this.config.takeProfit * position.size || // Take profit
      sentiment < -0.2 // Negative sentiment spike
    );
  }
}
```

**BalancedStrategy.ts**
```typescript
class BalancedStrategy implements Strategy {
  private config: StrategyConfig;
  
  constructor(config: StrategyConfig) {
    this.config = {
      ...config,
      type: StrategyType.BALANCED,
      maxPositionSize: 0.03, // 3% of portfolio
      stopLoss: 0.10, // 10%
      takeProfit: 0.30, // 30%
      sentimentThreshold: 0.1 // Lower threshold
    };
  }

  async shouldEnter(token: Token, marketData: MarketData): Promise<boolean> {
    // More conservative entry conditions
    const sentiment = token.sentiment;
    const volume = token.volume24h;
    const marketCap = token.marketCap;
    
    return (
      sentiment > this.config.sentimentThreshold &&
      volume > 50000 && // Higher volume requirement
      marketCap >= 100000 && marketCap <= 2000000 &&
      token.tvl > 25000 // Higher TVL requirement
    );
  }

  async calculatePositionSize(token: Token, portfolioValue: number): Promise<number> {
    // Balanced position sizing
    const baseSize = portfolioValue * this.config.maxPositionSize;
    const sentimentMultiplier = Math.min(token.sentiment * 1.5, 1.2);
    const marketCapMultiplier = Math.min(token.marketCap / 2000000, 0.8);
    
    return baseSize * sentimentMultiplier * marketCapMultiplier;
  }

  async shouldExit(position: Position, currentData: MarketData): Promise<boolean> {
    const pnl = position.pnl;
    const sentiment = currentData.token.sentiment;
    
    return (
      pnl <= -this.config.stopLoss * position.size ||
      pnl >= this.config.takeProfit * position.size ||
      sentiment < -0.3 // More conservative sentiment exit
    );
  }
}
```

**ConservativeStrategy.ts**
```typescript
class ConservativeStrategy implements Strategy {
  private config: StrategyConfig;
  
  constructor(config: StrategyConfig) {
    this.config = {
      ...config,
      type: StrategyType.CONSERVATIVE,
      maxPositionSize: 0.02, // 2% of portfolio
      stopLoss: 0.08, // 8%
      takeProfit: 0.25, // 25%
      sentimentThreshold: 0.2 // Higher threshold
    };
  }

  async shouldEnter(token: Token, marketData: MarketData): Promise<boolean> {
    // Very conservative entry conditions
    const sentiment = token.sentiment;
    const volume = token.volume24h;
    const marketCap = token.marketCap;
    
    return (
      sentiment > this.config.sentimentThreshold &&
      volume > 100000 && // High volume requirement
      marketCap >= 200000 && marketCap <= 1000000 &&
      token.tvl > 50000 // High TVL requirement
    );
  }

  async calculatePositionSize(token: Token, portfolioValue: number): Promise<number> {
    // Conservative position sizing
    const baseSize = portfolioValue * this.config.maxPositionSize;
    const sentimentMultiplier = Math.min(token.sentiment * 1.2, 1.0);
    const marketCapMultiplier = Math.min(token.marketCap / 1000000, 0.6);
    
    return baseSize * sentimentMultiplier * marketCapMultiplier;
  }

  async shouldExit(position: Position, currentData: MarketData): Promise<boolean> {
    const pnl = position.pnl;
    const sentiment = currentData.token.sentiment;
    
    return (
      pnl <= -this.config.stopLoss * position.size ||
      pnl >= this.config.takeProfit * position.size ||
      sentiment < -0.1 // Conservative sentiment exit
    );
  }
}
```

#### 3.2 Integration Layer

**meteora.ts**
```typescript
class MeteoraIntegration {
  private connection: Connection;
  private wallet: Wallet;

  constructor(rpcUrl: string, wallet: Wallet) {
    this.connection = new Connection(rpcUrl);
    this.wallet = wallet;
  }

  async createPosition(
    tokenA: string,
    tokenB: string,
    amount: number,
    range: [number, number]
  ): Promise<TransactionSignature> {
    try {
      // Meteora SDK integration for liquidity position creation
      const meteoraClient = new MeteoraClient(this.connection, this.wallet);
      
      const position = await meteoraClient.createPosition({
        tokenA,
        tokenB,
        amount,
        range,
        slippage: 0.01 // 1% slippage tolerance
      });

      return position.signature;
    } catch (error) {
      console.error('Meteora position creation failed:', error);
      throw new Error(`Failed to create Meteora position: ${error.message}`);
    }
  }

  async closePosition(positionId: string): Promise<TransactionSignature> {
    try {
      const meteoraClient = new MeteoraClient(this.connection, this.wallet);
      
      const result = await meteoraClient.closePosition(positionId);
      
      return result.signature;
    } catch (error) {
      console.error('Meteora position closure failed:', error);
      throw new Error(`Failed to close Meteora position: ${error.message}`);
    }
  }

  async getPositionValue(positionId: string): Promise<number> {
    try {
      const meteoraClient = new MeteoraClient(this.connection, this.wallet);
      
      const position = await meteoraClient.getPosition(positionId);
      
      return position.value;
    } catch (error) {
      console.error('Failed to get position value:', error);
      throw new Error(`Failed to get position value: ${error.message}`);
    }
  }
}
```

**jupiter.ts**
```typescript
class JupiterIntegration {
  private connection: Connection;
  private wallet: Wallet;

  constructor(rpcUrl: string, wallet: Wallet) {
    this.connection = new Connection(rpcUrl);
    this.wallet = wallet;
  }

  async swapTokens(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippage: number = 0.01
  ): Promise<TransactionSignature> {
    try {
      // Jupiter SDK integration for token swaps
      const jupiterClient = new JupiterClient(this.connection, this.wallet);
      
      const swap = await jupiterClient.swap({
        inputMint,
        outputMint,
        amount,
        slippage
      });

      return swap.signature;
    } catch (error) {
      console.error('Jupiter swap failed:', error);
      throw new Error(`Failed to execute Jupiter swap: ${error.message}`);
    }
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number
  ): Promise<SwapQuote> {
    try {
      const jupiterClient = new JupiterClient(this.connection, this.wallet);
      
      return await jupiterClient.getQuote({
        inputMint,
        outputMint,
        amount
      });
    } catch (error) {
      console.error('Failed to get Jupiter quote:', error);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }
}
```

#### 3.3 Utility Functions

**sentiment.ts**
```typescript
class SentimentAnalyzer {
  private twitterClient: TwitterApi;
  private vaderAnalyzer: SentimentIntensityAnalyzer;

  constructor(twitterBearerToken: string) {
    this.twitterClient = new TwitterApi(twitterBearerToken);
    this.vaderAnalyzer = new SentimentIntensityAnalyzer();
  }

  async getTokenSentiment(tokenSymbol: string): Promise<number> {
    try {
      // Search for tweets about the token
      const tweets = await this.twitterClient.v2.search(`${tokenSymbol} crypto`);
      
      if (!tweets.data || tweets.data.length === 0) {
        return 0; // Neutral if no tweets found
      }

      // Analyze sentiment for each tweet
      const sentiments = tweets.data.map(tweet => {
        const analysis = this.vaderAnalyzer.polarity_scores(tweet.text);
        return analysis.compound; // Compound score from -1 to 1
      });

      // Calculate average sentiment
      const averageSentiment = sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length;
      
      return Math.max(-1, Math.min(1, averageSentiment)); // Clamp to [-1, 1]
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return 0; // Return neutral on error
    }
  }

  async getMarketSentiment(): Promise<number> {
    try {
      // Analyze general crypto market sentiment
      const tweets = await this.twitterClient.v2.search('solana crypto');
      
      if (!tweets.data || tweets.data.length === 0) {
        return 0;
      }

      const sentiments = tweets.data.map(tweet => {
        const analysis = this.vaderAnalyzer.polarity_scores(tweet.text);
        return analysis.compound;
      });

      const averageSentiment = sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length;
      
      return Math.max(-1, Math.min(1, averageSentiment));
    } catch (error) {
      console.error('Market sentiment analysis failed:', error);
      return 0;
    }
  }
}
```

**rugcheck.ts**
```typescript
class RugCheckAnalyzer {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl);
  }

  async analyzeToken(tokenAddress: string): Promise<RugCheckResult> {
    try {
      // Get token metadata
      const tokenInfo = await this.connection.getTokenSupply(new PublicKey(tokenAddress));
      
      // Check for common rug pull indicators
      const checks = {
        liquidityLocked: await this.checkLiquidityLock(tokenAddress),
        ownershipRenounced: await this.checkOwnershipRenounced(tokenAddress),
        reasonableSupply: this.checkSupply(tokenInfo.value),
        contractVerified: await this.checkContractVerified(tokenAddress)
      };

      // Calculate risk score (0-100, lower is better)
      const riskScore = this.calculateRiskScore(checks);
      
      return {
        tokenAddress,
        riskScore,
        checks,
        isSafe: riskScore < 30 // Consider safe if risk score < 30
      };
    } catch (error) {
      console.error('Rug check failed:', error);
      throw new Error(`Failed to analyze token: ${error.message}`);
    }
  }

  private async checkLiquidityLock(tokenAddress: string): Promise<boolean> {
    // Check if liquidity is locked in a time-locked contract
    // Implementation depends on specific DEX and lock mechanisms
    return true; // Placeholder
  }

  private async checkOwnershipRenounced(tokenAddress: string): Promise<boolean> {
    // Check if contract ownership has been renounced
    // Implementation depends on specific contract structure
    return true; // Placeholder
  }

  private checkSupply(supply: number): boolean {
    // Check if supply is reasonable (not too high or too low)
    return supply > 1000000 && supply < 1000000000000; // 1M to 1T tokens
  }

  private async checkContractVerified(tokenAddress: string): Promise<boolean> {
    // Check if contract source code is verified
    // Implementation depends on block explorer API
    return true; // Placeholder
  }

  private calculateRiskScore(checks: any): number {
    let score = 0;
    
    if (!checks.liquidityLocked) score += 30;
    if (!checks.ownershipRenounced) score += 25;
    if (!checks.reasonableSupply) score += 20;
    if (!checks.contractVerified) score += 25;
    
    return Math.min(100, score);
  }
}
```

#### 3.4 Frontend Components

**PositionCard.tsx**
```typescript
interface PositionCardProps {
  position: Position;
  onClose: (positionId: string) => void;
  onAdjust: (positionId: string, newRange: [number, number]) => void;
}

const PositionCard: React.FC<PositionCardProps> = ({ position, onClose, onAdjust }) => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [newRange, setNewRange] = useState<[number, number]>(position.range);

  const pnlColor = position.pnl >= 0 ? 'text-green-500' : 'text-red-500';
  const pnlSign = position.pnl >= 0 ? '+' : '';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {position.tokenAddress}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {position.strategy} Strategy
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${pnlColor}`}>
            {pnlSign}${position.pnl.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {((position.pnl / position.size) * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Entry Price</p>
          <p className="font-medium">${position.entryPrice.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
          <p className="font-medium">${position.currentPrice.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Position Size</p>
          <p className="font-medium">${position.size.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            position.status === 'active' ? 'bg-green-100 text-green-800' :
            position.status === 'closed' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {position.status}
          </span>
        </div>
      </div>

      {position.status === 'active' && (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Price Range</p>
            <div className="flex items-center space-x-2">
              <span className="text-sm">${position.range[0].toFixed(6)}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${((position.currentPrice - position.range[0]) / 
                              (position.range[1] - position.range[0])) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm">${position.range[1].toFixed(6)}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setIsAdjusting(!isAdjusting)}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Adjust Range
            </button>
            <button
              onClick={() => onClose(position.id)}
              className="flex-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Close Position
            </button>
          </div>

          {isAdjusting && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Adjust price range for position
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Min Price</label>
                  <input
                    type="number"
                    value={newRange[0]}
                    onChange={(e) => setNewRange([parseFloat(e.target.value), newRange[1]])}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Max Price</label>
                  <input
                    type="number"
                    value={newRange[1]}
                    onChange={(e) => setNewRange([newRange[0], parseFloat(e.target.value)])}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAdjust(position.id, newRange)}
                    className="flex-1 px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setIsAdjusting(false)}
                    className="flex-1 px-2 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

**HomeDashboard.tsx**
```typescript
const HomeDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { positions, performance, isRunning } = useAppSelector(state => state.bot);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>(StrategyType.BALANCED);
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    // Load initial data
    dispatch(fetchPositions());
    dispatch(fetchPerformance());
  }, [dispatch]);

  const handleStartBot = () => {
    dispatch(startBot({ strategy: selectedStrategy, riskTolerance }));
  };

  const handleStopBot = () => {
    dispatch(stopBot());
  };

  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const activePositions = positions.filter(pos => pos.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Solana Liquidity Sentinel
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Autonomous liquidity farming for Solana meme coins
          </p>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total P&L</h3>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Positions</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {activePositions.length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Sharpe Ratio</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {performance.sharpeRatio.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(performance.winRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Bot Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Bot Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Strategy
              </label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value as StrategyType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={StrategyType.AGGRESSIVE}>Aggressive</option>
                <option value={StrategyType.BALANCED}>Balanced</option>
                <option value={StrategyType.CONSERVATIVE}>Conservative</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Tolerance
              </label>
              <select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={isRunning ? handleStopBot : handleStartBot}
                className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                  isRunning
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRunning ? 'Stop Bot' : 'Start Bot'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isRunning ? 'Bot is running' : 'Bot is stopped'}
            </span>
          </div>
        </div>

        {/* Positions Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Active Positions
          </h2>
          
          {activePositions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No active positions
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePositions.map(position => (
                <PositionCard
                  key={position.id}
                  position={position}
                  onClose={(id) => dispatch(closePosition(id))}
                  onAdjust={(id, range) => dispatch(adjustPosition({ id, range }))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 4. Database Schema

#### 4.1 SQLite Tables

```sql
-- Positions table
CREATE TABLE positions (
  id TEXT PRIMARY KEY,
  token_address TEXT NOT NULL,
  strategy TEXT NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  size REAL NOT NULL,
  range_min REAL NOT NULL,
  range_max REAL NOT NULL,
  status TEXT NOT NULL,
  pnl REAL NOT NULL,
  entry_time DATETIME NOT NULL,
  exit_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_pnl REAL NOT NULL,
  sharpe_ratio REAL NOT NULL,
  max_drawdown REAL NOT NULL,
  win_rate REAL NOT NULL,
  total_trades INTEGER NOT NULL,
  avg_trade_duration REAL NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Market data table
CREATE TABLE market_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_address TEXT NOT NULL,
  price REAL NOT NULL,
  volume_24h REAL NOT NULL,
  market_cap REAL NOT NULL,
  sentiment REAL NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuration table
CREATE TABLE configuration (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5. API Endpoints

#### 5.1 Backend API Routes

```typescript
// GET /api/positions - Get all positions
app.get('/api/positions', async (req, res) => {
  try {
    const positions = await db.all('SELECT * FROM positions ORDER BY created_at DESC');
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// POST /api/positions - Create new position
app.post('/api/positions', async (req, res) => {
  try {
    const { tokenAddress, strategy, entryPrice, size, range } = req.body;
    
    const position = {
      id: generateId(),
      token_address: tokenAddress,
      strategy,
      entry_price: entryPrice,
      current_price: entryPrice,
      size,
      range_min: range[0],
      range_max: range[1],
      status: 'active',
      pnl: 0,
      entry_time: new Date().toISOString()
    };
    
    await db.run(`
      INSERT INTO positions (id, token_address, strategy, entry_price, current_price, size, range_min, range_max, status, pnl, entry_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [position.id, position.token_address, position.strategy, position.entry_price, position.current_price, position.size, position.range_min, position.range_max, position.status, position.pnl, position.entry_time]);
    
    res.json(position);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create position' });
  }
});

// PUT /api/positions/:id - Update position
app.put('/api/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPrice, pnl, status, exitTime } = req.body;
    
    await db.run(`
      UPDATE positions 
      SET current_price = ?, pnl = ?, status = ?, exit_time = ?
      WHERE id = ?
    `, [currentPrice, pnl, status, exitTime, id]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update position' });
  }
});

// GET /api/performance - Get performance metrics
app.get('/api/performance', async (req, res) => {
  try {
    const metrics = await db.get('SELECT * FROM performance_metrics ORDER BY recorded_at DESC LIMIT 1');
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// POST /api/bot/start - Start the bot
app.post('/api/bot/start', async (req, res) => {
  try {
    const { strategy, riskTolerance } = req.body;
    
    // Start bot with configuration
    await bot.start({ strategy, riskTolerance });
    
    res.json({ success: true, message: 'Bot started successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start bot' });
  }
});

// POST /api/bot/stop - Stop the bot
app.post('/api/bot/stop', async (req, res) => {
  try {
    await bot.stop();
    res.json({ success: true, message: 'Bot stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop bot' });
  }
});
```

### 6. Testing Strategy

#### 6.1 Unit Tests

```typescript
// strategies.test.ts
describe('Strategy Classes', () => {
  let aggressiveStrategy: AggressiveStrategy;
  let balancedStrategy: BalancedStrategy;
  let conservativeStrategy: ConservativeStrategy;

  beforeEach(() => {
    const config: StrategyConfig = {
      type: StrategyType.AGGRESSIVE,
      riskTolerance: 'high',
      maxPositionSize: 0.05,
      stopLoss: 0.15,
      takeProfit: 0.50,
      sentimentThreshold: 0.3
    };

    aggressiveStrategy = new AggressiveStrategy(config);
    balancedStrategy = new BalancedStrategy(config);
    conservativeStrategy = new ConservativeStrategy(config);
  });

  describe('AggressiveStrategy', () => {
    it('should enter position with positive sentiment and adequate volume', async () => {
      const token: Token = {
        address: 'test-token',
        symbol: 'TEST',
        name: 'Test Token',
        marketCap: 1000000,
        price: 0.001,
        volume24h: 50000,
        tvl: 25000,
        sentiment: 0.4,
        trending: true
      };

      const marketData: MarketData = {
        token,
        priceHistory: [],
        volumeHistory: [],
        sentimentHistory: []
      };

      const shouldEnter = await aggressiveStrategy.shouldEnter(token, marketData);
      expect(shouldEnter).toBe(true);
    });

    it('should not enter position with negative sentiment', async () => {
      const token: Token = {
        address: 'test-token',
        symbol: 'TEST',
        name: 'Test Token',
        marketCap: 1000000,
        price: 0.001,
        volume24h: 50000,
        tvl: 25000,
        sentiment: -0.1,
        trending: true
      };

      const marketData: MarketData = {
        token,
        priceHistory: [],
        volumeHistory: [],
        sentimentHistory: []
      };

      const shouldEnter = await aggressiveStrategy.shouldEnter(token, marketData);
      expect(shouldEnter).toBe(false);
    });
  });
});
```

#### 6.2 Integration Tests

```typescript
// integrations.test.ts
describe('Integration Tests', () => {
  let meteoraIntegration: MeteoraIntegration;
  let jupiterIntegration: JupiterIntegration;

  beforeEach(() => {
    const connection = new Connection('https://api.devnet.solana.com');
    const wallet = new Wallet(); // Mock wallet
    
    meteoraIntegration = new MeteoraIntegration('https://api.devnet.solana.com', wallet);
    jupiterIntegration = new JupiterIntegration('https://api.devnet.solana.com', wallet);
  });

  describe('Meteora Integration', () => {
    it('should create position successfully', async () => {
      const tokenA = 'So11111111111111111111111111111111111111112'; // SOL
      const tokenB = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
      const amount = 1000; // $1000
      const range: [number, number] = [0.9, 1.1]; // 10% range

      const signature = await meteoraIntegration.createPosition(tokenA, tokenB, amount, range);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });
  });

  describe('Jupiter Integration', () => {
    it('should get quote successfully', async () => {
      const inputMint = 'So11111111111111111111111111111111111111112'; // SOL
      const outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
      const amount = 1000000000; // 1 SOL

      const quote = await jupiterIntegration.getQuote(inputMint, outputMint, amount);
      expect(quote).toBeDefined();
      expect(quote.inputAmount).toBe(amount);
      expect(quote.outputAmount).toBeGreaterThan(0);
    });
  });
});
```

### 7. Deployment Configuration

#### 7.1 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

#### 7.2 Environment Configuration

```env
# .env.example
NODE_ENV=production
PORT=3000

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com

# API Keys
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
METEORA_API_KEY=your_meteora_api_key
JUPITER_API_KEY=your_jupiter_api_key

# Database
DATABASE_URL=sqlite:./data/sls.db

# Bot Configuration
MAX_POSITIONS=50
MAX_POSITION_SIZE=0.05
DEFAULT_STRATEGY=balanced
RISK_TOLERANCE=medium

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/sls.log
```

### 8. Security Considerations

#### 8.1 API Key Management
- Store API keys in environment variables
- Use secure key management services in production
- Rotate keys regularly
- Implement rate limiting

#### 8.2 Transaction Security
- Validate all transaction parameters
- Implement slippage protection
- Use secure wallet integration
- Log all transactions for audit

#### 8.3 Error Handling
- Graceful degradation on API failures
- Retry mechanisms with exponential backoff
- Comprehensive error logging
- User-friendly error messages

### 9. Performance Optimization

#### 9.1 Caching Strategy
- Cache token metadata for 5 minutes
- Cache sentiment data for 1 minute
- Cache price data for 30 seconds
- Implement Redis for distributed caching

#### 9.2 Database Optimization
- Index frequently queried columns
- Use connection pooling
- Implement query optimization
- Regular database maintenance

#### 9.3 Memory Management
- Implement garbage collection monitoring
- Use streaming for large datasets
- Optimize image and asset loading
- Monitor memory leaks

### 10. Monitoring and Alerting

#### 10.1 Metrics to Monitor
- Bot uptime and performance
- Position success/failure rates
- API response times
- Error rates and types
- P&L performance

#### 10.2 Alerting Rules
- Bot offline for >5 minutes
- Error rate >5% in 1 hour
- P&L loss >10% in 1 hour
- API rate limit approaching

This DTS provides comprehensive technical specifications for autonomous development of the Solana Liquidity Sentinel project. All components are designed for modularity, testability, and scalability. 