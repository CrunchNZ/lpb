import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Position } from '../../backend/database';
import { popModal, addNotification } from '../store/slices/uiSlice';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';

interface PositionDetailViewProps {
  position: Position;
  onClose?: () => void;
  onUpdate?: (id: string, updates: Partial<Position>) => void;
}

export const PositionDetailView: React.FC<PositionDetailViewProps> = ({
  position,
  onClose,
  onUpdate
}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'analytics'>('overview');

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'balanced':
        return '⚖️';
      case 'aggressive':
        return '🚀';
      case 'conservative':
        return '🛡️';
      default:
        return '📊';
    }
  };

  const handleClose = () => {
    dispatch(popModal());
    if (onClose) {
      onClose();
    }
  };

  const handleAddLiquidity = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch(addNotification({
        type: 'success',
        title: 'Liquidity Added',
        message: `Successfully added liquidity to ${position.tokenA}/${position.tokenB} pool`
      }));
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
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch(addNotification({
        type: 'success',
        title: 'Liquidity Removed',
        message: `Successfully removed liquidity from ${position.tokenA}/${position.tokenB} pool`
      }));
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch(addNotification({
        type: 'success',
        title: 'Rewards Harvested',
        message: `Successfully harvested rewards from ${position.tokenA}/${position.tokenB} pool`
      }));
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

  const handleClosePosition = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onUpdate) {
        onUpdate(position.id, { status: 'closed' });
      }
      
      dispatch(addNotification({
        type: 'success',
        title: 'Position Closed',
        message: `Successfully closed ${position.tokenA}/${position.tokenB} position`
      }));
      
      handleClose();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to close position. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getStrategyIcon(position.strategy)}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {position.tokenA}/{position.tokenB} Position
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created {formatDate(position.timestamp)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'actions', label: 'Actions', icon: '⚡' },
            { id: 'analytics', label: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Position Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <Badge className={getStatusColor(position.status)}>
                        {position.status.charAt(0).toUpperCase() + position.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Strategy</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getStrategyIcon(position.strategy)} {position.strategy.charAt(0).toUpperCase() + position.strategy.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pool Address</span>
                      <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                        {position.poolAddress.slice(0, 8)}...{position.poolAddress.slice(-6)}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Performance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">P&L</span>
                      <span className={`font-semibold ${getPnlColor(position.pnl)}`}>
                        {formatCurrency(position.pnl)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">APY</span>
                      <span className="font-semibold text-green-400">
                        {formatPercentage(position.apy)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Price Change</span>
                      <span className={`font-semibold ${getPnlColor(position.currentPrice - position.entryPrice)}`}>
                        {formatPercentage(((position.currentPrice - position.entryPrice) / position.entryPrice) * 100)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Token Amounts */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Token Amounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{position.tokenA}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {position.amountA.toFixed(6)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ≈ {formatCurrency(position.amountA * position.currentPrice)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{position.tokenB}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {position.amountB.toFixed(6)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ≈ {formatCurrency(position.amountB * position.currentPrice)}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Price Information */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Price Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Entry Price</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(position.entryPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Price</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(position.currentPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Value</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency((position.amountA + position.amountB) * position.currentPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Time Held</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Math.floor((Date.now() - position.timestamp) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Liquidity Management</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your position and optimize your liquidity
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Add Liquidity</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Increase your position size to earn more rewards
                  </p>
                  <Button
                    onClick={handleAddLiquidity}
                    disabled={isLoading || position.status !== 'active'}
                    className="w-full"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Add Liquidity'}
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Remove Liquidity</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Withdraw some of your liquidity while keeping the position open
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleRemoveLiquidity}
                    disabled={isLoading || position.status !== 'active'}
                    className="w-full"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Remove Liquidity'}
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Harvest Rewards</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Collect accumulated rewards from your position
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleHarvestRewards}
                    disabled={isLoading || position.status !== 'active'}
                    className="w-full"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Harvest Rewards'}
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Close Position</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Completely close your position and withdraw all liquidity
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleClosePosition}
                    disabled={isLoading || position.status === 'closed'}
                    className="w-full"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Close Position'}
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Performance Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Detailed analysis of your position performance
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {formatPercentage(position.apy)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Annual Yield</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className={`text-2xl font-bold mb-2 ${getPnlColor(position.pnl)}`}>
                    {formatCurrency(position.pnl)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total P&L</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {formatCurrency((position.amountA + position.amountB) * position.currentPrice)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
                </Card>
              </div>

              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Risk Metrics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Impermanent Loss</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.abs(position.pnl) > 0 ? formatPercentage(position.pnl) : '0.00%'}
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
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Historical Performance</h4>
                <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Chart placeholder</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 