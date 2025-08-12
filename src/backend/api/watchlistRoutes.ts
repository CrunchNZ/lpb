/**
 * Watchlist API Routes
 * Handles all watchlist-related API endpoints
 */

import express from 'express';
import { DatabaseManager } from '../database/DatabaseManager';

const router = express.Router();

// Initialize database manager
let databaseManager: DatabaseManager;

// Middleware to ensure database is initialized
const ensureDatabase = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!databaseManager) {
    return res.status(500).json({ error: 'Database not initialized' });
  }
  next();
};

// Initialize database manager
export function initializeWatchlistRoutes(dbManager: DatabaseManager) {
  databaseManager = dbManager;
}

/**
 * GET /api/watchlists
 * Get all watchlists
 */
router.get('/', ensureDatabase, async (req, res) => {
  try {
    const watchlists = await databaseManager.getAllWatchlistsWithTokenCounts();
    res.json(watchlists);
  } catch (error) {
    console.error('Error fetching watchlists:', error);
    res.status(500).json({ error: 'Failed to fetch watchlists' });
  }
});

/**
 * POST /api/watchlists
 * Create a new watchlist
 */
router.post('/', ensureDatabase, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Watchlist name is required' });
    }

    const watchlist = await databaseManager.createWatchlist(name.trim());
    res.status(201).json(watchlist);
  } catch (error) {
    console.error('Error creating watchlist:', error);
    res.status(500).json({ error: 'Failed to create watchlist' });
  }
});

/**
 * GET /api/watchlists/:id
 * Get watchlist by ID with tokens
 */
router.get('/:id', ensureDatabase, async (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: 'Invalid watchlist ID' });
    }

    const watchlist = await databaseManager.getWatchlistById(watchlistId);
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const tokens = await databaseManager.getWatchlistTokens(watchlistId);
    res.json({ ...watchlist, tokens });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

/**
 * PUT /api/watchlists/:id
 * Update watchlist name
 */
router.put('/:id', ensureDatabase, async (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    const { name } = req.body;
    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: 'Invalid watchlist ID' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Watchlist name is required' });
    }

    const success = await databaseManager.updateWatchlist(watchlistId, name.trim());
    if (!success) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const updatedWatchlist = await databaseManager.getWatchlistById(watchlistId);
    res.json(updatedWatchlist);
  } catch (error) {
    console.error('Error updating watchlist:', error);
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

/**
 * DELETE /api/watchlists/:id
 * Delete watchlist
 */
router.delete('/:id', ensureDatabase, async (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    
    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: 'Invalid watchlist ID' });
    }

    const success = await databaseManager.deleteWatchlist(watchlistId);
    if (!success) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    res.json({ message: 'Watchlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    res.status(500).json({ error: 'Failed to delete watchlist' });
  }
});

/**
 * POST /api/watchlists/:id/tokens
 * Add token to watchlist
 */
router.post('/:id/tokens', ensureDatabase, async (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    const { tokenSymbol, tokenName, pairAddress, chainId = 'solana' } = req.body;
    
    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: 'Invalid watchlist ID' });
    }

    if (!tokenSymbol || !tokenName || !pairAddress) {
      return res.status(400).json({
        error: 'tokenSymbol, tokenName, and pairAddress are required',
      });
    }

    // Check if watchlist exists
    const watchlist = await databaseManager.getWatchlistById(watchlistId);
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    // Check if token is already in watchlist
    const existingTokens = await databaseManager.getWatchlistTokens(watchlistId);
    const isAlreadyAdded = existingTokens.some(
      (token) => token.tokenSymbol.toLowerCase() === tokenSymbol.toLowerCase(),
    );

    if (isAlreadyAdded) {
      return res.status(409).json({ error: 'Token is already in this watchlist' });
    }

    const watchlistToken = await databaseManager.addTokenToWatchlist(
      watchlistId,
      tokenSymbol,
      tokenName,
      pairAddress,
      chainId
    );

    res.status(201).json(watchlistToken);
  } catch (error) {
    console.error('Error adding token to watchlist:', error);
    res.status(500).json({ error: 'Failed to add token to watchlist' });
  }
});

/**
 * DELETE /api/watchlists/:id/tokens/:tokenSymbol
 * Remove token from watchlist
 */
router.delete('/:id/tokens/:tokenSymbol', ensureDatabase, async (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    const { tokenSymbol } = req.params;
    
    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: 'Invalid watchlist ID' });
    }

    if (!tokenSymbol) {
      return res.status(400).json({ error: 'Token symbol is required' });
    }

    const success = await databaseManager.removeTokenFromWatchlist(watchlistId, tokenSymbol);
    if (!success) {
      return res.status(404).json({ error: 'Token not found in watchlist' });
    }

    res.json({ message: 'Token removed from watchlist successfully' });
  } catch (error) {
    console.error('Error removing token from watchlist:', error);
    res.status(500).json({ error: 'Failed to remove token from watchlist' });
  }
});

/**
 * GET /api/watchlists/tokens/:tokenSymbol
 * Check if token is watchlisted and get watchlists containing it
 */
router.get('/tokens/:tokenSymbol', ensureDatabase, async (req, res) => {
  try {
    const { tokenSymbol } = req.params;
    
    if (!tokenSymbol) {
      return res.status(400).json({ error: 'Token symbol is required' });
    }

    const isWatchlisted = await databaseManager.isTokenWatchlisted(tokenSymbol);
    const watchlists = await databaseManager.getWatchlistsForToken(tokenSymbol);

    res.json({ tokenSymbol, isWatchlisted, watchlists });
  } catch (error) {
    console.error('Error checking token watchlist status:', error);
    res.status(500).json({ error: 'Failed to check token watchlist status' });
  }
});

export default router; 
