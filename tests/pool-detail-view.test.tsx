import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PoolDetailView } from '../src/frontend/components/PoolDetailView';
import uiSlice from '../src/frontend/store/slices/uiSlice';

// Mock Redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      ui: uiSlice,
    },
    preloadedState: {
      ui: {
        modals: [],
        notifications: [],
        theme: 'dark',
        navigation: {
          activeTab: 'positions',
          modalStack: [],
          navigationHistory: [],
          tabBadges: {},
        },
      },
    },
  });
};

// Mock data
const mockPool = {
  id: 'pool-1',
  name: 'SOL/USDC Pool',
  platform: 'Raydium',
  tokenA: 'SOL',
  tokenB: 'USDC',
  tokenASymbol: 'SOL',
  tokenBSymbol: 'USDC',
  tvl: 50000000,
  apr: 12.5,
  volume24h: 2500000,
  fees24h: 12500,
  userLiquidity: 5000,
  userShare: 0.01,
  poolAddress: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 'solana',
  createdAt: Date.now() - 86400000 * 30, // 30 days ago
  lastUpdated: Date.now() - 3600000, // 1 hour ago
  riskLevel: 'medium' as const,
  impermanentLoss: -0.5,
  priceRange: {
    min: 80,
    max: 120,
    current: 100.50,
  },
  rewards: [
    {
      token: 'RAY',
      amount: 25.5,
      value: 63.75,
    },
    {
      token: 'SOL',
      amount: 0.125,
      value: 12.50,
    },
  ],
  historicalData: [
    {
      timestamp: Date.now() - 86400000 * 7,
      tvl: 45000000,
      volume: 2000000,
      apr: 11.8,
    },
    {
      timestamp: Date.now() - 86400000 * 14,
      tvl: 40000000,
      volume: 1800000,
      apr: 11.2,
    },
  ],
};

const mockHandlers = {
  onClose: jest.fn(),
  onAddLiquidity: jest.fn(),
  onRemoveLiquidity: jest.fn(),
  onHarvestRewards: jest.fn(),
  onRefreshData: jest.fn(),
};

