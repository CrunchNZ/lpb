import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Activity,
  Star,
  Share2,
  BarChart3,
  Globe,
  Wallet,
  Coins
} from 'lucide-react';
import { TokenData } from '@/backend/integrations/dexscreener';
import { tokenPriceService } from '../services/tokenPriceService';

interface TokenDetailViewProps {
  token: TokenData;
  onBack?: () => void;
  onAddToWatchlist?: (token: TokenData, watchlistId?: number) => void;
  className?: string;
}

export const TokenDetailView: React.FC<TokenDetailViewProps> = ({
  token,
  onBack,
  onAddToWatchlist,
  className = ''
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [priceData, setPriceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPriceData = async () => {
      if (token.contractAddress) {
        setLoading(true);
        try {
          const price = await tokenPriceService.getTokenPrice(token.contractAddress);
          if (price) {
            setPriceData(price);
          }
        } catch (error) {
          console.warn('Failed to fetch additional price data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPriceData();
  }, [token.contractAddress]);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (num: number): string => {
    const color = num >= 0 ? 'text-green-500' : 'text-red-500';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const formatAge = (hours: number): string => {
    if (hours < 1) return '<1h';
    if (hours < 24) return `${Math.floor(hours)}h`;
    return `${Math.floor(hours / 24)}d`;
  };

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
        explorerUrl = `https://solscan.io/token/${address}`;
        break;
      case 'ethereum':
        explorerUrl = `https://etherscan.io/token/${address}`;
        break;
      default:
        explorerUrl = `https://explorer.${chainId}.org/token/${address}`;
    }
    window.open(explorerUrl, '_blank');
  };

  const openDexScreener = () => {
    window.open(`https://dexscreener.com/${token.chainId}/${token.pairAddress}`, '_blank');
  };

  const handleAddToWatchlist = () => {
    if (onAddToWatchlist) {
      onAddToWatchlist(token);
      setIsInWatchlist(true);
    }
  };

  const shareToken = () => {
    const shareData = {
      title: `${token.symbol} - ${token.name}`,
      text: `Check out ${token.symbol} on ${token.dexId}!`,
      url: `https://dexscreener.com/${token.chainId}/${token.pairAddress}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      copyToClipboard(shareData.url);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{token.symbol}</h1>
            <p className="text-gray-400">{token.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={shareToken}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {onAddToWatchlist && (
            <Button
              variant={isInWatchlist ? "default" : "outline"}
              size="sm"
              onClick={handleAddToWatchlist}
              disabled={isInWatchlist}
            >
              <Star className="h-4 w-4" />
              {isInWatchlist ? 'Added' : 'Watchlist'}
            </Button>
          )}
        </div>
      </div>

      {/* Token Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Price</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(token.price)}
                </p>
                <p className={`text-sm ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(token.priceChange24h)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Coins size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Market Cap</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(token.marketCap)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <BarChart3 size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">24h Volume</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(token.volume24h)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Activity size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Age</p>
                <p className="text-2xl font-bold text-white">
                  {formatAge(token.age)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Clock size={24} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Information */}
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Contract Address</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/20 px-3 py-2 rounded text-sm font-mono text-white break-all">
                  {token.contractAddress || token.pairAddress}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(token.contractAddress || token.pairAddress)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openExplorer(token.contractAddress || token.pairAddress, token.chainId)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              {copiedAddress && (
                <p className="text-xs text-green-400">Address copied to clipboard!</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Chain</label>
                <p className="text-white font-medium capitalize">{token.chainId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">DEX</label>
                <p className="text-white font-medium">{token.dexId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Pair Address</label>
                <p className="text-white font-medium text-xs break-all">
                  {token.pairAddress.slice(0, 8)}...{token.pairAddress.slice(-8)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Liquidity</label>
                <p className="text-white font-medium">{formatNumber(token.liquidity || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Performance */}
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Price Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">24h Change</label>
                <p className={`text-lg font-bold ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(token.priceChange24h)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">24h High</label>
                <p className="text-white font-medium">{formatNumber(token.price)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">24h Low</label>
                <p className="text-white font-medium">{formatNumber(token.price)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Volume Change</label>
                <p className="text-white font-medium">+0.00%</p>
              </div>
            </div>

            {priceData && (
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Additional Data</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Market Cap</label>
                    <p className="text-sm text-white">{formatNumber(priceData.marketCap)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Volume 24h</label>
                    <p className="text-sm text-white">{formatNumber(priceData.volume24h)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={openDexScreener}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on DexScreener
            </Button>
            
            <Button
              variant="outline"
              onClick={() => openExplorer(token.contractAddress || token.pairAddress, token.chainId)}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </Button>

            <Button
              variant="outline"
              onClick={() => copyToClipboard(token.contractAddress || token.pairAddress)}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Address
            </Button>

            <Button
              variant="outline"
              onClick={shareToken}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Token
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 