import React from 'react';
import { useAppSelector } from '../store';
import { HomeDashboard } from '../pages/HomeDashboard';
import { SwapInterface } from './SwapInterface';
import { LiquidityInterface } from './LiquidityInterface';
import { WatchlistView } from './WatchlistView';
import { SettingsPanel } from './SettingsPanel';

interface PageRouterProps {
  databaseManager?: any;
}

export const PageRouter: React.FC<PageRouterProps> = ({ databaseManager }) => {
  const { navigation } = useAppSelector((state) => state.ui);
  const { activeTab } = navigation;

  const renderPage = () => {
    switch (activeTab) {
      case 'positions':
        return <HomeDashboard databaseManager={databaseManager} />;
      case 'swap':
        return <SwapInterface />;
      case 'liquidity':
        return <LiquidityInterface />;
      case 'watchlists':
        return <WatchlistView />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <HomeDashboard databaseManager={databaseManager} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Page content with bottom padding for tab navigation */}
      <div className="pb-20">
        {renderPage()}
      </div>
    </div>
  );
}; 