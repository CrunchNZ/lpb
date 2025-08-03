import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  loadingStates: {
    [key: string]: boolean;
  };
  modals: {
    [key: string]: {
      open: boolean;
      data?: any;
    };
  };
  selectedTab: string;
  breadcrumbs: Array<{
    label: string;
    path: string;
  }>;
  errorBoundary: {
    hasError: boolean;
    error: Error | null;
  };
  // Navigation state management
  navigation: {
    activeTab: 'positions' | 'swap' | 'liquidity' | 'watchlists' | 'settings';
    modalStack: Array<{
      id: string;
      component: string;
      data?: any;
    }>;
    navigationHistory: Array<{
      tab: string;
      timestamp: number;
    }>;
    tabBadges: {
      [key: string]: number;
    };
  };
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  notifications: [],
  loadingStates: {},
  modals: {},
  selectedTab: 'dashboard',
  breadcrumbs: [{ label: 'Dashboard', path: '/' }],
  errorBoundary: {
    hasError: false,
    error: null,
  },
  // Navigation state management
  navigation: {
    activeTab: 'positions',
    modalStack: [],
    navigationHistory: [{ tab: 'positions', timestamp: Date.now() }],
    tabBadges: {},
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
      };
      state.notifications.unshift(notification);
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoadingState: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loadingStates[action.payload.key] = action.payload.loading;
    },
    clearLoadingState: (state, action: PayloadAction<string>) => {
      delete state.loadingStates[action.payload];
    },
    openModal: (state, action: PayloadAction<{ key: string; data?: any }>) => {
      state.modals[action.payload.key] = {
        open: true,
        data: action.payload.data,
      };
    },
    closeModal: (state, action: PayloadAction<string>) => {
      if (state.modals[action.payload]) {
        state.modals[action.payload].open = false;
      }
    },
    setSelectedTab: (state, action: PayloadAction<string>) => {
      state.selectedTab = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<{ label: string; path: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [{ label: 'Dashboard', path: '/' }];
    },
    setErrorBoundary: (state, action: PayloadAction<{ hasError: boolean; error: Error | null }>) => {
      state.errorBoundary = action.payload;
    },
    clearErrorBoundary: (state) => {
      state.errorBoundary = {
        hasError: false,
        error: null,
      };
    },
    // Navigation actions
    setActiveTab: (state, action: PayloadAction<'positions' | 'swap' | 'liquidity' | 'watchlists' | 'settings'>) => {
      state.navigation.activeTab = action.payload;
      state.navigation.navigationHistory.push({
        tab: action.payload,
        timestamp: Date.now(),
      });
      // Keep only last 20 navigation entries
      if (state.navigation.navigationHistory.length > 20) {
        state.navigation.navigationHistory = state.navigation.navigationHistory.slice(-20);
      }
    },
    pushModal: (state, action: PayloadAction<{ id: string; component: string; data?: any }>) => {
      state.navigation.modalStack.push(action.payload);
    },
    popModal: (state) => {
      state.navigation.modalStack.pop();
    },
    clearModals: (state) => {
      state.navigation.modalStack = [];
    },
    setTabBadge: (state, action: PayloadAction<{ tab: string; count: number }>) => {
      state.navigation.tabBadges[action.payload.tab] = action.payload.count;
    },
    clearTabBadge: (state, action: PayloadAction<string>) => {
      delete state.navigation.tabBadges[action.payload];
    },
    clearAllTabBadges: (state) => {
      state.navigation.tabBadges = {};
    },
    // Detailed view modal actions
    openPositionDetail: (state, action: PayloadAction<{ position: any; onClose?: (() => void) | undefined; onUpdate?: ((id: string, updates: any) => void) | undefined }>) => {
      state.navigation.modalStack.push({
        id: `position-${action.payload.position.id}`,
        component: 'PositionDetailView',
        data: action.payload,
      });
    },
    openTokenDetail: (state, action: PayloadAction<{ token: any; onClose?: () => void; onAddToWatchlist?: ((token: any) => void) | undefined; onRemoveFromWatchlist?: ((symbol: string) => void) | undefined; isInWatchlist?: boolean }>) => {
      state.navigation.modalStack.push({
        id: `token-${action.payload.token.symbol}`,
        component: 'TokenDetailView',
        data: action.payload,
      });
    },
    openWatchlistDetail: (state, action: PayloadAction<{ watchlist: any; tokens: any[]; tokenData: any; onClose?: () => void; onRemoveTokens?: ((symbols: string[]) => void) | undefined; onAddToken?: ((token: any) => void) | undefined; onRefreshData?: (() => void) | undefined; onTokenSelect?: ((token: any) => void) | undefined }>) => {
      state.navigation.modalStack.push({
        id: `watchlist-${action.payload.watchlist.id}`,
        component: 'WatchlistDetailView',
        data: action.payload,
      });
    },
    openPoolDetail: (state, action: PayloadAction<{ pool: any; onClose?: () => void; onAddLiquidity?: (amountA: number, amountB: number) => Promise<void>; onRemoveLiquidity?: (percentage: number) => Promise<void>; onHarvestRewards?: () => Promise<void>; onRefreshData?: () => Promise<void> }>) => {
      state.navigation.modalStack.push({
        id: `pool-${action.payload.pool.id}`,
        component: 'PoolDetailView',
        data: action.payload,
      });
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setSidebarOpen,
  toggleSidebar,
  addNotification,
  markNotificationAsRead,
  removeNotification,
  clearNotifications,
  setLoadingState,
  clearLoadingState,
  openModal,
  closeModal,
  setSelectedTab,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
  setErrorBoundary,
  clearErrorBoundary,
  // Navigation actions
  setActiveTab,
  pushModal,
  popModal,
  clearModals,
  setTabBadge,
  clearTabBadge,
  clearAllTabBadges,
  // Detailed view modal actions
  openPositionDetail,
  openTokenDetail,
  openWatchlistDetail,
  openPoolDetail,
} = uiSlice.actions;

export default uiSlice.reducer; 