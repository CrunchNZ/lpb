import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SwapInterface } from '../src/frontend/components/SwapInterface';
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
        activeTab: 'swap',
        modalStack: [],
        navigationHistory: [{ tab: 'swap', timestamp: Date.now() }],
        tabBadges: {},
      },
    },
  },
});

describe('SwapInterface', () => {
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

  test('renders swap interface with header', () => {
    renderWithProvider(<SwapInterface />);
    
    // Use getAllByText to handle multiple "Swap" elements
    const swapElements = screen.getAllByText('Swap');
    expect(swapElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Jupiter Integration')).toBeInTheDocument();
  });

  test('displays from and to token sections', () => {
    renderWithProvider(<SwapInterface />);
    
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByText('SOL')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  test('allows amount input', () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10.5' } });
    
    // Check for number value instead of string
    expect(amountInput).toHaveValue(10.5);
  });

  test('disables swap button when no quote available', () => {
    renderWithProvider(<SwapInterface />);
    
    const swapButton = screen.getByRole('button', { name: 'Swap' });
    expect(swapButton).toBeDisabled();
  });

  test('generates swap quote when amount is entered', async () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    // Wait for quote generation - check for the quote details section
    await waitFor(() => {
      // Look for the quote details container that appears when a quote is generated
      const quoteDetailsSection = screen.getByText('Price Impact');
      expect(quoteDetailsSection).toBeInTheDocument();
    }, { timeout: 2000 }); // Increase timeout to 2 seconds
  });

  test('enables swap button when quote is available', async () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    await waitFor(() => {
      const swapButton = screen.getByRole('button', { name: 'Swap' });
      expect(swapButton).not.toBeDisabled();
    }, { timeout: 2000 }); // Increase timeout to 2 seconds
  });

  test('displays recent transactions', () => {
    renderWithProvider(<SwapInterface />);
    
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByText('SOL → USDC')).toBeInTheDocument();
    expect(screen.getByText('2.5 SOL for 245.50 USDC')).toBeInTheDocument();
  });

  test('shows loading state during quote generation', async () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    // Check if loading indicator appears
    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  test('allows slippage configuration', async () => {
    renderWithProvider(<SwapInterface />);
    
    // Click on slippage settings
    const slippageButton = screen.getByText('0.5%');
    fireEvent.click(slippageButton);
    
    // Check if slippage options appear
    await waitFor(() => {
      expect(screen.getByText('0.1%')).toBeInTheDocument();
      expect(screen.getByText('1%')).toBeInTheDocument();
    });
  });
}); 