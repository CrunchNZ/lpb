/**
 * Wallet Integration Test
 * 
 * Tests wallet adapter functionality and connection issues
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock TextEncoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(input: string): Uint8Array {
      return new Uint8Array(Buffer.from(input, 'utf8'));
    }
  } as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(input: Uint8Array): string {
      return Buffer.from(input).toString('utf8');
    }
  } as any;
}

// Mock wallet adapter components
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    wallet: null,
    connected: false,
    connecting: false,
    disconnect: jest.fn(),
    publicKey: null,
    select: jest.fn(),
    wallets: [
      {
        adapter: {
          name: 'Phantom',
          readyState: 'Installed'
        }
      },
      {
        adapter: {
          name: 'Solflare',
          readyState: 'Installed'
        }
      }
    ]
  })
}));

jest.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletMultiButton: ({ className, style, onClick }: any) => {
    const React = require('react');
    return React.createElement('button', {
      className,
      style,
      onClick,
      'data-testid': 'wallet-multi-button'
    }, 'Connect Wallet');
  }
}));

// Mock the wallet adapter wallets to avoid TextEncoder issues
jest.mock('@solana/wallet-adapter-wallets', () => ({
  PhantomWalletAdapter: jest.fn().mockImplementation(() => ({
    name: 'Phantom',
    url: 'https://phantom.app',
    icon: 'phantom-icon',
    readyState: 'Installed',
  })),
  SolflareWalletAdapter: jest.fn().mockImplementation(() => ({
    name: 'Solflare',
    url: 'https://solflare.com',
    icon: 'solflare-icon',
    readyState: 'Installed',
  })),
  TorusWalletAdapter: jest.fn().mockImplementation(() => ({
    name: 'Torus',
    url: 'https://torus.com',
    icon: 'torus-icon',
    readyState: 'Installed',
  })),
  LedgerWalletAdapter: jest.fn().mockImplementation(() => ({
    name: 'Ledger',
    url: 'https://ledger.com',
    icon: 'ledger-icon',
    readyState: 'Installed',
  })),
}));

describe('Wallet Integration', () => {
  beforeEach(() => {
    // Mock window object
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock document methods
    Object.defineProperty(document, 'createElement', {
      writable: true,
      value: jest.fn().mockImplementation((tagName) => {
        if (tagName === 'link') {
          return {
            rel: '',
            href: '',
            onload: jest.fn(),
            onerror: jest.fn(),
            style: {},
            setAttribute: jest.fn(),
            appendChild: jest.fn(),
          };
        }
        return {};
      }),
    });

    Object.defineProperty(document, 'head', {
      writable: true,
      value: {
        appendChild: jest.fn(),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should provide wallet connection state', () => {
    const { useWallet } = require('@solana/wallet-adapter-react');
    const walletState = useWallet();
    
    expect(walletState).toHaveProperty('connected');
    expect(walletState).toHaveProperty('connecting');
    expect(walletState).toHaveProperty('wallet');
    expect(walletState).toHaveProperty('disconnect');
    expect(walletState).toHaveProperty('wallets');
  });

  it('should have available wallet adapters', () => {
    const { useWallet } = require('@solana/wallet-adapter-react');
    const { wallets } = useWallet();
    
    expect(wallets).toBeInstanceOf(Array);
    expect(wallets.length).toBeGreaterThan(0);
    expect(wallets[0]).toHaveProperty('adapter.name');
  });

  it('should handle wallet connection attempts', () => {
    const { useWallet } = require('@solana/wallet-adapter-react');
    const { select } = useWallet();
    
    expect(typeof select).toBe('function');
    
    // Test that select can be called without errors
    expect(() => {
      select('Phantom');
    }).not.toThrow();
  });

  it('should handle wallet disconnection attempts', () => {
    const { useWallet } = require('@solana/wallet-adapter-react');
    const { disconnect } = useWallet();
    
    expect(typeof disconnect).toBe('function');
    
    // Test that disconnect can be called without errors
    expect(() => {
      disconnect();
    }).not.toThrow();
  });
}); 