# RWI Launchpad — Uniswap v4 hook

A Robinhood Chain token launchpad styled after RWIhood.org. Every new launch transaction creates a fixed one-billion-supply ERC-20 and a TOKEN/RWI Uniswap v4 pool.

## Launch rules

- Pair asset: RWI at `0x2286397228be256529BE1ae9ed8D7d16549e9C6A`
- Supply: exactly 1,000,000,000 tokens with 18 decimals and no future minting
- Creator input: name, ticker, optional description and links, plus a cropped 512×512 logo
- Initial creator liquidity: none; the creator never contributes RWI as LP capital
- Optional dev buy: after the token-only position is permanently locked, the launch transaction may execute one exact-input RWI→TOKEN v4 purchase for the creator with a minimum token output; a nonzero buy may require a separate exact-amount RWI approval first
- Pool: Uniswap v4, 1% fee, tick spacing 200
- Initial position: token-only and owned directly by the hook/factory
- Lock: permanent; there is no withdrawal, recovery, migration, bonding curve, or graduation function
- Revenue: 100% of claimable LP fees, after any Uniswap protocol fee, belongs to the token creator
- Payout: token-side fees wait for organic buys and are matched internally at the current pool price; RWI revenue is converted separately, unwrapped, and escrowed so the final creator claim transfers only native ETH
- Opening valuation: a tick-rounded target of $10,000, denominated using USDG as the onchain dollar reference
- Active-range invariant: CREATE2 selects every launch token below the RWI address, making it currency0 so the token-only position is active at its opening tick

## Credential-free opening price

The hook does not use Chainlink, a Vercel API, an API key, or any offchain signer. It derives the opening TOKEN/RWI price from two 30-minute Uniswap v3 TWAPs already available on Robinhood Chain:

1. RWI/WETH at `0xFf6AA24815d1274a9bE0CfD17C7c7489Cd40A697`
2. WETH/USDG at `0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca`

The result is rounded to a valid 200-tick v4 boundary, so the exact opening valuation may differ from $10,000 by roughly 1.01%. The system also checks minimum harmonic liquidity and rejects large spot/TWAP deviations in either reference pool.

This is a USDG-referenced target, not a guarantee of a real-world USD value. A USDG depeg, thin markets, delayed observations, manipulation that survives the TWAP controls, or external protocol failure can affect the result.

## Automatic ETH/USDG revenue settlement

The replacement ETH/USDG hook makes fee collection, USDG-to-ETH conversion, and the developer payout permissionless. The caller controls only when settlement runs: creator revenue always remains attached to the recorded launch position, and the 10% platform share always transfers to the immutable developer wallet. No recipient parameter exists.

The developer dashboard batches up to six launch positions through the canonical Robinhood Chain Multicall3 contract in one wallet transaction. ETH-paired revenue is credited as native ETH without a swap. USDG-paired revenue is converted through the pinned USDG/WETH pool, unwrapped, and split 90% to the creator and 10% to the developer. The contract independently enforces a minimum output equal to 95% of its protected onchain ETH/USDG TWAP, even when the caller supplies zero as the minimum.

This is transaction-driven automation, not a self-executing contract. A wallet or external keeper must still submit and pay for the settlement transaction. Permissionless timing, extra settlement gas, possible reverts during volatile or depegged markets, and up to 5% execution variance versus the protected TWAP are remaining tradeoffs. Collecting token-side fees also moves them into internal-match inventory; future organic buys can consume that inventory without moving the token pool price for the matched portion.

The change requires a new immutable hook and applies only to launches created by that hook. Existing pools cannot be upgraded in place.

## Pinned Robinhood Chain integrations

- Uniswap v4 PoolManager: `0x8366a39CC670B4001A1121B8F6A443A643e40951`
- Uniswap v4 StateView: `0xF3334192D15450CdD385c8B70e03f9A6bD9E673b`
- Uniswap Universal Router: `0x8876789976dEcBfCbBbe364623C63652db8C0904`
- WETH: `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73`
- USDG: `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`
- Uniswap v3 factory used for canonical TWAP checks: `0x1f7d7550B1b028f7571E69A784071F0205FD2EfA`
- SwapRouter02 used for the final RWI/WETH creator claim: `0xCaf681a66D020601342297493863E78C959E5cb2`

The production contract source is `contracts/RobinhoodRWIV4LaunchHook.sol`. It is also the launch factory. `contracts/RWIV4HookDeployer.sol` deploys it with CREATE2 because a v4 hook address must encode its callback permissions. The internal-match build enables exactly `beforeInitialize`, `beforeSwap`, and `beforeSwapReturnDelta` (`0x2088`).

The currently configured, source-verified hook is `0xB725d44EA09BA4c1C8650D79aDB84C06d3CbE000`, deployed at block `26105360`. It predates internal matching and cannot be upgraded; the new `0x2088` build requires a fresh deployment before it can accept launches. This replacement bundle therefore pauses new launches until that deployment is verified and configured. The first v4 hook at `0x1CD4ba989b530E0c5bf13cB780346A2d2BAaE000` remains configured only for existing-token discovery, creator claims, and direct v4 trading. Existing pools keep the behavior of the immutable hook that created them.

