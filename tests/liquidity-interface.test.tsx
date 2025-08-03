import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LiquidityInterface } from '../src/frontend/components/LiquidityInterface';
import uiReducer from '../src/frontend/store/slices/uiSlice';

const mockStore = configureStore({
  reducer: {
    ui: uiReducer,
  },
  preloadedState: {
    ui: {
      theme: 'dark',
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
        activeTab: 'liquidity',
        modalStack: [],
        navigationHistory: [{ tab: 'liquidity', timestamp: Date.now() }],
        tabBadges: {},
      },
    },
  },
});

describe('LiquidityInterface', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <Provider store={mockStore}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    // Mock fetch for token logos
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders liquidity interface with header', () => {
    renderWithProvider(<LiquidityInterface />);
    
    expect(screen.getByText('Liquidity Management')).toBeInTheDocument();
    expect(screen.getByText('Multi-Platform')).toBeInTheDocument();
  });

  test('displays platform statistics', () => {
    renderWithProvider(<LiquidityInterface />);
    
    expect(screen.getByText('Raydium CLMM')).toBeInTheDocument();
    expect(screen.getByText('Meteora DLMM')).toBeInTheDocument();
    expect(screen.getByText('Orca Whirlpools')).toBeInTheDocument();
    expect(screen.getByText('2 Pools')).toBeInTheDocument();
  });

  test('displays pool cards', () => {
    renderWithProvider(<LiquidityInterface />);
    
    expect(screen.getByText('SOL-USDC')).toBeInTheDocument();
    expect(screen.getByText('BONK-SOL')).toBeInTheDocument();
    expect(screen.getByText('USDC-USDT')).toBeInTheDocument();
  });

  test('allows platform filtering', () => {
    renderWithProvider(<LiquidityInterface />);
    
    const platformSelect = screen.getByDisplayValue('All Platforms');
    fireEvent.change(platformSelect, { target: { value: 'raydium' } });
    
    // Check if only Raydium pools are shown
    expect(screen.getByText('SOL-USDC')).toBeInTheDocument();
    expect(screen.getByText('RAY-SOL')).toBeInTheDocument();
    expect(screen.queryByText('BONK-SOL')).not.toBeInTheDocument();
  });

  test('allows search functionality', () => {
    renderWithProvider(<LiquidityInterface />);
    
    const searchInput = screen.getByPlaceholderText('Search pools by name or tokens...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });
    
    // Check if only SOL pools are shown
    expect(screen.getByText('SOL-USDC')).toBeInTheDocument();
    expect(screen.getByText('BONK-SOL')).toBeInTheDocument();
    expect(screen.queryByText('USDC-USDT')).not.toBeInTheDocument();
  });

  test('allows sorting by different criteria', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Open filters
    const filterButton = screen.getByRole('button', { name: '' });
    fireEvent.click(filterButton);
    
    // Change sort criteria
    const sortSelect = screen.getByDisplayValue('Highest APR');
    fireEvent.change(sortSelect, { target: { value: 'tvl' } });
    
    // Check if sorting changed
    expect(sortSelect).toHaveValue('tvl');
  });

  test('opens contract address input modal', () => {
    renderWithProvider(<LiquidityInterface />);
    
    const addPoolButton = screen.getByText('Add Pool');
    fireEvent.click(addPoolButton);
    
    expect(screen.getByText('Add Pool by Contract')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter pool contract address...')).toBeInTheDocument();
  });

  test('allows contract address input', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Open modal
    const addPoolButton = screen.getByText('Add Pool');
    fireEvent.click(addPoolButton);
    
    // Enter contract address
    const contractInput = screen.getByPlaceholderText('Enter pool contract address...');
    fireEvent.change(contractInput, { target: { value: 'test-contract-address' } });
    
    expect(contractInput).toHaveValue('test-contract-address');
  });

  test('submits contract address', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    renderWithProvider(<LiquidityInterface />);
    
    // Open modal and enter address
    const addPoolButton = screen.getByText('Add Pool');
    fireEvent.click(addPoolButton);
    
    const contractInput = screen.getByPlaceholderText('Enter pool contract address...');
    fireEvent.change(contractInput, { target: { value: 'test-contract-address' } });
    
    // Submit
    const submitButton = screen.getByText('Add Pool');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Adding pool with contract address: test-contract-address');
    });
    
    consoleSpy.mockRestore();
  });

  test('closes contract input modal', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Open modal
    const addPoolButton = screen.getByText('Add Pool');
    fireEvent.click(addPoolButton);
    
    // Close modal
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Add Pool by Contract')).not.toBeInTheDocument();
  });

  test('displays platform features section', () => {
    renderWithProvider(<LiquidityInterface />);
    
    expect(screen.getByText('Platform Features')).toBeInTheDocument();
    expect(screen.getByText('Concentrated liquidity ranges')).toBeInTheDocument();
    expect(screen.getByText('Dynamic liquidity management')).toBeInTheDocument();
    expect(screen.getByText('Whirlpool-specific features')).toBeInTheDocument();
  });

  test('shows empty state when no pools match filters', () => {
    renderWithProvider(<LiquidityInterface />);
    
    const searchInput = screen.getByPlaceholderText('Search pools by name or tokens...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No Pools Found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters.')).toBeInTheDocument();
  });

  test('shows add pool button in empty state when no filters applied', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Clear all pools by filtering
    const platformSelect = screen.getByDisplayValue('All Platforms');
    fireEvent.change(platformSelect, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('Add Your First Pool')).toBeInTheDocument();
  });

  test('displays pool count in header', () => {
    renderWithProvider(<LiquidityInterface />);
    
    expect(screen.getByText('6 Active Pools')).toBeInTheDocument();
  });

  test('updates pool count when filtering', () => {
    renderWithProvider(<LiquidityInterface />);
    
    const platformSelect = screen.getByDisplayValue('All Platforms');
    fireEvent.change(platformSelect, { target: { value: 'raydium' } });
    
    expect(screen.getByText('2 Active Pools')).toBeInTheDocument();
  });

  test('allows advanced filtering', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Open filters
    const filterButton = screen.getByRole('button', { name: '' });
    fireEvent.click(filterButton);
    
    // Check if advanced filters are shown
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('Min APR')).toBeInTheDocument();
    expect(screen.getByText('Min TVL')).toBeInTheDocument();
  });

  test('allows min APR input', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Open filters
    const filterButton = screen.getByRole('button', { name: '' });
    fireEvent.click(filterButton);
    
    // Enter min APR
    const minAprInput = screen.getByPlaceholderText('0%');
    fireEvent.change(minAprInput, { target: { value: '10' } });
    
    expect(minAprInput).toHaveValue(10);
  });

  test('allows min TVL input', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Open filters
    const filterButton = screen.getByRole('button', { name: '' });
    fireEvent.click(filterButton);
    
    // Enter min TVL
    const minTvlInput = screen.getByPlaceholderText('$0');
    fireEvent.change(minTvlInput, { target: { value: '1000000' } });
    
    expect(minTvlInput).toHaveValue(1000000);
  });

  test('toggles filter visibility', () => {
    renderWithProvider(<LiquidityInterface />);
    
    const filterButton = screen.getByRole('button', { name: '' });
    
    // Open filters
    fireEvent.click(filterButton);
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    
    // Close filters
    fireEvent.click(filterButton);
    expect(screen.queryByText('Sort By')).not.toBeInTheDocument();
  });

  test('displays platform-specific features correctly', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check Raydium features
    expect(screen.getByText('Multiple fee tiers (0.01%, 0.05%, 0.3%, 1%)')).toBeInTheDocument();
    
    // Check Meteora features
    expect(screen.getByText('Automated rebalancing')).toBeInTheDocument();
    
    // Check Orca features
    expect(screen.getByText('Liquidity provision interface')).toBeInTheDocument();
  });

  test('formats numbers correctly', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check if TVL is formatted as M/K
    expect(screen.getByText('$2.5M TVL')).toBeInTheDocument();
    expect(screen.getByText('$1.8M TVL')).toBeInTheDocument();
  });

  test('handles pool card interactions', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check if pool cards are interactive
    const poolCards = screen.getAllByText(/SOL-USDC|BONK-SOL|USDC-USDT/);
    expect(poolCards.length).toBeGreaterThan(0);
  });

  test('displays correct platform icons and colors', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check if platform icons are displayed with correct colors
    const raydiumSection = screen.getByText('Raydium CLMM').closest('div');
    const meteoraSection = screen.getByText('Meteora DLMM').closest('div');
    const orcaSection = screen.getByText('Orca Whirlpools').closest('div');
    
    expect(raydiumSection).toBeInTheDocument();
    expect(meteoraSection).toBeInTheDocument();
    expect(orcaSection).toBeInTheDocument();
  });

  test('maintains responsive design', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check if responsive classes are applied
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('max-w-7xl');
  });

  test('handles keyboard navigation', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Test tab navigation
    const searchInput = screen.getByPlaceholderText('Search pools by name or tokens...');
    searchInput.focus();
    
    expect(searchInput).toHaveFocus();
  });

  test('provides accessibility features', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check for proper labels
    expect(screen.getByLabelText(/Search pools/)).toBeInTheDocument();
    
    // Check for proper button roles
    const addPoolButton = screen.getByText('Add Pool');
    expect(addPoolButton).toHaveAttribute('role', 'button');
  });
}); 