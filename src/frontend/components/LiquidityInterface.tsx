import React, { useState } from 'react';
import { Droplets, Layers, Zap, TrendingUp, Search, Plus, Settings, AlertCircle, CheckCircle, XCircle, Filter } from 'lucide-react';
import { PoolCard } from './PoolCard';

interface Pool {
  id: number;
  poolName: string;
  platform: 'Raydium' | 'Meteora' | 'Orca';
  tvl: number;
  apr: number;
  userLiquidity: number;
  contractAddress: string;
  tokenA: string;
  tokenB: string;
  feeTier: number;
  range?: string;
  impermanentLoss?: number;
}

interface PlatformStats {
  name: string;
  poolCount: number;
  totalTvl: number;
  totalApr: number;
  icon: React.ReactNode;
  color: string;
}

// Mock pool data for demonstration
const mockPools: Pool[] = [
  {
    id: 1,
    poolName: 'SOL-USDC',
    platform: 'Raydium',
    tvl: 2500000,
    apr: 15.2,
    userLiquidity: 12500,
    contractAddress: '7qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm',
    tokenA: 'SOL',
    tokenB: 'USDC',
    feeTier: 0.3,
    range: '0.95x - 1.05x',
    impermanentLoss: 0.2,
  },
  {
    id: 2,
    poolName: 'BONK-SOL',
    platform: 'Meteora',
    tvl: 1800000,
    apr: 22.8,
    userLiquidity: 8500,
    contractAddress: '8HoQnePLqPj4M7PUDzfw8eWY39tUKD4NVBaQU5S5YbaK',
    tokenA: 'BONK',
    tokenB: 'SOL',
    feeTier: 0.5,
    range: '0.90x - 1.10x',
    impermanentLoss: 1.5,
  },
  {
    id: 3,
    poolName: 'USDC-USDT',
    platform: 'Orca',
    tvl: 5000000,
    apr: 8.5,
    userLiquidity: 25000,
    contractAddress: '2p7nYbtPBgtmY69NsE8DAW6WRp7mAwjmsQCBnyFBEK5n',
    tokenA: 'USDC',
    tokenB: 'USDT',
    feeTier: 0.1,
    range: '0.99x - 1.01x',
    impermanentLoss: 0.1,
  },
  {
    id: 4,
    poolName: 'RAY-SOL',
    platform: 'Raydium',
    tvl: 1200000,
    apr: 18.7,
    userLiquidity: 6000,
    contractAddress: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2',
    tokenA: 'RAY',
    tokenB: 'SOL',
    feeTier: 0.3,
    range: '0.92x - 1.08x',
    impermanentLoss: 0.8,
  },
  {
    id: 5,
    poolName: 'JUP-USDC',
    platform: 'Meteora',
    tvl: 3200000,
    apr: 25.3,
    userLiquidity: 15000,
    contractAddress: '6MLxLqiXaaSUpkwMJj2yQpQZvL1TkQnSZKqKj8KqKqKqK',
    tokenA: 'JUP',
    tokenB: 'USDC',
    feeTier: 0.5,
    range: '0.88x - 1.12x',
    impermanentLoss: 2.1,
  },
  {
    id: 6,
    poolName: 'ORCA-SOL',
    platform: 'Orca',
    tvl: 2800000,
    apr: 12.1,
    userLiquidity: 18000,
    contractAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    tokenA: 'ORCA',
    tokenB: 'SOL',
    feeTier: 0.3,
    range: '0.94x - 1.06x',
    impermanentLoss: 0.5,
  },
];

