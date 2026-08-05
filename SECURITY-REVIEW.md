# RWI Uniswap v4 launch hook — internal security review

Date: 2026-08-02  
Status: internal review and automated testing complete; independent audit not complete

## Scope

- `contracts/DirectRWIV4LaunchHook.sol`
- `contracts/RobinhoodRWIV4LaunchHook.sol`
- `contracts/RWIV4HookDeployer.sol`
- `contracts/RWILaunchToken.sol`
- `contracts/libraries/RWIOracleMath.sol`
- Minimal v4, v3 oracle, swap-router, and WETH interfaces used by those contracts
- Deployment, verification, configuration, browser integration, and contract tests

The legacy v3 factories remain configured only for existing token discovery and creator claims. They are not the production path for new launches.

## Enforced invariants

1. Every launched token has a fixed supply of exactly one billion units and no mint function.
2. The creator receives no launch allocation and supplies no RWI as LP capital. An optional creator-funded dev buy is a normal post-lock v4 swap with minimum-output protection.
3. The hook initializes only TOKEN/RWI pools using itself as the hook, a 1% fee, and tick spacing 200.
4. The hook address must encode exactly `beforeInitialize`, `beforeSwap`, and `beforeSwapReturnDelta` permissions.
5. The complete supply, except at most one token of integer-rounding dust, enters a one-sided v4 position.
6. The v4 position is owned directly by the hook/factory. No function can decrease its liquidity, transfer its ownership, recover it, graduate it, or migrate it.
7. All claimable LP revenue belongs to the recorded token creator. There is no launchpad fee recipient or administrator.
8. Fee realization never swaps. Token-side fees remain inventory until an organic RWI→TOKEN buy is internally matched at the current pool price; the matched portion does not move the TOKEN/RWI pool price.
9. RWI revenue is converted separately through the canonical RWI/WETH v3 pool, unwrapped, and escrowed as native ETH. The final claim only transfers escrowed ETH and cannot call either swap route.
10. Only the recorded creator can collect, convert, or claim. Conversion includes a deadline and caller-selected minimum ETH output; claims expose no output or recipient parameter.
11. Opening prices use protected 30-minute RWI/WETH and WETH/USDG TWAPs and a tick-rounded $10,000 USDG-referenced target.
12. There is no Chainlink dependency, credentialed endpoint, upgrade proxy, owner, pause key, or recovery key.
13. CREATE2 address selection requires every new launch token to sort below RWI, so the token-only position begins at its inclusive lower boundary with positive active liquidity.

## Principal findings and controls

