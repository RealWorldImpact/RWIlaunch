const RWI_ADDRESS = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const FACTORY_CONFIG = window.RWI_FACTORY_CONFIG || Object.freeze({});
const FACTORY_ABI = window.RWI_FACTORY_ABI || Object.freeze([]);
const QUOTE_FACTORY_CONFIG = window.RWI_QUOTE_FACTORY_CONFIG || Object.freeze({});
const QUOTE_FACTORY_ABI = window.RWI_QUOTE_FACTORY_ABI || Object.freeze([]);
const INTERNAL_MATCH_FEE_MODE = "internal-match-eth";
const MULTI_QUOTE_FEE_MODE = "internal-match-eth-90-10";
const LEGACY_V4_FACTORY_ABI = Object.freeze([
  "function launches(address token) view returns (address creator,bytes32 poolId,uint256 positionTokenId,uint128 liquidity,bool liquidityPermanentlyLocked,uint256 tokenAmount,uint256 initialRwiAmount,int24 tickLower,int24 tickUpper)",
]);
const LEGACY_FACTORY_ABI = Object.freeze([
  "function launches(address token) view returns (address creator,address pool,uint256 positionTokenId,uint128 liquidity,bool liquidityPermanentlyLocked,uint256 tokenAmount,uint256 initialRwiAmount)",
]);
const PROFILE_REGISTRY_CONFIG = window.RWI_PROFILE_REGISTRY || Object.freeze({});
const PROFILE_REGISTRY_ABI = window.RWI_PROFILE_REGISTRY_ABI || Object.freeze([]);
const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const EXPLORER_URL = "https://robinhoodchain.blockscout.com";
const V4_QUOTER = FACTORY_CONFIG.uniswapV4Quoter || "0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94";
const PERMIT2 = FACTORY_CONFIG.permit2 || "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const V4_UNIVERSAL_ROUTER = FACTORY_CONFIG.uniswapV4UniversalRouter || "0x8876789976dEcBfCbBbe364623C63652db8C0904";
const V4_STATE_VIEW = FACTORY_CONFIG.uniswapV4StateView || "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b";
const V3_QUOTER = FACTORY_CONFIG.uniswapV3Quoter || "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7";
const WETH_ADDRESS = FACTORY_CONFIG.wethAddress || "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
const USDG_ADDRESS = FACTORY_CONFIG.usdgAddress || "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";
const RWI_WETH_V3_FEE = 10_000;
const WETH_USDG_V3_FEE = 100;
const USDG_DECIMALS = 6;
const DIRECT_TRADE_SLIPPAGE_BPS = 300n;
const DIRECT_TRADE_HOP_SLIPPAGE_BPS = 150n;
const DIRECT_TRADE_DEADLINE_SECONDS = 10 * 60;
const ROUTER_MSG_SENDER = "0x0000000000000000000000000000000000000001";
const ROUTER_ADDRESS_THIS = "0x0000000000000000000000000000000000000002";
const ROUTER_CONTRACT_BALANCE = 1n << 255n;
const DIRECT_TRADE_DEFAULT_STATUS = "";
const PROFILE_PREFIX = "rwi-creator-profile:";
const TOKEN_METADATA_PREFIX = "rwi-token-metadata:";
const LOGO_DATABASE = "rwi-launchpad-assets-v1";
const LOGO_STORE = "logos";
const PROFILE_REGISTRY_LOCAL_ADDRESS_KEY = "rwi-profile-registry-address";
const PROFILE_REGISTRY_LOCAL_BLOCK_KEY = "rwi-profile-registry-block";
const DEXSCREENER_CHAIN_ID = "robinhood";
const DEXSCREENER_REFRESH_MS = 30_000;
const RWI_USD_CACHE_MS = 60_000;
const V4_STATE_VIEW_ABI = Object.freeze([
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96,int24 tick,uint24 protocolFee,uint24 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128 liquidity)",
  "function getPositionInfo(bytes32 poolId,address owner,int24 tickLower,int24 tickUpper,bytes32 salt) view returns (uint128 liquidity,uint256 feeGrowthInside0LastX128,uint256 feeGrowthInside1LastX128)",
]);
const V3_SPOT_POOL_ABI = Object.freeze([
  "function token0() view returns (address)",
  "function slot0() view returns (uint160 sqrtPriceX96,int24 tick,uint16 observationIndex,uint16 observationCardinality,uint16 observationCardinalityNext,uint8 feeProtocol,bool unlocked)",
]);
const ETH_USD_ORACLE_ABI = Object.freeze([
  "function ethUsdPriceE18() view returns (uint256 priceE18)",
]);
const KNOWN_METADATA = Object.freeze({
  "0xc29d66d54d2ed13fffdc89323e5a9d70c197eaec": {
    description: "Standard one-billion-supply test launch from the RWI Launchpad factory.",
    image: "assets/testcoin.png",
  },
});
const KNOWN_LAUNCHES = Object.freeze({
  "0xc29d66d54d2ed13fffdc89323e5a9d70c197eaec": {
    name: "Test",
    symbol: "TESTCOIN",
    decimals: 18,
    supply: 1_000_000_000n * 10n ** 18n,
    creator: "0x9CD7C9196A4C1836A3DF089cb210272e07e6A5e5",
    pool: "0x2350d77331F5290227133a27f0786473862Cb381",
    positionTokenId: 551_211n,
  },
});

const $ = (selector) => document.querySelector(selector);
const state = {
  token: null, creator: null, pool: null, poolId: null, positionTokenId: null,
  tokenSymbol: "TOKEN", tokenDecimals: 18, quoteSymbol: "RWI", settlementAsset: "ETH",
  imageUrl: null, creatorImageUrl: null, tradeDirection: "buy", tradeSource: null,
  tradeQuote: null, tradeQuoteRequest: 0, tradeInFlight: false,
  directTradeIntegrationsValidated: false,
  dexScreenerPair: null, dexScreenerRefreshTimer: null, dexScreenerRequest: 0,
  dexScreenerToken: null, dexScreenerLaunch: null,
  marketProvider: null, rwiUsdPrice: null, ethUsdPrice: null, rwiUsdUpdatedAt: 0,
  tokenRwiPrice: null, tokenUsdPrice: null,
};

function isAddress(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

function sameAddress(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}

function locallyDeployedFactoryAddress() {
  if (!FACTORY_CONFIG.allowBrowserDeployment || !FACTORY_CONFIG.factoryAddressStorageKey) return null;
  try {
    const address = localStorage.getItem(FACTORY_CONFIG.factoryAddressStorageKey);
    return isAddress(address) ? address : null;
  } catch {
    return null;
  }
}

function configuredFactorySources() {
  const sources = [];
  if (isAddress(QUOTE_FACTORY_CONFIG.factoryAddress)) sources.push({
    address: QUOTE_FACTORY_CONFIG.factoryAddress,
    current: true,
    protocol: "Uniswap v4",
    feeMode: MULTI_QUOTE_FEE_MODE,
  });
  const localReplacement = locallyDeployedFactoryAddress();
  const currentAddress = localReplacement || (isAddress(FACTORY_CONFIG.factoryAddress) ? FACTORY_CONFIG.factoryAddress : null);
  if (currentAddress) sources.push({
    address: currentAddress,
    current: true,
    protocol: "Uniswap v4",
    feeMode: localReplacement ? INTERNAL_MATCH_FEE_MODE : (FACTORY_CONFIG.rewardMode || FACTORY_CONFIG.feeMode || "eth"),
  });
  if (localReplacement && isAddress(FACTORY_CONFIG.factoryAddress) && !sameAddress(localReplacement, FACTORY_CONFIG.factoryAddress)) {
    sources.push({ address: FACTORY_CONFIG.factoryAddress, current: false, protocol: "Uniswap v4", feeMode: FACTORY_CONFIG.rewardMode || FACTORY_CONFIG.feeMode || "eth" });
  }
  for (const entry of FACTORY_CONFIG.legacyFactories || []) {
    if (isAddress(entry?.address) && !sources.some((source) => sameAddress(source.address, entry.address))) sources.push({ ...entry, current: false });
  }
  return sources;
}

function configuredFactoryAddresses() {
  return configuredFactorySources().map((source) => source.address);
}

function factoryAbiForSource(source) {
  if (source.protocol !== "Uniswap v4") return LEGACY_FACTORY_ABI;
  if (source.feeMode === MULTI_QUOTE_FEE_MODE) return QUOTE_FACTORY_ABI;
  return source.feeMode === INTERNAL_MATCH_FEE_MODE ? FACTORY_ABI : LEGACY_V4_FACTORY_ABI;
}

function isPoolId(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value) && !/^0x0{64}$/.test(value);
}

async function findFactoryLaunch(address, provider) {
  for (const source of configuredFactorySources()) {
    try {
      const factory = new window.ethers.Contract(source.address, factoryAbiForSource(source), provider);
      const launch = await factory.launches(address);
      const isV4 = source.protocol === "Uniswap v4";
      const hasPool = isV4 ? isPoolId(String(launch.poolId)) : isAddress(launch.pool);
      if (isAddress(launch.creator) && !sameAddress(launch.creator, window.ethers.ZeroAddress) && hasPool) {
        return { launch, factoryAddress: source.address, source };
      }
    } catch {
      // Continue through configured legacy factories.
    }
  }
  throw new Error("This token was not launched by a configured RWI launch factory.");
}

