import React, { useState } from 'react';
import { useAppDispatch } from '../store';
import { openPositionDetail } from '../store/slices/uiSlice';
import { Position } from '../../backend/database';

interface PositionCardProps {
  position: Position;
  onClose?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Position>) => void;
  onExpand?: (position: Position) => void;
  className?: string;
  isExpanded?: boolean;
}

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onClose,
  onUpdate,
  onExpand,
  className = '',
  isExpanded = false
}) => {
  const dispatch = useAppDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'balanced':
        return '⚖️';
      case 'aggressive':
        return '🚀';
      case 'conservative':
        return '🛡️';
      default:
        return '📊';
    }
  };

  const handleClick = () => {
    // Open detailed view modal
    dispatch(openPositionDetail({
      position,
      onClose: onClose ? () => onClose(position.id) : undefined,
      onUpdate
    }));
    
    // Also call the original onExpand if provided
    if (onExpand) {
      onExpand(position);
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
            w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg 
            flex items-center justify-center transition-transform duration-200
            ${isHovered ? 'scale-110' : ''}
          `}>
            <span className="text-white font-bold text-sm">
              {position.tokenA}/{position.tokenB}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white transition-colors duration-200">
              {position.tokenA}/{position.tokenB}
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              {position.poolAddress.slice(0, 8)}...{position.poolAddress.slice(-6)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200
            ${getStatusColor(position.status)}
            ${isHovered ? 'scale-105' : ''}
          `}>
            {position.status.toUpperCase()}
          </span>
          {onClose && position.status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(position.id);
              }}
              className="
                text-red-400 hover:text-red-300 text-sm font-medium 
                transition-colors duration-200 hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded
              "
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Strategy Info */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg transition-all duration-200 hover:bg-white/8">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Strategy</span>
          <div className="flex items-center space-x-2">
            <span className={`
              text-lg transition-transform duration-200
              ${isHovered ? 'scale-110' : ''}
            `}>
              {getStrategyIcon(position.strategy)}
            </span>
            <span className="text-sm font-medium text-white capitalize">
              {position.strategy}
            </span>
          </div>
        </div>
      </div>

      {/* Position Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
          <p className="text-xs text-gray-400 mb-1">Amount A</p>
          <p className="text-sm font-medium text-white">
            {position.amountA.toFixed(4)} {position.tokenA}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
          <p className="text-xs text-gray-400 mb-1">Amount B</p>
          <p className="text-sm font-medium text-white">
            {position.amountB.toFixed(4)} {position.tokenB}
          </p>
        </div>
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
          <p className="text-xs text-gray-400 mb-1">Entry Price</p>
          <p className="text-sm font-medium text-white">
            {formatCurrency(position.entryPrice)}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 transition-all duration-200 hover:bg-white/8">
          <p className="text-xs text-gray-400 mb-1">Current Price</p>
          <p className="text-sm font-medium text-white">
            {formatCurrency(position.currentPrice)}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3 transition-all duration-200 hover:bg-green-500/15">
          <p className="text-xs text-gray-400 mb-1">P&L</p>
          <p className={`text-sm font-bold ${getPnlColor(position.pnl)}`}>
            {formatCurrency(position.pnl)}
          </p>
        </div>
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-3 transition-all duration-200 hover:bg-blue-500/15">
          <p className="text-xs text-gray-400 mb-1">APY</p>
          <p className="text-sm font-bold text-blue-400">
            {formatPercentage(position.apy)}
          </p>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-4">
            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Liquidity Range</p>
                <p className="text-sm font-medium text-white">
                  ${position.entryPrice.toFixed(4)} - ${(position.entryPrice * 1.5).toFixed(4)}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Fee Tier</p>
                <p className="text-sm font-medium text-white">0.05%</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105">
                Add Liquidity
              </button>
              <button className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105">
                View Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="text-xs text-gray-400">
          Created {formatDate(position.timestamp)}
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