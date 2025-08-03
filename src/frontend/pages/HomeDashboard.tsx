import React, { useState, useEffect } from 'react';
import { PositionCard } from '../components/PositionCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ThemeToggle } from '../components/ThemeToggle';
import { TokenSearch } from '../components/TokenSearch';
import { WatchlistView } from '../components/WatchlistView';
import { DexScreenerView } from '../components/DexScreenerView';
import { useTheme } from '../store/hooks';
import { useAppSelector } from '../store';
import { Position, PerformanceMetrics } from '../../backend/database';

interface HomeDashboardProps {
  databaseManager?: any;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ databaseManager }) => {
  const { theme } = useTheme();
  const { navigation } = useAppSelector((state) => state.ui);
  const [positions, setPositions] = useState<Position[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'pnl' | 'apy'>('timestamp');
  const [activeTab, setActiveTab] = useState<'positions' | 'tokens' | 'watchlists' | 'dexscreener'>('positions');

  // Mock data for development
  const mockPositions: Position[] = [
    {
      id: 'pos_1',
      strategy: 'balanced',
      poolAddress: 'pool123',
      tokenA: 'SOL',
      tokenB: 'USDC',
      amountA: 100,
      amountB: 2000,
      entryPrice: 20.5,
      currentPrice: 21.0,
      timestamp: Date.now() - 86400000,
      status: 'active',
      pnl: 50,
      apy: 25.5
    },
    {
      id: 'pos_2',
      strategy: 'aggressive',
      poolAddress: 'pool456',
      tokenA: 'BONK',
      tokenB: 'USDC',
      amountA: 1000000,
      amountB: 500,
      entryPrice: 0.0005,
      currentPrice: 0.0006,
      timestamp: Date.now() - 172800000,
      status: 'active',
      pnl: 200,
      apy: 45.2
    },
    {
      id: 'pos_3',
      strategy: 'conservative',
      poolAddress: 'pool789',
      tokenA: 'RAY',
      tokenB: 'USDC',
      amountA: 50,
      amountB: 1000,
      entryPrice: 20.0,
      currentPrice: 19.5,
      timestamp: Date.now() - 259200000,
      status: 'closed',
      pnl: -25,
      apy: 15.8
    }
  ];

  const mockPerformanceMetrics: PerformanceMetrics = {
    id: 'perf_1',
    timestamp: Date.now(),
    totalValue: 10000,
    totalPnl: 500,
    totalApy: 25.5,
    activePositions: 2,
    closedPositions: 1,
    strategyBreakdown: JSON.stringify({
      balanced: { totalValue: 5000, totalPnl: 250, totalApy: 25.5, positionCount: 1 },
      aggressive: { totalValue: 3000, totalPnl: 200, totalApy: 45.2, positionCount: 1 },
      conservative: { totalValue: 2000, totalPnl: -25, totalApy: 15.8, positionCount: 1 }
    })
  };

  const mockWatchlists = [
    { id: 1, name: 'High Volume', createdAt: Date.now() - 86400000, updatedAt: Date.now(), tokenCount: 5 },
    { id: 2, name: 'Trending', createdAt: Date.now() - 172800000, updatedAt: Date.now(), tokenCount: 3 },
    { id: 3, name: 'My Picks', createdAt: Date.now() - 259200000, updatedAt: Date.now(), tokenCount: 2 }
  ];

  const mockWatchlistTokens = {
    1: [
      { id: 1, watchlistId: 1, tokenSymbol: 'SOL', tokenName: 'Solana', pairAddress: '0x123', chainId: 'solana', addedAt: Date.now() - 3600000 },
      { id: 2, watchlistId: 1, tokenSymbol: 'BONK', tokenName: 'Bonk', pairAddress: '0x456', chainId: 'solana', addedAt: Date.now() - 7200000 }
    ],
    2: [
      { id: 3, watchlistId: 2, tokenSymbol: 'RAY', tokenName: 'Raydium', pairAddress: '0x789', chainId: 'solana', addedAt: Date.now() - 10800000 }
    ],
    3: [
      { id: 4, watchlistId: 3, tokenSymbol: 'JUP', tokenName: 'Jupiter', pairAddress: '0xabc', chainId: 'solana', addedAt: Date.now() - 14400000 }
    ]
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPositions(mockPositions);
        setPerformanceMetrics(mockPerformanceMetrics);
        setError(null);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePositionClose = async (id: string) => {
    setPositions(prev => prev.map(pos => 
      pos.id === id ? { ...pos, status: 'closed' as const } : pos
    ));
  };

  const handlePositionUpdate = async (id: string, updates: Partial<Position>) => {
    setPositions(prev => prev.map(pos => 
      pos.id === id ? { ...pos, ...updates } : pos
    ));
  };

  const handleCreateWatchlist = async (name: string) => {
    // Implementation for creating watchlist
  };

  const handleUpdateWatchlist = async (id: number, name: string) => {
    // Implementation for updating watchlist
  };

  const handleDeleteWatchlist = async (id: number) => {
    // Implementation for deleting watchlist
  };

  const handleAddTokenToWatchlist = async (watchlistId: number, token: any) => {
    // Implementation for adding token to watchlist
  };

  const handleRemoveTokenFromWatchlist = async (watchlistId: number, tokenSymbol: string) => {
    // Implementation for removing token from watchlist
  };

  const handleRefreshTokenData = async () => {
    // Implementation for refreshing token data
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const filteredPositions = positions.filter(position => {
    if (filter === 'all') return true;
    return position.status === filter;
  });

  const sortedPositions = [...filteredPositions].sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return b.timestamp - a.timestamp;
      case 'pnl':
        return b.pnl - a.pnl;
      case 'apy':
        return b.apy - a.apy;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-red-400">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LS</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Liquidity Sentinel
                </h1>
              </div>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                Autonomous DeFi Dashboard
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(performanceMetrics?.totalValue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total P&L</p>
                <p className={`text-2xl font-bold ${performanceMetrics?.totalPnl && performanceMetrics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(performanceMetrics?.totalPnl || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Avg APY</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatPercentage(performanceMetrics?.totalApy || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Positions</p>
                <p className="text-2xl font-bold text-white">
                  {performanceMetrics?.activePositions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 mb-8">
          <div className="flex space-x-2">
            {[
              { id: 'positions', label: 'Positions', icon: '📊' },
              { id: 'tokens', label: 'Token Search', icon: '🔍' },
              { id: 'watchlists', label: 'Watchlists', icon: '⭐' },
              { id: 'dexscreener', label: 'DexScreener', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'positions' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Positions</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="timestamp">Sort by Date</option>
                  <option value="pnl">Sort by P&L</option>
                  <option value="apy">Sort by APY</option>
                </select>
              </div>
            </div>

            {/* Positions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedPositions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  onClose={handlePositionClose}
                  onUpdate={handlePositionUpdate}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-200"
                />
              ))}
            </div>

            {sortedPositions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No positions found</h3>
                <p className="text-gray-400">Start by creating your first liquidity position</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tokens' && (
          <TokenSearch />
        )}

        {activeTab === 'watchlists' && (
          <WatchlistView
            watchlists={mockWatchlists}
            watchlistTokens={mockWatchlistTokens}
            onCreateWatchlist={handleCreateWatchlist}
            onUpdateWatchlist={handleUpdateWatchlist}
            onDeleteWatchlist={handleDeleteWatchlist}
            onAddTokenToWatchlist={handleAddTokenToWatchlist}
            onRemoveTokenFromWatchlist={handleRemoveTokenFromWatchlist}
          />
        )}

        {activeTab === 'dexscreener' && (
          <DexScreenerView databaseManager={databaseManager} />
        )}
      </main>
    </div>
  );
}; 