function withTimeout(promise, milliseconds, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function showTokenPageError(message) {
  const status = $("#tokenPageStatus");
  $("#tokenDashboard").hidden = true;
  status.hidden = false;
  status.classList.add("is-error");
  status.textContent = "";
  const title = document.createElement("strong");
  title.textContent = "Token page could not load";
  const detail = document.createElement("span");
  detail.textContent = String(message || "Unknown token-page error.").slice(0, 220);
  const back = document.createElement("a");
  back.href = "index.html#discover";
  back.textContent = "Return to all launches";
  status.appendChild(title);
  status.appendChild(detail);
  status.appendChild(back);
}

function formatSupply(raw, decimals) {
  const units = window.ethers.formatUnits(raw, decimals);
  const [whole, fraction = ""] = units.split(".");
  const grouped = BigInt(whole).toLocaleString("en-US");
  const trimmed = fraction.slice(0, 4).replace(/0+$/, "");
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}

function displayedTokenDescription(value, quoteSymbol = "RWI") {
  const text = String(value || "").trim();
  if (!text) return `A fixed-supply token launched directly into permanently locked TOKEN / ${quoteSymbol} liquidity.`;
  if (text.length === 280 && !/[.!?\u2026][\"')\]]?$/.test(text)) {
    const finalSpace = text.lastIndexOf(" ");
    const completeText = finalSpace > text.length - 32 ? text.slice(0, finalSpace) : text;
    return `${completeText.trimEnd()}\u2026`;
  }
  return text;
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("is-visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("is-visible"), 3000);
}

function uniswapSwapUrl(inputCurrency, outputCurrency) {
  const query = new URLSearchParams({ chain: "robinhood", inputCurrency, outputCurrency });
  return `https://app.uniswap.org/swap?${query.toString()}`;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatUsdPrice(value) {
  const number = finiteNumber(value);
  if (number === null || number <= 0) return "—";
  if (number >= 1) return number.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 6 });
  if (number >= 0.000001) return `$${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 10 })}`;
  const zeroCount = Math.max(1, -Math.floor(Math.log10(number)) - 1);
  const significant = (number * (10 ** (zeroCount + 1))).toPrecision(5).replace(".", "").replace(/0+$/, "") || "0";
  const subscript = String(zeroCount).replace(/[0-9]/g, (digit) => "₀₁₂₃₄₅₆₇₈₉"[Number(digit)]);
  return `$0.0${subscript}${significant}`;
}

function formatTokenRatio(value) {
  const number = finiteNumber(value);
  if (number === null || number <= 0) return "—";
  if (number >= 0.000001) return number.toLocaleString("en-US", { maximumSignificantDigits: 7 });
  return number.toExponential(4).replace("e-", "e−");
}

function dexScreenerPairTokens(pair) {
  return {
    base: String(pair?.baseToken?.address || ""),
    quote: String(pair?.quoteToken?.address || ""),
  };
}

function isLaunchTokenPair(pair, tokenAddress, launch) {
  const { base, quote } = dexScreenerPairTokens(pair);
  const expectedQuotes = launch?.quoteSymbol === "ETH" ? [window.ethers.ZeroAddress, WETH_ADDRESS] : [launch?.quoteAddress || RWI_ADDRESS];
  return expectedQuotes.some((expected) => (
    (sameAddress(base, tokenAddress) && sameAddress(quote, expected))
      || (sameAddress(quote, tokenAddress) && sameAddress(base, expected))
  ));
}

function selectDexScreenerPair(pairs, tokenAddress, launch) {
  const launchPool = launch?.poolId || launch?.pool || "";
  return (Array.isArray(pairs) ? pairs : [])
    .filter((pair) => pair?.chainId === DEXSCREENER_CHAIN_ID && pair?.dexId === "uniswap" && isLaunchTokenPair(pair, tokenAddress, launch))
    .sort((left, right) => {
      const leftExact = launchPool && String(left.pairAddress).toLowerCase() === String(launchPool).toLowerCase() ? 1 : 0;
      const rightExact = launchPool && String(right.pairAddress).toLowerCase() === String(launchPool).toLowerCase() ? 1 : 0;
      if (leftExact !== rightExact) return rightExact - leftExact;
      return (finiteNumber(right?.liquidity?.usd) || 0) - (finiteNumber(left?.liquidity?.usd) || 0);
    })[0] || null;
}

function tokenMarketValues(pair, tokenAddress) {
  const { base, quote } = dexScreenerPairTokens(pair);
  const nativePrice = finiteNumber(pair?.priceNative);
  const baseUsdPrice = finiteNumber(pair?.priceUsd);
  if (sameAddress(base, tokenAddress)) return { usd: baseUsdPrice, rwi: nativePrice };
  if (sameAddress(quote, tokenAddress) && nativePrice && nativePrice > 0) {
    return { usd: baseUsdPrice === null ? null : baseUsdPrice / nativePrice, rwi: 1 / nativePrice };
  }
  return { usd: null, rwi: null };
}

function tokenMarketChange24h(pair, tokenAddress) {
  const change = finiteNumber(pair?.priceChange?.h24);
  if (change === null) return null;
  const { quote } = dexScreenerPairTokens(pair);
  if (!sameAddress(quote, tokenAddress)) return change;
  const multiplier = 1 + (change / 100);
  return multiplier > 0 ? ((1 / multiplier) - 1) * 100 : null;
}

function marketProvider() {
  if (!state.marketProvider) state.marketProvider = new window.ethers.JsonRpcProvider(RPC_URL, 4663, { staticNetwork: true });
  return state.marketProvider;
}

function quoteFromSqrtPrice(sqrtPriceX96, baseIsToken0, baseDecimals = 18, quoteDecimals = 18) {
  const sqrtPrice = Number(sqrtPriceX96) / (2 ** 96);
  const token1PerToken0 = sqrtPrice * sqrtPrice;
  const rawQuotePerBase = baseIsToken0 ? token1PerToken0 : 1 / token1PerToken0;
  const quote = rawQuotePerBase * (10 ** (Number(baseDecimals) - Number(quoteDecimals)));
  return Number.isFinite(quote) && quote > 0 ? quote : null;
}

async function readV3Quote(poolAddress, baseToken, provider) {
  const pool = new window.ethers.Contract(poolAddress, V3_SPOT_POOL_ABI, provider);
  const [token0, slot0] = await Promise.all([pool.token0(), pool.slot0()]);
  return quoteFromSqrtPrice(slot0.sqrtPriceX96 ?? slot0[0], sameAddress(token0, baseToken));
}

async function readTokenRwiPriceOnchain(tokenAddress, launch, provider) {
  if (launch?.poolId) {
    const stateView = new window.ethers.Contract(V4_STATE_VIEW, V4_STATE_VIEW_ABI, provider);
    const slot0 = await stateView.getSlot0(launch.poolId);
    const quoteDecimals = launch.quoteSymbol === "USDG" ? USDG_DECIMALS : 18;
    return quoteFromSqrtPrice(
      slot0.sqrtPriceX96 ?? slot0[0],
      BigInt(tokenAddress) < BigInt(launch.quoteAddress || RWI_ADDRESS),
      state.tokenDecimals,
      quoteDecimals,
    );
  }
  if (launch?.pool) return readV3Quote(launch.pool, tokenAddress, provider);
  return null;
}

function rwiUsdPriceFromPairs(pairs) {
  return (Array.isArray(pairs) ? pairs : [])
    .map((pair) => {
      const { base, quote } = dexScreenerPairTokens(pair);
      const baseUsd = finiteNumber(pair?.priceUsd);
      const native = finiteNumber(pair?.priceNative);
      let price = null;
      if (sameAddress(base, RWI_ADDRESS)) price = baseUsd;
      if (sameAddress(quote, RWI_ADDRESS) && native && native > 0) price = baseUsd === null ? null : baseUsd / native;
      return { price, liquidity: finiteNumber(pair?.liquidity?.usd) || 0 };
    })
    .filter((entry) => entry.price && entry.price > 0)
    .sort((left, right) => right.liquidity - left.liquidity)[0]?.price || null;
}

async function readRwiUsdPrice(provider) {
  if (state.rwiUsdPrice && Date.now() - state.rwiUsdUpdatedAt < RWI_USD_CACHE_MS) return state.rwiUsdPrice;
  try {
    const oracleFactory = new window.ethers.Contract(FACTORY_CONFIG.factoryAddress, ETH_USD_ORACLE_ABI, provider);
    const [ethUsdRaw, wethPerRwi] = await Promise.all([
      oracleFactory.ethUsdPriceE18(),
      readV3Quote(FACTORY_CONFIG.rwiWethOraclePool, RWI_ADDRESS, provider),
    ]);
    const ethUsd = Number(window.ethers.formatUnits(ethUsdRaw, 18));
    const price = wethPerRwi * ethUsd;
    if (!Number.isFinite(ethUsd) || ethUsd <= 0 || !Number.isFinite(price) || price <= 0) {
      throw new Error("Invalid onchain ETH/RWI/USD price.");
    }
    state.ethUsdPrice = ethUsd;
    state.rwiUsdPrice = price;
    state.rwiUsdUpdatedAt = Date.now();
    return price;
  } catch {
    const endpoint = `/api/dexscreener-market?token=${encodeURIComponent(RWI_ADDRESS)}`;
    const response = await withTimeout(fetch(endpoint, { headers: { Accept: "application/json" } }), 8_000, "RWI price request timed out.");
    if (!response.ok) throw new Error("RWI price feed is unavailable.");
    const price = rwiUsdPriceFromPairs(await response.json());
    if (!price) throw new Error("RWI/USD price is unavailable.");
    state.rwiUsdPrice = price;
    state.rwiUsdUpdatedAt = Date.now();
    return price;
  }
}

async function readOnchainMarketValues(tokenAddress, launch) {
  const provider = marketProvider();
  const rwi = await readTokenRwiPriceOnchain(tokenAddress, launch, provider);
  if (!rwi) throw new Error("The Uniswap pool price is unavailable.");
  let usd = null;
  try {
    const quoteUsd = launch.quoteSymbol === "USDG"
      ? 1
      : launch.quoteSymbol === "ETH"
        ? await ensureEthUsdPrice(provider)
        : await readRwiUsdPrice(provider);
    usd = rwi * quoteUsd;
  } catch {
    // The RWI-denominated pool price remains useful while its USD reference recovers.
  }
  return { rwi, usd };
}

function setDexMarketChange(value) {
  const element = $("#dexChange24h");
  const number = finiteNumber(value);
  element.classList.remove("is-positive", "is-negative");
  if (number === null) {
    element.textContent = "—";
    return;
  }
  element.textContent = `${number > 0 ? "+" : ""}${number.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
  if (number > 0) element.classList.add("is-positive");
  if (number < 0) element.classList.add("is-negative");
}

function dextoolsPairUrl(pairId) {
  return `https://www.dextools.io/app/en/robinhood/pair-explorer/${encodeURIComponent(pairId)}`;
}

function renderDextoolsChart(pairId) {
  if (!/^0x(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})$/.test(String(pairId || ""))) return;
  const chartUrl = `https://www.dextools.io/widget-chart/en/robinhood/pe-light/${encodeURIComponent(pairId)}?theme=dark&chartType=1&chartResolution=30&drawingToolbars=false&chartInUsd=true&showTradeHistory=false&headerColor=0b0b09&tvPlatformColor=1f2b3d&tvPaneColor=1f2b3d`;
  const chart = $("#dextoolsChart");
  if (!chart) return;
  if (chart.src !== chartUrl) chart.src = chartUrl;
  chart.hidden = false;
  const status = $("#dextoolsChartStatus");
  if (status) status.hidden = true;
  const link = $("#dextoolsMarketLink");
  if (link) link.href = dextoolsPairUrl(pairId);
}

function showDexScreenerWaiting(tokenAddress, message = "Reading the token/RWI spot price directly from its Uniswap pool.") {
  state.dexScreenerPair = null;
  $("#dexPriceUsd").textContent = "Calculating onchain…";
  $("#dexPriceRwi").textContent = "Reading the Uniswap pool";
  setDexMarketChange(null);
  $("#dexMarketUpdated").textContent = message;
}

function renderOnchainMarketPrice(values, pair, tokenAddress) {
  state.dexScreenerPair = pair || { onchain: true };
  state.tokenRwiPrice = finiteNumber(values.rwi);
  state.tokenUsdPrice = finiteNumber(values.usd);
  if (state.dexScreenerLaunch?.quoteSymbol === "RWI" && !state.rwiUsdPrice && state.tokenRwiPrice && state.tokenUsdPrice) state.rwiUsdPrice = state.tokenUsdPrice / state.tokenRwiPrice;
  const quoteSymbol = state.dexScreenerLaunch?.quoteSymbol || "RWI";
  const priceElement = $("#dexPriceUsd");
  priceElement.textContent = values.usd ? formatUsdPrice(values.usd) : `${formatTokenRatio(values.rwi)} ${quoteSymbol}`;
  priceElement.title = values.usd ? `$${values.usd.toLocaleString("en-US", { maximumFractionDigits: 18 })}` : `Live TOKEN/${quoteSymbol} Uniswap spot price`;
  $("#dexPriceRwi").textContent = `${formatTokenRatio(values.rwi)} ${quoteSymbol} per token`;
  setDexMarketChange(pair ? tokenMarketChange24h(pair, tokenAddress) : null);
  if (pair?.pairAddress) renderDextoolsChart(String(pair.pairAddress));
  const updated = new Date();
  $("#dexMarketUpdated").textContent = `Onchain Uniswap spot price · updated ${updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`;
  if ($("#tradeAmount")?.value.trim()) scheduleDirectTradeQuote();
}

function renderDexScreenerPair(pair, tokenAddress) {
  state.dexScreenerPair = pair;
  const values = tokenMarketValues(pair, tokenAddress);
  state.tokenRwiPrice = finiteNumber(values.rwi);
  state.tokenUsdPrice = finiteNumber(values.usd);
  if (state.dexScreenerLaunch?.quoteSymbol === "RWI" && !state.rwiUsdPrice && state.tokenRwiPrice && state.tokenUsdPrice) state.rwiUsdPrice = state.tokenUsdPrice / state.tokenRwiPrice;
  $("#dexPriceUsd").textContent = formatUsdPrice(values.usd);
  $("#dexPriceRwi").textContent = `${formatTokenRatio(values.rwi)} ${state.dexScreenerLaunch?.quoteSymbol || "RWI"} per token`;
  setDexMarketChange(tokenMarketChange24h(pair, tokenAddress));
  const pairAddress = String(pair.pairAddress || "");
  renderDextoolsChart(pairAddress);
  const updated = new Date();
  $("#dexMarketUpdated").textContent = `Live feed updated ${updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`;
  if ($("#tradeAmount")?.value.trim()) scheduleDirectTradeQuote();
}

async function refreshDexScreenerMarket(tokenAddress, launch) {
  const requestId = ++state.dexScreenerRequest;
  const [marketResult, pairResult] = await Promise.allSettled([
    readOnchainMarketValues(tokenAddress, launch),
    (async () => {
      const endpoint = `/api/dexscreener-market?token=${encodeURIComponent(tokenAddress)}`;
      const response = await withTimeout(fetch(endpoint, { headers: { Accept: "application/json" } }), 8_000, "Dexscreener request timed out.");
      if (!response.ok) throw new Error(`Dexscreener returned ${response.status}.`);
      return selectDexScreenerPair(await response.json(), tokenAddress, launch);
    })(),
  ]);
  if (requestId !== state.dexScreenerRequest) return;
  const pair = pairResult.status === "fulfilled" ? pairResult.value : null;
  if (marketResult.status === "fulfilled") renderOnchainMarketPrice(marketResult.value, pair, tokenAddress);
  else if (pair) renderDexScreenerPair(pair, tokenAddress);
  else showDexScreenerWaiting(tokenAddress, "Live price is temporarily unavailable · retrying automatically");
}

function startDexScreenerFeed(tokenAddress, launch) {
  clearInterval(state.dexScreenerRefreshTimer);
  state.dexScreenerRefreshTimer = null;
  state.dexScreenerToken = tokenAddress;
  state.dexScreenerLaunch = launch;
  $("#tokenMarketLive").hidden = false;
  showDexScreenerWaiting(tokenAddress);
  renderDextoolsChart(launch?.poolId || launch?.pool);
  refreshDexScreenerMarket(tokenAddress, launch);
  if (!document.hidden) {
    state.dexScreenerRefreshTimer = setInterval(() => refreshDexScreenerMarket(tokenAddress, launch), DEXSCREENER_REFRESH_MS);
  }
}

function handleMarketVisibilityChange() {
  clearInterval(state.dexScreenerRefreshTimer);
  state.dexScreenerRefreshTimer = null;
  if (document.hidden || !state.dexScreenerToken || !state.dexScreenerLaunch) return;
  refreshDexScreenerMarket(state.dexScreenerToken, state.dexScreenerLaunch);
  state.dexScreenerRefreshTimer = setInterval(
    () => refreshDexScreenerMarket(state.dexScreenerToken, state.dexScreenerLaunch),
    DEXSCREENER_REFRESH_MS,
  );
}

function setDirectTradeStatus(message, warning = false) {
  const element = $("#directTradeStatus");
  element.textContent = String(message || "");
  element.hidden = !element.textContent;
  element.classList.toggle("is-warning", warning);
}

function directTradePoolKey() {
  if (!state.token || !state.tradeSource?.address) throw new Error("The v4 launch source is unavailable.");
  const quoteAddress = state.tradeSource.quoteAddress || RWI_ADDRESS;
  const tokenIs0 = BigInt(state.token) < BigInt(quoteAddress);
  return [
    tokenIs0 ? state.token : quoteAddress,
    tokenIs0 ? quoteAddress : state.token,
    Number(FACTORY_CONFIG.poolFee || 10_000),
    Number(FACTORY_CONFIG.poolTickSpacing || 200),
    state.tradeSource.address,
  ];
}

function directTradeCurrencies() {
  const quoteAddress = state.tradeSource?.quoteAddress || RWI_ADDRESS;
  const inputCurrency = state.tradeDirection === "buy" ? quoteAddress : state.token;
  const outputCurrency = state.tradeDirection === "buy" ? state.token : quoteAddress;
  const poolKey = directTradePoolKey();
  return { inputCurrency, outputCurrency, poolKey, zeroForOne: sameAddress(inputCurrency, poolKey[0]) };
}

function settlementAssetConfig(asset = state.settlementAsset) {
  return asset === "USDG"
    ? { symbol: "USDG", address: USDG_ADDRESS, decimals: USDG_DECIMALS, native: false }
    : { symbol: "ETH", address: null, decimals: 18, native: true };
}

function directQuoteAssetConfig() {
  const symbol = state.tradeSource?.quoteSymbol === "USDG" ? "USDG" : "ETH";
  return symbol === "USDG"
    ? { symbol, address: USDG_ADDRESS, decimals: USDG_DECIMALS, native: false }
    : { symbol, address: window.ethers.ZeroAddress, decimals: 18, native: true };
}

function directQuoteBridgeExactInputPath(inputAsset, outputAsset) {
  const inputToken = inputAsset === "ETH" ? WETH_ADDRESS : USDG_ADDRESS;
  const outputToken = outputAsset === "ETH" ? WETH_ADDRESS : USDG_ADDRESS;
  if (sameAddress(inputToken, outputToken)) throw new Error("A cross-settlement bridge requires different assets.");
  return window.ethers.solidityPacked(["address", "uint24", "address"], [inputToken, WETH_USDG_V3_FEE, outputToken]);
}

function directQuoteBridgeExactOutputPath(inputAsset, outputAsset) {
  const inputToken = inputAsset === "ETH" ? WETH_ADDRESS : USDG_ADDRESS;
  const outputToken = outputAsset === "ETH" ? WETH_ADDRESS : USDG_ADDRESS;
  if (sameAddress(inputToken, outputToken)) throw new Error("A cross-settlement bridge requires different assets.");
  return window.ethers.solidityPacked(["address", "uint24", "address"], [outputToken, WETH_USDG_V3_FEE, inputToken]);
}

function applySlippage(value, bps = DIRECT_TRADE_SLIPPAGE_BPS) {
  return BigInt(value) * (10_000n - bps) / 10_000n;
}

function v3BridgeExactInputPath(asset = state.settlementAsset, direction = state.tradeDirection) {
  if (direction === "buy") {
    return asset === "USDG"
      ? window.ethers.solidityPacked(
        ["address", "uint24", "address", "uint24", "address"],
        [USDG_ADDRESS, WETH_USDG_V3_FEE, WETH_ADDRESS, RWI_WETH_V3_FEE, RWI_ADDRESS],
      )
      : window.ethers.solidityPacked(["address", "uint24", "address"], [WETH_ADDRESS, RWI_WETH_V3_FEE, RWI_ADDRESS]);
  }
  return asset === "USDG"
    ? window.ethers.solidityPacked(
      ["address", "uint24", "address", "uint24", "address"],
      [RWI_ADDRESS, RWI_WETH_V3_FEE, WETH_ADDRESS, WETH_USDG_V3_FEE, USDG_ADDRESS],
    )
    : window.ethers.solidityPacked(["address", "uint24", "address"], [RWI_ADDRESS, RWI_WETH_V3_FEE, WETH_ADDRESS]);
}

function v3BridgeExactOutputPath(asset = state.settlementAsset) {
  return asset === "USDG"
    ? window.ethers.solidityPacked(
      ["address", "uint24", "address", "uint24", "address"],
      [RWI_ADDRESS, RWI_WETH_V3_FEE, WETH_ADDRESS, WETH_USDG_V3_FEE, USDG_ADDRESS],
    )
    : window.ethers.solidityPacked(["address", "uint24", "address"], [RWI_ADDRESS, RWI_WETH_V3_FEE, WETH_ADDRESS]);
}

function legacyV3TradePath(direction, asset, tokenFee) {
  const settlementToken = asset === "USDG" ? USDG_ADDRESS : WETH_ADDRESS;
  const types = asset === "USDG"
    ? ["address", "uint24", "address", "uint24", "address", "uint24", "address"]
    : ["address", "uint24", "address", "uint24", "address"];
  const buyValues = asset === "USDG"
    ? [settlementToken, WETH_USDG_V3_FEE, WETH_ADDRESS, RWI_WETH_V3_FEE, RWI_ADDRESS, tokenFee, state.token]
    : [settlementToken, RWI_WETH_V3_FEE, RWI_ADDRESS, tokenFee, state.token];
  const sellValues = asset === "USDG"
    ? [state.token, tokenFee, RWI_ADDRESS, RWI_WETH_V3_FEE, WETH_ADDRESS, WETH_USDG_V3_FEE, settlementToken]
    : [state.token, tokenFee, RWI_ADDRESS, RWI_WETH_V3_FEE, settlementToken];
  return window.ethers.solidityPacked(types, direction === "buy" ? buyValues : sellValues);
}

function formatTradeUnits(value, symbol, decimals = 18) {
  const raw = window.ethers.formatUnits(value, decimals);
  const [whole, fraction = ""] = raw.split(".");
  const trimmed = fraction.slice(0, 8).replace(/0+$/, "");
  if (BigInt(value) > 0n && whole === "0" && !trimmed) return `<0.00000001 ${symbol}`;
  return `${BigInt(whole).toLocaleString("en-US")}${trimmed ? `.${trimmed}` : ""} ${symbol}`;
}

function readTradeUsdValue() {
  const raw = $("#tradeAmount").value.trim();
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(raw)) throw new Error("Enter a valid USD amount.");
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a USD amount greater than zero.");
  return value;
}

