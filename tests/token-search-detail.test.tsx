/**
 * Token Search and Detail View Test
 * 
 * Tests the enhanced token search with clickable results and detailed views
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TokenSearch } from '../src/frontend/components/TokenSearch';
import { TokenDetailView } from '../src/frontend/components/TokenDetailView';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock the dexscreener service
jest.mock('../src/frontend/services/dexscreenerService', () => ({
  dexscreenerService: {
    searchTokens: jest.fn().mockResolvedValue({
      tokens: [
        {
          symbol: 'TEST',
          name: 'Test Token',
          price: 1.5,
          priceChange24h: 5.2,
          volume24h: 1000000,
          marketCap: 10000000,
          age: 24,
          pairAddress: 'test-pair-address',
          contractAddress: 'test-contract-address',
          chainId: 'solana',
          dexId: 'raydium',
          liquidity: 500000,
        },
        {
          symbol: 'BONK',
          name: 'Bonk',
          price: 0.000001,
          priceChange24h: -2.1,
          volume24h: 5000000,
          marketCap: 50000000,
          age: 48,
          pairAddress: 'bonk-pair-address',
          contractAddress: 'bonk-contract-address',
          chainId: 'solana',
          dexId: 'raydium',
          liquidity: 1000000,
        }
      ],
      hasMore: false
    })
  }
}));

// Mock the token price service
jest.mock('../src/frontend/services/tokenPriceService', () => ({
  tokenPriceService: {
    getTokenPrice: jest.fn().mockResolvedValue({
      id: 'test-contract-address',
      symbol: 'TEST',
      name: 'Test Token',
      price: 1.5,
      priceChange24h: 5.2,
      volume24h: 1000000,
      marketCap: 10000000,
      lastUpdated: Date.now(),
      logoURI: 'https://example.com/logo.png',
    }),
    subscribe: jest.fn().mockReturnValue(() => {}),
  }
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock window.open
Object.assign(window, {
  open: jest.fn(),
});

describe('Token Search and Detail View', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TokenSearch', () => {
    it('should render search interface', () => {
      render(<TokenSearch />);
      
      expect(screen.getByPlaceholderText('Search tokens by symbol or name...')).toBeInTheDocument();
      expect(screen.getByText('Token Search')).toBeInTheDocument();
    });

    it('should display search results when query is entered', async () => {
      render(<TokenSearch />);
      
      const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.getByText('TEST')).toBeInTheDocument();
        expect(screen.getByText('BONK')).toBeInTheDocument();
      });
    });

    it('should show token details when result is clicked', async () => {
      render(<TokenSearch />);
      
      const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        const testToken = screen.getByText('TEST');
        fireEvent.click(testToken);
      });
      
      // Should now show the detail view
      await waitFor(() => {
        expect(screen.getByText('Contract Information')).toBeInTheDocument();
        expect(screen.getByText('Price Performance')).toBeInTheDocument();
      });
    });

    it('should show contract address in search results', async () => {
      render(<TokenSearch />);
      
      const searchInput = screen.getByPlaceholderText('Search tokens by symbol or name...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        // Look for the contract address in the search results
        expect(screen.getByText('test-contract-address')).toBeInTheDocument();
      });
    });
  });

  describe('TokenDetailView', () => {
    const mockToken = {
      symbol: 'TEST',
      name: 'Test Token',
      price: 1.5,
      priceChange24h: 5.2,
      volume24h: 1000000,
      marketCap: 10000000,
      age: 24,
      pairAddress: 'test-pair-address',
      contractAddress: 'test-contract-address',
      chainId: 'solana',
      dexId: 'raydium',
      liquidity: 500000,
    };

    it('should render token details', () => {
      render(<TokenDetailView token={mockToken} />);
      
      expect(screen.getByText('TEST')).toBeInTheDocument();
      expect(screen.getByText('Test Token')).toBeInTheDocument();
      expect(screen.getByText('Contract Information')).toBeInTheDocument();
      expect(screen.getByText('Price Performance')).toBeInTheDocument();
    });

    it('should display contract address', () => {
      render(<TokenDetailView token={mockToken} />);
      
      expect(screen.getByText('test-contract-address')).toBeInTheDocument();
    });

    it('should show back button when onBack is provided', () => {
      const onBack = jest.fn();
      render(<TokenDetailView token={mockToken} onBack={onBack} />);
      
      const backButton = screen.getByText('Back');
      expect(backButton).toBeInTheDocument();
      
      fireEvent.click(backButton);
      expect(onBack).toHaveBeenCalled();
    });

    it('should show watchlist button when onAddToWatchlist is provided', () => {
      const onAddToWatchlist = jest.fn();
      render(<TokenDetailView token={mockToken} onAddToWatchlist={onAddToWatchlist} />);
      
      const watchlistButton = screen.getByText('Watchlist');
      expect(watchlistButton).toBeInTheDocument();
      
      fireEvent.click(watchlistButton);
      expect(onAddToWatchlist).toHaveBeenCalledWith(mockToken, undefined);
    });

    it('should display price information', () => {
      render(<TokenDetailView token={mockToken} />);
      
      // Use getAllByText since there are multiple elements with the same price
      const priceElements = screen.getAllByText('$1.50');
      expect(priceElements.length).toBeGreaterThan(0);
      
      // Use getAllByText for percentage as well since there are multiple instances
      const percentageElements = screen.getAllByText('+5.20%');
      expect(percentageElements.length).toBeGreaterThan(0);
    });

    it('should display market cap and volume', () => {
      render(<TokenDetailView token={mockToken} />);
      
      expect(screen.getByText('$10.00M')).toBeInTheDocument(); // Market cap
      expect(screen.getByText('$1.00M')).toBeInTheDocument(); // Volume
    });
  });
}); 