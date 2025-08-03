/**
 * PoolCard Component Tests
 *
 * Covers rendering, expand/collapse, action buttons, and edge cases for PoolCard.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PoolCard, PoolCardProps } from '../src/frontend/components/PoolCard';
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

describe('PoolCard', () => {
  const defaultProps: PoolCardProps = {
    poolName: 'SOL-USDC',
    platform: 'Raydium',
    tvl: 1000000,
    apr: 12.5,
    userLiquidity: 5000,
    onAddLiquidity: jest.fn(),
    onRemoveLiquidity: jest.fn(),
    onViewDetails: jest.fn(),
  };

  it('renders pool information and action buttons', () => {
    render(
      <Provider store={createTestStore()}>
        <PoolCard {...defaultProps} />
      </Provider>
    );
    expect(screen.getByText('SOL-USDC')).toBeInTheDocument();
    expect(screen.getByText('Raydium')).toBeInTheDocument();
    expect(screen.getByText('$1.00M')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
    expect(screen.getByText('$5.00K')).toBeInTheDocument();
    expect(screen.getByText('Add Liquidity')).toBeInTheDocument();
    expect(screen.getByText('Remove Liquidity')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('expands and collapses when clicked', () => {
    render(
      <Provider store={createTestStore()}>
        <PoolCard {...defaultProps} />
      </Provider>
    );
    // Initially not expanded
    const card = screen.getAllByRole('button')[0];
    expect(card).toHaveAttribute('aria-expanded', 'false');
    // Click to expand
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');
    // Click again to collapse
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  it('calls action handlers when buttons are clicked (when expanded)', () => {
    const handlers = {
      onAddLiquidity: jest.fn(),
      onRemoveLiquidity: jest.fn(),
      onViewDetails: jest.fn(),
    };
    render(
      <Provider store={createTestStore()}>
        <PoolCard {...defaultProps} {...handlers} />
      </Provider>
    );
    // Expand first
    fireEvent.click(screen.getByRole('button'));
    // Click Add Liquidity
    fireEvent.click(screen.getByText('Add Liquidity'));
    expect(handlers.onAddLiquidity).toHaveBeenCalled();
    // Click Remove Liquidity
    fireEvent.click(screen.getByText('Remove Liquidity'));
    expect(handlers.onRemoveLiquidity).toHaveBeenCalled();
    // Click View Details
    fireEvent.click(screen.getByText('View Details'));
    expect(handlers.onViewDetails).toHaveBeenCalled();
  });

  it('shows hover and press feedback', () => {
    render(
      <Provider store={createTestStore()}>
        <PoolCard {...defaultProps} />
      </Provider>
    );
    const card = screen.getByRole('button');
    // Hover
    fireEvent.mouseEnter(card);
    expect(card.className).toMatch(/scale-\[1.02\]/);
    // Press
    fireEvent.mouseDown(card);
    expect(card.className).toMatch(/scale-95/);
    // Release
    fireEvent.mouseUp(card);
    expect(card.className).not.toMatch(/scale-95/);
    // Unhover
    fireEvent.mouseLeave(card);
    expect(card.className).not.toMatch(/scale-\[1.02\]/);
  });

  it('is accessible via keyboard (Enter/Space toggles expand)', () => {
    render(
      <Provider store={createTestStore()}>
        <PoolCard {...defaultProps} />
      </Provider>
    );
    const card = screen.getByRole('button');
    card.focus();
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(card).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(card, { key: ' ' });
    expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  it('handles edge cases: zero liquidity and large TVL', () => {
    render(
      <Provider store={createTestStore()}>
        <PoolCard {...defaultProps} tvl={1234567890} userLiquidity={0} />
      </Provider>
    );
    expect(screen.getByText('$1.23B')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});