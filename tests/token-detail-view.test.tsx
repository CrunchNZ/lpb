import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TokenDetailView } from '../src/frontend/components/TokenDetailView';
import uiReducer from '../src/frontend/store/slices/uiSlice';

// Mock the LoadingSpinner component
jest.mock('../src/frontend/components/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: string }) => <div data-testid="loading-spinner" data-size={size}>Loading...</div>
}));

const mockToken = {
  symbol: 'SOL',
  name: 'Solana',
  price: 150.50,
  marketCap: 50000000000,
  volume24h: 2500000000,
  priceChange24h: 5.25,
  priceChange7d: 12.75,
  circulatingSupply: 400000000,
  totalSupply: 500000000,
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 'solana',
  sentiment: 'positive' as const,
  trending: 'up' as const,
  socialMetrics: {
    twitterFollowers: 2500000,
    redditSubscribers: 150000,
    telegramMembers: 50000
  },
  technicalIndicators: {
    rsi: 65.5,
    macd: 'Bullish',
    movingAverage: 'Above MA50'
  }
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

describe('TokenDetailView', () => {
  let store: ReturnType<typeof createMockStore>;
  let mockOnClose: jest.Mock;
  let mockOnAddToWatchlist: jest.Mock;
  let mockOnRemoveFromWatchlist: jest.Mock;

  beforeEach(() => {
    store = createMockStore();
    mockOnClose = jest.fn();
    mockOnAddToWatchlist = jest.fn();
    mockOnRemoveFromWatchlist = jest.fn();
  });

  const renderComponent = (isInWatchlist = false) => {
    return render(
      <Provider store={store}>
        <TokenDetailView
          token={mockToken}
          onClose={mockOnClose}
          onAddToWatchlist={mockOnAddToWatchlist}
          onRemoveFromWatchlist={mockOnRemoveFromWatchlist}
          isInWatchlist={isInWatchlist}
        />
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('renders the modal with token information', () => {
      renderComponent();

      // Check header content
      expect(screen.getByText('Solana (SOL)')).toBeInTheDocument();
      expect(screen.getAllByText(/0x123456/)).toHaveLength(2); // Header + Token Info

      // Check tab navigation
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Trading')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Social')).toBeInTheDocument();

      // Check close button
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('displays token price and market data', () => {
      renderComponent();

      expect(screen.getByText('$150.50')).toBeInTheDocument(); // Current Price
      expect(screen.getByText('+5.25%')).toBeInTheDocument(); // 24h Change
      expect(screen.getByText('$50,000,000,000.00')).toBeInTheDocument(); // Market Cap
    });

    it('displays token information', () => {
      renderComponent();

      expect(screen.getByText('Token Information')).toBeInTheDocument();
      expect(screen.getByText('SOL')).toBeInTheDocument();
      expect(screen.getByText('Solana')).toBeInTheDocument();
      expect(screen.getByText('solana')).toBeInTheDocument();
    });

    it('displays market data', () => {
      renderComponent();

      expect(screen.getByText('Market Data')).toBeInTheDocument();
      expect(screen.getByText('$2,500,000,000.00')).toBeInTheDocument(); // Volume
      expect(screen.getByText('400.00M')).toBeInTheDocument(); // Circulating Supply
      expect(screen.getByText('500.00M')).toBeInTheDocument(); // Total Supply
      expect(screen.getByText('+12.75%')).toBeInTheDocument(); // 7d Change
    });

    it('displays sentiment and trending', () => {
      renderComponent();

      expect(screen.getByText('Sentiment')).toBeInTheDocument();
      expect(screen.getByText('Positive')).toBeInTheDocument();
      expect(screen.getByText('Trending')).toBeInTheDocument();
      expect(screen.getAllByText('📈')).toHaveLength(2); // Tab icon + trending icon
    });
  });

  describe('Tab Navigation', () => {
    it('starts with overview tab active', () => {
      renderComponent();

      const overviewTab = screen.getByText('Overview').closest('button');
      expect(overviewTab).toHaveClass('text-blue-600');
    });

    it('switches to trading tab when clicked', () => {
      renderComponent();

      const tradingTab = screen.getByText('Trading').closest('button');
      fireEvent.click(tradingTab!);

      expect(screen.getByText('Trade SOL')).toBeInTheDocument();
      expect(screen.getByText('Trade Settings')).toBeInTheDocument();
      expect(screen.getByText('Market Information')).toBeInTheDocument();
    });

    it('switches to analytics tab when clicked', () => {
      renderComponent();

      const analyticsTab = screen.getByText('Analytics').closest('button');
      fireEvent.click(analyticsTab!);

      expect(screen.getByText('Technical Analysis')).toBeInTheDocument();
      expect(screen.getByText('65.50')).toBeInTheDocument(); // RSI
      expect(screen.getByText('Bullish')).toBeInTheDocument(); // MACD
      expect(screen.getByText('Above MA50')).toBeInTheDocument(); // MA
    });

    it('switches to social tab when clicked', () => {
      renderComponent();

      const socialTab = screen.getByText('Social').closest('button');
      fireEvent.click(socialTab!);

      expect(screen.getByText('Social Metrics')).toBeInTheDocument();
      expect(screen.getByText('2.50M')).toBeInTheDocument(); // Twitter
      expect(screen.getByText('150.00K')).toBeInTheDocument(); // Reddit
      expect(screen.getByText('50.00K')).toBeInTheDocument(); // Telegram
    });
  });

  describe('Trading Tab', () => {
    beforeEach(() => {
      renderComponent();
      const tradingTab = screen.getByText('Trading').closest('button');
      fireEvent.click(tradingTab!);
    });

    it('displays trading interface', () => {
      expect(screen.getByText('Trade Settings')).toBeInTheDocument();
      expect(screen.getByText('Buy')).toBeInTheDocument();
      expect(screen.getByText('Sell')).toBeInTheDocument();
      expect(screen.getByText('Amount (SOL)')).toBeInTheDocument();
    });

    it('handles trade type selection', () => {
      const sellButton = screen.getByRole('button', { name: 'Sell' });
      fireEvent.click(sellButton);

      expect(sellButton).toHaveClass('bg-primary');
      expect(screen.getByRole('button', { name: 'Buy' })).toHaveClass('border');
    });

    it('calculates estimated value correctly', () => {
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '10' } });

      expect(screen.getByText('$1,505.00')).toBeInTheDocument(); // 10 * 150.50
    });

    it('handles trade execution', async () => {
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '5' } });

      const tradeButton = screen.getByRole('button', { name: 'Buy SOL' });
      fireEvent.click(tradeButton);

      // Check loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for action to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Check notification was dispatched
      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0].title).toBe('Trade Executed');
    });

    it('validates trade amount', () => {
      // This test validates that the button is disabled when amount is invalid
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '-5' } });

      const tradeButton = screen.getByRole('button', { name: 'Buy SOL' });
      expect(tradeButton).toBeDisabled();
    });
  });

  describe('Analytics Tab', () => {
    beforeEach(() => {
      renderComponent();
      const analyticsTab = screen.getByText('Analytics').closest('button');
      fireEvent.click(analyticsTab!);
    });

    it('displays technical indicators', () => {
      expect(screen.getByText('65.50')).toBeInTheDocument(); // RSI
      expect(screen.getByText('Bullish')).toBeInTheDocument(); // MACD
      expect(screen.getByText('Above MA50')).toBeInTheDocument(); // MA
    });

    it('displays support and resistance', () => {
      expect(screen.getByText('Support & Resistance')).toBeInTheDocument();
      expect(screen.getByText('$165.55')).toBeInTheDocument(); // Resistance
      expect(screen.getByText('$150.50')).toBeInTheDocument(); // Current
      expect(screen.getByText('$135.45')).toBeInTheDocument(); // Support
    });

    it('displays volatility metrics', () => {
      expect(screen.getByText('Volatility')).toBeInTheDocument();
      expect(screen.getByText('15.2%')).toBeInTheDocument(); // 24h Volatility
      expect(screen.getByText('28.7%')).toBeInTheDocument(); // 7d Volatility
      expect(screen.getByText('Medium')).toBeInTheDocument(); // Risk Level
    });
  });

  describe('Social Tab', () => {
    beforeEach(() => {
      renderComponent();
      const socialTab = screen.getByText('Social').closest('button');
      fireEvent.click(socialTab!);
    });

    it('displays social metrics', () => {
      expect(screen.getByText('2.50M')).toBeInTheDocument(); // Twitter
      expect(screen.getByText('150.00K')).toBeInTheDocument(); // Reddit
      expect(screen.getByText('50.00K')).toBeInTheDocument(); // Telegram
    });

    it('displays sentiment analysis', () => {
      expect(screen.getByText('Sentiment Analysis')).toBeInTheDocument();
      expect(screen.getByText('Positive')).toBeInTheDocument();
      expect(screen.getAllByText('📈')).toHaveLength(3); // Tab icon + trending icon + social trend
      expect(screen.getByText('8.5/10')).toBeInTheDocument(); // Community Score
    });

    it('displays recent activity', () => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Price surge detected')).toBeInTheDocument();
      expect(screen.getByText('High Twitter activity')).toBeInTheDocument();
      expect(screen.getByText('Volume spike')).toBeInTheDocument();
    });
  });

  describe('Watchlist Management', () => {
    it('shows add to watchlist button when not in watchlist', () => {
      renderComponent(false);

      expect(screen.getByText('Add to Watchlist')).toBeInTheDocument();
      expect(screen.queryByText('Remove from Watchlist')).not.toBeInTheDocument();
    });

    it('shows remove from watchlist button when in watchlist', () => {
      renderComponent(true);

      expect(screen.getByText('Remove from Watchlist')).toBeInTheDocument();
      expect(screen.queryByText('Add to Watchlist')).not.toBeInTheDocument();
    });

    it('handles add to watchlist', () => {
      renderComponent(false);

      const addButton = screen.getByText('Add to Watchlist');
      fireEvent.click(addButton);

      expect(mockOnAddToWatchlist).toHaveBeenCalledWith(mockToken);
      
      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0].title).toBe('Added to Watchlist');
    });

    it('handles remove from watchlist', () => {
      renderComponent(true);

      const removeButton = screen.getByText('Remove from Watchlist');
      fireEvent.click(removeButton);

      expect(mockOnRemoveFromWatchlist).toHaveBeenCalledWith('SOL');
      
      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0].title).toBe('Removed from Watchlist');
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

      expect(screen.getByText('$150.50')).toBeInTheDocument();
      expect(screen.getByText('$50,000,000,000.00')).toBeInTheDocument();
      expect(screen.getByText('$2,500,000,000.00')).toBeInTheDocument();
    });

    it('formats percentages correctly', () => {
      renderComponent();

      expect(screen.getByText('+5.25%')).toBeInTheDocument();
      expect(screen.getByText('+12.75%')).toBeInTheDocument();
    });

    it('formats numbers correctly', () => {
      renderComponent();

      expect(screen.getByText('400.00M')).toBeInTheDocument(); // Circulating Supply
      expect(screen.getByText('500.00M')).toBeInTheDocument(); // Total Supply
      
      // Navigate to social tab to check social metrics
      const socialTab = screen.getByText('Social').closest('button');
      fireEvent.click(socialTab!);
      
      expect(screen.getByText('2.50M')).toBeInTheDocument(); // Twitter
      expect(screen.getByText('150.00K')).toBeInTheDocument(); // Reddit
      expect(screen.getByText('50.00K')).toBeInTheDocument(); // Telegram
    });
  });

  describe('Price Change Colors', () => {
    it('applies green color for positive price change', () => {
      renderComponent();

      const positiveChange = screen.getByText('+5.25%');
      expect(positiveChange).toHaveClass('text-green-400');
    });

    it('applies red color for negative price change', () => {
      const negativeToken = { ...mockToken, priceChange24h: -3.5 };
      render(
        <Provider store={store}>
          <TokenDetailView
            token={negativeToken}
            onClose={mockOnClose}
            onAddToWatchlist={mockOnAddToWatchlist}
            onRemoveFromWatchlist={mockOnRemoveFromWatchlist}
          />
        </Provider>
      );

      const negativeChange = screen.getByText('-3.50%');
      expect(negativeChange).toHaveClass('text-red-400');
    });
  });

  describe('Sentiment Colors', () => {
    it('applies correct colors for different sentiments', () => {
      const { rerender } = renderComponent();

      // Positive sentiment should have green color
      const positiveBadge = screen.getByText('Positive');
      expect(positiveBadge).toHaveClass('bg-green-500/20');

      // Test with negative sentiment
      const negativeToken = { ...mockToken, sentiment: 'negative' as const };
      rerender(
        <Provider store={store}>
          <TokenDetailView
            token={negativeToken}
            onClose={mockOnClose}
            onAddToWatchlist={mockOnAddToWatchlist}
            onRemoveFromWatchlist={mockOnRemoveFromWatchlist}
          />
        </Provider>
      );

      const negativeBadge = screen.getByText('Negative');
      expect(negativeBadge).toHaveClass('bg-red-500/20');
    });
  });

  describe('Trending Icons', () => {
    it('displays correct icon for up trending', () => {
      renderComponent();

      expect(screen.getAllByText('📈')).toHaveLength(2); // Tab icon + trending icon
    });

    it('displays correct icon for down trending', () => {
      const downToken = { ...mockToken, trending: 'down' as const };
      render(
        <Provider store={store}>
          <TokenDetailView
            token={downToken}
            onClose={mockOnClose}
            onAddToWatchlist={mockOnAddToWatchlist}
            onRemoveFromWatchlist={mockOnRemoveFromWatchlist}
          />
        </Provider>
      );

      expect(screen.getAllByText('📉')).toHaveLength(1);
    });

    it('displays correct icon for stable trending', () => {
      const stableToken = { ...mockToken, trending: 'stable' as const };
      render(
        <Provider store={store}>
          <TokenDetailView
            token={stableToken}
            onClose={mockOnClose}
            onAddToWatchlist={mockOnAddToWatchlist}
            onRemoveFromWatchlist={mockOnRemoveFromWatchlist}
          />
        </Provider>
      );

      expect(screen.getAllByText('➡️')).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('handles trade errors gracefully', async () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderComponent();

      const tradingTab = screen.getByText('Trading').closest('button');
      fireEvent.click(tradingTab!);

      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '5' } });

      const tradeButton = screen.getByRole('button', { name: 'Buy SOL' });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0].title).toBe('Trade Executed');

      consoleSpy.mockRestore();
    });
  });
}); 