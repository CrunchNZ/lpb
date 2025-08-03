import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PositionCard } from '../src/frontend/components/PositionCard';
import { Position } from '../src/backend/database';
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

// Mock position data
const mockPosition: Position = {
  id: '1',
  tokenA: 'SOL',
  tokenB: 'USDC',
  poolAddress: '0x1234567890abcdef1234567890abcdef12345678',
  strategy: 'balanced',
  status: 'active',
  amountA: 100.5,
  amountB: 5000.0,
  entryPrice: 50.25,
  currentPrice: 52.75,
  pnl: 250.50,
  apy: 12.5,
  timestamp: Date.now()
};

describe('Enhanced PositionCard Component', () => {
  const mockOnExpand = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders basic position information correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    expect(screen.getAllByText('SOL/USDC')).toHaveLength(2); // One in span, one in h3
    expect(screen.getByText('balanced')).toBeInTheDocument();
    expect(screen.getByText('$250.50')).toBeInTheDocument();
    expect(screen.getByText('+12.50%')).toBeInTheDocument();
  });

  test('calls onExpand when card is clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL\/USDC/i });
    fireEvent.click(card);

    expect(mockOnExpand).toHaveBeenCalledWith(mockPosition);
  });

  test('calls onExpand when Enter key is pressed', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL\/USDC/i });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnExpand).toHaveBeenCalledWith(mockPosition);
  });

  test('calls onExpand when Space key is pressed', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL\/USDC/i });
    fireEvent.keyDown(card, { key: ' ' });

    expect(mockOnExpand).toHaveBeenCalledWith(mockPosition);
  });

  test('shows expandable content when isExpanded is true', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
          isExpanded={true}
        />
      </Provider>
    );

    expect(screen.getByText('Add Liquidity')).toBeInTheDocument();
    expect(screen.getByText('View Chart')).toBeInTheDocument();
    expect(screen.getByText('Liquidity Range')).toBeInTheDocument();
    expect(screen.getByText('Fee Tier')).toBeInTheDocument();
  });

  test('does not show expandable content when isExpanded is false', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
          isExpanded={false}
        />
      </Provider>
    );

    expect(screen.queryByText('Add Liquidity')).not.toBeInTheDocument();
    expect(screen.queryByText('View Chart')).not.toBeInTheDocument();
  });

  test('shows close button for active positions', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const closeButton = screen.getByText('Close');
    expect(closeButton).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledWith('1');
  });

  test('prevents card click when close button is clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    // Should only call onClose, not onExpand
    expect(mockOnClose).toHaveBeenCalledWith('1');
    expect(mockOnExpand).not.toHaveBeenCalled();
  });

  test('applies correct status colors', () => {
    const { rerender } = render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    // Test active status
    const activeStatus = screen.getByText('ACTIVE');
    expect(activeStatus).toHaveClass('bg-green-500/20', 'text-green-400');

    // Test closed status
    const closedPosition = { ...mockPosition, status: 'closed' as const };
    rerender(
      <Provider store={createTestStore()}>
        <PositionCard
          position={closedPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const closedStatus = screen.getByText('CLOSED');
    expect(closedStatus).toHaveClass('bg-gray-500/20', 'text-gray-400');
  });

  test('applies correct PnL colors', () => {
    const { rerender } = render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    // Test positive PnL
    const positivePnl = screen.getByText('$250.50');
    expect(positivePnl).toHaveClass('text-green-400');

    // Test negative PnL
    const negativePosition = { ...mockPosition, pnl: -150.25 };
    rerender(
      <Provider store={createTestStore()}>
        <PositionCard
          position={negativePosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const negativePnl = screen.getByText('-$150.25');
    expect(negativePnl).toHaveClass('text-red-400');
  });

  test('formats currency correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    expect(screen.getByText('$50.25')).toBeInTheDocument(); // Entry price
    expect(screen.getByText('$52.75')).toBeInTheDocument(); // Current price
    expect(screen.getByText('$250.50')).toBeInTheDocument(); // PnL
  });

  test('formats percentages correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    expect(screen.getByText('+12.50%')).toBeInTheDocument();
  });

  test('formats dates correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const dateText = screen.getByText(/Created/);
    expect(dateText).toBeInTheDocument();
  });

  test('shows correct strategy icon', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    expect(screen.getByText('⚖️')).toBeInTheDocument(); // Balanced strategy
  });

  test('has proper accessibility attributes', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL\/USDC/i });
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  test('applies hover and press states correctly', async () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL\/USDC/i });
    
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
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
          isExpanded={false}
        />
      </Provider>
    );

    const card = screen.getByRole('button', { name: /SOL\/USDC/i });
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(screen.getByText('Click to expand')).toBeInTheDocument();
    });
  });

  test('does not show click indicator when expanded', () => {
    render(
      <Provider store={createTestStore()}>
        <PositionCard
          position={mockPosition}
          onExpand={mockOnExpand}
          onClose={mockOnClose}
          isExpanded={true}
        />
      </Provider>
    );

    expect(screen.queryByText('Click to expand')).not.toBeInTheDocument();
  });
}); 