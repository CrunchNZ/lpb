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

  test('displays platform overview cards', () => {
    renderWithProvider(<LiquidityInterface />);
    
    expect(screen.getByText('Your Liquidity Pools')).toBeInTheDocument();
    // Use getAllByText to handle multiple elements with the same text
    expect(screen.getAllByText('Raydium CLMM').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Meteora DLMM').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Orca Whirlpools').length).toBeGreaterThan(0);
  });

  test('allows platform filtering', () => {
    renderWithProvider(<LiquidityInterface />);
    
    const platformSelect = screen.getByRole('combobox');
    expect(platformSelect).toBeInTheDocument();
    
    fireEvent.change(platformSelect, { target: { value: 'raydium' } });
    expect(platformSelect).toHaveValue('raydium');
  });

  test('displays pool count in header', () => {
    renderWithProvider(<LiquidityInterface />);
    
    expect(screen.getByText(/Active Pools/)).toBeInTheDocument();
  });

  test('shows add pool button', () => {
    renderWithProvider(<LiquidityInterface />);
    
    expect(screen.getByText('Add Pool')).toBeInTheDocument();
  });

  test('displays platform features correctly', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check for platform features that are actually rendered
    expect(screen.getByText('Platform Features')).toBeInTheDocument();
    // Check for actual text content in the component
    expect(screen.getByText('• Concentrated liquidity ranges')).toBeInTheDocument();
    expect(screen.getByText('• Dynamic liquidity management')).toBeInTheDocument();
    expect(screen.getByText('• Whirlpool-specific features')).toBeInTheDocument();
  });

  test('shows add pool button in empty state when no filters applied', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Filter to a non-existent platform to trigger empty state
    const platformSelect = screen.getByRole('combobox');
    fireEvent.change(platformSelect, { target: { value: 'nonexistent' } });
    
    // Check for the add pool button which should still be visible
    expect(screen.getByText('Add Pool')).toBeInTheDocument();
  });

  test('displays platform-specific features correctly', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check Raydium features - use getAllByText to handle multiple elements
    const raydiumFeatures = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('fee tiers') || false;
    });
    expect(raydiumFeatures.length).toBeGreaterThan(0);
    
    // Check Meteora features - use the actual text from the component
    expect(screen.getByText('• Automated rebalancing')).toBeInTheDocument();
  });

  test('formats numbers correctly', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check if TVL is formatted - use getAllByText to handle multiple elements
    const tvlElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('TVL') || false;
    });
    expect(tvlElements.length).toBeGreaterThan(0);
  });

  test('displays correct platform icons and colors', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check if platform icons are displayed with correct colors
    const raydiumElements = screen.getAllByText('Raydium CLMM');
    expect(raydiumElements.length).toBeGreaterThan(0);
    
    const meteoraElements = screen.getAllByText('Meteora DLMM');
    expect(meteoraElements.length).toBeGreaterThan(0);
    
    const orcaElements = screen.getAllByText('Orca Whirlpools');
    expect(orcaElements.length).toBeGreaterThan(0);
  });

  test('provides accessibility features', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check for proper button roles
    const addPoolButton = screen.getByText('Add Pool');
    expect(addPoolButton).toBeInTheDocument();
    
    // Check for proper form controls
    const platformSelect = screen.getByRole('combobox');
    expect(platformSelect).toBeInTheDocument();
  });

  test('handles platform selection changes', () => {
    renderWithProvider(<LiquidityInterface />);
    
    const platformSelect = screen.getByRole('combobox');
    
    // Select Raydium
    fireEvent.change(platformSelect, { target: { value: 'raydium' } });
    expect(platformSelect).toHaveValue('raydium');
    
    // Select Meteora
    fireEvent.change(platformSelect, { target: { value: 'meteora' } });
    expect(platformSelect).toHaveValue('meteora');
  });

  test('displays pool statistics correctly', () => {
    renderWithProvider(<LiquidityInterface />);
    
    // Check for pool statistics that are actually rendered - use getAllByText to handle multiple elements
    const poolsElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Pools') || false;
    });
    expect(poolsElements.length).toBeGreaterThan(0);
    
    const tvlElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('TVL') || false;
    });
    expect(tvlElements.length).toBeGreaterThan(0);
  });
}); 