function tradeInputAsset() {
  const settlement = settlementAssetConfig();
  const buying = state.tradeDirection === "buy";
  const symbol = buying ? settlement.symbol : state.tokenSymbol;
  const decimals = buying ? settlement.decimals : state.tokenDecimals;
  const usdPrice = buying
    ? (settlement.native ? finiteNumber(state.ethUsdPrice) : 1)
    : finiteNumber(state.tokenUsdPrice);
  if (!usdPrice || usdPrice <= 0) throw new Error("Waiting for the live USD price…");
  return { symbol, usdPrice, decimals };
}

function parseTradeAssetUnits(value, decimals = 18) {
  if (!Number.isFinite(value) || value <= 0 || value >= 1e21) throw new Error("That USD amount is outside the supported range.");
  const normalized = value.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
  return window.ethers.parseUnits(normalized, decimals);
}

function readTradeAmount() {
  const usdValue = readTradeUsdValue();
  const { symbol, usdPrice, decimals } = tradeInputAsset();
  const amount = parseTradeAssetUnits(usdValue / usdPrice, decimals);
  if (amount <= 0n) throw new Error("Enter an amount greater than zero.");
  if (amount > (1n << 128n) - 1n) throw new Error("That amount is too large.");
  return { amount, usdValue, symbol, usdPrice, decimals };
}

