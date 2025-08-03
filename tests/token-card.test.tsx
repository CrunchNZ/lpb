import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TokenCard } from '../src/frontend/components/TokenCard';
import uiReducer from '../src/frontend/store/slices/uiSlice';

// Create a test store
const createTestStore = () => configureStore({
  reducer: {
    ui: uiReducer,
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

// Mock token data
const mockToken = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  symbol: 'SOL',
  name: 'Solana',
  price: 0.00012345,
  priceChange24h: 12.5,
  priceChange1h: 2.3,
  priceChange6h: 8.7,
  volume24h: 1500000,
  marketCap: 50000000,
  liquidity: 250000,
  tvl: 1000000,
  sentiment: 0.75,
  trending: true,
  age: 45,
  holders: 12500,
  transactions24h: 8500,
  pairAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  chainId: 'solana',
  dexId: 'raydium'
};

describe('TokenCard Component', () => {
  const mockOnExpand = jest.fn();
  const mockOnAddToWatchlist = jest.fn();
  const mockOnTrade = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders basic token information correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    expect(screen.getAllByText('SOL')).toHaveLength(2); // One in avatar, one in title
    expect(screen.getByText('Solana')).toBeInTheDocument();
    expect(screen.getByText('$0.000123')).toBeInTheDocument();
    expect(screen.getByText('+12.50%')).toBeInTheDocument();
    expect(screen.getByText('🔥 TRENDING')).toBeInTheDocument();
  });

  test('calls onExpand when card is clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL/i });
    fireEvent.click(card);

    expect(mockOnExpand).toHaveBeenCalledWith(mockToken);
  });

  test('calls onExpand when Enter key is pressed', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL/i });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnExpand).toHaveBeenCalledWith(mockToken);
  });

  test('calls onExpand when Space key is pressed', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL/i });
    fireEvent.keyDown(card, { key: ' ' });

    expect(mockOnExpand).toHaveBeenCalledWith(mockToken);
  });

  test('shows expandable content when isExpanded is true', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={true}
        />
      </Provider>
    );

    expect(screen.getByText('Trade')).toBeInTheDocument();
    expect(screen.getByText('Add to Watchlist')).toBeInTheDocument();
    expect(screen.getByText('TVL')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('6h')).toBeInTheDocument();
    expect(screen.getByText('Holders')).toBeInTheDocument();
    expect(screen.getByText('24h Txs')).toBeInTheDocument();
  });

  test('does not show expandable content when isExpanded is false', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={false}
        />
      </Provider>
    );

    expect(screen.queryByText('Trade')).not.toBeInTheDocument();
    expect(screen.queryByText('Add to Watchlist')).not.toBeInTheDocument();
  });

  test('calls onTrade when trade button is clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={true}
        />
      </Provider>
    );

    const tradeButton = screen.getByText('Trade');
    fireEvent.click(tradeButton);

    expect(mockOnTrade).toHaveBeenCalledWith(mockToken);
  });

  test('calls onAddToWatchlist when add to watchlist button is clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={true}
        />
      </Provider>
    );

    const watchlistButton = screen.getByText('Add to Watchlist');
    fireEvent.click(watchlistButton);

    expect(mockOnAddToWatchlist).toHaveBeenCalledWith(mockToken);
  });

  test('prevents card click when action buttons are clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={true}
        />
      </Provider>
    );

    const tradeButton = screen.getByText('Trade');
    fireEvent.click(tradeButton);

    // Should only call onTrade, not onExpand
    expect(mockOnTrade).toHaveBeenCalledWith(mockToken);
    expect(mockOnExpand).not.toHaveBeenCalled();
  });

  test('applies correct price change colors', () => {
    const { rerender } = render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    // Test positive price change
    const positiveChange = screen.getByText('+12.50%');
    expect(positiveChange).toHaveClass('text-green-400');

    // Test negative price change
    const negativeToken = { ...mockToken, priceChange24h: -5.25 };
    rerender(
      <Provider store={createTestStore()}>
        <TokenCard
          token={negativeToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    const negativeChange = screen.getByText('-5.25%');
    expect(negativeChange).toHaveClass('text-red-400');
  });

  test('applies correct sentiment colors and icons', () => {
    const { rerender } = render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    // Test positive sentiment
    expect(screen.getByText('🚀')).toBeInTheDocument();
    expect(screen.getByText('75%')).toHaveClass('text-green-400');

    // Test negative sentiment
    const negativeToken = { ...mockToken, sentiment: -0.8 };
    rerender(
      <Provider store={createTestStore()}>
        <TokenCard
          token={negativeToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    expect(screen.getByText('💥')).toBeInTheDocument();
    expect(screen.getByText('-80%')).toHaveClass('text-red-400');
  });

  test('shows correct trending status', () => {
    const { rerender } = render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    // Test trending token
    expect(screen.getByText('🔥 TRENDING')).toBeInTheDocument();

    // Test non-trending token
    const nonTrendingToken = { ...mockToken, trending: false };
    rerender(
      <Provider store={createTestStore()}>
        <TokenCard
          token={nonTrendingToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    expect(screen.getByText('📊 STABLE')).toBeInTheDocument();
  });

  test('formats currency correctly', () => {
    const largeToken = {
      ...mockToken,
      marketCap: 2500000000, // 2.5B
      volume24h: 150000000, // 150M
      liquidity: 5000000 // 5M
    };

    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={largeToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    expect(screen.getByText('$2.50B')).toBeInTheDocument(); // Market Cap
    expect(screen.getByText('$150.00M')).toBeInTheDocument(); // Volume
    expect(screen.getByText('$5.00M')).toBeInTheDocument(); // Liquidity
  });

  test('formats percentages correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={true}
        />
      </Provider>
    );

    expect(screen.getAllByText('+12.50%')).toHaveLength(2); // One in main view, one in expanded
    expect(screen.getByText('+2.30%')).toBeInTheDocument();
    expect(screen.getByText('+8.70%')).toBeInTheDocument();
  });

  test('formats age correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={true}
        />
      </Provider>
    );

    expect(screen.getByText('1 months')).toBeInTheDocument(); // 45 days = 1 month
  });

  test('formats numbers with locale', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={true}
        />
      </Provider>
    );

    expect(screen.getByText('12,500')).toBeInTheDocument(); // Holders
    expect(screen.getByText('8,500')).toBeInTheDocument(); // Transactions
  });

  test('shows chain and DEX information', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={true}
        />
      </Provider>
    );

    expect(screen.getAllByText('SOLANA • RAYDIUM')).toHaveLength(2); // One in expanded content, one in footer
    expect(screen.getByText(/0xabcdef.*cdef12/)).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL/i });
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  test('applies hover and press states correctly', async () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL/i });
    
    // Test hover state
    fireEvent.mouseEnter(card);
    await waitFor(() => {
      expect(card).toHaveClass('border-white/30', 'bg-white/8', 'scale-[1.02]');
    });

    // Test press state
    fireEvent.mouseDown(card);
    await waitFor(() => {
      expect(card).toHaveClass('scale-[0.98]', 'bg-white/10');
    });

    // Test mouse leave
    fireEvent.mouseLeave(card);
    await waitFor(() => {
      expect(card).not.toHaveClass('border-white/30', 'bg-white/8', 'scale-[1.02]');
    });
  });

  test('shows click indicator on hover when not expanded', async () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={false}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL/i });
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(screen.getByText('Click to expand')).toBeInTheDocument();
    });
  });

  test('does not show click indicator when expanded', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
          isExpanded={true}
        />
      </Provider>
    );

    expect(screen.queryByText('Click to expand')).not.toBeInTheDocument();
  });

  test('displays token symbol in avatar', () => {
    render(
      <Provider store={createTestStore()}>
        <TokenCard
          token={mockToken}
          onExpand={mockOnExpand}
          onAddToWatchlist={mockOnAddToWatchlist}
          onTrade={mockOnTrade}
        />
      </Provider>
    );

    expect(screen.getAllByText('SOL')).toHaveLength(2); // One in avatar, one in title
  });
}); 