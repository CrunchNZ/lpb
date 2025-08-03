# SDK Information for Integration

This document compiles key information from official sources (GitHub repos, docs, and snippets) for the core SDKs: Meteora DLMM (TypeScript), Raydium CLMM (TypeScript), Orca Whirlpools (TypeScript), and Jupiter Swap (TypeScript). It's structured for easy parsing by AI agents: each SDK has sections for **Installation**, **Key Functions** (with descriptions and parameters), and **Code Examples** (focused on liquidity management and swaps). Use this to generate integration code in the bot (e.g., create positions, add/remove liquidity, collect fees, swaps).

Data sourced from web searches (e.g., GitHub READMEs, official docs). For full details, reference linked URLs.

## Meteora DLMM SDK (TypeScript)

### Installation
- NPM: `npm install @meteora-ag/dlmm`
- GitHub: https://github.com/MeteoraAg/dlmm-sdk
- Dependencies: `@solana/web3.js`, `bn.js`

### Key Functions
- **create(connection, poolPubKey)**: Initializes a DLMM pool instance.
  - Parameters: `connection` (Solana Connection), `poolPubKey` (PublicKey of pool).
- **initializePositionAndAddLiquidityByStrategy(params)**: Creates a new position and adds liquidity.
  - Parameters: `positionPubKey` (Keypair.publicKey), `user` (PublicKey), `totalXAmount` (BN), `totalYAmount` (BN), `strategy` ({ strategyType: StrategyType, minBinId, maxBinId }).
- **addLiquidityByStrategy(params)**: Adds liquidity to an existing position.
  - Parameters: `positionPubKey` (PublicKey), `user` (PublicKey), `totalXAmount` (BN), `totalYAmount` (BN), `strategy` ({ maxBinId, minBinId, strategyType }).
- **removeLiquidity(params)**: Removes liquidity from a position.
  - Parameters: `position` (PublicKey), `user` (PublicKey), `fromBinId` (number), `toBinId` (number), `liquiditiesBpsToRemove` (BN[]), `shouldClaimAndClose` (boolean).
- **claimRewards(params)**: Claims accumulated fees (swap fees/rewards).
  - Parameters: Derived from position; often integrated in removeLiquidity with `shouldClaimAndClose: true`.
- **getActiveBin()**: Retrieves the active bin info.
  - Returns: { binId, price, xAmount, yAmount }.

### Code Examples
- Create Position and Add Liquidity (Balanced):
  ```typescript
  const dlmmPool = await DLMM.create(connection, poolPubKey);
  const activeBin = await dlmmPool.getActiveBin();
  const minBinId = activeBin.binId - 10;
  const maxBinId = activeBin.binId + 10;
  const totalXAmount = new BN(100 * 10 ** baseMint.decimals);
  const totalYAmount = /* calculate based on strategy */;
  const positionKeypair = Keypair.generate();
  const tx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
    positionPubKey: positionKeypair.publicKey,
    user: user.publicKey,
    totalXAmount,
    totalYAmount,
    strategy: { maxBinId, minBinId, strategyType: StrategyType.Spot }
  });
  await sendAndConfirmTransaction(connection, tx, [user, positionKeypair]);
  ```

- Add Liquidity to Existing Position:
  ```typescript
  const addLiquidityTx = await dlmmPool.addLiquidityByStrategy({
    positionPubKey: existingPosition.publicKey,
    user: user.publicKey,
    totalXAmount,
    totalYAmount,
    strategy: { maxBinId, minBinId, strategyType: StrategyType.Spot }
  });
  await sendAndConfirmTransaction(connection, addLiquidityTx, [user]);
  ```

- Remove Liquidity and Collect Fees:
  ```typescript
  const userPosition = /* fetch position */;
  const binIdsToRemove = userPosition.positionData.positionBinData.map(bin => bin.binId);
  const removeLiquidityTx = await dlmmPool.removeLiquidity({
    position: userPosition.publicKey,
    user: user.publicKey,
    fromBinId: binIdsToRemove[0],
    toBinId: binIdsToRemove[binIdsToRemove.length - 1],
    liquiditiesBpsToRemove: new Array(binIdsToRemove.length).fill(new BN(100 * 100)), // 100%
    shouldClaimAndClose: true
  });
  await sendAndConfirmTransaction(connection, removeLiquidityTx, [user]);
  ```

## Raydium CLMM SDK (TypeScript)

### Installation
- NPM: `npm install @raydium-io/raydium-sdk`
- GitHub: https://github.com/raydium-io/raydium-clmm (for CLMM-specific)
- Dependencies: `@solana/web3.js`, `bn.js`
- Demo Repo: https://github.com/raydium-io/raydium-sdk-V2-demo

### Key Functions
- **makeCreatePositionInstruction(params)**: Creates a new CLMM position.
  - Parameters: Pool keys, tick lower/upper, liquidity amount.
- **addLiquidity(params)**: Adds liquidity to a position.
  - Parameters: Position ID, amounts, slippage.
- **removeLiquidity(params)**: Removes liquidity from a position.
  - Parameters: Position ID, liquidity amount to remove.
- **collectFees(params)**: Collects accrued fees.
  - Parameters: Position ID, recipient.
- **Clmm.makeCreatePoolInstruction(params)**: Initializes a new CLMM pool (permissionless).
  - Parameters: Token mints, fee tier, starting price, initial range.