function updateTradeInputConversion(details = null) {
  const element = $("#tradeInputConversion");
  if (!element) return;
  try {
    const conversion = details || readTradeAmount();
    element.textContent = `≈ ${formatTradeUnits(conversion.amount, conversion.symbol, conversion.decimals)} will leave your wallet`;
  } catch (error) {
    const hasInput = Boolean($("#tradeAmount").value.trim());
    const symbol = state.tradeDirection === "buy" ? state.settlementAsset : state.tokenSymbol;
    element.textContent = hasInput ? (error?.message || "USD conversion unavailable") : `Converted to ${symbol} at the live spot price`;
  }
}

async function validateDirectTradeIntegrations(provider) {
  if (state.directTradeIntegrationsValidated) return;
  const expectedPoolManager = FACTORY_CONFIG.uniswapV4PoolManager;
  const integrations = [V4_QUOTER, V3_QUOTER, V4_STATE_VIEW, V4_UNIVERSAL_ROUTER, PERMIT2, WETH_ADDRESS, USDG_ADDRESS];
  if (!isAddress(expectedPoolManager) || integrations.some((address) => !isAddress(address))) {
    throw new Error("The pinned Uniswap settlement configuration is incomplete.");
  }
  const codes = await Promise.all(integrations.map((address) => provider.getCode(address)));
  if (codes.some((code) => code === "0x")) throw new Error("A pinned Uniswap settlement contract has no deployed code.");
  const immutableStateAbi = ["function poolManager() view returns(address)"];
  const managerAddresses = await Promise.all([V4_QUOTER, V4_STATE_VIEW, V4_UNIVERSAL_ROUTER].map((address) => (
    new window.ethers.Contract(address, immutableStateAbi, provider).poolManager()
  )));
  if (managerAddresses.some((address) => !sameAddress(address, expectedPoolManager))) {
    throw new Error("A pinned Uniswap v4 integration points to the wrong PoolManager.");
  }
  state.directTradeIntegrationsValidated = true;
}

async function ensureEthUsdPrice(provider) {
  if (finiteNumber(state.ethUsdPrice)) return state.ethUsdPrice;
  const oracleFactory = new window.ethers.Contract(FACTORY_CONFIG.factoryAddress, ETH_USD_ORACLE_ABI, provider);
  const raw = await oracleFactory.ethUsdPriceE18();
  const value = Number(window.ethers.formatUnits(raw, 18));
  if (!Number.isFinite(value) || value <= 0) throw new Error("The ETH/USD reference is temporarily unavailable.");
  state.ethUsdPrice = value;
  return value;
}

function v3Quoter(provider) {
  return new window.ethers.Contract(V3_QUOTER, [
    "function quoteExactInput(bytes path,uint256 amountIn) returns (uint256 amountOut,uint160[] sqrtPriceX96AfterList,uint32[] initializedTicksCrossedList,uint256 gasEstimate)",
    "function quoteExactOutput(bytes path,uint256 amountOut) returns (uint256 amountIn,uint160[] sqrtPriceX96AfterList,uint32[] initializedTicksCrossedList,uint256 gasEstimate)",
  ], provider);
}

async function quoteV3ExactInput(provider, path, amountIn) {
  const result = await v3Quoter(provider).quoteExactInput.staticCall(path, amountIn);
  return BigInt(result.amountOut ?? result[0]);
}

async function quoteV3ExactOutput(provider, path, amountOut) {
  const result = await v3Quoter(provider).quoteExactOutput.staticCall(path, amountOut);
  return BigInt(result.amountIn ?? result[0]);
}

async function legacyV3PoolFee(provider) {
  if (state.tradeSource?.protocol !== "Uniswap v3") return null;
  if (state.tradeSource.poolFee) return state.tradeSource.poolFee;
  if (!isAddress(state.tradeSource.poolAddress)) throw new Error("The token/RWI v3 pool is unavailable.");
  const pool = new window.ethers.Contract(state.tradeSource.poolAddress, ["function fee() view returns(uint24)"], provider);
  const fee = Number(await pool.fee());
  if (!Number.isInteger(fee) || fee <= 0 || fee >= 1_000_000) throw new Error("The token/RWI pool fee is invalid.");
  state.tradeSource.poolFee = fee;
  return fee;
}

