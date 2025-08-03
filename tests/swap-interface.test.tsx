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
    
    expect(screen.getByText('Swap')).toBeInTheDocument();
    expect(screen.getByText('Jupiter Integration')).toBeInTheDocument();
  });

  test('displays from and to token sections', () => {
    renderWithProvider(<SwapInterface />);
    
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByText('SOL')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  test('allows token selection', async () => {
    renderWithProvider(<SwapInterface />);
    
    // Click on from token to open selector
    const fromTokenButton = screen.getByText('SOL');
    fireEvent.click(fromTokenButton);
    
    // Check if token selector modal appears
    await waitFor(() => {
      expect(screen.getByText('Select Token')).toBeInTheDocument();
    });
    
    // Select a different token
    const bonkToken = screen.getByText('BONK');
    fireEvent.click(bonkToken);
    
    // Check if token was selected
    await waitFor(() => {
      expect(screen.getByText('BONK')).toBeInTheDocument();
    });
  });

  test('allows amount input', () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10.5' } });
    
    expect(amountInput).toHaveValue('10.5');
  });

  test('generates swap quote when amount is entered', async () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    // Wait for quote generation
    await waitFor(() => {
      expect(screen.getByText('Price Impact')).toBeInTheDocument();
      expect(screen.getByText('Network Fee')).toBeInTheDocument();
      expect(screen.getByText('Route')).toBeInTheDocument();
    });
  });

  test('allows slippage configuration', () => {
    renderWithProvider(<SwapInterface />);
    
    // Click on slippage settings
    const slippageButton = screen.getByText('0.5%');
    fireEvent.click(slippageButton);
    
    // Check if slippage options appear
    expect(screen.getByText('0.1%')).toBeInTheDocument();
    expect(screen.getByText('1.0%')).toBeInTheDocument();
    
    // Select different slippage
    const slippageOption = screen.getByText('1.0%');
    fireEvent.click(slippageOption);
    
    // Check if slippage was updated
    expect(screen.getByText('1.0%')).toBeInTheDocument();
  });

  test('allows custom slippage input', () => {
    renderWithProvider(<SwapInterface />);
    
    // Open slippage settings
    const slippageButton = screen.getByText('0.5%');
    fireEvent.click(slippageButton);
    
    // Find custom input
    const customInput = screen.getByPlaceholderText('Custom slippage');
    fireEvent.change(customInput, { target: { value: '2.5' } });
    
    expect(customInput).toHaveValue(2.5);
  });

  test('swaps tokens when swap button is clicked', () => {
    renderWithProvider(<SwapInterface />);
    
    const swapButton = screen.getByRole('button', { name: /swap tokens/i });
    fireEvent.click(swapButton);
    
    // Check if tokens were swapped
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByText('SOL')).toBeInTheDocument();
  });

  test('executes swap transaction', async () => {
    renderWithProvider(<SwapInterface />);
    
    // Enter amount to generate quote
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    // Wait for quote
    await waitFor(() => {
      const swapButton = screen.getByRole('button', { name: 'Swap' });
      expect(swapButton).not.toBeDisabled();
    });
    
    // Click swap button
    const swapButton = screen.getByRole('button', { name: 'Swap' });
    fireEvent.click(swapButton);
    
    // Check if transaction started
    await waitFor(() => {
      expect(screen.getByText('Swapping...')).toBeInTheDocument();
    });
    
    // Wait for transaction completion
    await waitFor(() => {
      expect(screen.getByText('Swap Successful!')).toBeInTheDocument();
    }, { timeout: 5000 });
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

  test('disables swap button when no quote available', () => {
    renderWithProvider(<SwapInterface />);
    
    const swapButton = screen.getByRole('button', { name: 'Swap' });
    expect(swapButton).toBeDisabled();
  });

  test('enables swap button when quote is available', async () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    await waitFor(() => {
      const swapButton = screen.getByRole('button', { name: 'Swap' });
      expect(swapButton).not.toBeDisabled();
    });
  });

  test('displays price impact with correct color coding', async () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    await waitFor(() => {
      const priceImpact = screen.getByText('0.5%');
      expect(priceImpact).toHaveClass('text-green-400');
    });
  });

  test('displays network fee information', async () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    await waitFor(() => {
      expect(screen.getByText('0.3 SOL')).toBeInTheDocument();
    });
  });

  test('displays route information', async () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    await waitFor(() => {
      expect(screen.getByText('Jupiter')).toBeInTheDocument();
    });
  });

  test('closes token selector when token is selected', async () => {
    renderWithProvider(<SwapInterface />);
    
    // Open token selector
    const fromTokenButton = screen.getByText('SOL');
    fireEvent.click(fromTokenButton);
    
    // Select a token
    const bonkToken = screen.getByText('BONK');
    fireEvent.click(bonkToken);
    
    // Check if modal is closed
    await waitFor(() => {
      expect(screen.queryByText('Select Token')).not.toBeInTheDocument();
    });
  });

  test('closes token selector when close button is clicked', async () => {
    renderWithProvider(<SwapInterface />);
    
    // Open token selector
    const fromTokenButton = screen.getByText('SOL');
    fireEvent.click(fromTokenButton);
    
    // Click close button (use more specific selector)
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Check if modal is closed
    await waitFor(() => {
      expect(screen.queryByText('Select Token')).not.toBeInTheDocument();
    });
  });

  test('displays exchange rate when quote is available', async () => {
    renderWithProvider(<SwapInterface />);
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    await waitFor(() => {
      expect(screen.getByText(/1 SOL =/)).toBeInTheDocument();
    });
  });

  test('resets form after successful swap', async () => {
    renderWithProvider(<SwapInterface />);
    
    // Enter amount and execute swap
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    await waitFor(() => {
      const swapButton = screen.getByRole('button', { name: 'Swap' });
      fireEvent.click(swapButton);
    });
    
    // Wait for transaction completion and form reset
    await waitFor(() => {
      expect(amountInput).toHaveValue('');
    }, { timeout: 5000 });
  });
}); 