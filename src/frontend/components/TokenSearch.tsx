/**
 * TokenSearch Component
 * Provides token search functionality with filters and Dexscreener-like display
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useTheme } from '../store/hooks';
import { TokenData, SearchFilters } from '../../backend/integrations/dexscreener';

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
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    chainId: 'solana',
    minVolume: 1000000, // $1M default
    minMarketCap: 150000 // $150K minimum
  });
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Infinite scroll state
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTokenRef = useRef<HTMLTableRowElement | null>(null);

  // Debounced search
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
        // This would be replaced with actual API call
        const mockTokens: TokenData[] = generateMockTokens(query, filters);
        
        if (resetPage) {
          setTokens(mockTokens);
        } else {
          setTokens(prev => [...prev, ...mockTokens]);
        }
        
        setHasMore(mockTokens.length >= 20); // Assume 20 tokens per page
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Searching tokens...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-red-500 text-center">{error}</div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && tokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({tokens.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile-optimized table container with horizontal scroll */}
            <div className="relative">
              {/* Scroll indicator for mobile */}
              <div className="hidden sm:block absolute top-0 right-0 bg-gradient-to-l from-background via-background/80 to-transparent w-8 h-full pointer-events-none z-10" />
              
              {/* Table wrapper with horizontal scroll */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden border rounded-lg">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-8">
                            #
                          </th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px]">
                            Token
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[80px]">
                            Price
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[70px]">
                            24h
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[90px] hidden sm:table-cell">
                            Volume
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[90px] hidden lg:table-cell">
                            MCap
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[60px] hidden md:table-cell">
                            Age
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[100px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {tokens.map((token, index) => (
                          <tr 
                            key={`${token.pairAddress}-${index}`} 
                            className="hover:bg-muted/50 transition-colors"
                            ref={index === tokens.length - 1 ? lastTokenElementRef : null}
                          >
                            <td className="px-2 py-3 whitespace-nowrap text-xs text-muted-foreground">
                              {index + 1}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-foreground">{token.symbol}</div>
                                <div className="text-xs text-muted-foreground hidden sm:block truncate max-w-[100px]">
                                  {token.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                              {formatNumber(token.price)}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-right text-sm">
                              <span
                                className={`font-medium ${
                                  token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}
                              >
                                {token.priceChange24h >= 0 ? '+' : ''}
                                {token.priceChange24h.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-right text-sm text-muted-foreground hidden sm:table-cell">
                              {formatNumber(token.volume24h)}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-right text-sm text-muted-foreground hidden lg:table-cell">
                              {formatNumber(token.marketCap)}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-right text-sm text-muted-foreground hidden md:table-cell">
                              {formatAge(token.age)}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-center">
                              <div className="flex gap-1 justify-center items-center">
                                {onTokenSelect && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onTokenSelect(token)}
                                    className="text-xs px-2 py-1 h-7"
                                  >
                                    View
                                  </Button>
                                )}
                                {onAddToWatchlist && watchlists.length > 0 && (
                                  <Select
                                    onValueChange={(watchlistId: string) =>
                                      onAddToWatchlist(token, parseInt(watchlistId))
                                    }
                                  >
                                    <SelectTrigger className="w-12 sm:w-16 h-7 text-xs">
                                      <SelectValue placeholder="+" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {watchlists.map((watchlist) => (
                                        <SelectItem key={watchlist.id} value={watchlist.id.toString()}>
                                          {watchlist.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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

// Mock data generator for development
function generateMockTokens(query: string, filters: SearchFilters): TokenData[] {
  const mockTokens: TokenData[] = [
    {
      symbol: 'PEPE',
      name: 'Pepe',
      price: 0.00000123,
      priceChange24h: 15.67,
      priceChange1h: 2.34,
      priceChange6h: 8.91,
      volume24h: 2500000,
      marketCap: 500000,
      liquidity: 150000,
      age: 48,
      holders: 1250,
      transactions24h: 850,
      pairAddress: '0x1234567890abcdef',
      chainId: 'solana',
      dexId: 'raydium'
    },
    {
      symbol: 'DOGE',
      name: 'Dogecoin',
      price: 0.078,
      priceChange24h: -5.23,
      priceChange1h: -1.45,
      priceChange6h: -3.12,
      volume24h: 15000000,
      marketCap: 1200000,
      liquidity: 500000,
      age: 72,
      holders: 2100,
      transactions24h: 1200,
      pairAddress: '0xabcdef1234567890',
      chainId: 'solana',
      dexId: 'raydium'
    },
    {
      symbol: 'SHIB',
      name: 'Shiba Inu',
      price: 0.00000089,
      priceChange24h: 8.45,
      priceChange1h: 1.23,
      priceChange6h: 4.67,
      volume24h: 8000000,
      marketCap: 800000,
      liquidity: 300000,
      age: 24,
      holders: 950,
      transactions24h: 650,
      pairAddress: '0x9876543210fedcba',
      chainId: 'solana',
      dexId: 'raydium'
    }
  ];

  // Filter based on search query
  return mockTokens.filter(token =>
    token.symbol.toLowerCase().includes(query.toLowerCase()) ||
    token.name.toLowerCase().includes(query.toLowerCase())
  );
} 