async function quoteDirectTrade({ quiet = false } = {}) {
  if (!state.tradeSource) return null;
  const requestId = ++state.tradeQuoteRequest;
  try {
    const provider = new window.ethers.JsonRpcProvider(RPC_URL, 4663, { staticNetwork: true });
    await validateDirectTradeIntegrations(provider);
    if (state.settlementAsset === "ETH") await ensureEthUsdPrice(provider);
    const tradeAmount = readTradeAmount();
    updateTradeInputConversion(tradeAmount);
    const settlement = settlementAssetConfig();
    const buying = state.tradeDirection === "buy";
    const routeQuoteSymbol = state.tradeSource.directQuote ? state.tradeSource.quoteSymbol : "RWI";
    const routeMiddle = routeQuoteSymbol === settlement.symbol ? "" : ` → ${routeQuoteSymbol}`;
    if (!quiet) $("#tradeQuote").textContent = `Finding ${buying ? `${settlement.symbol}${routeMiddle} → $${state.tokenSymbol}` : `$${state.tokenSymbol} → ${routeQuoteSymbol}${routeMiddle ? ` → ${settlement.symbol}` : ""}`} route…`;

    if (state.tradeSource.protocol === "Uniswap v3") {
      const tokenFee = await legacyV3PoolFee(provider);
      const path = legacyV3TradePath(state.tradeDirection, state.settlementAsset, tokenFee);
      const amountOut = await quoteV3ExactInput(provider, path, tradeAmount.amount);
      if (requestId !== state.tradeQuoteRequest) return null;
      if (amountOut <= 0n) throw new Error("The route returned no output for that amount.");
      const minimumAmountOut = applySlippage(amountOut);
      const outputSymbol = buying ? state.tokenSymbol : settlement.symbol;
      const outputDecimals = buying ? state.tokenDecimals : settlement.decimals;
      state.tradeQuote = {
        routeProtocol: "v3",
        direction: state.tradeDirection,
        amountIn: tradeAmount.amount,
        amountOut,
        minimumAmountOut,
        v3Path: path,
        settlementAsset: state.settlementAsset,
        settlement,
        walletInputCurrency: buying ? settlement.address : state.token,
        walletInputDecimals: buying ? settlement.decimals : state.tokenDecimals,
        inputSymbol: tradeAmount.symbol,
        usdValue: tradeAmount.usdValue,
      };
      $("#tradeQuote").textContent = formatTradeUnits(minimumAmountOut, outputSymbol, outputDecimals);
      setDirectTradeStatus("");
      return state.tradeQuote;
    }

    const { inputCurrency, outputCurrency, poolKey, zeroForOne } = directTradeCurrencies();
    const quoter = new window.ethers.Contract(V4_QUOTER, [
      "function quoteExactInputSingle(((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bool zeroForOne,uint128 exactAmount,bytes hookData) params) returns (uint256 amountOut,uint256 gasEstimate)",
    ], provider);

    if (state.tradeSource.directQuote) {
      const poolQuote = directQuoteAssetConfig();
      const crossSettlement = poolQuote.symbol !== settlement.symbol;
      if (!crossSettlement) {
        const [directAmountOut] = await quoter.quoteExactInputSingle.staticCall([poolKey, zeroForOne, tradeAmount.amount, "0x"]);
        if (requestId !== state.tradeQuoteRequest) return null;
        if (directAmountOut <= 0n) throw new Error("The direct pool returned no output for that amount.");
        const minimumAmountOut = applySlippage(directAmountOut, DIRECT_TRADE_HOP_SLIPPAGE_BPS);
        state.tradeQuote = {
          routeProtocol: "v4",
          directQuote: true,
          crossSettlement: false,
          direction: state.tradeDirection,
          amountIn: tradeAmount.amount,
          amountOut: directAmountOut,
          minimumAmountOut,
          quoteAmount: buying ? tradeAmount.amount : directAmountOut,
          minimumQuoteOut: buying ? 0n : minimumAmountOut,
          settlementAsset: state.settlementAsset,
          settlement,
          poolQuote,
          walletInputCurrency: buying ? settlement.address : state.token,
          walletInputDecimals: buying ? settlement.decimals : state.tokenDecimals,
          inputSymbol: tradeAmount.symbol,
          inputCurrency,
          outputCurrency,
          poolKey,
          zeroForOne,
          usdValue: tradeAmount.usdValue,
        };
        $("#tradeQuote").textContent = formatTradeUnits(minimumAmountOut, buying ? state.tokenSymbol : settlement.symbol, buying ? state.tokenDecimals : settlement.decimals);
      } else if (buying) {
        const bridgeInputPath = directQuoteBridgeExactInputPath(settlement.symbol, poolQuote.symbol);
        const maximumPoolQuote = await quoteV3ExactInput(provider, bridgeInputPath, tradeAmount.amount);
        const quoteAmount = applySlippage(maximumPoolQuote, DIRECT_TRADE_HOP_SLIPPAGE_BPS);
        if (quoteAmount <= 0n || quoteAmount > (1n << 128n) - 1n) throw new Error("The settlement bridge returned an invalid pool-quote amount.");
        const bridgePath = directQuoteBridgeExactOutputPath(settlement.symbol, poolQuote.symbol);
        const estimatedSettlementIn = await quoteV3ExactOutput(provider, bridgePath, quoteAmount);
        if (estimatedSettlementIn > tradeAmount.amount) throw new Error("The settlement bridge exceeds the selected spend limit.");
        const [tokenOut] = await quoter.quoteExactInputSingle.staticCall([poolKey, zeroForOne, quoteAmount, "0x"]);
        if (requestId !== state.tradeQuoteRequest) return null;
        if (tokenOut <= 0n) throw new Error("The direct token pool returned no output for that amount.");
        const minimumAmountOut = applySlippage(tokenOut, DIRECT_TRADE_HOP_SLIPPAGE_BPS);
        state.tradeQuote = {
          routeProtocol: "v4",
          directQuote: true,
          crossSettlement: true,
          direction: "buy",
          amountIn: tradeAmount.amount,
          amountOut: tokenOut,
          minimumAmountOut,
          quoteAmount,
          minimumQuoteOut: 0n,
          estimatedSettlementIn,
          bridgePath,
          settlementAsset: state.settlementAsset,
          settlement,
          poolQuote,
          walletInputCurrency: settlement.address,
          walletInputDecimals: settlement.decimals,
          inputSymbol: settlement.symbol,
          inputCurrency,
          outputCurrency,
          poolKey,
          zeroForOne,
          usdValue: tradeAmount.usdValue,
        };
        $("#tradeQuote").textContent = formatTradeUnits(minimumAmountOut, state.tokenSymbol, state.tokenDecimals);
      } else {
        const [poolQuoteOut] = await quoter.quoteExactInputSingle.staticCall([poolKey, zeroForOne, tradeAmount.amount, "0x"]);
        if (poolQuoteOut <= 0n) throw new Error(`The token pool returned no ${poolQuote.symbol} output for that amount.`);
        const minimumQuoteOut = applySlippage(poolQuoteOut, DIRECT_TRADE_HOP_SLIPPAGE_BPS);
        const bridgePath = directQuoteBridgeExactInputPath(poolQuote.symbol, settlement.symbol);
        const settlementOut = await quoteV3ExactInput(provider, bridgePath, minimumQuoteOut);
        if (requestId !== state.tradeQuoteRequest) return null;
        if (settlementOut <= 0n) throw new Error("The settlement bridge returned no output for that amount.");
        const minimumAmountOut = applySlippage(settlementOut, DIRECT_TRADE_HOP_SLIPPAGE_BPS);
        state.tradeQuote = {
          routeProtocol: "v4",
          directQuote: true,
          crossSettlement: true,
          direction: "sell",
          amountIn: tradeAmount.amount,
          amountOut: settlementOut,
          minimumAmountOut,
          quoteAmount: poolQuoteOut,
          minimumQuoteOut,
          bridgePath,
          settlementAsset: state.settlementAsset,
          settlement,
          poolQuote,
          walletInputCurrency: state.token,
          walletInputDecimals: state.tokenDecimals,
          inputSymbol: state.tokenSymbol,
          inputCurrency,
          outputCurrency,
          poolKey,
          zeroForOne,
          usdValue: tradeAmount.usdValue,
        };
        $("#tradeQuote").textContent = formatTradeUnits(minimumAmountOut, settlement.symbol, settlement.decimals);
      }
    } else if (buying) {
      const bridgeInputPath = v3BridgeExactInputPath(state.settlementAsset, "buy");
      const bridgeMaximumRwi = await quoteV3ExactInput(provider, bridgeInputPath, tradeAmount.amount);
      const rwiAmount = applySlippage(bridgeMaximumRwi, DIRECT_TRADE_HOP_SLIPPAGE_BPS);
      if (rwiAmount <= 0n || rwiAmount > (1n << 128n) - 1n) throw new Error("The bridge route returned an invalid RWI amount.");
      const bridgeOutputPath = v3BridgeExactOutputPath(state.settlementAsset);
      const estimatedSettlementIn = await quoteV3ExactOutput(provider, bridgeOutputPath, rwiAmount);
      if (estimatedSettlementIn > tradeAmount.amount) throw new Error("The bridge route exceeds the selected spend limit.");
      const [tokenOut] = await quoter.quoteExactInputSingle.staticCall([poolKey, zeroForOne, rwiAmount, "0x"]);
      if (requestId !== state.tradeQuoteRequest) return null;
      if (tokenOut <= 0n) throw new Error("The token pool returned no output for that amount.");
      const minimumAmountOut = applySlippage(tokenOut, DIRECT_TRADE_HOP_SLIPPAGE_BPS);
      state.tradeQuote = {
        routeProtocol: "v4",
        direction: "buy",
        amountIn: tradeAmount.amount,
        amountOut: tokenOut,
        minimumAmountOut,
        rwiAmount,
        estimatedSettlementIn,
        bridgePath: bridgeOutputPath,
        settlementAsset: state.settlementAsset,
        settlement,
        walletInputCurrency: settlement.address,
        walletInputDecimals: settlement.decimals,
        inputSymbol: settlement.symbol,
        inputCurrency,
        outputCurrency,
        poolKey,
        zeroForOne,
        usdValue: tradeAmount.usdValue,
      };
      $("#tradeQuote").textContent = formatTradeUnits(minimumAmountOut, state.tokenSymbol, state.tokenDecimals);
    } else {
      const [rwiOut] = await quoter.quoteExactInputSingle.staticCall([poolKey, zeroForOne, tradeAmount.amount, "0x"]);
      if (rwiOut <= 0n) throw new Error("The token pool returned no RWI output for that amount.");
      const minimumRwiOut = applySlippage(rwiOut, DIRECT_TRADE_HOP_SLIPPAGE_BPS);
      const bridgePath = v3BridgeExactInputPath(state.settlementAsset, "sell");
      const settlementOut = await quoteV3ExactInput(provider, bridgePath, minimumRwiOut);
      if (requestId !== state.tradeQuoteRequest) return null;
      if (settlementOut <= 0n) throw new Error("The settlement route returned no output for that amount.");
      const minimumAmountOut = applySlippage(settlementOut, DIRECT_TRADE_HOP_SLIPPAGE_BPS);
      state.tradeQuote = {
        routeProtocol: "v4",
        direction: "sell",
        amountIn: tradeAmount.amount,
        amountOut: settlementOut,
        minimumAmountOut,
        minimumRwiOut,
        bridgePath,
        settlementAsset: state.settlementAsset,
        settlement,
        walletInputCurrency: state.token,
        walletInputDecimals: state.tokenDecimals,
        inputSymbol: state.tokenSymbol,
        inputCurrency,
        outputCurrency,
        poolKey,
        zeroForOne,
        usdValue: tradeAmount.usdValue,
      };
      $("#tradeQuote").textContent = formatTradeUnits(minimumAmountOut, settlement.symbol, settlement.decimals);
    }
    setDirectTradeStatus("");
    return state.tradeQuote;
  } catch (error) {
    if (requestId !== state.tradeQuoteRequest) return null;
    state.tradeQuote = null;
    $("#tradeQuote").textContent = "No quote";
    const rawMessage = error?.shortMessage || error?.reason || error?.message || "A direct quote is not available.";
    const message = /execution reverted|missing revert data|could not decode result/i.test(rawMessage)
      ? `The ${state.settlementAsset} route could not quote that size. Try a smaller USD amount.`
      : rawMessage;
    setDirectTradeStatus(message, true);
    if (!quiet && !$("#tradeAmount").value.trim()) {
      $("#tradeQuote").textContent = "Enter a USD amount";
      setDirectTradeStatus(DIRECT_TRADE_DEFAULT_STATUS);
    }
    return null;
  }
}

function scheduleDirectTradeQuote() {
  clearTimeout(scheduleDirectTradeQuote.timer);
  state.tradeQuote = null;
  updateTradeInputConversion();
  syncQuickTradeAmounts();
  if (!$("#tradeAmount").value.trim()) {
    $("#tradeQuote").textContent = "Enter a USD amount";
    setDirectTradeStatus(DIRECT_TRADE_DEFAULT_STATUS);
    refreshPoolActivation();
    return;
  }
  scheduleDirectTradeQuote.timer = setTimeout(() => quoteDirectTrade(), 350);
}

function selectTradeDirection(direction) {
  const symbol = state.tokenSymbol || "TOKEN";
  const settlement = settlementAssetConfig();
  state.tradeDirection = direction;
  state.tradeQuote = null;
  $("#tradeBuyTab").setAttribute("aria-selected", String(direction === "buy"));
  $("#tradeSellTab").setAttribute("aria-selected", String(direction === "sell"));
  $("#tradeBuyTab").textContent = "BUY";
  $("#tradeSellTab").textContent = "SELL";
  $("#tradeDirectionLabel").textContent = direction === "buy" ? `Buy $${symbol}` : `Sell $${symbol}`;
  $("#tradeInputLabel").textContent = direction === "buy" ? "USD amount to spend" : "USD value to sell";
  $("#tradeInputSymbol").textContent = "USD";
  $("#tradeAmount").placeholder = direction === "buy" ? "" : "25.00";
  $("#tradeSettlementLabel").textContent = direction === "buy" ? "Pay with" : "Receive in";
  $("#tradeQuoteLabel").textContent = direction === "buy" ? `$${symbol} received at least` : `${settlement.symbol} received at least`;
  if (!state.tradeInFlight) $("#directTradeButton").textContent = directTradeButtonText();
  scheduleDirectTradeQuote();
}

function selectSettlementAsset(asset) {
  if (!['ETH', 'USDG'].includes(asset)) return;
  state.settlementAsset = asset;
  state.tradeQuote = null;
  document.querySelectorAll("[data-settlement-asset]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.settlementAsset === asset));
  });
  selectTradeDirection(state.tradeDirection);
}

function directTradeButtonText() {
  const action = state.tradeDirection === "buy" ? "buy" : "sell";
  const symbol = state.tokenSymbol || "TOKEN";
  const settlement = settlementAssetConfig();
  const label = action === "buy" ? `Buy $${symbol} with ${settlement.symbol}` : `Sell $${symbol} for ${settlement.symbol}`;
  return window.ethereum?.request ? label : `Connect wallet to ${action} $${symbol} ${action === "buy" ? "with" : "for"} ${settlement.symbol}`;
}

function syncQuickTradeAmounts() {
  const value = $("#tradeAmount").value.trim();
  document.querySelectorAll("[data-trade-usd]").forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(value) === Number(button.dataset.tradeUsd)));
  });
}

function setQuickTradeAmount(value) {
  $("#tradeAmount").value = String(value);
  scheduleDirectTradeQuote();
}

async function connectTradeWallet() {
  if (!window.ethereum?.request) throw new Error("Open the HTTPS launchpad in a browser with an EVM wallet.");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts?.length) throw new Error("Wallet connection was not approved.");
  const expectedChainId = "0x1237";
  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
  if (String(currentChainId).toLowerCase() !== expectedChainId) {
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: expectedChainId }] });
    } catch (error) {
      if (Number(error?.code) !== 4902) throw error;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: expectedChainId,
          chainName: "Robinhood Chain",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [EXPLORER_URL],
        }],
      });
    }
  }
  return accounts[0];
}

function encodeV4SwapCommand(quote) {
  const coder = window.ethers.AbiCoder.defaultAbiCoder();
  const swapParams = coder.encode([
    "tuple(tuple(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bool zeroForOne,uint128 amountIn,uint128 amountOutMinimum,uint256 minHopPriceX36,bytes hookData)",
  ], [[
    quote.poolKey,
    quote.zeroForOne,
    quote.direction === "buy" ? (quote.directQuote ? quote.quoteAmount : quote.rwiAmount) : quote.amountIn,
    quote.direction === "buy" ? quote.minimumAmountOut : (quote.directQuote ? quote.minimumQuoteOut : quote.minimumRwiOut),
    0,
    "0x",
  ]]);
  if (quote.direction === "buy") {
    const quoteAddress = state.tradeSource?.quoteAddress || RWI_ADDRESS;
    const payerIsUser = Boolean(quote.directQuote && !quote.crossSettlement && !sameAddress(quoteAddress, window.ethers.ZeroAddress));
    const settleParams = coder.encode(["address", "uint256", "bool"], [quoteAddress, quote.directQuote ? quote.quoteAmount : quote.rwiAmount, payerIsUser]);
    const takeAllParams = coder.encode(["address", "uint256"], [state.token, quote.minimumAmountOut]);
    return coder.encode(["bytes", "bytes[]"], ["0x060b0f", [swapParams, settleParams, takeAllParams]]);
  }
  const settleParams = coder.encode(["address", "uint256", "bool"], [state.token, quote.amountIn, true]);
  const quoteAddress = state.tradeSource?.quoteAddress || RWI_ADDRESS;
  const recipient = quote.directQuote && !quote.crossSettlement ? ROUTER_MSG_SENDER : ROUTER_ADDRESS_THIS;
  const takeParams = coder.encode(["address", "address", "uint256"], [quoteAddress, recipient, 0]);
  return coder.encode(["bytes", "bytes[]"], ["0x060b0e", [swapParams, settleParams, takeParams]]);
}

