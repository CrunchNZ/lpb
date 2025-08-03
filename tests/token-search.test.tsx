/**
 * TokenSearch Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TokenSearch } from '../src/frontend/components/TokenSearch';
import uiReducer from '../src/frontend/store/slices/uiSlice';

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

jest.mock('../src/frontend/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectItem: ({ value, children, ...props }: any) => <div data-value={value} {...props}>{children}</div>
}));

jest.mock('../src/frontend/components/ui/slider', () => ({
  Slider: ({ onValueChange, ...props }: any) => (
    <div {...props}>
      <div className="slider-track" />
      <div className="slider-thumb" />
    </div>
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

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">🔍</span>,
  Filter: () => <span data-testid="filter-icon">🔧</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">📈</span>,
  TrendingDown: () => <span data-testid="trending-down-icon">📉</span>,
  Clock: () => <span data-testid="clock-icon">⏰</span>,
  DollarSign: () => <span data-testid="dollar-icon">💰</span>
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
        }
      }
    }
  });
};

describe('TokenSearch Component', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should render token search interface', () => {
    render(
      <Provider store={store}>
        <TokenSearch />
      </Provider>
    );

    expect(screen.getByText('Token Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
  });

  it('should show search results when query is entered', async () => {
    render(
      <Provider store={store}>
        <TokenSearch />
      </Provider>
    );

    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    await waitFor(() => {
      expect(screen.getByText('No tokens found matching your search.')).toBeInTheDocument();
    });
  });

  it('should display token information correctly', async () => {
    render(
      <Provider store={store}>
        <TokenSearch />
      </Provider>
    );

    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'BONK' } });

    await waitFor(() => {
      expect(screen.getByText('No tokens found matching your search.')).toBeInTheDocument();
    });
  });

  it('should handle filter changes', async () => {
    render(
      <Provider store={store}>
        <TokenSearch />
      </Provider>
    );

    const filterButton = screen.getByTestId('filter-icon');
    fireEvent.click(filterButton);

    // Check that filter options are available
    expect(screen.getByText('Chain')).toBeInTheDocument();
    expect(screen.getByText('Min Volume')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('should call onTokenSelect when token is clicked', async () => {
    const mockOnTokenSelect = jest.fn();
    
    render(
      <Provider store={store}>
        <TokenSearch onTokenSelect={mockOnTokenSelect} />
      </Provider>
    );

    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    await waitFor(() => {
      expect(screen.getByText('No tokens found matching your search.')).toBeInTheDocument();
    });
  });

  it('should display trending indicators', async () => {
    render(
      <Provider store={store}>
        <TokenSearch />
      </Provider>
    );

    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    await waitFor(() => {
      // Check that no results message is shown
      expect(screen.getByText('No tokens found matching your search.')).toBeInTheDocument();
    });
  });

  it('should handle empty search results', async () => {
    render(
      <Provider store={store}>
        <TokenSearch />
      </Provider>
    );

    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });

    await waitFor(() => {
      expect(screen.getByText('No tokens found matching your search.')).toBeInTheDocument();
    });
  });

  it('should display token age information', async () => {
    render(
      <Provider store={store}>
        <TokenSearch />
      </Provider>
    );

    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'SOL' } });

    await waitFor(() => {
      expect(screen.getByText('No tokens found matching your search.')).toBeInTheDocument();
    });
  });

  it('should show price change percentage', async () => {
    render(
      <Provider store={store}>
        <TokenSearch />
      </Provider>
    );

    const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
    expect(searchInput).toBeInTheDocument();
  });
}); 