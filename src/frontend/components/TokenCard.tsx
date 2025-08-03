import React, { useState } from 'react';
import { useAppDispatch } from '../store';
import { openTokenDetail } from '../store/slices/uiSlice';
import { Token } from '../../backend/strategies/types';
import { TokenData } from '../store/slices/dexscreenerSlice';

// Combined token interface that includes both Token and TokenData fields
interface TokenCardData {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChange1h: number;
  priceChange6h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  tvl: number;
  sentiment: number; // -1 to 1
  trending: boolean;
  age: number;
  holders: number;
  transactions24h: number;
  pairAddress: string;
  chainId: string;
  dexId: string;
}

interface TokenCardProps {
  token: TokenCardData;
  onExpand?: (token: TokenCardData) => void;
  onAddToWatchlist?: (token: TokenCardData) => void;
  onTrade?: (token: TokenCardData) => void;
  className?: string;
  isExpanded?: boolean;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onExpand,
  onAddToWatchlist,
  onTrade,
  className = '',
  isExpanded = false
}) => {
  const dispatch = useAppDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

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

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.6) return 'text-green-400';
    if (sentiment >= 0.2) return 'text-blue-400';
    if (sentiment >= -0.2) return 'text-gray-400';
    if (sentiment >= -0.6) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment >= 0.6) return '🚀';
    if (sentiment >= 0.2) return '📈';
    if (sentiment >= -0.2) return '➡️';
    if (sentiment >= -0.6) return '📉';
    return '💥';
  };

  const getTrendingIcon = (trending: boolean) => {
    return trending ? '🔥' : '📊';
  };

  const formatAge = (ageInDays: number) => {
    if (ageInDays < 1) return '< 1 day';
    if (ageInDays < 7) return `${Math.floor(ageInDays)} days`;
    if (ageInDays < 30) return `${Math.floor(ageInDays / 7)} weeks`;
    return `${Math.floor(ageInDays / 30)} months`;
  };

  const handleClick = () => {
    // Open detailed view modal
    dispatch(openTokenDetail({
      token,
      onClose: () => {},
      onAddToWatchlist: onAddToWatchlist || undefined,
      onRemoveFromWatchlist: () => {},
      isInWatchlist: false
    }));
    
    // Also call the original onExpand if provided
    if (onExpand) {
      onExpand(token);
    }
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  return (
    <div
      className={`
        bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 
        transition-all duration-300 ease-out
        ${isHovered ? 'border-white/30 bg-white/8 scale-[1.02] shadow-lg shadow-white/5' : ''}
        ${isPressed ? 'scale-[0.98] bg-white/10' : ''}
        ${isExpanded ? 'ring-2 ring-blue-500/50 bg-white/10' : ''}
        ${className}
        cursor-pointer select-none
      `}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`
            w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl 
            flex items-center justify-center transition-transform duration-200
            ${isHovered ? 'scale-110' : ''}
          `}>
            <span className="text-white font-bold text-lg">
              {token.symbol.slice(0, 3).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white transition-colors duration-200">
              {token.symbol}
            </h3>
            <p className="text-sm text-gray-400">{token.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200
            ${token.trending ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}
            ${isHovered ? 'scale-105' : ''}
          `}>
            {getTrendingIcon(token.trending)} {token.trending ? 'TRENDING' : 'STABLE'}
          </span>
        </div>
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
          <p className="text-xs text-gray-400 mb-1">Price</p>
          <p className="text-lg font-bold text-white">
            ${token.price.toFixed(6)}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
          <p className="text-xs text-gray-400 mb-1">24h Change</p>
          <p className={`text-lg font-bold ${getPriceChangeColor(token.priceChange24h)}`}>
            {formatPercentage(token.priceChange24h)}
          </p>
        </div>
      </div>

      {/* Market Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-3 transition-all duration-200 hover:bg-blue-500/15">
          <p className="text-xs text-gray-400 mb-1">Market Cap</p>
          <p className="text-sm font-bold text-blue-400">
            {formatCurrency(token.marketCap)}
          </p>
        </div>
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3 transition-all duration-200 hover:bg-green-500/15">
          <p className="text-xs text-gray-400 mb-1">Volume 24h</p>
          <p className="text-sm font-bold text-green-400">
            {formatCurrency(token.volume24h)}
          </p>
        </div>
      </div>

      {/* Sentiment & Liquidity */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
          <p className="text-xs text-gray-400 mb-1">Sentiment</p>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getSentimentIcon(token.sentiment)}</span>
            <span className={`text-sm font-medium ${getSentimentColor(token.sentiment)}`}>
              {(token.sentiment * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
          <p className="text-xs text-gray-400 mb-1">Liquidity</p>
          <p className="text-sm font-medium text-white">
            {formatCurrency(token.liquidity)}
          </p>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-4">
            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">TVL</p>
                <p className="text-sm font-medium text-white">
                  {formatCurrency(token.tvl)}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Age</p>
                <p className="text-sm font-medium text-white">
                  {formatAge(token.age)}
                </p>
              </div>
            </div>

            {/* Price Changes */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">1h</p>
                <p className={`text-sm font-medium ${getPriceChangeColor(token.priceChange1h)}`}>
                  {formatPercentage(token.priceChange1h)}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">6h</p>
                <p className={`text-sm font-medium ${getPriceChangeColor(token.priceChange6h)}`}>
                  {formatPercentage(token.priceChange6h)}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">24h</p>
                <p className={`text-sm font-medium ${getPriceChangeColor(token.priceChange24h)}`}>
                  {formatPercentage(token.priceChange24h)}
                </p>
              </div>
            </div>

            {/* Token Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Holders</p>
                <p className="text-sm font-medium text-white">
                  {token.holders.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">24h Txs</p>
                <p className="text-sm font-medium text-white">
                  {token.transactions24h.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button 
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTrade) onTrade(token);
                }}
              >
                Trade
              </button>
              <button 
                className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAddToWatchlist) onAddToWatchlist(token);
                }}
              >
                Add to Watchlist
              </button>
            </div>

            {/* Chain Info */}
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Chain & DEX</p>
              <p className="text-sm font-medium text-white">
                {token.chainId.toUpperCase()} • {token.dexId.toUpperCase()}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {token.pairAddress.slice(0, 8)}...{token.pairAddress.slice(-6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="text-xs text-gray-400">
          {token.chainId.toUpperCase()} • {token.dexId.toUpperCase()}
        </div>
        <div className="flex items-center space-x-2">
          <div className={`
            w-2 h-2 bg-green-400 rounded-full transition-all duration-200
            ${isHovered ? 'scale-125' : ''}
          `}></div>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Click Indicator */}
      {!isExpanded && (
        <div className={`
          absolute top-4 right-4 text-xs text-gray-400 opacity-0 transition-opacity duration-200
          ${isHovered ? 'opacity-100' : ''}
        `}>
          Click to expand
        </div>
      )}
    </div>
  );
}; 