| Area | Risk | Control or remaining limitation |
|---|---|---|
| Hook address | v4 callbacks are inferred from address bits. | CREATE2 mining requires exactly `0x2088` within the 14-bit hook mask; the constructor and configuration validator both enforce it. |
| Unauthorized pools | A third party could try to initialize a pool using the hook. | `beforeInitialize` accepts only the hook’s own active launch, exact TOKEN/RWI key, fee, spacing, hook address, and expected opening price. |
| Liquidity removal | Permanent liquidity could be withdrawn through an exposed callback path. | The unlock callback accepts only two transient internal actions: initial positive liquidity and zero-delta fee realization. No negative liquidity operation is reachable. |
| Fee theft | A caller could redirect or claim creator revenue. | Claims authenticate `positionCreators[positionTokenId]`, always send ETH to that recorded address, and expose no recipient parameter. |
| Token-chart pressure | Converting token-side LP fees could market-sell into the launched pool. | Token inventory is filled only against organic buys through a before-swap delta at the current tick. The matched portion bypasses the AMM curve; `claimEthRewards` performs only a native transfer. |
| Conversion slippage | The separate RWI→WETH conversion could be sandwiched or move the RWI market. | The creator supplies a minimum ETH output and deadline. The UI derives a conservative minimum from a preflight quote. This route never calls the TOKEN/RWI pool, but RWI/WETH price impact remains unavoidable without an ETH subsidy. |
| Inventory delay | Token-side fees may not become ETH promptly. | They remain visible in `tokenFeeInventory` until future organic RWI buys consume them. There is deliberately no fallback market dump into the token chart. |
| Oracle manipulation | A spot price can be moved within one transaction. | Both reference prices use 30-minute observations, minimum harmonic liquidity, and spot/TWAP deviation limits. This reduces but does not eliminate manipulation risk. |
| Dollar reference | USDG can trade away from one dollar. | The target is explicitly USDG-referenced. There is no independent redemption or USD oracle, so depeg risk remains. |
| Tick rounding | v4 pool spacing prevents an exact target. | The nearest valid 200-tick boundary is used, creating about ±1.01% maximum expected target error. |
| External protocols | Uniswap, RWI, WETH, or USDG behavior can change or fail. | Production addresses are immutable and configuration verifies deployed code and canonical v3 pools. External protocol and asset risk remains. |
| Protocol fees | Uniswap governance may enable a protocol fee. | “100% to creator” means 100% of LP fees that accrue to this position after any protocol-level deduction. |
| Irreversibility | A bug cannot be repaired and locked assets cannot be recovered. | This is intentional, plainly disclosed, and the main reason an independent audit is required before public use. |
| Currency ordering | A token that sorts above RWI makes token inventory currency1; initializing at that position's exclusive upper boundary reports zero active liquidity. | The corrected factory searches up to 256 deterministic CREATE2 salts and deploys only a token address below RWI. Tests assert the ordering and lower-bound range. The first deployed v4 hook is deprecated for new launches. |
| Dev-buy ordering | A creator purchase executed before the permanent position exists could become an allocation or use a different price path. | The hook first deploys the complete supply, initializes the pool, locks the token-only position, records the launch, and only then executes the optional exact-input v4 swap. The entire launch reverts below the creator's minimum token output. |
| Dev-buy approval | An unlimited approval would expose unnecessary RWI. | The browser requests only the configured dev-buy amount and skips approval when the existing allowance is sufficient. The hook pulls exactly `devBuyRwiAmount`. |

## Test coverage

The local test suite verifies four scenarios covering:

- CREATE2 hook permission mining and constructor rejection of invalid bits
- fixed supply and metadata validation
- deterministic CREATE2 token ordering below RWI and a lower-bound active launch range
- no creator token/RWI allocation
- full token-only v4 liquidity within the allowed one-token rounding bound
- zero-RWI launches plus an optional creator-funded post-lock dev buy
- dev-buy allowance, RWI settlement, token receipt, and minimum-output reverts
- unchanged position ownership and liquidity after a simulated 25 years
- approximately $10,000 implied opening value
- both oracle pools’ low-liquidity and spot-deviation reverts
- creator-only fee collection, RWI conversion, and ETH claims
- token-fee inventory matched against an organic RWI buy without a v4 AMM swap
- separate RWI→WETH conversion with deadline and slippage bounds
- native ETH escrow and protected 30-minute ETH/USD estimate
- zero v4 or v3 swap calls during the final ETH claim
- shared creator profile registry behavior

## Deployment gates

Before enabling the public UI for a new address:

1. Commission an independent audit of the exact commit and compiler settings.
2. Deploy with the CREATE2 helper and record the helper address, salt, transactions, and block.
3. Confirm the address has exactly the required `beforeInitialize`, `beforeSwap`, and `beforeSwapReturnDelta` bits (`0x2088`).
4. Verify source on Blockscout as `RobinhoodRWIV4LaunchHook`.
5. Run `validate:robinhood` against the deployed address.
6. Confirm both 30-minute oracle observations, liquidity floors, and deviation limits pass under live conditions.
7. Run a stateful Robinhood Chain fork test with a launch, trades in both directions, and an ETH revenue claim.
8. Configure and rebuild the static Vercel bundle only after all gates succeed.

## Review conclusion

No intentional administrator, liquidity-withdrawal, creator-redirection, Chainlink, or offchain credential path remains in the new v4 design. Automated tests support the intended invariants, but this document is not an independent audit and does not guarantee safety. The immutable lock, custom-accounting callback, and external RWI/WETH conversion make an independent professional review a production requirement.
