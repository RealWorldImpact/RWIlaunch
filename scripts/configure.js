const fs = require("fs");
const path = require("path");
let ethers;
let compile = null;
try {
  ({ ethers } = require("ethers"));
  compile = require("../tooling/compile");
} catch {
  ethers = require("../vendor/ethers.umd.min.js");
}

const EXPECTED = Object.freeze({
  chainId: 4663n,
  rwi: "0x2286397228be256529BE1ae9ed8D7d16549e9C6A",
  weth: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  usdg: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  poolManager: "0x8366a39CC670B4001A1121B8F6A443A643e40951",
  stateView: "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b",
  quoter: "0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94",
  v3Quoter: "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7",
  universalRouter: "0x8876789976dEcBfCbBbe364623C63652db8C0904",
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  uniswapV3Factory: "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA",
  swapRouter: "0xCaf681a66D020601342297493863E78C959E5cb2",
  rwiWethPool: "0xFf6AA24815d1274a9bE0CfD17C7c7489Cd40A697",
  wethUsdgPool: "0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca",
  launchFee: 10_000n,
  launchSpacing: 200n,
  wethUsdgFee: 100n,
  wethUsdgSpacing: 1n,
  hookFlags: (1n << 13n) | (1n << 7n) | (1n << 3n),
  hookMask: (1n << 14n) - 1n,
});

function sameAddress(left, right) {
  return ethers.getAddress(left) === ethers.getAddress(right);
}

function normalizeImmutableSlots(bytecode, immutableReferences) {
  let normalized = bytecode.slice(2).toLowerCase();
  for (const references of Object.values(immutableReferences || {})) {
    for (const { start, length } of references) {
      const offset = start * 2;
      normalized = `${normalized.slice(0, offset)}${"0".repeat(length * 2)}${normalized.slice(offset + length * 2)}`;
    }
  }
  return normalized;
}

function oracleMetrics(observation, spotTick, window = 1_800n) {
  const tickDelta = observation[0][1] - observation[0][0];
  let meanTick = tickDelta / window;
  if (tickDelta < 0n && tickDelta % window !== 0n) meanTick -= 1n;
  const secondsPerLiquidityDelta = observation[1][1] - observation[1][0];
  if (secondsPerLiquidityDelta === 0n) throw new Error("Oracle pool returned a zero liquidity accumulator delta.");
  const harmonicLiquidity = (window * ((1n << 160n) - 1n)) / (secondsPerLiquidityDelta << 32n);
  const deviation = spotTick >= meanTick ? spotTick - meanTick : meanTick - spotTick;
  return { meanTick, harmonicLiquidity, deviation };
}

async function requireVerifiedSource(address) {
  const response = await fetch(`https://robinhoodchain.blockscout.com/api/v2/smart-contracts/${address}`, {
    headers: { accept: "application/json", "user-agent": "RWI-Launchpad-Validator/2.0" },
  });
  if (!response.ok) throw new Error(`Blockscout source check failed with HTTP ${response.status}.`);
  const result = await response.json();
  if (!result?.source_code || result.name !== "RobinhoodRWIV4LaunchHook") {
    throw new Error("Hook source is not verified on Blockscout under the expected contract name.");
  }
}

