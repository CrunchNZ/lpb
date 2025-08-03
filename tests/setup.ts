import '@testing-library/jest-dom';

// Mock environment variables
process.env.TWITTER_BEARER_TOKEN = 'test-twitter-token';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
process.env.METEORA_API_KEY = 'test-meteora-key';
process.env.JUPITER_API_KEY = 'test-jupiter-key';

// Mock Solana web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getTokenSupply: jest.fn().mockResolvedValue({ value: 1000000000 }),
    getAccountInfo: jest.fn().mockResolvedValue({ data: Buffer.from([]) }),
    getBlockHeight: jest.fn().mockResolvedValue(123456789),
    getSlot: jest.fn().mockResolvedValue(123456789),
    getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'test-blockhash' }),
    sendTransaction: jest.fn().mockResolvedValue('test-signature'),
    confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
    simulateTransaction: jest.fn().mockResolvedValue({ value: { err: null, logs: [] } }),
    getTokenAccountsByOwner: jest.fn().mockResolvedValue({ value: [] }),
    getBalance: jest.fn().mockResolvedValue(1000000000),
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({ 
    toBase58: () => key,
    toString: () => key,
    toBuffer: () => Buffer.from(key),
  })),
  Keypair: {
    generate: jest.fn().mockImplementation(() => ({
      publicKey: { toBase58: () => 'test-public-key', toString: () => 'test-public-key' },
      secretKey: new Uint8Array(64),
    })),
    fromSecretKey: jest.fn().mockImplementation((secretKey) => ({
      publicKey: { toBase58: () => 'test-public-key', toString: () => 'test-public-key' },
      secretKey,
    })),
  },
  SystemProgram: {
    transfer: jest.fn().mockImplementation((params) => ({
      programId: { toBase58: () => '11111111111111111111111111111111' },
      keys: [],
      data: Buffer.from([]),
    })),
  },
  LAMPORTS_PER_SOL: 1000000000,
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnThis(),
    sign: jest.fn().mockReturnThis(),
    partialSign: jest.fn().mockReturnThis(),
    serialize: jest.fn().mockReturnValue(Buffer.from([])),
    instructions: [],
    feePayer: null,
    recentBlockhash: null,
  })),
  TransactionMessage: jest.fn().mockImplementation(() => ({
    compileToV0Message: jest.fn().mockReturnValue({}),
  })),
  VersionedTransaction: jest.fn().mockImplementation(() => ({
    sign: jest.fn().mockReturnThis(),
    serialize: jest.fn().mockReturnValue(Buffer.from([])),
  })),
  sendAndConfirmTransaction: jest.fn().mockResolvedValue('test-signature'),
}));

// Mock Twitter API
jest.mock('twitter-api-v2', () => ({
  TwitterApi: jest.fn().mockImplementation(() => ({
    v2: {
      search: jest.fn().mockResolvedValue({
        data: [
          { text: 'Great token! #crypto' },
          { text: 'Amazing project! #solana' },
        ],
      }),
    },
  })),
}));

// Mock VADER sentiment
jest.mock('vader-sentiment', () => ({
  SentimentIntensityAnalyzer: jest.fn().mockImplementation(() => ({
    polarity_scores: jest.fn().mockReturnValue({
      compound: 0.5,
      pos: 0.6,
      neg: 0.1,
      neu: 0.3,
    }),
  })),
}));

// Mock Meteora SDK (package not installed yet)
jest.mock('@meteora-ag/sdk', () => ({
  MeteoraClient: jest.fn().mockImplementation(() => ({
    createPosition: jest.fn().mockResolvedValue({
      signature: 'test-signature',
    }),
    closePosition: jest.fn().mockResolvedValue({
      signature: 'test-close-signature',
    }),
    getPosition: jest.fn().mockResolvedValue({
      value: 1000,
    }),
  })),
}), { virtual: true });

// Mock Jupiter SDK (package not installed yet)
jest.mock('@jup-ag/core', () => ({
  Jupiter: jest.fn().mockImplementation(() => ({
    exchange: jest.fn().mockResolvedValue({
      signature: 'test-jupiter-signature',
    }),
    getRoutes: jest.fn().mockResolvedValue([]),
  })),
}), { virtual: true });

// Mock SPL Token
jest.mock('@solana/spl-token', () => ({
  TOKEN_PROGRAM_ID: { toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
  getAssociatedTokenAddress: jest.fn().mockResolvedValue({ toBase58: () => 'test-token-account' }),
  createAssociatedTokenAccountInstruction: jest.fn().mockReturnValue({
    programId: { toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    keys: [],
    data: Buffer.from([]),
  }),
  createTransferInstruction: jest.fn().mockReturnValue({
    programId: { toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    keys: [],
    data: Buffer.from([]),
  }),
  getAccount: jest.fn().mockResolvedValue({
    amount: BigInt(1000000),
    decimals: 6,
    mint: { toBase58: () => 'test-mint' },
  }),
  AccountLayout: {
    decode: jest.fn().mockReturnValue({
      mint: Buffer.from('test-mint'),
      amount: BigInt(1000000),
      decimals: 6,
    }),
  },
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
});

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock; 