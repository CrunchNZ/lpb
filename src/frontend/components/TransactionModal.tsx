/**
 * Transaction Modal Component
 * 
 * Provides comprehensive transaction management UI:
 * - Transaction confirmation dialog
 * - Fee estimation display
 * - Slippage warning system
 * - Transaction status tracking
 * - Error handling and user feedback
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

// Transaction status types
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

// Transaction details
export interface TransactionDetails {
  signature: string;
  status: TransactionStatus;
  amount: number;
  recipient: string;
  fee: number;
  slippage: number;
  priceImpact: number;
  timestamp: Date;
  error?: string;
  confirmations?: number;
  blockTime?: number;
}

// Transaction modal props
export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: TransactionDetails;
  onConfirm?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onConfirm,
  onCancel,
  onRetry,
  isLoading = false,
  error,
}) => {
  const { publicKey, connected } = useWallet();
  const [copiedSignature, setCopiedSignature] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Copy signature to clipboard
  const copySignature = async (signature: string) => {
    try {
      await navigator.clipboard.writeText(signature);
      setCopiedSignature(signature);
      setTimeout(() => setCopiedSignature(null), 2000);
    } catch (err) {
      console.error('Failed to copy signature:', err);
    }
  };

  // Open transaction in explorer
  const openInExplorer = (signature: string) => {
    const explorerUrl = `https://solscan.io/tx/${signature}`;
    window.open(explorerUrl, '_blank');
  };

  // Format amount
  const formatAmount = (amount: number, decimals: number = 6) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    }).format(amount);
  };

  // Format fee
  const formatFee = (fee: number) => {
    return `${(fee / 1e9).toFixed(6)} SOL`;
  };

  // Get status icon
  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  // Get status color
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Get slippage warning level
  const getSlippageWarning = (slippage: number) => {
    if (slippage > 5) return 'high';
    if (slippage > 2) return 'medium';
    return 'low';
  };

  // Get price impact warning level
  const getPriceImpactWarning = (priceImpact: number) => {
    if (priceImpact > 5) return 'high';
    if (priceImpact > 2) return 'medium';
    return 'low';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Transaction Details</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet Connection Status */}
          {!connected && (
            <div className="flex items-center justify-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Please connect your wallet to continue
              </span>
              <WalletMultiButton className="ml-2" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Transaction Status */}
          {transaction && (
            <div className="space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(transaction.status)}
                  <span className="font-medium">Transaction {transaction.status}</span>
                </div>
                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status.toUpperCase()}
                </Badge>
              </div>

              {/* Transaction Signature */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Transaction Signature</label>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <code className="text-xs flex-1 truncate">
                    {transaction.signature}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copySignature(transaction.signature)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openInExplorer(transaction.signature)}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                {copiedSignature === transaction.signature && (
                  <span className="text-xs text-green-600">Copied to clipboard!</span>
                )}
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-sm text-gray-900">
                    {formatAmount(transaction.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fee</label>
                  <p className="text-sm text-gray-900">
                    {formatFee(transaction.fee)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Slippage</label>
                  <p className={`text-sm ${
                    getSlippageWarning(transaction.slippage) === 'high' 
                      ? 'text-red-600' 
                      : getSlippageWarning(transaction.slippage) === 'medium'
                      ? 'text-yellow-600'
                      : 'text-gray-900'
                  }`}>
                    {transaction.slippage.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Price Impact</label>
                  <p className={`text-sm ${
                    getPriceImpactWarning(transaction.priceImpact) === 'high' 
                      ? 'text-red-600' 
                      : getPriceImpactWarning(transaction.priceImpact) === 'medium'
                      ? 'text-yellow-600'
                      : 'text-gray-900'
                  }`}>
                    {transaction.priceImpact.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {(getSlippageWarning(transaction.slippage) === 'high' || 
                getPriceImpactWarning(transaction.priceImpact) === 'high') && (
                <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">High Impact Warning</p>
                    <p className="text-xs mt-1">
                      This transaction has high slippage or price impact. Please review carefully.
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmation Progress */}
              {transaction.status === 'pending' && transaction.confirmations !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confirmations</span>
                    <span>{transaction.confirmations}/32</span>
                  </div>
                  <Progress value={(transaction.confirmations / 32) * 100} className="h-2" />
                </div>
              )}

              {/* Advanced Details */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Details
                </Button>
                
                {showAdvanced && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Recipient:</span>
                      <code className="text-gray-600">{transaction.recipient}</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Timestamp:</span>
                      <span>{transaction.timestamp.toLocaleString()}</span>
                    </div>
                    {transaction.blockTime && (
                      <div className="flex justify-between">
                        <span>Block Time:</span>
                        <span>{new Date(transaction.blockTime * 1000).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Processing transaction...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            {transaction?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onRetry}
                  className="flex-1"
                >
                  Retry
                </Button>
              </>
            )}
            
            {transaction?.status === 'failed' && (
              <Button
                onClick={onRetry}
                className="flex-1"
              >
                Retry Transaction
              </Button>
            )}
            
            {!transaction && onConfirm && (
              <Button
                onClick={onConfirm}
                disabled={!connected || isLoading}
                className="flex-1"
              >
                Confirm Transaction
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal; 