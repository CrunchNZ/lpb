/**
 * Sentiment Analysis Utility
 *
 * Analyzes sentiment for tokens using Twitter API and VADER
 *
 * @reference PRD.md#4.1 - Sentiment Analysis
 * @reference DTS.md#3.3 - SentimentAnalyzer
 */

import { TwitterApi } from 'twitter-api-v2';
import { SentimentIntensityAnalyzer } from 'vader-sentiment';

export interface SentimentResult {
  compound: number; // -1 to 1
  positive: number; // 0 to 1
  negative: number; // 0 to 1
  neutral: number; // 0 to 1
  tweetCount: number;
  confidence: number; // 0 to 1
}

export interface SentimentAnalysis {
  tokenSymbol: string;
  sentiment: number; // -1 to 1
  confidence: number; // 0 to 1
  tweetCount: number;
  analysis: SentimentResult;
  timestamp: Date;
}

export class SentimentAnalyzer {
  private twitterClient: TwitterApi;
  private vaderAnalyzer: SentimentIntensityAnalyzer;
  private cache: Map<string, { result: SentimentAnalysis; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(twitterBearerToken: string) {
    try {
      this.twitterClient = new TwitterApi(twitterBearerToken);
      this.vaderAnalyzer = new SentimentIntensityAnalyzer();

      console.log('SentimentAnalyzer: Initialized successfully');
    } catch (error) {
      console.error('SentimentAnalyzer: Error initializing', error);
      throw new Error('Failed to initialize sentiment analyzer');
    }
  }

  /**
   * Gets sentiment for a specific token
   * @param tokenSymbol - Token symbol to analyze
   * @returns Promise<SentimentAnalysis> - Sentiment analysis result
   */
  async getTokenSentiment(tokenSymbol: string): Promise<SentimentAnalysis> {
    try {
      // Check cache first
      const cached = this.getCachedResult(tokenSymbol);
      if (cached) {
        console.log(`SentimentAnalyzer: Using cached result for ${tokenSymbol}`);
        return cached;
      }

      console.log(`SentimentAnalyzer: Analyzing sentiment for ${tokenSymbol}`);

      // Search for tweets about the token
      const searchQuery = `${tokenSymbol} crypto`;
      const tweets = await this.twitterClient.v2.search(searchQuery, {
        max_results: 100,
        'tweet.fields': ['created_at', 'text', 'public_metrics'],
      });

      if (!tweets.data || !Array.isArray(tweets.data) || tweets.data.length === 0) {
        console.log(`SentimentAnalyzer: No tweets found for ${tokenSymbol}`);
        return this.createNeutralResult(tokenSymbol);
      }

      // Analyze sentiment for each tweet
      const sentimentResults: SentimentResult[] = [];
      let totalCompound = 0;
      let totalPositive = 0;
      let totalNegative = 0;
      let totalNeutral = 0;

      for (const tweet of tweets.data) {
        try {
          const analysis = this.vaderAnalyzer.polarity_scores(tweet.text);
          sentimentResults.push({
            compound: analysis.compound,
            positive: analysis.pos,
            negative: analysis.neg,
            neutral: analysis.neu,
            tweetCount: 1,
            confidence: this.calculateTweetConfidence(tweet),
          });

          totalCompound += analysis.compound;
          totalPositive += analysis.pos;
          totalNegative += analysis.neg;
          totalNeutral += analysis.neu;
        } catch (error) {
          console.warn(`SentimentAnalyzer: Error analyzing tweet for ${tokenSymbol}`, error);
        }
      }

      if (sentimentResults.length === 0) {
        return this.createNeutralResult(tokenSymbol);
      }

      // Calculate average sentiment
      const avgCompound = totalCompound / sentimentResults.length;
      const avgPositive = totalPositive / sentimentResults.length;
      const avgNegative = totalNegative / sentimentResults.length;
      const avgNeutral = totalNeutral / sentimentResults.length;

      // Calculate confidence based on tweet count and sentiment consistency
      const confidence = this.calculateConfidence(sentimentResults);

      const result: SentimentAnalysis = {
        tokenSymbol,
        sentiment: Math.max(-1, Math.min(1, avgCompound)), // Clamp to [-1, 1]
        confidence,
        tweetCount: sentimentResults.length,
        analysis: {
          compound: avgCompound,
          positive: avgPositive,
          negative: avgNegative,
          neutral: avgNeutral,
          tweetCount: sentimentResults.length,
          confidence,
        },
        timestamp: new Date(),
      };

      // Cache the result
      this.cacheResult(tokenSymbol, result);

      console.log(`SentimentAnalyzer: Analysis complete for ${tokenSymbol}`, {
        sentiment: result.sentiment,
        confidence: result.confidence,
        tweetCount: result.tweetCount,
      });

      return result;
    } catch (error) {
      console.error(`SentimentAnalyzer: Error analyzing sentiment for ${tokenSymbol}`, error);
      return this.createNeutralResult(tokenSymbol);
    }
  }

  /**
   * Gets general market sentiment
   * @returns Promise<SentimentAnalysis> - Market sentiment analysis
   */
  async getMarketSentiment(): Promise<SentimentAnalysis> {
    try {
      const searchQuery = 'solana crypto';
      const tweets = await this.twitterClient.v2.search(searchQuery, {
        max_results: 100,
        'tweet.fields': ['created_at', 'text', 'public_metrics'],
      });

      if (!tweets.data || !Array.isArray(tweets.data) || tweets.data.length === 0) {
        return this.createNeutralResult('MARKET');
      }

      // Analyze sentiment for each tweet
      const sentimentResults: SentimentResult[] = [];
      let totalCompound = 0;
      let totalPositive = 0;
      let totalNegative = 0;
      let totalNeutral = 0;

      for (const tweet of tweets.data) {
        try {
          const analysis = this.vaderAnalyzer.polarity_scores(tweet.text);
          sentimentResults.push({
            compound: analysis.compound,
            positive: analysis.pos,
            negative: analysis.neg,
            neutral: analysis.neu,
            tweetCount: 1,
            confidence: this.calculateTweetConfidence(tweet),
          });

          totalCompound += analysis.compound;
          totalPositive += analysis.pos;
          totalNegative += analysis.neg;
          totalNeutral += analysis.neu;
        } catch (error) {
          console.warn('SentimentAnalyzer: Error analyzing market tweet', error);
        }
      }

      if (sentimentResults.length === 0) {
        return this.createNeutralResult('MARKET');
      }

      // Calculate average sentiment
      const avgCompound = totalCompound / sentimentResults.length;
      const avgPositive = totalPositive / sentimentResults.length;
      const avgNegative = totalNegative / sentimentResults.length;
      const avgNeutral = totalNeutral / sentimentResults.length;

      // Calculate confidence
      const confidence = this.calculateConfidence(sentimentResults);

      const result: SentimentAnalysis = {
        tokenSymbol: 'MARKET',
        sentiment: Math.max(-1, Math.min(1, avgCompound)),
        confidence,
        tweetCount: sentimentResults.length,
        analysis: {
          compound: avgCompound,
          positive: avgPositive,
          negative: avgNegative,
          neutral: avgNeutral,
          tweetCount: sentimentResults.length,
          confidence,
        },
        timestamp: new Date(),
      };

      console.log('SentimentAnalyzer: Market sentiment analysis complete', {
        sentiment: result.sentiment,
        confidence: result.confidence,
        tweetCount: result.tweetCount,
      });

      return result;
    } catch (error) {
      console.error('SentimentAnalyzer: Error analyzing market sentiment', error);
      return this.createNeutralResult('MARKET');
    }
  }

  /**
   * Calculates confidence for a single tweet
   * @param tweet - Tweet data
   * @returns number - Confidence score (0-1)
   */
  private calculateTweetConfidence(tweet: any): number {
    try {
      let confidence = 0.5; // Base confidence

      // Higher engagement = higher confidence
      const metrics = tweet.public_metrics || {};
      const engagement = (metrics.retweet_count || 0) + (metrics.like_count || 0) + (metrics.reply_count || 0);

      if (engagement > 100) {
        confidence += 0.3;
      } else if (engagement > 50) {
        confidence += 0.2;
      } else if (engagement > 10) {
        confidence += 0.1;
      }

      // Longer tweets = higher confidence (more context)
      const textLength = tweet.text.length;
      if (textLength > 200) {
        confidence += 0.1;
      } else if (textLength > 100) {
        confidence += 0.05;
      }

      return Math.min(1, confidence);
    } catch (error) {
      console.error('SentimentAnalyzer: Error calculating tweet confidence', error);
      return 0.5; // Default confidence
    }
  }

  /**
   * Calculates overall confidence for sentiment analysis
   * @param results - Array of sentiment results
   * @returns number - Overall confidence (0-1)
   */
  private calculateConfidence(results: SentimentResult[]): number {
    try {
      if (results.length === 0) {
        return 0;
      }

      let confidence = 0.5; // Base confidence

      // More tweets = higher confidence
      const tweetCount = results.length;
      if (tweetCount > 50) {
        confidence += 0.3;
      } else if (tweetCount > 20) {
        confidence += 0.2;
      } else if (tweetCount > 10) {
        confidence += 0.1;
      }

      // Sentiment consistency = higher confidence
      const compounds = results.map(r => r.compound);
      const variance = this.calculateVariance(compounds);
      const consistency = Math.max(0, 1 - variance);
      confidence += consistency * 0.2;

      // Average tweet confidence
      const avgTweetConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
      confidence += avgTweetConfidence * 0.1;

      return Math.min(1, confidence);
    } catch (error) {
      console.error('SentimentAnalyzer: Error calculating overall confidence', error);
      return 0.5; // Default confidence
    }
  }

  /**
   * Calculates variance of an array of numbers
   * @param values - Array of numbers
   * @returns number - Variance
   */
  private calculateVariance(values: number[]): number {
    try {
      if (values.length === 0) {
        return 0;
      }

      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

      return variance;
    } catch (error) {
      console.error('SentimentAnalyzer: Error calculating variance', error);
      return 0;
    }
  }

  /**
   * Creates a neutral sentiment result
   * @param tokenSymbol - Token symbol
   * @returns SentimentAnalysis - Neutral result
   */
  private createNeutralResult(tokenSymbol: string): SentimentAnalysis {
    return {
      tokenSymbol,
      sentiment: 0,
      confidence: 0.5,
      tweetCount: 0,
      analysis: {
        compound: 0,
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34,
        tweetCount: 0,
        confidence: 0.5,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Gets cached result if available and not expired
   * @param tokenSymbol - Token symbol
   * @returns SentimentAnalysis | null - Cached result or null
   */
  private getCachedResult(tokenSymbol: string): SentimentAnalysis | null {
    try {
      const cached = this.cache.get(tokenSymbol);
      if (!cached) {
        return null;
      }

      const now = Date.now();
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(tokenSymbol);
        return null;
      }

      return cached.result;
    } catch (error) {
      console.error('SentimentAnalyzer: Error getting cached result', error);
      return null;
    }
  }

  /**
   * Caches a sentiment analysis result
   * @param tokenSymbol - Token symbol
   * @param result - Sentiment analysis result
   */
  private cacheResult(tokenSymbol: string, result: SentimentAnalysis): void {
    try {
      this.cache.set(tokenSymbol, {
        result,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('SentimentAnalyzer: Error caching result', error);
    }
  }

  /**
   * Clears the sentiment cache
   */
  clearCache(): void {
    try {
      this.cache.clear();
      console.log('SentimentAnalyzer: Cache cleared');
    } catch (error) {
      console.error('SentimentAnalyzer: Error clearing cache', error);
    }
  }

  /**
   * Gets cache statistics
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    try {
      return {
        size: this.cache.size,
        keys: Array.from(this.cache.keys()),
      };
    } catch (error) {
      console.error('SentimentAnalyzer: Error getting cache stats', error);
      return { size: 0, keys: [] };
    }
  }
}
