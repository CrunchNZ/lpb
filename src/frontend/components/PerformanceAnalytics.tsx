import React, { useState, useEffect } from 'react';
import { PerformanceMetrics } from '../../backend/database';

interface PerformanceAnalyticsProps {
  metrics: PerformanceMetrics[];
  timeRange: '1d' | '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: '1d' | '7d' | '30d' | '90d' | '1y') => void;
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  metrics,
  timeRange,
  onTimeRangeChange
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'value' | 'pnl' | 'apy'>('value');

  // Mock data for development
  const mockMetrics: PerformanceMetrics[] = Array.from({ length: 30 }, (_, i) => ({
    id: `perf_${i}`,
    timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
    totalValue: 10000 + Math.random() * 2000,
    totalPnl: 500 + Math.random() * 300 - 150,
    totalApy: 25 + Math.random() * 20 - 10,
    activePositions: 2 + Math.floor(Math.random() * 3),
    closedPositions: 1 + Math.floor(Math.random() * 2),
    strategyBreakdown: JSON.stringify({
      balanced: { totalValue: 5000 + Math.random() * 1000, totalPnl: 250 + Math.random() * 100 - 50, totalApy: 25 + Math.random() * 10 - 5, positionCount: 1 },
      aggressive: { totalValue: 3000 + Math.random() * 800, totalPnl: 200 + Math.random() * 150 - 75, totalApy: 45 + Math.random() * 15 - 7, positionCount: 1 },
      conservative: { totalValue: 2000 + Math.random() * 600, totalPnl: -25 + Math.random() * 50 - 25, totalApy: 15 + Math.random() * 8 - 4, positionCount: 1 }
    })
  }));

  const displayMetrics = metrics.length > 0 ? metrics : mockMetrics;

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '1d': return '24 Hours';
      case '7d': return '7 Days';
      case '30d': return '30 Days';
      case '90d': return '90 Days';
      case '1y': return '1 Year';
      default: return '';
    }
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

  const getMetricValue = (metric: PerformanceMetrics) => {
    switch (selectedMetric) {
      case 'value':
        return metric.totalValue;
      case 'pnl':
        return metric.totalPnl;
      case 'apy':
        return metric.totalApy;
      default:
        return metric.totalValue;
    }
  };

  const getMetricColor = (value: number) => {
    if (selectedMetric === 'apy') {
      return value >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return selectedMetric === 'pnl' ? (value >= 0 ? 'text-green-600' : 'text-red-600') : 'text-blue-600';
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'value':
        return 'Total Value';
      case 'pnl':
        return 'Total P&L';
      case 'apy':
        return 'Average APY';
      default:
        return '';
    }
  };

  const getMetricFormat = (value: number) => {
    switch (selectedMetric) {
      case 'value':
      case 'pnl':
        return formatCurrency(value);
      case 'apy':
        return formatPercentage(value);
      default:
        return value.toString();
    }
  };

  // Calculate performance statistics
  const latestMetric = displayMetrics[displayMetrics.length - 1];
  const firstMetric = displayMetrics[0];
  
  const totalReturn = latestMetric ? ((latestMetric.totalValue - firstMetric.totalValue) / firstMetric.totalValue) * 100 : 0;
  const averageApy = displayMetrics.reduce((sum, m) => sum + m.totalApy, 0) / displayMetrics.length;
  const maxDrawdown = Math.min(...displayMetrics.map(m => m.totalPnl));
  const volatility = Math.sqrt(displayMetrics.reduce((sum, m) => sum + Math.pow(m.totalApy - averageApy, 2), 0) / displayMetrics.length);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Performance Analytics</h2>
        <p className="text-gray-600">Detailed performance metrics and strategy analysis</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {(['1d', '7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTimeRangeLabel(range)}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            {(['value', 'pnl', 'apy'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedMetric === metric
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getMetricLabel()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-1">Total Return</h3>
          <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(totalReturn)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900 mb-1">Average APY</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatPercentage(averageApy)}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-900 mb-1">Max Drawdown</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(maxDrawdown)}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-900 mb-1">Volatility</h3>
          <p className="text-2xl font-bold text-purple-600">
            {volatility.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
        <div className="bg-gray-50 rounded-lg p-6 h-64 flex items-end justify-between">
          {displayMetrics.map((metric, index) => {
            const value = getMetricValue(metric);
            const maxValue = Math.max(...displayMetrics.map(m => getMetricValue(m)));
            const minValue = Math.min(...displayMetrics.map(m => getMetricValue(m)));
            const height = maxValue !== minValue ? ((value - minValue) / (maxValue - minValue)) * 100 : 50;
            
            return (
              <div key={metric.id} className="flex flex-col items-center">
                <div
                  className={`w-4 rounded-t-sm transition-all ${
                    selectedMetric === 'apy' ? 'bg-blue-500' : 
                    selectedMetric === 'pnl' ? (value >= 0 ? 'bg-green-500' : 'bg-red-500') : 
                    'bg-blue-500'
                  }`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
                <div className="text-xs text-gray-500 mt-2 transform rotate-45 origin-left">
                  {new Date(metric.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategy Breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['balanced', 'aggressive', 'conservative'] as const).map((strategy) => {
            const strategyData = JSON.parse(latestMetric?.strategyBreakdown || '{}')[strategy] || {
              totalValue: 0,
              totalPnl: 0,
              totalApy: 0,
              positionCount: 0
            };

            return (
              <div key={strategy} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 capitalize">{strategy}</h4>
                  <span className="text-sm text-gray-500">{strategyData.positionCount} positions</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Value</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(strategyData.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">P&L</span>
                    <span className={`text-sm font-medium ${strategyData.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(strategyData.totalPnl)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">APY</span>
                    <span className="text-sm font-medium text-blue-600">
                      {formatPercentage(strategyData.totalApy)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  APY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Positions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayMetrics.slice(-10).reverse().map((metric) => (
                <tr key={metric.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(metric.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(metric.totalValue)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    metric.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(metric.totalPnl)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {formatPercentage(metric.totalApy)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.activePositions} active, {metric.closedPositions} closed
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 