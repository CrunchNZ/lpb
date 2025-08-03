import { useAppSelector, useAppDispatch } from './index';
import {
  setStatus,
  setConnected,
  updateConfig,
  setError,
  setWalletAddress,
  updatePerformance,
  startBot,
  pauseBot,
  stopBot,
  resetBot,
} from './slices/botSlice';
import {
  setLoading as setPositionsLoading,
  setError as setPositionsError,
  setPositions,
  addPosition,
  updatePosition,
  removePosition,
  setSelectedPosition,
  setFilters as setPositionsFilters,
  clearFilters as clearPositionsFilters,
  closePosition,
  pausePosition,
  resumePosition,
  updatePositionPrice,
} from './slices/positionsSlice';
import {
  setLoading as setPerformanceLoading,
  setError as setPerformanceError,
  setMetrics,
  addMetric,
  setTimeRange,
  setSelectedMetric,
  setFilters as setPerformanceFilters,
  clearFilters as clearPerformanceFilters,
  updateSummary,
  updateStrategyBreakdown,
} from './slices/performanceSlice';
import {
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
} from './slices/uiSlice';

// Bot hooks
export const useBot = () => {
  const dispatch = useAppDispatch();
  const bot = useAppSelector(state => state.bot);

  return {
    ...bot,
    actions: {
      setStatus: (status: 'idle' | 'running' | 'paused' | 'error') => dispatch(setStatus(status)),
      setConnected: (connected: boolean) => dispatch(setConnected(connected)),
      updateConfig: (config: any) => dispatch(updateConfig(config)),
      setError: (error: string | null) => dispatch(setError(error)),
      setWalletAddress: (address: string | null) => dispatch(setWalletAddress(address)),
      updatePerformance: (performance: any) => dispatch(updatePerformance(performance)),
      startBot: () => dispatch(startBot()),
      pauseBot: () => dispatch(pauseBot()),
      stopBot: () => dispatch(stopBot()),
      resetBot: () => dispatch(resetBot()),
    },
  };
};

// Positions hooks
export const usePositions = () => {
  const dispatch = useAppDispatch();
  const positions = useAppSelector(state => state.positions);

  return {
    ...positions,
    actions: {
      setLoading: (loading: boolean) => dispatch(setPositionsLoading(loading)),
      setError: (error: string | null) => dispatch(setPositionsError(error)),
      setPositions: (positions: any[]) => dispatch(setPositions(positions)),
      addPosition: (position: any) => dispatch(addPosition(position)),
      updatePosition: (id: string, updates: any) => dispatch(updatePosition({ id, updates })),
      removePosition: (id: string) => dispatch(removePosition(id)),
      setSelectedPosition: (id: string | null) => dispatch(setSelectedPosition(id)),
      setFilters: (filters: any) => dispatch(setPositionsFilters(filters)),
      clearFilters: () => dispatch(clearPositionsFilters()),
      closePosition: (id: string) => dispatch(closePosition(id)),
      pausePosition: (id: string) => dispatch(pausePosition(id)),
      resumePosition: (id: string) => dispatch(resumePosition(id)),
      updatePositionPrice: (id: string, currentPrice: number, pnl: number) => 
        dispatch(updatePositionPrice({ id, currentPrice, pnl })),
    },
  };
};

// Performance hooks
export const usePerformance = () => {
  const dispatch = useAppDispatch();
  const performance = useAppSelector(state => state.performance);

  return {
    ...performance,
    actions: {
      setLoading: (loading: boolean) => dispatch(setPerformanceLoading(loading)),
      setError: (error: string | null) => dispatch(setPerformanceError(error)),
      setMetrics: (metrics: any[]) => dispatch(setMetrics(metrics)),
      addMetric: (metric: any) => dispatch(addMetric(metric)),
      setTimeRange: (timeRange: '1d' | '7d' | '30d' | '90d' | '1y') => dispatch(setTimeRange(timeRange)),
      setSelectedMetric: (metric: 'value' | 'pnl' | 'apy') => dispatch(setSelectedMetric(metric)),
      setFilters: (filters: any) => dispatch(setPerformanceFilters(filters)),
      clearFilters: () => dispatch(clearPerformanceFilters()),
      updateSummary: (summary: any) => dispatch(updateSummary(summary)),
      updateStrategyBreakdown: (breakdown: any) => dispatch(updateStrategyBreakdown(breakdown)),
    },
  };
};

// UI hooks
export const useUI = () => {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(state => state.ui);

  return {
    ...ui,
    actions: {
      setTheme: (theme: 'light' | 'dark') => dispatch(setTheme(theme)),
      toggleTheme: () => dispatch(toggleTheme()),
      setSidebarOpen: (open: boolean) => dispatch(setSidebarOpen(open)),
      toggleSidebar: () => dispatch(toggleSidebar()),
      addNotification: (notification: any) => dispatch(addNotification(notification)),
      markNotificationAsRead: (id: string) => dispatch(markNotificationAsRead(id)),
      removeNotification: (id: string) => dispatch(removeNotification(id)),
      clearNotifications: () => dispatch(clearNotifications()),
      setLoadingState: (key: string, loading: boolean) => dispatch(setLoadingState({ key, loading })),
      clearLoadingState: (key: string) => dispatch(clearLoadingState(key)),
      openModal: (key: string, data?: any) => dispatch(openModal({ key, data })),
      closeModal: (key: string) => dispatch(closeModal(key)),
      setSelectedTab: (tab: string) => dispatch(setSelectedTab(tab)),
      setBreadcrumbs: (breadcrumbs: any[]) => dispatch(setBreadcrumbs(breadcrumbs)),
      addBreadcrumb: (breadcrumb: any) => dispatch(addBreadcrumb(breadcrumb)),
      clearBreadcrumbs: () => dispatch(clearBreadcrumbs()),
      setErrorBoundary: (error: any) => dispatch(setErrorBoundary(error)),
      clearErrorBoundary: () => dispatch(clearErrorBoundary()),
    },
  };
};

// Convenience hooks
export const useTheme = () => {
  const { theme, actions } = useUI();
  return { theme, setTheme: actions.setTheme, toggleTheme: actions.toggleTheme };
};

export const useNotifications = () => {
  const { notifications, actions } = useUI();
  return { notifications, actions };
};

export const useLoading = (key: string) => {
  const { loadingStates, actions } = useUI();
  const isLoading = loadingStates[key] || false;
  
  return {
    isLoading,
    setLoading: (loading: boolean) => actions.setLoadingState(key, loading),
    clearLoading: () => actions.clearLoadingState(key),
  };
};

export const useModal = (key: string) => {
  const { modals, actions } = useUI();
  const modal = modals[key] || { open: false, data: null };
  
  return {
    isOpen: modal.open,
    data: modal.data,
    open: (data?: any) => actions.openModal(key, data),
    close: () => actions.closeModal(key),
  };
}; 