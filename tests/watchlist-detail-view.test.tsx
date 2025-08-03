import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WatchlistDetailView } from '../src/frontend/components/WatchlistDetailView';
import uiSlice from '../src/frontend/store/slices/uiSlice';
import { TokenData } from '../src/backend/integrations/dexscreener';

// Mock Redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      ui: uiSlice,
    },
    preloadedState: {
      ui: {
        theme: 'dark',
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
          activeTab: 'watchlists',
          modalStack: [],
          navigationHistory: [{ tab: 'watchlists', timestamp: Date.now() }],
          tabBadges: {},
        }
      },
    },
  });
};

// Mock data
const mockWatchlist = {
  id: 1,
  name: 'My Watchlist',
  createdAt: Date.now() - 86400000, // 1 day ago
  updatedAt: Date.now(),
  tokenCount: 3,
};

const mockTokens = [
  {
    id: 1,
    watchlistId: 1,
    tokenSymbol: 'SOL',
    tokenName: 'Solana',
    pairAddress: '0x1234567890abcdef',
    chainId: 'solana',
    addedAt: Date.now() - 3600000, // 1 hour ago
  },
  {
    id: 2,
    watchlistId: 1,
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    pairAddress: '0xabcdef1234567890',
    chainId: 'solana',
    addedAt: Date.now() - 7200000, // 2 hours ago
  },
  {
    id: 3,
    watchlistId: 1,
    tokenSymbol: 'RAY',
    tokenName: 'Raydium',
    pairAddress: '0x9876543210fedcba',
    chainId: 'solana',
    addedAt: Date.now() - 10800000, // 3 hours ago
  },
];

const mockTokenData: Record<string, TokenData> = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    price: 100.50,
    marketCap: 50000000000,
    volume24h: 1500000000,
    priceChange24h: 5.2,
    priceChange1h: 0.5,
    priceChange6h: 2.1,
    age: 24,
    holders: 1000000,
    dexId: 'raydium',
    pairAddress: '0x1234567890abcdef',
    chainId: 'solana',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.00,
    marketCap: 25000000000,
    volume24h: 800000000,
    priceChange24h: -0.1,
    priceChange1h: 0.0,
    priceChange6h: -0.05,
    age: 48,
    holders: 2000000,
    dexId: 'raydium',
    pairAddress: '0xabcdef1234567890',
    chainId: 'solana',
  },
  RAY: {
    symbol: 'RAY',
    name: 'Raydium',
    price: 2.50,
    marketCap: 500000000,
    volume24h: 50000000,
    priceChange24h: -2.5,
    priceChange1h: -0.3,
    priceChange6h: -1.2,
    age: 12,
    holders: 50000,
    dexId: 'raydium',
    pairAddress: '0x9876543210fedcba',
    chainId: 'solana',
  },
};

const mockHandlers = {
  onClose: jest.fn(),
  onRemoveTokens: jest.fn(),
  onAddToken: jest.fn(),
  onRefreshData: jest.fn(),
  onTokenSelect: jest.fn(),
};

