import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import botReducer from './slices/botSlice';
import positionsReducer from './slices/positionsSlice';
import performanceReducer from './slices/performanceSlice';
import uiReducer from './slices/uiSlice';
import dexscreenerReducer from './slices/dexscreenerSlice';

export const store = configureStore({
  reducer: {
    bot: botReducer,
    positions: positionsReducer,
    performance: performanceReducer,
    ui: uiReducer,
    dexscreener: dexscreenerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['bot.lastUpdate'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 