function encodeV3ExactInputCommand(recipient, amountIn, amountOutMinimum, path, payerIsUser) {
  return window.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "uint256", "bytes", "bool", "uint256[]"],
    [recipient, amountIn, amountOutMinimum, path, payerIsUser, []],
  );
}

function encodeV3ExactOutputCommand(recipient, amountOut, amountInMaximum, path, payerIsUser) {
  return window.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "uint256", "bytes", "bool", "uint256[]"],
    [recipient, amountOut, amountInMaximum, path, payerIsUser, []],
  );
}

function encodeWrapEthCommand(amount) {
  return window.ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [ROUTER_ADDRESS_THIS, amount]);
}

function encodeUnwrapWethCommand(minimumAmount, recipient = ROUTER_MSG_SENDER) {
  return window.ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [recipient, minimumAmount]);
}

function encodeRoutedTrade(quote, deadline) {
  const commands = [];
  const inputs = [];
  const isEth = quote.settlementAsset === "ETH";
  const buying = quote.direction === "buy";
  let nativeValue = 0n;

  if (quote.directQuote && quote.crossSettlement && buying) {
    if (isEth) {
      commands.push("0x0b");
      inputs.push(encodeWrapEthCommand(quote.amountIn));
      nativeValue = quote.amountIn;
      commands.push("0x01");
      inputs.push(encodeV3ExactOutputCommand(ROUTER_ADDRESS_THIS, quote.quoteAmount, quote.amountIn, quote.bridgePath, false));
      commands.push("0x10");
      inputs.push(encodeV4SwapCommand(quote));
      commands.push("0x0c");
      inputs.push(encodeUnwrapWethCommand(0));
    } else {
      commands.push("0x01");
      inputs.push(encodeV3ExactOutputCommand(ROUTER_ADDRESS_THIS, quote.quoteAmount, quote.amountIn, quote.bridgePath, true));
      commands.push("0x0c");
      inputs.push(encodeUnwrapWethCommand(quote.quoteAmount, ROUTER_ADDRESS_THIS));
      commands.push("0x10");
      inputs.push(encodeV4SwapCommand(quote));
    }
  } else if (quote.directQuote && quote.crossSettlement) {
    commands.push("0x10");
    inputs.push(encodeV4SwapCommand(quote));
    if (isEth) {
      commands.push("0x00");
      inputs.push(encodeV3ExactInputCommand(ROUTER_ADDRESS_THIS, ROUTER_CONTRACT_BALANCE, quote.minimumAmountOut, quote.bridgePath, false));
      commands.push("0x0c");
      inputs.push(encodeUnwrapWethCommand(quote.minimumAmountOut));
    } else {
      commands.push("0x0b");
      inputs.push(encodeWrapEthCommand(quote.minimumQuoteOut));
      commands.push("0x00");
      inputs.push(encodeV3ExactInputCommand(ROUTER_MSG_SENDER, ROUTER_CONTRACT_BALANCE, quote.minimumAmountOut, quote.bridgePath, false));
    }
  } else if (quote.directQuote) {
    commands.push("0x10");
    inputs.push(encodeV4SwapCommand(quote));
    if (buying && isEth) nativeValue = quote.amountIn;
  } else if (quote.routeProtocol === "v3") {
    if (buying && isEth) {
      commands.push("0x0b");
      inputs.push(encodeWrapEthCommand(quote.amountIn));
      nativeValue = quote.amountIn;
    }
    commands.push("0x00");
    inputs.push(encodeV3ExactInputCommand(
      !buying && isEth ? ROUTER_ADDRESS_THIS : ROUTER_MSG_SENDER,
      quote.amountIn,
      quote.minimumAmountOut,
      quote.v3Path,
      !(buying && isEth),
    ));
    if (!buying && isEth) {
      commands.push("0x0c");
      inputs.push(encodeUnwrapWethCommand(quote.minimumAmountOut));
    }
  } else if (buying) {
    if (isEth) {
      commands.push("0x0b");
      inputs.push(encodeWrapEthCommand(quote.amountIn));
      nativeValue = quote.amountIn;
    }
    commands.push("0x01");
    inputs.push(encodeV3ExactOutputCommand(
      ROUTER_ADDRESS_THIS,
      quote.rwiAmount,
      quote.amountIn,
      quote.bridgePath,
      !isEth,
    ));
    commands.push("0x10");
    inputs.push(encodeV4SwapCommand(quote));
    if (isEth) {
      commands.push("0x0c");
      inputs.push(encodeUnwrapWethCommand(0));
    }
  } else {
    commands.push("0x10");
    inputs.push(encodeV4SwapCommand(quote));
    commands.push("0x00");
    inputs.push(encodeV3ExactInputCommand(
      isEth ? ROUTER_ADDRESS_THIS : ROUTER_MSG_SENDER,
      ROUTER_CONTRACT_BALANCE,
      quote.minimumAmountOut,
      quote.bridgePath,
      false,
    ));
    if (isEth) {
      commands.push("0x0c");
      inputs.push(encodeUnwrapWethCommand(quote.minimumAmountOut));
    }
  }

  const router = new window.ethers.Interface(["function execute(bytes commands,bytes[] inputs,uint256 deadline) payable"]);
  return {
    data: router.encodeFunctionData("execute", [window.ethers.concat(commands), inputs, deadline]),
    nativeValue,
    commands: window.ethers.hexlify(window.ethers.concat(commands)),
  };
}

async function refreshPoolActivation() {
  if (!state.poolId || state.tradeSource?.protocol !== "Uniswap v4") return;
  try {
    const provider = new window.ethers.JsonRpcProvider(RPC_URL, 4663, { staticNetwork: true });
    const view = new window.ethers.Contract(V4_STATE_VIEW, ["function getLiquidity(bytes32 poolId) view returns (uint128)"], provider);
    const activeLiquidity = await view.getLiquidity(state.poolId);
    if (activeLiquidity === 0n && !state.tradeQuote) {
      setDirectTradeStatus("This launch is waiting for its first purchase.", true);
    }
  } catch {
    // Trading remains available when the optional state read is unavailable.
  }
}

async function verifyDisplayedLiquidity(launch) {
  const badge = $("#liquidityStatusBadge");
  if (launch.protocol !== "Uniswap v4" || !launch.poolId) {
    badge.textContent = launch.liquidityPermanentlyLocked ? "LP lock recorded" : "Check LP status";
    return;
  }
  if (!launch.factoryAddress || launch.tickLower === null || launch.tickUpper === null || launch.liquidity === null) {
    badge.textContent = launch.liquidityPermanentlyLocked ? "LP lock recorded" : "Check LP status";
    return;
  }
  try {
    const provider = marketProvider();
    const stateView = new window.ethers.Contract(V4_STATE_VIEW, V4_STATE_VIEW_ABI, provider);
    const [activeLiquidity, positionInfo, slot0] = await Promise.all([
      stateView.getLiquidity(launch.poolId),
      stateView.getPositionInfo(
        launch.poolId,
        launch.factoryAddress,
        launch.tickLower,
        launch.tickUpper,
        window.ethers.ZeroHash,
      ),
      stateView.getSlot0(launch.poolId),
    ]);
    const recordedLiquidity = BigInt(launch.liquidity);
    const positionLiquidity = BigInt(positionInfo.liquidity ?? positionInfo[0]);
    const currentTick = Number(slot0.tick ?? slot0[1]);
    const inRange = currentTick >= launch.tickLower && currentTick < launch.tickUpper;
    if (
      launch.liquidityPermanentlyLocked
      && recordedLiquidity > 0n
      && BigInt(activeLiquidity) > 0n
      && positionLiquidity === recordedLiquidity
      && inRange
    ) {
      badge.textContent = "LP lock verified live";
      return;
    }
    badge.textContent = "Check LP status";
  } catch {
    badge.textContent = launch.liquidityPermanentlyLocked ? "LP lock recorded" : "Check LP status";
  }
}

async function executeDirectTrade() {
  if (state.tradeInFlight) return;
  const button = $("#directTradeButton");
  state.tradeInFlight = true;
  button.disabled = true;
  try {
    button.textContent = "Connecting wallet…";
    const account = await connectTradeWallet();
    const quote = await quoteDirectTrade({ quiet: true });
    if (!quote) throw new Error("A valid ETH or USDG quote is required before trading.");
    const provider = new window.ethers.BrowserProvider(window.ethereum);
    await validateDirectTradeIntegrations(provider);
    const signer = await provider.getSigner();
    const now = Math.floor(Date.now() / 1000);
    if (quote.walletInputCurrency) {
      const inputToken = new window.ethers.Contract(quote.walletInputCurrency, [
        "function balanceOf(address owner) view returns (uint256)",
        "function allowance(address owner,address spender) view returns (uint256)",
        "function approve(address spender,uint256 amount) returns (bool)",
      ], signer);
      const balance = await inputToken.balanceOf(account);
      if (balance < quote.amountIn) throw new Error(`Your wallet does not have enough ${quote.inputSymbol} for this $${quote.usdValue.toLocaleString("en-US", { maximumFractionDigits: 2 })} trade.`);

      if (await inputToken.allowance(account, PERMIT2) < quote.amountIn) {
        button.textContent = "Approve token in wallet…";
        setDirectTradeStatus(`First-time setup: approve Uniswap Permit2 to transfer ${quote.inputSymbol}.`);
        await (await inputToken.approve(PERMIT2, window.ethers.MaxUint256)).wait();
      }

      const permit2 = new window.ethers.Contract(PERMIT2, [
        "function allowance(address owner,address token,address spender) view returns (uint160 amount,uint48 expiration,uint48 nonce)",
        "function approve(address token,address spender,uint160 amount,uint48 expiration)",
      ], signer);
      const permitAllowance = await permit2.allowance(account, quote.walletInputCurrency, V4_UNIVERSAL_ROUTER);
      if (BigInt(permitAllowance.amount) < quote.amountIn || Number(permitAllowance.expiration) <= now + DIRECT_TRADE_DEADLINE_SECONDS) {
        button.textContent = "Authorize official router…";
        setDirectTradeStatus(`Authorize the official Uniswap router to use this ${quote.inputSymbol} amount for 30 minutes.`);
        await (await permit2.approve(quote.walletInputCurrency, V4_UNIVERSAL_ROUTER, quote.amountIn, now + 30 * 60)).wait();
      }
    } else {
      const balance = await provider.getBalance(account);
      if (balance < quote.amountIn) throw new Error(`Your wallet does not have enough ETH for this $${quote.usdValue.toLocaleString("en-US", { maximumFractionDigits: 2 })} trade plus gas.`);
    }

    const latestBlock = await provider.getBlock("latest");
    const deadline = BigInt(Number(latestBlock.timestamp) + DIRECT_TRADE_DEADLINE_SECONDS);
    const routedTrade = encodeRoutedTrade(quote, deadline);
    button.textContent = "Confirm swap in wallet…";
    setDirectTradeStatus("Confirm the trade in your wallet. The minimum output shown above is enforced onchain.");
    const transaction = await signer.sendTransaction({ to: V4_UNIVERSAL_ROUTER, data: routedTrade.data, value: routedTrade.nativeValue });
    button.textContent = "Swap submitted…";
    setDirectTradeStatus(`Swap submitted: ${transaction.hash.slice(0, 10)}…`);
    await transaction.wait();
    toast("Uniswap trade confirmed.");
    setDirectTradeStatus("Trade confirmed on Robinhood Chain. Public route discovery may take a short time to refresh.");
    await quoteDirectTrade({ quiet: true });
    await refreshPoolActivation();
  } catch (error) {
    const rejected = Number(error?.code) === 4001 || Number(error?.info?.error?.code) === 4001;
    const message = rejected ? "The wallet request was cancelled." : (error?.shortMessage || error?.message || "The direct trade failed.");
    setDirectTradeStatus(message, true);
    toast(message);
  } finally {
    state.tradeInFlight = false;
    button.disabled = false;
    button.textContent = directTradeButtonText();
  }
}

