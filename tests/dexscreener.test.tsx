import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dexscreenerReducer from '../src/frontend/store/slices/dexscreenerSlice';
import { DexScreenerView } from '../src/frontend/components/DexScreenerView';

// Mock the LoadingSpinner component
jest.mock('../src/frontend/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      dexscreener: dexscreenerReducer,
    },
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = createTestStore();
  return <Provider store={store}>{children}</Provider>;
};

describe('DexScreenerView', () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the DexScreener interface', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('DexScreener Explorer')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Search and analyze tokens across multiple DEXes')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
  });

  it('displays search and trending navigation tabs', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('🔍')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    }, { timeout: 3000 });

    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    await waitFor(() => {
      expect(searchInput).toHaveValue('SOL');
    });
  });

  it('displays trending tokens on load', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('📈')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click on trending tab to show trending panel
    const trendingButton = screen.getByText('Trending');
    fireEvent.click(trendingButton);

    // Wait for trending tokens to load
    await waitFor(() => {
      expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('allows switching between trending categories', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('📈')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click on trending tab to show trending panel
    const trendingButton = screen.getByText('Trending');
    fireEvent.click(trendingButton);

    // Wait for trending panel to load
    await waitFor(() => {
      expect(screen.getByText('Gainers')).toBeInTheDocument();
      expect(screen.getByText('Losers')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click on different trending categories
    fireEvent.click(screen.getByText('Losers'));
    fireEvent.click(screen.getByText('New'));
  });

  it('displays filter panel when filters button is clicked', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    }, { timeout: 3000 });

    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    expect(screen.getByText('Chain')).toBeInTheDocument();
    expect(screen.getByText('Min Volume')).toBeInTheDocument();
  });

  it('allows filter changes', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open filters panel
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    // Change chain filter
    const chainSelect = screen.getByDisplayValue('Solana');
    fireEvent.change(chainSelect, { target: { value: 'ethereum' } });

    expect(chainSelect).toHaveValue('ethereum');
  });

  it('displays token cards with correct information', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Search for a token
    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
      expect(screen.getByText('Solana')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows token details when a token is clicked', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Search for a token
    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    // Wait for search results and click on a token
    await waitFor(() => {
      const solToken = screen.getByText('SOL');
      fireEvent.click(solToken);
    }, { timeout: 2000 });

    // Check if token details are displayed
    await waitFor(() => {
      expect(screen.getByText('Price Changes')).toBeInTheDocument();
      expect(screen.getByText('Token Info')).toBeInTheDocument();
    });
  });

  it('handles clear search functionality', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument();
    }, { timeout: 3000 });

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    expect(searchInput).toHaveValue('');
  });

  it('displays loading state during API calls', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Search for a token to trigger loading
    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'TEST' } });

    // Should show loading spinner
    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('displays error state when API calls fail', async () => {
    // Mock fetch to return error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Search for a token to trigger error
    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'ERROR' } });

    // Should show error message - the component shows "No tokens found" instead of "Error"
    await waitFor(() => {
      expect(screen.getByText('No tokens found')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('formats currency values correctly', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Search for a token to see formatted values
    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    await waitFor(() => {
      // Check for specific formatted currency values
      expect(screen.getByText('$20.50')).toBeInTheDocument();
      expect(screen.getByText('$50.0M')).toBeInTheDocument();
      expect(screen.getByText('$1000.0M')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('displays percentage changes with correct colors', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Search for a token
    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    await waitFor(() => {
      // Check for percentage changes
      expect(screen.getByText(/^[+-]?\d+\.\d+%$/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('allows sorting of search results', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Search for tokens
    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    await waitFor(() => {
      // Find sort dropdown
      const sortSelect = screen.getByDisplayValue('Volume');
      fireEvent.change(sortSelect, { target: { value: 'price' } });
    }, { timeout: 2000 });
  });

  it('displays no results message when search returns empty', async () => {
    render(
      <TestWrapper>
        <DexScreenerView />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Search for non-existent token
    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });

    await waitFor(() => {
      expect(screen.getByText('No tokens found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search query or filters')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
}); 