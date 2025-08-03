import React from 'react';
import { Home, ArrowLeftRight, Droplets, Star, Settings } from 'lucide-react';
import { useTheme } from '../store/hooks';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface BottomTabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const tabItems: TabItem[] = [
  {
    id: 'positions',
    label: 'Positions',
    icon: Home,
  },
  {
    id: 'swap',
    label: 'Swap',
    icon: ArrowLeftRight,
  },
  {
    id: 'liquidity',
    label: 'Liquidity',
    icon: Droplets,
  },
  {
    id: 'watchlists',
    label: 'Watch',
    icon: Star,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
  },
];

export const BottomTabNavigation: React.FC<BottomTabNavigationProps> = ({
  activeTab,
  onTabChange,
  className = '',
}) => {
  const { theme } = useTheme();

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      {/* Background blur and border */}
      <div className="bg-black/20 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-300 ease-out ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                  )}

                  {/* Icon with badge */}
                  <div className="relative">
                    <Icon
                      className={`w-6 h-6 transition-all duration-300 ${
                        isActive ? 'scale-110' : 'scale-100'
                      }`}
                    />
                    {tab.badge && tab.badge > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-xs font-medium mt-1 transition-all duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}>
                    {tab.label}
                  </span>

                  {/* Active background */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent rounded-t-lg" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Safe area for mobile devices */}
      <div className="h-safe-area-inset-bottom bg-black/20 backdrop-blur-xl" />
    </div>
  );
};