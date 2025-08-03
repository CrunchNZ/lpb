import { configureStore } from '@reduxjs/toolkit';
import botReducer, { setStatus, updateConfig, startBot, pauseBot, stopBot, updatePerformance } from '../src/frontend/store/slices/botSlice';
import positionsReducer, { setPositions, addPosition, closePosition, updatePosition } from '../src/frontend/store/slices/positionsSlice';
import performanceReducer, { setMetrics, setTimeRange, setSelectedMetric } from '../src/frontend/store/slices/performanceSlice';
import uiReducer, { setTheme, toggleTheme, addNotification, setSidebarOpen, toggleSidebar } from '../src/frontend/store/slices/uiSlice';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      bot: botReducer,
      positions: positionsReducer,
      performance: performanceReducer,
      ui: uiReducer,
    },
  });
};

describe('Redux Store', () => {
  describe('Bot Slice', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      store = createTestStore();
    });

    it('should have initial state', () => {
      const state = store.getState().bot;
      expect(state.status).toBe('idle');
      expect(state.isConnected).toBe(false);
      expect(state.config.strategy).toBe('balanced');
      expect(state.error).toBe(null);
    });

    it('should update bot status', () => {
      store.dispatch(setStatus('running'));
      expect(store.getState().bot.status).toBe('running');
    });

    it('should update bot config', () => {
      const newConfig = { strategy: 'aggressive' as const, maxPositions: 15 };
      store.dispatch(updateConfig(newConfig));
      const state = store.getState().bot;
      expect(state.config.strategy).toBe('aggressive');
      expect(state.config.maxPositions).toBe(15);
    });

    it('should start bot', () => {
      store.dispatch(startBot());
      const state = store.getState().bot;
      expect(state.status).toBe('running');
      expect(state.error).toBe(null);
    });

    it('should pause bot', () => {
      store.dispatch(startBot());
      store.dispatch(pauseBot());
      expect(store.getState().bot.status).toBe('paused');
    });

    it('should stop bot', () => {
      store.dispatch(startBot());
      store.dispatch(stopBot());
      expect(store.getState().bot.status).toBe('idle');
    });
  });

  describe('Positions Slice', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      store = createTestStore();
    });

    it('should have initial state', () => {
      const state = store.getState().positions;
      expect(state.positions).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.selectedPosition).toBe(null);
    });

    it('should set positions', () => {
      const mockPositions = [
        {
          id: 'pos_1',
          strategy: 'balanced',
          poolAddress: 'pool123',
          tokenA: 'SOL',
          tokenB: 'USDC',
          amountA: 100,
          amountB: 2000,
          entryPrice: 20.5,
          currentPrice: 21.0,
          timestamp: Date.now(),
          status: 'active',
          pnl: 50,
          apy: 25.5
        }
      ];

      store.dispatch(setPositions(mockPositions));
      const state = store.getState().positions;
      expect(state.positions).toHaveLength(1);
      expect(state.positions[0].id).toBe('pos_1');
      expect(state.stats.totalPositions).toBe(1);
      expect(state.stats.activePositions).toBe(1);
    });

    it('should add position', () => {
      const newPosition = {
        id: 'pos_2',
        strategy: 'aggressive',
        poolAddress: 'pool456',
        tokenA: 'SOL',
        tokenB: 'USDC',
        amountA: 200,
        amountB: 4000,
        entryPrice: 20.0,
        currentPrice: 22.0,
        timestamp: Date.now(),
        status: 'active',
        pnl: 100,
        apy: 30.0
      };

      store.dispatch(addPosition(newPosition));
      const state = store.getState().positions;
      expect(state.positions).toHaveLength(1);
      expect(state.positions[0].id).toBe('pos_2');
      expect(state.stats.totalPositions).toBe(1);
    });

    it('should close position', () => {
      const mockPositions = [
        {
          id: 'pos_1',
          strategy: 'balanced',
          poolAddress: 'pool123',
          tokenA: 'SOL',
          tokenB: 'USDC',
          amountA: 100,
          amountB: 2000,
          entryPrice: 20.5,
          currentPrice: 21.0,
          timestamp: Date.now(),
          status: 'active',
          pnl: 50,
          apy: 25.5
        }
      ];

      store.dispatch(setPositions(mockPositions));
      store.dispatch(closePosition('pos_1'));
      
      const state = store.getState().positions;
      expect(state.positions[0].status).toBe('closed');
      expect(state.stats.activePositions).toBe(0);
      expect(state.stats.closedPositions).toBe(1);
    });

    it('should update position', () => {
      const mockPositions = [
        {
          id: 'pos_1',
          strategy: 'balanced',
          poolAddress: 'pool123',
          tokenA: 'SOL',
          tokenB: 'USDC',
          amountA: 100,
          amountB: 2000,
          entryPrice: 20.5,
          currentPrice: 21.0,
          timestamp: Date.now(),
          status: 'active',
          pnl: 50,
          apy: 25.5
        }
      ];

      store.dispatch(setPositions(mockPositions));
      store.dispatch(updatePosition({ id: 'pos_1', updates: { pnl: 75, apy: 30.0 } }));
      
      const state = store.getState().positions;
      expect(state.positions[0].pnl).toBe(75);
      expect(state.positions[0].apy).toBe(30.0);
    });
  });

  describe('Performance Slice', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      store = createTestStore();
    });

    it('should have initial state', () => {
      const state = store.getState().performance;
      expect(state.metrics).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.timeRange).toBe('7d');
      expect(state.selectedMetric).toBe('value');
    });

    it('should set metrics', () => {
      const mockMetrics = [
        {
          id: 'perf_1',
          timestamp: Date.now(),
          totalValue: 10000,
          totalPnl: 500,
          totalApy: 25.5,
          activePositions: 2,
          closedPositions: 1,
          strategyBreakdown: JSON.stringify({
            balanced: { totalValue: 5000, totalPnl: 250, totalApy: 25.5, positionCount: 1 }
          })
        }
      ];

      store.dispatch(setMetrics(mockMetrics));
      const state = store.getState().performance;
      expect(state.metrics).toHaveLength(1);
      expect(state.metrics[0].id).toBe('perf_1');
    });

    it('should set time range', () => {
      store.dispatch(setTimeRange('30d'));
      expect(store.getState().performance.timeRange).toBe('30d');
    });

    it('should set selected metric', () => {
      store.dispatch(setSelectedMetric('pnl'));
      expect(store.getState().performance.selectedMetric).toBe('pnl');
    });
  });

  describe('UI Slice', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      store = createTestStore();
    });

    it('should have initial state', () => {
      const state = store.getState().ui;
      expect(state.theme).toBe('light');
      expect(state.sidebarOpen).toBe(true);
      expect(state.notifications).toEqual([]);
      expect(state.selectedTab).toBe('dashboard');
    });

    it('should set theme', () => {
      store.dispatch(setTheme('dark'));
      expect(store.getState().ui.theme).toBe('dark');
    });

    it('should toggle theme', () => {
      store.dispatch(toggleTheme());
      expect(store.getState().ui.theme).toBe('dark');
      
      store.dispatch(toggleTheme());
      expect(store.getState().ui.theme).toBe('light');
    });

    it('should add notification', () => {
      const notification = {
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed successfully'
      };

      store.dispatch(addNotification(notification));
      const state = store.getState().ui;
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].title).toBe('Success');
      expect(state.notifications[0].type).toBe('success');
    });

    it('should toggle sidebar', () => {
      store.dispatch(setSidebarOpen(false));
      expect(store.getState().ui.sidebarOpen).toBe(false);
      
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarOpen).toBe(true);
    });
  });

  describe('Store Integration', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      store = createTestStore();
    });

    it('should handle multiple actions across slices', () => {
      // Start bot
      store.dispatch(startBot());
      expect(store.getState().bot.status).toBe('running');

      // Add notification
      store.dispatch(addNotification({
        type: 'info',
        title: 'Bot Started',
        message: 'Liquidity bot is now running'
      }));
      expect(store.getState().ui.notifications).toHaveLength(1);

      // Add position
      const position = {
        id: 'pos_1',
        strategy: 'balanced',
        poolAddress: 'pool123',
        tokenA: 'SOL',
        tokenB: 'USDC',
        amountA: 100,
        amountB: 2000,
        entryPrice: 20.5,
        currentPrice: 21.0,
        timestamp: Date.now(),
        status: 'active',
        pnl: 50,
        apy: 25.5
      };
      store.dispatch(addPosition(position));
      expect(store.getState().positions.positions).toHaveLength(1);

      // Update performance
      store.dispatch(updatePerformance({
        totalValue: 10000,
        totalPnl: 500,
        totalApy: 25.5
      }));
      expect(store.getState().bot.totalValue).toBe(10000);
    });
  });
}); 