describe('PoolDetailView', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <PoolDetailView
          pool={mockPool}
          {...mockHandlers}
        />
      </Provider>
    );
  };

  describe('Rendering', () => {
    test('renders pool header with correct information', () => {
      renderComponent();
      
      expect(screen.getByText('SOL/USDC Pool')).toBeInTheDocument();
      expect(screen.getByText('Raydium • SOL/USDC')).toBeInTheDocument();
    });

    test('renders tab navigation', () => {
      renderComponent();
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Liquidity')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Rewards')).toBeInTheDocument();
    });

    test('renders overview tab by default', () => {
      renderComponent();
      
      expect(screen.getByText('Total Value Locked')).toBeInTheDocument();
      expect(screen.getByText('APR')).toBeInTheDocument();
      expect(screen.getByText('24h Volume')).toBeInTheDocument();
      expect(screen.getByText('Your Liquidity')).toBeInTheDocument();
    });

    test('renders key metrics correctly', () => {
      renderComponent();
      
      expect(screen.getByText('$50.00M')).toBeInTheDocument(); // TVL
      expect(screen.getByText('12.50%')).toBeInTheDocument(); // APR
      expect(screen.getByText('$2.50M')).toBeInTheDocument(); // Volume
      expect(screen.getByText('$5.00K')).toBeInTheDocument(); // User Liquidity
    });
  });

  describe('Tab Navigation', () => {
    test('switches to liquidity tab', () => {
      renderComponent();
      
      const liquidityTab = screen.getByText('Liquidity');
      fireEvent.click(liquidityTab);
      
      expect(screen.getByText('Liquidity Management')).toBeInTheDocument();
      expect(screen.getByText('Add or remove liquidity from SOL/USDC Pool')).toBeInTheDocument();
    });

    test('switches to analytics tab', () => {
      renderComponent();
      
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);
      
      expect(screen.getByText('Pool Analytics')).toBeInTheDocument();
      expect(screen.getByText('Performance metrics and historical data for SOL/USDC Pool')).toBeInTheDocument();
    });

    test('switches to rewards tab', () => {
      renderComponent();
      
      const rewardsTab = screen.getByText('Rewards');
      fireEvent.click(rewardsTab);
      
      expect(screen.getByText('Rewards & Incentives')).toBeInTheDocument();
      expect(screen.getByText('Track and manage your earned rewards from SOL/USDC Pool')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    test('displays pool information', () => {
      renderComponent();
      
      expect(screen.getByText('Pool Information')).toBeInTheDocument();
      expect(screen.getByText('Raydium')).toBeInTheDocument();
      expect(screen.getByText('solana')).toBeInTheDocument();
    });

    test('displays user position information', () => {
      renderComponent();
      
      expect(screen.getByText('Your Position')).toBeInTheDocument();
      expect(screen.getByText('0.0100%')).toBeInTheDocument(); // User share
      expect(screen.getByText('$1.25')).toBeInTheDocument(); // 24h fees earned
      expect(screen.getByText('Medium')).toBeInTheDocument(); // Risk level
    });

    test('displays price range information', () => {
      renderComponent();
      
      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('$100.50')).toBeInTheDocument(); // Current price
      expect(screen.getByText('$80.00')).toBeInTheDocument(); // Min price
      expect(screen.getByText('$120.00')).toBeInTheDocument(); // Max price
    });

    test('displays impermanent loss information', () => {
      renderComponent();
      
      expect(screen.getByText('Impermanent Loss')).toBeInTheDocument();
      expect(screen.getByText('+0.00%')).toBeInTheDocument(); // IL percentage
      expect(screen.getByText('$0.00')).toBeInTheDocument(); // IL value
    });
  });

  describe('Liquidity Tab', () => {
    beforeEach(() => {
      renderComponent();
      const liquidityTab = screen.getByText('Liquidity');
      fireEvent.click(liquidityTab);
    });

    test('displays add liquidity form', () => {
      expect(screen.getAllByText('Add Liquidity')).toHaveLength(2); // Heading and button
      expect(screen.getByLabelText('SOL Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('USDC Amount')).toBeInTheDocument();
    });

    test('displays remove liquidity form', () => {
      expect(screen.getAllByText('Remove Liquidity')).toHaveLength(2); // Heading and button
      expect(screen.getByDisplayValue('25%')).toBeInTheDocument(); // Default percentage
    });

    test('displays current position summary', () => {
      expect(screen.getByText('Current Position Summary')).toBeInTheDocument();
      expect(screen.getByText('$5.00K')).toBeInTheDocument(); // Total value
      expect(screen.getByText('0.0100%')).toBeInTheDocument(); // Pool share
      expect(screen.getByText('$1.25')).toBeInTheDocument(); // 24h fees
    });

    test('adds liquidity when form is submitted', async () => {
      const solInput = screen.getByLabelText('SOL Amount');
      const usdcInput = screen.getByLabelText('USDC Amount');
      const addButton = screen.getByRole('button', { name: 'Add Liquidity' });

      fireEvent.change(solInput, { target: { value: '10' } });
      fireEvent.change(usdcInput, { target: { value: '1000' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockHandlers.onAddLiquidity).toHaveBeenCalledWith(10, 1000);
      });
    });

    test('removes liquidity when form is submitted', async () => {
      const removeButton = screen.getByRole('button', { name: 'Remove Liquidity' });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockHandlers.onRemoveLiquidity).toHaveBeenCalledWith(25);
      });
    });

    test('shows estimated tokens when removing liquidity', () => {
      expect(screen.getByText('You will receive approximately:')).toBeInTheDocument();
      expect(screen.getByText(/SOL: 625\.000000/)).toBeInTheDocument();
      expect(screen.getByText(/USDC: 625\.000000/)).toBeInTheDocument();
    });
  });

  describe('Analytics Tab', () => {
    beforeEach(() => {
      renderComponent();
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);
    });

    test('displays performance metrics', () => {
      expect(screen.getByText('Current APR')).toBeInTheDocument();
      expect(screen.getByText('24h Volume')).toBeInTheDocument();
      expect(screen.getByText('24h Fees')).toBeInTheDocument();
      expect(screen.getByText('Data Points')).toBeInTheDocument();
    });

    test('displays risk assessment', () => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getAllByText('Medium')).toHaveLength(2); // Risk level and volatility
      expect(screen.getByText('+0.00%')).toBeInTheDocument(); // Impermanent loss
      expect(screen.getByText('High')).toBeInTheDocument(); // Liquidity depth
    });

    test('displays performance trends', () => {
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('APR Trend')).toBeInTheDocument();
      expect(screen.getByText('Volume Trend')).toBeInTheDocument();
      expect(screen.getByText('TVL Growth')).toBeInTheDocument();
      expect(screen.getByText('User Growth')).toBeInTheDocument();
    });

    test('displays historical chart placeholder', () => {
      expect(screen.getByText('TVL History')).toBeInTheDocument();
      expect(screen.getByText('Chart placeholder')).toBeInTheDocument();
    });
  });

  describe('Rewards Tab', () => {
    beforeEach(() => {
      renderComponent();
      const rewardsTab = screen.getByText('Rewards');
      fireEvent.click(rewardsTab);
    });

    test('displays available rewards', () => {
      expect(screen.getByText('Available Rewards')).toBeInTheDocument();
      expect(screen.getByText('25.500000 RAY')).toBeInTheDocument();
      expect(screen.getByText('≈ $63.75')).toBeInTheDocument();
      expect(screen.getByText('0.125000 SOL')).toBeInTheDocument();
      expect(screen.getAllByText('≈ $12.50')).toHaveLength(2);
    });

    test('displays reward statistics', () => {
      expect(screen.getByText('Total Rewards Value')).toBeInTheDocument();
      expect(screen.getByText('$76.25')).toBeInTheDocument(); // Total value
      expect(screen.getByText('Active Reward Tokens')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Number of reward tokens
      expect(screen.getByText('24h Fee Earnings')).toBeInTheDocument();
      expect(screen.getByText('$1.25')).toBeInTheDocument(); // Fee earnings
    });

    test('displays recent harvests', () => {
      expect(screen.getByText('Recent Harvests')).toBeInTheDocument();
      expect(screen.getByText('Harvested SOL')).toBeInTheDocument();
      expect(screen.getByText('Harvested USDC')).toBeInTheDocument();
    });

    test('harvests rewards when clicking harvest button', async () => {
      const harvestButtons = screen.getAllByText('Harvest');
      fireEvent.click(harvestButtons[0]);

      await waitFor(() => {
        expect(mockHandlers.onHarvestRewards).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      renderComponent();
      const liquidityTab = screen.getByText('Liquidity');
      fireEvent.click(liquidityTab);
    });

    test('validates add liquidity form', async () => {
      const addButton = screen.getByRole('button', { name: 'Add Liquidity' });
      fireEvent.click(addButton);

      // Should not call handler when form is invalid
      expect(mockHandlers.onAddLiquidity).not.toHaveBeenCalled();
    });

    test('enables add liquidity button when form is valid', () => {
      const solInput = screen.getByLabelText('SOL Amount');
      const usdcInput = screen.getByLabelText('USDC Amount');
      const addButton = screen.getByRole('button', { name: 'Add Liquidity' });

      fireEvent.change(solInput, { target: { value: '10' } });
      fireEvent.change(usdcInput, { target: { value: '1000' } });

      expect(addButton).not.toBeDisabled();
    });

    test('validates remove liquidity form', async () => {
      const removeButton = screen.getByRole('button', { name: 'Remove Liquidity' });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockHandlers.onRemoveLiquidity).toHaveBeenCalledWith(25);
      });
    });
  });

  describe('Refresh Functionality', () => {
    test('calls onRefreshData when clicking refresh button', async () => {
      renderComponent();
      
      const refreshButton = screen.getByRole('button', { name: '' });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(mockHandlers.onRefreshData).toHaveBeenCalled();
      });
    });
  });

  describe('Close Functionality', () => {
    test('calls onClose when clicking close button', () => {
      renderComponent();
      
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);
      
      expect(mockHandlers.onClose).toHaveBeenCalled();
    });
  });

  describe('Impermanent Loss Calculation', () => {
    test('calculates impermanent loss correctly', () => {
      renderComponent();
      
      // The mock pool has current price = 100.50, entry price = 100, so IL should be calculated
      // Since the price change is small (< 0.1), IL should be 0
      expect(screen.getByText('+0.00%')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  describe('Platform Icons', () => {
    test('displays correct platform icon for Raydium', () => {
      renderComponent();
      
      // Should display the Raydium icon (🦅)
      expect(screen.getByText('🦅')).toBeInTheDocument();
    });

    test('displays correct platform icon for other platforms', () => {
      const meteoraPool = { ...mockPool, platform: 'Meteora' };
      
      render(
        <Provider store={store}>
          <PoolDetailView
            pool={meteoraPool}
            {...mockHandlers}
          />
        </Provider>
      );
      
      // Should display the Meteora icon (🌠)
      expect(screen.getByText('🌠')).toBeInTheDocument();
    });
  });

  describe('Risk Level Display', () => {
    test('displays correct risk level badge', () => {
      renderComponent();
      
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    test('displays correct risk level for different levels', () => {
      const lowRiskPool = { ...mockPool, riskLevel: 'low' as const };
      
      render(
        <Provider store={store}>
          <PoolDetailView
            pool={lowRiskPool}
            {...mockHandlers}
          />
        </Provider>
      );
      
      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    test('handles empty rewards list', () => {
      const emptyRewardsPool = { ...mockPool, rewards: [] };
      
      render(
        <Provider store={store}>
          <PoolDetailView
            pool={emptyRewardsPool}
            {...mockHandlers}
          />
        </Provider>
      );
      
      const rewardsTab = screen.getByText('Rewards');
      fireEvent.click(rewardsTab);
      
      expect(screen.getByText('No rewards available yet')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles add liquidity errors gracefully', async () => {
      mockHandlers.onAddLiquidity.mockRejectedValueOnce(new Error('Insufficient balance'));
      
      renderComponent();
      const liquidityTab = screen.getByText('Liquidity');
      fireEvent.click(liquidityTab);
      
      const solInput = screen.getByLabelText('SOL Amount');
      const usdcInput = screen.getByLabelText('USDC Amount');
      const addButton = screen.getByRole('button', { name: 'Add Liquidity' });

      fireEvent.change(solInput, { target: { value: '10' } });
      fireEvent.change(usdcInput, { target: { value: '1000' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockHandlers.onAddLiquidity).toHaveBeenCalled();
      });
    });

    test('handles remove liquidity errors gracefully', async () => {
      mockHandlers.onRemoveLiquidity.mockRejectedValueOnce(new Error('Insufficient liquidity'));
      
      renderComponent();
      const liquidityTab = screen.getByText('Liquidity');
      fireEvent.click(liquidityTab);
      
      const removeButton = screen.getByRole('button', { name: 'Remove Liquidity' });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockHandlers.onRemoveLiquidity).toHaveBeenCalled();
      });
    });

    test('handles harvest rewards errors gracefully', async () => {
      mockHandlers.onHarvestRewards.mockRejectedValueOnce(new Error('No rewards available'));
      
      renderComponent();
      const rewardsTab = screen.getByText('Rewards');
      fireEvent.click(rewardsTab);
      
      const harvestButtons = screen.getAllByText('Harvest');
      fireEvent.click(harvestButtons[0]);

      await waitFor(() => {
        expect(mockHandlers.onHarvestRewards).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderComponent();
      
      // Navigate to liquidity tab to access form inputs
      const liquidityTab = screen.getByText('Liquidity');
      fireEvent.click(liquidityTab);
      
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThan(0);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('supports keyboard navigation', () => {
      renderComponent();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });
  });
}); 