Official references: [Uniswap v4 Robinhood Chain deployments](https://developers.uniswap.org/docs/protocols/v4/deployments) and [Robinhood Chain canonical contracts](https://docs.robinhood.com/chain/contracts/).

## Local validation

Install dependencies once, then run:

```powershell
npm.cmd run compile
npm.cmd test
npm.cmd run build:vercel
```

The contract tests cover fixed supply, deterministic token ordering below RWI, zero creator allocation, optional post-lock dev-buy settlement and slippage, token-only liquidity, permanent position custody, a simulated 25-year lock period, approximate $10,000 pre-buy opening valuation, both TWAP safeguards, creator-only revenue actions, internal token-fee matching, separate RWI→ETH preparation, the ETH/USD estimate, and a final claim that invokes no swap route.

## Deploying the hook

Deployment is intentionally separate from the static website. Never put a private key in the browser bundle or Vercel environment.

Deploy the corrected hook with the separate deployment script. The production website does not accept or store deployment keys and does not expose browser deployment.

```powershell
$env:ROBINHOOD_DEPLOYER_PRIVATE_KEY="0x..."
$env:FACTORY_AUDIT_ACKNOWLEDGED="true"
npm.cmd run deploy:robinhood
```

If you deliberately deploy before an independent audit, the deployment script requires the explicit alternative `FACTORY_UNAUDITED_RISK_ACCEPTED=true`. This records acknowledgement; it does not make the code audited or safe.

The script deploys a permissionless CREATE2 helper, searches for an address with the exact v4 hook bits, deploys the immutable hook, and prints the helper address, hook address, transactions, deployment block, and salt.

After deployment:

1. Verify `RobinhoodRWIV4LaunchHook` on Blockscout.
2. Set `ROBINHOOD_FACTORY_ADDRESS` to the verified hook address.
3. Set `ROBINHOOD_FACTORY_DEPLOYMENT_BLOCK` to its deployment block.
4. Run the read-only validator.
5. Configure the browser only after all checks pass.

```powershell
$env:ROBINHOOD_FACTORY_ADDRESS="0x..."
$env:ROBINHOOD_FACTORY_DEPLOYMENT_BLOCK="12345678"
npm.cmd run validate:robinhood
$env:FACTORY_AUDIT_ACKNOWLEDGED="true"
npm.cmd run configure:robinhood
npm.cmd run build:vercel
```

Configuration fails closed unless runtime bytecode, immutable integrations, hook permission bits, economic constants, live TWAP readiness, canonical pool identities, token decimals, and Blockscout source verification all match the reviewed build.

## Vercel deployment

Deploy only the generated `vercel-site` directory. It contains the site, two small metadata endpoints, and their minimal production dependencies—no `node_modules`, contracts, artifacts, tests, private keys, or oracle credentials.

```powershell
npm.cmd run build:vercel
```

Use `vercel-site` as the Vercel project root. Vercel installs the two production packages listed there and turns the files under `api/` into functions; the browser bundle remains small.

## Metadata and profiles

The image cropper creates a standardized 512×512 PNG, stores it in the current browser, and reads it back after launch to verify its MIME type, byte length, and SHA-256 digest. When the Vercel project has a connected public Blob store, the creator signs a gas-free metadata approval after the launch transaction. The API verifies that signature against the factory's onchain creator record, verifies the PNG dimensions and digest, publishes the logo and metadata, and updates the standard token-list feed at `/api/token-list`. The post-launch download remains available as a backup with `tokens/<token-address>.json`, `assets/tokens/<token-address>.png`, and `launch-report.json`.

To activate automatic public logos, open the Vercel project, create a **public Blob** store under Storage, and connect it to the project for Production and Preview. New connections use Vercel's automatically rotated OIDC authentication and add `BLOB_STORE_ID`; the Blob SDK receives the short-lived runtime token automatically from Vercel. Older connections may use `BLOB_READ_WRITE_TOKEN`. Do not copy either credential into the browser or static files. Redeploy once after connecting the store. Blockscout can then be asked once to ingest `https://<your-domain>/api/token-list`; new creator-signed launches are added to that feed automatically.

Creators can also repair an older current-factory launch from the dashboard. **Publish logo** reuses the verified browser-saved crop; **Add public logo** opens the same cropper when no saved image exists. The API will accept the publication only from the wallet recorded as that token's creator.

GeckoTerminal discovers Robinhood Chain Uniswap v4 pools from onchain activity. A newly initialized single-sided TOKEN/RWI pool has no RWI reserve, executable indexed price, or swap history until its first real purchase. Because creators provide no initial RWI by design, at least one real RWI-to-token swap is required before GeckoTerminal can show price, volume, and searchable pool data. Logo updates on GeckoTerminal remain subject to its token-information review process.

Token-page trading accepts only ETH or USDG for settlement. A single atomic Universal Router transaction bridges ETH/WETH or USDG/WETH through the canonical RWI/WETH pool and then trades against the launch token’s locked TOKEN/RWI position; RWI never needs to be held or approved by the user. The route pins Robinhood Chain’s v3 QuoterV2, v4 Quoter, StateView, Universal Router, Permit2, PoolManager, WETH, and USDG deployments and validates their bytecode before quoting or trading.

Creator profiles use the separately deployed `CreatorProfileRegistry`. The dashboard lets a creator publish a display name, profile image, and short bio, then manage token revenue. For internal-match launches it separately shows token inventory waiting for organic buys, RWI ready for conversion, native ETH ready to claim, and the protected TWAP-based USD estimate of that ETH. Legacy immutable factories retain their original claim behavior.

## Security status

The implementation has automated tests and an internal code review, but those are not an independent professional audit. The liquidity lock is intentionally irreversible. Do not enable public launches until the exact deployed bytecode and operational assumptions have been independently reviewed. See `SECURITY-REVIEW.md`.