async function main() {
  const validateOnly = process.argv.includes("--validate-only");
  const rpcUrl = process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
  const currentConfig = fs.readFileSync(path.join(__dirname, "..", "factory-config.js"), "utf8");
  const configuredAddress = process.env.ROBINHOOD_FACTORY_ADDRESS
    || currentConfig.match(/"factoryAddress"\s*:\s*"([^"]+)"/)?.[1];
  if (!configuredAddress || !ethers.isAddress(configuredAddress) || configuredAddress === ethers.ZeroAddress) {
    throw new Error("Set ROBINHOOD_FACTORY_ADDRESS or configure a deployed, source-verified v4 hook address.");
  }
  const address = ethers.getAddress(configuredAddress);
  if ((BigInt(address) & EXPECTED.hookMask) !== EXPECTED.hookFlags) {
    throw new Error("Factory address does not expose exactly the required Uniswap v4 hook flags.");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== EXPECTED.chainId) throw new Error(`Expected Robinhood Chain 4663, received ${network.chainId}.`);
  if (compile) compile();
  const artifact = require("../artifacts/contracts/RobinhoodRWIV4LaunchHook.sol/RobinhoodRWIV4LaunchHook.json");
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("No contract bytecode exists at ROBINHOOD_FACTORY_ADDRESS.");
  if (
    normalizeImmutableSlots(code, artifact.immutableReferences)
      !== normalizeImmutableSlots(artifact.deployedBytecode, artifact.immutableReferences)
  ) throw new Error("Deployed runtime bytecode does not match the reviewed v4 hook build.");

  const hook = new ethers.Contract(address, artifact.abi, provider);
  const [
    rwi, weth, usdg, poolManager, stateView, universalRouter, uniswapV3Factory, swapRouter,
    rwiWethPool, wethUsdgPool, immutableRwi, immutableWeth, immutableUsdg, immutablePoolManager,
    immutableStateView, immutableV3Factory, immutableSwapRouter, immutableRwiWeth, immutableWethUsdg, chainId, poolFee,
    tickSpacing, initialRwi, poolAllocation, maxDust, locked, creatorShare, targetCap, twapWindow,
    rwiDeviation, usdDeviation, minRwiLiquidity, minUsdLiquidity, requiredFlags,
  ] = await Promise.all([
    hook.RWI(), hook.WETH(), hook.USDG(), hook.UNISWAP_V4_POOL_MANAGER(), hook.UNISWAP_V4_STATE_VIEW(),
    hook.UNISWAP_V4_UNIVERSAL_ROUTER(), hook.UNISWAP_V3_FACTORY(), hook.SWAP_ROUTER_02(),
    hook.RWI_WETH_ORACLE_POOL(), hook.WETH_USDG_ORACLE_POOL(), hook.rwi(), hook.weth(), hook.usdg(),
    hook.poolManager(), hook.stateView(), hook.uniswapV3Factory(), hook.swapRouter(), hook.rwiWethPool(), hook.wethUsdgPool(),
    hook.ROBINHOOD_CHAIN_ID(), hook.POOL_FEE(), hook.POOL_TICK_SPACING(), hook.INITIAL_RWI_LIQUIDITY(),
    hook.POOL_ALLOCATION_BPS(), hook.MAX_LOCKED_TOKEN_DUST(), hook.LIQUIDITY_PERMANENTLY_LOCKED(),
    hook.CREATOR_LP_FEE_SHARE_BPS(), hook.TARGET_MARKET_CAP_USD_E18(), hook.ORACLE_TWAP_WINDOW(),
    hook.MAX_RWI_WETH_SPOT_TWAP_DEVIATION(), hook.MAX_WETH_USDG_SPOT_TWAP_DEVIATION(),
    hook.MIN_RWI_WETH_HARMONIC_LIQUIDITY(), hook.MIN_WETH_USDG_HARMONIC_LIQUIDITY(), hook.REQUIRED_HOOK_FLAGS(),
  ]);

  const addressChecks = [
    [rwi, EXPECTED.rwi, "RWI"], [weth, EXPECTED.weth, "WETH"], [usdg, EXPECTED.usdg, "USDG"],
    [poolManager, EXPECTED.poolManager, "v4 PoolManager"], [stateView, EXPECTED.stateView, "v4 StateView"],
    [universalRouter, EXPECTED.universalRouter, "v4 Universal Router"],
    [uniswapV3Factory, EXPECTED.uniswapV3Factory, "v3 factory"], [swapRouter, EXPECTED.swapRouter, "v3 SwapRouter02"],
    [rwiWethPool, EXPECTED.rwiWethPool, "RWI/WETH oracle pool"], [wethUsdgPool, EXPECTED.wethUsdgPool, "WETH/USDG oracle pool"],
    [immutableRwi, rwi, "immutable RWI"], [immutableWeth, weth, "immutable WETH"], [immutableUsdg, usdg, "immutable USDG"],
    [immutablePoolManager, poolManager, "immutable PoolManager"], [immutableStateView, stateView, "immutable StateView"],
    [immutableV3Factory, uniswapV3Factory, "immutable v3 factory"],
    [immutableSwapRouter, swapRouter, "immutable SwapRouter02"], [immutableRwiWeth, rwiWethPool, "immutable RWI/WETH pool"],
    [immutableWethUsdg, wethUsdgPool, "immutable WETH/USDG pool"],
  ];
  for (const [actual, expected, label] of addressChecks) {
    if (!sameAddress(actual, expected)) throw new Error(`${label} address mismatch.`);
  }
  if (
    chainId !== EXPECTED.chainId || poolFee !== EXPECTED.launchFee || tickSpacing !== EXPECTED.launchSpacing
      || initialRwi !== 0n || poolAllocation !== 10_000n || maxDust !== ethers.parseEther("1") || !locked
      || creatorShare !== 10_000n || targetCap !== ethers.parseUnits("10000", 18) || twapWindow !== 1_800n
      || rwiDeviation !== 1_000n || usdDeviation !== 300n || minRwiLiquidity !== 10n ** 22n
      || minUsdLiquidity !== 500_000_000_000_000_000n || requiredFlags !== EXPECTED.hookFlags
  ) throw new Error("Hook economic, oracle, fee-routing, or permanent-lock invariants do not match the reviewed build.");

  const v3FactoryContract = new ethers.Contract(uniswapV3Factory, [
    "function feeAmountTickSpacing(uint24) view returns (int24)",
    "function getPool(address,address,uint24) view returns(address)",
  ], provider);
  const routerContract = new ethers.Contract(swapRouter, [
    "function factory() view returns(address)", "function WETH9() view returns(address)",
  ], provider);
  const tokenAbi = ["function decimals() view returns(uint8)"];
  const poolAbi = [
    "function token0() view returns(address)", "function token1() view returns(address)", "function fee() view returns(uint24)",
    "function observe(uint32[]) view returns(int56[],uint160[])",
    "function slot0() view returns(uint160,int24,uint16,uint16,uint16,uint8,bool)",
  ];
  const rwiPoolContract = new ethers.Contract(rwiWethPool, poolAbi, provider);
  const usdPoolContract = new ethers.Contract(wethUsdgPool, poolAbi, provider);
  const v4ImmutableStateAbi = ["function poolManager() view returns(address)"];
  const quoterContract = new ethers.Contract(EXPECTED.quoter, v4ImmutableStateAbi, provider);
  const stateViewContract = new ethers.Contract(stateView, v4ImmutableStateAbi, provider);
  const universalRouterContract = new ethers.Contract(universalRouter, v4ImmutableStateAbi, provider);
  const [
    poolManagerCode, stateViewCode, quoterCode, v3QuoterCode, universalRouterCode, permit2Code,
    quoterManager, stateViewManager, universalRouterManager, routerFactory, routerWeth, launchSpacing,
    usdSpacing, rwiDecimals, wethDecimals, usdgDecimals, canonicalRwiPool, canonicalUsdPool,
    rwiToken0, rwiToken1, rwiFee, usdToken0, usdToken1, usdFee, rwiObservation, usdObservation,
    rwiSlot0, usdSlot0, blockNumber,
  ] = await Promise.all([
    provider.getCode(poolManager), provider.getCode(stateView), provider.getCode(EXPECTED.quoter), provider.getCode(EXPECTED.v3Quoter),
    provider.getCode(universalRouter), provider.getCode(EXPECTED.permit2),
    quoterContract.poolManager(), stateViewContract.poolManager(), universalRouterContract.poolManager(),
    routerContract.factory(), routerContract.WETH9(), v3FactoryContract.feeAmountTickSpacing(10_000),
    v3FactoryContract.feeAmountTickSpacing(100), new ethers.Contract(rwi, tokenAbi, provider).decimals(),
    new ethers.Contract(weth, tokenAbi, provider).decimals(), new ethers.Contract(usdg, tokenAbi, provider).decimals(),
    v3FactoryContract.getPool(rwi, weth, 10_000), v3FactoryContract.getPool(weth, usdg, 100),
    rwiPoolContract.token0(), rwiPoolContract.token1(), rwiPoolContract.fee(),
    usdPoolContract.token0(), usdPoolContract.token1(), usdPoolContract.fee(),
    rwiPoolContract.observe([1_800, 0]), usdPoolContract.observe([1_800, 0]),
    rwiPoolContract.slot0(), usdPoolContract.slot0(), provider.getBlockNumber(),
  ]);
  if (poolManagerCode === "0x" || stateViewCode === "0x" || quoterCode === "0x" || v3QuoterCode === "0x" || universalRouterCode === "0x" || permit2Code === "0x") {
    throw new Error("One or more pinned Uniswap settlement contracts has no runtime bytecode.");
  }
  if (![quoterManager, stateViewManager, universalRouterManager].every((value) => sameAddress(value, poolManager))) {
    throw new Error("A pinned Uniswap v4 integration points to the wrong PoolManager.");
  }
  if (!sameAddress(routerFactory, uniswapV3Factory) || !sameAddress(routerWeth, weth)) throw new Error("SwapRouter02 integration mismatch.");
  if (launchSpacing !== 200n || usdSpacing !== 1n || rwiDecimals !== 18n || wethDecimals !== 18n || usdgDecimals !== 6n) {
    throw new Error("Fee spacing or token-decimal assumptions do not match the reviewed build.");
  }
  if (!sameAddress(canonicalRwiPool, rwiWethPool) || !sameAddress(canonicalUsdPool, wethUsdgPool) || rwiFee !== 10_000n || usdFee !== 100n) {
    throw new Error("One or both Uniswap v3 oracle pools is not canonical.");
  }
  const rwiTokens = [rwiToken0, rwiToken1];
  const usdTokens = [usdToken0, usdToken1];
  if (!rwiTokens.some((value) => sameAddress(value, rwi)) || !rwiTokens.some((value) => sameAddress(value, weth))) throw new Error("RWI/WETH pool tokens mismatch.");
  if (!usdTokens.some((value) => sameAddress(value, weth)) || !usdTokens.some((value) => sameAddress(value, usdg))) throw new Error("WETH/USDG pool tokens mismatch.");
  const rwiMetrics = oracleMetrics(rwiObservation, rwiSlot0[1]);
  const usdMetrics = oracleMetrics(usdObservation, usdSlot0[1]);
  if (rwiMetrics.harmonicLiquidity < minRwiLiquidity || rwiMetrics.deviation > rwiDeviation) throw new Error("Live RWI/WETH oracle safeguards are not currently satisfied.");
  if (usdMetrics.harmonicLiquidity < minUsdLiquidity || usdMetrics.deviation > usdDeviation) throw new Error("Live WETH/USDG oracle safeguards are not currently satisfied.");

  await requireVerifiedSource(address);
  if (validateOnly) {
    console.log(`Validated source-verified v4 launch hook ${address} at Robinhood Chain block ${blockNumber}.`);
    return;
  }
  const auditAcknowledged = process.env.FACTORY_AUDIT_ACKNOWLEDGED === "true";
  const unauditedRiskAccepted = process.env.FACTORY_UNAUDITED_RISK_ACCEPTED === "true";
  if (!auditAcknowledged && !unauditedRiskAccepted) {
    throw new Error("Set FACTORY_AUDIT_ACKNOWLEDGED=true after an audit, or FACTORY_UNAUDITED_RISK_ACCEPTED=true to explicitly configure an unaudited deployment.");
  }

  const config = {
    chainId: 4663,
    factoryAddress: address,
    hookAddress: address,
    sourceVerified: true,
    independentAuditComplete: auditAcknowledged,
    unauditedRiskAccepted: !auditAcknowledged && unauditedRiskAccepted,
    allowBrowserDeployment: false,
    factoryAddressStorageKey: "rwi-launchpad-factory-address-v4-internal-match-dev-buy",
    protocol: "Uniswap v4",
    rewardMode: "internal-match-eth",
    launchesPaused: false,
    poolFee: 10000,
    poolTickSpacing: 200,
    rwiAddress: ethers.getAddress(rwi),
    wethAddress: ethers.getAddress(weth),
    usdgAddress: ethers.getAddress(usdg),
    uniswapV4PoolManager: ethers.getAddress(poolManager),
    uniswapV4StateView: ethers.getAddress(stateView),
    uniswapV4Quoter: EXPECTED.quoter,
    uniswapV3Quoter: EXPECTED.v3Quoter,
    uniswapV4UniversalRouter: ethers.getAddress(universalRouter),
    permit2: EXPECTED.permit2,
    uniswapV3Factory: ethers.getAddress(uniswapV3Factory),
    swapRouter02: ethers.getAddress(swapRouter),
    rwiWethOraclePool: ethers.getAddress(rwiWethPool),
    wethUsdgOraclePool: ethers.getAddress(wethUsdgPool),
    targetMarketCapUsd: 10000,
    pricingBasis: "30-minute RWI/WETH and WETH/USDG Uniswap v3 TWAPs",
    deploymentBlock: Number(process.env.ROBINHOOD_FACTORY_DEPLOYMENT_BLOCK || 0),
    configuredAtBlock: blockNumber,
    runtimeCodeHash: ethers.keccak256(code),
    legacyFactories: [
      {
        address: "0xB725d44EA09BA4c1C8650D79aDB84C06d3CbE000",
        deploymentBlock: 26105360,
        protocol: "Uniswap v4",
        feeMode: "eth",
        sourceVerified: true,
        runtimeCodeHash: "0x53e6b1dcf54cd79e6cdbec26fd3e5cb95bb5153da25b4424ac37ed372ff00ace",
        launchesDeprecated: true,
      },
      {
        address: "0x1CD4ba989b530E0c5bf13cB780346A2d2BAaE000",
        deploymentBlock: 26068777,
        protocol: "Uniswap v4",
        feeMode: "eth",
        sourceVerified: true,
        runtimeCodeHash: "0x9a9573b03ca9969ca2e1f89295f3bc051be88f62f2350b7fb8beedffa71c4938",
        launchesDeprecated: true,
      },
      {
        address: "0x660a415CA5C39E14d31e54Bf783eaE4f26A962fA",
        deploymentBlock: 25680584,
        protocol: "Uniswap v3",
        feeMode: "eth",
        sourceVerified: true,
        runtimeCodeHash: "0xca0036391b2672d29d9913aeaca5eed7087849c2a05ee952aef98d988a11abc3",
      },
      {
        address: "0xD8F82ed33D9663854b164705dafBD467f31C9F16",
        deploymentBlock: 25524373,
        protocol: "Uniswap v3",
        feeMode: "tokens",
        sourceVerified: true,
        runtimeCodeHash: "0xce400717e76333cba9a592494830fc55c8cf4e853442d276ef843006d38ebcba",
      },
    ],
  };
  fs.writeFileSync(path.resolve(__dirname, "..", "factory-config.js"), `window.RWI_FACTORY_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)});\n`);
  console.log(`Configured verified v4 launch hook ${address} at Robinhood Chain block ${blockNumber}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
