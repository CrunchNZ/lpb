import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { setActiveTab } from '../store/slices/uiSlice';
import { HomeDashboard } from '../pages/HomeDashboard';
import { SwapInterface } from './SwapInterface';
import { LiquidityInterface } from './LiquidityInterface';
import { WatchlistView } from './WatchlistView';
import { SettingsPanel } from './SettingsPanel';
import { TokenDetailView } from './TokenDetailView';
import { DatabaseManager } from '../../backend/database/DatabaseManager';
import { WatchlistToken } from '../../backend/database';
import { useWallet } from '@solana/wallet-adapter-react';

interface PageRouterProps {
  databaseManager?: DatabaseManager | null;
}

export const PageRouter: React.FC<PageRouterProps> = ({ databaseManager }) => {
  const dispatch = useAppDispatch();
  const { navigation } = useAppSelector((state) => state.ui);
  const { activeTab } = navigation;
  const [selectedToken, setSelectedToken] = useState<WatchlistToken | null>(null);
  const { connected } = useWallet();

  const handleTokenSelect = (token: WatchlistToken) => {
    setSelectedToken(token);
    dispatch(setActiveTab('token-detail'));
  };

  const handleBackToWatchlist = () => {
    setSelectedToken(null);
    dispatch(setActiveTab('watchlists'));
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'positions':
        return <HomeDashboard databaseManager={databaseManager} />;
      case 'swap':
        return <SwapInterface />;
      case 'liquidity':
        return <LiquidityInterface />;
      case 'watchlists':
        return <WatchlistView onTokenSelect={handleTokenSelect} />;
      case 'token-detail':
        return selectedToken ? (
          <TokenDetailView 
            token={selectedToken} 
            onBack={handleBackToWatchlist}
          />
        ) : (
          <WatchlistView onTokenSelect={handleTokenSelect} />
        );
      case 'settings':
        return <SettingsPanel />;
      default:
        // If wallet is connected, show wallet dashboard by default
        if (connected) {
          return <HomeDashboard databaseManager={databaseManager} />;
        }
        return <HomeDashboard databaseManager={databaseManager} />;
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Page content with bottom padding for tab navigation */}
      <div className="pb-20">
        {renderPage()}
      </div>
    </div>
  );
}; 