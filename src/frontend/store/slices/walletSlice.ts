import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Wallet {
  id: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  createdAt: number;
  lastUsed: number;
}

export interface WalletState {
  wallets: Wallet[];
  activeWalletId: string | null;
  isConnected: boolean;
  balance: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallets: [],
  activeWalletId: null,
  isConnected: false,
  balance: 0,
  isLoading: false,
  error: null,
};

// Helper function to generate a mock public key
const generatePublicKey = (): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // Add a new wallet
    addWallet: (state, action: PayloadAction<Wallet>) => {
      state.wallets.push(action.payload);
      if (!state.activeWalletId) {
        state.activeWalletId = action.payload.id;
      }
    },

    // Remove a wallet
    removeWallet: (state, action: PayloadAction<string>) => {
      const walletId = action.payload;
      state.wallets = state.wallets.filter(w => w.id !== walletId);
      
      // If we removed the active wallet, switch to the first available one
      if (state.activeWalletId === walletId) {
        state.activeWalletId = state.wallets.length > 0 ? state.wallets[0].id : null;
      }
    },

    // Switch to a different wallet
    switchWallet: (state, action: PayloadAction<string>) => {
      const walletId = action.payload;
      if (state.wallets.some(w => w.id === walletId)) {
        state.activeWalletId = walletId;
        // Update last used timestamp
        const wallet = state.wallets.find(w => w.id === walletId);
        if (wallet) {
          wallet.lastUsed = Date.now();
        }
      }
    },

    // Update wallet name
    updateWalletName: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const wallet = state.wallets.find(w => w.id === action.payload.id);
      if (wallet) {
        wallet.name = action.payload.name;
      }
    },

    // Set connection status
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },

    // Update balance
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Import wallet from private key
    importWallet: (state, action: PayloadAction<{ name: string; privateKey: string }>) => {
      // In a real implementation, this would derive the public key from the private key
      const newWallet: Wallet = {
        id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: action.payload.name,
        publicKey: generatePublicKey(), // This would be derived from private key
        isActive: false,
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };
      state.wallets.push(newWallet);
      
      // If this is the first wallet, make it active
      if (state.wallets.length === 1) {
        state.activeWalletId = newWallet.id;
      }
    },

    // Generate new wallet
    generateWallet: (state, action: PayloadAction<{ name: string }>) => {
      const newWallet: Wallet = {
        id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: action.payload.name,
        publicKey: generatePublicKey(),
        isActive: false,
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };
      state.wallets.push(newWallet);
      
      // If this is the first wallet, make it active
      if (state.wallets.length === 1) {
        state.activeWalletId = newWallet.id;
      }
    },

    // Set active wallet
    setActiveWallet: (state, action: PayloadAction<string>) => {
      const walletId = action.payload;
      if (state.wallets.some(w => w.id === walletId)) {
        state.activeWalletId = walletId;
        // Update last used timestamp
        const wallet = state.wallets.find(w => w.id === walletId);
        if (wallet) {
          wallet.lastUsed = Date.now();
        }
      }
    },

    // Update wallet last used timestamp
    updateWalletLastUsed: (state, action: PayloadAction<string>) => {
      const wallet = state.wallets.find(w => w.id === action.payload);
      if (wallet) {
        wallet.lastUsed = Date.now();
      }
    },

    // Clear all wallets (for testing/reset)
    clearWallets: (state) => {
      state.wallets = [];
      state.activeWalletId = null;
      state.isConnected = false;
      state.balance = 0;
    },
  },
});

export const {
  addWallet,
  removeWallet,
  switchWallet,
  updateWalletName,
  setConnectionStatus,
  updateBalance,
  setLoading,
  setError,
  clearError,
  importWallet,
  generateWallet,
  setActiveWallet,
  updateWalletLastUsed,
  clearWallets,
} = walletSlice.actions;

export default walletSlice.reducer; 