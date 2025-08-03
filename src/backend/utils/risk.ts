/**
 * Risk Management System
 *
 * Comprehensive risk management tools including:
 * - Portfolio risk monitoring
 * - Position sizing calculations
 * - Drawdown limits and alerts
 * - Risk metrics and analytics
 * - Automated risk controls
 */

import { Connection, PublicKey } from '@solana/web3.js';

// Types for risk management
export interface RiskConfig {
  maxPortfolioRisk: number; // 0-1, maximum portfolio risk
  maxPositionSize: number; // 0-1, maximum position size as % of portfolio
  maxDrawdown: number; // 0-1, maximum allowed drawdown
  stopLossPercentage: number; // 0-1, stop loss percentage
  takeProfitPercentage: number; // 0-1, take profit percentage
  maxLeverage: number; // Maximum leverage allowed
  correlationThreshold: number; // Maximum correlation between positions
}

export interface Position {
  id: string;
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  timestamp: Date;
}

export interface Portfolio {
  totalValue: number;
  cash: number;
  positions: Position[];
  totalPnL: number;
  totalPnLPercent: number;
  timestamp: Date;
}

export interface RiskMetrics {
  portfolioRisk: number;
  var95: number; // Value at Risk (95% confidence)
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  correlation: number;
  concentrationRisk: number;
  leverageRatio: number;
  timestamp: Date;
}

export interface RiskAlert {
  id: string;
  type: 'DRAWDOWN' | 'CONCENTRATION' | 'LEVERAGE' | 'CORRELATION' | 'STOP_LOSS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  recommendation: string;
  triggered: boolean;
  timestamp: Date;
}

export interface RiskRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD' | 'REDUCE' | 'INCREASE';
  symbol: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedImpact: number;
  timestamp: Date;
}

/**
 * Risk Management System Class
 *
 * Provides comprehensive risk monitoring and management
 */
export class RiskManagementSystem {
  private connection: Connection;
  private config: RiskConfig;
  private alerts: Map<string, RiskAlert> = new Map();
  private portfolioHistory: Portfolio[] = [];
  private riskHistory: RiskMetrics[] = [];

