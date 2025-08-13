import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, XCircle, Search, Loader2 } from 'lucide-react';
import { dexscreenerService } from '../services/dexscreenerService';

interface Token {
  symbol: string;
  name: string;
  address: string;
  logoURI: string;
  decimals: number;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
}

interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  priceImpactPct: number;
  fee: number;
  route: any[];
}

// Mock tokens for demonstration
const mockTokens: Token[] = [
  { symbol: 'SOL', name: 'Solana', address: 'So11111111111111111111111111111111111111112', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', decimals: 9, price: 98.45, priceChange24h: 2.34, volume24h: 45000000 },
  { symbol: 'USDC', name: 'USD Coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png', decimals: 6, price: 1.00, priceChange24h: 0.00, volume24h: 25000000 },
  { symbol: 'BONK', name: 'Bonk', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', logoURI: 'https://arweave.net/hQB3X7Wz0QnORmW0WVjNYGLlJ14mI5X2u0Kq9kqkqkQ', decimals: 5, price: 0.00000045, priceChange24h: -8.92, volume24h: 1800000 },
  { symbol: 'JUP', name: 'Jupiter', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png', decimals: 6, price: 0.85, priceChange24h: 5.67, volume24h: 12000000 },
];

export const SwapInterface: React.FC = () => {
  const [fromToken, setFromToken] = useState<Token>(mockTokens[0]);
  const [toToken, setToToken] = useState<Token>(mockTokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [slippage, setSlippage] = useState(0.5);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for tokens using DexScreener API
  const searchTokens = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setError(null);

    try {
      const result = await dexscreenerService.searchTokens(query, {
        chainId: 'solana',
        minVolume: 1000,
        minMarketCap: 1000,
      });

      const tokens: Token[] = result.tokens.slice(0, 10).map(token => ({
        symbol: token.symbol,
        name: token.name,
        address: token.pairAddress,
        logoURI: token.logoURI || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.pairAddress}/logo.png`,
        decimals: 6,
        price: token.price,
        priceChange24h: token.priceChange24h,
        volume24h: token.volume24h,
      }));

      setSearchResults(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search tokens');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchTokens(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchTokens]);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!swapQuote) return;
    
    setTransactionStatus('pending');
    setError(null);

    try {
      // Simulate Jupiter swap transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setTransactionStatus('success');
      setTimeout(() => {
        setTransactionStatus('idle');
        setFromAmount('');
        setToAmount('');
        setSwapQuote(null);
      }, 2000);
    } catch (err) {
      setTransactionStatus('error');
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setTimeout(() => {
        setTransactionStatus('idle');
      }, 3000);
    }
  };

  // Removed unused formatNumber and formatCurrency helpers

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const TokenSelector: React.FC<{ 
    tokens: Token[]; 
    onSelect: (token: Token) => void; 
    onClose: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    searchLoading: boolean;
    searchResults: Token[];
  }> = ({ tokens, onSelect, onClose, searchQuery, onSearchChange, searchLoading, searchResults }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Select Token</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {/* Search Results */}
          {searchResults.length > 0 && (
            <>
              <div className="text-xs text-gray-400 mb-2">Search Results</div>
              {searchResults.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelect(token);
                    onClose();
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <img 
                    src={token.logoURI} 
                    alt={token.symbol} 
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                    }}
                  />
                  <div className="text-left flex-1">
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </div>
                  {token.price && (
                    <div className="text-right">
                      <div className="text-sm text-white">${token.price.toFixed(6)}</div>
                      {token.priceChange24h !== undefined && (
                        <div className={`text-xs ${getPriceChangeColor(token.priceChange24h)}`}>
                          {formatPercentage(token.priceChange24h)}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
              <div className="border-t border-white/10 my-2"></div>
            </>
          )}

          {/* Popular Tokens */}
          <div className="text-xs text-gray-400 mb-2">Popular Tokens</div>
          {tokens.map((token) => (
            <button
              key={token.address}
              onClick={() => {
                onSelect(token);
                onClose();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              <img 
                src={token.logoURI} 
                alt={token.symbol} 
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                }}
              />
              <div className="text-left flex-1">
                <div className="font-medium text-white">{token.symbol}</div>
                <div className="text-sm text-gray-400">{token.name}</div>
              </div>
              {token.price && (
                <div className="text-right">
                  <div className="text-sm text-white">${token.price.toFixed(6)}</div>
                  {token.priceChange24h !== undefined && (
                    <div className={`text-xs ${getPriceChangeColor(token.priceChange24h)}`}>
                      {formatPercentage(token.priceChange24h)}
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Swap Tokens</h1>
          <p className="text-gray-400">Trade any token on Jupiter</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Swap Interface */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
          {/* From Token */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">From</label>
            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={fromToken.logoURI} 
                    alt={fromToken.symbol} 
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                    }}
                  />
                  <div>
                    <div className="font-medium text-white">{fromToken.symbol}</div>
                    <div className="text-sm text-gray-400">{fromToken.name}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowFromSelector(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Change
                </button>
              </div>
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="w-full mt-3 bg-transparent text-2xl font-bold text-white placeholder-gray-400 focus:outline-none"
              />
              {fromToken.price && (
                <div className="text-sm text-gray-400 mt-1">
                  ≈ ${(parseFloat(fromAmount || '0') * fromToken.price).toFixed(2)} USD
                </div>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">To</label>
            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={toToken.logoURI} 
                    alt={toToken.symbol} 
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                    }}
                  />
                  <div>
                    <div className="font-medium text-white">{toToken.symbol}</div>
                    <div className="text-sm text-gray-400">{toToken.name}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowToSelector(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Change
                </button>
              </div>
              <input
                type="number"
                placeholder="0.0"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className="w-full mt-3 bg-transparent text-2xl font-bold text-white placeholder-gray-400 focus:outline-none"
              />
              {toToken.price && (
                <div className="text-sm text-gray-400 mt-1">
                  ≈ ${(parseFloat(toAmount || '0') * toToken.price).toFixed(2)} USD
                </div>
              )}
            </div>
          </div>

          {/* Swap Quote */}
          {swapQuote && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price Impact</span>
                <span className="text-white">{swapQuote.priceImpactPct.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee</span>
                <span className="text-white">${swapQuote.fee.toFixed(6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Route</span>
                <span className="text-white">{swapQuote.route.length} hops</span>
              </div>
            </div>
          )}

          {/* Slippage Settings */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Slippage Tolerance</label>
            <div className="flex space-x-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    slippage === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!swapQuote || transactionStatus === 'pending'}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              transactionStatus === 'pending'
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {transactionStatus === 'pending' ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : transactionStatus === 'success' ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 bg-green-400 rounded-full"></div>
                <span>Swap Successful!</span>
              </div>
            ) : (
              'Swap'
            )}
          </button>
        </div>

        {/* Token Selectors */}
        {showFromSelector && (
          <TokenSelector
            tokens={mockTokens}
            onSelect={setFromToken}
            onClose={() => setShowFromSelector(false)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchLoading={searchLoading}
            searchResults={searchResults}
          />
        )}

        {showToSelector && (
          <TokenSelector
            tokens={mockTokens}
            onSelect={setToToken}
            onClose={() => setShowToSelector(false)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchLoading={searchLoading}
            searchResults={searchResults}
          />
        )}
      </div>
    </div>
  );
}; 