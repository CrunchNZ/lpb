import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Search, 
  Filter, 
  Trash2, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Activity,
  Download,
  RefreshCw,
  BarChart3,
  Settings,
  Eye,
  Plus
} from 'lucide-react';
import { popModal, addNotification } from '../store/slices/uiSlice';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { LoadingSpinner } from './LoadingSpinner';
import { TokenData } from '../../backend/integrations/dexscreener';

interface WatchlistToken {
  id: number;
  watchlistId: number;
  tokenSymbol: string;
  tokenName: string;
  pairAddress: string;
  chainId: string;
  addedAt: number;
}

interface Watchlist {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  tokenCount?: number;
}

interface WatchlistDetailViewProps {
  watchlist: Watchlist;
  tokens: WatchlistToken[];
  tokenData: Record<string, TokenData>;
  onClose?: () => void;
  onRemoveTokens?: (tokenSymbols: string[]) => void;
  onAddToken?: (token: TokenData) => void;
  onRefreshData?: () => void;
  onTokenSelect?: (token: TokenData) => void;
}

type SortField = 'symbol' | 'price' | 'change24h' | 'volume' | 'marketCap' | 'addedAt';
type SortDirection = 'asc' | 'desc';

export const WatchlistDetailView: React.FC<WatchlistDetailViewProps> = ({
  watchlist,
  tokens,
  tokenData,
  onClose,
  onRemoveTokens,
  onAddToken,
  onRefreshData,
  onTokenSelect
}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'tokens' | 'analytics' | 'settings'>('tokens');
  const [showBulkActions, setShowBulkActions] = useState(false);

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
      day: 'numeric'
    });
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getPriceChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  // Filter and sort tokens
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter(token => {
      const matchesSearch = token.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.tokenName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    // Sort tokens
    filtered.sort((a, b) => {
      const aData = tokenData[a.tokenSymbol];
      const bData = tokenData[b.tokenSymbol];
      
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'symbol':
          aValue = a.tokenSymbol.toLowerCase();
          bValue = b.tokenSymbol.toLowerCase();
          break;
        case 'price':
          aValue = aData?.price || 0;
          bValue = bData?.price || 0;
          break;
        case 'change24h':
          aValue = aData?.priceChange24h || 0;
          bValue = bData?.priceChange24h || 0;
          break;
        case 'volume':
          aValue = aData?.volume24h || 0;
          bValue = bData?.volume24h || 0;
          break;
        case 'marketCap':
          aValue = aData?.marketCap || 0;
          bValue = bData?.marketCap || 0;
          break;
        case 'addedAt':
          aValue = a.addedAt;
          bValue = b.addedAt;
          break;
        default:
          aValue = a.tokenSymbol.toLowerCase();
          bValue = b.tokenSymbol.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tokens, tokenData, searchTerm, sortField, sortDirection]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const validTokens = filteredAndSortedTokens.filter(token => tokenData[token.tokenSymbol]);
    const totalTokens = validTokens.length;
    
    if (totalTokens === 0) {
      return {
        totalValue: 0,
        avgChange24h: 0,
        gainers: 0,
        losers: 0,
        topPerformer: null,
        worstPerformer: null,
        totalVolume: 0,
        avgMarketCap: 0
      };
    }

    const changes = validTokens.map(token => tokenData[token.tokenSymbol].priceChange24h);
    const gainers = changes.filter(change => change > 0).length;
    const losers = changes.filter(change => change < 0).length;
    
    const topPerformer = validTokens.reduce((best, current) => {
      const bestChange = tokenData[best.tokenSymbol]?.priceChange24h || 0;
      const currentChange = tokenData[current.tokenSymbol]?.priceChange24h || 0;
      return currentChange > bestChange ? current : best;
    });

    const worstPerformer = validTokens.reduce((worst, current) => {
      const worstChange = tokenData[worst.tokenSymbol]?.priceChange24h || 0;
      const currentChange = tokenData[current.tokenSymbol]?.priceChange24h || 0;
      return currentChange < worstChange ? current : worst;
    });

    const totalVolume = validTokens.reduce((sum, token) => sum + (tokenData[token.tokenSymbol]?.volume24h || 0), 0);
    const avgMarketCap = validTokens.reduce((sum, token) => sum + (tokenData[token.tokenSymbol]?.marketCap || 0), 0) / totalTokens;

    return {
      totalValue: validTokens.reduce((sum, token) => sum + (tokenData[token.tokenSymbol]?.price || 0), 0),
      avgChange24h: changes.reduce((sum, change) => sum + change, 0) / totalTokens,
      gainers,
      losers,
      topPerformer,
      worstPerformer,
      totalVolume,
      avgMarketCap
    };
  }, [filteredAndSortedTokens, tokenData]);

  const handleClose = () => {
    dispatch(popModal());
    if (onClose) {
      onClose();
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedTokens.size === filteredAndSortedTokens.length) {
      setSelectedTokens(new Set());
    } else {
      setSelectedTokens(new Set(filteredAndSortedTokens.map(token => token.tokenSymbol)));
    }
  };

  const handleSelectToken = (tokenSymbol: string) => {
    const newSelected = new Set(selectedTokens);
    if (newSelected.has(tokenSymbol)) {
      newSelected.delete(tokenSymbol);
    } else {
      newSelected.add(tokenSymbol);
    }
    setSelectedTokens(newSelected);
  };

  const handleRemoveSelected = async () => {
    if (selectedTokens.size === 0) return;
    
    setIsLoading(true);
    try {
      if (onRemoveTokens) {
        await onRemoveTokens(Array.from(selectedTokens));
        setSelectedTokens(new Set());
        dispatch(addNotification({
          type: 'success',
          title: 'Tokens Removed',
          message: `Successfully removed ${selectedTokens.size} token(s) from watchlist`
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove tokens. Please try again.'
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
          message: 'Watchlist data has been updated'
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

  const SortableHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
    >
      <span>{children}</span>
      {sortField === field && (
        <span className="text-xs">
          {sortDirection === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {watchlist.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tokens.length} tokens • Created {formatDate(watchlist.createdAt)}
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
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'tokens', label: 'Tokens', icon: <Star className="h-4 w-4" /> },
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
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
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tokens..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Badge variant="secondary">
                    {filteredAndSortedTokens.length} tokens
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedTokens.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveSelected}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove ({selectedTokens.size})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkActions(!showBulkActions)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tokens Table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="p-4 text-left">
                          <input
                            type="checkbox"
                            checked={selectedTokens.size === filteredAndSortedTokens.length && filteredAndSortedTokens.length > 0}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="p-4 text-left">
                          <SortableHeader field="symbol">Token</SortableHeader>
                        </th>
                        <th className="p-4 text-left">
                          <SortableHeader field="price">Price</SortableHeader>
                        </th>
                        <th className="p-4 text-left">
                          <SortableHeader field="change24h">24h Change</SortableHeader>
                        </th>
                        <th className="p-4 text-left">
                          <SortableHeader field="volume">Volume</SortableHeader>
                        </th>
                        <th className="p-4 text-left">
                          <SortableHeader field="marketCap">Market Cap</SortableHeader>
                        </th>
                        <th className="p-4 text-left">
                          <SortableHeader field="addedAt">Added</SortableHeader>
                        </th>
                        <th className="p-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedTokens.map((token) => {
                        const data = tokenData[token.tokenSymbol];
                        const isSelected = selectedTokens.has(token.tokenSymbol);

                        return (
                          <tr
                            key={token.id}
                            className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectToken(token.tokenSymbol)}
                                className="rounded"
                              />
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {token.tokenSymbol.slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {token.tokenSymbol}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {token.tokenName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {data ? formatNumber(data.price) : 'N/A'}
                              </div>
                            </td>
                            <td className="p-4">
                              {data ? (
                                <div className="flex items-center space-x-1">
                                  {getPriceChangeIcon(data.priceChange24h)}
                                  <span className={`font-medium ${getPriceChangeColor(data.priceChange24h)}`}>
                                    {formatPercentage(data.priceChange24h)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {data ? formatNumber(data.volume24h) : 'N/A'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {data ? formatNumber(data.marketCap) : 'N/A'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(token.addedAt)}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                {onTokenSelect && data && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onTokenSelect(data)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectToken(token.tokenSymbol)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Watchlist Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Performance overview and insights for {watchlist.name}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {formatNumber(analytics.totalValue)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className={`text-2xl font-bold mb-2 ${getPriceChangeColor(analytics.avgChange24h)}`}>
                    {formatPercentage(analytics.avgChange24h)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg 24h Change</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {analytics.gainers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Gainers</div>
                </Card>

                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-400 mb-2">
                    {analytics.losers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Losers</div>
                </Card>
              </div>

              {/* Performance Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Top Performers</h4>
                  <div className="space-y-3">
                    {analytics.topPerformer && (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {analytics.topPerformer.tokenSymbol.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {analytics.topPerformer.tokenSymbol}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {analytics.topPerformer.tokenName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-400">
                            {formatPercentage(tokenData[analytics.topPerformer.tokenSymbol]?.priceChange24h || 0)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Worst Performers</h4>
                  <div className="space-y-3">
                    {analytics.worstPerformer && (
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {analytics.worstPerformer.tokenSymbol.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {analytics.worstPerformer.tokenSymbol}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {analytics.worstPerformer.tokenName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-400">
                            {formatPercentage(tokenData[analytics.worstPerformer.tokenSymbol]?.priceChange24h || 0)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Volume and Market Cap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Volume Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Volume (24h)</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(analytics.totalVolume)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg Volume per Token</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(analytics.totalVolume / Math.max(filteredAndSortedTokens.length, 1))}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Market Cap Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Average Market Cap</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(analytics.avgMarketCap)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Market Cap</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(analytics.avgMarketCap * filteredAndSortedTokens.length)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Watchlist Settings</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your watchlist preferences and settings
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Watchlist Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name</span>
                      <span className="font-medium text-gray-900 dark:text-white">{watchlist.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(watchlist.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(watchlist.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Tokens</span>
                      <span className="font-medium text-gray-900 dark:text-white">{tokens.length}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Actions</h4>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleRefresh}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh Data
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Notification Settings
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 