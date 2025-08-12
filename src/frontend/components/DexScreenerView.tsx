/**
 * DexScreenerView Component
 * Enhanced version with comprehensive token search and display functionality
 * Matches TokenSearch styling and includes all requested features
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setSearchResults, setTrendingTokens, setLoading, setError } from '../store/slices/dexscreenerSlice';
import { DatabaseManager } from '../../backend/database/DatabaseManager';
import { dexscreenerService } from '../services/dexscreenerService';
import { TokenData } from '../../backend/integrations/dexscreener';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Filter, Copy, ExternalLink, TrendingUp, TrendingDown, Clock, Users, Activity, Eye, Zap, Star } from 'lucide-react';
import { TokenDetailView } from './TokenDetailView';
import { WatchlistSelector } from './WatchlistSelector';

interface SearchFilters {
  minMarketCap?: number;
  minVolume?: number;
  chainId?: string;
  trending?: string;
}

interface DexScreenerViewProps {
  databaseManager?: DatabaseManager | null;
  onTokenSelect?: (token: TokenData) => void;
  onAddToWatchlist?: (token: TokenData, watchlistId: number) => void;
  watchlists?: Array<{ id: number; name: string }>;
}

export const DexScreenerView: React.FC<DexScreenerViewProps> = ({ 
  databaseManager,
  onTokenSelect,
  onAddToWatchlist,
  watchlists = []
}) => {
  const dispatch = useAppDispatch();
  const { searchResults, trendingTokens, loading, error } = useAppSelector((state) => state.dexscreener);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    chainId: 'solana',
    minVolume: 100000,
    minMarketCap: 150000,
  });
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'volume' | 'marketCap' | 'priceChange24h' | 'age'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'search' | 'trending'>('search');

  const debouncedSearch = useCallback(
    debounce(async (query: string, filters: SearchFilters) => {
      if (!query.trim()) {
        dispatch(setSearchResults({ tokens: [], totalCount: 0, hasMore: false }));
        return;
      }

      dispatch(setLoading(true));
      dispatch(setError(null));
      
      try {
        const result = await dexscreenerService.searchTokens(query, filters);
        dispatch(setSearchResults(result));
      } catch (err) {
        dispatch(setError(err instanceof Error ? err.message : 'Search failed'));
      } finally {
        dispatch(setLoading(false));
      }
    }, 500),
    [dispatch]
  );

  useEffect(() => {
    debouncedSearch(searchQuery, filters);
  }, [searchQuery, filters, debouncedSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTrending = async () => {
    dispatch(setLoading(true));
    
    try {
      const tokens = await dexscreenerService.getTrendingTokens(filters);
      dispatch(setTrendingTokens(tokens));
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to load trending tokens'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (num: number): string => {
    const color = num >= 0 ? 'text-green-500' : 'text-red-500';
    const sign = num >= 0 ? '+' : '';
    return `<span class="${color}">${sign}${num.toFixed(2)}%</span>`;
  };

  const formatAge = (hours: number): string => {
    if (hours < 1) return '<1h';
    if (hours < 24) return `${Math.floor(hours)}h`;
    return `${Math.floor(hours / 24)}d`;
  };

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
        explorerUrl = `https://solscan.io/token/${address}`;
        break;
      case 'ethereum':
        explorerUrl = `https://etherscan.io/token/${address}`;
        break;
      default:
        explorerUrl = `https://explorer.${chainId}.org/token/${address}`;
    }
    window.open(explorerUrl, '_blank');
  };

  const handleTokenClick = (token: TokenData) => {
    setSelectedToken(token);
    if (onTokenSelect) {
      onTokenSelect(token);
    }
  };

  const handleBackToSearch = () => {
    setSelectedToken(null);
  };

  // Sort tokens based on current sort settings
  const getSortedTokens = (tokens: TokenData[]) => {
    return [...tokens].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'volume':
          aValue = a.volume24h;
          bValue = b.volume24h;
          break;
        case 'marketCap':
          aValue = a.marketCap;
          bValue = b.marketCap;
          break;
        case 'priceChange24h':
          aValue = a.priceChange24h;
          bValue = b.priceChange24h;
          break;
        case 'age':
          aValue = a.age;
          bValue = b.age;
          break;
        default:
          aValue = a.volume24h;
          bValue = b.volume24h;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // If a token is selected, show the detail view
  if (selectedToken) {
    return (
      <TokenDetailView
        token={selectedToken}
        onBack={handleBackToSearch}
        onAddToWatchlist={onAddToWatchlist ? (token) => onAddToWatchlist(token, 1) : undefined}
      />
    );
  }

  const currentTokens = activeTab === 'search' ? (searchResults?.tokens || []) : trendingTokens;
  const sortedTokens = getSortedTokens(currentTokens);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            DexScreener
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'search' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('search')}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              variant={activeTab === 'trending' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('trending');
                handleTrending();
              }}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens by symbol or name..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto w-full"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chain</label>
                <Select
                  value={filters.chainId || ''}
                  onValueChange={(value: string) => handleFilterChange('chainId', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solana">Solana</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Min Volume</label>
                <Select
                  value={filters.minVolume?.toString() || ''}
                  onValueChange={(value: string) => handleFilterChange('minVolume', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100000">$100K</SelectItem>
                    <SelectItem value="1000000">$1M</SelectItem>
                    <SelectItem value="10000000">$10M</SelectItem>
                    <SelectItem value="100000000">$100M</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">Min Market Cap</label>
                <Select
                  value={filters.minMarketCap?.toString() || ''}
                  onValueChange={(value: string) => handleFilterChange('minMarketCap', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="150000">$150K</SelectItem>
                    <SelectItem value="1000000">$1M</SelectItem>
                    <SelectItem value="10000000">$10M</SelectItem>
                    <SelectItem value="100000000">$100M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">
                {activeTab === 'search' ? 'Searching tokens...' : 'Loading trending tokens...'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && sortedTokens.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {activeTab === 'search' ? 'Search Results' : 'Trending Tokens'} ({sortedTokens.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="marketCap">Market Cap</SelectItem>
                    <SelectItem value="priceChange24h">24h Change</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedTokens.map((token, index) => (
                <div
                  key={`${token.pairAddress}-${index}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleTokenClick(token)}
                >
                  <div className="flex items-center gap-3">
                    {/* Token Logo */}
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {token.symbol.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{token.symbol}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {token.dexId}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{token.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {token.contractAddress ? 
                          `${token.contractAddress.slice(0, 6)}...${token.contractAddress.slice(-4)}` : 
                          'No contract address'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(token.price)}</p>
                      <p 
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: formatPercentage(token.priceChange24h) }}
                      />
                    </div>

                    {/* Volume Indicators */}
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">5m</span>
                      </div>
                      <p className="text-sm font-medium">{formatNumber(token.volume5m)}</p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">1h</span>
                      </div>
                      <p className="text-sm font-medium">{formatNumber(token.volume1h)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">{formatNumber(token.volume24h)}</p>
                      <p className="text-xs text-muted-foreground">24h Volume</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">{formatNumber(token.marketCap)}</p>
                      <p className="text-xs text-muted-foreground">Market Cap</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatAge(token.age)}</span>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(token.pairAddress);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openExplorer(token.contractAddress || token.pairAddress, token.chainId);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <WatchlistSelector
                        token={token}
                        onAddToWatchlist={onAddToWatchlist}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTokenClick(token);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && activeTab === 'search' && searchQuery && (!searchResults || searchResults.tokens.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No tokens found matching your search.</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && activeTab === 'trending' && trendingTokens.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No trending tokens available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 