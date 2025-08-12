/**
 * PoolCard Component
 * Displays liquidity pool information with Apple-style design and interactive features.
 *
 * Props:
 * - poolName: string
 * - platform: string (e.g., Raydium, Meteora, Orca)
 * - tvl: number (Total Value Locked)
 * - apr: number (Annual Percentage Rate)
 * - userLiquidity: number (user's share in the pool)
 * - lpFee: number (liquidity provider fee percentage)
 * - poolAddress: string (contract address)
 * - onAddLiquidity: () => void
 * - onRemoveLiquidity: () => void
 * - onViewDetails: () => void
 */
import React, { useState } from 'react';
import { useAppDispatch } from '../store';
import { openPoolDetail } from '../store/slices/uiSlice';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export interface PoolCardProps {
  poolName: string;
  platform: string;
  tvl: number;
  apr: number;
  userLiquidity: number;
  lpFee: number;
  poolAddress: string;
  chainId: string;
  onAddLiquidity: () => void;
  onRemoveLiquidity: () => void;
  onViewDetails: () => void;
}

/**
 * Formats large numbers as $1.23M, $4.5K, etc.
 */
function formatCurrency(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export const PoolCard: React.FC<PoolCardProps> = ({
  poolName,
  platform,
  tvl,
  apr,
  userLiquidity,
  lpFee,
  poolAddress,
  chainId,
  onAddLiquidity,
  onRemoveLiquidity,
  onViewDetails
}) => {
  const dispatch = useAppDispatch();
  // State for expand/collapse
  const [expanded, setExpanded] = useState(false);
  // State for hover/press feedback
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const openExplorer = (address: string, chainId: string) => {
    let explorerUrl = '';
    switch (chainId) {
      case 'solana':
        explorerUrl = `https://solscan.io/account/${address}`;
        break;
      case 'ethereum':
        explorerUrl = `https://etherscan.io/address/${address}`;
        break;
      default:
        explorerUrl = `https://explorer.${chainId}.org/address/${address}`;
    }
    window.open(explorerUrl, '_blank');
  };

  // Apple-style card classes
  const cardBase = `
    relative w-full rounded-2xl bg-gradient-to-br from-white/10 to-white/5
    shadow-md transition-all duration-300 ease-out
    cursor-pointer select-none
    ${hovered ? 'scale-[1.02] shadow-lg shadow-white/10 border border-white/20' : ''}
    ${pressed ? 'scale-95' : ''}
    ${expanded ? 'ring-2 ring-blue-400/40 bg-white/15' : ''}
  `;

  return (
    <div
      className={cardBase}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      onClick={() => {
        // Open detailed view modal
        dispatch(openPoolDetail({
          pool: {
            id: poolName,
            name: poolName,
            platform,
            tokenA: 'SOL',
            tokenB: 'USDC',
            tokenASymbol: 'SOL',
            tokenBSymbol: 'USDC',
            tvl,
            apr,
            volume24h: tvl * 0.1,
            fees24h: tvl * 0.001,
            userLiquidity,
            userShare: (userLiquidity / tvl) * 100,
            poolAddress,
            chainId,
            createdAt: Date.now() - 86400000 * 30,
            lastUpdated: Date.now() - 3600000,
            riskLevel: 'medium',
            impermanentLoss: -0.5,
            priceRange: {
              min: 80,
              max: 120,
              current: 100.50,
            },
            rewards: [],
            historicalData: []
          },
          onClose: () => {},
          onAddLiquidity,
          onRemoveLiquidity,
          onHarvestRewards: () => Promise.resolve(),
          onRefreshData: () => Promise.resolve()
        }));
        
        // Also toggle local expansion
        setExpanded((v) => !v);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(v => !v);
        }
      }}
      style={{ outline: 'none' }}
    >
      {/* Main Info Row */}
      <div className="flex items-center justify-between p-5">
        <div>
          <div className="font-bold text-lg text-white mb-1">{poolName}</div>
          <div className="text-xs text-blue-300 font-semibold uppercase tracking-wide mb-1">{platform}</div>
          {/* Contract Address */}
          <div className="flex items-center space-x-1 mt-1">
            <span className="text-xs text-gray-400 font-mono">
              {poolAddress ? `${poolAddress.slice(0, 6)}...${poolAddress.slice(-4)}` : 'Address not available'}
            </span>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (poolAddress) {
                  copyToClipboard(poolAddress);
                }
              }}
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              disabled={!poolAddress}
            >
              {copiedAddress === poolAddress ? (
                <Check size={10} className="text-green-500" />
              ) : (
                <Copy size={10} className="text-gray-400" />
              )}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (poolAddress) {
                  openExplorer(poolAddress, chainId);
                }
              }}
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              disabled={!poolAddress}
            >
              <ExternalLink size={10} className="text-gray-400" />
            </Button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-200 font-medium">TVL</div>
          <div className="text-base font-bold text-blue-200">{formatCurrency(tvl)}</div>
        </div>
      </div>
      <div className="flex items-center justify-between px-5 pb-3">
        <div className="text-sm text-gray-300">
          APR <span className="font-semibold text-green-400">{apr}%</span>
        </div>
        <div className="text-sm text-gray-300">
          LP Fee <span className="font-semibold text-cyan-300">{lpFee}%</span>
        </div>
        <div className="text-sm text-gray-300">
          Your Liquidity <span className="font-semibold text-cyan-300">{formatCurrency(userLiquidity)}</span>
        </div>
      </div>
      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}`}
        aria-hidden={!expanded}
      >
        {/* Expanded details and actions */}
        <div className="px-5 space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={e => { e.stopPropagation(); onAddLiquidity(); }}
              className="flex-1"
            >
              Add Liquidity
            </Button>
            <Button
              onClick={e => { e.stopPropagation(); onRemoveLiquidity(); }}
              variant="destructive"
              className="flex-1"
            >
              Remove Liquidity
            </Button>
          </div>
          <Button
            onClick={e => { e.stopPropagation(); onViewDetails(); }}
            variant="outline"
            className="w-full"
          >
            View Details
          </Button>
        </div>
      </div>
      {/* Click indicator */}
      {!expanded && hovered && (
        <div className="absolute top-3 right-5 text-xs text-gray-400 opacity-80 pointer-events-none select-none">
          Click to expand
        </div>
      )}
    </div>
  );
};