/**
 * Token Price Service
 * 
 * Handles real-time price updates and market data for tokens
 */

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
  logoURI?: string;
}

export interface TokenMetadata {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

class TokenPriceService {
  private cache: Map<string, TokenPrice> = new Map();
  private metadataCache: Map<string, TokenMetadata> = new Map();
  private subscribers: Set<(prices: TokenPrice[]) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPriceUpdates();
  }

  /**
   * Get price for a single token
   */
  async getTokenPrice(tokenId: string): Promise<TokenPrice | null> {
    // Check cache first
    const cached = this.cache.get(tokenId);
    if (cached && Date.now() - cached.lastUpdated < 30000) {
      return cached;
    }

    try {
      // Try Jupiter Price API
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${tokenId}`);
      if (response.ok) {
        const data = await response.json();
        const priceData = data.data[tokenId];
        
        if (priceData) {
          // Get metadata for logoURI
          const metadata = await this.getTokenMetadata(tokenId);
          
          const tokenPrice: TokenPrice = {
            id: tokenId,
            symbol: priceData.symbol || 'Unknown',
            name: priceData.name || 'Unknown Token',
            price: priceData.price,
            priceChange24h: priceData.priceChange24h || 0,
            volume24h: priceData.volume24h || 0,
            marketCap: priceData.marketCap || 0,
            lastUpdated: Date.now(),
            logoURI: metadata?.logoURI,
          };

          this.cache.set(tokenId, tokenPrice);
          return tokenPrice;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch price for token ${tokenId}:`, error);
    }

    return null;
  }

  /**
   * Get prices for multiple tokens
   */
  async getTokenPrices(tokenIds: string[]): Promise<TokenPrice[]> {
    const prices: TokenPrice[] = [];
    
    // Filter out tokens we have recent cache for
    const uncachedIds = tokenIds.filter(id => {
      const cached = this.cache.get(id);
      return !cached || Date.now() - cached.lastUpdated > 30000;
    });

    if (uncachedIds.length > 0) {
      try {
        // Batch fetch from Jupiter
        const response = await fetch(`https://price.jup.ag/v4/price?ids=${uncachedIds.join(',')}`);
        if (response.ok) {
          const data = await response.json();
          
          for (const tokenId of uncachedIds) {
            const priceData = data.data[tokenId];
            if (priceData) {
              // Get metadata for logoURI
              const metadata = await this.getTokenMetadata(tokenId);
              
              const tokenPrice: TokenPrice = {
                id: tokenId,
                symbol: priceData.symbol || 'Unknown',
                name: priceData.name || 'Unknown Token',
                price: priceData.price,
                priceChange24h: priceData.priceChange24h || 0,
                volume24h: priceData.volume24h || 0,
                marketCap: priceData.marketCap || 0,
                lastUpdated: Date.now(),
                logoURI: metadata?.logoURI,
              };

              this.cache.set(tokenId, tokenPrice);
              prices.push(tokenPrice);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch token prices:', error);
      }
    }

    // Add cached prices
    for (const tokenId of tokenIds) {
      const cached = this.cache.get(tokenId);
      if (cached) {
        prices.push(cached);
      }
    }

    return prices;
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenId: string): Promise<TokenMetadata | null> {
    // Check cache first
    const cached = this.metadataCache.get(tokenId);
    if (cached) {
      return cached;
    }

    try {
      // Try to get metadata from Jupiter
      const response = await fetch(`https://token.jup.ag/all`);
      if (response.ok) {
        const tokens = await response.json();
        const token = tokens.find((t: any) => t.address === tokenId);
        
        if (token) {
          const metadata: TokenMetadata = {
            id: tokenId,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            logoURI: token.logoURI,
            tags: token.tags,
          };

          this.metadataCache.set(tokenId, metadata);
          return metadata;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata for token ${tokenId}:`, error);
    }

    return null;
  }

  /**
   * Subscribe to price updates
   */
  subscribe(callback: (prices: TokenPrice[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Start automatic price updates
   */
  private startPriceUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      const cachedTokens = Array.from(this.cache.keys());
      if (cachedTokens.length > 0) {
        const updatedPrices = await this.getTokenPrices(cachedTokens);
        this.notifySubscribers(updatedPrices);
      }
    }, 30000); // Update every 30 seconds
  }

  /**
   * Notify subscribers of price updates
   */
  private notifySubscribers(prices: TokenPrice[]) {
    this.subscribers.forEach(callback => {
      try {
        callback(prices);
      } catch (error) {
        console.error('Error in price update subscriber:', error);
      }
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.metadataCache.clear();
  }

  /**
   * Stop the service
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.subscribers.clear();
    this.clearCache();
  }
}

// Export singleton instance
export const tokenPriceService = new TokenPriceService(); 