# Solana Liquidity Sentinel

Autonomous liquidity farming bot for Solana meme coins. See docs/PRD.md for requirements.

## Overview

Solana Liquidity Sentinel (SLS) is an intelligent, autonomous liquidity farming bot designed specifically for Solana meme coins. The system combines real-time market analysis, sentiment monitoring, and automated trading strategies to maximize yield while managing risk.

## Features

- **Multi-Strategy Support**: Aggressive, Balanced, and Conservative strategies
- **Real-time Sentiment Analysis**: Twitter integration for market sentiment
- **Automated Position Management**: Dynamic range adjustments and exit triggers
- **Risk Management**: Comprehensive guardrails and position sizing
- **Cross-Platform UI**: Electron-based desktop application
- **Backtesting Engine**: Historical performance validation

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file with required API keys:
   ```env
   TWITTER_BEARER_TOKEN=your_twitter_token
   SOLANA_RPC_URL=your_rpc_endpoint
   METEORA_API_KEY=your_meteora_key
   JUPITER_API_KEY=your_jupiter_key
   ```

3. **Development Mode**
   ```bash
   npm run dev  # Start Electron app with hot reload
   ```

4. **Testing**
   ```bash
   npm test        # Run unit tests
   npm run test:e2e  # Run end-to-end tests
   ```

## Autonomous Building with Cursor Agents

This project is designed for autonomous development using Cursor AI agents. The context engineering system enables fully autonomous building with minimal human intervention.

### Quick Start for Agents

1. **Load Context Files**: 
   - Load `docs/PRD.md` and `docs/DTS.md` into Cursor context
   - Reference these files using @-mentions (e.g., @PRD.md in Composer)

2. **Use Agent Mode**: 
   - Enable experimental agents in Cursor settings
   - Use prompts from `docs/agent-prompts.md`

3. **Chain Tasks**: 
   - "Implement Meteora integration" → "Test with devnet" → "Integrate into UI"

### Development Workflow

1. **Backend Development**: Strategies, integrations, utilities
2. **Frontend Development**: React components, pages, state management
3. **Electron Integration**: Main process, packaging
4. **Testing & Validation**: Backtests, E2E tests, security checks

### Tech Stack

- **Backend**: Node.js, TypeScript, Solana SDKs
- **Frontend**: React, Redux Toolkit, Tailwind CSS, shadcn/ui
- **Desktop**: Electron
- **Testing**: Jest, Playwright
- **DeFi Integration**: Meteora SDK, Jupiter SDK, @solana/web3.js

## Project Structure

```
solana-liquidity-sentinel/
├── src/                      # Core source code
│   ├── backend/              # Node.js bot logic
│   │   ├── strategies/       # Strategy classes
│   │   ├── integrations/     # SDK wrappers
│   │   ├── utils/            # Helpers
│   │   └── index.ts          # Main bot entry
│   ├── frontend/             # React components
│   │   ├── components/       # UI parts
│   │   ├── pages/            # Views
│   │   └── store/            # Redux setup
│   └── main.ts               # Electron main process
├── tests/                    # Jest tests
├── docs/                     # Context files for agents
├── scripts/                  # Automation
└── .cursor/                  # Cursor-specific configs
```

## Agent Instructions

For Cursor agents working on this project:

1. **Reference Context**: Always check `docs/PRD.md` and `docs/DTS.md` for requirements
2. **Follow Standards**: Use `rules.toml` and `.cursor/rules.md` for code standards
3. **Test First**: Generate tests for each new feature
4. **Modular Development**: Keep files under 300 lines, split when necessary
5. **Documentation**: Include inline comments referencing PRD sections

## Contributing

This project uses autonomous development with Cursor AI agents. See `docs/agent-prompts.md` for detailed prompts and workflows.

## License

MIT License - see LICENSE file for details. 