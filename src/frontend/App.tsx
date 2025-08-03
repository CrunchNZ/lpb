import React from 'react';
import { useAppSelector, useAppDispatch } from './store';
import { setActiveTab } from './store/slices/uiSlice';
import { PageRouter } from './components/PageRouter';
import { BottomTabNavigation } from './components/BottomTabNavigation';
import { ThemeProvider } from './components/ThemeProvider';
import { ModalManager } from './components/ModalManager';
import { AnimationProvider } from './components/AnimationProvider';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { navigation } = useAppSelector((state) => state.ui);
  const { activeTab, tabBadges } = navigation;

  const handleTabChange = (tabId: string) => {
    dispatch(setActiveTab(tabId as any));
  };

  return (
    <ThemeProvider>
      <AnimationProvider>
        <div className="apple-app min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 apple-transition">
          {/* Main content */}
          <PageRouter />
          
          {/* Bottom tab navigation */}
          <BottomTabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          
          {/* Modal manager for detailed views */}
          <ModalManager />
        </div>
      </AnimationProvider>
    </ThemeProvider>
  );
}; 