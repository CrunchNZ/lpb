import React, { useState } from 'react';
import { useAppDispatch } from '../store';
import { openTokenDetail } from '../store/slices/uiSlice';
// Removed unused Token and TokenData imports

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
  logoURI?: string;
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
  const [imageError, setImageError] = useState(false);

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

  // Removed unused getTrendingIcon helper

  const formatAge = (ageInDays: number) => {
    if (ageInDays < 1) return '< 1 day';
    if (ageInDays < 7) return `${Math.floor(ageInDays)} days`;
    if (ageInDays < 30) return `${Math.floor(ageInDays / 7)} weeks`;
    return `${Math.floor(ageInDays / 30)} months`;
  };

  const handleClick = () => {
    // Open detailed view modal
    dispatch(openTokenDetail(token));
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

  const handleImageError = () => {
    setImageError(true);
  };

  // Get token icon from DexScreener or fallback to Solana token list
  const getTokenIcon = () => {
    if (imageError) {
      return 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
    }
    
    // Try DexScreener icon first
    if (token.logoURI) {
      return token.logoURI;
    }
    
    // Fallback to Solana token list
    return `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.address}/logo.png`;
  };

  return (
    <div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-200 cursor-pointer ${
        isHovered ? 'scale-105' : ''
      } ${isPressed ? 'scale-95' : ''} ${className}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={getTokenIcon()}
              alt={token.symbol}
              className="w-10 h-10 rounded-full"
              onError={handleImageError}
            />
            {token.trending && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs">🔥</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{token.symbol}</h3>
            <p className="text-sm text-gray-400">{token.name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">${token.price.toFixed(6)}</div>
          <div className={`text-sm ${getPriceChangeColor(token.priceChange24h)}`}>
            {formatPercentage(token.priceChange24h)}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Volume 24h</div>
          <div className="text-sm font-medium text-white">{formatCurrency(token.volume24h)}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Market Cap</div>
          <div className="text-sm font-medium text-white">{formatCurrency(token.marketCap)}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Liquidity</div>
          <div className="text-sm font-medium text-white">{formatCurrency(token.liquidity)}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">TVL</div>
          <div className="text-sm font-medium text-white">{formatCurrency(token.tvl)}</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Sentiment</span>
          <span className={`${getSentimentColor(token.sentiment)}`}>
            {getSentimentIcon(token.sentiment)} {token.sentiment.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Age</span>
          <span className="text-white">{formatAge(token.age)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Holders</span>
          <span className="text-white">{token.holders.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Transactions 24h</span>
          <span className="text-white">{token.transactions24h.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mt-4">
        {onAddToWatchlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToWatchlist(token);
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
          >
            Add to Watchlist
          </button>
        )}
        {onTrade && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrade(token);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
          >
            Trade
          </button>
        )}
        {onExpand && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand(token);
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {/* Chain and DEX Info */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Chain:</span>
          <span className="text-xs text-white bg-blue-600 px-2 py-1 rounded">{token.chainId}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">DEX:</span>
          <span className="text-xs text-white bg-green-600 px-2 py-1 rounded">{token.dexId}</span>
        </div>
      </div>
    </div>
  );
}; 