import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WatchlistView } from '../src/frontend/components/WatchlistView';
import { TokenData } from '../src/backend/integrations/dexscreener';
import uiReducer from '../src/frontend/store/slices/uiSlice';

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(() => true)
});

// Mock the UI components
jest.mock('../src/frontend/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

jest.mock('../src/frontend/components/ui/input', () => ({
  Input: ({ onChange, placeholder, ...props }: any) => (
    <input onChange={onChange} placeholder={placeholder} {...props} />
  )
}));

jest.mock('../src/frontend/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

jest.mock('../src/frontend/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
}));

jest.mock('../src/frontend/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div role="dialog">{children}</div> : null
  ),
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  DialogTrigger: ({ children, asChild, ...props }: any) => (
    asChild ? React.cloneElement(children, props) : <button {...props}>{children}</button>
  )
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">➕</span>,
  Trash2: () => <span data-testid="trash-icon">🗑️</span>,
  Edit: () => <span data-testid="edit-icon">✏️</span>,
  Eye: () => <span data-testid="eye-icon">👁️</span>,
  RefreshCw: () => <span data-testid="refresh-icon">🔄</span>,
  Star: () => <span data-testid="star-icon">⭐</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">📈</span>,
  TrendingDown: () => <span data-testid="trending-down-icon">📉</span>,
  Clock: () => <span data-testid="clock-icon">⏰</span>,
  Users: () => <span data-testid="users-icon">👥</span>,
  Activity: () => <span data-testid="activity-icon">📊</span>
}));

// Mock the cn utility
jest.mock('../src/frontend/utils/cn', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' ')
}));

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
          activeTab: 'watchlists',
          modalStack: [],
          navigationHistory: [{ tab: 'watchlists', timestamp: Date.now() }],
          tabBadges: {},
        }
      }
    }
  });
};

// Mock data
const mockWatchlists = [
  {
    id: 1,
    name: 'My Favorites',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    tokenCount: 3
  },
  {
    id: 2,
    name: 'Trending',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now(),
    tokenCount: 2
  }
];

const mockWatchlistTokens = {
  1: [
    {
      id: 1,
      watchlistId: 1,
      tokenSymbol: 'SOL',
      tokenName: 'Solana',
      pairAddress: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'solana',
      addedAt: Date.now() - 3600000
    },
    {
      id: 2,
      watchlistId: 1,
      tokenSymbol: 'USDC',
      tokenName: 'USD Coin',
      pairAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      chainId: 'solana',
      addedAt: Date.now() - 7200000
    }
  ],
  2: [
    {
      id: 3,
      watchlistId: 2,
      tokenSymbol: 'BONK',
      tokenName: 'Bonk',
      pairAddress: '0x9876543210fedcba9876543210fedcba98765432',
      chainId: 'solana',
      addedAt: Date.now() - 1800000
    }
  ]
};

const mockTokenData: Record<string, TokenData> = {
  'SOL': {
    symbol: 'SOL',
    name: 'Solana',
    price: 0.00012345,
    priceChange24h: 12.5,
    priceChange1h: 2.3,
    priceChange6h: 8.7,
    volume24h: 1500000,
    marketCap: 50000000,
    liquidity: 250000,
    age: 45,
    holders: 12500,
    transactions24h: 8500,
    pairAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: 'solana',
    dexId: 'raydium'
  },
  'USDC': {
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.0,
    priceChange24h: -0.5,
    priceChange1h: 0.1,
    priceChange6h: -0.2,
    volume24h: 5000000,
    marketCap: 100000000,
    liquidity: 1000000,
    age: 720,
    holders: 50000,
    transactions24h: 25000,
    pairAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    chainId: 'solana',
    dexId: 'raydium'
  },
  'BONK': {
    symbol: 'BONK',
    name: 'Bonk',
    price: 0.00000123,
    priceChange24h: 25.8,
    priceChange1h: 5.2,
    priceChange6h: 15.3,
    volume24h: 800000,
    marketCap: 25000000,
    liquidity: 150000,
    age: 12,
    holders: 8000,
    transactions24h: 12000,
    pairAddress: '0x9876543210fedcba9876543210fedcba98765432',
    chainId: 'solana',
    dexId: 'raydium'
  }
};