  constructor(config: RiskConfig) {
    this.config = config;
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  /**
   * Initialize the risk management system
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      const blockHeight = await this.connection.getBlockHeight();
      console.log(`Risk: Connected to Solana network, block height: ${blockHeight}`);

      console.log('Risk: Initialized risk management system');
    } catch (error) {
      throw new Error(`Failed to initialize risk management system: ${error}`);
    }
  }

  /**
   * Calculate portfolio risk metrics
   */
  async calculateRiskMetrics(portfolio: Portfolio): Promise<RiskMetrics> {
    try {
      // Calculate various risk metrics
      const portfolioRisk = this.calculatePortfolioRisk(portfolio);
      const var95 = this.calculateVaR(portfolio);
      const maxDrawdown = this.calculateMaxDrawdown();
      const sharpeRatio = this.calculateSharpeRatio();
      const volatility = this.calculateVolatility(portfolio);
      const correlation = this.calculateCorrelation(portfolio);
      const concentrationRisk = this.calculateConcentrationRisk(portfolio);
      const leverageRatio = this.calculateLeverageRatio(portfolio);

      const metrics: RiskMetrics = {
        portfolioRisk,
        var95,
        maxDrawdown,
        sharpeRatio,
        volatility,
        correlation,
        concentrationRisk,
        leverageRatio,
        timestamp: new Date(),
      };

      // Store in history
      this.riskHistory.push(metrics);

      console.log(`Risk: Calculated risk metrics. Portfolio risk: ${portfolioRisk}`);
      return metrics;
    } catch (error) {
      throw new Error(`Failed to calculate risk metrics: ${error}`);
    }
  }

  /**
   * Check for risk alerts
   */
  async checkRiskAlerts(portfolio: Portfolio, metrics: RiskMetrics): Promise<RiskAlert[]> {
    const newAlerts: RiskAlert[] = [];

    // Check drawdown
    if (metrics.maxDrawdown > this.config.maxDrawdown) {
      const alert = this.createAlert(
        'DRAWDOWN',
        'CRITICAL',
        `Maximum drawdown exceeded: ${(metrics.maxDrawdown * 100).toFixed(2)}%`,
        'Consider reducing positions or adding stop losses'
      );
      newAlerts.push(alert);
    }

    // Check concentration risk
    if (metrics.concentrationRisk > 0.5) {
      const alert = this.createAlert(
        'CONCENTRATION',
        'HIGH',
        `High concentration risk: ${(metrics.concentrationRisk * 100).toFixed(2)}%`,
        'Consider diversifying portfolio across more positions'
      );
      newAlerts.push(alert);
    }

    // Check leverage
    if (metrics.leverageRatio > this.config.maxLeverage) {
      const alert = this.createAlert(
        'LEVERAGE',
        'HIGH',
        `Leverage ratio exceeded: ${metrics.leverageRatio.toFixed(2)}`,
        'Consider reducing leverage to meet risk limits'
      );
      newAlerts.push(alert);
    }

    // Check correlation
    if (metrics.correlation > this.config.correlationThreshold) {
      const alert = this.createAlert(
        'CORRELATION',
        'MEDIUM',
        `High correlation detected: ${(metrics.correlation * 100).toFixed(2)}%`,
        'Consider positions with lower correlation'
      );
      newAlerts.push(alert);
    }

    // Check individual position stop losses
    for (const position of portfolio.positions) {
      if (position.unrealizedPnLPercent < -this.config.stopLossPercentage) {
        const alert = this.createAlert(
          'STOP_LOSS',
          'HIGH',
          `Stop loss triggered for ${position.symbol}: ${position.unrealizedPnLPercent.toFixed(2)}%`,
          'Consider closing position to limit losses'
        );
        newAlerts.push(alert);
      }
    }

    return newAlerts;
  }

  /**
   * Generate risk recommendations
   */
  async generateRecommendations(portfolio: Portfolio, metrics: RiskMetrics): Promise<RiskRecommendation[]> {
    const recommendations: RiskRecommendation[] = [];

    // High drawdown recommendation
    if (metrics.maxDrawdown > this.config.maxDrawdown * 0.8) {
      recommendations.push({
        action: 'REDUCE',
        symbol: 'PORTFOLIO',
        reason: 'High drawdown approaching limit',
        priority: 'HIGH',
        expectedImpact: -0.1,
        timestamp: new Date(),
      });
    }

    // High concentration recommendation
    if (metrics.concentrationRisk > 0.4) {
      recommendations.push({
        action: 'REDUCE',
        symbol: 'LARGEST_POSITION',
        reason: 'High concentration risk',
        priority: 'MEDIUM',
        expectedImpact: -0.05,
        timestamp: new Date(),
      });
    }

    // High leverage recommendation
    if (metrics.leverageRatio > this.config.maxLeverage * 0.8) {
      recommendations.push({
        action: 'REDUCE',
        symbol: 'LEVERAGED_POSITIONS',
        reason: 'Leverage approaching limit',
        priority: 'HIGH',
        expectedImpact: -0.15,
        timestamp: new Date(),
      });
    }

    // Diversification recommendation
    if (portfolio.positions.length < 5) {
      recommendations.push({
        action: 'BUY',
        symbol: 'DIVERSIFICATION',
        reason: 'Low portfolio diversification',
        priority: 'MEDIUM',
        expectedImpact: 0.05,
        timestamp: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * Calculate optimal position size
   */
  calculateOptimalPositionSize(
    portfolioValue: number,
    symbol: string,
    volatility: number,
    correlation: number
  ): number {
    try {
      // Kelly Criterion inspired position sizing
      const baseSize = this.config.maxPositionSize;
      const volatilityAdjustment = Math.max(0.1, 1 - volatility);
      const correlationAdjustment = Math.max(0.1, 1 - correlation);

      const optimalSize = baseSize * volatilityAdjustment * correlationAdjustment;

      return Math.min(optimalSize, this.config.maxPositionSize);
    } catch (error) {
      throw new Error(`Failed to calculate optimal position size: ${error}`);
    }
  }

  /**
   * Update portfolio history
   */
  updatePortfolioHistory(portfolio: Portfolio): void {
    this.portfolioHistory.push(portfolio);

    // Keep only last 100 entries
    if (this.portfolioHistory.length > 100) {
      this.portfolioHistory = this.portfolioHistory.slice(-100);
    }
  }

  /**
   * Get portfolio performance history
   */
  getPortfolioHistory(): Portfolio[] {
    return [...this.portfolioHistory];
  }

  /**
   * Get risk metrics history
   */
  getRiskHistory(): RiskMetrics[] {
    return [...this.riskHistory];
  }

  /**
   * Get all active alerts
   */
  getAlerts(): RiskAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.triggered && Date.now() - alert.timestamp.getTime() > 24 * 60 * 60 * 1000) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Calculate portfolio risk (simplified)
   */
  private calculatePortfolioRisk(portfolio: Portfolio): number {
    try {
      let totalRisk = 0;

      for (const position of portfolio.positions) {
        const positionRisk = Math.abs(position.unrealizedPnLPercent) / 100;
        const weight = position.size / portfolio.totalValue;
        totalRisk += positionRisk * weight;
      }

      return Math.min(totalRisk, 1);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate Value at Risk (simplified)
   */
  private calculateVaR(portfolio: Portfolio): number {
    try {
      // Simplified VaR calculation
      const volatility = this.calculateVolatility(portfolio);
      const confidenceLevel = 1.645; // 95% confidence
      const var95 = portfolio.totalValue * volatility * confidenceLevel;

      return var95;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(): number {
    try {
      if (this.portfolioHistory.length < 2) return 0;

      let maxDrawdown = 0;
      let peak = this.portfolioHistory[0].totalValue;

      for (const portfolio of this.portfolioHistory) {
        if (portfolio.totalValue > peak) {
          peak = portfolio.totalValue;
        }

        const drawdown = (peak - portfolio.totalValue) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }

      return maxDrawdown;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate Sharpe ratio (simplified)
   */
  private calculateSharpeRatio(): number {
    try {
      if (this.portfolioHistory.length < 2) return 0;

      const returns = this.portfolioHistory.slice(1).map((portfolio, index) => {
        const prevValue = this.portfolioHistory[index].totalValue;
        return (portfolio.totalValue - prevValue) / prevValue;
      });

      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);

      return volatility > 0 ? avgReturn / volatility : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate portfolio volatility
   */
  private calculateVolatility(portfolio: Portfolio): number {
    try {
      if (this.portfolioHistory.length < 2) return 0;

      const returns = this.portfolioHistory.slice(-20).map((p, index, arr) => {
        if (index === 0) return 0;
        const prevValue = arr[index - 1].totalValue;
        return (p.totalValue - prevValue) / prevValue;
      });

      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;

      return Math.sqrt(variance);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate position correlation
   */
  private calculateCorrelation(portfolio: Portfolio): number {
    try {
      if (portfolio.positions.length < 2) return 0;

      // Simplified correlation calculation
      const returns = portfolio.positions.map(p => p.unrealizedPnLPercent);
      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

      const covariance = returns.reduce((sum, ret) => sum + (ret - avgReturn) * (ret - avgReturn), 0);
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0);

      return variance > 0 ? covariance / variance : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate concentration risk
   */
  private calculateConcentrationRisk(portfolio: Portfolio): number {
    try {
      if (portfolio.positions.length === 0) return 0;

      // Herfindahl-Hirschman Index for concentration
      const weights = portfolio.positions.map(p => p.size / portfolio.totalValue);
      const hhi = weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);

      return hhi;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate leverage ratio
   */
  private calculateLeverageRatio(portfolio: Portfolio): number {
    try {
      const totalPositionValue = portfolio.positions.reduce((sum, p) => sum + p.size, 0);
      return totalPositionValue / portfolio.totalValue;
    } catch (error) {
      return 1;
    }
  }

  /**
   * Create a risk alert
   */
  private createAlert(
    type: RiskAlert['type'],
    severity: RiskAlert['severity'],
    message: string,
    recommendation: string
  ): RiskAlert {
    const alertId = `risk-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const alert: RiskAlert = {
      id: alertId,
      type,
      severity,
      message,
      recommendation,
      triggered: true,
      timestamp: new Date(),
    };

    this.alerts.set(alertId, alert);
    console.log(`Risk: Created ${severity} alert: ${message}`);
    return alert;
  }

  /**
   * Get risk statistics
   */
  getRiskStats(): {
    totalAlerts: number;
    criticalAlerts: number;
    portfolioHistoryLength: number;
    riskHistoryLength: number;
  } {
    const alerts = this.getAlerts();
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;

    return {
      totalAlerts: alerts.length,
      criticalAlerts,
      portfolioHistoryLength: this.portfolioHistory.length,
      riskHistoryLength: this.riskHistory.length,
    };
  }
}

/**
 * Factory function to create risk management system instance
 */
export function createRiskManagementSystem(config: RiskConfig): RiskManagementSystem {
  return new RiskManagementSystem(config);
}
