import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from './store';
import { setActiveTab } from './store/slices/uiSlice';
import { PageRouter } from './components/PageRouter';
import { BottomTabNavigation } from './components/BottomTabNavigation';
import { ThemeProvider } from './components/ThemeProvider';
import { ModalManager } from './components/ModalManager';
import { AnimationProvider } from './components/AnimationProvider';
import { WalletProvider } from './providers/WalletProvider';
import { WalletConnect } from './components/WalletConnect';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { navigation } = useAppSelector((state) => state.ui);
  const { activeTab } = navigation;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (tabId: string) => {
    dispatch(setActiveTab(tabId as any));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Liquidity Sentinel...</p>
        </div>
      </div>
    );
  }

  return (
    <WalletProvider autoConnect={true}>
      <ThemeProvider>
        <AnimationProvider>
          <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 apple-transition overflow-hidden">
            {/* Header with Wallet Connect */}
            <div className="flex-shrink-0 bg-black/20 backdrop-blur-sm border-b border-white/10 z-50">
              <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-white">Solana Liquidity Sentinel</h1>
                <WalletConnect />
              </div>
            </div>

            {/* Main content with scrolling */}
            <div className="flex-1 overflow-y-auto">
              <PageRouter databaseManager={null} />
            </div>

            {/* Bottom tab navigation */}
            <div className="flex-shrink-0">
              <BottomTabNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Modal manager for detailed views */}
            <ModalManager />
          </div>
        </AnimationProvider>
      </ThemeProvider>
    </WalletProvider>
  );
};