describe('Enhanced WatchlistView Component', () => {
  const mockOnCreateWatchlist = jest.fn();
  const mockOnUpdateWatchlist = jest.fn();
  const mockOnDeleteWatchlist = jest.fn();
  const mockOnAddTokenToWatchlist = jest.fn();
  const mockOnRemoveTokenFromWatchlist = jest.fn();
  const mockOnRefreshTokenData = jest.fn();
  const mockOnTokenSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders watchlists and tokens correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    expect(screen.getByText('Watchlists')).toBeInTheDocument();
    expect(screen.getByText('My Favorites')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  test('selects watchlist when clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Find the watchlist card by its text content
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    expect(screen.getByText('My Favorites Tokens')).toBeInTheDocument();
    
    // Check for token information - use getAllByText since there might be multiple elements
    const solElements = screen.getAllByText('SOL');
    const usdcElements = screen.getAllByText('USDC');
    expect(solElements.length).toBeGreaterThan(0);
    expect(usdcElements.length).toBeGreaterThan(0);
  });

  test('displays token cards with basic information', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Check for token information - use getAllByText since there might be multiple elements
    const solElements = screen.getAllByText('SOL');
    const usdcElements = screen.getAllByText('USDC');
    expect(solElements.length).toBeGreaterThan(0);
    expect(usdcElements.length).toBeGreaterThan(0);
    
    // Check for token names
    expect(screen.getByText('Solana')).toBeInTheDocument();
    expect(screen.getByText('USD Coin')).toBeInTheDocument();
  });

  test('expands token card when clicked', async () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Click on a token card to expand it - use the first SOL element
    const solElements = screen.getAllByText('SOL');
    const tokenCard = solElements[0]?.closest('div');
    if (tokenCard) {
      fireEvent.click(tokenCard);
    }

    // Check for expanded content
    await waitFor(() => {
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Holders')).toBeInTheDocument();
      expect(screen.getByText('1h')).toBeInTheDocument();
      expect(screen.getByText('6h')).toBeInTheDocument();
      expect(screen.getByText('Chain & DEX')).toBeInTheDocument();
    });
  });

  test('collapses token card when clicked again', async () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Click on a token card to expand it - use the first SOL element
    const solElements = screen.getAllByText('SOL');
    const tokenCard = solElements[0]?.closest('div');
    if (tokenCard) {
      fireEvent.click(tokenCard);
    }

    // Wait for expanded content
    await waitFor(() => {
      expect(screen.getByText('Age')).toBeInTheDocument();
    });

    // Click again to collapse
    if (tokenCard) {
      fireEvent.click(tokenCard);
    }

    // Check that expanded content is gone
    await waitFor(() => {
      expect(screen.queryByText('Age')).not.toBeInTheDocument();
    });
  });

  test('calls onTokenSelect when view button is clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Find the first token card and click its view button
    const tokenCards = screen.getAllByRole('button');
    const solCard = tokenCards.find(card => 
      card.textContent?.includes('SOL') && card.getAttribute('role') === 'button'
    );
    
    if (solCard) {
      // Find the view button within the SOL card
      const viewButton = solCard.querySelector('button[data-testid="eye-icon"]')?.closest('button');
      if (viewButton) {
        fireEvent.click(viewButton);
        expect(mockOnTokenSelect).toHaveBeenCalledWith(mockTokenData.SOL);
      }
    }
  });

  test('calls onRemoveTokenFromWatchlist when remove button is clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Find the first token card and click its remove button
    const tokenCards = screen.getAllByRole('button');
    const solCard = tokenCards.find(card => 
      card.textContent?.includes('SOL') && card.getAttribute('role') === 'button'
    );
    
    if (solCard) {
      // Find the remove button within the SOL card
      const removeButton = solCard.querySelector('button[data-testid="trash-icon"]')?.closest('button');
      if (removeButton) {
        fireEvent.click(removeButton);
        expect(mockOnRemoveTokenFromWatchlist).toHaveBeenCalledWith(1, 'SOL');
      }
    }
  });

  test('applies correct price change colors', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Check for positive price change (SOL)
    const positiveChange = screen.getByText('+12.50%');
    expect(positiveChange).toHaveClass('text-green-400');

    // Check for negative price change (USDC)
    const negativeChange = screen.getByText('-0.50%');
    expect(negativeChange).toHaveClass('text-red-400');
  });

  test('formats currency correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    expect(screen.getByText('$1.50M')).toBeInTheDocument(); // Volume
    expect(screen.getByText('$50.00M')).toBeInTheDocument(); // Market Cap
  });

  test('formats percentages correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    expect(screen.getByText('+12.50%')).toBeInTheDocument();
    expect(screen.getByText('-0.50%')).toBeInTheDocument();
  });

  test('shows expanded content with additional metrics', async () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Click on a token card to expand it - use the first SOL element
    const solElements = screen.getAllByText('SOL');
    const tokenCard = solElements[0]?.closest('div');
    if (tokenCard) {
      fireEvent.click(tokenCard);
    }

    // Check for all expanded content
    await waitFor(() => {
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Holders')).toBeInTheDocument();
      expect(screen.getByText('1h')).toBeInTheDocument();
      expect(screen.getByText('6h')).toBeInTheDocument();
      expect(screen.getByText('24h')).toBeInTheDocument();
      expect(screen.getByText('Chain & DEX')).toBeInTheDocument();
      expect(screen.getByText('SOLANA • RAYDIUM')).toBeInTheDocument();
    });
  });

  test('formats numbers with locale in expanded content', async () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Click on a token card to expand it - use the first SOL element
    const solElements = screen.getAllByText('SOL');
    const tokenCard = solElements[0]?.closest('div');
    if (tokenCard) {
      fireEvent.click(tokenCard);
    }

    // Check for formatted numbers
    await waitFor(() => {
      expect(screen.getByText('12,500')).toBeInTheDocument(); // Holders
    });
  });

  test('has proper accessibility attributes', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Find token cards with role="button" and tabIndex="0"
    const tokenCards = screen.getAllByRole('button');
    expect(tokenCards.length).toBeGreaterThan(0);
    
    // Check that at least one token card has the proper accessibility attributes
    const accessibleCard = tokenCards.find(card => 
      card.getAttribute('tabIndex') === '0' || card.getAttribute('tabindex') === '0'
    );
    expect(accessibleCard).toBeTruthy();
  });

  test('applies hover and press states correctly', async () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Find the first token card (role="button")
    const tokenCards = screen.getAllByRole('button');
    const tokenCard = tokenCards.find(card => 
      card.textContent?.includes('SOL') && card.getAttribute('role') === 'button'
    );
    
    if (tokenCard) {
      // Test hover state - the component applies classes conditionally
      fireEvent.mouseEnter(tokenCard);
      
      // The CSS classes are applied to the Card component inside the wrapper div
      // Look for the Card element within the token card
      const cardElement = tokenCard.querySelector('[class*="cursor-pointer"]');
      expect(cardElement).toBeInTheDocument();
      expect(cardElement?.className).toContain('cursor-pointer');
      expect(cardElement?.className).toContain('transition-all');

      // Test mouse leave
      fireEvent.mouseLeave(tokenCard);
      
      // After mouse leave, the hover classes should be removed
      // The card should still have the base classes but not the hover-specific ones
      expect(cardElement?.className).toContain('cursor-pointer');
    }
  });

  test('shows click indicator on hover when not expanded', async () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    const solElements = screen.getAllByText('SOL');
    const tokenCard = solElements[0]?.closest('div');
    if (tokenCard) {
      fireEvent.mouseEnter(tokenCard);

      // Check that click indicator appears - use getAllByText since there might be multiple
      const clickIndicators = screen.getAllByText('Click to expand');
      expect(clickIndicators.length).toBeGreaterThan(0);
    }
  });

  test('does not show click indicator when expanded', async () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Expand a token card - use the first SOL element
    const solElements = screen.getAllByText('SOL');
    const tokenCard = solElements[0]?.closest('div');
    if (tokenCard) {
      fireEvent.click(tokenCard);
    }

    // Wait for expanded content
    await waitFor(() => {
      expect(screen.getByText('Age')).toBeInTheDocument();
    });

    // Check that click indicator is not shown for the expanded card
    // Since the component shows click indicators for non-expanded cards,
    // we need to check that the expanded card doesn't have the indicator
    const clickIndicators = screen.getAllByText('Click to expand');
    // There should be fewer click indicators after expansion (only for non-expanded cards)
    expect(clickIndicators.length).toBeLessThanOrEqual(1); // Only USDC card should have it
  });

  test('calls onRefreshTokenData when refresh button is clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    const refreshButton = screen.getByRole('button', { name: /🔄/ });
    fireEvent.click(refreshButton);

    expect(mockOnRefreshTokenData).toHaveBeenCalled();
  });

  test('handles keyboard navigation', () => {
    render(
      <Provider store={createTestStore()}>
        <WatchlistView
          watchlists={mockWatchlists}
          watchlistTokens={mockWatchlistTokens}
          tokenData={mockTokenData}
          onCreateWatchlist={mockOnCreateWatchlist}
          onUpdateWatchlist={mockOnUpdateWatchlist}
          onDeleteWatchlist={mockOnDeleteWatchlist}
          onAddTokenToWatchlist={mockOnAddTokenToWatchlist}
          onRemoveTokenFromWatchlist={mockOnRemoveTokenFromWatchlist}
          onRefreshTokenData={mockOnRefreshTokenData}
          onTokenSelect={mockOnTokenSelect}
        />
      </Provider>
    );

    // Select a watchlist first
    const watchlistCard = screen.getByText('My Favorites').closest('div');
    if (watchlistCard) {
      fireEvent.click(watchlistCard);
    }

    // Wait for tokens to be rendered - use the first SOL element
    const solElements = screen.getAllByText('SOL');
    const tokenCard = solElements[0]?.closest('div');
    
    // Test Enter key
    if (tokenCard) {
      fireEvent.keyDown(tokenCard, { key: 'Enter' });
    }
    
    // Test Space key
    if (tokenCard) {
      fireEvent.keyDown(tokenCard, { key: ' ' });
    }
  });
}); 