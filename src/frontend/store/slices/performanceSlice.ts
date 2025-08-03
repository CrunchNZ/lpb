import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PerformanceMetrics } from '../../backend/database';

export interface PerformanceState {
  metrics: PerformanceMetrics[];
  loading: boolean;
  error: string | null;
  timeRange: '1d' | '7d' | '30d' | '90d' | '1y';
  selectedMetric: 'value' | 'pnl' | 'apy';
  filters: {
    strategy: 'all' | 'balanced' | 'aggressive' | 'conservative';
    minApy: number;
    maxDrawdown: number;
  };
  summary: {
    totalReturn: number;
    averageApy: number;
    maxDrawdown: number;
    volatility: number;
    sharpeRatio: number;
    winRate: number;
  };
  strategyBreakdown: {
    [key: string]: {
      totalValue: number;
      totalPnl: number;
      totalApy: number;
      positionCount: number;
    };
  };
}

const initialState: PerformanceState = {
  metrics: [],
  loading: false,
  error: null,
  timeRange: '7d',
  selectedMetric: 'value',
  filters: {
    strategy: 'all',
    minApy: 0,
    maxDrawdown: 100,
  },
  summary: {
    totalReturn: 0,
    averageApy: 0,
    maxDrawdown: 0,
    volatility: 0,
    sharpeRatio: 0,
    winRate: 0,
  },
  strategyBreakdown: {},
};

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setMetrics: (state, action: PayloadAction<PerformanceMetrics[]>) => {
      state.metrics = action.payload;
      // Update summary and strategy breakdown
      state.summary = calculateSummary(action.payload);
      state.strategyBreakdown = calculateStrategyBreakdown(action.payload);
    },
    addMetric: (state, action: PayloadAction<PerformanceMetrics>) => {
      state.metrics.push(action.payload);
      state.summary = calculateSummary(state.metrics);
      state.strategyBreakdown = calculateStrategyBreakdown(state.metrics);
    },
    setTimeRange: (state, action: PayloadAction<PerformanceState['timeRange']>) => {
      state.timeRange = action.payload;
    },
    setSelectedMetric: (state, action: PayloadAction<PerformanceState['selectedMetric']>) => {
      state.selectedMetric = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<PerformanceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    updateSummary: (state, action: PayloadAction<Partial<PerformanceState['summary']>>) => {
      state.summary = { ...state.summary, ...action.payload };
    },
    updateStrategyBreakdown: (state, action: PayloadAction<PerformanceState['strategyBreakdown']>) => {
      state.strategyBreakdown = action.payload;
    },
  },
});

// Helper function to calculate performance summary
const calculateSummary = (metrics: PerformanceMetrics[]) => {
  if (metrics.length === 0) {
    return initialState.summary;
  }

  const values = metrics.map(m => m.totalValue);
  const pnls = metrics.map(m => m.totalPnl);
  const apys = metrics.map(m => m.totalApy);

  const totalReturn = values.length > 1 
    ? ((values[values.length - 1] - values[0]) / values[0]) * 100 
    : 0;
  
  const averageApy = apys.reduce((sum, apy) => sum + apy, 0) / apys.length;
  const maxDrawdown = Math.min(...pnls);
  
  // Calculate volatility (standard deviation of APY)
  const meanApy = averageApy;
  const variance = apys.reduce((sum, apy) => sum + Math.pow(apy - meanApy, 2), 0) / apys.length;
  const volatility = Math.sqrt(variance);
  
  // Calculate Sharpe ratio (simplified)
  const riskFreeRate = 0.02; // 2% annual
  const sharpeRatio = volatility > 0 ? (averageApy - riskFreeRate) / volatility : 0;
  
  // Calculate win rate
  const winningPositions = pnls.filter(pnl => pnl > 0).length;
  const winRate = pnls.length > 0 ? (winningPositions / pnls.length) * 100 : 0;

  return {
    totalReturn,
    averageApy,
    maxDrawdown,
    volatility,
    sharpeRatio,
    winRate,
  };
};

// Helper function to calculate strategy breakdown
const calculateStrategyBreakdown = (metrics: PerformanceMetrics[]) => {
  if (metrics.length === 0) {
    return {};
  }

  const latestMetric = metrics[metrics.length - 1];
  try {
    const breakdown = JSON.parse(latestMetric.strategyBreakdown);
    return breakdown;
  } catch {
    return {};
  }
};

export const {
  setLoading,
  setError,
  setMetrics,
  addMetric,
  setTimeRange,
  setSelectedMetric,
  setFilters,
  clearFilters,
  updateSummary,
  updateStrategyBreakdown,
} = performanceSlice.actions;

export default performanceSlice.reducer; 