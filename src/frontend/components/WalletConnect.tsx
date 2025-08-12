import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';
import { Wallet, LogOut } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { wallet, connected, disconnect, publicKey, connecting, select, wallets } = useWallet();

  // Debug logging
  useEffect(() => {
    console.log('WalletConnect: Current state:', {
      connected,
      connecting,
      wallet: wallet?.adapter?.name,
      publicKey: publicKey?.toString(),
      availableWallets: wallets.map(w => w.adapter.name)
    });
  }, [connected, connecting, wallet, publicKey, wallets]);

  const handleDisconnect = () => {
    try {
      console.log('WalletConnect: Attempting to disconnect');
      disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleConnect = () => {
    try {
      console.log('WalletConnect: Attempting to connect');
      if (wallets.length > 0) {
        select(wallets[0].adapter.name);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (connected && wallet && publicKey) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <Wallet size={16} className="text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {wallet.adapter.name || 'Connected'}
          </span>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="flex items-center space-x-1"
        >
          <LogOut size={14} />
          <span>Disconnect</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <WalletMultiButton 
        className="!bg-blue-600 hover:!bg-blue-700 !text-white !border-0 !rounded-lg !px-4 !py-2 !text-sm !font-medium"
        style={{
          backgroundColor: '#2563eb',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'white',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
      />
      {connecting && (
        <div className="text-xs text-gray-400">
          Connecting...
        </div>
      )}
    </div>
  );
}; 