/**
 * Enhanced Wallet Provider
 * 
 * Provides comprehensive wallet management for multiple Solana wallets:
 * - Phantom, Solflare, Backpack support
 * - Auto-connect functionality
 * - Connection status monitoring
 * - Wallet switching capabilities
 * - Transaction signing integration
 */

import React, { FC, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS (only in browser environment)
if (typeof window !== 'undefined') {
  // Use a more reliable method to load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-react-ui@0.9.34/styles.css';
  link.onload = () => {
    console.log('Wallet adapter styles loaded successfully');
  };
  link.onerror = () => {
    console.warn('Failed to load wallet adapter styles from CDN, trying local import');
    // Fallback to local import
    try {
      import('@solana/wallet-adapter-react-ui/styles.css').catch((error) => {
        console.warn('Failed to load wallet adapter styles:', error);
      });
    } catch (error) {
      console.warn('Failed to load wallet adapter styles:', error);
    }
  };
  document.head.appendChild(link);
}

interface WalletProviderProps {
  children: ReactNode;
  network?: WalletAdapterNetwork;
  autoConnect?: boolean;
}

export const WalletProvider: FC<WalletProviderProps> = ({ 
  children, 
  network = WalletAdapterNetwork.Mainnet,
  autoConnect = true 
}) => {
  // Determine RPC endpoint based on network
  const endpoint = useMemo(() => {
    const envEndpoint = process.env.VITE_SOLANA_RPC_URL;
    if (envEndpoint) {
      return envEndpoint;
    }
    
    switch (network) {
      case WalletAdapterNetwork.Devnet:
        return clusterApiUrl('devnet');
      case WalletAdapterNetwork.Testnet:
        return clusterApiUrl('testnet');
      case WalletAdapterNetwork.Mainnet:
      default:
        return clusterApiUrl('mainnet-beta');
    }
  }, [network]);

  // Initialize wallet adapters
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
  ], []);

  // Connection configuration
  const connectionConfig = useMemo(() => ({
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
  }), []);

  // Auto-connect callback
  const onAutoConnectRequest = useCallback(() => {
    console.log('Wallet: Auto-connect requested');
  }, []);

  // Connection error handler
  const onConnectionError = useCallback((error: Error) => {
    console.error('Wallet: Connection error:', error);
  }, []);

  // Wallet connection handler
  const onWalletConnect = useCallback((wallet: any) => {
    console.log('Wallet: Connected to', wallet.name);
  }, []);

  // Wallet disconnection handler
  const onWalletDisconnect = useCallback(() => {
    console.log('Wallet: Disconnected');
  }, []);

  // Wallet selection handler
  const onWalletSelect = useCallback((wallet: any) => {
    console.log('Wallet: Selected', wallet.name);
  }, []);

  // Wallet error handler
  const onWalletError = useCallback((error: Error) => {
    console.error('Wallet: Error:', error);
  }, []);

  // Effect to handle wallet events
  useEffect(() => {
    // Listen for wallet connection events
    const handleWalletConnect = (event: CustomEvent) => {
      onWalletConnect(event.detail);
    };

    const handleWalletDisconnect = () => {
      onWalletDisconnect();
    };

    const handleWalletError = (event: CustomEvent) => {
      onWalletError(event.detail);
    };

    // Add event listeners
    window.addEventListener('wallet:connect', handleWalletConnect as EventListener);
    window.addEventListener('wallet:disconnect', handleWalletDisconnect);
    window.addEventListener('wallet:error', handleWalletError as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('wallet:connect', handleWalletConnect as EventListener);
      window.removeEventListener('wallet:disconnect', handleWalletDisconnect);
      window.removeEventListener('wallet:error', handleWalletError as EventListener);
    };
  }, [onWalletConnect, onWalletDisconnect, onWalletError]);

  return (
    <ConnectionProvider 
      endpoint={endpoint}
      config={connectionConfig}
    >
      <SolanaWalletProvider
        wallets={wallets}
        autoConnect={autoConnect}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider; 