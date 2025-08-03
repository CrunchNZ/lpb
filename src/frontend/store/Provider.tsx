import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './index';

interface ProviderProps {
  children: React.ReactNode;
}

export const Provider: React.FC<ProviderProps> = ({ children }) => {
  return (
    <ReduxProvider store={store}>
      {children}
    </ReduxProvider>
  );
}; 