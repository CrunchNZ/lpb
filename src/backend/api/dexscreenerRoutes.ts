/**
 * DexScreener API Routes
 * Express routes for handling DexScreener API requests
 */

import express from 'express';
import { getDexScreenerAPI } from '../integrations/dexscreener';
import { DatabaseManager } from '../database/DatabaseManager';

const router = express.Router();

// Initialize database manager
const dbManager = new DatabaseManager();

// Middleware to handle errors
const errorHandler = (err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('DexScreener API Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
};

// Search tokens endpoint
router.get('/search', async (req, res, next) => {
  try {
    const { query, chainId, minVolume, minMarketCap, trending } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter is required',
      });
    }

    const filters = {
      chainId: chainId as string,
      minVolume: minVolume ? parseInt(minVolume as string) : undefined,
      minMarketCap: minMarketCap ? parseInt(minMarketCap as string) : undefined,
      trending: trending as string,
    };

    const dexscreener = getDexScreenerAPI(dbManager);
    const result = await dexscreener.searchTokens(query, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get trending tokens endpoint
router.get('/trending', async (req, res, next) => {
  try {
    const { chainId, minVolume, minMarketCap } = req.query;
    const filters = {
      chainId: chainId as string,
      minVolume: minVolume ? parseInt(minVolume as string) : undefined,
      minMarketCap: minMarketCap ? parseInt(minMarketCap as string) : undefined,
    };

    const dexscreener = getDexScreenerAPI(dbManager);
    const tokens = await dexscreener.getTrendingTokens(filters);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

// Get token details endpoint
router.get('/token/:chainId/:pairAddress', async (req, res, next) => {
  try {
    const { chainId, pairAddress } = req.params;
    if (!pairAddress) {
      return res.status(400).json({
        error: 'Pair address is required',
      });
    }

    const dexscreener = getDexScreenerAPI(dbManager);
    const token = await dexscreener.getTokenDetails(pairAddress, chainId);
    if (!token) {
      return res.status(404).json({
        error: 'Token not found',
      });
    }

    res.json(token);
  } catch (error) {
    next(error);
  }
});

// Get token data by symbol endpoint
router.get('/token-data/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({
        error: 'Symbol is required',
      });
    }

    const dexscreener = getDexScreenerAPI(dbManager);
    const token = await dexscreener.getTokenData(symbol);
    if (!token) {
      return res.status(404).json({
        error: 'Token not found',
      });
    }

    res.json(token);
  } catch (error) {
    next(error);
  }
});

// Get token pools endpoint
router.get('/token-pools/:chainId/:tokenAddress', async (req, res, next) => {
  try {
    const { chainId, tokenAddress } = req.params;
    if (!tokenAddress) {
      return res.status(400).json({
        error: 'Token address is required',
      });
    }

    const dexscreener = getDexScreenerAPI(dbManager);
    const pools = await dexscreener.getTokenPools(tokenAddress, chainId);
    res.json(pools);
  } catch (error) {
    next(error);
  }
});

// Cache management endpoints
router.get('/cache/stats', async (req, res, next) => {
  try {
    const dexscreener = getDexScreenerAPI(dbManager);
    const stats = dexscreener.getCacheStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.delete('/cache', async (req, res, next) => {
  try {
    const dexscreener = getDexScreenerAPI(dbManager);
    dexscreener.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    next(error);
  }
});

// Apply error handler
router.use(errorHandler);

export default router; 
