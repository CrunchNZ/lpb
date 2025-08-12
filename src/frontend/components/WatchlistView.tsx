/**
 * WatchlistView Component
 * Manages watchlists and displays watchlisted tokens with real-time data
 */

import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface Watchlist {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  tokenCount?: number;
}

interface WatchlistToken {
  id: number;
  watchlistId: number;
  tokenSymbol: string;
  tokenName: string;
  pairAddress: string;
  chainId: string;
  addedAt: number;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  logoURI?: string;
}

interface WatchlistViewProps {
  watchlists?: Watchlist[];
  watchlistTokens?: Record<number, WatchlistToken[]>;
  onCreateWatchlist?: (name: string) => Promise<void>;
  onUpdateWatchlist?: (id: number, name: string) => Promise<void>;
  onDeleteWatchlist?: (id: number) => Promise<void>;
  onAddTokenToWatchlist?: (watchlistId: number, token: any) => Promise<void>;
  onRemoveTokenFromWatchlist?: (watchlistId: number, tokenSymbol: string) => Promise<void>;
  onTokenSelect?: (token: WatchlistToken) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlists = [],
  watchlistTokens = {},
  onCreateWatchlist,
  onUpdateWatchlist,
  onDeleteWatchlist,
  onAddTokenToWatchlist,
  onRemoveTokenFromWatchlist,
  onTokenSelect
}) => {
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [editingWatchlist, setEditingWatchlist] = useState<{ id: number; name: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockWatchlists: Watchlist[] = [
    {
      id: 1,
      name: 'My Favorites',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
      tokenCount: 3
    },
    {
      id: 2,
      name: 'Trending Tokens',
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now(),
      tokenCount: 5
    }
  ];

  const mockWatchlistTokens: Record<number, WatchlistToken[]> = {
    1: [
      {
        id: 1,
        watchlistId: 1,
        tokenSymbol: 'PEPE',
        tokenName: 'Pepe',
        pairAddress: 'mock_address_1',
        chainId: 'solana',
        addedAt: Date.now() - 3600000,
        price: 0.00000123,
        priceChange24h: 15.67,
        volume24h: 2500000,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png'
      },
      {
        id: 2,
        watchlistId: 1,
        tokenSymbol: 'BONK',
        tokenName: 'Bonk',
        pairAddress: 'mock_address_2',
        chainId: 'solana',
        addedAt: Date.now() - 7200000,
        price: 0.00000045,
        priceChange24h: -8.92,
        volume24h: 1800000,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png'
      }
    ],
    2: [
      {
        id: 3,
        watchlistId: 2,
        tokenSymbol: 'SOL',
        tokenName: 'Solana',
        pairAddress: 'mock_address_3',
        chainId: 'solana',
        addedAt: Date.now() - 1800000,
        price: 98.45,
        priceChange24h: 2.34,
        volume24h: 45000000,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
      }
    ]
  };

  const displayWatchlists = watchlists.length > 0 ? watchlists : mockWatchlists;
  const displayWatchlistTokens = Object.keys(watchlistTokens).length > 0 ? watchlistTokens : mockWatchlistTokens;

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (onCreateWatchlist) {
        await onCreateWatchlist(newWatchlistName);
      }
      setNewWatchlistName('');
      setShowCreateDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWatchlist = async () => {
    if (!editingWatchlist || !editingWatchlist.name.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (onUpdateWatchlist) {
        await onUpdateWatchlist(editingWatchlist.id, editingWatchlist.name);
      }
      setEditingWatchlist(null);
      setShowEditDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWatchlist = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      if (onDeleteWatchlist) {
        await onDeleteWatchlist(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete watchlist');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) {
      return `$${(amount / 1e9).toFixed(2)}B`;
    } else if (amount >= 1e6) {
      return `$${(amount / 1e6).toFixed(2)}M`;
    } else if (amount >= 1e3) {
      return `$${(amount / 1e3).toFixed(2)}K`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  // Error fallback component
  const ErrorFallback = () => (
    <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Failed to load watchlists</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Please try refreshing the page</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Watchlists</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your token watchlists</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Watchlist
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        )}

        {/* Watchlists */}
        {!loading && displayWatchlists.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No watchlists yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first watchlist to start tracking tokens</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Watchlist
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayWatchlists.map((watchlist) => (
              <div key={watchlist.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{watchlist.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingWatchlist({ id: watchlist.id, name: watchlist.name });
                        setShowEditDialog(true);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteWatchlist(watchlist.id)}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p>Created: {formatDate(watchlist.createdAt)}</p>
                  <p>Updated: {formatDate(watchlist.updatedAt)}</p>
                  <p>Tokens: {watchlist.tokenCount || 0}</p>
                </div>

                {/* Token List */}
                <div className="space-y-3">
                  {displayWatchlistTokens[watchlist.id]?.map((token) => (
                    <div 
                      key={token.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => onTokenSelect?.(token)}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={token.logoURI || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png`}
                          alt={token.tokenSymbol}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                          }}
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{token.tokenSymbol}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{token.tokenName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {token.price && (
                          <div className="font-medium text-gray-900 dark:text-white">
                            ${token.price.toFixed(6)}
                          </div>
                        )}
                        {token.priceChange24h !== undefined && (
                          <div className={`text-sm ${getPriceChangeColor(token.priceChange24h)}`}>
                            {formatPercentage(token.priceChange24h)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Watchlist</h3>
              <input
                type="text"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                placeholder="Enter watchlist name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWatchlist}
                  disabled={!newWatchlistName.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        {showEditDialog && editingWatchlist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Watchlist</h3>
              <input
                type="text"
                value={editingWatchlist.name}
                onChange={(e) => setEditingWatchlist({ ...editingWatchlist, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateWatchlist}
                  disabled={!editingWatchlist.name.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}; 