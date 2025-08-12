import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { Wallet, Coins, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { tokenPriceService, TokenPrice } from '../services/tokenPriceService';

interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  price?: number;
  value?: number;
  change24h?: number;
  logoURI?: string;
}

interface WalletDashboardProps {
  className?: string;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ className }) => {
  const { publicKey, connected } = useWallet();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Solana connection
  const connection = new Connection(
    process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  // Fetch token balances from wallet
  const fetchTokenBalances = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      // Get SOL balance
      const solBalanceLamports = await connection.getBalance(publicKey);
      const solBalanceSol = solBalanceLamports / LAMPORTS_PER_SOL;
      setSolBalance(solBalanceSol);

      // Get all token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      const balances: TokenBalance[] = [];

      for (const account of tokenAccounts.value) {
        const accountInfo = account.account.data.parsed.info;
        const balance = parseFloat(accountInfo.tokenAmount.uiAmount);
        
        if (balance > 0) {
          balances.push({
            mint: accountInfo.mint,
            symbol: 'Unknown',
            name: 'Unknown Token',
            balance: balance,
            decimals: accountInfo.tokenAmount.decimals,
          });
        }
      }

      // Get token prices and metadata
      const tokenIds = balances.map(token => token.mint);
      const prices = await tokenPriceService.getTokenPrices(tokenIds);
      
      // Enrich balances with price data
      const enrichedBalances = balances.map(token => {
        const priceData = prices.find(p => p.id === token.mint);
        
        if (priceData) {
          return {
            ...token,
            symbol: priceData.symbol,
            name: priceData.name,
            price: priceData.price,
            value: token.balance * priceData.price,
            change24h: priceData.priceChange24h,
            logoURI: priceData.logoURI,
          };
        }
        
        return token;
      });

      setTokenBalances(enrichedBalances);
      
      // Calculate total value (including SOL)
      const solPrice = 20; // Approximate SOL price, could be fetched from API
      const total = enrichedBalances.reduce((sum, token) => sum + (token.value || 0), 0) + (solBalanceSol * solPrice);
      setTotalValue(total);

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to price updates
  useEffect(() => {
    if (connected && publicKey) {
      fetchTokenBalances();
      
      // Subscribe to price updates
      const unsubscribe = tokenPriceService.subscribe((prices) => {
        setTokenBalances(prev => prev.map(token => {
          const priceData = prices.find(p => p.id === token.mint);
          if (priceData) {
            return {
              ...token,
              price: priceData.price,
              value: token.balance * priceData.price,
              change24h: priceData.priceChange24h,
            };
          }
          return token;
        }));
      });

      return () => {
        unsubscribe();
      };
    }
  }, [connected, publicKey]);

  // Refresh data
  const handleRefresh = () => {
    fetchTokenBalances();
  };

  if (!connected || !publicKey) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <Wallet size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Wallet Not Connected</h3>
          <p className="text-gray-400">Connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Wallet Portfolio</h2>
          <p className="text-gray-400 text-sm">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          <p>{error}</p>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Value</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatCurrency(totalValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Coins size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">SOL Balance</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : formatNumber(solBalance, 4)} SOL
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Wallet size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Token Count</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : tokenBalances.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Token List */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Token Balances</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw size={32} className="animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading wallet data...</p>
          </div>
        ) : tokenBalances.length === 0 ? (
          <div className="text-center py-8">
            <Coins size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Tokens Found</h3>
            <p className="text-gray-400">Your wallet doesn't have any tokens yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tokenBalances.map((token, index) => (
              <div
                key={token.mint}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  {token.logoURI ? (
                    <img 
                      src={token.logoURI} 
                      alt={token.symbol}
                      className="w-10 h-10 rounded-lg"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
                        const target = e.currentTarget as HTMLElement;
                        target.style.display = 'none';
                        const nextSibling = target.nextElementSibling as HTMLElement;
                        if (nextSibling) {
                          nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center ${token.logoURI ? 'hidden' : ''}`}>
                    <span className="text-white font-bold text-sm">
                      {token.symbol.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{token.symbol}</h4>
                    <p className="text-sm text-gray-400">{token.name}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-white">
                    {formatNumber(token.balance, token.decimals)}
                  </p>
                  {token.value && (
                    <p className="text-sm text-gray-400">
                      {formatCurrency(token.value)}
                    </p>
                  )}
                  {token.change24h !== undefined && (
                    <div className={`flex items-center space-x-1 text-xs ${
                      token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {token.change24h >= 0 ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      <span>{Math.abs(token.change24h).toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 