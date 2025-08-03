import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { popModal, addNotification } from '../store/slices/uiSlice';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';

interface TokenData {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange7d: number;
  circulatingSupply: number;
  totalSupply: number;
  contractAddress: string;
  chainId: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  trending: 'up' | 'down' | 'stable';
  socialMetrics: {
    twitterFollowers: number;
    redditSubscribers: number;
    telegramMembers: number;
  };
  technicalIndicators: {
    rsi: number;
    macd: string;
    movingAverage: string;
  };
}

interface TokenDetailViewProps {
  token: TokenData;
  onClose?: () => void;
  onAddToWatchlist?: (token: TokenData) => void;
  onRemoveFromWatchlist?: (symbol: string) => void;
  isInWatchlist?: boolean;
}

export const TokenDetailView: React.FC<TokenDetailViewProps> = ({
  token,
  onClose,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isInWatchlist = false
}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trading' | 'analytics' | 'social'>('overview');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'negative':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTrendingIcon = (trending: string) => {
    switch (trending) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  const handleClose = () => {
    dispatch(popModal());
    if (onClose) {
      onClose();
    }
  };

  const handleAddToWatchlist = () => {
    if (onAddToWatchlist) {
      onAddToWatchlist(token);
      dispatch(addNotification({
        type: 'success',
        title: 'Added to Watchlist',
        message: `${token.symbol} has been added to your watchlist`
      }));
    }
  };

  const handleRemoveFromWatchlist = () => {
    if (onRemoveFromWatchlist) {
      onRemoveFromWatchlist(token.symbol);
      dispatch(addNotification({
        type: 'success',
        title: 'Removed from Watchlist',
        message: `${token.symbol} has been removed from your watchlist`
      }));
    }
  };

  const handleTrade = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      dispatch(addNotification({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount to trade'
      }));
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch(addNotification({
        type: 'success',
        title: 'Trade Executed',
        message: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${tradeAmount} ${token.symbol}`
      }));
      
      setTradeAmount('');
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Trade Failed',
        message: 'Failed to execute trade. Please try again.'
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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {token.symbol.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {token.name} ({token.symbol})
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {token.contractAddress.slice(0, 8)}...{token.contractAddress.slice(-6)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isInWatchlist ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFromWatchlist}
                className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400"
              >
                Remove from Watchlist
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToWatchlist}
                className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400"
              >
                Add to Watchlist
              </Button>
            )}
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
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'trading', label: 'Trading', icon: '💱' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'social', label: 'Social', icon: '🌐' }
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
              {/* Price and Market Data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {formatCurrency(token.price)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Price</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className={`text-2xl font-bold mb-2 ${getPriceChangeColor(token.priceChange24h)}`}>
                    {formatPercentage(token.priceChange24h)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">24h Change</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {formatCurrency(token.marketCap)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Market Cap</div>
                </Card>
              </div>

              {/* Token Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Token Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Symbol</span>
                      <span className="font-medium text-gray-900 dark:text-white">{token.symbol}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name</span>
                      <span className="font-medium text-gray-900 dark:text-white">{token.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Chain</span>
                      <span className="font-medium text-gray-900 dark:text-white">{token.chainId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Contract</span>
                      <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                        {token.contractAddress.slice(0, 8)}...{token.contractAddress.slice(-6)}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Market Data</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Volume (24h)</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(token.volume24h)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Circulating Supply</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(token.circulatingSupply)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Supply</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(token.totalSupply)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">7d Change</span>
                      <span className={`font-medium ${getPriceChangeColor(token.priceChange7d)}`}>
                        {formatPercentage(token.priceChange7d)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sentiment and Trending */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Sentiment</h3>
                  <div className="flex items-center space-x-3">
                    <Badge className={getSentimentColor(token.sentiment)}>
                      {token.sentiment.charAt(0).toUpperCase() + token.sentiment.slice(1)}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Market sentiment analysis
                    </span>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Trending</h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTrendingIcon(token.trending)}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {token.trending === 'up' ? 'Trending Up' : token.trending === 'down' ? 'Trending Down' : 'Stable'}
                    </span>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'trading' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Trade {token.symbol}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Execute trades with {token.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Trade Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Trade Type
                      </label>
                      <div className="flex space-x-2">
                        <Button
                          variant={tradeType === 'buy' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTradeType('buy')}
                          className="flex-1"
                        >
                          Buy
                        </Button>
                        <Button
                          variant={tradeType === 'sell' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTradeType('sell')}
                          className="flex-1"
                        >
                          Sell
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount ({token.symbol})
                      </label>
                      <input
                        type="number"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estimated Value (USD)
                      </label>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-900 dark:text-white">
                        {tradeAmount && parseFloat(tradeAmount) > 0
                          ? formatCurrency(parseFloat(tradeAmount) * token.price)
                          : '$0.00'}
                      </div>
                    </div>

                    <Button
                      onClick={handleTrade}
                      disabled={isLoading || !tradeAmount || parseFloat(tradeAmount) <= 0}
                      className="w-full"
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`}
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Market Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Price</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(token.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">24h Volume</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(token.volume24h)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">24h Change</span>
                      <span className={`font-medium ${getPriceChangeColor(token.priceChange24h)}`}>
                        {formatPercentage(token.priceChange24h)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Market Cap</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(token.marketCap)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Technical Analysis</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced analytics and technical indicators
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {token.technicalIndicators.rsi.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">RSI</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {token.technicalIndicators.macd}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">MACD</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {token.technicalIndicators.movingAverage}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">MA</div>
                </Card>
              </div>

              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Price Chart</h4>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Chart placeholder</p>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Support & Resistance</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Resistance</span>
                      <span className="font-medium text-red-400">{formatCurrency(token.price * 1.1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(token.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Support</span>
                      <span className="font-medium text-green-400">{formatCurrency(token.price * 0.9)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Volatility</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">24h Volatility</span>
                      <span className="font-medium text-gray-900 dark:text-white">15.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">7d Volatility</span>
                      <span className="font-medium text-gray-900 dark:text-white">28.7%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Risk Level</span>
                      <span className="font-medium text-yellow-400">Medium</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Social Metrics</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Community engagement and social sentiment
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {formatNumber(token.socialMetrics.twitterFollowers)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Twitter Followers</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-2">
                    {formatNumber(token.socialMetrics.redditSubscribers)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reddit Subscribers</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500 mb-2">
                    {formatNumber(token.socialMetrics.telegramMembers)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Telegram Members</div>
                </Card>
              </div>

              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Sentiment Analysis</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Overall Sentiment</span>
                    <Badge className={getSentimentColor(token.sentiment)}>
                      {token.sentiment.charAt(0).toUpperCase() + token.sentiment.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Social Trend</span>
                    <span className="text-2xl">{getTrendingIcon(token.trending)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Community Score</span>
                    <span className="font-medium text-gray-900 dark:text-white">8.5/10</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Recent Activity</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-green-500">📈</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Price surge detected</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-blue-500">🐦</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">High Twitter activity</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-orange-500">📊</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Volume spike</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">6 hours ago</p>
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