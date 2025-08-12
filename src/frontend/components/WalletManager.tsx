import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { 
  addWallet, 
  removeWallet, 
  switchWallet, 
  generateWallet, 
  importWallet,
  updateWalletName 
} from '../store/slices/walletSlice';
import { Copy, Plus, Trash2, Edit, Key, Download, Wallet, ChevronDown, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

export const WalletManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { wallets, activeWalletId } = useAppSelector((state) => state.wallet);
  const { theme } = useAppSelector((state) => state.ui);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'generate' | 'import' | null>(null);
  const [walletName, setWalletName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const activeWallet = wallets.find(w => w.id === activeWalletId);

  const handleGenerateWallet = () => {
    if (walletName.trim()) {
      // Generate a mock public key (in real implementation, this would use proper key generation)
      const mockPublicKey = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch(generateWallet({ name: walletName.trim() }));
      setWalletName('');
      setIsModalOpen(false);
      setModalType(null);
    }
  };

  const handleImportWallet = () => {
    if (walletName.trim() && privateKey.trim()) {
      // In real implementation, this would validate and derive public key from private key
      const mockPublicKey = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch(importWallet({ name: walletName.trim(), privateKey: privateKey.trim() }));
      setWalletName('');
      setPrivateKey('');
      setIsModalOpen(false);
      setModalType(null);
    }
  };

  const handleSwitchWallet = (walletId: string) => {
    dispatch(switchWallet(walletId));
    setShowWalletDropdown(false);
  };

  const handleRemoveWallet = (walletId: string) => {
    if (wallets.length > 1) {
      dispatch(removeWallet(walletId));
    }
  };

  const handleEditWallet = (walletId: string, currentName: string) => {
    setEditingWalletId(walletId);
    setWalletName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingWalletId && walletName.trim()) {
      dispatch(updateWalletName({ id: editingWalletId, name: walletName.trim() }));
      setEditingWalletId(null);
      setWalletName('');
    }
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

  const exportWallet = (wallet: any) => {
    // In a real implementation, this would export the wallet data securely
    const walletData = {
      name: wallet.name,
      publicKey: wallet.publicKey,
      // Note: In a real app, you'd never export private keys in plain text
    };
    
    const blob = new Blob([JSON.stringify(walletData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wallet.name}-wallet.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateNewWallet = () => {
    const defaultName = `Wallet ${wallets.length + 1}`;
    setWalletName(defaultName);
    setModalType('generate');
    setIsModalOpen(true);
  };

  return (
    <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Wallet Manager
        </h3>
        <div className="flex space-x-2">
          <Button
            onClick={generateNewWallet}
            className="flex items-center space-x-2"
            size="sm"
          >
            <Plus size={16} />
            <span>New Wallet</span>
          </Button>
          <Button
            onClick={() => {
              setModalType('import');
              setIsModalOpen(true);
            }}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Key size={16} />
            <span>Import</span>
          </Button>
        </div>
      </div>

      {/* Active Wallet Display with Dropdown */}
      {activeWallet && (
        <div className={`mb-4 p-4 rounded-lg border-2 ${
          theme === 'dark' ? 'bg-gray-700 border-blue-500' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wallet size={20} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
              <div>
                <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {activeWallet.name}
                </h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {activeWallet.publicKey.slice(0, 8)}...{activeWallet.publicKey.slice(-8)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => copyToClipboard(activeWallet.publicKey)}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                {copiedAddress === activeWallet.publicKey ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
                )}
              </Button>
              <Button
                onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                <ChevronDown size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
              </Button>
            </div>
          </div>

          {/* Wallet Dropdown */}
          {showWalletDropdown && (
            <div className={`mt-3 p-3 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      wallet.id === activeWalletId
                        ? theme === 'dark' ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'
                        : theme === 'dark' ? 'hover:bg-gray-500' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleSwitchWallet(wallet.id)}
                  >
                    <div className="flex items-center space-x-2">
                      {wallet.id === activeWalletId && (
                        <Check size={14} className="text-blue-500" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {wallet.name}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {wallet.publicKey.slice(0, 6)}...{wallet.publicKey.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {wallet.id === activeWalletId ? 'Active' : 'Switch'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wallet List */}
      <div className="space-y-2">
        <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          All Wallets ({wallets.length})
        </h4>
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              wallet.id === activeWalletId
                ? theme === 'dark' ? 'bg-gray-700 border-blue-500' : 'bg-blue-50 border-blue-200'
                : theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                {editingWalletId === wallet.id ? (
                  <Input
                    type="text"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    className="w-full"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                    autoFocus
                  />
                ) : (
                  <div>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {wallet.name}
                      {wallet.id === activeWalletId && (
                        <Badge className="ml-2 text-xs" variant="secondary">
                          Active
                        </Badge>
                      )}
                    </h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {editingWalletId === wallet.id ? (
                <Button
                  onClick={handleSaveEdit}
                  size="sm"
                  variant="ghost"
                >
                  <Check size={14} className="text-green-500" />
                </Button>
              ) : (
                <>
                  {wallet.id !== activeWalletId && (
                    <Button
                      onClick={() => handleSwitchWallet(wallet.id)}
                      size="sm"
                      variant="outline"
                    >
                      Switch
                    </Button>
                  )}
                  <Button
                    onClick={() => handleEditWallet(wallet.id, wallet.name)}
                    size="sm"
                    variant="ghost"
                  >
                    <Edit size={14} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
                  </Button>
                  <Button
                    onClick={() => exportWallet(wallet)}
                    size="sm"
                    variant="ghost"
                  >
                    <Download size={14} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
                  </Button>
                  {wallets.length > 1 && (
                    <Button
                      onClick={() => handleRemoveWallet(wallet.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {modalType === 'generate' ? 'Generate New Wallet' : 'Import Wallet'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Wallet Name
                </label>
                <Input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="Enter wallet name"
                />
              </div>
              
              {modalType === 'import' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Private Key
                  </label>
                  <textarea
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="Enter private key"
                    rows={3}
                  />
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    setModalType(null);
                    setWalletName('');
                    setPrivateKey('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={modalType === 'generate' ? handleGenerateWallet : handleImportWallet}
                  className="flex-1"
                >
                  {modalType === 'generate' ? 'Generate' : 'Import'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 