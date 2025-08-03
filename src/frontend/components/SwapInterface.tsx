import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, TrendingUp, Zap, Settings, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  address: string;
  logoURI: string;
  decimals: number;
}

interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: number;
  route: any[];
}

// Mock tokens for demonstration
const mockTokens: Token[] = [
  { symbol: 'SOL', name: 'Solana', address: 'So11111111111111111111111111111111111111112', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', decimals: 9 },
  { symbol: 'USDC', name: 'USD Coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png', decimals: 6 },
  { symbol: 'BONK', name: 'Bonk', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', logoURI: 'https://arweave.net/hQB3X7Wz0QnORmW0WVjNYGLlJ14mI5X2u0Kq9kqkqkQ', decimals: 5 },
  { symbol: 'JUP', name: 'Jupiter', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png', decimals: 6 },
];

export const SwapInterface: React.FC = () => {
  const [fromToken, setFromToken] = useState<Token>(mockTokens[0]);
  const [toToken, setToToken] = useState<Token>(mockTokens[1]);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState<boolean>(false);
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [showTokenSelector, setShowTokenSelector] = useState<'from' | 'to' | null>(null);

  // Mock swap quote generation
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        const mockQuote: SwapQuote = {
          inputMint: fromToken.address,
          outputMint: toToken.address,
          inputAmount: fromAmount,
          outputAmount: (parseFloat(fromAmount) * 0.98).toFixed(6), // Mock conversion
          priceImpact: 0.5,
          fee: 0.3,
          route: [{ platform: 'Jupiter', steps: 1 }]
        };
        setSwapQuote(mockQuote);
        setToAmount(mockQuote.outputAmount);
        setIsLoading(false);
      }, 1000);
    } else {
      setSwapQuote(null);
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!swapQuote) return;
    
    setTransactionStatus('pending');
    // Simulate transaction
    setTimeout(() => {
      setTransactionStatus('success');
      setTimeout(() => {
        setTransactionStatus('idle');
        setFromAmount('');
        setToAmount('');
        setSwapQuote(null);
      }, 2000);
    }, 3000);
  };

  const formatNumber = (value: string | number, decimals: number = 6) => {
    return parseFloat(value.toString()).toFixed(decimals);
  };

  const TokenSelector: React.FC<{ tokens: Token[]; onSelect: (token: Token) => void; onClose: () => void }> = ({ tokens, onSelect, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Select Token</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tokens.map((token) => (
            <button
              key={token.address}
              onClick={() => {
                onSelect(token);
                onClose();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 rounded-full" />
              <div className="text-left">
                <div className="font-medium text-white">{token.symbol}</div>
                <div className="text-sm text-gray-400">{token.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="w-8 h-8 text-purple-400" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Swap
                </h1>
              </div>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                Jupiter Integration
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Swap Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          {/* From Token */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowTokenSelector('from')}
                  className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-2 transition-colors"
                >
                  <img src={fromToken.logoURI} alt={fromToken.symbol} className="w-8 h-8 rounded-full" />
                  <div className="text-left">
                    <div className="font-medium text-white">{fromToken.symbol}</div>
                    <div className="text-sm text-gray-400">{fromToken.name}</div>
                  </div>
                </button>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-right text-xl font-semibold text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-4">
            <button
              onClick={handleSwapTokens}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* To Token */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowTokenSelector('to')}
                  className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-2 transition-colors"
                >
                  <img src={toToken.logoURI} alt={toToken.symbol} className="w-8 h-8 rounded-full" />
                  <div className="text-left">
                    <div className="font-medium text-white">{toToken.symbol}</div>
                    <div className="text-sm text-gray-400">{toToken.name}</div>
                  </div>
                </button>
                <div className="text-right">
                  <div className="text-xl font-semibold text-white">
                    {isLoading ? '...' : toAmount || '0.0'}
                  </div>
                  {swapQuote && (
                    <div className="text-sm text-gray-400">
                      1 {fromToken.symbol} = {formatNumber(parseFloat(toAmount) / parseFloat(fromAmount), 6)} {toToken.symbol}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Swap Quote Details */}
          {swapQuote && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Price Impact</span>
                  <span className={`text-sm ${swapQuote.priceImpact < 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {swapQuote.priceImpact}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Network Fee</span>
                  <span className="text-sm text-white">{swapQuote.fee} SOL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Route</span>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-white">Jupiter</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slippage Settings */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Slippage Tolerance</span>
              <button
                onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>{slippage}%</span>
              </button>
            </div>
            {showSlippageSettings && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <div className="flex space-x-2 mb-3">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        slippage === value
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                  placeholder="Custom slippage"
                />
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!swapQuote || isLoading || transactionStatus === 'pending'}
            className={`w-full py-4 rounded-xl font-semibold transition-all ${
              !swapQuote || isLoading || transactionStatus === 'pending'
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            {transactionStatus === 'pending' ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Swapping...</span>
              </div>
            ) : transactionStatus === 'success' ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Swap Successful!</span>
              </div>
            ) : (
              'Swap'
            )}
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">SOL → USDC</div>
                    <div className="text-xs text-gray-400">2.5 SOL for 245.50 USDC</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">2 min ago</div>
                  <div className="text-xs text-green-400">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <TokenSelector
          tokens={mockTokens}
          onSelect={(token) => {
            if (showTokenSelector === 'from') {
              setFromToken(token);
            } else {
              setToToken(token);
            }
          }}
          onClose={() => setShowTokenSelector(null)}
        />
      )}
    </div>
  );
}; 