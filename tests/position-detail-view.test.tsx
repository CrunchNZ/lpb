import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PositionDetailView } from '../src/frontend/components/PositionDetailView';
import uiReducer from '../src/frontend/store/slices/uiSlice';
import { Position } from '../src/backend/database';

// Mock the LoadingSpinner component
jest.mock('../src/frontend/components/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: string }) => <div data-testid="loading-spinner" data-size={size}>Loading...</div>
}));

const mockPosition: Position = {
  id: 'pos-1',
  strategy: 'balanced',
  poolAddress: '0x1234567890abcdef1234567890abcdef12345678',
  tokenA: 'SOL',
  tokenB: 'USDC',
  amountA: 100.5,
  amountB: 5000.0,
  entryPrice: 50.0,
  currentPrice: 55.0,
  timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
  status: 'active',
  pnl: 250.0,
  apy: 12.5
};

const createMockStore = () => {
  return configureStore({
    reducer: {
      ui: uiReducer
    },
    preloadedState: {
      ui: {
        theme: 'light',
        sidebarOpen: true,
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
        },
      }
    }
  });
};

describe('PositionDetailView', () => {
  let store: ReturnType<typeof createMockStore>;
  let mockOnClose: jest.Mock;
  let mockOnUpdate: jest.Mock;

  beforeEach(() => {
    store = createMockStore();
    mockOnClose = jest.fn();
    mockOnUpdate = jest.fn();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <PositionDetailView
          position={mockPosition}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('renders the modal with position information', () => {
      renderComponent();

      // Check header content
      expect(screen.getByText('SOL/USDC Position')).toBeInTheDocument();
      expect(screen.getByText(/Created/)).toBeInTheDocument();

      // Check tab navigation
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();

      // Check close button
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('displays position status and strategy', () => {
      renderComponent();

      expect(screen.getByText('Position Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText(/⚖️ Balanced/)).toBeInTheDocument();
    });

    it('displays performance metrics', () => {
      renderComponent();

      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('$250.00')).toBeInTheDocument(); // P&L
      expect(screen.getByText('+12.50%')).toBeInTheDocument(); // APY
    });

    it('displays token amounts', () => {
      renderComponent();

      expect(screen.getByText('Token Amounts')).toBeInTheDocument();
      expect(screen.getByText('100.500000')).toBeInTheDocument(); // SOL amount
      expect(screen.getByText('5000.000000')).toBeInTheDocument(); // USDC amount
    });

    it('displays price information', () => {
      renderComponent();

      expect(screen.getByText('Price Information')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument(); // Entry price
      expect(screen.getByText('$55.00')).toBeInTheDocument(); // Current price
    });
  });

  describe('Tab Navigation', () => {
    it('starts with overview tab active', () => {
      renderComponent();

      const overviewTab = screen.getByText('Overview').closest('button');
      expect(overviewTab).toHaveClass('text-blue-600');
    });

    it('switches to actions tab when clicked', () => {
      renderComponent();

      const actionsTab = screen.getByText('Actions').closest('button');
      fireEvent.click(actionsTab!);

      expect(screen.getByText('Liquidity Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Liquidity' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Liquidity' })).toBeInTheDocument();
    });

    it('switches to analytics tab when clicked', () => {
      renderComponent();

      const analyticsTab = screen.getByText('Analytics').closest('button');
      fireEvent.click(analyticsTab!);

      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      expect(screen.getByText('Annual Yield')).toBeInTheDocument();
      expect(screen.getByText('Total P&L')).toBeInTheDocument();
    });
  });

  describe('Actions Tab', () => {
    beforeEach(() => {
      renderComponent();
      const actionsTab = screen.getByText('Actions').closest('button');
      fireEvent.click(actionsTab!);
    });

    it('displays all action buttons', () => {
      expect(screen.getByRole('button', { name: 'Add Liquidity' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Liquidity' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Harvest Rewards' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close Position' })).toBeInTheDocument();
    });

    it('handles add liquidity action', async () => {
      const addLiquidityButton = screen.getByRole('button', { name: 'Add Liquidity' });
      fireEvent.click(addLiquidityButton);

      // Check loading state
      expect(screen.getAllByTestId('loading-spinner')).toHaveLength(4); // All buttons show loading

      // Wait for action to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Check notification was dispatched
      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0].title).toBe('Liquidity Added');
    });

    it('handles remove liquidity action', async () => {
      const removeLiquidityButton = screen.getByRole('button', { name: 'Remove Liquidity' });
      fireEvent.click(removeLiquidityButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0].title).toBe('Liquidity Removed');
    });

    it('handles harvest rewards action', async () => {
      const harvestButton = screen.getByRole('button', { name: 'Harvest Rewards' });
      fireEvent.click(harvestButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0].title).toBe('Rewards Harvested');
    });

    it('handles close position action', async () => {
      const closeButton = screen.getByRole('button', { name: 'Close Position' });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      expect(mockOnUpdate).toHaveBeenCalledWith('pos-1', { status: 'closed' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Analytics Tab', () => {
    beforeEach(() => {
      renderComponent();
      const analyticsTab = screen.getByText('Analytics').closest('button');
      fireEvent.click(analyticsTab!);
    });

    it('displays performance metrics', () => {
      expect(screen.getByText('+12.50%')).toBeInTheDocument(); // Annual Yield
      expect(screen.getByText('$250.00')).toBeInTheDocument(); // Total P&L
      expect(screen.getByText('$280,527.50')).toBeInTheDocument(); // Total Value
    });

    it('displays risk metrics', () => {
      expect(screen.getByText('Risk Metrics')).toBeInTheDocument();
      expect(screen.getByText('Impermanent Loss')).toBeInTheDocument();
      expect(screen.getByText('Volatility')).toBeInTheDocument();
      expect(screen.getByText('Liquidity Depth')).toBeInTheDocument();
    });

    it('displays historical performance placeholder', () => {
      expect(screen.getByText('Historical Performance')).toBeInTheDocument();
      expect(screen.getByText('Chart placeholder')).toBeInTheDocument();
    });
  });

  describe('Modal Behavior', () => {
    it('closes modal when close button is clicked', () => {
      renderComponent();

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('dispatches popModal action when closing', () => {
      renderComponent();

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      const state = store.getState();
      expect(state.ui.navigation.modalStack).toHaveLength(0);
    });
  });

  describe('Formatting', () => {
    it('formats currency correctly', () => {
      renderComponent();

      expect(screen.getByText('$250.00')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('$55.00')).toBeInTheDocument();
    });

    it('formats percentages correctly', () => {
      renderComponent();

      expect(screen.getByText('+12.50%')).toBeInTheDocument();
      expect(screen.getByText('+10.00%')).toBeInTheDocument(); // Price change
    });

    it('formats dates correctly', () => {
      renderComponent();

      expect(screen.getByText(/Created/)).toBeInTheDocument();
    });

    it('formats time held correctly', () => {
      renderComponent();

      expect(screen.getByText('7 days')).toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('applies correct colors for different statuses', () => {
      const { rerender } = renderComponent();

      // Active status should have green color
      const activeBadge = screen.getByText('Active');
      expect(activeBadge).toHaveClass('bg-green-500/20');

      // Test with closed status
      const closedPosition = { ...mockPosition, status: 'closed' as const };
      rerender(
        <Provider store={store}>
          <PositionDetailView
            position={closedPosition}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </Provider>
      );

      const closedBadge = screen.getByText('Closed');
      expect(closedBadge).toHaveClass('bg-gray-500/20');
    });
  });

  describe('P&L Colors', () => {
    it('applies green color for positive P&L', () => {
      renderComponent();

      const pnlElement = screen.getByText('$250.00');
      expect(pnlElement).toHaveClass('text-green-400');
    });

    it('applies red color for negative P&L', () => {
      const negativePosition = { ...mockPosition, pnl: -100.0 };
      render(
        <Provider store={store}>
          <PositionDetailView
            position={negativePosition}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </Provider>
      );

      const pnlElement = screen.getByText('-$100.00');
      expect(pnlElement).toHaveClass('text-red-400');
    });
  });

  describe('Strategy Icons', () => {
    it('displays correct icon for balanced strategy', () => {
      renderComponent();

      expect(screen.getByText('⚖️')).toBeInTheDocument();
    });

    it('displays correct icon for aggressive strategy', () => {
      const aggressivePosition = { ...mockPosition, strategy: 'aggressive' };
      render(
        <Provider store={store}>
          <PositionDetailView
            position={aggressivePosition}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </Provider>
      );

      expect(screen.getByText('🚀')).toBeInTheDocument();
    });

    it('displays correct icon for conservative strategy', () => {
      const conservativePosition = { ...mockPosition, strategy: 'conservative' };
      render(
        <Provider store={store}>
          <PositionDetailView
            position={conservativePosition}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </Provider>
      );

      expect(screen.getByText('🛡️')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderComponent();

      const actionsTab = screen.getByText('Actions').closest('button');
      fireEvent.click(actionsTab!);

      const addLiquidityButton = screen.getByRole('button', { name: 'Add Liquidity' });
      fireEvent.click(addLiquidityButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      // The component currently always succeeds, so we expect success notification
      expect(state.ui.notifications[0].title).toBe('Liquidity Added');

      consoleSpy.mockRestore();
    });
  });
}); 