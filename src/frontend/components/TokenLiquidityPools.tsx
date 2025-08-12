/**
 * TokenLiquidityPools Component
 * Displays all liquidity pools for a specific token, sorted by volume
 */

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Users, 
  Activity,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Plus,
  Minus,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';

export interface LiquidityPool {
  id: string;
  platform: string;
  tokenA: string;
  tokenB: string;
  tokenASymbol: string;
  tokenBSymbol: string;
  tvl: number;
  volume24h: number;
  lpFee: number;
  apr: number;
  poolAddress: string;
  chainId: string;
  isActive: boolean;
  userLiquidity?: number;
  userShare?: number;
}

interface TokenLiquidityPoolsProps {
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  onPoolSelect?: (pool: LiquidityPool) => void;
  onSwap?: (pool: LiquidityPool) => void;
  onAddLiquidity?: (pool: LiquidityPool) => void;
  onRemoveLiquidity?: (pool: LiquidityPool) => void;
}

export const TokenLiquidityPools: React.FC<TokenLiquidityPoolsProps> = ({
  tokenSymbol,
  tokenName,
  tokenAddress,
  onPoolSelect,
  onSwap,
  onAddLiquidity,
  onRemoveLiquidity
}) => {
  const dispatch = useAppDispatch();
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'volume' | 'tvl' | 'apr' | 'fee'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call to fetch pools for the token
    const fetchPools = async () => {
      setLoading(true);
      try {
        // Mock data - in real implementation, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockPools: LiquidityPool[] = [
          {
            id: '1',
            platform: 'Raydium',
            tokenA: tokenAddress,
            tokenB: 'USDC',
            tokenASymbol: tokenSymbol,
            tokenBSymbol: 'USDC',
            tvl: 2500000,
            volume24h: 1500000,
            lpFee: 0.25,
            apr: 12.5,
            poolAddress: '0x1234567890abcdef1234567890abcdef12345678',
            chainId: 'solana',
            isActive: true,
            userLiquidity: 5000,
            userShare: 0.2
          },
          {
            id: '2',
            platform: 'Meteora',
            tokenA: tokenAddress,
            tokenB: 'SOL',
            tokenASymbol: tokenSymbol,
            tokenBSymbol: 'SOL',
            tvl: 1800000,
            volume24h: 2200000,
            lpFee: 0.3,
            apr: 15.8,
            poolAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
            chainId: 'solana',
            isActive: true,
            userLiquidity: 0,
            userShare: 0
          },
          {
            id: '3',
            platform: 'Orca',
            tokenA: tokenAddress,
            tokenB: 'USDT',
            tokenASymbol: tokenSymbol,
            tokenBSymbol: 'USDT',
            tvl: 950000,
            volume24h: 850000,
            lpFee: 0.2,
            apr: 10.2,
            poolAddress: '0x9876543210fedcba9876543210fedcba98765432',
            chainId: 'solana',
            isActive: true,
            userLiquidity: 2500,
            userShare: 0.26
          },
          {
            id: '4',
            platform: 'Raydium',
            tokenA: tokenAddress,
            tokenB: 'BONK',
            tokenASymbol: tokenSymbol,
            tokenBSymbol: 'BONK',
            tvl: 450000,
            volume24h: 320000,
            lpFee: 0.25,
            apr: 8.5,
            poolAddress: '0x5555555555555555555555555555555555555555',
            chainId: 'solana',
            isActive: true,
            userLiquidity: 0,
            userShare: 0
          }
        ];

        setPools(mockPools);
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          title: 'Failed to load pools',
          message: 'Unable to fetch liquidity pools for this token'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [tokenSymbol, tokenAddress, dispatch]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const openExplorer = (address: string, chainId: string) => {
    let explorerUrl = '';
    switch (chainId) {
      case 'solana':
        explorerUrl = `https://solscan.io/account/${address}`;
        break;
      case 'ethereum':
        explorerUrl = `https://etherscan.io/address/${address}`;
        break;
      default:
        explorerUrl = `https://explorer.${chainId}.org/address/${address}`;
    }
    window.open(explorerUrl, '_blank');
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'raydium':
        return '🦅';
      case 'meteora':
        return '🌠';
      case 'orca':
        return '🐋';
      default:
        return '💧';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'raydium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'meteora':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'orca':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const sortedPools = [...pools].sort((a, b) => {
    let aValue: number, bValue: number;
    
    switch (sortBy) {
      case 'volume':
        aValue = a.volume24h;
        bValue = b.volume24h;
        break;
      case 'tvl':
        aValue = a.tvl;
        bValue = b.tvl;
        break;
      case 'apr':
        aValue = a.apr;
        bValue = b.apr;
        break;
      case 'fee':
        aValue = a.lpFee;
        bValue = b.lpFee;
        break;
      default:
        aValue = a.volume24h;
        bValue = b.volume24h;
    }
    
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading liquidity pools...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {tokenSymbol.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{tokenName} ({tokenSymbol})</h2>
                <p className="text-sm text-muted-foreground">Liquidity Pools</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {pools.length} pools
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sort Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'volume', label: 'Volume', icon: TrendingUp },
              { key: 'tvl', label: 'TVL', icon: DollarSign },
              { key: 'apr', label: 'APR', icon: Percent },
              { key: 'fee', label: 'Fee', icon: Activity }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={sortBy === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort(key as typeof sortBy)}
                className="flex items-center space-x-1"
              >
                <Icon size={14} />
                <span>{label}</span>
                {sortBy === key && (
                  <span className="text-xs">
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Pools List */}
          <div className="space-y-3">
            {sortedPools.map((pool) => (
              <Card key={pool.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getPlatformIcon(pool.platform)}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{pool.platform}</h3>
                          <Badge className={getPlatformColor(pool.platform)}>
                            {pool.tokenASymbol}/{pool.tokenBSymbol}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-xs text-muted-foreground font-mono">
                            {pool.poolAddress.slice(0, 6)}...{pool.poolAddress.slice(-4)}
                          </span>
                          <Button
                            onClick={() => copyToClipboard(pool.poolAddress)}
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                          >
                            {copiedAddress === pool.poolAddress ? (
                              <Check size={10} className="text-green-500" />
                            ) : (
                              <Copy size={10} className="text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            onClick={() => openExplorer(pool.poolAddress, pool.chainId)}
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                          >
                            <ExternalLink size={10} className="text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">TVL</div>
                      <div className="font-semibold">{formatNumber(pool.tvl)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">24h Volume</div>
                      <div className="font-semibold text-green-600">{formatNumber(pool.volume24h)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">LP Fee</div>
                      <div className="font-semibold text-blue-600">{formatPercentage(pool.lpFee)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">APR</div>
                      <div className="font-semibold text-purple-600">{formatPercentage(pool.apr)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Your Share</div>
                      <div className="font-semibold text-cyan-600">
                        {pool.userShare ? formatPercentage(pool.userShare) : '0%'}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      onClick={() => onSwap?.(pool)}
                      size="sm"
                      className="flex-1"
                    >
                      <Zap size={14} className="mr-1" />
                      Swap
                    </Button>
                    <Button
                      onClick={() => onAddLiquidity?.(pool)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Plus size={14} className="mr-1" />
                      Add Liquidity
                    </Button>
                    {pool.userLiquidity && pool.userLiquidity > 0 && (
                      <Button
                        onClick={() => onRemoveLiquidity?.(pool)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Minus size={14} className="mr-1" />
                        Remove
                      </Button>
                    )}
                    <Button
                      onClick={() => onPoolSelect?.(pool)}
                      variant="ghost"
                      size="sm"
                    >
                      <ArrowUpRight size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pools.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No liquidity pools found for {tokenSymbol}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 