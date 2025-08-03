import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setSearchQuery,
  setSearchResults,
  setTrendingTokens,
  setSelectedToken,
  updateFilters,
  setLoading,
  setError,
  setActiveView,
  setSortBy,
  setSortOrder,
  setPage,
  clearSearch,
  resetFilters,
  TokenData,
  SearchFilters,
} from '../store/slices/dexscreenerSlice';
import { LoadingSpinner } from './LoadingSpinner';

interface DexScreenerViewProps {
  databaseManager?: any;
}

export const DexScreenerView: React.FC<DexScreenerViewProps> = ({ databaseManager }) => {
  const dispatch = useAppDispatch();
  const {
    searchQuery,
    searchResults,
    trendingTokens,
    selectedToken,
    filters,
    loading,
    error,
    activeView,
    sortBy,
    sortOrder,
    page,
    itemsPerPage,
  } = useAppSelector((state) => state.dexscreener);

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Mock DexScreener API calls (in production, these would be real API calls)
  const searchTokens = useCallback(async (query: string, filters: SearchFilters) => {
    dispatch(setLoading(true));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const mockTokens: TokenData[] = [
        {
          symbol: 'SOL',
          name: 'Solana',
          price: 20.5,
          priceChange24h: 5.2,
          priceChange1h: 1.1,
          priceChange6h: 3.4,
          volume24h: 50000000,
          marketCap: 1000000000,
          liquidity: 25000000,
          age: 48,
          holders: 50000,
          transactions24h: 15000,
          pairAddress: '0x1234567890abcdef',
          chainId: 'solana',
          dexId: 'raydium'
        },
        {
          symbol: 'BONK',
          name: 'Bonk',
          price: 0.0006,
          priceChange24h: 15.7,
          priceChange1h: 2.3,
          priceChange6h: 8.9,
          volume24h: 1200000,
          marketCap: 500000,
          liquidity: 150000,
          age: 24,
          holders: 1250,
          transactions24h: 850,
          pairAddress: '0xabcdef1234567890',
          chainId: 'solana',
          dexId: 'raydium'
        },
        {
          symbol: 'RAY',
          name: 'Raydium',
          price: 15.2,
          priceChange24h: 3.8,
          priceChange1h: 0.5,
          priceChange6h: 2.1,
          volume24h: 8000000,
          marketCap: 300000000,
          liquidity: 5000000,
          age: 72,
          holders: 8000,
          transactions24h: 1200,
          pairAddress: '0xraydium123456',
          chainId: 'solana',
          dexId: 'raydium'
        },
        {
          symbol: 'JUP',
          name: 'Jupiter',
          price: 8.9,
          priceChange24h: 12.3,
          priceChange1h: 1.8,
          priceChange6h: 6.7,
          volume24h: 15000000,
          marketCap: 200000000,
          liquidity: 3000000,
          age: 36,
          holders: 4500,
          transactions24h: 950,
          pairAddress: '0xjupiter123456',
          chainId: 'solana',
          dexId: 'raydium'
        }
      ];

      // Filter tokens based on query and filters
      const filteredTokens = mockTokens.filter(token => {
        const matchesQuery = query === '' || 
          token.symbol.toLowerCase().includes(query.toLowerCase()) ||
          token.name.toLowerCase().includes(query.toLowerCase());
        
        const matchesFilters = applyFilters(token, filters);
        
        return matchesQuery && matchesFilters;
      });

      dispatch(setSearchResults({
        tokens: filteredTokens,
        totalCount: filteredTokens.length,
        hasMore: false
      }));
    } catch (err) {
      dispatch(setError('Failed to search tokens'));
    }
  }, [dispatch]);

  const loadTrendingTokens = useCallback(async (trendingType: 'gainers' | 'losers' | 'new' = 'gainers') => {
    dispatch(setLoading(true));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockTrendingTokens: TokenData[] = [
        {
          symbol: 'SOL',
          name: 'Solana',
          price: 20.5,
          priceChange24h: trendingType === 'gainers' ? 15.2 : trendingType === 'losers' ? -8.7 : 5.2,
          priceChange1h: 1.1,
          priceChange6h: 3.4,
          volume24h: 50000000,
          marketCap: 1000000000,
          liquidity: 25000000,
          age: trendingType === 'new' ? 2 : 48,
          holders: 50000,
          transactions24h: 15000,
          pairAddress: '0x1234567890abcdef',
          chainId: 'solana',
          dexId: 'raydium'
        },
        {
          symbol: 'BONK',
          name: 'Bonk',
          price: 0.0006,
          priceChange24h: trendingType === 'gainers' ? 25.7 : trendingType === 'losers' ? -12.3 : 15.7,
          priceChange1h: 2.3,
          priceChange6h: 8.9,
          volume24h: 1200000,
          marketCap: 500000,
          liquidity: 150000,
          age: trendingType === 'new' ? 1 : 24,
          holders: 1250,
          transactions24h: 850,
          pairAddress: '0xabcdef1234567890',
          chainId: 'solana',
          dexId: 'raydium'
        }
      ];

      dispatch(setTrendingTokens(mockTrendingTokens));
    } catch (err) {
      dispatch(setError('Failed to load trending tokens'));
    }
  }, [dispatch]);

  // Apply filters to token data
  const applyFilters = (token: TokenData, filters: SearchFilters): boolean => {
    if (filters.minVolume && token.volume24h < filters.minVolume) return false;
    if (filters.maxVolume && token.volume24h > filters.maxVolume) return false;
    if (filters.minAge && token.age < filters.minAge) return false;
    if (filters.maxAge && token.age > filters.maxAge) return false;
    if (filters.minMarketCap && token.marketCap < filters.minMarketCap) return false;
    if (filters.maxMarketCap && token.marketCap > filters.maxMarketCap) return false;
    if (filters.minLiquidity && token.liquidity < filters.minLiquidity) return false;
    return true;
  };

  // Handle search input with debouncing
  const handleSearchChange = (query: string) => {
    dispatch(setSearchQuery(query));
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (query.trim()) {
        searchTokens(query, filters);
      } else {
        dispatch(setSearchResults(null));
      }
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    dispatch(updateFilters(newFilters));
    if (searchQuery.trim()) {
      searchTokens(searchQuery, { ...filters, ...newFilters });
    }
  };

  // Load trending tokens on component mount
  useEffect(() => {
    loadTrendingTokens('gainers');
  }, [loadTrendingTokens]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const TokenCard: React.FC<{ token: TokenData; onClick?: () => void }> = ({ token, onClick }) => (
    <div 
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">{token.symbol.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{token.symbol}</h3>
            <p className="text-gray-400 text-sm">{token.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">{formatCurrency(token.price)}</p>
          <p className={`text-sm ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercentage(token.priceChange24h)}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-400">Volume 24h</p>
          <p className="text-white">{formatCurrency(token.volume24h)}</p>
        </div>
        <div>
          <p className="text-gray-400">Market Cap</p>
          <p className="text-white">{formatCurrency(token.marketCap)}</p>
        </div>
        <div>
          <p className="text-gray-400">Liquidity</p>
          <p className="text-white">{formatCurrency(token.liquidity)}</p>
        </div>
        <div>
          <p className="text-gray-400">Holders</p>
          <p className="text-white">{formatNumber(token.holders)}</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{token.dexId.toUpperCase()}</span>
          <span>{token.chainId.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );

  const FilterPanel: React.FC = () => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">Filters</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Chain</label>
          <select
            value={filters.chainId || 'solana'}
            onChange={(e) => handleFilterChange({ chainId: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="solana">Solana</option>
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="polygon">Polygon</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Min Volume</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minVolume || ''}
              onChange={(e) => handleFilterChange({ minVolume: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Max Volume</label>
            <input
              type="number"
              placeholder="∞"
              value={filters.maxVolume || ''}
              onChange={(e) => handleFilterChange({ maxVolume: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Min Market Cap</label>
            <input
              type="number"
              placeholder="150,000"
              value={filters.minMarketCap || ''}
              onChange={(e) => handleFilterChange({ minMarketCap: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Max Market Cap</label>
            <input
              type="number"
              placeholder="∞"
              value={filters.maxMarketCap || ''}
              onChange={(e) => handleFilterChange({ maxMarketCap: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Min Liquidity</label>
          <input
            type="number"
            placeholder="0"
            value={filters.minLiquidity || ''}
            onChange={(e) => handleFilterChange({ minLiquidity: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => resetFilters()}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Reset
          </button>
          <button
            onClick={() => dispatch(setActiveView('search'))}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  const TrendingPanel: React.FC = () => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Trending Tokens</h3>
        <div className="flex space-x-2">
          {(['gainers', 'losers', 'new'] as const).map((type) => (
            <button
              key={type}
              onClick={() => loadTrendingTokens(type)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 bg-white/10 hover:bg-white/20 text-white"
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {trendingTokens.map((token) => (
            <TokenCard
              key={token.symbol}
              token={token}
              onClick={() => dispatch(setSelectedToken(token))}
            />
          ))}
        </div>
      )}
    </div>
  );

  const TokenDetails: React.FC<{ token: TokenData }> = ({ token }) => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">{token.symbol.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{token.symbol}</h2>
            <p className="text-gray-400">{token.name}</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(setSelectedToken(null))}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Price</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(token.price)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">24h Change</p>
          <p className={`text-xl font-bold ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercentage(token.priceChange24h)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Volume 24h</p>
          <p className="text-xl font-bold text-white">{formatCurrency(token.volume24h)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Market Cap</p>
          <p className="text-xl font-bold text-white">{formatCurrency(token.marketCap)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-white font-semibold">Price Changes</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">1h</span>
              <span className={`${token.priceChange1h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(token.priceChange1h)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">6h</span>
              <span className={`${token.priceChange6h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(token.priceChange6h)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">24h</span>
              <span className={`${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(token.priceChange24h)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-white font-semibold">Token Info</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Liquidity</span>
              <span className="text-white">{formatCurrency(token.liquidity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Holders</span>
              <span className="text-white">{formatNumber(token.holders)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transactions 24h</span>
              <span className="text-white">{formatNumber(token.transactions24h)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Age</span>
              <span className="text-white">{token.age}h</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>DEX: {token.dexId.toUpperCase()}</span>
          <span>Chain: {token.chainId.toUpperCase()}</span>
          <span>Pair: {token.pairAddress.slice(0, 8)}...{token.pairAddress.slice(-6)}</span>
        </div>
      </div>
    </div>
  );

  if (loading && !searchResults && !trendingTokens.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-red-400">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
        <button
          onClick={() => dispatch(setError(null))}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DexScreener Explorer</h1>
          <p className="text-gray-400">Search and analyze tokens across multiple DEXes</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => dispatch(clearSearch())}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Clear
          </button>
          <button
            onClick={() => dispatch(setActiveView('filters'))}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Filters
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tokens by symbol or name..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading && <LoadingSpinner />}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-2">
        {[
          { id: 'search', label: 'Search Results', icon: '🔍' },
          { id: 'trending', label: 'Trending', icon: '📈' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch(setActiveView(tab.id as any))}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeView === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeView === 'search' && (
        <div className="space-y-6">
          {searchResults && searchResults.tokens.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-gray-400">
                  Found {searchResults.totalCount} tokens
                </p>
                <div className="flex items-center space-x-4">
                  <select
                    value={sortBy}
                    onChange={(e) => dispatch(setSortBy(e.target.value as any))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="volume">Volume</option>
                    <option value="price">Price</option>
                    <option value="marketCap">Market Cap</option>
                    <option value="priceChange24h">24h Change</option>
                    <option value="age">Age</option>
                  </select>
                  <button
                    onClick={() => dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'))}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.tokens.map((token) => (
                  <TokenCard
                    key={token.symbol}
                    token={token}
                    onClick={() => dispatch(setSelectedToken(token))}
                  />
                ))}
              </div>
            </>
          )}
          
          {searchResults && searchResults.tokens.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No tokens found</h3>
              <p className="text-gray-400">Try adjusting your search query or filters</p>
            </div>
          )}
        </div>
      )}

      {activeView === 'trending' && <TrendingPanel />}
      {activeView === 'filters' && <FilterPanel />}
      {selectedToken && <TokenDetails token={selectedToken} />}
    </div>
  );
}; 