/**
 * Watchlist Service
 * Handles all frontend API calls to the backend watchlist functionality
 */

export interface Watchlist {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  tokenCount?: number;
}

export interface WatchlistToken {
  id: number;
  watchlistId: number;
  tokenSymbol: string;
  tokenName: string;
  pairAddress: string;
  chainId: string;
  addedAt: number;
}

export interface TokenWatchlistStatus {
  tokenSymbol: string;
  isWatchlisted: boolean;
  watchlists: Watchlist[];
}

export interface WatchlistService {
  getAllWatchlists(): Promise<Watchlist[]>;
  createWatchlist(name: string): Promise<Watchlist>;
  getWatchlistById(id: number): Promise<Watchlist & { tokens: WatchlistToken[] } | null>;
  updateWatchlist(id: number, name: string): Promise<Watchlist>;
  deleteWatchlist(id: number): Promise<boolean>;
  addTokenToWatchlist(watchlistId: number, tokenSymbol: string, tokenName: string, pairAddress: string, chainId?: string): Promise<WatchlistToken>;
  removeTokenFromWatchlist(watchlistId: number, tokenSymbol: string): Promise<boolean>;
  getTokenWatchlistStatus(tokenSymbol: string): Promise<TokenWatchlistStatus>;
}

class WatchlistServiceImpl implements WatchlistService {
  private baseUrl = '/api/watchlists';

  async getAllWatchlists(): Promise<Watchlist[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch watchlists: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Watchlist service error:', error);
      throw new Error(`Failed to fetch watchlists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createWatchlist(name: string): Promise<Watchlist> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create watchlist: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Watchlist service error:', error);
      throw new Error(`Failed to create watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWatchlistById(id: number): Promise<Watchlist & { tokens: WatchlistToken[] } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch watchlist: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Watchlist service error:', error);
      throw new Error(`Failed to fetch watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateWatchlist(id: number, name: string): Promise<Watchlist> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update watchlist: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Watchlist service error:', error);
      throw new Error(`Failed to update watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteWatchlist(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete watchlist: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Watchlist service error:', error);
      throw new Error(`Failed to delete watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addTokenToWatchlist(
    watchlistId: number, 
    tokenSymbol: string, 
    tokenName: string, 
    pairAddress: string, 
    chainId: string = 'solana'
  ): Promise<WatchlistToken> {
    try {
      const response = await fetch(`${this.baseUrl}/${watchlistId}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenSymbol,
          tokenName,
          pairAddress,
          chainId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add token to watchlist: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Watchlist service error:', error);
      throw new Error(`Failed to add token to watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeTokenFromWatchlist(watchlistId: number, tokenSymbol: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${watchlistId}/tokens/${encodeURIComponent(tokenSymbol)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to remove token from watchlist: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Watchlist service error:', error);
      throw new Error(`Failed to remove token from watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTokenWatchlistStatus(tokenSymbol: string): Promise<TokenWatchlistStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens/${encodeURIComponent(tokenSymbol)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get token watchlist status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Watchlist service error:', error);
      throw new Error(`Failed to get token watchlist status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const watchlistService = new WatchlistServiceImpl(); 