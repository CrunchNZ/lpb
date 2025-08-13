import React, { useState, useEffect } from 'react';

interface StrategyConfig {
  strategy: 'balanced' | 'aggressive' | 'conservative';
  maxPositions: number;
  maxInvestment: number;
  riskLevel: 'low' | 'medium' | 'high';
  autoRebalance: boolean;
  stopLoss: number;
  takeProfit: number;
  minApy: number;
  maxDrawdown: number;
}

interface StrategyConfigProps {
  config: StrategyConfig;
  onConfigChange: (config: StrategyConfig) => void;
  onSave: () => void;
  loading?: boolean;
}

export const StrategyConfig: React.FC<StrategyConfigProps> = ({
  config,
  onConfigChange,
  onSave,
  loading = false
}) => {
  const [localConfig, setLocalConfig] = useState<StrategyConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const handleChange = (field: keyof StrategyConfig, value: any) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    setHasChanges(true);
    onConfigChange(newConfig);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'balanced':
        return 'Balanced approach with moderate risk and returns. Suitable for most users.';
      case 'aggressive':
        return 'High-risk, high-reward strategy. Maximizes potential returns but with increased volatility.';
      case 'conservative':
        return 'Low-risk strategy focusing on capital preservation with steady, modest returns.';
      default:
        return '';
    }
  };

  const getRiskLevelDescription = (level: string) => {
    switch (level) {
      case 'low':
        return 'Conservative risk management with strict position limits.';
      case 'medium':
        return 'Balanced risk management with moderate position sizing.';
      case 'high':
        return 'Aggressive risk management with larger position sizes.';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Strategy Configuration</h2>
        <p className="text-gray-600">Configure your liquidity farming strategy and risk parameters.</p>
      </div>

      <div className="space-y-6">
        {/* Strategy Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Strategy Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['balanced', 'aggressive', 'conservative'] as const).map((strategy) => (
              <div
                key={strategy}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  localConfig.strategy === strategy
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleChange('strategy', strategy)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleChange('strategy', strategy);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 capitalize">{strategy}</span>
                  {localConfig.strategy === strategy && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">{getStrategyDescription(strategy)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <div
                key={level}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  localConfig.riskLevel === level
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleChange('riskLevel', level)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleChange('riskLevel', level);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 capitalize">{level}</span>
                  {localConfig.riskLevel === level && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">{getRiskLevelDescription(level)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Position Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Positions
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={localConfig.maxPositions}
              onChange={(e) => handleChange('maxPositions', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum number of concurrent positions</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Investment (USD)
            </label>
            <input
              type="number"
              min="100"
              step="100"
              value={localConfig.maxInvestment}
              onChange={(e) => handleChange('maxInvestment', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Total investment limit across all positions</p>
          </div>
        </div>

        {/* Risk Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stop Loss (%)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              step="0.1"
              value={localConfig.stopLoss}
              onChange={(e) => handleChange('stopLoss', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Automatically close positions at this loss threshold</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Take Profit (%)
            </label>
            <input
              type="number"
              min="1"
              max="200"
              step="0.1"
              value={localConfig.takeProfit}
              onChange={(e) => handleChange('takeProfit', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Automatically close positions at this profit threshold</p>
          </div>
        </div>

        {/* Performance Targets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum APY (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              step="0.1"
              value={localConfig.minApy}
              onChange={(e) => handleChange('minApy', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum APY required to enter new positions</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Drawdown (%)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              step="0.1"
              value={localConfig.maxDrawdown}
              onChange={(e) => handleChange('maxDrawdown', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum allowed portfolio drawdown</p>
          </div>
        </div>

        {/* Auto Rebalance */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-700">Auto Rebalance</label>
            <p className="text-xs text-gray-500">Automatically rebalance positions based on performance</p>
          </div>
          <button
            onClick={() => handleChange('autoRebalance', !localConfig.autoRebalance)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localConfig.autoRebalance ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localConfig.autoRebalance ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              hasChanges && !loading
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Configuration Summary</h3>
        <div className="text-xs text-blue-800 space-y-1">
          <p>Strategy: <span className="font-medium capitalize">{localConfig.strategy}</span></p>
          <p>Risk Level: <span className="font-medium capitalize">{localConfig.riskLevel}</span></p>
          <p>Max Positions: <span className="font-medium">{localConfig.maxPositions}</span></p>
          <p>Max Investment: <span className="font-medium">${localConfig.maxInvestment.toLocaleString()}</span></p>
          <p>Stop Loss: <span className="font-medium">{localConfig.stopLoss}%</span></p>
          <p>Take Profit: <span className="font-medium">{localConfig.takeProfit}%</span></p>
          <p>Min APY: <span className="font-medium">{localConfig.minApy}%</span></p>
          <p>Max Drawdown: <span className="font-medium">{localConfig.maxDrawdown}%</span></p>
          <p>Auto Rebalance: <span className="font-medium">{localConfig.autoRebalance ? 'Enabled' : 'Disabled'}</span></p>
        </div>
      </div>
    </div>
  );
}; 