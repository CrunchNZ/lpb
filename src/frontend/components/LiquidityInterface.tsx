import React, { useState } from 'react';
import { Droplets, Layers, Zap, TrendingUp } from 'lucide-react';
import { PoolCard } from './PoolCard';

// Mock pool data for demonstration
const mockPools = [
  {
    id: 1,
    poolName: 'SOL-USDC',
    platform: 'Raydium',
    tvl: 2500000,
    apr: 15.2,
    userLiquidity: 12500,
  },
  {
    id: 2,
    poolName: 'BONK-SOL',
    platform: 'Meteora',
    tvl: 1800000,
    apr: 22.8,
    userLiquidity: 8500,
  },
  {
    id: 3,
    poolName: 'USDC-USDT',
    platform: 'Orca',
    tvl: 5000000,
    apr: 8.5,
    userLiquidity: 25000,
  },
  {
    id: 4,
    poolName: 'RAY-SOL',
    platform: 'Raydium',
    tvl: 1200000,
    apr: 18.7,
    userLiquidity: 6000,
  },
  {
    id: 5,
    poolName: 'JUP-USDC',
    platform: 'Meteora',
    tvl: 3200000,
    apr: 25.3,
    userLiquidity: 15000,
  },
  {
    id: 6,
    poolName: 'ORCA-SOL',
    platform: 'Orca',
    tvl: 2800000,
    apr: 12.1,
    userLiquidity: 18000,
  },
];

export const LiquidityInterface: React.FC = () => {
  const [selectedPool, setSelectedPool] = useState<number | null>(null);

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
            <div className="text-sm text-gray-400">
              {mockPools.length} Active Pools
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
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Layers className="w-6 h-6 text-purple-400" />
                <div>
                  <div className="text-sm text-gray-400">Raydium CLMM</div>
                  <div className="font-semibold text-white">2 Pools</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Zap className="w-6 h-6 text-yellow-400" />
                <div>
                  <div className="text-sm text-gray-400">Meteora DLMM</div>
                  <div className="font-semibold text-white">2 Pools</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <div>
                  <div className="text-sm text-gray-400">Orca Whirlpools</div>
                  <div className="font-semibold text-white">2 Pools</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pool Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPools.map((pool) => (
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
        {mockPools.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplets className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Active Pools</h3>
            <p className="text-gray-400">Add liquidity to pools to start earning rewards.</p>
          </div>
        )}
      </main>
    </div>
  );
}; 