### Code Examples
- Create CLMM Pool:
  ```typescript
  // From docs/snippets: Initialize pool with fee tier 0.25%
  const feeTier = 0.0025; // 0.25%
  const startingPrice = new Decimal(1); // e.g., 1 quote per base
  const tx = await Raydium.Clmm.makeCreatePoolInstruction({
    baseMint: baseMint,
    quoteMint: quoteMint,
    feeTier,
    startingPrice,
    initialRangeMin: startingPrice.mul(0.5),
    initialRangeMax: startingPrice.mul(1.5)
  });
  await sendAndConfirmTransaction(connection, tx, [user]);
  ```

- Create Position and Add Liquidity:
  ```typescript
  const tx = await Raydium.Clmm.makeCreatePositionInstruction({
    poolKeys,
    tickLower: -1000,
    tickUpper: 1000,
    liquidity: new BN(1000000),
    amountMaxA: new BN(100 * 10**6),
    amountMaxB: new BN(100 * 10**6)
  });
  await sendAndConfirmTransaction(connection, tx, [user]);
  ```

- Remove Liquidity and Collect Fees:
  ```typescript
  const removeTx = await Liquidity.makeRemoveLiquidityInstruction({
    poolKeys,
    positionId,
    liquidity: removeAmount
  });
  const collectTx = await Liquidity.makeCollectFeesInstruction({
    positionId,
    recipient: user.publicKey
  });
  // Combine in one tx if needed
  await sendAndConfirmTransaction(connection, [removeTx, collectTx], [user]);
  ```

## Orca Whirlpools SDK (TypeScript)

### Installation
- NPM: `npm install @orca-so/whirlpools`
- GitHub: https://github.com/orca-so/whirlpool-sdk
- Dependencies: `@solana/web3.js`, `@project-serum/anchor`, `decimal.js`

### Key Functions
- **openPosition(params)**: Creates a new position.
  - Parameters: Pool address, tick lower/upper, liquidity.
- **increaseLiquidity(params)**: Adds liquidity to a position.
  - Parameters: Position address, liquidity amount, token max A/B.
- **decreaseLiquidity(params)**: Removes liquidity from a position.
  - Parameters: Position address, liquidity amount, token min A/B.
- **collectFees(params)**: Collects fees from a position.
  - Parameters: Position address, recipient.
- **createSplashPool(params)**: Creates a new Whirlpool (splash pool).
  - Parameters: Token A/B mints.

### Code Examples
- Create Pool and Position:
  ```typescript
  const { poolAddress, callback } = await createSplashPool(
    new PublicKey("So11111111111111111111111111111111111111112"), // SOL
    new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") // USDC
  );
  await callback(); // Execute tx

  const { positionAddress, callback: openCallback } = await openConcentratedPosition(
    poolAddress,
    {
      tickLowerIndex: priceToTickIndex(new Decimal(0), 9, 6),
      tickUpperIndex: priceToTickIndex(new Decimal(100), 9, 6),
      liquidity: new BN(1000000000),
      tokenMaxA: new BN(1000000000),
      tokenMaxB: new BN(1000000000)
    }
  );
  await openCallback();
  ```

- Increase/Decrease Liquidity:
  ```typescript
  // Increase
  await increaseLiquidity({
    position: positionAddress,
    liquidity: new BN(500000000),
    tokenMaxA: new BN(500000000),
    tokenMaxB: new BN(500000000)
  });

  // Decrease
  await decreaseLiquidity({
    position: positionAddress,
    liquidity: new BN(500000000),
    tokenMinA: new BN(0),
    tokenMinB: new BN(0)
  });
  ```

- Collect Fees:
  ```typescript
  await collectFees({
    position: positionAddress,
    recipient: user.publicKey
  });
  ```

## Jupiter Swap SDK (TypeScript)

### Installation
- NPM: `npm install @jup-ag/api`
- GitHub: https://github.com/jup-ag/jupiter-swap-api
- Dependencies: `@solana/web3.js`, `cross-fetch`, `bs58`

### Key Functions
- **quote(params)**: Fetches a swap quote.
  - Parameters: `inputMint` (string), `outputMint` (string), `amount` (number), `slippageBps` (number).
- **swap(params)**: Builds a swap transaction from a quote.
  - Parameters: `quoteResponse` (from quote), `userPublicKey` (string), `config` (optional: dynamicComputeUnitLimit, prioritizationFeeLamports).
- **swapInstructions(params)**: Returns swap instructions (for composition).
  - Parameters: Same as swap, but returns instructions array.

### Code Examples
- Get Quote and Execute Swap:
  ```typescript
  const quoteRequest = {
    amount: 1000000, // 1 USDC (6 decimals)
    inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    outputMint: "So11111111111111111111111111111111111111112", // SOL
    slippageBps: 50
  };
  const quoteResponse = await (await fetch(`https://quote-api.jup.ag/v6/quote?${new URLSearchParams(quoteRequest)}`)).json();

  const { swapTransaction } = await (await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: wallet.publicKey.toString(),
      dynamicComputeUnitLimit: true
    })
  })).json();

  const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  transaction.sign([wallet.payer]);
  const txid = await connection.sendTransaction(transaction);
  await connection.confirmTransaction(txid);
  ``` 