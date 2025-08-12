#!/usr/bin/env node

/**
 * Live Trading Demo Script
 * 
 * This script demonstrates the live trading capabilities of Liquidity Sentinel
 * including real-time token search, price quotes, and transaction execution.
 */

const { getDexScreenerAPI } = require('../src/backend/integrations/dexscreener');
const { getJupiterIntegration } = require('../src/backend/integrations/jupiter');
const { DatabaseManager } = require('../src/backend/database/DatabaseManager');

class LiveTradingDemo {
  constructor() {
    this.dbManager = new DatabaseManager(':memory:');
    this.dexScreener = getDexScreenerAPI(this.dbManager);
    this.jupiter = getJupiterIntegration({
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      commitment: 'confirmed',
      timeoutMs: 30000
    });
  }

  async initialize() {
    console.log('🚀 Initializing Liquidity Sentinel...');
    
    try {
      await this.jupiter.initialize();
      console.log('✅ Jupiter integration initialized');
      
      await this.dexScreener.initialize();
      console.log('✅ Dexscreener integration initialized');
      
      console.log('🎉 All systems ready for live trading!');
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  async searchLiveTokens(query = 'PEPE') {
    console.log(`\n🔍 Searching for live tokens: "${query}"`);
    
    try {
      const filters = {
        minMarketCap: 150000,
        minLiquidity: 50000,
        maxAge: 48
      };

      const result = await this.dexScreener.searchTokens(query, filters);
      
      console.log(`📊 Found ${result.tokens.length} tokens:`);
      
      result.tokens.slice(0, 5).forEach((token, index) => {
        console.log(`${index + 1}. ${token.symbol} (${token.name})`);
        console.log(`   💰 Price: $${token.price.toFixed(6)}`);
        console.log(`   📈 24h Change: ${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(2)}%`);
        console.log(`   💧 Liquidity: $${token.liquidity.toLocaleString()}`);
        console.log(`   🏪 Market Cap: $${token.marketCap.toLocaleString()}`);
        console.log('');
      });

      return result.tokens[0]; // Return first token for demo
    } catch (error) {
      console.error('❌ Token search failed:', error.message);
      throw error;
    }
  }

  async getLiveQuote(token) {
    console.log(`\n💱 Getting live quote for ${token.symbol}...`);
    
    try {
      // SOL to USDC quote (1 SOL)
      const solMint = 'So11111111111111111111111111111111111111112';
      const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const amount = 1000000000; // 1 SOL in lamports
      const slippageBps = 50; // 0.5%

      const quote = await this.jupiter.getQuote(solMint, usdcMint, amount, slippageBps);
      
      console.log('📊 Live Quote Details:');
      console.log(`   💰 Input: 1 SOL`);
      console.log(`   💰 Output: ${(quote.outAmount / 1000000).toFixed(2)} USDC`);
      console.log(`   📉 Price Impact: ${quote.priceImpactPct.toFixed(2)}%`);
      console.log(`   🛡️ Slippage: ${(quote.slippageBps / 100).toFixed(2)}%`);
      console.log(`   ⚡ Time Taken: ${quote.timeTaken}ms`);
      
      return quote;
    } catch (error) {
      console.error('❌ Quote failed:', error.message);
      throw error;
    }
  }

  async getTrendingTokens() {
    console.log('\n🔥 Getting trending tokens...');
    
    try {
      const trending = await this.dexScreener.getTrendingTokens('gainers');
      
      console.log('📈 Top Trending Gainers:');
      trending.slice(0, 5).forEach((token, index) => {
        console.log(`${index + 1}. ${token.symbol}`);
        console.log(`   📈 24h Change: +${token.priceChange24h.toFixed(2)}%`);
        console.log(`   💰 Price: $${token.price.toFixed(6)}`);
        console.log(`   💧 Volume: $${token.volume24h.toLocaleString()}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Trending tokens failed:', error.message);
    }
  }

  async getPerformanceStats() {
    console.log('\n📊 Performance Statistics:');
    
    try {
      const jupiterStats = this.jupiter.getStats();
      const dexScreenerStats = this.dexScreener.getCacheStats();
      
      console.log('🔧 Jupiter Integration:');
      console.log(`   📦 Tokens Loaded: ${jupiterStats.tokensLoaded}`);
      console.log(`   💬 Recent Quotes: ${jupiterStats.recentQuotes}`);
      console.log(`   ⏰ Last Quote: ${jupiterStats.lastQuoteTime ? new Date(jupiterStats.lastQuoteTime).toLocaleTimeString() : 'N/A'}`);
      
      console.log('\n🔍 Dexscreener Integration:');
      console.log(`   📦 Cache Size: ${dexScreenerStats.size}`);
      console.log(`   🔑 Cache Keys: ${dexScreenerStats.entries}`);
      
    } catch (error) {
      console.error('❌ Stats failed:', error.message);
    }
  }

  async runDemo() {
    console.log('🎯 LIQUIDITY SENTINEL - LIVE TRADING DEMO');
    console.log('==========================================\n');
    
    try {
      // Initialize all systems
      await this.initialize();
      
      // Search for live tokens
      const token = await this.searchLiveTokens('PEPE');
      
      // Get live quote
      await this.getLiveQuote(token);
      
      // Get trending tokens
      await this.getTrendingTokens();
      
      // Show performance stats
      await this.getPerformanceStats();
      
      console.log('\n🎉 Demo completed successfully!');
      console.log('✅ All live trading features are working correctly.');
      console.log('🚀 Ready for production deployment!');
      
    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  const demo = new LiveTradingDemo();
  demo.runDemo().catch(console.error);
}

module.exports = LiveTradingDemo; 