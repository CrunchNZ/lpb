/**
 * WatchlistView Component
 * Manages watchlists and displays watchlisted tokens with real-time data
 */

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store';
import { openWatchlistDetail } from '../store/slices/uiSlice';
import { Plus, Trash2, Edit, Eye, RefreshCw, Star, TrendingUp, TrendingDown, Clock, Users, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useTheme } from '../store/hooks';
import { TokenData } from '../../backend/integrations/dexscreener';

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
}

interface WatchlistViewProps {
  watchlists: Watchlist[];
  watchlistTokens: Record<number, WatchlistToken[]>;
  tokenData: Record<string, TokenData>;
  onCreateWatchlist: (name: string) => Promise<void>;
  onUpdateWatchlist: (id: number, name: string) => Promise<void>;
  onDeleteWatchlist: (id: number) => Promise<void>;
  onAddTokenToWatchlist: (watchlistId: number, token: TokenData) => Promise<void>;
  onRemoveTokenFromWatchlist: (watchlistId: number, tokenSymbol: string) => Promise<void>;
  onRefreshTokenData: () => Promise<void>;
  onTokenSelect?: (token: TokenData) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlists,
  watchlistTokens,
  tokenData,
  onCreateWatchlist,
  onUpdateWatchlist,
  onDeleteWatchlist,
  onAddTokenToWatchlist,
  onRemoveTokenFromWatchlist,
  onRefreshTokenData,
  onTokenSelect
}) => {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const [selectedWatchlist, setSelectedWatchlist] = useState<number | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [editingWatchlist, setEditingWatchlist] = useState<{ id: number; name: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatAge = (hours: number): string => {
    if (hours < 1) return '<1h';
    if (hours < 24) return `${Math.floor(hours)}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getPriceChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    
    setLoading(true);
    try {
      await onCreateWatchlist(newWatchlistName.trim());
      setNewWatchlistName('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWatchlist = async () => {
    if (!editingWatchlist || !editingWatchlist.name.trim()) return;
    
    setLoading(true);
    try {
      await onUpdateWatchlist(editingWatchlist.id, editingWatchlist.name.trim());
      setEditingWatchlist(null);
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWatchlist = async (id: number) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;
    
    setLoading(true);
    try {
      await onDeleteWatchlist(id);
      if (selectedWatchlist === id) {
        setSelectedWatchlist(null);
      }
    } catch (error) {
      console.error('Failed to delete watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenClick = (tokenSymbol: string) => {
    const newExpanded = new Set(expandedTokens);
    if (newExpanded.has(tokenSymbol)) {
      newExpanded.delete(tokenSymbol);
    } else {
      newExpanded.add(tokenSymbol);
    }
    setExpandedTokens(newExpanded);
  };

  const currentTokens = selectedWatchlist ? watchlistTokens[selectedWatchlist] || [] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Watchlists</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshTokenData}
            disabled={loading}
            className="transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="transition-all duration-200 hover:scale-105">
                <Plus className="h-4 w-4 mr-1" />
                New Watchlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Watchlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Watchlist name..."
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateWatchlist()}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWatchlist} disabled={loading || !newWatchlistName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Watchlists Sidebar */}
        <div className="space-y-2">
          <h3 className="font-semibold">Your Watchlists</h3>
          <div className="space-y-2">
            {watchlists.map((watchlist) => (
              <div
                key={watchlist.id}
                onClick={() => {
                  setSelectedWatchlist(watchlist.id);
                  
                  // Open detailed view for the watchlist
                  const tokens = watchlistTokens[watchlist.id] || [];
                  dispatch(openWatchlistDetail({
                    watchlist,
                    tokens,
                    tokenData,
                    onClose: () => {},
                    onRemoveTokens: (symbols) => {
                      symbols.forEach(symbol => {
                        onRemoveTokenFromWatchlist(watchlist.id, symbol);
                      });
                    },
                    onAddToken: (token) => {
                      onAddTokenToWatchlist(watchlist.id, token);
                    },
                    onRefreshData: onRefreshTokenData,
                    onTokenSelect: onTokenSelect || undefined
                  }));
                }}
                onMouseEnter={() => setHoveredToken(`watchlist-${watchlist.id}`)}
                onMouseLeave={() => setHoveredToken(null)}
              >
                <Card
                  className={`
                    cursor-pointer transition-all duration-300 ease-out
                    ${selectedWatchlist === watchlist.id 
                      ? 'ring-2 ring-blue-500/50 bg-white/10 scale-[1.02]' 
                      : 'hover:bg-white/8 hover:scale-[1.01]'
                    }
                    ${hoveredToken === `watchlist-${watchlist.id}` ? 'shadow-lg shadow-white/5' : ''}
                  `}
                >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{watchlist.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {watchlist.tokenCount || 0} tokens
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWatchlist({ id: watchlist.id, name: watchlist.name });
                          setShowEditDialog(true);
                        }}
                        className="transition-all duration-200 hover:scale-110"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWatchlist(watchlist.id);
                        }}
                        className="transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
                </div>
            ))}
          </div>
        </div>

        {/* Token Cards */}
        <div className="lg:col-span-2">
          {selectedWatchlist ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {watchlists.find(w => w.id === selectedWatchlist)?.name} Tokens
                </h3>
                <Badge variant="secondary">
                  {currentTokens.length} tokens
                </Badge>
              </div>

              {currentTokens.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTokens.map((token) => {
                    const tokenDataItem = tokenData[token.tokenSymbol];
                    const isExpanded = expandedTokens.has(token.tokenSymbol);
                    const isHovered = hoveredToken === token.tokenSymbol;

                    return (
                      <div
                        key={token.id}
                        onClick={() => handleTokenClick(token.tokenSymbol)}
                        onMouseEnter={() => setHoveredToken(token.tokenSymbol)}
                        onMouseLeave={() => setHoveredToken(null)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleTokenClick(token.tokenSymbol);
                          }
                        }}
                      >
                        <Card
                          className={`
                            cursor-pointer transition-all duration-300 ease-out
                            ${isHovered ? 'border-white/30 bg-white/8 scale-[1.02] shadow-lg shadow-white/5' : ''}
                            ${isExpanded ? 'ring-2 ring-blue-500/50 bg-white/10' : ''}
                          `}
                        >
                        <CardContent className="p-4">
                          {/* Token Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                <span className="text-white font-bold text-sm">
                                  {token.tokenSymbol.slice(0, 3).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-white">{token.tokenSymbol}</div>
                                <div className="text-sm text-gray-400">{token.tokenName}</div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {onTokenSelect && tokenDataItem && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTokenSelect(tokenDataItem);
                                  }}
                                  className="transition-all duration-200 hover:scale-105"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveTokenFromWatchlist(selectedWatchlist, token.tokenSymbol);
                                }}
                                className="transition-all duration-200 hover:scale-105"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Basic Token Info */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
                              <p className="text-xs text-gray-400 mb-1">Price</p>
                              <p className="text-sm font-bold text-white">
                                {tokenDataItem ? formatNumber(tokenDataItem.price) : 'N/A'}
                              </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
                              <p className="text-xs text-gray-400 mb-1">24h Change</p>
                              <div className="flex items-center space-x-1">
                                {tokenDataItem && getPriceChangeIcon(tokenDataItem.priceChange24h)}
                                <span className={`text-sm font-bold ${tokenDataItem ? getPriceChangeColor(tokenDataItem.priceChange24h) : 'text-gray-400'}`}>
                                  {tokenDataItem ? formatPercentage(tokenDataItem.priceChange24h) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Market Metrics */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-3 transition-all duration-200 hover:bg-blue-500/15">
                              <p className="text-xs text-gray-400 mb-1">Volume</p>
                              <p className="text-sm font-bold text-blue-400">
                                {tokenDataItem ? formatNumber(tokenDataItem.volume24h) : 'N/A'}
                              </p>
                            </div>
                            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3 transition-all duration-200 hover:bg-green-500/15">
                              <p className="text-xs text-gray-400 mb-1">Market Cap</p>
                              <p className="text-sm font-bold text-green-400">
                                {tokenDataItem ? formatNumber(tokenDataItem.marketCap) : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Expandable Content */}
                          {isExpanded && tokenDataItem && (
                            <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
                              <div className="space-y-3">
                                {/* Additional Metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Clock className="h-3 w-3 text-gray-400" />
                                      <p className="text-xs text-gray-400">Age</p>
                                    </div>
                                    <p className="text-sm font-medium text-white">
                                      {formatAge(tokenDataItem.age)}
                                    </p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Users className="h-3 w-3 text-gray-400" />
                                      <p className="text-xs text-gray-400">Holders</p>
                                    </div>
                                    <p className="text-sm font-medium text-white">
                                      {tokenDataItem.holders.toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {/* Price Changes */}
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1">1h</p>
                                    <p className={`text-sm font-medium ${getPriceChangeColor(tokenDataItem.priceChange1h)}`}>
                                      {formatPercentage(tokenDataItem.priceChange1h)}
                                    </p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1">6h</p>
                                    <p className={`text-sm font-medium ${getPriceChangeColor(tokenDataItem.priceChange6h)}`}>
                                      {formatPercentage(tokenDataItem.priceChange6h)}
                                    </p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1">24h</p>
                                    <p className={`text-sm font-medium ${getPriceChangeColor(tokenDataItem.priceChange24h)}`}>
                                      {formatPercentage(tokenDataItem.priceChange24h)}
                                    </p>
                                  </div>
                                </div>

                                {/* Chain Info */}
                                <div className="bg-white/5 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Activity className="h-3 w-3 text-gray-400" />
                                    <p className="text-xs text-gray-400">Chain & DEX</p>
                                  </div>
                                  <p className="text-sm font-medium text-white">
                                    {token.chainId.toUpperCase()} • {tokenDataItem.dexId.toUpperCase()}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1 font-mono">
                                    {token.pairAddress.slice(0, 8)}...{token.pairAddress.slice(-6)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Click Indicator */}
                          {!isExpanded && (
                            <div className={`
                              absolute top-4 right-4 text-xs text-gray-400 opacity-0 transition-opacity duration-200
                              ${isHovered ? 'opacity-100' : ''}
                            `}>
                              Click to expand
                            </div>
                          )}
                        </CardContent>
                      </Card>
                        </div>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tokens in this watchlist yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Search for tokens and add them to this watchlist.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a watchlist to view tokens.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create a new watchlist to start tracking your favorite tokens.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Watchlist Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Watchlist name..."
              value={editingWatchlist?.name || ''}
              onChange={(e) => setEditingWatchlist(prev => prev ? { ...prev, name: e.target.value } : null)}
              onKeyPress={(e) => e.key === 'Enter' && handleUpdateWatchlist()}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateWatchlist} disabled={loading || !editingWatchlist?.name.trim()}>
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 