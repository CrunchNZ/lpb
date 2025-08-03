import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BotConfig {
  strategy: 'balanced' | 'aggressive' | 'conservative';
  maxPositions: number;
  maxInvestment: number;
  riskLevel: 'low' | 'medium' | 'high';
  autoRebalance: boolean;
  stopLoss: number;
  takeProfit: number;
  minApy: number;
  maxDrawdown: number;
}

export interface BotState {
  status: 'idle' | 'running' | 'paused' | 'error';
  isConnected: boolean;
  config: BotConfig;
  lastUpdate: number;
  error: string | null;
  walletAddress: string | null;
  totalValue: number;
  totalPnl: number;
  totalApy: number;
}

const initialState: BotState = {
  status: 'idle',
  isConnected: false,
  config: {
    strategy: 'balanced',
    maxPositions: 10,
    maxInvestment: 1000,
    riskLevel: 'medium',
    autoRebalance: false,
    stopLoss: 10,
    takeProfit: 50,
    minApy: 20,
    maxDrawdown: 15,
  },
  lastUpdate: Date.now(),
  error: null,
  walletAddress: null,
  totalValue: 0,
  totalPnl: 0,
  totalApy: 0,
};

const botSlice = createSlice({
  name: 'bot',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<BotState['status']>) => {
      state.status = action.payload;
      state.lastUpdate = Date.now();
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      state.lastUpdate = Date.now();
    },
    updateConfig: (state, action: PayloadAction<Partial<BotConfig>>) => {
      state.config = { ...state.config, ...action.payload };
      state.lastUpdate = Date.now();
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.lastUpdate = Date.now();
    },
    setWalletAddress: (state, action: PayloadAction<string | null>) => {
      state.walletAddress = action.payload;
      state.lastUpdate = Date.now();
    },
    updatePerformance: (state, action: PayloadAction<{
      totalValue: number;
      totalPnl: number;
      totalApy: number;
    }>) => {
      state.totalValue = action.payload.totalValue;
      state.totalPnl = action.payload.totalPnl;
      state.totalApy = action.payload.totalApy;
      state.lastUpdate = Date.now();
    },
    startBot: (state) => {
      state.status = 'running';
      state.error = null;
      state.lastUpdate = Date.now();
    },
    pauseBot: (state) => {
      state.status = 'paused';
      state.lastUpdate = Date.now();
    },
    stopBot: (state) => {
      state.status = 'idle';
      state.lastUpdate = Date.now();
    },
    resetBot: (state) => {
      state.status = 'idle';
      state.error = null;
      state.lastUpdate = Date.now();
    },
  },
});

export const {
  setStatus,
  setConnected,
  updateConfig,
  setError,
  setWalletAddress,
  updatePerformance,
  startBot,
  pauseBot,
  stopBot,
  resetBot,
} = botSlice.actions;

export default botSlice.reducer; 