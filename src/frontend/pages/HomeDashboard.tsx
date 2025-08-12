import React, { useState } from 'react';
import { useAppSelector } from '../store';
import { WalletDashboard } from '../components/WalletDashboard';
import { TokenSearch } from '../components/TokenSearch';
import { WatchlistView } from '../components/WatchlistView';
import { DexScreenerView } from '../components/DexScreenerView';
import { DatabaseManager } from '../../backend/database/DatabaseManager';

interface HomeDashboardProps {
  databaseManager?: DatabaseManager | null;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ databaseManager }) => {
  const { theme } = useAppSelector((state) => state.ui);
  const { navigation } = useAppSelector((state) => state.ui);
  const [activeTab, setActiveTab] = useState<'wallet' | 'tokens' | 'watchlists' | 'dexscreener'>('wallet');

  if (activeTab === 'wallet') {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">LS</span>
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Liquidity Sentinel
                  </h1>
                </div>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                  Autonomous DeFi Dashboard
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Tabs */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 mb-8">
            <div className="flex space-x-2">
              {[
                { id: 'wallet', label: 'Wallet Portfolio', icon: '💼' },
                { id: 'tokens', label: 'Token Search', icon: '🔍' },
                { id: 'watchlists', label: 'Watchlists', icon: '⭐' },
                { id: 'dexscreener', label: 'DexScreener', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Dashboard */}
          <WalletDashboard />
        </main>
      </div>
    );
  }

  // Other tabs
  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LS</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Liquidity Sentinel
                </h1>
              </div>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                Autonomous DeFi Dashboard
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 mb-8">
          <div className="flex space-x-2">
            {[
              { id: 'wallet', label: 'Wallet Portfolio', icon: '💼' },
              { id: 'tokens', label: 'Token Search', icon: '🔍' },
              { id: 'watchlists', label: 'Watchlists', icon: '⭐' },
              { id: 'dexscreener', label: 'DexScreener', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'tokens' && (
          <TokenSearch />
        )}

        {activeTab === 'watchlists' && (
          <WatchlistView onTokenSelect={() => {}} />
        )}

        {activeTab === 'dexscreener' && (
          <DexScreenerView databaseManager={databaseManager} />
        )}
      </main>
    </div>
  );
}; 