function setupDirectTrade(launch) {
  state.tradeSource = ["Uniswap v4", "Uniswap v3"].includes(launch.protocol)
    ? {
      address: launch.factoryAddress,
      protocol: launch.protocol,
      poolAddress: launch.pool,
      poolFee: null,
      quoteAddress: launch.quoteAddress || RWI_ADDRESS,
      quoteSymbol: launch.quoteSymbol || "RWI",
      directQuote: Boolean(launch.directQuote),
    }
    : null;
  $("#directV4Trade").hidden = !state.tradeSource;
  if (!state.tradeSource) return;
  document.querySelectorAll("[data-settlement-asset]").forEach((button) => {
    button.hidden = false;
  });
  if (!["ETH", "USDG"].includes(state.settlementAsset)) state.settlementAsset = "ETH";
  $("#directTradeButton").textContent = directTradeButtonText();
  selectTradeDirection("buy");
  refreshPoolActivation();
}

function profileKey(address) {
  return `${PROFILE_PREFIX}${String(address).toLowerCase()}`;
}

function tokenMetadataKey(address) {
  return `${TOKEN_METADATA_PREFIX}${String(address).toLowerCase()}`;
}

function configuredProfileRegistryAddress() {
  if (isAddress(PROFILE_REGISTRY_CONFIG.address)) return PROFILE_REGISTRY_CONFIG.address;
  try {
    const local = localStorage.getItem(PROFILE_REGISTRY_LOCAL_ADDRESS_KEY);
    return isAddress(local) ? local : null;
  } catch {
    return null;
  }
}

function configuredProfileRegistryBlock() {
  const configured = Number(PROFILE_REGISTRY_CONFIG.deploymentBlock || 0);
  if (configured > 0) return configured;
  try {
    const local = Number(localStorage.getItem(PROFILE_REGISTRY_LOCAL_BLOCK_KEY) || 0);
    return local > 0 ? local : 0;
  } catch {
    return 0;
  }
}

function profileMimeType(value) {
  return ({ 1: "image/jpeg", 2: "image/png", 3: "image/webp" })[Number(value)] || null;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Image unavailable."));
    reader.readAsDataURL(blob);
  });
}

async function imageCanBeDisplayed(image, purpose = "profile-picture") {
  if (!image) return false;
  if (window.location.protocol === "file:") return true;
  try {
    const imageDataUrl = typeof image === "string" ? image : await blobToDataUrl(image);
    if (!/^data:image\/(?:png|jpeg|webp);base64,/i.test(imageDataUrl)) return false;
    const response = await fetch(new URL("api/image-safety", new URL(".", window.location.href)), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ purpose, imageDataUrl }),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.allowed === true;
  } catch {
    return false;
  }
}

async function visibleLocalProfile(profile) {
  if (!profile?.avatar) return profile;
  return await imageCanBeDisplayed(profile.avatar)
    ? profile
    : { ...profile, avatar: null };
}

function readLocalJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function openLogoDatabase() {
  if (!window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(LOGO_DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(LOGO_STORE)) request.result.createObjectStore(LOGO_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredLogo(address) {
  const database = await openLogoDatabase();
  if (!database) return null;
  const result = await new Promise((resolve, reject) => {
    const request = database.transaction(LOGO_STORE, "readonly").objectStore(LOGO_STORE).get(`token:${address.toLowerCase()}`);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return result?.blob || null;
}

async function readHostedMetadata(address) {
  const known = KNOWN_METADATA[address.toLowerCase()] || null;
  try {
    const metadataUrl = new URL(`tokens/${address.toLowerCase()}.json`, window.location.href);
    const response = await fetch(metadataUrl);
    if (response.ok) return { ...known, ...await response.json() };
  } catch {
    // File previews cannot fetch sibling JSON; known and locally saved metadata remain available.
  }
  if (window.location.protocol !== "file:") {
    try {
      const publicMetadataUrl = new URL("api/token-metadata", new URL(".", window.location.href));
      publicMetadataUrl.searchParams.set("token", address);
      const response = await fetch(publicMetadataUrl, { headers: { accept: "application/json" } });
      if (response.ok) return { ...known, ...await response.json() };
    } catch {
      // Public metadata is optional; onchain token and trading data remain usable without it.
    }
  }
  return known;
}

function resolveAssetUrl(path) {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const cleanPath = path.replace(/^\//, "");
  return new URL(cleanPath, new URL(".", window.location.href)).href;
}

function normalizeSocialUrl(kind, value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    if (kind === "twitter" && /^(x\.com|twitter\.com)\//i.test(candidate)) candidate = `https://${candidate}`;
    else if (kind === "twitter") candidate = `https://x.com/${candidate.replace(/^@/, "")}`;
    else if (kind === "telegram") candidate = `https://${candidate.replace(/^@/, "t.me/")}`;
    else candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function renderTokenLinks(links = {}) {
  const definitions = [
    ["#tokenWebsite", "website", links.website],
    ["#tokenTwitter", "twitter", links.twitter],
    ["#tokenTelegram", "telegram", links.telegram],
  ];
  let visible = 0;
  for (const [selector, kind, value] of definitions) {
    const element = $(selector);
    const href = normalizeSocialUrl(kind, value);
    element.hidden = !href;
    if (href) {
      element.href = href;
      visible += 1;
    }
  }
  $("#tokenSocialLinks").hidden = visible === 0;
}

async function resolveTokenMetadata(address) {
  const [hosted, storedLogo] = await Promise.all([
    readHostedMetadata(address),
    readStoredLogo(address).catch(() => null),
  ]);
  const local = readLocalJson(tokenMetadataKey(address));
  const metadata = { ...(hosted || {}), ...(local || {}) };
  if (storedLogo) {
    state.imageUrl = URL.createObjectURL(storedLogo);
    metadata.imageUrl = state.imageUrl;
  } else {
    metadata.imageUrl = resolveAssetUrl(metadata.image || metadata.imageUrl);
  }
  return metadata;
}

async function queryProfileEvent(registry, provider, creator, version) {
  const firstBlock = configuredProfileRegistryBlock();
  const latestBlock = await provider.getBlockNumber();
  if (!firstBlock || firstBlock > latestBlock) return null;
  const filter = registry.filters.ProfileUpdated(creator, version);
  const logs = [];
  const chunkSize = 50_000;
  for (let fromBlock = firstBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(latestBlock, fromBlock + chunkSize - 1);
    logs.push(...await registry.queryFilter(filter, fromBlock, toBlock));
  }
  return logs.at(-1) || null;
}

async function resolveCreatorProfile(creator, provider) {
  const local = await visibleLocalProfile(readLocalJson(profileKey(creator)));
  const registryAddress = configuredProfileRegistryAddress();
  if (!registryAddress || !PROFILE_REGISTRY_ABI.length) return { profile: local, source: local ? "Browser-local profile" : "Wallet recorded onchain" };
  try {
    const registry = new window.ethers.Contract(registryAddress, PROFILE_REGISTRY_ABI, provider);
    const [codeVersion, profile] = await Promise.all([registry.CODE_VERSION(), registry.profiles(creator)]);
    if (codeVersion !== 1n) throw new Error("Unsupported profile registry version.");
    const version = BigInt(profile.version);
    if (!version) return { profile: local, source: local ? "Browser-local profile" : "Wallet recorded onchain", registryAddress };
    const event = await queryProfileEvent(registry, provider, creator, version);
    const avatarBytes = event ? window.ethers.getBytes(event.args.avatar) : new Uint8Array();
    if (window.ethers.keccak256(avatarBytes) !== profile.avatarHash) throw new Error("Profile avatar hash mismatch.");
    let avatar = null;
    const mime = profileMimeType(profile.avatarMimeType);
    if (avatarBytes.length && mime) {
      const avatarBlob = new Blob([avatarBytes], { type: mime });
      if (await imageCanBeDisplayed(avatarBlob)) {
        state.creatorImageUrl = URL.createObjectURL(avatarBlob);
        avatar = state.creatorImageUrl;
      }
    }
    return {
      profile: { name: profile.name, bio: profile.bio, avatar },
      source: `Onchain profile v${version.toString()}`,
      registryAddress,
    };
  } catch {
    return { profile: local, source: local ? "Browser-local fallback" : "Wallet recorded onchain", registryAddress };
  }
}

function renderCreator(creator, resolvedProfile) {
  const profile = resolvedProfile?.profile || null;
  const shortAddress = `${creator.slice(0, 8)}…${creator.slice(-6)}`;
  $("#creatorAddress").textContent = shortAddress;
  $("#creatorDisplayName").textContent = profile?.name || "Launch creator";
  $("#creatorProfileSource").textContent = resolvedProfile?.source || "Recorded onchain";
  $("#creatorCard").setAttribute("aria-label", `Open ${profile?.name || "creator"} profile and market activity`);
  $("#creatorProfileLink").href = `creator.html?address=${encodeURIComponent(creator)}`;
  $("#creatorExplorer").href = `${EXPLORER_URL}/address/${creator}`;
  const registryAddress = resolvedProfile?.registryAddress;
  $("#profileRegistryExplorer").hidden = !registryAddress;
  if (registryAddress) $("#profileRegistryExplorer").href = `${EXPLORER_URL}/address/${registryAddress}`;
  const initial = (profile?.name?.charAt(0) || creator.slice(2, 3)).toUpperCase();
  const creatorAvatar = $("#creatorPageAvatar");
  creatorAvatar.setAttribute("role", "img");
  creatorAvatar.setAttribute("aria-label", `${profile?.name || "Token creator"} profile picture`);
  $("#creatorPageInitial").textContent = initial;
  if (profile?.avatar) {
    creatorAvatar.style.backgroundImage = `url("${profile.avatar}")`;
    $("#creatorPageInitial").textContent = "";
  }
}

function renderToken({ address, name, symbol, supply, decimals, launch, metadata, creatorProfile }) {
  state.token = address;
  state.tokenSymbol = symbol;
  state.tokenDecimals = Number(decimals);
  state.creator = launch.creator;
  state.pool = launch.pool;
  state.poolId = launch.poolId;
  state.positionTokenId = launch.positionTokenId;
  document.title = `${name} ($${symbol}) · RWI Launchpad`;
  $("#detailName").textContent = name;
  $("#detailSymbol").textContent = `$${symbol}`;
  const detailArt = $("#detailArt");
  detailArt.setAttribute("role", "img");
  detailArt.setAttribute("aria-label", `${name} ($${symbol}) token artwork`);
  $("#detailAddress").textContent = address;
  $("#detailMonogram").textContent = symbol.charAt(0) || "?";
  $("#detailSupply").textContent = formatSupply(supply, decimals);
  const quoteSymbol = launch.quoteSymbol || "RWI";
  state.quoteSymbol = quoteSymbol;
  $("#detailPair").textContent = `${symbol} / ${quoteSymbol}`;
  $("#detailMarketMode").textContent = `Direct TOKEN / ${quoteSymbol} market`;
  $("#detailMarketPairing").textContent = `${quoteSymbol} paired`;
  $("#detailQuoteAsset").textContent = quoteSymbol === "ETH" ? "Native ETH" : (launch.quoteAddress || RWI_ADDRESS);
  $("#tradeRouteLabel").textContent = launch.directQuote ? "Direct Uniswap v4" : "RWI-routed Uniswap";
  $("#dextoolsMarketDescription").textContent = `Connecting to this token’s live ${quoteSymbol} market.`;
  $("#detailPool").textContent = launch.poolId || launch.pool;
  $("#detailPoolLabel").textContent = launch.poolId ? "v4 pool ID" : "Pool";
  renderTokenMetadata(metadata);
  $("#uniswapTokenPage").href = `https://app.uniswap.org/explore/tokens/robinhood/${address}`;
  $("#dexScreenerPool").href = `https://dexscreener.com/robinhood/${launch.poolId || launch.pool}`;
  if (launch.pool) {
    $("#poolExplorer").href = `${EXPLORER_URL}/address/${launch.pool}`;
    $("#poolExplorer").textContent = "Pool explorer ↗";
    $("#geckoTerminalPool").href = `https://www.geckoterminal.com/robinhood/pools/${launch.pool}`;
  } else {
    $("#poolExplorer").href = `${EXPLORER_URL}/address/${FACTORY_CONFIG.uniswapV4PoolManager}`;
    $("#poolExplorer").textContent = "v4 PoolManager ↗";
    $("#geckoTerminalPool").href = `https://www.geckoterminal.com/robinhood/pools/${launch.poolId}`;
  }
  setupDirectTrade(launch);
  verifyDisplayedLiquidity(launch);
  renderCreator(launch.creator, creatorProfile);
  $("#tokenPageStatus").hidden = true;
  $("#tokenDashboard").hidden = false;
  $("#tokenDashboard").setAttribute("aria-busy", "false");
  $("#tokenDetail").hidden = false;
  $("#tokenMarketStack").hidden = false;
  $("#tokenFacts").hidden = false;
  startDexScreenerFeed(address, launch);
  $("#tokenPageGrid").hidden = false;
}

function renderTokenMetadata(metadata = {}) {
  $("#detailDescription").textContent = displayedTokenDescription(metadata.description, state.quoteSymbol);
  renderTokenLinks(metadata.links);
  if (metadata.imageUrl) {
    $("#detailArt").style.backgroundImage = `url("${metadata.imageUrl}")`;
    $("#detailMonogram").textContent = "";
  }
}

async function loadTokenPage() {
  const address = new URLSearchParams(window.location.search).get("address");
  if (!isAddress(address) || !configuredFactoryAddresses().length) {
    showTokenPageError("Invalid token address. Return to the launchpad and choose a verified launch.");
    return;
  }
  const normalizedAddress = address.toLowerCase();
  const knownLaunch = KNOWN_LAUNCHES[normalizedAddress] || null;
  let resolvedMetadata = KNOWN_METADATA[normalizedAddress] || {};
  const metadataPromise = resolveTokenMetadata(address).then((metadata) => {
    resolvedMetadata = metadata || resolvedMetadata;
    if (state.token && sameAddress(state.token, address)) renderTokenMetadata(resolvedMetadata);
    return resolvedMetadata;
  }).catch(() => resolvedMetadata);
  try {
    if (!window.ethers) throw new Error("The wallet library did not load. Refresh the page and try again.");
    $("#detailAddress").textContent = window.ethers.getAddress(address);
    if (knownLaunch) {
      renderToken({
        address: window.ethers.getAddress(address),
        name: knownLaunch.name,
        symbol: knownLaunch.symbol,
        decimals: knownLaunch.decimals,
        supply: knownLaunch.supply,
        launch: { creator: knownLaunch.creator, pool: knownLaunch.pool, poolId: null, protocol: "Uniswap v3", positionTokenId: knownLaunch.positionTokenId, factoryAddress: null },
        metadata: resolvedMetadata,
        creatorProfile: {
          profile: readLocalJson(profileKey(knownLaunch.creator)),
          source: "Verified launch · refreshing live data",
          registryAddress: configuredProfileRegistryAddress(),
        },
      });
    }
    const provider = new window.ethers.JsonRpcProvider(RPC_URL, 4663, { staticNetwork: true });
    const token = new window.ethers.Contract(address, [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
    ], provider);
    const [factoryLaunch, name, symbol, decimals, supply] = await withTimeout(Promise.all([
      findFactoryLaunch(address, provider), token.name(), token.symbol(), token.decimals(), token.totalSupply(),
    ]), 12_000, "Robinhood Chain did not return token data within 12 seconds.");
    const launch = factoryLaunch.launch;
    const isV4 = factoryLaunch.source.protocol === "Uniswap v4";
    const directQuote = factoryLaunch.source.feeMode === MULTI_QUOTE_FEE_MODE;
    const quoteSymbol = directQuote ? (Number(launch.quoteAsset ?? 0) === 0 ? "ETH" : "USDG") : "RWI";
    const quoteAddress = quoteSymbol === "ETH" ? window.ethers.ZeroAddress : quoteSymbol === "USDG" ? USDG_ADDRESS : RWI_ADDRESS;
    const pool = isV4 ? null : String(launch.pool);
    const poolId = isV4 ? String(launch.poolId) : null;
    if (!isAddress(launch.creator) || sameAddress(launch.creator, window.ethers.ZeroAddress) || !(isV4 ? isPoolId(poolId) : isAddress(pool))) {
      throw new Error("This token was not launched by the configured factory.");
    }
    const fallbackCreatorProfile = { profile: readLocalJson(profileKey(launch.creator)), source: "Creator wallet recorded onchain", registryAddress: configuredProfileRegistryAddress() };
    renderToken({
      address: window.ethers.getAddress(address),
      name,
      symbol,
      decimals: Number(decimals),
      supply,
      launch: {
        creator: launch.creator,
        pool,
        poolId,
        protocol: factoryLaunch.source.protocol,
        positionTokenId: BigInt(launch.positionTokenId),
        factoryAddress: factoryLaunch.factoryAddress,
        liquidity: isV4 ? BigInt(launch.liquidity) : null,
        liquidityPermanentlyLocked: Boolean(launch.liquidityPermanentlyLocked),
        tickLower: isV4 ? Number(launch.tickLower) : null,
        tickUpper: isV4 ? Number(launch.tickUpper) : null,
        quoteSymbol,
        quoteAddress,
        directQuote,
      },
      metadata: resolvedMetadata,
      creatorProfile: fallbackCreatorProfile,
    });
    metadataPromise.catch(() => {});
    withTimeout(resolveCreatorProfile(launch.creator, provider), 10_000, "The shared creator profile timed out.")
      .then((creatorProfile) => {
        if (state.creator && sameAddress(state.creator, launch.creator)) renderCreator(launch.creator, creatorProfile);
      })
      .catch(() => {});
  } catch (error) {
    if (knownLaunch && state.token) {
      $("#creatorProfileSource").textContent = "Verified launch · live refresh unavailable";
      return;
    }
    showTokenPageError(error?.shortMessage || error?.message || "Token information could not be loaded.");
  }
}

$("#copyTokenAddress").addEventListener("click", async () => {
  if (!state.token) return;
  try {
    await navigator.clipboard.writeText(state.token);
    toast("Token contract copied.");
  } catch {
    toast("Copy failed. Select the contract address manually.");
  }
});
$("#tradeBuyTab").addEventListener("click", () => selectTradeDirection("buy"));
$("#tradeSellTab").addEventListener("click", () => selectTradeDirection("sell"));
document.querySelectorAll("[data-settlement-asset]").forEach((button) => button.addEventListener("click", () => selectSettlementAsset(button.dataset.settlementAsset)));
$("#tradeAmount").addEventListener("input", scheduleDirectTradeQuote);
document.querySelectorAll("[data-trade-usd]").forEach((button) => button.addEventListener("click", () => setQuickTradeAmount(button.dataset.tradeUsd)));
$("#directTradeButton").addEventListener("click", executeDirectTrade);
$("#creatorCard").addEventListener("click", (event) => {
  if (!state.creator || event.target.closest?.("a, button")) return;
  window.location.href = `creator.html?address=${encodeURIComponent(state.creator)}`;
});
$("#creatorCard").addEventListener("keydown", (event) => {
  if (!state.creator || (event.key !== "Enter" && event.key !== " ")) return;
  event.preventDefault();
  window.location.href = `creator.html?address=${encodeURIComponent(state.creator)}`;
});
document.addEventListener?.("visibilitychange", handleMarketVisibilityChange);

window.addEventListener?.("beforeunload", () => {
  clearInterval(state.dexScreenerRefreshTimer);
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  if (state.creatorImageUrl) URL.revokeObjectURL(state.creatorImageUrl);
});
if (!window.RWI_TOKEN_PAGE_TEST_MODE) window.RWI_TOKEN_PAGE_READY = loadTokenPage();

window.RWITokenPage = {
  uniswapSwapUrl, isAddress, resolveAssetUrl, normalizeSocialUrl, loadTokenPage, withTimeout, displayedTokenDescription,
  directTradePoolKey, directTradeCurrencies, encodeV4SwapCommand, encodeRoutedTrade, validateDirectTradeIntegrations,
  v3BridgeExactInputPath, v3BridgeExactOutputPath, directQuoteBridgeExactInputPath, directQuoteBridgeExactOutputPath,
  legacyV3TradePath, settlementAssetConfig, directQuoteAssetConfig, selectSettlementAsset,
  readTradeUsdValue, tradeInputAsset, parseTradeAssetUnits, readTradeAmount, quoteDirectTrade,
  getTradeQuote: () => state.tradeQuote,
  selectDexScreenerPair, tokenMarketValues, tokenMarketChange24h, renderDexScreenerPair, renderDextoolsChart,
  quoteFromSqrtPrice, rwiUsdPriceFromPairs, readOnchainMarketValues, formatUsdPrice,
};
if (window.RWI_TOKEN_PAGE_TEST_MODE) window.RWITokenPage.__testState = state;
