import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Position } from '../../backend/database';

export interface PositionsState {
  positions: Position[];
  loading: boolean;
  error: string | null;
  selectedPosition: string | null;
  filters: {
    status: 'all' | 'active' | 'closed' | 'pending';
    strategy: 'all' | 'balanced' | 'aggressive' | 'conservative';
    timeRange: '1d' | '7d' | '30d' | '90d' | '1y';
  };
  stats: {
    totalPositions: number;
    activePositions: number;
    closedPositions: number;
    totalValue: number;
    totalPnl: number;
    averageApy: number;
  };
}

const initialState: PositionsState = {
  positions: [],
  loading: false,
  error: null,
  selectedPosition: null,
  filters: {
    status: 'all',
    strategy: 'all',
    timeRange: '7d',
  },
  stats: {
    totalPositions: 0,
    activePositions: 0,
    closedPositions: 0,
    totalValue: 0,
    totalPnl: 0,
    averageApy: 0,
  },
};

const positionsSlice = createSlice({
  name: 'positions',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPositions: (state, action: PayloadAction<Position[]>) => {
      state.positions = action.payload;
      // Update stats based on positions
      state.stats = calculateStats(action.payload);
    },
    addPosition: (state, action: PayloadAction<Position>) => {
      state.positions.push(action.payload);
      state.stats = calculateStats(state.positions);
    },
    updatePosition: (state, action: PayloadAction<{ id: string; updates: Partial<Position> }>) => {
      const index = state.positions.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.positions[index] = { ...state.positions[index], ...action.payload.updates };
        state.stats = calculateStats(state.positions);
      }
    },
    removePosition: (state, action: PayloadAction<string>) => {
      state.positions = state.positions.filter(p => p.id !== action.payload);
      state.stats = calculateStats(state.positions);
    },
    setSelectedPosition: (state, action: PayloadAction<string | null>) => {
      state.selectedPosition = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<PositionsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    closePosition: (state, action: PayloadAction<string>) => {
      const position = state.positions.find(p => p.id === action.payload);
      if (position) {
        position.status = 'closed';
        state.stats = calculateStats(state.positions);
      }
    },
    pausePosition: (state, action: PayloadAction<string>) => {
      const position = state.positions.find(p => p.id === action.payload);
      if (position) {
        position.status = 'pending';
        state.stats = calculateStats(state.positions);
      }
    },
    resumePosition: (state, action: PayloadAction<string>) => {
      const position = state.positions.find(p => p.id === action.payload);
      if (position) {
        position.status = 'active';
        state.stats = calculateStats(state.positions);
      }
    },
    updatePositionPrice: (state, action: PayloadAction<{ id: string; currentPrice: number; pnl: number }>) => {
      const position = state.positions.find(p => p.id === action.payload.id);
      if (position) {
        position.currentPrice = action.payload.currentPrice;
        position.pnl = action.payload.pnl;
        state.stats = calculateStats(state.positions);
      }
    },
  },
});

// Helper function to calculate stats from positions
const calculateStats = (positions: Position[]) => {
  const totalPositions = positions.length;
  const activePositions = positions.filter(p => p.status === 'active').length;
  const closedPositions = positions.filter(p => p.status === 'closed').length;
  const totalValue = positions.reduce((sum, p) => sum + (p.amountA * p.currentPrice + p.amountB), 0);
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const averageApy = positions.length > 0
    ? positions.reduce((sum, p) => sum + p.apy, 0) / positions.length
    : 0;

  return {
    totalPositions,
    activePositions,
    closedPositions,
    totalValue,
    totalPnl,
    averageApy,
  };
};

export const {
  setLoading,
  setError,
  setPositions,
  addPosition,
  updatePosition,
  removePosition,
  setSelectedPosition,
  setFilters,
  clearFilters,
  closePosition,
  pausePosition,
  resumePosition,
  updatePositionPrice,
} = positionsSlice.actions;

export default positionsSlice.reducer;
