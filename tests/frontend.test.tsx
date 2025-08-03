import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PositionCard } from '../src/frontend/components/PositionCard';
import { StrategyConfig } from '../src/frontend/components/StrategyConfig';
import { PerformanceAnalytics } from '../src/frontend/components/PerformanceAnalytics';
import { Position, PerformanceMetrics } from '../src/backend/database';
import uiReducer from '../src/frontend/store/slices/uiSlice';

// Mock the database types
jest.mock('../src/backend/database', () => ({
  Position: {},
  PerformanceMetrics: {}
}));

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      ui: uiReducer
    },
    preloadedState: {
      ui: {
        theme: 'light',
        sidebarOpen: false,
        notifications: [],
        loadingStates: {},
        modals: {},
        selectedTab: 'dashboard',
        breadcrumbs: [{ label: 'Dashboard', path: '/' }],
        errorBoundary: {
          hasError: false,
          error: null,
        },
        navigation: {
          activeTab: 'positions',
          modalStack: [],
          navigationHistory: [{ tab: 'positions', timestamp: Date.now() }],
          tabBadges: {},
        }
      }
    }
  });
};

describe('Frontend Components', () => {
  describe('PositionCard', () => {
    const mockPosition: Position = {
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

    const mockOnClose = jest.fn();
    const mockOnUpdate = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render position information correctly', () => {
      render(
        <Provider store={createTestStore()}>
          <PositionCard
            position={mockPosition}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </Provider>
      );

      expect(screen.getAllByText('SOL/USDC')[0]).toBeInTheDocument();
      expect(screen.getByText(/pool123/)).toBeInTheDocument();
      expect(screen.getByText('balanced')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('+25.50%')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <Provider store={createTestStore()}>
          <PositionCard
            position={mockPosition}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </Provider>
      );

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledWith('pos_1');
    });

    it('should show close button for active positions', () => {
      render(
        <Provider store={createTestStore()}>
          <PositionCard
            position={mockPosition}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </Provider>
      );

      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should not show close button for closed positions', () => {
      const closedPosition = { ...mockPosition, status: 'closed' as const };
      
      render(
        <Provider store={createTestStore()}>
          <PositionCard
            position={closedPosition}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </Provider>
      );

      expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <Provider store={createTestStore()}>
          <PositionCard
            position={mockPosition}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </Provider>
      );

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledWith('pos_1');
    });
  });

  describe('StrategyConfig', () => {
    const mockConfig = {
      strategy: 'balanced' as const,
      maxPositions: 10,
      maxInvestment: 1000,
      riskLevel: 'medium' as const,
      autoRebalance: false,
      stopLoss: 10,
      takeProfit: 50,
      minApy: 20,
      maxDrawdown: 15
    };

    const mockOnConfigChange = jest.fn();
    const mockOnSave = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render strategy configuration form', () => {
      render(
        <StrategyConfig
          config={mockConfig}
          onConfigChange={mockOnConfigChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Strategy Configuration')).toBeInTheDocument();
      expect(screen.getByText('Strategy Type')).toBeInTheDocument();
      expect(screen.getByText('Risk Level')).toBeInTheDocument();
      expect(screen.getByText('Maximum Positions')).toBeInTheDocument();
      expect(screen.getByText('Maximum Investment (USD)')).toBeInTheDocument();
    });

    it('should allow strategy selection', () => {
      render(
        <StrategyConfig
          config={mockConfig}
          onConfigChange={mockOnConfigChange}
          onSave={mockOnSave}
        />
      );

      const aggressiveStrategy = screen.getByText('aggressive');
      fireEvent.click(aggressiveStrategy);

      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ strategy: 'aggressive' })
      );
    });

    it('should allow risk level selection', () => {
      render(
        <StrategyConfig
          config={mockConfig}
          onConfigChange={mockOnConfigChange}
          onSave={mockOnSave}
        />
      );

      const highRisk = screen.getByText('high');
      fireEvent.click(highRisk);

      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ riskLevel: 'high' })
      );
    });

    it('should update numeric inputs', () => {
      render(
        <StrategyConfig
          config={mockConfig}
          onConfigChange={mockOnConfigChange}
          onSave={mockOnSave}
        />
      );

      // Use getAllByDisplayValue and select the first one (maxPositions)
      const inputs = screen.getAllByDisplayValue('10');
      const maxPositionsInput = inputs[0]; // First input with value 10 is maxPositions
      if (maxPositionsInput) {
        fireEvent.change(maxPositionsInput, { target: { value: '15' } });
      }

      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ maxPositions: 15 })
      );
    });

    it('should toggle auto rebalance', () => {
      render(
        <StrategyConfig
          config={mockConfig}
          onConfigChange={mockOnConfigChange}
          onSave={mockOnSave}
        />
      );

      // Find the toggle button by looking for the button with the toggle span
      const autoRebalanceToggle = screen.getByRole('button', { name: '' });
      fireEvent.click(autoRebalanceToggle);

      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ autoRebalance: true })
      );
    });

    it('should call onSave when save button is clicked', () => {
      render(
        <StrategyConfig
          config={mockConfig}
          onConfigChange={mockOnConfigChange}
          onSave={mockOnSave}
        />
      );

      // First make a change to enable the save button
      const inputs = screen.getAllByDisplayValue('10');
      const maxPositionsInput = inputs[0]; // First input with value 10 is maxPositions
      if (maxPositionsInput) {
        fireEvent.change(maxPositionsInput, { target: { value: '15' } });
      }

      const saveButton = screen.getByText('Save Configuration');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should disable save button when no changes are made', () => {
      render(
        <StrategyConfig
          config={mockConfig}
          onConfigChange={mockOnConfigChange}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByText('Save Configuration');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('PerformanceAnalytics', () => {
    const mockMetrics: PerformanceMetrics[] = [
      {
        id: 'perf_1',
        timestamp: Date.now() - 86400000,
        totalValue: 10000,
        totalPnl: 500,
        totalApy: 25.5,
        activePositions: 2,
        closedPositions: 1,
        strategyBreakdown: JSON.stringify({
          balanced: { totalValue: 5000, totalPnl: 250, totalApy: 25.5, positionCount: 1 },
          aggressive: { totalValue: 3000, totalPnl: 200, totalApy: 45.2, positionCount: 1 },
          conservative: { totalValue: 2000, totalPnl: -25, totalApy: 15.8, positionCount: 1 }
        })
      }
    ];

    const mockOnTimeRangeChange = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render performance analytics', () => {
      render(
        <PerformanceAnalytics
          metrics={mockMetrics}
          timeRange="7d"
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      );

      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      expect(screen.getByText('Strategy Performance')).toBeInTheDocument();
      expect(screen.getByText('Recent Performance')).toBeInTheDocument();
    });

    it('should display time range buttons', () => {
      render(
        <PerformanceAnalytics
          metrics={mockMetrics}
          timeRange="7d"
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      );

      expect(screen.getByText('24 Hours')).toBeInTheDocument();
      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('30 Days')).toBeInTheDocument();
      expect(screen.getByText('90 Days')).toBeInTheDocument();
      expect(screen.getByText('1 Year')).toBeInTheDocument();
    });

    it('should call onTimeRangeChange when time range is selected', () => {
      render(
        <PerformanceAnalytics
          metrics={mockMetrics}
          timeRange="7d"
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      );

      const thirtyDaysButton = screen.getByText('30 Days');
      fireEvent.click(thirtyDaysButton);

      expect(mockOnTimeRangeChange).toHaveBeenCalledWith('30d');
    });

    it('should display performance overview cards', () => {
      render(
        <PerformanceAnalytics
          metrics={mockMetrics}
          timeRange="7d"
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      );

      expect(screen.getByText('Total Return')).toBeInTheDocument();
      expect(screen.getByText('Average APY')).toBeInTheDocument();
      expect(screen.getByText('Max Drawdown')).toBeInTheDocument();
      expect(screen.getByText('Volatility')).toBeInTheDocument();
    });

    it('should display strategy breakdown', () => {
      render(
        <PerformanceAnalytics
          metrics={mockMetrics}
          timeRange="7d"
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      );

      expect(screen.getByText('balanced')).toBeInTheDocument();
      expect(screen.getByText('aggressive')).toBeInTheDocument();
      expect(screen.getByText('conservative')).toBeInTheDocument();
    });

    it('should display performance table', () => {
      render(
        <PerformanceAnalytics
          metrics={mockMetrics}
          timeRange="7d"
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      );

      expect(screen.getByText('Date')).toBeInTheDocument();
      // Use getAllByText for P&L since it appears multiple times
      expect(screen.getAllByText('P&L')).toHaveLength(4); // 3 in strategy cards + 1 in table header
      // Use getAllByText for APY since it appears multiple times
      expect(screen.getAllByText('APY')).toHaveLength(4); // 3 in strategy cards + 1 in table header
      expect(screen.getByText('Positions')).toBeInTheDocument();
      // Check for table header specifically - Total Value appears in buttons and table header
      expect(screen.getAllByText('Total Value')).toHaveLength(4); // 3 buttons + 1 table header
    });

    it('should handle empty metrics gracefully', () => {
      render(
        <PerformanceAnalytics
          metrics={[]}
          timeRange="7d"
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      );

      // Should still render the component with mock data
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    });
  });
}); 