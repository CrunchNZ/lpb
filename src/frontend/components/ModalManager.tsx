import React from 'react';
import { useAppSelector } from '../store';
import { PositionDetailView } from './PositionDetailView';
import { TokenDetailView } from './TokenDetailView';
import { WatchlistDetailView } from './WatchlistDetailView';
import { PoolDetailView } from './PoolDetailView';

export const ModalManager: React.FC = () => {
  const { navigation } = useAppSelector((state) => state.ui);
  const { modalStack } = navigation;

  const renderModal = () => {
    if (modalStack.length === 0) return null;

    const currentModal = modalStack[modalStack.length - 1];
    const { component, data } = currentModal;

    switch (component) {
      case 'PositionDetailView':
        return (
          <PositionDetailView
            position={data.position}
            onClose={data.onClose}
            onUpdate={data.onUpdate}
          />
        );
      case 'TokenDetailView':
        return (
          <TokenDetailView
            token={data.token}
            onClose={data.onClose}
            onAddToWatchlist={data.onAddToWatchlist}
            onRemoveFromWatchlist={data.onRemoveFromWatchlist}
            isInWatchlist={data.isInWatchlist}
          />
        );
      case 'WatchlistDetailView':
        return (
          <WatchlistDetailView
            watchlist={data.watchlist}
            tokens={data.tokens}
            tokenData={data.tokenData}
            onClose={data.onClose}
            onRemoveTokens={data.onRemoveTokens}
            onAddToken={data.onAddToken}
            onRefreshData={data.onRefreshData}
            onTokenSelect={data.onTokenSelect}
          />
        );
      case 'PoolDetailView':
        return (
          <PoolDetailView
            pool={data.pool}
            onClose={data.onClose}
            onAddLiquidity={data.onAddLiquidity}
            onRemoveLiquidity={data.onRemoveLiquidity}
            onHarvestRewards={data.onHarvestRewards}
            onRefreshData={data.onRefreshData}
          />
        );
      default:
        return null;
    }
  };

  return renderModal();
}; 