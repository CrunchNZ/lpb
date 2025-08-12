import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  
  Activity,
  AlertTriangle,
  Calculator,
  BarChart3,
  
  RefreshCw,
  Download,
  Eye,
  Plus,
  Minus,
  Zap,
  Shield,
  Target,
  Clock
} from 'lucide-react';
import { popModal, addNotification } from '../store/slices/uiSlice';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { LoadingSpinner } from './LoadingSpinner';

interface PoolData {
  id: string;
  name: string;
  platform: string;
  tokenA: string;
  tokenB: string;
  tokenASymbol: string;
  tokenBSymbol: string;
  tvl: number;
  apr: number;
  volume24h: number;
  fees24h: number;
  userLiquidity: number;
  userShare: number;
  poolAddress: string;
  chainId: string;
  createdAt: number;
  lastUpdated: number;
  riskLevel: 'low' | 'medium' | 'high';
  impermanentLoss: number;
  priceRange: {
    min: number;
    max: number;
    current: number;
  };
  rewards: {
    token: string;
    amount: number;
    value: number;
  }[];
  historicalData: {
    timestamp: number;
    tvl: number;
    volume: number;
    apr: number;
  }[];
}

interface PoolDetailViewProps {
  pool: PoolData;
  onClose?: () => void;
  onAddLiquidity?: (amountA: number, amountB: number) => Promise<void>;
  onRemoveLiquidity?: (percentage: number) => Promise<void>;
  onHarvestRewards?: () => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export const PoolDetailView: React.FC<PoolDetailViewProps> = ({
  pool,
  onClose,
  onAddLiquidity,
  onRemoveLiquidity,
  onHarvestRewards,
  onRefreshData
}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'liquidity' | 'analytics' | 'rewards'>('overview');
  const [addLiquidityAmountA, setAddLiquidityAmountA] = useState('');
  const [addLiquidityAmountB, setAddLiquidityAmountB] = useState('');
  const [removeLiquidityPercentage, setRemoveLiquidityPercentage] = useState('25');

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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

  // Calculate impermanent loss
  const impermanentLossInfo = useMemo(() => {
    const currentPrice = pool.priceRange.current;
    const entryPrice = pool.priceRange.min + (pool.priceRange.max - pool.priceRange.min) / 2;
    const priceChange = (currentPrice - entryPrice) / entryPrice;
    
    // Simplified IL calculation
    const il = Math.abs(priceChange) > 0.1 ? Math.pow(priceChange, 2) * 0.5 : 0;
    
    return {
      percentage: il * 100,
      value: pool.userLiquidity * il,
      isPositive: il > 0
    };
  }, [pool]);

  const handleClose = () => {
    dispatch(popModal());
    if (onClose) {
      onClose();
    }
  };

  const handleAddLiquidity = async () => {
    if (!addLiquidityAmountA || !addLiquidityAmountB) {
      dispatch(addNotification({
        type: 'error',
        title: 'Invalid Amounts',
        message: 'Please enter valid amounts for both tokens'
      }));
      return;
    }

    setIsLoading(true);
    try {
      if (onAddLiquidity) {
        await onAddLiquidity(parseFloat(addLiquidityAmountA), parseFloat(addLiquidityAmountB));
        setAddLiquidityAmountA('');
        setAddLiquidityAmountB('');
        dispatch(addNotification({
          type: 'success',
          title: 'Liquidity Added',
          message: `Successfully added liquidity to ${pool.name}`
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add liquidity. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!removeLiquidityPercentage || parseFloat(removeLiquidityPercentage) <= 0) {
      dispatch(addNotification({
        type: 'error',
        title: 'Invalid Percentage',
        message: 'Please enter a valid percentage to remove'
      }));
      return;
    }

    setIsLoading(true);
    try {
      if (onRemoveLiquidity) {
        await onRemoveLiquidity(parseFloat(removeLiquidityPercentage));
        setRemoveLiquidityPercentage('25');
        dispatch(addNotification({
          type: 'success',
          title: 'Liquidity Removed',
          message: `Successfully removed ${removeLiquidityPercentage}% liquidity from ${pool.name}`
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove liquidity. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleHarvestRewards = async () => {
    setIsLoading(true);
    try {
      if (onHarvestRewards) {
        await onHarvestRewards();
        dispatch(addNotification({
          type: 'success',
          title: 'Rewards Harvested',
          message: `Successfully harvested rewards from ${pool.name}`
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to harvest rewards. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
        dispatch(addNotification({
          type: 'success',
          title: 'Data Refreshed',
          message: 'Pool data has been updated'
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to refresh data. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {getPlatformIcon(pool.platform)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {pool.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pool.platform} • {pool.tokenASymbol}/{pool.tokenBSymbol}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label="Pool detail tabs">
          {[
            { id: 'overview', label: 'Overview', icon: <Eye className="h-4 w-4" /> },
            { id: 'liquidity', label: 'Liquidity', icon: <Plus className="h-4 w-4" /> },
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'rewards', label: 'Rewards', icon: <Zap className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6" role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {formatNumber(pool.tvl)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Value Locked</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {pool.apr.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">APR</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {formatNumber(pool.volume24h)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">24h Volume</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-2">
                    {formatNumber(pool.userLiquidity)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your Liquidity</div>
                </Card>
              </div>

              {/* Pool Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Pool Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Platform</span>
                      <span className="font-medium text-gray-900 dark:text-white">{pool.platform}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pool Address</span>
                      <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                        {pool.poolAddress.slice(0, 8)}...{pool.poolAddress.slice(-6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Chain</span>
                      <span className="font-medium text-gray-900 dark:text-white">{pool.chainId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(pool.createdAt)}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Your Position</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Share</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {pool.userShare.toFixed(4)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">24h Fees Earned</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(pool.fees24h * (pool.userShare / 100))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Risk Level</span>
                      <Badge className={getRiskColor(pool.riskLevel)}>
                        {pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(pool.lastUpdated)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Price Range and Impermanent Loss */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Price Range</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Price</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(pool.priceRange.current)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Min Price</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(pool.priceRange.min)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Max Price</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(pool.priceRange.max)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${((pool.priceRange.current - pool.priceRange.min) / (pool.priceRange.max - pool.priceRange.min)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Impermanent Loss</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">IL Percentage</span>
                      <span className={`font-medium ${impermanentLossInfo.isPositive ? 'text-red-400' : 'text-green-400'}`}>
                        {formatPercentage(impermanentLossInfo.percentage)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">IL Value</span>
                      <span className={`font-medium ${impermanentLossInfo.isPositive ? 'text-red-400' : 'text-green-400'}`}>
                        {formatNumber(impermanentLossInfo.value)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Monitor price movements to minimize IL
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'liquidity' && (
            <div className="space-y-6" role="tabpanel" id="liquidity-panel" aria-labelledby="liquidity-tab">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Liquidity Management</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add or remove liquidity from {pool.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add Liquidity */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Add Liquidity</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="add-liquidity-amount-a" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {pool.tokenASymbol} Amount
                      </label>
                      <Input
                        id="add-liquidity-amount-a"
                        type="number"
                        value={addLiquidityAmountA}
                        onChange={(e) => setAddLiquidityAmountA(e.target.value)}
                        placeholder="0.00"
                        className="w-full"
                        aria-describedby={`${pool.tokenASymbol}-amount-help`}
                      />
                    </div>
                    <div>
                      <label htmlFor="add-liquidity-amount-b" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {pool.tokenBSymbol} Amount
                      </label>
                      <Input
                        id="add-liquidity-amount-b"
                        type="number"
                        value={addLiquidityAmountB}
                        onChange={(e) => setAddLiquidityAmountB(e.target.value)}
                        placeholder="0.00"
                        className="w-full"
                        aria-describedby={`${pool.tokenBSymbol}-amount-help`}
                      />
                    </div>
                    <Button
                      onClick={handleAddLiquidity}
                      disabled={isLoading || !addLiquidityAmountA || !addLiquidityAmountB}
                      className="w-full"
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : 'Add Liquidity'}
                    </Button>
                  </div>
                </Card>

                {/* Remove Liquidity */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Remove Liquidity</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="remove-liquidity-percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Percentage to Remove
                      </label>
                      <select
                        id="remove-liquidity-percentage"
                        value={removeLiquidityPercentage}
                        onChange={(e) => setRemoveLiquidityPercentage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        aria-describedby="remove-liquidity-help"
                      >
                        <option value="25">25%</option>
                        <option value="50">50%</option>
                        <option value="75">75%</option>
                        <option value="100">100%</option>
                      </select>
                    </div>
                    <div id="remove-liquidity-help" className="text-sm text-gray-600 dark:text-gray-400">
                      You will receive approximately:
                      <div className="mt-2 space-y-1">
                        <div>{pool.tokenASymbol}: {((parseFloat(removeLiquidityPercentage) / 100) * pool.userLiquidity / 2).toFixed(6)}</div>
                        <div>{pool.tokenBSymbol}: {((parseFloat(removeLiquidityPercentage) / 100) * pool.userLiquidity / 2).toFixed(6)}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRemoveLiquidity}
                      disabled={isLoading || !removeLiquidityPercentage}
                      className="w-full"
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : 'Remove Liquidity'}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Current Position Summary */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Current Position Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatNumber(pool.userLiquidity)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {pool.userShare.toFixed(4)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pool Share</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {formatNumber(pool.fees24h * (pool.userShare / 100))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">24h Fees</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6" role="tabpanel" id="analytics-panel" aria-labelledby="analytics-tab">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pool Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Performance metrics and historical data for {pool.name}
                </p>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {pool.apr.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current APR</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {formatNumber(pool.volume24h)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">24h Volume</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {formatNumber(pool.fees24h)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">24h Fees</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-2">
                    {pool.historicalData.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Data Points</div>
                </Card>
              </div>

              {/* Historical Chart */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">TVL History</h4>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Chart placeholder</p>
                </div>
              </Card>

              {/* Risk Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Risk Assessment</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Risk Level</span>
                      <Badge className={getRiskColor(pool.riskLevel)}>
                        {pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Impermanent Loss</span>
                      <span className={`font-medium ${impermanentLossInfo.isPositive ? 'text-red-400' : 'text-green-400'}`}>
                        {formatPercentage(impermanentLossInfo.percentage)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Volatility</span>
                      <span className="font-medium text-gray-900 dark:text-white">Medium</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Liquidity Depth</span>
                      <span className="font-medium text-gray-900 dark:text-white">High</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">APR Trend</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="font-medium text-green-400">+2.5%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Volume Trend</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="font-medium text-green-400">+15.3%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">TVL Growth</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="font-medium text-green-400">+8.7%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">User Growth</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="font-medium text-green-400">+12.1%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-6" role="tabpanel" id="rewards-panel" aria-labelledby="rewards-tab">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Rewards & Incentives</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track and manage your earned rewards from {pool.name}
                </p>
              </div>

              {/* Available Rewards */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Available Rewards</h4>
                <div className="space-y-3">
                  {pool.rewards.map((reward, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {reward.token.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {reward.amount.toFixed(6)} {reward.token}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ≈ {formatNumber(reward.value)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleHarvestRewards}
                        disabled={isLoading}
                      >
                        {isLoading ? <LoadingSpinner size="sm" /> : 'Harvest'}
                      </Button>
                    </div>
                  ))}
                  {pool.rewards.length === 0 && (
                    <div className="text-center py-8">
                      <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No rewards available yet</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Reward Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-2">
                    {formatNumber(pool.rewards.reduce((sum, reward) => sum + reward.value, 0))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Rewards Value</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {pool.rewards.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Reward Tokens</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {formatNumber(pool.fees24h * (pool.userShare / 100))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">24h Fee Earnings</div>
                </Card>
              </div>

              {/* Reward History */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Recent Harvests</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">✓</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Harvested SOL</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">0.125 SOL</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">≈ $12.50</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">✓</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Harvested USDC</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">1 day ago</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">25.50 USDC</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">≈ $25.50</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 