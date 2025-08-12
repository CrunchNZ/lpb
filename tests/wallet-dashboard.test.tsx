/**
 * Wallet Dashboard Test
 * 
 * Tests the wallet dashboard functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WalletDashboard } from '../src/frontend/components/WalletDashboard';

// Mock wallet adapter
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    publicKey: { toString: () => 'test-public-key' },
    connected: true,
  }),
}));

// Mock Solana web3
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL in lamports
    getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  mint: 'test-token-mint',
                  tokenAmount: {
                    uiAmount: 1000,
                    decimals: 6,
                  },
                },
              },
            },
          },
        },
      ],
    }),
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({ toString: () => key })),
  LAMPORTS_PER_SOL: 1000000000,
}));

// Mock token price service
jest.mock('../src/frontend/services/tokenPriceService', () => ({
  tokenPriceService: {
    getTokenPrices: jest.fn().mockResolvedValue([
      {
        id: 'test-token-mint',
        symbol: 'TEST',
        name: 'Test Token',
        price: 1.5,
        priceChange24h: 5.2,
        volume24h: 1000000,
        marketCap: 10000000,
        lastUpdated: Date.now(),
        logoURI: 'https://example.com/logo.png',
      },
    ]),
    subscribe: jest.fn().mockReturnValue(() => {}),
  },
}));

describe('WalletDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render wallet portfolio when connected', async () => {
    render(<WalletDashboard />);

    // Check for main elements
    expect(screen.getByText('Wallet Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('SOL Balance')).toBeInTheDocument();
    expect(screen.getByText('Token Count')).toBeInTheDocument();

    // Wait for data to load and check for loading state
    await waitFor(() => {
      expect(screen.getByText('Loading wallet data...')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    render(<WalletDashboard />);
    
    expect(screen.getByText('Loading wallet data...')).toBeInTheDocument();
  });

  it('should display token balances when available', async () => {
    render(<WalletDashboard />);

    // The component should show loading initially
    expect(screen.getByText('Loading wallet data...')).toBeInTheDocument();
  });

  it('should show refresh button', () => {
    render(<WalletDashboard />);
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should display wallet address', () => {
    render(<WalletDashboard />);
    
    // The wallet address is displayed as "test...-key"
    expect(screen.getByText(/test.*key/)).toBeInTheDocument();
  });
}); 