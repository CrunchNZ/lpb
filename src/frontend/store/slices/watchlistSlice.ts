/**
 * Watchlist Slice
 * Redux slice for managing watchlist state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Watchlist, WatchlistToken, TokenWatchlistStatus } from '../../services/watchlistService';

export interface WatchlistState {
  watchlists: Watchlist[];
  selectedWatchlist: Watchlist | null;
  loading: boolean;
  error: string | null;
  tokenStatus: Record<string, TokenWatchlistStatus>;
}

const initialState: WatchlistState = {
  watchlists: [],
  selectedWatchlist: null,
  loading: false,
  error: null,
  tokenStatus: {},
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
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
    setWatchlists: (state, action: PayloadAction<Watchlist[]>) => {
      state.watchlists = action.payload;
      state.loading = false;
      state.error = null;
    },
    addWatchlist: (state, action: PayloadAction<Watchlist>) => {
      state.watchlists.unshift(action.payload);
      state.loading = false;
      state.error = null;
    },
    updateWatchlist: (state, action: PayloadAction<Watchlist>) => {
      const index = state.watchlists.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.watchlists[index] = action.payload;
      }
      state.loading = false;
      state.error = null;
    },
    removeWatchlist: (state, action: PayloadAction<number>) => {
      state.watchlists = state.watchlists.filter(w => w.id !== action.payload);
      if (state.selectedWatchlist?.id === action.payload) {
        state.selectedWatchlist = null;
      }
      state.loading = false;
      state.error = null;
    },
    setSelectedWatchlist: (state, action: PayloadAction<Watchlist | null>) => {
      state.selectedWatchlist = action.payload;
    },
    addTokenToWatchlist: (state, action: PayloadAction<{ watchlistId: number; token: WatchlistToken }>) => {
      const { watchlistId, token } = action.payload;
      
      // Update watchlist token count
      const watchlist = state.watchlists.find(w => w.id === watchlistId);
      if (watchlist) {
        watchlist.tokenCount = (watchlist.tokenCount || 0) + 1;
      }
      
      // Update token status
      const tokenSymbol = token.tokenSymbol.toLowerCase();
      if (!state.tokenStatus[tokenSymbol]) {
        state.tokenStatus[tokenSymbol] = {
          tokenSymbol: token.tokenSymbol,
          isWatchlisted: true,
          watchlists: [],
        };
      }
      state.tokenStatus[tokenSymbol].isWatchlisted = true;
      
      state.loading = false;
      state.error = null;
    },
    removeTokenFromWatchlist: (state, action: PayloadAction<{ watchlistId: number; tokenSymbol: string }>) => {
      const { watchlistId, tokenSymbol } = action.payload;
      
      // Update watchlist token count
      const watchlist = state.watchlists.find(w => w.id === watchlistId);
      if (watchlist && watchlist.tokenCount) {
        watchlist.tokenCount = Math.max(0, watchlist.tokenCount - 1);
      }
      
      // Update token status
      const tokenKey = tokenSymbol.toLowerCase();
      if (state.tokenStatus[tokenKey]) {
        state.tokenStatus[tokenKey].watchlists = state.tokenStatus[tokenKey].watchlists.filter(
          w => w.id !== watchlistId
        );
        state.tokenStatus[tokenKey].isWatchlisted = state.tokenStatus[tokenKey].watchlists.length > 0;
      }
      
      state.loading = false;
      state.error = null;
    },
    setTokenWatchlistStatus: (state, action: PayloadAction<TokenWatchlistStatus>) => {
      const tokenKey = action.payload.tokenSymbol.toLowerCase();
      state.tokenStatus[tokenKey] = action.payload;
    },
    clearTokenStatus: (state, action: PayloadAction<string>) => {
      const tokenKey = action.payload.toLowerCase();
      delete state.tokenStatus[tokenKey];
    },
    clearAllTokenStatus: (state) => {
      state.tokenStatus = {};
    },
  },
});

export const {
  setLoading,
  setError,
  setWatchlists,
  addWatchlist,
  updateWatchlist,
  removeWatchlist,
  setSelectedWatchlist,
  addTokenToWatchlist,
  removeTokenFromWatchlist,
  setTokenWatchlistStatus,
  clearTokenStatus,
  clearAllTokenStatus,
} = watchlistSlice.actions;

export default watchlistSlice.reducer; 