/**
 * Watchlist Selector Component
 * Allows users to select a watchlist for adding tokens
 */

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setWatchlists, setLoading, setError } from '../store/slices/watchlistSlice';
import { watchlistService } from '../services/watchlistService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Star, Plus, Loader2 } from 'lucide-react';
import { TokenData } from '@/backend/integrations/dexscreener';

interface WatchlistSelectorProps {
  token: TokenData;
  onAddToWatchlist?: (token: TokenData, watchlistId: number) => void;
  trigger?: React.ReactNode;
}

export const WatchlistSelector: React.FC<WatchlistSelectorProps> = ({
  token,
  onAddToWatchlist,
  trigger
}) => {
  const dispatch = useAppDispatch();
  const { watchlists, loading, error } = useAppSelector((state) => state.watchlist);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingWatchlist, setCreatingWatchlist] = useState(false);

  useEffect(() => {
    if (isOpen && watchlists.length === 0) {
      loadWatchlists();
    }
  }, [isOpen, watchlists.length]);

  const loadWatchlists = async () => {
    dispatch(setLoading(true));
    try {
      const watchlists = await watchlistService.getAllWatchlists();
      dispatch(setWatchlists(watchlists));
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to load watchlists'));
    }
  };

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return;

    setCreatingWatchlist(true);
    try {
      const newWatchlist = await watchlistService.createWatchlist(newWatchlistName.trim());
      dispatch(setWatchlists([newWatchlist, ...watchlists]));
      setSelectedWatchlistId(newWatchlist.id);
      setNewWatchlistName('');
      setShowCreateForm(false);
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to create watchlist'));
    } finally {
      setCreatingWatchlist(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!selectedWatchlistId) return;

    try {
      await watchlistService.addTokenToWatchlist(
        selectedWatchlistId,
        token.symbol,
        token.name,
        token.pairAddress,
        token.chainId
      );

      if (onAddToWatchlist) {
        onAddToWatchlist(token, selectedWatchlistId);
      }

      setIsOpen(false);
      setSelectedWatchlistId(null);
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to add token to watchlist'));
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <Star className="h-4 w-4" />
      Add to Watchlist
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Add {token.symbol} to Watchlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading watchlists...</span>
            </div>
          ) : (
            <>
              {!showCreateForm ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Watchlist</label>
                    <Select
                      value={selectedWatchlistId?.toString() || ''}
                      onValueChange={(value) => setSelectedWatchlistId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a watchlist" />
                      </SelectTrigger>
                      <SelectContent>
                        {watchlists.map((watchlist) => (
                          <SelectItem key={watchlist.id} value={watchlist.id.toString()}>
                            {watchlist.name} ({watchlist.tokenCount || 0} tokens)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                    <Button
                      onClick={handleAddToWatchlist}
                      disabled={!selectedWatchlistId}
                      className="flex-1"
                    >
                      Add to Watchlist
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Watchlist Name</label>
                    <Input
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      placeholder="Enter watchlist name..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateWatchlist();
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewWatchlistName('');
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateWatchlist}
                      disabled={!newWatchlistName.trim() || creatingWatchlist}
                      className="flex-1"
                    >
                      {creatingWatchlist ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Watchlist'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 