/**
 * TokenSearch Component
 * Provides token search functionality with filters and Dexscreener-like display
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Filter, Copy, ExternalLink, TrendingUp, TrendingDown, Clock, Users, Activity, Eye, Zap, Star } from 'lucide-react';
import { TokenData, SearchFilters } from '@/backend/integrations/dexscreener';
import { dexscreenerService } from '../services/dexscreenerService';
import { TokenDetailView } from './TokenDetailView';
import { WatchlistSelector } from './WatchlistSelector';

interface TokenSearchProps {
  onTokenSelect?: (token: TokenData) => void;
  onAddToWatchlist?: (token: TokenData, watchlistId: number) => void;
  watchlists?: Array<{ id: number; name: string }>;
}

export const TokenSearch: React.FC<TokenSearchProps> = ({
  onTokenSelect,
  onAddToWatchlist,
  watchlists = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    chainId: 'solana',
    minVolume: 100000,
    minMarketCap: 150000,
  });
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'volume' | 'marketCap' | 'priceChange24h' | 'age'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const observerRef = useRef<IntersectionObserver | null>(null);

  const debouncedSearch = useCallback(
    debounce(async (query: string, filters: SearchFilters, resetPage: boolean = true) => {
      if (!query.trim()) {
        setTokens([]);
        setHasMore(true);
        setPage(1);
        return;
      }

      setLoading(true);
      setError(null);
      
      if (resetPage) {
        setPage(1);
        setTokens([]);
      }

      try {
        // Use real API call instead of mock data
        const result = await dexscreenerService.searchTokens(query, filters);
        
        if (resetPage) {
          setTokens(result.tokens);
        } else {
          setTokens(prev => [...prev, ...result.tokens]);
        }
        
        setHasMore(result.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setTokens([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery, filters, true);
  }, [searchQuery, filters, debouncedSearch]);

  // Infinite scroll setup
  const lastTokenElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (loading || loadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
        setLoadingMore(true);
        debouncedSearch(searchQuery, filters, false);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, searchQuery, filters, debouncedSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
  };

  const handleBackToSearch = () => {
    setSelectedToken(null);
  };

  // Sort tokens based on current sort settings
  const sortedTokens = [...tokens].sort((a, b) => {
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

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Token Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <label className="text-sm font-medium">Trending</label>
                <Select
                  value={filters.trending || ''}
                  onValueChange={(value: string) => handleFilterChange('trending', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All tokens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gainers">Top Gainers</SelectItem>
                    <SelectItem value="losers">Top Losers</SelectItem>
                    <SelectItem value="new">New Pairs</SelectItem>
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
              <span className="text-muted-foreground">Searching tokens...</span>
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
              <CardTitle>Search Results ({sortedTokens.length})</CardTitle>
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
                  ref={index === sortedTokens.length - 1 ? lastTokenElementRef : null}
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

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground text-sm">Loading more tokens...</span>
                </div>
              )}
              
              {/* End of results indicator */}
              {!hasMore && tokens.length > 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No more tokens to load
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && searchQuery && tokens.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No tokens found matching your search.</p>
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