export const LiquidityInterface: React.FC = () => {
  const [selectedPool, setSelectedPool] = useState<number | null>(null);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [showContractInput, setShowContractInput] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'apr' | 'tvl' | 'name'>('apr');

  // Platform statistics
  const platformStats: PlatformStats[] = [
    {
      name: 'Raydium CLMM',
      poolCount: mockPools.filter(p => p.platform === 'Raydium').length,
      totalTvl: mockPools.filter(p => p.platform === 'Raydium').reduce((sum, p) => sum + p.tvl, 0),
      totalApr: mockPools.filter(p => p.platform === 'Raydium').reduce((sum, p) => sum + p.apr, 0) / mockPools.filter(p => p.platform === 'Raydium').length,
      icon: <Layers className="w-6 h-6" />,
      color: 'text-purple-400',
    },
    {
      name: 'Meteora DLMM',
      poolCount: mockPools.filter(p => p.platform === 'Meteora').length,
      totalTvl: mockPools.filter(p => p.platform === 'Meteora').reduce((sum, p) => sum + p.tvl, 0),
      totalApr: mockPools.filter(p => p.platform === 'Meteora').reduce((sum, p) => sum + p.apr, 0) / mockPools.filter(p => p.platform === 'Meteora').length,
      icon: <Zap className="w-6 h-6" />,
      color: 'text-yellow-400',
    },
    {
      name: 'Orca Whirlpools',
      poolCount: mockPools.filter(p => p.platform === 'Orca').length,
      totalTvl: mockPools.filter(p => p.platform === 'Orca').reduce((sum, p) => sum + p.tvl, 0),
      totalApr: mockPools.filter(p => p.platform === 'Orca').reduce((sum, p) => sum + p.apr, 0) / mockPools.filter(p => p.platform === 'Orca').length,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-green-400',
    },
  ];

  // Filter and sort pools
  const filteredPools = mockPools
    .filter(pool => {
      const matchesPlatform = selectedPlatform === 'all' || pool.platform.toLowerCase() === selectedPlatform.toLowerCase();
      const matchesSearch = pool.poolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pool.tokenA.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pool.tokenB.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesPlatform && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'apr':
          return b.apr - a.apr;
        case 'tvl':
          return b.tvl - a.tvl;
        case 'name':
          return a.poolName.localeCompare(b.poolName);
        default:
          return 0;
      }
    });

  // Mock action handlers
  const handleAddLiquidity = (poolId: number) => {
    console.log(`Add liquidity to pool ${poolId}`);
    // TODO: Implement actual liquidity addition logic
  };

  const handleRemoveLiquidity = (poolId: number) => {
    console.log(`Remove liquidity from pool ${poolId}`);
    // TODO: Implement actual liquidity removal logic
  };

  const handleViewDetails = (poolId: number) => {
    console.log(`View details for pool ${poolId}`);
    setSelectedPool(poolId);
    // TODO: Navigate to detailed pool view
  };

  const handleContractAddressSubmit = () => {
    if (contractAddress.trim()) {
      console.log(`Adding pool with contract address: ${contractAddress}`);
      // TODO: Implement contract address validation and pool addition
      setContractAddress('');
      setShowContractInput(false);
    }
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const ContractInputModal: React.FC = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Add Pool by Contract</h3>
          <button onClick={() => setShowContractInput(false)} className="text-gray-400 hover:text-white">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contract Address</label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Enter pool contract address..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleContractAddressSubmit}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 rounded-lg font-medium transition-all"
            >
              Add Pool
            </button>
            <button
              onClick={() => setShowContractInput(false)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Droplets className="w-8 h-8 text-blue-400" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Liquidity Management
                </h1>
              </div>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                Multi-Platform
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowContractInput(true)}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pool</span>
              </button>
              <div className="text-sm text-gray-400">
                {filteredPools.length} Active Pools
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Liquidity Pools</h2>
          <p className="text-gray-400 mb-6">
            Manage your liquidity across multiple platforms with Apple-style interactions.
          </p>
          
          {/* Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {platformStats.map((platform) => (
              <div key={platform.name} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className={platform.color}>{platform.icon}</div>
                  <div>
                    <div className="text-sm text-gray-400">{platform.name}</div>
                    <div className="font-semibold text-white">{platform.poolCount} Pools</div>
                    <div className="text-xs text-gray-400">
                      {formatNumber(platform.totalTvl)} TVL • {platform.totalApr.toFixed(1)}% Avg APR
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pools by name or tokens..."
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
              >
                <option value="all">All Platforms</option>
                <option value="raydium">Raydium CLMM</option>
                <option value="meteora">Meteora DLMM</option>
                <option value="orca">Orca Whirlpools</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'apr' | 'tvl' | 'name')}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="apr">Highest APR</option>
                    <option value="tvl">Highest TVL</option>
                    <option value="name">Alphabetical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min APR</label>
                  <input
                    type="number"
                    placeholder="0%"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min TVL</label>
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pool Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((pool) => (
            <PoolCard
              key={pool.id}
              poolName={pool.poolName}
              platform={pool.platform}
              tvl={pool.tvl}
              apr={pool.apr}
              userLiquidity={pool.userLiquidity}
              onAddLiquidity={() => handleAddLiquidity(pool.id)}
              onRemoveLiquidity={() => handleRemoveLiquidity(pool.id)}
              onViewDetails={() => handleViewDetails(pool.id)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredPools.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplets className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Pools Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || selectedPlatform !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Add liquidity to pools to start earning rewards.'
              }
            </p>
            {!searchTerm && selectedPlatform === 'all' && (
              <button
                onClick={() => setShowContractInput(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-all"
              >
                Add Your First Pool
              </button>
            )}
          </div>
        )}

        {/* Platform-Specific Features */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-white mb-6">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Raydium CLMM */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Layers className="w-6 h-6 text-purple-400" />
                <h4 className="text-lg font-semibold text-white">Raydium CLMM</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Concentrated liquidity ranges</li>
                <li>• Multiple fee tiers (0.01%, 0.05%, 0.3%, 1%)</li>
                <li>• Advanced position management</li>
                <li>• Impermanent loss protection</li>
              </ul>
            </div>

            {/* Meteora DLMM */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-yellow-400" />
                <h4 className="text-lg font-semibold text-white">Meteora DLMM</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Dynamic liquidity management</li>
                <li>• Automated rebalancing</li>
                <li>• Performance tracking</li>
                <li>• Risk management tools</li>
              </ul>
            </div>

            {/* Orca Whirlpools */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h4 className="text-lg font-semibold text-white">Orca Whirlpools</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Whirlpool-specific features</li>
                <li>• Liquidity provision interface</li>
                <li>• Fee collection tools</li>
                <li>• Pool analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Contract Input Modal */}
      {showContractInput && <ContractInputModal />}
    </div>
  );
}; 