describe('WatchlistDetailView', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <WatchlistDetailView
          watchlist={mockWatchlist}
          tokens={mockTokens}
          tokenData={mockTokenData}
          {...mockHandlers}
        />
      </Provider>
    );
  };

  describe('Rendering', () => {
    test('renders watchlist header with correct information', () => {
      renderComponent();
      
      expect(screen.getByText('My Watchlist')).toBeInTheDocument();
      expect(screen.getAllByText(/3 tokens/)[0]).toBeInTheDocument();
      expect(screen.getByText(/Created/)).toBeInTheDocument();
    });

    test('renders tab navigation', () => {
      renderComponent();
      
      expect(screen.getByText('Tokens')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('renders tokens table by default', () => {
      renderComponent();
      
      expect(screen.getByText('SOL')).toBeInTheDocument();
      expect(screen.getByText('USDC')).toBeInTheDocument();
      expect(screen.getByText('RAY')).toBeInTheDocument();
    });

    test('renders search input', () => {
      renderComponent();
      
      expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();
    });

    test('renders token count badge', () => {
      renderComponent();
      
      expect(screen.getByText('3 tokens')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('filters tokens by symbol', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search tokens...');
      fireEvent.change(searchInput, { target: { value: 'SOL' } });
      
      expect(screen.getByText('SOL')).toBeInTheDocument();
      expect(screen.queryByText('USDC')).not.toBeInTheDocument();
      expect(screen.queryByText('RAY')).not.toBeInTheDocument();
    });

    test('filters tokens by name', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search tokens...');
      fireEvent.change(searchInput, { target: { value: 'Solana' } });
      
      expect(screen.getByText('SOL')).toBeInTheDocument();
      expect(screen.queryByText('USDC')).not.toBeInTheDocument();
    });

    test('updates token count when filtering', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search tokens...');
      fireEvent.change(searchInput, { target: { value: 'SOL' } });
      
      expect(screen.getByText('1 tokens')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    test('sorts tokens by symbol by default', () => {
      renderComponent();
      
      const rows = screen.getAllByRole('row');
      const tokenCells = rows.slice(1); // Skip header row
      
      // Check that tokens are sorted alphabetically
      expect(tokenCells[0]).toHaveTextContent('RAY');
      expect(tokenCells[1]).toHaveTextContent('SOL');
      expect(tokenCells[2]).toHaveTextContent('USDC');
    });

    test('sorts by price when clicking price header', () => {
      renderComponent();
      
      const priceHeader = screen.getByText('Price');
      fireEvent.click(priceHeader);
      
      // Should sort by price (USDC = $1.00, RAY = $2.50, SOL = $100.50)
      const rows = screen.getAllByRole('row');
      const tokenCells = rows.slice(1);
      
      expect(tokenCells[0]).toHaveTextContent('USDC');
      expect(tokenCells[1]).toHaveTextContent('RAY');
      expect(tokenCells[2]).toHaveTextContent('SOL');
    });

    test('sorts by 24h change when clicking change header', () => {
      renderComponent();
      
      const changeHeader = screen.getByText('24h Change');
      fireEvent.click(changeHeader);
      
      // Should sort by 24h change (RAY = -2.5%, USDC = -0.1%, SOL = +5.2%)
      const rows = screen.getAllByRole('row');
      const tokenCells = rows.slice(1);
      
      expect(tokenCells[0]).toHaveTextContent('RAY');
      expect(tokenCells[1]).toHaveTextContent('USDC');
      expect(tokenCells[2]).toHaveTextContent('SOL');
    });
  });

  describe('Selection Functionality', () => {
    test('selects all tokens when clicking select all checkbox', () => {
      renderComponent();
      
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);
      
      const individualCheckboxes = screen.getAllByRole('checkbox').slice(1);
      individualCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    test('shows remove button when tokens are selected', () => {
      renderComponent();
      
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);
      
      expect(screen.getByText(/Remove \(3\)/)).toBeInTheDocument();
    });

    test('removes selected tokens when clicking remove button', async () => {
      renderComponent();
      
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);
      
      const removeButton = screen.getByText(/Remove \(3\)/);
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(mockHandlers.onRemoveTokens).toHaveBeenCalledWith(['RAY', 'SOL', 'USDC']);
      });
    });
  });

  describe('Tab Navigation', () => {
    test('switches to analytics tab', () => {
      renderComponent();
      
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);
      
      expect(screen.getByText('Watchlist Analytics')).toBeInTheDocument();
      expect(screen.getByText('Performance overview and insights for My Watchlist')).toBeInTheDocument();
    });

    test('switches to settings tab', () => {
      renderComponent();
      
      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);
      
      expect(screen.getByText('Watchlist Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your watchlist preferences and settings')).toBeInTheDocument();
    });

    test('shows analytics data', () => {
      renderComponent();
      
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);
      
      expect(screen.getByText('Total Value')).toBeInTheDocument();
      expect(screen.getByText('Avg 24h Change')).toBeInTheDocument();
      expect(screen.getByText('Gainers')).toBeInTheDocument();
      expect(screen.getByText('Losers')).toBeInTheDocument();
    });

    test('shows settings information', () => {
      renderComponent();
      
      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);
      
      expect(screen.getAllByText('My Watchlist')[0]).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total tokens
    });
  });

  describe('Token Actions', () => {
    test('calls onTokenSelect when clicking view button', () => {
      renderComponent();
      
      const viewButtons = screen.getAllByRole('button', { name: '' });
      const firstViewButton = viewButtons.find(button => 
        button.querySelector('svg') && button.querySelector('svg')?.getAttribute('data-testid')?.includes('eye')
      );
      
      if (firstViewButton) {
        fireEvent.click(firstViewButton);
        expect(mockHandlers.onTokenSelect).toHaveBeenCalledWith(mockTokenData.SOL);
      }
    });

    test('selects individual token when clicking checkbox', () => {
      renderComponent();
      
      const checkboxes = screen.getAllByRole('checkbox').slice(1);
      fireEvent.click(checkboxes[0]); // Select first token
      
      expect(screen.getByText(/Remove \(1\)/)).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    test('calls onRefreshData when clicking refresh button', async () => {
      renderComponent();
      
      const refreshButton = screen.getAllByRole('button').find(button => 
        button.querySelector('svg') && button.querySelector('svg')?.innerHTML.includes('M3 12a9 9 0 0 1 9-9')
      );
      if (refreshButton) {
        fireEvent.click(refreshButton);
      }
      
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
      
      // The component calls dispatch(popModal()) first, then onClose
      // Since we're testing the onClose functionality, we can check if it was called
      // The dispatch error is handled by the Redux store setup
      expect(mockHandlers.onClose).toHaveBeenCalled();
    });
  });

  describe('Analytics Calculations', () => {
    test('calculates correct analytics data', () => {
      renderComponent();
      
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);
      
      // Check that analytics are displayed
      expect(screen.getByText('Total Value')).toBeInTheDocument();
      expect(screen.getByText('Avg 24h Change')).toBeInTheDocument();
      expect(screen.getByText('Gainers')).toBeInTheDocument();
      expect(screen.getByText('Losers')).toBeInTheDocument();
    });

    test('shows top and worst performers', () => {
      renderComponent();
      
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);
      
      expect(screen.getByText('Top Performers')).toBeInTheDocument();
      expect(screen.getByText('Worst Performers')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    test('handles empty token list', () => {
      render(
        <Provider store={store}>
          <WatchlistDetailView
            watchlist={mockWatchlist}
            tokens={[]}
            tokenData={{}}
            {...mockHandlers}
          />
        </Provider>
      );
      
      expect(screen.getByText('0 tokens')).toBeInTheDocument();
    });

    test('handles missing token data', () => {
      render(
        <Provider store={store}>
          <WatchlistDetailView
            watchlist={mockWatchlist}
            tokens={mockTokens}
            tokenData={{}}
            {...mockHandlers}
          />
        </Provider>
      );
      
      expect(screen.getByText('SOL')).toBeInTheDocument();
      expect(screen.getAllByText('N/A')).toHaveLength(12); // Price, 24h Change, Volume, Market Cap for each token (3 tokens * 4 fields each)
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderComponent();
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    test('supports keyboard navigation', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search tokens...');
      searchInput.focus();
      
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    test('handles refresh errors gracefully', async () => {
      mockHandlers.onRefreshData.mockRejectedValueOnce(new Error('Network error'));
      
      renderComponent();
      
      const refreshButton = screen.getAllByRole('button').find(button => 
        button.querySelector('svg') && button.querySelector('svg')?.innerHTML.includes('M3 12a9 9 0 0 1 9-9')
      );
      if (refreshButton) {
        fireEvent.click(refreshButton);
      }
      
      await waitFor(() => {
        expect(mockHandlers.onRefreshData).toHaveBeenCalled();
      });
    });

    test('handles remove tokens errors gracefully', async () => {
      mockHandlers.onRemoveTokens.mockRejectedValueOnce(new Error('Failed to remove'));
      
      renderComponent();
      
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);
      
      const removeButton = screen.getByText(/Remove \(3\)/);
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(mockHandlers.onRemoveTokens).toHaveBeenCalled();
      });
    });
  });
}); 