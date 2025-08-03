import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TokenData {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChange1h: number;
  priceChange6h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  age: number;
  holders: number;
  transactions24h: number;
  pairAddress: string;
  chainId: string;
  dexId: string;
}

export interface SearchFilters {
  chainId?: string;
  minVolume?: number;
  maxVolume?: number;
  minAge?: number;
  maxAge?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minLiquidity?: number;
  trending?: 'gainers' | 'losers' | 'new';
}

export interface SearchResult {
  tokens: TokenData[];
  totalCount: number;
  hasMore: boolean;
}

export interface DexScreenerState {
  searchQuery: string;
  searchResults: SearchResult | null;
  trendingTokens: TokenData[];
  selectedToken: TokenData | null;
  filters: SearchFilters;
  loading: boolean;
  error: string | null;
  activeView: 'search' | 'trending' | 'details' | 'filters';
  sortBy: 'price' | 'volume' | 'marketCap' | 'priceChange24h' | 'age';
  sortOrder: 'asc' | 'desc';
  page: number;
  itemsPerPage: number;
  cacheStats: {
    size: number;
    keys: string[];
  } | null;
}

const initialState: DexScreenerState = {
  searchQuery: '',
  searchResults: null,
  trendingTokens: [],
  selectedToken: null,
  filters: {
    chainId: 'solana',
    minMarketCap: 150000,
  },
  loading: false,
  error: null,
  activeView: 'search',
  sortBy: 'volume',
  sortOrder: 'desc',
  page: 1,
  itemsPerPage: 20,
  cacheStats: null,
};

const dexscreenerSlice = createSlice({
  name: 'dexscreener',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setSearchResults: (state, action: PayloadAction<SearchResult>) => {
      state.searchResults = action.payload;
      state.loading = false;
      state.error = null;
    },
    setTrendingTokens: (state, action: PayloadAction<TokenData[]>) => {
      state.trendingTokens = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedToken: (state, action: PayloadAction<TokenData | null>) => {
      state.selectedToken = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setActiveView: (state, action: PayloadAction<DexScreenerState['activeView']>) => {
      state.activeView = action.payload;
    },
    setSortBy: (state, action: PayloadAction<DexScreenerState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
      state.page = 1;
    },
    setCacheStats: (state, action: PayloadAction<{ size: number; keys: string[] }>) => {
      state.cacheStats = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = null;
      state.selectedToken = null;
      state.page = 1;
    },
    resetFilters: (state) => {
      state.filters = {
        chainId: 'solana',
        minMarketCap: 150000,
      };
      state.page = 1;
    },
  },
});

export const {
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
  setItemsPerPage,
  setCacheStats,
  clearSearch,
  resetFilters,
} = dexscreenerSlice.actions;

export default dexscreenerSlice.reducer; 