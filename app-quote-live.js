const RWI_ADDRESS = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const PONS_ADDRESS = "0x39dBED3a2bd333467115dE45665cC57F813C4571";
const FIXED_TOKEN_SUPPLY = 1_000_000_000n;
const FIXED_POOL_ALLOCATION_BPS = 10_000;
const TARGET_MARKET_CAP_USD = 10_000;
const RELEASE_VERSION = "20260805-token-image-audit-1";
const TOKEN_DESCRIPTION_MAX_LENGTH = 500;
const ETH_CLAIM_SLIPPAGE_BPS = 500n;
const DEV_BUY_SLIPPAGE_BPS = 500n;
const DEV_BUY_ETH_INPUT_SLIPPAGE_BPS = 500n;
const DEV_BUY_DEADLINE_SECONDS = 10 * 60;
const ETH_CLAIM_DEADLINE_SECONDS = 10 * 60;
const LAUNCH_GAS_LIMIT_FLOOR = 5_000_000n;
const LAUNCH_GAS_ESTIMATE_BUFFER_BPS = 15_000n;
const LAUNCH_GAS_FIXED_BUFFER = 100_000n;
const FACTORY_CONFIG = window.RWI_FACTORY_CONFIG || Object.freeze({});
const FACTORY_ABI = window.RWI_FACTORY_ABI || Object.freeze([]);
const QUOTE_FACTORY_CONFIG = window.RWI_QUOTE_FACTORY_CONFIG || Object.freeze({});
const QUOTE_FACTORY_ABI = window.RWI_QUOTE_FACTORY_ABI || Object.freeze([]);
const QUOTE_FACTORY_DEPLOYMENT = window.RWI_QUOTE_FACTORY_DEPLOYMENT || Object.freeze({});
const PONS_FACTORY_CONFIG = window.RWI_PONS_FACTORY_CONFIG || Object.freeze({});
const PONS_FACTORY_ABI = window.RWI_PONS_FACTORY_ABI || Object.freeze([]);
const PONS_FACTORY_DEPLOYMENT = window.RWI_PONS_FACTORY_DEPLOYMENT || Object.freeze({});
const MULTI_PAIR_FACTORY_CONFIG = window.RWI_MULTI_PAIR_FACTORY_CONFIG || Object.freeze({});
const MULTI_PAIR_FACTORY_ABI = window.RWI_MULTI_PAIR_FACTORY_ABI || Object.freeze([]);
let MULTI_PAIR_FACTORY_DEPLOYMENT = window.RWI_MULTI_PAIR_FACTORY_DEPLOYMENT || Object.freeze({});
let multiPairDeploymentBundlePromise = null;
const DEVELOPER_WALLET = "0x9CD7C9196A4C1836A3DF089cb210272e07e6A5e5";
let FACTORY_DEPLOYMENT = window.RWI_FACTORY_DEPLOYMENT || Object.freeze({});
let factoryDeploymentBundlePromise = null;
let ethersLibraryPromise = null;
const HOOK_DEPLOYER_DEPLOYMENT = window.RWI_HOOK_DEPLOYER_DEPLOYMENT || Object.freeze({});
const INTERNAL_MATCH_FEE_MODE = "internal-match-eth";
const MULTI_QUOTE_FEE_MODE = "internal-match-eth-90-10";
const PONS_FEE_MODE = "internal-match-eth-90-10-pons";
const MULTI_PAIR_FEE_MODE = "multi-pair-eth-90-7.5-2.5";
const LEGACY_V4_FACTORY_ABI = Object.freeze([
  "event TokenLaunched(address indexed token,address indexed creator,bytes32 indexed poolId,uint256 positionTokenId,uint128 liquidity,uint256 tokenAmount,uint256 initialRwiAmount,bool liquidityPermanentlyLocked)",
  "event FeesClaimedInEth(uint256 indexed positionTokenId,address indexed creator,uint256 tokenFees,uint256 rwiFees,uint256 rwiFromToken,uint256 ethAmount)",
  "function launches(address token) view returns (address creator,bytes32 poolId,uint256 positionTokenId,uint128 liquidity,bool liquidityPermanentlyLocked,uint256 tokenAmount,uint256 initialRwiAmount,int24 tickLower,int24 tickUpper)",
  "function positionCreators(uint256 positionTokenId) view returns (address)",
  "function claimFeesInEth(uint256 positionTokenId,uint256 minimumRwiFromToken,uint256 minimumEthOut,uint256 deadline) returns (uint256 tokenFees,uint256 rwiFees,uint256 rwiFromToken,uint256 ethAmount)",
]);
const LEGACY_FACTORY_ABI = Object.freeze([
  "event TokenLaunched(address indexed token,address indexed creator,address indexed pool,uint256 positionTokenId,uint128 liquidity,uint256 tokenAmount,uint256 initialRwiAmount,bool liquidityPermanentlyLocked)",
  "event FeesCollected(uint256 indexed positionTokenId,address indexed creator,uint256 amount0,uint256 amount1)",
  "event FeesClaimedInEth(uint256 indexed positionTokenId,address indexed creator,uint256 tokenFees,uint256 rwiFees,uint256 rwiFromToken,uint256 ethAmount)",
  "function launches(address token) view returns (address creator,address pool,uint256 positionTokenId,uint128 liquidity,bool liquidityPermanentlyLocked,uint256 tokenAmount,uint256 initialRwiAmount)",
  "function positionCreators(uint256 positionTokenId) view returns (address)",
  "function claimFeesInEth(uint256 positionTokenId,uint256 minimumRwiFromToken,uint256 minimumEthOut,uint256 deadline) returns (uint256 tokenFees,uint256 rwiFees,uint256 rwiFromToken,uint256 ethAmount)",
  "function collectFees(uint256 positionTokenId) returns (uint256 amount0,uint256 amount1)",
]);
const PROFILE_REGISTRY_CONFIG = window.RWI_PROFILE_REGISTRY || Object.freeze({});
const PROFILE_REGISTRY_ABI = window.RWI_PROFILE_REGISTRY_ABI || Object.freeze([]);
const PROFILE_REGISTRY_DEPLOYMENT = window.RWI_PROFILE_REGISTRY_DEPLOYMENT || Object.freeze({});
const DRAFT_KEY = "rwi-launchpad-draft-v2";
const LOGO_DATABASE = "rwi-launchpad-assets-v1";
const LOGO_STORE = "logos";
const DRAFT_LOGO_KEY = "current-draft-logo";
const TOKEN_METADATA_PREFIX = "rwi-token-metadata:";
const DISCOVER_SESSION_KEY = "rwi-launchpad-discover-v1";
const DISCOVER_SESSION_TTL_MS = 5 * 60 * 1_000;
const PROFILE_REGISTRY_LOCAL_ADDRESS_KEY = "rwi-profile-registry-address";
const PROFILE_REGISTRY_LOCAL_BLOCK_KEY = "rwi-profile-registry-block";
const FACTORY_LOCAL_BLOCK_KEY = `${FACTORY_CONFIG.factoryAddressStorageKey || "rwi-launchpad-factory-address-v4"}-deployment-block`;
const PROFILE_AVATAR_MAX_BYTES = 12_000;
const LOGO_SIZE = 512;
const QUOTE_ASSET_LOGOS = Object.freeze({
  RWI: { src: "assets/rwi-logo.jpg", alt: "$RWI logo" },
  ETH: { src: "assets/eth-logo.png", alt: "$ETH logo" },
  USDG: { src: "assets/usdg-logo.png", alt: "$USDG logo" },
  PONS: { src: "assets/pons-logo.png", alt: "$PONS logo" },
});
const KNOWN_TOKEN_IMAGES = Object.freeze({
  "0xc29d66d54d2ed13fffdc89323e5a9d70c197eaec": "assets/testcoin.png",
});
const KNOWN_TOKEN_DESCRIPTIONS = Object.freeze({
  "0xc29d66d54d2ed13fffdc89323e5a9d70c197eaec": "Standard one-billion-supply test launch from the RWI Launchpad factory.",
});
const LIQUIDITY_MODEL = Object.freeze({
  venue: "Uniswap v4",
  poolFee: FACTORY_CONFIG.poolFee || 10000,
  pairAsset: "$RWI",
  pairAssetAddress: RWI_ADDRESS,
  uniswapV4PoolManager: FACTORY_CONFIG.uniswapV4PoolManager || "0x8366a39CC670B4001A1121B8F6A443A643e40951",
  uniswapV4StateView: FACTORY_CONFIG.uniswapV4StateView || "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b",
  uniswapV4Quoter: FACTORY_CONFIG.uniswapV4Quoter || "0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94",
  uniswapV4UniversalRouter: FACTORY_CONFIG.uniswapV4UniversalRouter || "0x8876789976dEcBfCbBbe364623C63652db8C0904",
  permit2: FACTORY_CONFIG.permit2 || "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  swapRouter02: FACTORY_CONFIG.swapRouter02 || "0xCaf681a66D020601342297493863E78C959E5cb2",
  launchFactory: FACTORY_CONFIG.factoryAddress || null,
  creatorLpFeeShareBps: 10000,
  launchpadLpFeeShareBps: 0,
  liquidityPermanentlyLocked: true,
  fixedTokenSupply: FIXED_TOKEN_SUPPLY.toString(),
  poolAllocationBps: FIXED_POOL_ALLOCATION_BPS,
  creatorTokenAllocationBps: 0,
  maximumLockedTokenDust: "1000000000000000000",
  initialRwiLiquidity: "0",
  initialLiquidityMode: "single-sided-token-position",
  targetMarketCapUsd: TARGET_MARKET_CAP_USD,
  openingPriceMode: "uniswap-rwi-weth-plus-weth-usdg-dual-twap",
  launchPath: "direct-to-pool",
  bondingCurve: false,
  graduation: false,
  migration: false,
});
const V3_QUOTER = FACTORY_CONFIG.uniswapV3Quoter || "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7";
const ROUTER_MSG_SENDER = "0x0000000000000000000000000000000000000001";
const ROUTER_ADDRESS_THIS = "0x0000000000000000000000000000000000000002";
const ROBINHOOD_CHAIN = {
  chainId: "0x1237",
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
};

const state = {
  account: null,
  imageUrl: null,
  imageFile: null,
  originalImageFile: null,
  cropInputFile: null,
  cropSourceImage: null,
  cropSourceUrl: null,
  cropOffsetX: 0,
  cropOffsetY: 0,
  cropDragging: null,
  cropCompletion: null,
  ethBalance: null,
  saveTimer: null,
  launchInFlight: false,
  lastLaunchTx: null,
  lastTokenAddress: null,
  lastPoolAddress: null,
  lastPoolId: null,
  lastDevBuyRwiAmount: 0n,
  lastDevBuyUsdAmount: "0",
  lastDevBuyEthAmount: 0n,
  pendingDevBuyRwiAmount: 0n,
  factoryDeploymentInFlight: false,
  lastFactoryAddress: null,
  creatorLaunches: [],
  dashboardLoading: false,
  dashboardRequestId: 0,
  dashboardReturnFocus: null,
  activeClaimPosition: null,
  profileAvatarData: null,
  profileAvatarBytes: null,
  profileAvatarMimeType: 0,
  profileAvatarObjectUrl: null,
  profileVersion: 0n,
  profileLoadAccount: null,
  profileLoadPromise: null,
  profileLoadedAt: 0,
  profileRegistryValidationAddress: null,
  profileRegistryValidationPromise: null,
  profileSaveInFlight: false,
  profileRegistryDeploymentInFlight: false,
  walletProvider: null,
  walletListenersAttachedTo: null,
  walletConnectionInFlight: false,
  discoverImageUrls: [],
  discoverLaunches: [],
  discoverLoading: false,
  discoverLoadedAt: 0,
  discoverReturnFocus: null,
  discoverProvider: null,
  discoverRwiUsdPrice: null,
  discoverRwiUsdPromise: null,
  discoverView: "market",
  quoteAsset: "RWI",
  quoteAssets: ["RWI"],
  devBuyPair: "RWI",
  developerClaimInFlight: false,
  developerRevenueFactories: [],
};
const discoveredWalletProviders = new Map();
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const approvedImageHashes = new Set();
const LOG_QUERY_CONCURRENCY = 6;
let activeLogQueries = 0;
const pendingLogQueries = [];

async function withLogQuerySlot(task) {
  if (activeLogQueries >= LOG_QUERY_CONCURRENCY) await new Promise((resolve) => pendingLogQueries.push(resolve));
  activeLogQueries += 1;
  try {
    return await task();
  } finally {
    activeLogQueries -= 1;
    pendingLogQueries.shift()?.();
  }
}

async function queryFilterWithRetry(contract, filter, fromBlock, toBlock, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await withLogQuerySlot(() => contract.queryFilter(filter, fromBlock, toBlock));
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  throw lastError;
}

window.addEventListener?.("eip6963:announceProvider", (event) => {
  const detail = event?.detail;
  if (!detail?.provider?.request) return;
  const key = detail.info?.uuid || detail.info?.rdns || detail.info?.name || String(discoveredWalletProviders.size);
  discoveredWalletProviders.set(key, detail);
});
if (typeof window.dispatchEvent === "function" && typeof Event === "function") {
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

const fields = {
  name: $("#tokenName"), ticker: $("#tokenTicker"), description: $("#tokenDescription"),
  image: $("#tokenImage"),
  website: $("#website"), twitter: $("#twitter"), telegram: $("#telegram"),
  devBuy: $("#devBuyUsd"),
  lock: $("#lockLiquidity"),
};

function selectedQuoteAssets() {
  const selected = [...document.querySelectorAll('input[name="quoteAsset"]:checked')]
    .map((input) => input.value)
    .filter((value) => ["RWI", "ETH", "USDG", "PONS"].includes(value));
  return selected.length ? selected : ["RWI"];
}

function selectedQuoteAsset() {
  return selectedQuoteAssets()[0];
}

function selectedDevBuyPair() {
  const selected = selectedQuoteAssets();
  return selected.includes(state.devBuyPair) ? state.devBuyPair : selected[0];
}

function multiPairFactoryAddress() {
  return isAddress(MULTI_PAIR_FACTORY_CONFIG.factoryAddress) ? MULTI_PAIR_FACTORY_CONFIG.factoryAddress : null;
}

function quoteFactoryAddress() {
  return isAddress(QUOTE_FACTORY_CONFIG.factoryAddress) ? QUOTE_FACTORY_CONFIG.factoryAddress : null;
}

function ponsFactoryAddress() {
  return isAddress(PONS_FACTORY_CONFIG.factoryAddress) ? PONS_FACTORY_CONFIG.factoryAddress : null;
}

function isMultiQuoteMode(sourceOrMode) {
  return (typeof sourceOrMode === "string" ? sourceOrMode : sourceOrMode?.feeMode) === MULTI_QUOTE_FEE_MODE;
}

function isPonsMode(sourceOrMode) {
  return (typeof sourceOrMode === "string" ? sourceOrMode : sourceOrMode?.feeMode) === PONS_FEE_MODE;
}

function isMultiPairMode(sourceOrMode) {
  return (typeof sourceOrMode === "string" ? sourceOrMode : sourceOrMode?.feeMode) === MULTI_PAIR_FEE_MODE;
}

function cleanTicker(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

async function ensureFactoryDeploymentBundle() {
  if (FACTORY_DEPLOYMENT.bytecode && FACTORY_DEPLOYMENT.deployedBytecode) return FACTORY_DEPLOYMENT;
  if (factoryDeploymentBundlePromise) return factoryDeploymentBundlePromise;
  factoryDeploymentBundlePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `factory-deployment.js?v=${RELEASE_VERSION}`;
    script.async = true;
    script.onload = () => {
      FACTORY_DEPLOYMENT = window.RWI_FACTORY_DEPLOYMENT || Object.freeze({});
      if (FACTORY_DEPLOYMENT.bytecode && FACTORY_DEPLOYMENT.deployedBytecode) resolve(FACTORY_DEPLOYMENT);
      else reject(new Error("The v4 deployment bundle is incomplete."));
    };
    script.onerror = () => reject(new Error("The v4 deployment bundle could not be loaded."));
    document.head.appendChild(script);
  }).catch((error) => {
    factoryDeploymentBundlePromise = null;
    throw error;
  });
  return factoryDeploymentBundlePromise;
}

async function ensureMultiPairDeploymentBundle() {
  if (MULTI_PAIR_FACTORY_DEPLOYMENT.bytecode && MULTI_PAIR_FACTORY_DEPLOYMENT.deployedBytecode) {
    return MULTI_PAIR_FACTORY_DEPLOYMENT;
  }
  if (multiPairDeploymentBundlePromise) return multiPairDeploymentBundlePromise;
  multiPairDeploymentBundlePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `multi-pair-factory-deployment.js?v=${RELEASE_VERSION}`;
    script.async = true;
    script.onload = () => {
      MULTI_PAIR_FACTORY_DEPLOYMENT = window.RWI_MULTI_PAIR_FACTORY_DEPLOYMENT || Object.freeze({});
      if (MULTI_PAIR_FACTORY_DEPLOYMENT.bytecode && MULTI_PAIR_FACTORY_DEPLOYMENT.deployedBytecode) {
        resolve(MULTI_PAIR_FACTORY_DEPLOYMENT);
      } else reject(new Error("The multi-pair deployment bundle is incomplete."));
    };
    script.onerror = () => reject(new Error("The multi-pair deployment bundle could not be loaded."));
    document.head.appendChild(script);
  }).catch((error) => {
    multiPairDeploymentBundlePromise = null;
    throw error;
  });
  return multiPairDeploymentBundlePromise;
}

async function ensureEthersLibrary() {
  if (window.ethers) return window.ethers;
  if (ethersLibraryPromise) return ethersLibraryPromise;
  ethersLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `vendor/ethers.umd.min.js?v=${RELEASE_VERSION}`;
    script.async = true;
    script.onload = () => window.ethers ? resolve(window.ethers) : reject(new Error("The wallet library is incomplete."));
    script.onerror = () => reject(new Error("The wallet library could not be loaded."));
    document.head.appendChild(script);
  }).catch((error) => {
    ethersLibraryPromise = null;
    throw error;
  });
  return ethersLibraryPromise;
}

function parseDecimalAmount(value, decimals = 18, label = "amount") {
  const normalized = String(value || "").trim();
  if (!normalized) return 0n;
  if (!/^(?:0|[1-9]\d*)(?:\.\d*)?$/.test(normalized)) throw new Error(`Enter a valid ${label} amount.`);
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) throw new Error(`Use no more than ${decimals} decimal places.`);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt((fraction || "0").padEnd(decimals, "0"));
}

function configuredDevBuyUsdAmount() {
  const amount = parseDecimalAmount(fields.devBuy.value, 18, "USD");
  if (amount > 1_000_000n * 10n ** 18n) throw new Error("The optional dev buy cannot exceed $1,000,000.");
  return amount;
}

function rwiAmountForUsd(usdAmountE18, rwiUsdPrice) {
  if (usdAmountE18 === 0n) return 0n;
  const numericPrice = Number(rwiUsdPrice);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) throw new Error("The RWI/USD price is unavailable.");
  const priceE18 = window.ethers.parseUnits(numericPrice.toFixed(18), 18);
  if (priceE18 <= 0n) throw new Error("The RWI/USD price is unavailable.");
  const amount = usdAmountE18 * 10n ** 18n / priceE18;
  if (amount <= 0n || amount > (1n << 127n) - 1n) throw new Error("The optional dev buy amount is outside the supported range.");
  return amount;
}

function devBuyExactOutputPath() {
  return window.ethers.solidityPacked(
    ["address", "uint24", "address"],
    [RWI_ADDRESS, LIQUIDITY_MODEL.poolFee, FACTORY_CONFIG.wethAddress],
  );
}

async function quoteEthForExactRwi(provider, rwiAmount) {
  const quoter = new window.ethers.Contract(V3_QUOTER, [
    "function quoteExactOutput(bytes path,uint256 amountOut) returns (uint256 amountIn,uint160[] sqrtPriceX96AfterList,uint32[] initializedTicksCrossedList,uint256 gasEstimate)",
  ], provider);
  const result = await quoter.quoteExactOutput.staticCall(devBuyExactOutputPath(), rwiAmount);
  const amount = BigInt(result.amountIn ?? result[0]);
  if (amount <= 0n) throw new Error("The ETH to RWI route returned no quote.");
  return amount;
}

function maximumDevBuyEthInput(quotedEthAmount) {
  return BigInt(quotedEthAmount) * (10_000n + DEV_BUY_ETH_INPUT_SLIPPAGE_BPS) / 10_000n;
}

function encodeEthToRwiPurchase(rwiAmount, maximumEthInput, deadline) {
  const coder = window.ethers.AbiCoder.defaultAbiCoder();
  const commands = window.ethers.hexlify(window.ethers.concat(["0x0b", "0x01", "0x0c"]));
  const inputs = [
    coder.encode(["address", "uint256"], [ROUTER_ADDRESS_THIS, maximumEthInput]),
    coder.encode(
      ["address", "uint256", "uint256", "bytes", "bool", "uint256[]"],
      [ROUTER_MSG_SENDER, rwiAmount, maximumEthInput, devBuyExactOutputPath(), false, []],
    ),
    coder.encode(["address", "uint256"], [ROUTER_MSG_SENDER, 0]),
  ];
  const router = new window.ethers.Interface(["function execute(bytes commands,bytes[] inputs,uint256 deadline) payable"]);
  return {
    data: router.encodeFunctionData("execute", [commands, inputs, deadline]),
    commands,
    inputs,
    nativeValue: maximumEthInput,
  };
}

function getEconomics() {
  const supply = FIXED_TOKEN_SUPPLY;
  const pool = supply;
  const creator = 0n;
  return { supply, pool, creator };
}

function formatUnits(raw, decimals, maximumFractionDigits = 2) {
  decimals = Math.max(0, Math.min(36, Number(decimals) || 0));
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const remainder = raw % base;
  const fraction = remainder.toString().padStart(decimals, "0").slice(0, maximumFractionDigits).replace(/0+$/, "");
  return `${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
}

function updateBalanceState() {
  const balanceElement = $("#walletEthBalance");
  if (!state.account) {
    balanceElement.textContent = "Connect wallet";
    return;
  }
  if (state.ethBalance === null) {
    balanceElement.textContent = "Unavailable";
    return;
  }
  balanceElement.textContent = `${formatUnits(state.ethBalance, 18, 6)} ETH`;
}

function computeSetupCompleteness() {
  let score = 0;
  if (fields.name.value.trim().length >= 2) score += 34;
  if (fields.ticker.value.trim().length >= 2) score += 33;
  if (state.imageFile) score += 33;
  return Math.min(score, 100);
}

function renderSelectedPairLogos(selected) {
  const stack = $("#selectedPairLogos");
  if (!stack) return;
  stack.textContent = "";
  selected.forEach((quote) => {
    const logo = QUOTE_ASSET_LOGOS[quote] || QUOTE_ASSET_LOGOS.RWI;
    const holder = document.createElement("span");
    const image = document.createElement("img");
    image.src = logo.src;
    image.alt = logo.alt;
    image.style.objectFit = quote === "RWI" ? "cover" : "contain";
    holder.appendChild(image);
    stack.appendChild(holder);
  });
}

function renderDevBuyPairOptions() {
  const selected = selectedQuoteAssets();
  if (!selected.includes(state.devBuyPair)) state.devBuyPair = selected[0];
  const wrapper = $("#modalDevBuyPair");
  const options = $("#modalDevBuyPairOptions");
  if (!wrapper || !options) return;
  wrapper.hidden = selected.length < 2;
  options.textContent = "";
  selected.forEach((quote) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `$${quote}`;
    button.setAttribute("aria-pressed", String(state.devBuyPair === quote));
    button.addEventListener("click", () => {
      state.devBuyPair = quote;
      renderDevBuyPairOptions();
      updateDevBuyEstimate();
    });
    options.appendChild(button);
  });
}

function updatePreview() {
  const name = fields.name.value.trim() || "Your token";
  const enteredTicker = cleanTicker(fields.ticker.value);
  const ticker = enteredTicker || "TOKEN";
  const description = fields.description.value.trim() || "Description optional · name, ticker, and cropped logo required.";
  fields.ticker.value = cleanTicker(fields.ticker.value);

  $("#previewName").textContent = name;
  $("#previewTicker").textContent = enteredTicker ? `$${enteredTicker}` : "";
  $("#previewTicker").hidden = !enteredTicker;
  $("#previewMonogramText").textContent = ticker.charAt(0) || "?";
  $("#previewDescription").textContent = description;
  const selected = selectedQuoteAssets();
  const quote = selected[0];
  state.quoteAsset = quote;
  state.quoteAssets = selected;
  if (!selected.includes(state.devBuyPair)) state.devBuyPair = quote;
  $("#previewPair").textContent = `${ticker} / ${selected.join(" + ")}`;
  $("#previewPairPlural").textContent = selected.length > 1 ? "s" : "";
  $("#fixedPairKicker").textContent = selected.length > 1 ? `${selected.length} permanent Uniswap pools` : "Permanent Uniswap pair";
  $("#fixedPairLabel").textContent = `${ticker} / ${selected.map((asset) => `$${asset}`).join(" + ")}`;
  $("#previewLiquidity").textContent = "0 upfront";
  renderSelectedPairLogos(selected);
  const pairLinks = $(".pair-links");
  const quoteAddresses = {
    RWI: RWI_ADDRESS,
    USDG: QUOTE_FACTORY_CONFIG.usdgAddress,
    PONS: PONS_ADDRESS,
  };
  const quoteAddress = quoteAddresses[quote];
  if (pairLinks) pairLinks.hidden = selected.length !== 1 || !isAddress(quoteAddress);
  const pairQuoteLink = $("#pairQuoteLink");
  if (pairQuoteLink && isAddress(quoteAddress)) {
    pairQuoteLink.href = `https://robinhoodchain.blockscout.com/token/${quoteAddress}`;
    pairQuoteLink.textContent = `$${quote} ${quoteAddress.slice(0, 6)}…${quoteAddress.slice(-4)} ↗`;
  }
  const footnote = $(".preview-footnote");
  if (footnote) footnote.textContent = `$10K protected-TWAP target · ${selected.length} locked pool${selected.length === 1 ? "" : "s"} · creator revenue paid in ETH · no graduation`;
  $("#descriptionCount").textContent = `${fields.description.value.length} / ${TOKEN_DESCRIPTION_MAX_LENGTH}`;

  $("#modalName").textContent = name;
  $("#modalTicker").textContent = `$${ticker}`;
  if (!state.imageUrl) $("#modalAvatar").textContent = ticker.charAt(0) || "?";

  const completeness = computeSetupCompleteness();
  $("#setupValue").textContent = `${completeness}%`;
  $("#setupBar").style.width = `${completeness}%`;
  $("#setupProgress").setAttribute("aria-valuenow", String(completeness));
  updateBalanceState();
}

function validateForm() {
  $$("[aria-invalid='true']").forEach((element) => element.removeAttribute("aria-invalid"));
  if (fields.name.value.trim().length < 2) return { message: "Add a token name.", element: fields.name };
  if (fields.ticker.value.trim().length < 2) return { message: "Add a ticker symbol.", element: fields.ticker };
  if (!state.imageFile) return { message: "Add and crop a token image.", element: $("#uploadZone") };
  return null;
}

function validateDevBuySelection() {
  fields.devBuy.removeAttribute("aria-invalid");
  try {
    configuredDevBuyUsdAmount();
    return null;
  } catch (error) {
    fields.devBuy.setAttribute("aria-invalid", "true");
    return { message: error.message, element: fields.devBuy };
  }
}

async function updateDevBuyEstimate() {
  const estimate = $("#devBuyEstimate");
  const requestId = (updateDevBuyEstimate.requestId || 0) + 1;
  updateDevBuyEstimate.requestId = requestId;
  let usdAmount;
  try {
    usdAmount = configuredDevBuyUsdAmount();
  } catch (error) {
    estimate.textContent = error.message;
    return;
  }
  const multiPairMode = selectedQuoteAssets().length > 1 || Boolean(multiPairFactoryAddress());
  if (multiPairMode) {
    const devPair = selectedDevBuyPair();
    estimate.textContent = usdAmount === 0n
      ? `Leave blank or enter 0 to skip. Any dev buy is funded with ETH and routed through the ${devPair} pool.`
      : `$${formatUnits(usdAmount, 18, 2)} will be funded with ETH and bought through TOKEN / ${devPair}.`;
    return;
  }
  if (usdAmount === 0n) {
    estimate.textContent = selectedQuoteAsset() === "RWI"
      ? "Leave blank or enter 0 to skip. ETH is converted to RWI automatically."
      : `Leave blank or enter 0 to skip. The dev buy uses ${selectedQuoteAsset()} directly.`;
    return;
  }
  const selectedQuote = selectedQuoteAsset();
  if (selectedQuote === "USDG") {
    estimate.textContent = `${formatUnits(usdAmount, 18, 2)} USDG will buy through the new locked pool.`;
    return;
  }
  if (selectedQuote === "ETH") {
    if (!quoteFactoryAddress()) {
      estimate.textContent = "The ETH/USDG launch hook must be deployed and configured before this pair can launch.";
      return;
    }
    estimate.textContent = "Estimating the direct ETH dev buy…";
    try {
      await ensureEthersLibrary();
      const provider = new window.ethers.JsonRpcProvider(ROBINHOOD_CHAIN.rpcUrls[0], 4663, { staticNetwork: true });
      const factory = new window.ethers.Contract(quoteFactoryAddress(), ["function ethUsdPriceE18() view returns (uint256)"], provider);
      const ethUsd = BigInt(await factory.ethUsdPriceE18());
      const ethAmount = usdAmount * 10n ** 18n / ethUsd;
      if (requestId !== updateDevBuyEstimate.requestId) return;
      estimate.textContent = `≈ ${formatUnits(ethAmount, 18, 8)} ETH will buy directly through the new locked pool.`;
    } catch {
      if (requestId === updateDevBuyEstimate.requestId) estimate.textContent = "The ETH amount will be calculated again immediately before launch.";
    }
    return;
  }
  if (selectedQuote === "PONS") {
    estimate.textContent = ponsFactoryAddress()
      ? `${formatUnits(usdAmount, 18, 2)} USD of PONS will buy through the new locked pool.`
      : "The PONS launch hook must be deployed and configured before this pair can launch.";
    return;
  }
  estimate.textContent = "Estimating the RWI purchase amount…";
  try {
    await ensureEthersLibrary();
    const provider = new window.ethers.JsonRpcProvider(ROBINHOOD_CHAIN.rpcUrls[0], 4663, { staticNetwork: true });
    const rwiUsdPrice = await readDiscoverRwiUsdPrice(provider);
    const rwiAmount = rwiAmountForUsd(usdAmount, rwiUsdPrice);
    const quotedEthAmount = await quoteEthForExactRwi(provider, rwiAmount);
    const maximumEthInput = maximumDevBuyEthInput(quotedEthAmount);
    if (requestId !== updateDevBuyEstimate.requestId) return;
    estimate.textContent = `≈ ${formatUnits(quotedEthAmount, 18, 8)} ETH → ${formatUnits(rwiAmount, 18, 6)} RWI · up to ${formatUnits(maximumEthInput, 18, 8)} ETH authorized`;
  } catch {
    if (requestId !== updateDevBuyEstimate.requestId) return;
    estimate.textContent = "The ETH → RWI route will be quoted again before launch.";
  }
}

function scheduleDevBuyEstimate() {
  clearTimeout(scheduleDevBuyEstimate.timer);
  scheduleDevBuyEstimate.timer = setTimeout(updateDevBuyEstimate, 250);
}

function showValidation(failure) {
  $("#formMessage").textContent = failure.message;
  failure.element.setAttribute("aria-invalid", "true");
  failure.element.focus({ preventScroll: true });
  failure.element.scrollIntoView({ behavior: "smooth", block: "center" });
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("is-visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("is-visible"), 3200);
}

function isAddress(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

function locallyDeployedFactoryAddress() {
  if (!FACTORY_CONFIG.allowBrowserDeployment || !FACTORY_CONFIG.factoryAddressStorageKey) return null;
  try {
    const localAddress = localStorage.getItem(FACTORY_CONFIG.factoryAddressStorageKey);
    return isAddress(localAddress) ? localAddress : null;
  } catch {
    return null;
  }
}

function configuredFactoryAddress() {
  return locallyDeployedFactoryAddress()
    || (isAddress(FACTORY_CONFIG.factoryAddress) ? FACTORY_CONFIG.factoryAddress : null);
}

function usingLocalReplacementFactory() {
  const localAddress = locallyDeployedFactoryAddress();
  return Boolean(localAddress && (!isAddress(FACTORY_CONFIG.factoryAddress) || !sameAddress(localAddress, FACTORY_CONFIG.factoryAddress)));
}

function effectiveLaunchesPaused() {
  return Boolean(FACTORY_CONFIG.launchesPaused && !usingLocalReplacementFactory());
}

function configuredFactoryDeploymentBlock() {
  if (usingLocalReplacementFactory()) {
    try {
      const local = Number(localStorage.getItem(FACTORY_LOCAL_BLOCK_KEY) || 0);
      return Number.isSafeInteger(local) && local > 0 ? local : 0;
    } catch {
      return 0;
    }
  }
  const configured = Number(FACTORY_CONFIG.deploymentBlock || 0);
  if (configured > 0) return configured;
  try {
    const local = Number(localStorage.getItem(FACTORY_LOCAL_BLOCK_KEY) || 0);
    return Number.isSafeInteger(local) && local > 0 ? local : 0;
  } catch {
    return 0;
  }
}

function configuredFactorySources() {
  const sources = [];
  const multiPairAddress = multiPairFactoryAddress();
  if (multiPairAddress) sources.push({
    address: multiPairAddress,
    deploymentBlock: Number(MULTI_PAIR_FACTORY_CONFIG.deploymentBlock || 0),
    current: true,
    protocol: "Uniswap v4",
    feeMode: MULTI_PAIR_FEE_MODE,
    runtimeCodeHash: MULTI_PAIR_FACTORY_CONFIG.runtimeCodeHash || null,
    multiPair: true,
  });
  const ponsAddress = ponsFactoryAddress();
  if (ponsAddress) sources.push({
    address: ponsAddress,
    deploymentBlock: Number(PONS_FACTORY_CONFIG.deploymentBlock || 0),
    current: true,
    protocol: "Uniswap v4",
    feeMode: PONS_FEE_MODE,
    runtimeCodeHash: PONS_FACTORY_CONFIG.runtimeCodeHash || null,
  });
  for (const entry of PONS_FACTORY_CONFIG.legacyFactories || []) {
    if (!isAddress(entry?.address) || sources.some((source) => sameAddress(source.address, entry.address))) continue;
    sources.push({ ...entry, deploymentBlock: Number(entry.deploymentBlock || 0), current: false, protocol: "Uniswap v4", feeMode: PONS_FEE_MODE });
  }
  const quoteAddress = quoteFactoryAddress();
  if (quoteAddress) sources.push({
    address: quoteAddress,
    deploymentBlock: Number(QUOTE_FACTORY_CONFIG.deploymentBlock || 0),
    current: true,
    protocol: "Uniswap v4",
    feeMode: MULTI_QUOTE_FEE_MODE,
    runtimeCodeHash: QUOTE_FACTORY_CONFIG.runtimeCodeHash || null,
  });
  for (const entry of QUOTE_FACTORY_CONFIG.legacyFactories || []) {
    if (!isAddress(entry?.address) || sources.some((source) => sameAddress(source.address, entry.address))) continue;
    sources.push({
      ...entry,
      deploymentBlock: Number(entry.deploymentBlock || 0),
      current: false,
      protocol: "Uniswap v4",
      feeMode: MULTI_QUOTE_FEE_MODE,
      launchesDeprecated: true,
    });
  }
  const current = configuredFactoryAddress();
  const localReplacement = usingLocalReplacementFactory();
  if (current) sources.push({
    address: current,
    deploymentBlock: configuredFactoryDeploymentBlock(),
    current: true,
    protocol: "Uniswap v4",
    feeMode: localReplacement ? INTERNAL_MATCH_FEE_MODE : (FACTORY_CONFIG.rewardMode || FACTORY_CONFIG.feeMode || "eth"),
    runtimeCodeHash: localReplacement ? null : FACTORY_CONFIG.runtimeCodeHash,
  });
  if (localReplacement && isAddress(FACTORY_CONFIG.factoryAddress)) {
    sources.push({
      address: FACTORY_CONFIG.factoryAddress,
      deploymentBlock: Number(FACTORY_CONFIG.deploymentBlock || 0),
      current: false,
      protocol: "Uniswap v4",
      feeMode: FACTORY_CONFIG.rewardMode || FACTORY_CONFIG.feeMode || "eth",
      runtimeCodeHash: FACTORY_CONFIG.runtimeCodeHash,
      launchesDeprecated: true,
    });
  }
  for (const entry of FACTORY_CONFIG.legacyFactories || []) {
    if (!isAddress(entry?.address) || sources.some((source) => sameAddress(source.address, entry.address))) continue;
    sources.push({ ...entry, deploymentBlock: Number(entry.deploymentBlock || 0), current: false });
  }
  return sources;
}

function factoryAbiForSource(source) {
  if (source.protocol !== "Uniswap v4") return LEGACY_FACTORY_ABI;
  if (isMultiPairMode(source)) return MULTI_PAIR_FACTORY_ABI;
  if (isPonsMode(source)) return PONS_FACTORY_ABI;
  if (isMultiQuoteMode(source)) return QUOTE_FACTORY_ABI;
  return source.feeMode === INTERNAL_MATCH_FEE_MODE ? FACTORY_ABI : LEGACY_V4_FACTORY_ABI;
}

function configuredFactorySource(address) {
  return configuredFactorySources().find((source) => sameAddress(source.address, address)) || null;
}

function configuredProfileRegistryAddress() {
  if (isAddress(PROFILE_REGISTRY_CONFIG.address)) return PROFILE_REGISTRY_CONFIG.address;
  try {
    const locallyDeployed = localStorage.getItem(PROFILE_REGISTRY_LOCAL_ADDRESS_KEY);
    return isAddress(locallyDeployed) ? locallyDeployed : null;
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

function renderProfileRegistryStatus() {
  const address = configuredProfileRegistryAddress();
  const status = $("#profileRegistryStatus");
  const indicator = $("#profileRegistryIndicator");
  const deploy = $("#deployProfileRegistry");
  if (!address) {
    status.classList.remove("is-live");
    indicator.textContent = "Deployment required · not independently audited";
    deploy.hidden = false;
    $("#saveCreatorProfile").textContent = "Save local profile draft";
    return;
  }
  status.classList.add("is-live");
  indicator.textContent = `${PROFILE_REGISTRY_CONFIG.sourceVerified ? "Source-verified global registry" : "Active locally · configure public site"} · ${address.slice(0, 6)}…${address.slice(-4)}`;
  deploy.hidden = true;
  $("#saveCreatorProfile").textContent = "Publish profile onchain";
}

async function validateProfileRegistryDeployment(provider, address) {
  if (!isAddress(address)) throw new Error("Invalid profile registry address.");
  const normalizedAddress = address.toLowerCase();
  if (state.profileRegistryValidationAddress !== normalizedAddress || !state.profileRegistryValidationPromise) {
    state.profileRegistryValidationAddress = normalizedAddress;
    state.profileRegistryValidationPromise = (async () => {
      const network = await provider.getNetwork();
      if (network.chainId !== 4663n) throw new Error("Profile registry must be deployed on Robinhood Chain.");
      const code = await provider.getCode(address);
      if (code === "0x") throw new Error("No profile registry bytecode exists at that address.");
      if (!PROFILE_REGISTRY_DEPLOYMENT.deployedBytecode || code.toLowerCase() !== PROFILE_REGISTRY_DEPLOYMENT.deployedBytecode.toLowerCase()) {
        throw new Error("Profile registry bytecode does not match this reviewed build.");
      }
      const registry = new window.ethers.Contract(address, PROFILE_REGISTRY_ABI, provider);
      const [version, maxAvatarBytes] = await Promise.all([registry.CODE_VERSION(), registry.MAX_AVATAR_BYTES()]);
      if (version !== 1n || maxAvatarBytes !== BigInt(PROFILE_AVATAR_MAX_BYTES)) throw new Error("Profile registry limits do not match this interface.");
      return true;
    })().catch((error) => {
      if (state.profileRegistryValidationAddress === normalizedAddress) {
        state.profileRegistryValidationAddress = null;
        state.profileRegistryValidationPromise = null;
      }
      throw error;
    });
  }
  await state.profileRegistryValidationPromise;
  return new window.ethers.Contract(address, PROFILE_REGISTRY_ABI, provider);
}

function normalizeImmutableSlots(bytecode, immutableReferences) {
  if (typeof bytecode !== "string" || !/^0x[0-9a-fA-F]*$/.test(bytecode)) return null;
  let normalized = bytecode.slice(2).toLowerCase();
  for (const references of Object.values(immutableReferences || {})) {
    for (const { start, length } of references) {
      const offset = Number(start) * 2;
      normalized = `${normalized.slice(0, offset)}${"0".repeat(Number(length) * 2)}${normalized.slice(offset + Number(length) * 2)}`;
    }
  }
  return normalized;
}

function renderIntegrationStatus() {
  const status = $("#factoryIntegrationStatus");
  const quoteSymbol = selectedQuoteAsset();
  const ponsMode = quoteSymbol === "PONS";
  const multiQuote = quoteSymbol === "ETH" || quoteSymbol === "USDG";
  const config = ponsMode ? PONS_FACTORY_CONFIG : multiQuote ? QUOTE_FACTORY_CONFIG : FACTORY_CONFIG;
  const factoryAddress = ponsMode ? ponsFactoryAddress() : multiQuote ? quoteFactoryAddress() : configuredFactoryAddress();
  if (!factoryAddress) {
    status.textContent = !multiQuote && FACTORY_CONFIG.allowBrowserDeployment
      ? "Launch factory compiled · ready for wallet deployment"
      : `${ponsMode ? "PONS" : multiQuote ? "ETH/USDG" : "RWI"} v4 hook pending deployment · internal review only`;
    status.classList.remove("is-live");
    status.parentElement?.classList.remove("is-live");
    $("#deployFactoryButton").hidden = ponsMode || multiQuote || !FACTORY_CONFIG.allowBrowserDeployment;
    return;
  }
  const localReplacement = !multiQuote && usingLocalReplacementFactory();
  const paused = ponsMode || multiQuote ? Boolean(config.launchesPaused) : effectiveLaunchesPaused();
  const stateLabel = localReplacement
    ? "Locally validated replacement hook active"
    : config.sourceVerified
    ? (config.independentAuditComplete ? "Source-verified audited factory live" : "Source-verified unaudited factory live")
    : "Launch factory active locally";
  const marketLabel = ponsMode ? "PONS" : multiQuote ? "ETH/USDG" : "RWI";
  status.textContent = paused
    ? `New ${marketLabel} launches paused · existing markets remain available · ${factoryAddress.slice(0, 6)}…${factoryAddress.slice(-4)}`
    : `${stateLabel} · ${marketLabel} · ${factoryAddress.slice(0, 6)}…${factoryAddress.slice(-4)}`;
  status.classList.toggle("is-live", !paused);
  status.parentElement?.classList.toggle("is-live", !paused);
  const canDeployReplacement = Boolean(!ponsMode && !multiQuote && FACTORY_CONFIG.allowBrowserDeployment && FACTORY_CONFIG.launchesPaused && !localReplacement);
  $("#deployFactoryButton").hidden = !canDeployReplacement;
  if (canDeployReplacement) $("#deployFactoryButton").textContent = "Deploy corrected v4 hook →";
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

async function saveLogoAsset(key, file) {
  const database = await openLogoDatabase();
  if (!database) return;
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(LOGO_STORE, "readwrite");
    transaction.objectStore(LOGO_STORE).put({ blob: file, name: file.name, type: file.type, savedAt: Date.now() }, key);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function readLogoAsset(key) {
  const database = await openLogoDatabase();
  if (!database) return null;
  const result = await new Promise((resolve, reject) => {
    const request = database.transaction(LOGO_STORE, "readonly").objectStore(LOGO_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return result;
}

async function deleteLogoAsset(key) {
  const database = await openLogoDatabase();
  if (!database) return;
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(LOGO_STORE, "readwrite");
    transaction.objectStore(LOGO_STORE).delete(key);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

function logoFileFromBlob(blob, name = "token-logo.png") {
  if (typeof File === "function") return new File([blob], name, { type: "image/png", lastModified: Date.now() });
  Object.defineProperty(blob, "name", { value: name, configurable: true });
  return blob;
}

async function sha256BlobHex(blob) {
  if (!blob || !window.crypto?.subtle) return null;
  const digest = await window.crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return `0x${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function sha256TextHex(value) {
  if (!window.crypto?.subtle) throw new Error("Secure metadata signing is unavailable in this browser.");
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("The standardized logo could not be read."));
    reader.readAsDataURL(blob);
  });
}

function rejectedImageError() {
  const error = new Error("This image can't be used. Choose another.");
  error.code = "IMAGE_REJECTED";
  return error;
}

async function assertImageAllowed(blob, purpose) {
  if (!blob) throw rejectedImageError();
  if (window.location.protocol === "file:") return true;
  const digest = await sha256BlobHex(blob);
  if (digest && approvedImageHashes.has(digest)) return true;
  try {
    const response = await fetch(new URL("api/image-safety", new URL(".", window.location.href)), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ purpose, imageDataUrl: await blobToDataUrl(blob) }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.allowed !== true) throw rejectedImageError();
    if (digest) approvedImageHashes.add(digest);
    return true;
  } catch (error) {
    if (error?.code === "IMAGE_REJECTED") throw error;
    throw rejectedImageError();
  }
}

function canonicalPublicUrl(kind, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    if (kind === "twitter" && /^(x\.com|twitter\.com)\//i.test(candidate)) candidate = `https://${candidate}`;
    else if (kind === "twitter") candidate = `https://x.com/${candidate.replace(/^@/, "")}`;
    else if (kind === "telegram") candidate = `https://${candidate.replace(/^@/, "t.me/")}`;
    else candidate = `https://${candidate}`;
  }
  const url = new URL(candidate);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only public website and social links can be published.");
  return url.href;
}

async function publicMetadataSigningMessage(payload) {
  return [
    "RWI Launchpad public token metadata",
    `Chain ID: ${ROBINHOOD_CHAIN.chainId === "0x1237" ? 4663 : Number(ROBINHOOD_CHAIN.chainId)}`,
    `Factory: ${String(payload.factoryAddress || configuredFactoryAddress()).toLowerCase()}`,
    `Token: ${payload.tokenAddress.toLowerCase()}`,
    `Creator: ${payload.creator.toLowerCase()}`,
    `Pool ID: ${payload.poolId.toLowerCase()}`,
    `Name: ${payload.name}`,
    `Symbol: ${payload.symbol}`,
    `Description SHA-256: ${await sha256TextHex(payload.description)}`,
    `Logo SHA-256: ${payload.logoSha256}`,
    `Links SHA-256: ${await sha256TextHex(JSON.stringify(payload.links))}`,
    "Purpose: publish this token's public logo and metadata",
  ].join("\n");
}

async function publicLaunchMetadataAuthorizationMessage(payload) {
  return [
    "RWI Launchpad launch metadata authorization",
    "Version: 1",
    `Chain ID: ${ROBINHOOD_CHAIN.chainId === "0x1237" ? 4663 : Number(ROBINHOOD_CHAIN.chainId)}`,
    `Factory: ${String(payload.factoryAddress || configuredFactoryAddress()).toLowerCase()}`,
    `Creator: ${payload.creator.toLowerCase()}`,
    `Name: ${payload.name}`,
    `Symbol: ${payload.symbol}`,
    `Description SHA-256: ${await sha256TextHex(payload.description)}`,
    `Logo SHA-256: ${payload.logoSha256}`,
    `Links SHA-256: ${await sha256TextHex(JSON.stringify(payload.links))}`,
    "Purpose: bind this public logo and metadata to the signed launch transaction",
  ].join("\n");
}

async function publicLaunchMetadataCommitment(payload) {
  return window.ethers.keccak256(window.ethers.toUtf8Bytes(await publicLaunchMetadataAuthorizationMessage(payload)));
}

async function publicMetadataServiceStatus() {
  if (window.location.protocol === "file:") return { configured: false, localPreview: true };
  const response = await fetch(new URL("api/token-metadata", new URL(".", window.location.href)), {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The public logo service is unavailable.");
  return result;
}

async function prepareLaunchMetadataAuthorization(creator, factoryAddress = configuredFactoryAddress()) {
  const service = await publicMetadataServiceStatus();
  if (!service.configured) throw new Error("Connect a public Vercel Blob store before launching so the token logo can be published.");
  const imageFile = state.imageFile;
  if (!imageFile) throw new Error("The standardized token logo is unavailable.");
  const logoSha256 = String(await sha256BlobHex(imageFile)).replace(/^0x/, "");
  const payload = {
    creator: window.ethers.getAddress(creator),
    factoryAddress: window.ethers.getAddress(factoryAddress),
    name: fields.name.value.trim(),
    symbol: cleanTicker(fields.ticker.value),
    description: fields.description.value.trim(),
    links: {
      website: canonicalPublicUrl("website", fields.website.value),
      twitter: canonicalPublicUrl("twitter", fields.twitter.value),
      telegram: canonicalPublicUrl("telegram", fields.telegram.value),
    },
    logoSha256,
  };
  return {
    payload,
    imageFile,
    commitment: await publicLaunchMetadataCommitment(payload),
  };
}

function mergeLocalTokenMetadata(address, update) {
  try {
    const current = readLocalTokenMetadata(address) || {};
    localStorage.setItem(tokenMetadataKey(address), JSON.stringify({ ...current, ...update }));
  } catch {
    // The public publication remains valid even if this browser cannot cache its URLs.
  }
}

async function publishLaunchedTokenAssets(signer, address, poolReference, source = {}) {
  const service = await publicMetadataServiceStatus();
  if (!service.configured) {
    throw new Error(service.localPreview
      ? "Automatic public logos activate on the deployed Vercel site."
      : "Connect a public Vercel Blob store to enable automatic public logos.");
  }
  const imageFile = source.imageFile || state.imageFile;
  if (!imageFile) throw new Error("The standardized token logo is unavailable.");
  const sourceLinks = source.links || {
    website: fields.website.value,
    twitter: fields.twitter.value,
    telegram: fields.telegram.value,
  };
  const logoSha256 = String(await sha256BlobHex(imageFile)).replace(/^0x/, "");
  const payload = {
    tokenAddress: window.ethers.getAddress(address),
    creator: window.ethers.getAddress(await signer.getAddress()),
    factoryAddress: window.ethers.getAddress(source.factoryAddress || configuredFactoryAddress()),
    poolId: String(poolReference).toLowerCase(),
    name: String(source.name ?? fields.name.value).trim(),
    symbol: cleanTicker(source.symbol ?? fields.ticker.value),
    description: String(source.description ?? fields.description.value).trim(),
    links: {
      website: canonicalPublicUrl("website", sourceLinks.website),
      twitter: canonicalPublicUrl("twitter", sourceLinks.twitter),
      telegram: canonicalPublicUrl("telegram", sourceLinks.telegram),
    },
    logoSha256,
  };
  const launchTxHash = String(source.launchTxHash || "");
  let authorization;
  if (launchTxHash) {
    const commitment = await publicLaunchMetadataCommitment(payload);
    if (source.metadataCommitment && commitment.toLowerCase() !== String(source.metadataCommitment).toLowerCase()) {
      throw new Error("The launch transaction metadata commitment no longer matches this logo.");
    }
    authorization = { launchTxHash };
  } else {
    authorization = { signature: await signer.signMessage(await publicMetadataSigningMessage(payload)) };
  }
  const endpoint = new URL("api/token-metadata", new URL(".", window.location.href));
  const body = JSON.stringify({ ...payload, ...authorization, imageDataUrl: await blobToDataUrl(imageFile) });
  let response = null;
  let result = {};
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = null;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body,
      });
      result = await response.json().catch(() => ({}));
      if (response.ok) break;
      lastError = new Error(result.error || "The public token metadata could not be published.");
      if (response.status < 500) throw lastError;
    } catch (error) {
      lastError = error;
      if (response && response.status < 500) throw error;
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  if (!response?.ok) throw lastError || new Error("The public token metadata could not be published.");
  if (!/^https:\/\//i.test(String(result.logoUrl || ""))) throw new Error("The public logo service did not return a valid image URL.");
  mergeLocalTokenMetadata(address, {
    schemaVersion: 2,
    image: result.logoUrl,
    imageUrl: result.logoUrl,
    publicLogoUrl: result.logoUrl,
    publicMetadataUrl: result.metadataUrl,
    tokenListUrl: result.tokenListUrl,
    publiclyPublishedAt: new Date().toISOString(),
  });
  return result;
}

function setProcessedLogo(file, { persist = true } = {}) {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageFile = file;
  state.imageUrl = URL.createObjectURL(file);
  $("#uploadZone").classList.add("has-image");
  $("#uploadArt").style.backgroundImage = `url("${state.imageUrl}")`;
  $("#previewImage").classList.add("has-image");
  $("#previewImage").style.backgroundImage = `url("${state.imageUrl}")`;
  $("#modalAvatar").style.backgroundImage = `url("${state.imageUrl}")`;
  $("#modalAvatar").textContent = "";
  $("#logoStatus").textContent = `Circular logo ready · ${LOGO_SIZE}×${LOGO_SIZE} PNG · ${file.name}`;
  $("#editImage").hidden = false;
  $("#downloadLogo").hidden = false;
  $("#removeImage").hidden = false;
  $("#downloadBrief").textContent = "Download metadata kit";
  updatePreview();
  queueDraftSave();
  if (persist) saveLogoAsset(DRAFT_LOGO_KEY, file).catch(() => toast("Logo preview is ready, but browser storage is unavailable."));
}

async function restoreDraftLogo() {
  try {
    const record = await readLogoAsset(DRAFT_LOGO_KEY);
    if (!record?.blob) return;
    const file = logoFileFromBlob(record.blob, record.name || "token-logo.png");
    state.originalImageFile = file;
    setProcessedLogo(file, { persist: false });
    $("#draftStatus").textContent = "Draft + logo restored";
  } catch {
    // Text fields still restore even when the browser blocks asset storage.
  }
}

function constrainCropOffsets() {
  const image = state.cropSourceImage;
  if (!image) return null;
  const zoom = Number($("#cropZoom").value) || 1;
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.max(LOGO_SIZE / sourceWidth, LOGO_SIZE / sourceHeight) * zoom;
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const limitX = Math.max(0, (width - LOGO_SIZE) / 2);
  const limitY = Math.max(0, (height - LOGO_SIZE) / 2);
  state.cropOffsetX = Math.max(-limitX, Math.min(limitX, state.cropOffsetX));
  state.cropOffsetY = Math.max(-limitY, Math.min(limitY, state.cropOffsetY));
  return { width, height };
}

function syncCropZoomDisplay() {
  const control = $("#cropZoom");
  const percentage = Math.round((Number(control.value) || 1) * 100);
  const label = `${percentage}%`;
  $("#cropZoomValue").textContent = label;
  control.setAttribute("aria-valuetext", label);
}

function drawCrop() {
  syncCropZoomDisplay();
  const canvas = $("#cropCanvas");
  const context = canvas.getContext("2d");
  const dimensions = constrainCropOffsets();
  if (!context || !dimensions || !state.cropSourceImage) return;
  context.clearRect(0, 0, LOGO_SIZE, LOGO_SIZE);
  context.fillStyle = "#e8e5dc";
  context.fillRect(0, 0, LOGO_SIZE, LOGO_SIZE);
  context.drawImage(
    state.cropSourceImage,
    (LOGO_SIZE - dimensions.width) / 2 + state.cropOffsetX,
    (LOGO_SIZE - dimensions.height) / 2 + state.cropOffsetY,
    dimensions.width,
    dimensions.height,
  );
}

function syncModalScrollLock() {
  const modalOpen = ["#cropModal", "#launchModal", "#discoverModal", "#dashboardModal"]
    .some((selector) => {
      const modal = $(selector);
      return modal && !modal.hidden;
    });
  document.body.style.overflow = modalOpen ? "hidden" : "";
}

function closeCropper() {
  $("#cropModal").hidden = true;
  syncModalScrollLock();
  state.cropDragging = null;
  state.cropSourceImage = null;
  if (state.cropSourceUrl) URL.revokeObjectURL(state.cropSourceUrl);
  state.cropSourceUrl = null;
  state.cropInputFile = null;
  state.cropCompletion = null;
  fields.image.value = "";
}

function openCropper(file, completion = null) {
  if (!file) return;
  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
  if (!allowedTypes.has(file.type)) return toast("Choose a PNG, JPG, WEBP, or GIF image.");
  if (file.size > 5 * 1024 * 1024) return toast("Image must be smaller than 5MB.");
  if (state.cropSourceUrl) URL.revokeObjectURL(state.cropSourceUrl);
  state.cropCompletion = completion;
  state.cropInputFile = file;
  state.cropSourceUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    state.cropSourceImage = image;
    state.cropOffsetX = 0;
    state.cropOffsetY = 0;
    $("#cropZoom").value = "1";
    $("#cropModal").hidden = false;
    syncModalScrollLock();
    drawCrop();
  };
  image.onerror = () => {
    closeCropper();
    toast("That image could not be read. Try another file.");
  };
  image.src = state.cropSourceUrl;
}

async function applyCrop() {
  const button = $("#cropApply");
  button.disabled = true;
    button.textContent = "Preparing logo…";
  try {
    drawCrop();
    const blob = await new Promise((resolve) => $("#cropCanvas").toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Logo export failed");
    const ticker = cleanTicker(fields.ticker.value).toLowerCase() || "token";
    const file = logoFileFromBlob(blob, `${ticker}-logo.png`);
    await assertImageAllowed(file, "token-logo");
    const completion = state.cropCompletion;
    if (completion) {
      state.cropCompletion = null;
      await completion(file);
    } else {
      state.originalImageFile = state.cropInputFile;
      setProcessedLogo(file);
    }
    closeCropper();
    toast("Circular logo ready.");
  } catch (error) {
    toast(error?.code === "IMAGE_REJECTED" ? error.message : "The crop could not be saved. Try again.");
  } finally {
    button.disabled = false;
    button.textContent = "Use logo";
  }
}

function clearImage() {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = null;
  state.imageFile = null;
  state.originalImageFile = null;
  fields.image.value = "";
  $("#uploadZone").classList.remove("has-image");
  $("#uploadArt").style.backgroundImage = "";
  $("#previewImage").classList.remove("has-image");
  $("#previewImage").style.backgroundImage = "";
  $("#modalAvatar").style.backgroundImage = "";
  $("#logoStatus").textContent = "Circular preview · exported as a listing-ready 512×512 PNG.";
  $("#editImage").hidden = true;
  $("#downloadLogo").hidden = true;
  $("#removeImage").hidden = true;
  $("#downloadBrief").textContent = "Download launch brief";
  const storedLogoDeletion = deleteLogoAsset(DRAFT_LOGO_KEY).catch(() => {});
  updatePreview();
  return storedLogoDeletion;
}

function draftValues() {
  return {
    name: fields.name.value,
    ticker: fields.ticker.value,
    description: fields.description.value,
    website: fields.website.value,
    twitter: fields.twitter.value,
    telegram: fields.telegram.value,
    quoteAsset: selectedQuoteAsset(),
    quoteAssets: selectedQuoteAssets(),
  };
}

function queueDraftSave() {
  const status = $("#draftStatus");
  status.textContent = "Saving";
  status.classList.add("is-saving");
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftValues()));
      status.textContent = "Draft saved";
    } catch {
      status.textContent = "Local save off";
    }
    status.classList.remove("is-saving");
  }, 350);
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!draft) return;
    fields.name.value = draft.name || "";
    fields.ticker.value = draft.ticker || "";
    fields.description.value = draft.description || "";
    fields.website.value = draft.website || "";
    fields.twitter.value = draft.twitter || "";
    fields.telegram.value = draft.telegram || "";
    const restoredQuotes = Array.isArray(draft.quoteAssets)
      ? draft.quoteAssets.filter((quote) => ["RWI", "ETH", "USDG", "PONS"].includes(quote))
      : (["RWI", "ETH", "USDG", "PONS"].includes(draft.quoteAsset) ? [draft.quoteAsset] : ["RWI"]);
    document.querySelectorAll('input[name="quoteAsset"]').forEach((input) => {
      input.checked = restoredQuotes.includes(input.value);
    });
    $("#draftStatus").textContent = "Draft restored";
  } catch {
    localStorage.removeItem(DRAFT_KEY);
  }
}

async function resetDraft({ announce = true } = {}) {
  clearTimeout(state.saveTimer);
  state.saveTimer = null;
  clearTimeout(scheduleDevBuyEstimate.timer);
  scheduleDevBuyEstimate.timer = null;
  updateDevBuyEstimate.requestId = (updateDevBuyEstimate.requestId || 0) + 1;
  localStorage.removeItem(DRAFT_KEY);
  fields.name.value = "";
  fields.ticker.value = "";
  fields.description.value = "";
  fields.website.value = "";
  fields.twitter.value = "";
  fields.telegram.value = "";
  fields.devBuy.value = "";
  state.pendingDevBuyRwiAmount = 0n;
  document.querySelectorAll('input[name="quoteAsset"]').forEach((input) => {
    input.checked = input.value === "RWI";
  });
  state.quoteAssets = ["RWI"];
  state.devBuyPair = "RWI";
  $$('[aria-invalid="true"]').forEach((element) => element.removeAttribute("aria-invalid"));
  $("#formMessage").textContent = "";
  const optionalFields = $(".optional-fields");
  if (optionalFields) optionalFields.open = false;
  const storedLogoDeletion = clearImage();
  updatePreview();
  updateDevBuyEstimate();
  renderIntegrationStatus();
  $("#draftStatus").textContent = "Fresh draft";
  if (announce) toast("Draft reset.");
  await storedLogoDeletion;
}

async function completeSuccessfulLaunch(address) {
  if (!isAddress(address)) return;
  const tokenPage = tokenDetailHref(address);
  await resetDraft({ announce: false });
  window.location.assign(tokenPage);
}

function currentWalletProvider() {
  if (state.walletProvider?.request) return state.walletProvider;
  if (window.ethereum?.request) return window.ethereum;
  const announced = discoveredWalletProviders.values().next().value?.provider;
  return announced?.request ? announced : null;
}

function walletUnavailableMessage() {
  if (window.location?.protocol === "file:") {
    return "Wallets cannot connect securely to this file preview. Open the launchpad from its HTTPS deployment, localhost, or Robinhood Wallet's Web3 browser.";
  }
  return "No injected EVM wallet was found. Open this dapp in Robinhood Wallet's Web3 browser or a browser with an EVM wallet extension.";
}

async function discoverWalletProvider() {
  let provider = currentWalletProvider();
  if (provider) {
    state.walletProvider = provider;
    attachWalletListeners(provider);
    return provider;
  }
  if (typeof window.dispatchEvent === "function" && typeof Event === "function") {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
  provider = currentWalletProvider();
  if (provider) {
    state.walletProvider = provider;
    attachWalletListeners(provider);
  }
  return provider;
}

async function ensureRobinhoodChain() {
  const wallet = currentWalletProvider() || await discoverWalletProvider();
  if (!wallet) throw new Error(walletUnavailableMessage());
  const current = await wallet.request({ method: "eth_chainId" });
  if (current.toLowerCase() === ROBINHOOD_CHAIN.chainId) return;
  try {
    await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ROBINHOOD_CHAIN.chainId }] });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await wallet.request({ method: "wallet_addEthereumChain", params: [ROBINHOOD_CHAIN] });
  }
}

function renderAccount() {
  const button = $("#walletButton");
  const modalAction = $("#modalWallet").dataset.action;
  if (!state.account) {
    button.textContent = "Connect wallet";
    button.classList.remove("is-connected");
    if (!state.launchInFlight) $("#modalWallet").textContent = modalAction === "confirm-launch" ? "Launch Token" : "Connect wallet";
    updateBalanceState();
    renderDashboardAccess();
    return;
  }
  button.textContent = `${state.account.slice(0, 6)}…${state.account.slice(-4)}`;
  button.classList.add("is-connected");
  renderDashboardAccess();
  if (state.launchInFlight) return;
  if (modalAction === "confirm-launch") {
    $("#modalWallet").textContent = "Launch Token";
    updateBalanceState();
    return;
  }
  if ($("#modalWallet").dataset.action === "deploy-factory") {
    $("#modalWallet").textContent = "Deploy v4 hook with wallet";
    return;
  }
  if (state.lastLaunchTx) {
    $("#modalWallet").textContent = "View transaction ↗";
  } else if (configuredFactoryAddress()) {
    $("#modalWallet").textContent = "Launch Token";
  } else {
    $("#modalWallet").textContent = "$10K v4 hook pending deployment";
  }
}

async function handleWalletAccountsChanged(accounts) {
  state.account = accounts[0] || null;
  state.ethBalance = null;
  renderAccount();
  if (state.account) {
    await readEthBalance();
    if (creatorDashboardIsOpen()) await loadCreatorDashboard();
  }
}

async function handleWalletChainChanged(chainId) {
  state.ethBalance = null;
  updateBalanceState();
  if (String(chainId).toLowerCase() === ROBINHOOD_CHAIN.chainId && state.account) {
    await readEthBalance();
    if (creatorDashboardIsOpen()) await loadCreatorDashboard();
  } else if (state.account) {
    setRevenueMessage("Switch the wallet to Robinhood Chain to load creator revenue.");
  }
  toast("Wallet network changed.");
}

function attachWalletListeners(provider) {
  if (!provider?.on || state.walletListenersAttachedTo === provider) return;
  const previous = state.walletListenersAttachedTo;
  previous?.removeListener?.("accountsChanged", handleWalletAccountsChanged);
  previous?.removeListener?.("chainChanged", handleWalletChainChanged);
  provider.on("accountsChanged", handleWalletAccountsChanged);
  provider.on("chainChanged", handleWalletChainChanged);
  state.walletListenersAttachedTo = provider;
}

async function readEthBalance() {
  const wallet = currentWalletProvider();
  if (!state.account || !wallet) return;
  $("#walletEthBalance").textContent = "Reading…";
  try {
    const balanceHex = await wallet.request({ method: "eth_getBalance", params: [state.account, "latest"] });
    state.ethBalance = balanceHex && balanceHex !== "0x" ? BigInt(balanceHex) : 0n;
  } catch {
    state.ethBalance = null;
  }
  updateBalanceState();
}

async function connectWallet() {
  if (state.walletConnectionInFlight) return false;
  const wallet = await discoverWalletProvider();
  if (!wallet) {
    toast(walletUnavailableMessage());
    return false;
  }
  state.walletConnectionInFlight = true;
  try {
    const ethersReady = ensureEthersLibrary();
    const accounts = await wallet.request({ method: "eth_requestAccounts" });
    await ethersReady;
    state.account = accounts[0] || null;
    await ensureRobinhoodChain();
    renderAccount();
    await readEthBalance();
    if (creatorDashboardIsOpen()) await loadCreatorDashboard();
    toast("Connected to Robinhood Chain.");
    return Boolean(state.account);
  } catch (error) {
    const message = String(error?.message || "Wallet connection was cancelled.");
    if (error?.code === -32002 || /already pending|request is pending/i.test(message)) {
      toast("A wallet connection request is already open. Approve or reject it in your wallet, then try again.");
    } else if (error?.code === 4001 || /rejected|denied/i.test(message)) {
      toast("Wallet connection was cancelled.");
    } else {
      toast(`Wallet connection failed: ${message.slice(0, 170)}`);
    }
    return false;
  } finally {
    state.walletConnectionInFlight = false;
  }
}

function readableWalletError(error) {
  if (error?.code === 4001 || error?.code === "ACTION_REJECTED") return "Transaction cancelled in wallet.";
  const message = error?.shortMessage || error?.reason || error?.message || "Transaction failed.";
  if (/out of gas|intrinsic gas too low|reentrancy sentry/i.test(message)) {
    return "The network did not reserve enough gas for this launch. No token was created; please retry.";
  }
  return message.replace(/^execution reverted:\s*/i, "Launch reverted: ").slice(0, 220);
}

function bufferedLaunchGasLimit(estimatedGas) {
  const estimate = BigInt(estimatedGas);
  const buffered = estimate * LAUNCH_GAS_ESTIMATE_BUFFER_BPS / 10_000n + LAUNCH_GAS_FIXED_BUFFER;
  return buffered > LAUNCH_GAS_LIMIT_FLOOR ? buffered : LAUNCH_GAS_LIMIT_FLOOR;
}

async function safeLaunchGasLimit(provider, transactionRequest) {
  try {
    return bufferedLaunchGasLimit(await provider.estimateGas(transactionRequest));
  } catch {
    // The chain can reject preflight estimation even when the same launch
    // succeeds. A fixed reserve avoids falling back to that unreliable result.
    // The wallet only charges for gas the transaction actually consumes.
    return LAUNCH_GAS_LIMIT_FLOOR;
  }
}

function creatorProfileKey(address) {
  return `rwi-creator-profile:${String(address).toLowerCase()}`;
}

function tokenMetadataKey(address) {
  return `${TOKEN_METADATA_PREFIX}${String(address).toLowerCase()}`;
}

function readLocalTokenMetadata(address) {
  try {
    return JSON.parse(localStorage.getItem(tokenMetadataKey(address)) || "null");
  } catch {
    return null;
  }
}

function saveLocalTokenMetadata(address, poolReference, logo = null) {
  const metadata = {
    schemaVersion: 1,
    name: fields.name.value.trim(),
    symbol: cleanTicker(fields.ticker.value),
    description: fields.description.value.trim(),
    links: {
      website: fields.website.value.trim(),
      twitter: fields.twitter.value.trim(),
      telegram: fields.telegram.value.trim(),
    },
    creator: state.account,
    tokenAddress: String(address),
    poolAddress: null,
    poolId: poolReference ? String(poolReference) : null,
    protocol: "Uniswap v4",
    imageKey: logo ? `token:${String(address).toLowerCase()}` : null,
    logo,
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(tokenMetadataKey(address), JSON.stringify(metadata));
  } catch {
    // Onchain launch success must not be obscured by unavailable browser storage.
  }
}

async function persistLaunchedTokenAssets(address, poolReference) {
  let logo = null;
  if (state.imageFile) {
    const key = `token:${String(address).toLowerCase()}`;
    await saveLogoAsset(key, state.imageFile);
    const stored = await readLogoAsset(key);
    if (!stored?.blob || stored.blob.type !== "image/png" || stored.blob.size !== state.imageFile.size) {
      throw new Error("The standardized logo did not pass browser-storage verification.");
    }
    logo = {
      mimeType: "image/png",
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      bytes: stored.blob.size,
      sha256: await sha256BlobHex(stored.blob),
    };
  }
  saveLocalTokenMetadata(address, poolReference, logo);
  return logo;
}

async function readPublicTokenMetadata(address) {
  if (window.location.protocol === "file:") return null;
  try {
    const url = new URL("api/token-metadata", new URL(".", window.location.href));
    url.searchParams.set("token", address);
    const response = await fetch(url, { headers: { accept: "application/json" } });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

function renderProfileAvatar() {
  const avatar = $("#profileAvatar");
  const text = $("#profileAvatarText");
  const name = $("#creatorName").value.trim();
  if (state.profileAvatarData) {
    avatar.style.backgroundImage = `url("${state.profileAvatarData}")`;
    text.textContent = "";
    return;
  }
  avatar.style.backgroundImage = "";
  text.textContent = (name.charAt(0) || state.account?.slice(2, 3) || "?").toUpperCase();
}

function readLocalCreatorProfile(address) {
  try {
    return JSON.parse(localStorage.getItem(creatorProfileKey(address)) || "null");
  } catch {
    localStorage.removeItem(creatorProfileKey(address));
    return null;
  }
}

function decodeProfileDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match || typeof atob !== "function") return null;
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const mimeType = ({ "image/jpeg": 1, "image/png": 2, "image/webp": 3 })[match[1].toLowerCase()] || 0;
  return bytes.length <= PROFILE_AVATAR_MAX_BYTES && mimeType ? { bytes, mimeType } : null;
}

function releaseProfileAvatarObjectUrl() {
  if (state.profileAvatarObjectUrl) URL.revokeObjectURL(state.profileAvatarObjectUrl);
  state.profileAvatarObjectUrl = null;
}

function applyProfileToEditor(profile, source) {
  releaseProfileAvatarObjectUrl();
  $("#creatorName").value = profile?.name || "";
  $("#creatorBio").value = profile?.bio || "";
  state.profileVersion = BigInt(profile?.version || 0);
  state.profileAvatarBytes = profile?.avatarBytes || null;
  state.profileAvatarMimeType = Number(profile?.avatarMimeType || 0);
  state.profileAvatarData = profile?.avatar || null;
  if (state.profileAvatarBytes?.length && state.profileAvatarMimeType) {
    const mime = profileMimeType(state.profileAvatarMimeType);
    state.profileAvatarObjectUrl = URL.createObjectURL(new Blob([state.profileAvatarBytes], { type: mime }));
    state.profileAvatarData = state.profileAvatarObjectUrl;
  } else if (state.profileAvatarData) {
    const decoded = decodeProfileDataUrl(state.profileAvatarData);
    state.profileAvatarBytes = decoded?.bytes || null;
    state.profileAvatarMimeType = decoded?.mimeType || 0;
  }
  $("#creatorBioCount").textContent = `${$("#creatorBio").value.length} / 160`;
  $("#profileStatus").textContent = source;
  renderProfileAvatar();
}

async function blockAtOrBeforeTimestamp(provider, targetTimestamp, firstBlock, latestBlock) {
  let low = firstBlock;
  let high = latestBlock;
  let candidate = firstBlock;
  for (let attempt = 0; attempt < 24 && low <= high; attempt += 1) {
    const middle = Math.floor((low + high) / 2);
    const block = await provider.getBlock(middle);
    if (!block) break;
    if (Number(block.timestamp) <= targetTimestamp) {
      candidate = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return candidate;
}

async function queryProfileAvatarEvent(registry, provider, creator, version, updatedAt = 0) {
  if (!version) return null;
  const latestBlock = await provider.getBlockNumber();
  const firstBlock = configuredProfileRegistryBlock();
  if (!firstBlock || firstBlock > latestBlock) throw new Error("Profile registry deployment block is unavailable.");
  const filter = registry.filters.ProfileUpdated(creator, version);
  if (updatedAt > 0) {
    try {
      const nearbyBlock = await blockAtOrBeforeTimestamp(provider, updatedAt, firstBlock, latestBlock);
      const nearbyLogs = await queryFilterWithRetry(
        registry,
        filter,
        Math.max(firstBlock, nearbyBlock - 2_000),
        Math.min(latestBlock, nearbyBlock + 2_000),
      );
      if (nearbyLogs.length) return nearbyLogs.at(-1);
    } catch {
      // Fall back to a bounded reverse scan when timestamp lookup is unavailable.
    }
  }
  const chunkSize = 50_000;
  for (let toBlock = latestBlock; toBlock >= firstBlock; toBlock -= chunkSize * 3) {
    const floor = Math.max(firstBlock, toBlock - chunkSize * 3 + 1);
    const ranges = [];
    for (let fromBlock = floor; fromBlock <= toBlock; fromBlock += chunkSize) {
      ranges.push([fromBlock, Math.min(toBlock, fromBlock + chunkSize - 1)]);
    }
    const results = await Promise.allSettled(ranges.map(([fromBlock, endBlock]) => queryFilterWithRetry(registry, filter, fromBlock, endBlock)));
    const logs = results.filter((result) => result.status === "fulfilled").flatMap((result) => result.value)
      .sort((left, right) => Number(right.blockNumber) - Number(left.blockNumber));
    if (logs.length) return logs[0];
    if (!results.some((result) => result.status === "fulfilled")) throw results[0].reason;
  }
  return null;
}

async function readOnchainCreatorProfile(address) {
  const registryAddress = configuredProfileRegistryAddress();
  if (!registryAddress || !window.ethers || !PROFILE_REGISTRY_ABI.length) return null;
  const provider = new window.ethers.JsonRpcProvider(ROBINHOOD_CHAIN.rpcUrls[0], 4663, { staticNetwork: true });
  const registry = await validateProfileRegistryDeployment(provider, registryAddress);
  const profile = await registry.profiles(address);
  const version = BigInt(profile.version);
  if (!version) return null;
  const avatarMimeType = Number(profile.avatarMimeType);
  const baseProfile = {
    name: profile.name,
    bio: profile.bio,
    version,
    updatedAt: Number(profile.updatedAt),
    avatarMimeType: 0,
    avatarBytes: new Uint8Array(),
  };
  if (!avatarMimeType) return baseProfile;
  try {
    const event = await queryProfileAvatarEvent(registry, provider, address, version, Number(profile.updatedAt));
    const avatarBytes = event ? window.ethers.getBytes(event.args.avatar) : new Uint8Array();
    if (window.ethers.keccak256(avatarBytes) !== profile.avatarHash) throw new Error("Onchain avatar data does not match the registry hash.");
    return { ...baseProfile, avatarMimeType, avatarBytes };
  } catch {
    return baseProfile;
  }
}

async function loadCreatorProfileNow() {
  if (!state.account) return;
  const requestedAccount = state.account;
  const local = readLocalCreatorProfile(requestedAccount);
  applyProfileToEditor(local, local
    ? "Local draft loaded while the shared registry is checked."
    : "Checking the shared profile registry…");
  renderProfileRegistryStatus();
  if (!configuredProfileRegistryAddress()) {
    $("#profileStatus").textContent = local
      ? "Local draft ready. Deploy and configure the registry to publish it globally."
      : "Deploy and configure the shared registry to publish a globally visible profile.";
    return;
  }
  try {
    const profile = await readOnchainCreatorProfile(requestedAccount);
    if (!sameAddress(state.account, requestedAccount)) return;
    if (profile) {
      const visibleProfile = { ...profile };
      if (visibleProfile.avatarBytes?.length && visibleProfile.avatarMimeType) {
        try {
          await assertImageAllowed(
            new Blob([visibleProfile.avatarBytes], { type: profileMimeType(visibleProfile.avatarMimeType) }),
            "profile-picture",
          );
        } catch {
          visibleProfile.avatarBytes = null;
          visibleProfile.avatarMimeType = 0;
        }
      }
      applyProfileToEditor(visibleProfile, `Onchain profile v${profile.version.toString()} loaded from Robinhood Chain.`);
    } else {
      $("#profileStatus").textContent = local
        ? "No onchain profile yet. Your local draft is ready to publish."
        : "No onchain profile yet. Add your details and publish them globally.";
    }
  } catch (error) {
    if (!sameAddress(state.account, requestedAccount)) return;
    $("#profileStatus").textContent = `Shared profile unavailable: ${String(error?.message || error).slice(0, 120)}`;
  }
}

async function loadCreatorProfile({ force = false } = {}) {
  if (!state.account) return;
  const requestedAccount = state.account;
  if (!force && state.profileLoadPromise && sameAddress(state.profileLoadAccount, requestedAccount)) {
    return state.profileLoadPromise;
  }
  if (!force && sameAddress(state.profileLoadAccount, requestedAccount) && Date.now() - state.profileLoadedAt < 60_000) return;
  state.profileLoadAccount = requestedAccount;
  const request = loadCreatorProfileNow();
  state.profileLoadPromise = request;
  try {
    await request;
    if (sameAddress(state.account, requestedAccount)) state.profileLoadedAt = Date.now();
  } finally {
    if (state.profileLoadPromise === request) state.profileLoadPromise = null;
  }
}

function setRevenueMessage(message) {
  const list = $("#revenueList");
  list.textContent = "";
  list.appendChild(dashboardElement("div", "dashboard-empty", message));
}

function renderDashboardAccess() {
  renderProfileRegistryStatus();
  renderDeveloperRevenueAccess();
  const connected = Boolean(state.account);
  $("#dashboardGate").hidden = connected;
  $("#dashboardContent").hidden = !connected;
  if (!connected) {
    state.dashboardRequestId += 1;
    state.dashboardLoading = false;
    state.creatorLaunches = [];
    releaseProfileAvatarObjectUrl();
    state.profileAvatarData = null;
    state.profileAvatarBytes = null;
    state.profileAvatarMimeType = 0;
    state.profileVersion = 0n;
    state.profileLoadAccount = null;
    state.profileLoadPromise = null;
    state.profileLoadedAt = 0;
    $("#creatorTokenCount").textContent = "0 launches";
    setRevenueMessage("Connect your wallet to load creator revenue.");
    return;
  }
  const shortAddress = `${state.account.slice(0, 6)}…${state.account.slice(-4)}`;
  $("#profileWallet").textContent = state.account;
  $("#feeRecipient").textContent = shortAddress;
  if (creatorDashboardIsOpen()) loadCreatorProfile();
}

function renderDeveloperRevenueAccess() {
  const panel = $("#developerRevenue");
  if (!panel) return;
  const authorized = Boolean(state.account && sameAddress(state.account, DEVELOPER_WALLET));
  panel.hidden = !authorized;
  if (!authorized) {
    $("#developerEthPending").textContent = "0 ETH";
    $("#developerUsdPending").textContent = "$0.00";
    $("#claimDeveloperRevenue").disabled = true;
  }
}

async function loadDeveloperRevenue(provider = null) {
  renderDeveloperRevenueAccess();
  if (!state.account || !sameAddress(state.account, DEVELOPER_WALLET)) return;
  const button = $("#claimDeveloperRevenue");
  const sources = configuredFactorySources().filter((source) => isMultiPairMode(source) || isMultiQuoteMode(source) || isPonsMode(source));
  if (!sources.length) {
    $("#developerEthPending").textContent = "Factory pending";
    $("#developerUsdPending").textContent = "—";
    button.textContent = "Nothing to claim";
    button.disabled = true;
    return;
  }
  try {
    const readProvider = provider || new window.ethers.BrowserProvider(currentWalletProvider());
    const results = await Promise.allSettled(sources.map(async (source) => {
      const factory = new window.ethers.Contract(source.address, factoryAbiForSource(source), readProvider);
      const [configuredWallet, pending] = await Promise.all([
        factory.developerWallet(), factory.claimableDeveloperEthRewards(),
      ]);
      if (!sameAddress(configuredWallet, DEVELOPER_WALLET)) throw new Error("Developer wallet mismatch");
      let ethUsdPrice = null;
      try {
        if (isMultiPairMode(source)) {
          const oracleAddress = await factory.protectedOracle();
          const oracle = new window.ethers.Contract(oracleAddress, ["function ethUsdPriceE18() view returns(uint256)"], readProvider);
          ethUsdPrice = BigInt(await oracle.ethUsdPriceE18());
        } else {
          ethUsdPrice = BigInt(await factory.ethUsdPriceE18());
        }
      } catch {}
      return { source, pending: BigInt(pending), factory, ethUsdPrice };
    }));
    state.developerRevenueFactories = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    if (!state.developerRevenueFactories.length) throw new Error("Developer revenue factories unavailable");
    const pendingEth = state.developerRevenueFactories.reduce((total, entry) => total + entry.pending, 0n);
    $("#developerEthPending").textContent = `${formatUnits(pendingEth, 18, 8)} ETH`;
    try {
      const ethUsd = state.developerRevenueFactories.map((entry) => entry.ethUsdPrice).find((value) => value !== null);
      if (ethUsd === undefined) throw new Error("ETH/USD estimate unavailable");
      $("#developerUsdPending").textContent = usdValueLabel(pendingEth * ethUsd / 10n ** 18n);
    } catch {
      $("#developerUsdPending").textContent = "USD estimate unavailable";
    }
    button.textContent = pendingEth > 0n ? "Claim developer ETH" : "Nothing to claim";
    button.disabled = state.developerClaimInFlight || pendingEth === 0n;
  } catch {
    $("#developerEthPending").textContent = "Unavailable";
    $("#developerUsdPending").textContent = "—";
    button.textContent = "Nothing to claim";
    button.disabled = true;
  }
}

async function claimDeveloperRevenue() {
  if (state.developerClaimInFlight || !state.account || !sameAddress(state.account, DEVELOPER_WALLET)) return;
  const button = $("#claimDeveloperRevenue");
  state.developerClaimInFlight = true;
  button.disabled = true;
  button.textContent = "Confirm in wallet…";
  try {
    await ensureRobinhoodChain();
    const provider = new window.ethers.BrowserProvider(currentWalletProvider());
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (!sameAddress(signerAddress, DEVELOPER_WALLET)) throw new Error("Only the configured developer wallet can claim this balance.");
    const sources = configuredFactorySources().filter((source) => isMultiPairMode(source) || isMultiQuoteMode(source) || isPonsMode(source));
    const claimable = [];
    for (const source of sources) {
      const factory = new window.ethers.Contract(source.address, factoryAbiForSource(source), signer);
      const [configuredWallet, pending] = await Promise.all([
        factory.developerWallet(), factory.claimableDeveloperEthRewards(),
      ]);
      if (!sameAddress(configuredWallet, DEVELOPER_WALLET)) {
        throw new Error("A factory developer wallet does not match this dashboard.");
      }
      if (BigInt(pending) > 0n) claimable.push({ source, factory, pending: BigInt(pending) });
    }
    if (!claimable.length) throw new Error("No developer ETH is ready to claim.");
    let claimed = 0n;
    for (let index = 0; index < claimable.length; index += 1) {
      const entry = claimable[index];
      button.textContent = `Confirm claim ${index + 1} of ${claimable.length}…`;
      await validateConfiguredFeeFactory(provider, entry.source.address);
      const transaction = await entry.factory.claimDeveloperEthRewards();
      button.textContent = `Claiming ${index + 1} of ${claimable.length}…`;
      await transaction.wait();
      claimed += entry.pending;
    }
    toast(`Claimed ${feeLabel(claimed, "ETH")} to the developer wallet.`);
  } catch (error) {
    toast(readableWalletError(error).replace(/^Launch reverted:/, "Claim reverted:"));
  } finally {
    state.developerClaimInFlight = false;
    await loadDeveloperRevenue().catch(() => {});
  }
}

function setDiscoverOpenerState(expanded) {
  $$('[data-discover-open]').forEach((opener) => opener.setAttribute("aria-expanded", String(expanded)));
}

function openDiscover(trigger = null, { updateHash = true } = {}) {
  const modal = $("#discoverModal");
  if (!modal || !modal.hidden) return;
  if ($("#dashboardModal") && !$("#dashboardModal").hidden) closeCreatorDashboard({ clearHash: false, restoreFocus: false });
  state.discoverReturnFocus = trigger || (document.activeElement !== document.body ? document.activeElement : null);
  modal.hidden = false;
  setDiscoverOpenerState(true);
  syncModalScrollLock();
  if (updateHash && window.location.hash !== "#discover") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#discover`);
  }
  window.requestAnimationFrame(() => $("#discoverClose").focus());
  loadRecentLaunches();
}

function closeDiscover({ clearHash = true, restoreFocus = true } = {}) {
  const modal = $("#discoverModal");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  setDiscoverOpenerState(false);
  syncModalScrollLock();
  if (clearHash && window.location.hash === "#discover") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  if (restoreFocus && state.discoverReturnFocus?.focus) state.discoverReturnFocus.focus();
  state.discoverReturnFocus = null;
}

function trapDiscoverFocus(event) {
  const modal = $("#discoverModal");
  if (event.key !== "Tab" || !modal || modal.hidden) return;
  const focusable = $$('#discoverModal a[href], #discoverModal button, #discoverModal [tabindex]:not([tabindex="-1"])')
    .filter((element) => !element.hidden && !element.disabled && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setDashboardOpenerState(expanded) {
  $$('[data-dashboard-open]').forEach((opener) => opener.setAttribute("aria-expanded", String(expanded)));
}

function creatorDashboardIsOpen() {
  const modal = $("#dashboardModal");
  return Boolean(modal && !modal.hidden);
}

function openCreatorDashboard(trigger = null, { updateHash = true } = {}) {
  const modal = $("#dashboardModal");
  if (!modal || !modal.hidden) return;
  if ($("#discoverModal") && !$("#discoverModal").hidden) closeDiscover({ clearHash: false, restoreFocus: false });
  state.dashboardReturnFocus = trigger || (document.activeElement !== document.body ? document.activeElement : null);
  modal.hidden = false;
  setDashboardOpenerState(true);
  renderDashboardAccess();
  if (state.account) loadCreatorDashboard();
  syncModalScrollLock();
  if (updateHash && window.location.hash !== "#dashboard") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#dashboard`);
  }
  window.requestAnimationFrame(() => $("#dashboardClose").focus());
}

function closeCreatorDashboard({ clearHash = true, restoreFocus = true } = {}) {
  const modal = $("#dashboardModal");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  setDashboardOpenerState(false);
  syncModalScrollLock();
  if (clearHash && window.location.hash === "#dashboard") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  if (restoreFocus && state.dashboardReturnFocus?.focus) state.dashboardReturnFocus.focus();
  state.dashboardReturnFocus = null;
}

function trapDashboardFocus(event) {
  const modal = $("#dashboardModal");
  if (event.key !== "Tab" || !modal || modal.hidden) return;
  const focusable = $$('#dashboardModal a[href], #dashboardModal button, #dashboardModal input, #dashboardModal textarea, #dashboardModal select, #dashboardModal [tabindex]:not([tabindex="-1"])')
    .filter((element) => !element.hidden && !element.disabled && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

async function processProfileImage(file) {
  if (!file) return;
  const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
  if (!allowed.has(file.type)) return toast("Choose a PNG, JPG, or WEBP profile picture.");
  if (file.size > 5 * 1024 * 1024) return toast("Profile picture must be smaller than 5MB.");
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const candidate = new Image();
      candidate.onload = () => resolve(candidate);
      candidate.onerror = reject;
      candidate.src = objectUrl;
    });
    let selected = null;
    for (const size of [128, 112, 96, 80]) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.fillStyle = "#e8e5dc";
      context.fillRect(0, 0, size, size);
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      for (const quality of [0.82, 0.68, 0.54, 0.42]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= PROFILE_AVATAR_MAX_BYTES) {
          selected = { blob, canvas, quality };
          break;
        }
      }
      if (selected) break;
    }
    if (!selected) throw new Error("Avatar could not be compressed to the onchain limit.");
    await assertImageAllowed(selected.blob, "profile-picture");
    releaseProfileAvatarObjectUrl();
    state.profileAvatarBytes = new Uint8Array(await selected.blob.arrayBuffer());
    state.profileAvatarMimeType = 1;
    state.profileAvatarData = selected.canvas.toDataURL("image/jpeg", selected.quality);
    renderProfileAvatar();
    $("#profileStatus").textContent = `Profile picture ready · ${(state.profileAvatarBytes.length / 1024).toFixed(1)} KiB onchain payload.`;
  } catch (error) {
    toast(error?.code === "IMAGE_REJECTED" ? error.message : "That profile picture could not be processed.");
  } finally {
    URL.revokeObjectURL(objectUrl);
    $("#profileImage").value = "";
  }
}

function clearProfileImage() {
  releaseProfileAvatarObjectUrl();
  state.profileAvatarData = null;
  state.profileAvatarBytes = null;
  state.profileAvatarMimeType = 0;
  renderProfileAvatar();
  $("#profileStatus").textContent = "Profile picture will be removed when you publish.";
}

function persistLocalCreatorProfile(profile) {
  const avatar = String(state.profileAvatarData || "").startsWith("data:") ? state.profileAvatarData : null;
  localStorage.setItem(creatorProfileKey(state.account), JSON.stringify({ ...profile, avatar }));
}

async function saveCreatorProfile(event) {
  event.preventDefault();
  if (!state.account || state.profileSaveInFlight) return toast("Connect the creator wallet first.");
  const name = $("#creatorName").value.trim();
  const bio = $("#creatorBio").value.trim();
  if (name && name.length < 2) return toast("Creator name must be at least 2 characters or left blank.");
  if (new TextEncoder().encode(name).length > 80) return toast("Creator name is too long after encoding.");
  if (new TextEncoder().encode(bio).length > 320) return toast("Creator bio is too long after encoding.");
  if ((state.profileAvatarBytes?.length || 0) > PROFILE_AVATAR_MAX_BYTES) return toast("Profile picture exceeds the onchain size limit.");
  if (state.profileAvatarBytes?.length) {
    try {
      await assertImageAllowed(new Blob([state.profileAvatarBytes], { type: "image/jpeg" }), "profile-picture");
    } catch (error) {
      return toast(error?.code === "IMAGE_REJECTED" ? error.message : "This image can't be used. Choose another.");
    }
  }
  const profile = { name, bio, wallet: state.account, updatedAt: new Date().toISOString() };
  try {
    persistLocalCreatorProfile(profile);
  } catch {
    // Publishing remains available when local draft storage is disabled.
  }
  const registryAddress = configuredProfileRegistryAddress();
  if (!registryAddress) {
    $("#profileStatus").textContent = "Local draft saved. Deploy the registry before publishing globally.";
    toast("Profile saved locally; registry deployment is still required.");
    return;
  }

  const button = $("#saveCreatorProfile");
  state.profileSaveInFlight = true;
  button.disabled = true;
  try {
    await ensureRobinhoodChain();
    const provider = new window.ethers.BrowserProvider(currentWalletProvider());
    await validateProfileRegistryDeployment(provider, registryAddress);
    const signer = await provider.getSigner();
    if (!sameAddress(await signer.getAddress(), state.account)) throw new Error("Connected wallet changed. Reload the creator dashboard.");
    const registry = new window.ethers.Contract(registryAddress, PROFILE_REGISTRY_ABI, signer);
    const avatar = state.profileAvatarBytes || new Uint8Array();
    button.textContent = "Confirm profile in wallet…";
    $("#profileStatus").textContent = "Review the onchain profile update in your wallet.";
    const transaction = await registry.setProfile(name, bio, state.profileAvatarMimeType, avatar);
    button.textContent = "Publishing profile…";
    $("#profileStatus").textContent = `Profile transaction submitted · ${transaction.hash.slice(0, 10)}…`;
    await transaction.wait();
    toast("Creator profile published onchain.");
    await loadCreatorProfile({ force: true });
  } catch (error) {
    $("#profileStatus").textContent = readableWalletError(error).replace(/^Launch reverted:/, "Profile update reverted:");
    toast($("#profileStatus").textContent);
  } finally {
    state.profileSaveInFlight = false;
    button.disabled = false;
    button.textContent = configuredProfileRegistryAddress() ? "Publish profile onchain" : "Save local profile draft";
  }
}

async function deployProfileRegistry() {
  if (state.profileRegistryDeploymentInFlight) return;
  if (!window.ethers || !PROFILE_REGISTRY_ABI.length || !PROFILE_REGISTRY_DEPLOYMENT.bytecode) {
    return toast("Connect an EVM wallet and refresh before deploying the registry.");
  }
  if (!state.account && !(await connectWallet())) return;
  const button = $("#deployProfileRegistry");
  state.profileRegistryDeploymentInFlight = true;
  button.disabled = true;
  try {
    await ensureRobinhoodChain();
    const provider = new window.ethers.BrowserProvider(currentWalletProvider());
    const signer = await provider.getSigner();
    button.textContent = "Confirm in wallet…";
    const contractFactory = new window.ethers.ContractFactory(PROFILE_REGISTRY_ABI, PROFILE_REGISTRY_DEPLOYMENT.bytecode, signer);
    const registry = await contractFactory.deploy();
    button.textContent = "Deploying registry…";
    const receipt = await registry.deploymentTransaction().wait();
    const address = await registry.getAddress();
    await validateProfileRegistryDeployment(provider, address);
    localStorage.setItem(PROFILE_REGISTRY_LOCAL_ADDRESS_KEY, address);
    localStorage.setItem(PROFILE_REGISTRY_LOCAL_BLOCK_KEY, String(receipt.blockNumber));
    renderProfileRegistryStatus();
    $("#profileStatus").textContent = `Registry deployed at ${address}. Publish your profile, then configure this address in the public site.`;
    toast("Shared profile registry deployed and validated.");
  } catch (error) {
    toast(readableWalletError(error).replace(/^Launch reverted:/, "Registry deployment reverted:"));
  } finally {
    state.profileRegistryDeploymentInFlight = false;
    button.disabled = false;
    button.textContent = "Deploy registry";
  }
}

async function queryCreatorLaunchLogs(contract, provider, creator, deploymentBlock = 0, latestBlock = null) {
  const chainHead = latestBlock ?? await provider.getBlockNumber();
  const firstBlock = Number(deploymentBlock || 0);
  const filter = contract.filters.TokenLaunched(null, creator, null);
  const logs = [];
  const chunkSize = 50_000;
  const ranges = [];
  for (let fromBlock = firstBlock; fromBlock <= chainHead; fromBlock += chunkSize) {
    ranges.push([fromBlock, Math.min(chainHead, fromBlock + chunkSize - 1)]);
  }
  for (let index = 0; index < ranges.length; index += 3) {
    const results = await Promise.allSettled(
      ranges.slice(index, index + 3).map(([fromBlock, toBlock]) => queryFilterWithRetry(contract, filter, fromBlock, toBlock)),
    );
    const completed = results.filter((result) => result.status === "fulfilled");
    completed.forEach((result) => logs.push(...result.value));
    if (!completed.length) throw results[0].reason;
  }
  return logs;
}

function splitCollectedFees(tokenAddress, amount0, amount1) {
  const tokenIs0 = BigInt(tokenAddress) < BigInt(RWI_ADDRESS);
  return tokenIs0
    ? { tokenFees: BigInt(amount0), rwiFees: BigInt(amount1) }
    : { tokenFees: BigInt(amount1), rwiFees: BigInt(amount0) };
}

async function readCreatorLaunch(eventLog, provider, factory, source) {
  const args = eventLog.args || factory.interface.parseLog(eventLog)?.args;
  const token = String(args.token);
  const isV4 = source.protocol === "Uniswap v4";
  const pool = isV4 ? null : String(args.pool);
  const poolId = isV4 ? String(args.poolId) : null;
  const positionTokenId = BigInt(args.positionTokenId);
  const tokenContract = new window.ethers.Contract(token, ["function name() view returns (string)", "function symbol() view returns (string)"], provider);
  const multiPair = isMultiPairMode(source);
  const legacyMultiQuote = isMultiQuoteMode(source);
  const multiQuote = legacyMultiQuote || multiPair;
  const ponsMode = isPonsMode(source);
  const internalMatch = source.feeMode === INTERNAL_MATCH_FEE_MODE || multiQuote || ponsMode;
  const ethOnly = source.feeMode !== "tokens";
  const positionRefPromise = multiPair ? factory.positions(positionTokenId) : Promise.resolve(null);
  const launchRecordPromise = legacyMultiQuote
    ? factory.launches(token)
    : multiPair
      ? positionRefPromise.then((positionRef) => factory.launchPools(token, positionRef.quoteAsset))
      : Promise.resolve(null);
  const ethUsdPricePromise = multiPair
    ? factory.protectedOracle().then((oracleAddress) => new window.ethers.Contract(
      oracleAddress,
      ["function ethUsdPriceE18() view returns(uint256)"],
      provider,
    ).ethUsdPriceE18())
    : factory.ethUsdPriceE18();
  const feePreview = internalMatch
    ? Promise.allSettled([
      factory.collectFeesForRevenue.staticCall(positionTokenId, { from: String(args.creator) }),
      factory.tokenFeeInventory(positionTokenId),
      multiQuote ? factory.convertibleQuoteRewards(positionTokenId) : factory.convertibleRwiRewards(positionTokenId),
      factory.claimableEthRewards(positionTokenId),
      ethUsdPricePromise,
    ])
    : ethOnly
      ? factory.claimFeesInEth.staticCall(
        positionTokenId,
        0,
        0,
        BigInt(Math.floor(Date.now() / 1000) + ETH_CLAIM_DEADLINE_SECONDS),
        { from: String(args.creator) },
      )
      : new window.ethers.Contract(
        source.address,
        ["function collectFees(uint256 positionTokenId) returns (uint256 amount0, uint256 amount1)"],
        provider,
      ).collectFees.staticCall(positionTokenId);
  const [nameResult, symbolResult, feeResult, launchRecordResult, positionRefResult, publicMetadataResult] = await Promise.allSettled([
    tokenContract.name(),
    tokenContract.symbol(),
    feePreview,
    launchRecordPromise,
    positionRefPromise,
    readPublicTokenMetadata(token),
  ]);
  const launchRecord = launchRecordResult.status === "fulfilled" ? launchRecordResult.value : null;
  const positionRef = positionRefResult.status === "fulfilled" ? positionRefResult.value : null;
  const quoteAsset = Number(launchRecord?.quoteAsset ?? positionRef?.quoteAsset ?? 0);
  const quoteSymbol = multiPair
    ? (["RWI", "ETH", "USDG", "PONS"][quoteAsset] || "RWI")
    : ponsMode
      ? "PONS"
      : legacyMultiQuote
        ? (quoteAsset === 0 ? "ETH" : "USDG")
        : "RWI";
  let fees = {
    tokenFees: null,
    rwiFees: null,
    rwiFromToken: null,
    ethQuote: null,
    claimableEthUsd: null,
    tokenFeeInventory: null,
    convertibleRwi: null,
    uncollectedTokenFees: null,
    uncollectedRwiFees: null,
  };
  if (feeResult.status === "fulfilled") {
    if (internalMatch) {
      const [uncollectedResult, inventoryResult, convertibleResult, claimableResult, ethUsdResult] = feeResult.value;
      const uncollected = uncollectedResult.status === "fulfilled" ? uncollectedResult.value : null;
      const claimableEth = claimableResult.status === "fulfilled" ? BigInt(claimableResult.value) : null;
      const ethUsdPrice = ethUsdResult.status === "fulfilled" ? BigInt(ethUsdResult.value) : null;
      fees = {
        ...fees,
        uncollectedTokenFees: uncollected ? BigInt(uncollected.tokenFees) : null,
        uncollectedRwiFees: uncollected ? BigInt(multiQuote ? uncollected.quoteFees : uncollected.rwiFees) : null,
        tokenFeeInventory: inventoryResult.status === "fulfilled" ? BigInt(inventoryResult.value) : null,
        convertibleRwi: convertibleResult.status === "fulfilled" ? BigInt(convertibleResult.value) : null,
        ethQuote: claimableEth,
        claimableEthUsd: claimableEth !== null && ethUsdPrice !== null
          ? claimableEth * ethUsdPrice / 10n ** 18n
          : null,
      };
    } else {
      fees = ethOnly
        ? {
          ...fees,
        tokenFees: BigInt(feeResult.value.tokenFees),
        rwiFees: BigInt(feeResult.value.rwiFees),
        rwiFromToken: BigInt(feeResult.value.rwiFromToken),
        ethQuote: BigInt(feeResult.value.ethAmount),
        }
        : { ...fees, ...splitCollectedFees(token, feeResult.value[0], feeResult.value[1]) };
    }
  }
  return {
    factoryAddress: factory.target,
    token,
    pool,
    poolId,
    positionTokenId,
    name: nameResult.status === "fulfilled" ? nameResult.value : "Creator token",
    symbol: symbolResult.status === "fulfilled" ? symbolResult.value : "TOKEN",
    tokenFees: fees.tokenFees,
    rwiFees: fees.rwiFees,
    rwiFromToken: fees.rwiFromToken,
    ethQuote: fees.ethQuote,
    claimableEthUsd: fees.claimableEthUsd,
    tokenFeeInventory: fees.tokenFeeInventory,
    convertibleRwi: fees.convertibleRwi,
    uncollectedTokenFees: fees.uncollectedTokenFees,
    uncollectedRwiFees: fees.uncollectedRwiFees,
    internalMatch,
    multiQuote,
    multiPair,
    quoteSymbol,
    quoteToken: launchRecord?.quoteToken ? String(launchRecord.quoteToken) : ponsMode ? PONS_ADDRESS : RWI_ADDRESS,
    metadata: publicMetadataResult.status === "fulfilled" ? publicMetadataResult.value : null,
    ethOnly,
    blockNumber: Number(eventLog.blockNumber || 0),
  };
}

function dashboardElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function tokenDetailHref(address) {
  return `token.html?address=${encodeURIComponent(String(address))}`;
}

function uniswapSwapUrl(inputCurrency, outputCurrency) {
  const query = new URLSearchParams({ chain: "robinhood", inputCurrency, outputCurrency });
  return `https://app.uniswap.org/swap?${query.toString()}`;
}

function enableTokenCard(card, address) {
  const href = tokenDetailHref(address);
  card.classList.add("token-card-clickable");
  card.dataset.tokenAddress = address;
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.addEventListener("click", (event) => {
    if (event.target.closest?.("a, button")) return;
    window.location.href = href;
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = href;
    }
  });
}

async function queryRecentLaunchLogs(factory, provider, deploymentBlock = 0, latestBlock = null) {
  const chainHead = latestBlock ?? await provider.getBlockNumber();
  const firstBlock = Number(deploymentBlock || 0);
  const filter = factory.filters.TokenLaunched(null, null, null);
  const logs = [];
  const chunkSize = 50_000;
  const ranges = [];
  for (let fromBlock = firstBlock; fromBlock <= chainHead; fromBlock += chunkSize) {
    ranges.push([fromBlock, Math.min(chainHead, fromBlock + chunkSize - 1)]);
  }
  ranges.reverse();
  for (let index = 0; index < ranges.length && logs.length < 18; index += 3) {
    const batch = ranges.slice(index, index + 3);
    const results = await Promise.all(batch.map(([fromBlock, toBlock]) => factory.queryFilter(filter, fromBlock, toBlock)));
    results.forEach((result) => logs.push(...result));
  }
  return logs.sort((left, right) => Number(right.blockNumber || 0) - Number(left.blockNumber || 0)).slice(0, 18);
}

async function readDiscoverLaunch(eventLog, provider, factory, source) {
  const args = eventLog.args || factory.interface.parseLog(eventLog)?.args;
  const token = String(args.token);
  const tokenContract = new window.ethers.Contract(token, [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
  ], provider);
  const multiPair = isMultiPairMode(source);
  const launchRecordPromise = isMultiQuoteMode(source)
    ? factory.launches(token)
    : multiPair
      ? factory.positions(BigInt(args.positionTokenId)).then((positionRef) => factory.launchPools(token, positionRef.quoteAsset))
      : Promise.resolve(null);
  const [nameResult, symbolResult, logoResult, publicMetadataResult, launchRecordResult] = await Promise.allSettled([
    tokenContract.name(),
    tokenContract.symbol(),
    readLogoAsset(`token:${token.toLowerCase()}`),
    readPublicTokenMetadata(token),
    launchRecordPromise,
  ]);
  const launchRecord = launchRecordResult.status === "fulfilled" ? launchRecordResult.value : null;
  const quoteAsset = Number(launchRecord?.quoteAsset ?? 0);
  const quoteSymbol = multiPair
    ? (["RWI", "ETH", "USDG", "PONS"][quoteAsset] || "RWI")
    : isPonsMode(source)
      ? "PONS"
      : isMultiQuoteMode(source)
        ? (quoteAsset === 0 ? "ETH" : "USDG")
        : "RWI";
  const quoteAddress = quoteSymbol === "PONS" ? PONS_ADDRESS : quoteSymbol === "RWI" ? RWI_ADDRESS : quoteSymbol === "USDG" ? QUOTE_FACTORY_CONFIG.usdgAddress : window.ethers.ZeroAddress;
  const publicMetadata = publicMetadataResult.status === "fulfilled" ? publicMetadataResult.value : null;
  const localMetadata = readLocalTokenMetadata(token);
  return {
    factoryAddress: factory.target,
    token,
    pool: source.protocol === "Uniswap v4" ? null : String(args.pool),
    poolId: source.protocol === "Uniswap v4" ? String(args.poolId) : null,
    protocol: source.protocol || "Uniswap v3",
    creator: String(args.creator),
    positionTokenId: BigInt(args.positionTokenId),
    name: nameResult.status === "fulfilled" ? nameResult.value : "Factory token",
    symbol: symbolResult.status === "fulfilled" ? symbolResult.value : "TOKEN",
    metadata: { ...(publicMetadata || {}), ...(localMetadata || {}) },
    logo: logoResult.status === "fulfilled" ? logoResult.value : null,
    blockNumber: Number(eventLog.blockNumber || 0),
    quoteSymbol,
    quoteAddress,
    multiPair,
  };
}

function appendTokenArtwork(card, launch) {
  const artLink = dashboardElement("div", "token-card-link");
  let imageUrl = launch.metadata?.image || launch.metadata?.imageUrl || KNOWN_TOKEN_IMAGES[launch.token.toLowerCase()] || null;
  if (launch.logo?.blob) {
    imageUrl = URL.createObjectURL(launch.logo.blob);
    state.discoverImageUrls.push(imageUrl);
  }
  if (imageUrl && !/^(https?:|data:|blob:)/i.test(imageUrl)) imageUrl = new URL(imageUrl.replace(/^\//, ""), new URL(".", window.location.href)).href;
  if (imageUrl) {
    const image = dashboardElement("img", "token-art token-art-image");
    image.src = imageUrl;
    image.alt = `${launch.name} token artwork`;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.replaceWith(dashboardElement("div", "token-art art-one", launch.symbol.charAt(0) || "?"));
    }, { once: true });
    artLink.appendChild(image);
  } else {
    artLink.appendChild(dashboardElement("div", "token-art art-one", launch.symbol.charAt(0) || "?"));
  }
  card.appendChild(artLink);
}

function discoverFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function discoverPairTokens(pair) {
  return {
    base: String(pair?.baseToken?.address || ""),
    quote: String(pair?.quoteToken?.address || ""),
  };
}

function isDiscoverLaunchPair(pair, launch) {
  const { base, quote } = discoverPairTokens(pair);
  const expectedQuotes = launch.quoteSymbol === "ETH"
    ? [window.ethers.ZeroAddress, QUOTE_FACTORY_CONFIG.wethAddress]
    : [launch.quoteAddress || RWI_ADDRESS];
  return expectedQuotes.some((expectedQuote) => (
    (sameAddress(base, launch.token) && sameAddress(quote, expectedQuote))
      || (sameAddress(quote, launch.token) && sameAddress(base, expectedQuote))
  ));
}

function selectDiscoverPair(pairs, launch) {
  const expectedPool = String(launch.poolId || launch.pool || "").toLowerCase();
  return (Array.isArray(pairs) ? pairs : [])
    .filter((pair) => pair?.chainId === "robinhood" && pair?.dexId === "uniswap" && isDiscoverLaunchPair(pair, launch))
    .sort((left, right) => {
      const leftExact = expectedPool && String(left?.pairAddress || "").toLowerCase() === expectedPool ? 1 : 0;
      const rightExact = expectedPool && String(right?.pairAddress || "").toLowerCase() === expectedPool ? 1 : 0;
      if (leftExact !== rightExact) return rightExact - leftExact;
      return (discoverFiniteNumber(right?.liquidity?.usd) || 0) - (discoverFiniteNumber(left?.liquidity?.usd) || 0);
    })[0] || null;
}

function discoverTokenUsdPrice(pair, tokenAddress) {
  if (!pair) return null;
  const { base, quote } = discoverPairTokens(pair);
  const baseUsd = discoverFiniteNumber(pair.priceUsd);
  const native = discoverFiniteNumber(pair.priceNative);
  if (sameAddress(base, tokenAddress)) return baseUsd;
  if (sameAddress(quote, tokenAddress) && baseUsd && native && native > 0) return baseUsd / native;
  return null;
}

function discoverQuoteFromSqrtPrice(sqrtPriceX96, baseIsToken0) {
  const sqrtPrice = Number(sqrtPriceX96) / (2 ** 96);
  const token1PerToken0 = sqrtPrice * sqrtPrice;
  const quote = baseIsToken0 ? token1PerToken0 : 1 / token1PerToken0;
  return Number.isFinite(quote) && quote > 0 ? quote : null;
}

async function fetchDiscoverPairs(tokenAddress) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`/api/dexscreener-market?token=${encodeURIComponent(tokenAddress)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Market feed unavailable");
    const pairs = await response.json();
    return Array.isArray(pairs) ? pairs : [];
  } finally {
    clearTimeout(timeout);
  }
}

async function readDiscoverV3Quote(poolAddress, baseToken, provider) {
  const pool = new window.ethers.Contract(poolAddress, [
    "function token0() view returns (address)",
    "function slot0() view returns (uint160 sqrtPriceX96,int24 tick,uint16 observationIndex,uint16 observationCardinality,uint16 observationCardinalityNext,uint8 feeProtocol,bool unlocked)",
  ], provider);
  const [token0, slot0] = await Promise.all([pool.token0(), pool.slot0()]);
  return discoverQuoteFromSqrtPrice(slot0.sqrtPriceX96 ?? slot0[0], sameAddress(token0, baseToken));
}

async function readDiscoverTokenRwiPrice(launch, provider) {
  if (launch.poolId) {
    const view = new window.ethers.Contract(LIQUIDITY_MODEL.uniswapV4StateView, [
      "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96,int24 tick,uint24 protocolFee,uint24 lpFee)",
    ], provider);
    const slot0 = await view.getSlot0(launch.poolId);
    const quoteAddress = launch.quoteAddress || RWI_ADDRESS;
    return discoverQuoteFromSqrtPrice(slot0.sqrtPriceX96 ?? slot0[0], BigInt(launch.token) < BigInt(quoteAddress));
  }
  if (launch.pool) return readDiscoverV3Quote(launch.pool, launch.token, provider);
  return null;
}

async function readDiscoverQuoteUsdPrice(launch, provider) {
  if (launch.multiPair && isAddress(launch.factoryAddress)) {
    const hook = new window.ethers.Contract(launch.factoryAddress, ["function protectedOracle() view returns(address)"], provider);
    const oracle = new window.ethers.Contract(await hook.protectedOracle(), ["function quoteUsdPriceE18(address quote) view returns(uint256)"], provider);
    return Number(window.ethers.formatUnits(await oracle.quoteUsdPriceE18(launch.quoteAddress), 18));
  }
  if (launch.quoteSymbol === "USDG") return 1;
  if (launch.quoteSymbol === "ETH") {
    const oracleAddress = quoteFactoryAddress() || configuredFactoryAddress();
    const oracle = new window.ethers.Contract(oracleAddress, ["function ethUsdPriceE18() view returns (uint256)"], provider);
    return Number(window.ethers.formatUnits(await oracle.ethUsdPriceE18(), 18));
  }
  if (launch.quoteSymbol === "PONS") {
    const oracleAddress = ponsFactoryAddress();
    if (!oracleAddress) throw new Error("PONS/USD price unavailable");
    const oracle = new window.ethers.Contract(oracleAddress, ["function ethUsdPriceE18() view returns (uint256)"], provider);
    const [ethUsdRaw, wethPerPons] = await Promise.all([
      oracle.ethUsdPriceE18(),
      readDiscoverV3Quote(PONS_FACTORY_CONFIG.ponsWethOraclePool, PONS_ADDRESS, provider),
    ]);
    return Number(window.ethers.formatUnits(ethUsdRaw, 18)) * wethPerPons;
  }
  return readDiscoverRwiUsdPrice(provider);
}

function discoverRwiUsdFromPairs(pairs) {
  return (Array.isArray(pairs) ? pairs : [])
    .map((pair) => {
      const { base, quote } = discoverPairTokens(pair);
      const baseUsd = discoverFiniteNumber(pair?.priceUsd);
      const native = discoverFiniteNumber(pair?.priceNative);
      let price = null;
      if (sameAddress(base, RWI_ADDRESS)) price = baseUsd;
      if (sameAddress(quote, RWI_ADDRESS) && native && native > 0) price = baseUsd === null ? null : baseUsd / native;
      return { price, liquidity: discoverFiniteNumber(pair?.liquidity?.usd) || 0 };
    })
    .filter((entry) => entry.price && entry.price > 0)
    .sort((left, right) => right.liquidity - left.liquidity)[0]?.price || null;
}

async function readDiscoverRwiUsdPrice(provider) {
  if (state.discoverRwiUsdPrice) return state.discoverRwiUsdPrice;
  if (state.discoverRwiUsdPromise) return state.discoverRwiUsdPromise;
  state.discoverRwiUsdPromise = (async () => {
    try {
      const factory = new window.ethers.Contract(configuredFactoryAddress(), ["function ethUsdPriceE18() view returns (uint256)"], provider);
      const [ethUsdRaw, wethPerRwi] = await Promise.all([
        factory.ethUsdPriceE18(),
        readDiscoverV3Quote(FACTORY_CONFIG.rwiWethOraclePool, RWI_ADDRESS, provider),
      ]);
      const price = Number(window.ethers.formatUnits(ethUsdRaw, 18)) * wethPerRwi;
      if (Number.isFinite(price) && price > 0) return price;
    } catch {
      // Fall back to the strongest indexed RWI market below.
    }
    const price = discoverRwiUsdFromPairs(await fetchDiscoverPairs(RWI_ADDRESS));
    if (!price) throw new Error("RWI/USD price unavailable");
    return price;
  })();
  try {
    state.discoverRwiUsdPrice = await state.discoverRwiUsdPromise;
    return state.discoverRwiUsdPrice;
  } finally {
    state.discoverRwiUsdPromise = null;
  }
}

async function readDiscoverMarketCap(launch, provider) {
  try {
    const pair = selectDiscoverPair(await fetchDiscoverPairs(launch.token), launch);
    const tokenUsd = discoverTokenUsdPrice(pair, launch.token);
    if (tokenUsd && tokenUsd > 0) return tokenUsd * Number(FIXED_TOKEN_SUPPLY);
  } catch {
    // Custom v4 markets may not yet be indexed, so use their live onchain pool price.
  }
  const [tokenRwi, rwiUsd] = await Promise.all([
    readDiscoverTokenRwiPrice(launch, provider),
    readDiscoverQuoteUsdPrice(launch, provider),
  ]);
  const marketCap = tokenRwi * rwiUsd * Number(FIXED_TOKEN_SUPPLY);
  if (!Number.isFinite(marketCap) || marketCap <= 0) throw new Error("Market cap unavailable");
  return marketCap;
}

function formatDiscoverMarketCap(value) {
  const number = discoverFiniteNumber(value);
  if (!number || number <= 0) return "Unavailable";
  if (number < 0.01) return "<$0.01";
  if (number < 1_000) return `$${number.toLocaleString("en-US", { minimumFractionDigits: number < 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(number);
}

function createDiscoverTokenCard(launch, rank, mode) {
  const card = dashboardElement("article", "token-card live-token-card");
  appendTokenArtwork(card, launch);
  card.setAttribute("aria-label", `Open ${launch.name} token page`);

  const tokenMeta = dashboardElement("div", "token-meta");
  const identity = dashboardElement("div", "");
  identity.appendChild(dashboardElement("p", "", `$${launch.symbol}`));
  identity.appendChild(dashboardElement("h3", "", launch.name));
  tokenMeta.appendChild(identity);
  tokenMeta.appendChild(dashboardElement("span", `discover-rank${mode === "newest" ? " is-new" : ""}`, mode === "newest" ? `Newest #${rank}` : `#${rank} by cap`));
  card.appendChild(tokenMeta);
  card.appendChild(dashboardElement("p", "", launch.metadata?.description || KNOWN_TOKEN_DESCRIPTIONS[launch.token.toLowerCase()] || `Fixed one-billion supply with direct, permanently locked TOKEN / ${launch.quoteSymbol || "RWI"} liquidity.`));
  card.appendChild(dashboardElement("code", "token-address", launch.token));

  const stats = dashboardElement("div", "discover-market-stats");
  const marketCap = dashboardElement("span", "", "Market cap");
  marketCap.appendChild(dashboardElement("strong", "", launch.marketCapLoading ? "Updating…" : formatDiscoverMarketCap(launch.marketCapUsd)));
  const pair = dashboardElement("span", "", "Pair");
  pair.appendChild(dashboardElement("strong", "", `${launch.quoteSymbol || "RWI"} · 1%`));
  const lp = dashboardElement("span", "", "Liquidity");
  lp.appendChild(dashboardElement("strong", "", "Locked"));
  stats.appendChild(marketCap);
  stats.appendChild(pair);
  stats.appendChild(lp);
  card.appendChild(stats);
  enableTokenCard(card, launch.token);
  return card;
}

function renderDiscoverGrid(grid, launches, mode) {
  if (!grid) return;
  grid.textContent = "";
  if (!launches.length) {
    grid.appendChild(dashboardElement("div", "discover-empty", "No launches are available yet. Check back after the next confirmed token launch."));
    return;
  }
  launches.forEach((launch, index) => grid.appendChild(createDiscoverTokenCard(launch, index + 1, mode)));
}

function renderDiscoverLaunches(launches, message = "") {
  const grid = $("#discoverTokenGrid");
  if (!grid) return;
  for (const imageUrl of state.discoverImageUrls) URL.revokeObjectURL(imageUrl);
  state.discoverImageUrls = [];
  const newest = [...launches].sort((left, right) => right.blockNumber - left.blockNumber).slice(0, 12);
  const ranked = [...launches].sort((left, right) => {
    const leftCap = discoverFiniteNumber(left.marketCapUsd) || -1;
    const rightCap = discoverFiniteNumber(right.marketCapUsd) || -1;
    return rightCap - leftCap || right.blockNumber - left.blockNumber;
  }).slice(0, 9);
  const showingNewest = state.discoverView === "newest";
  $("#discoverViewKicker").textContent = showingNewest ? "Recent activity" : "Leaderboard";
  $("#discoverViewTitle").textContent = showingNewest ? "Newest launched tokens" : "Highest market cap";
  $("#discoverViewDescription").textContent = showingNewest
    ? "Fresh launches are ordered directly from confirmed factory events."
    : "Live USD estimates from each token’s TOKEN / RWI Uniswap market.";
  const toggle = $("#discoverViewToggle");
  toggle.textContent = showingNewest ? "Show highest market cap →" : "Show newest launches →";
  toggle.setAttribute("aria-pressed", String(showingNewest));
  renderDiscoverGrid(grid, showingNewest ? newest : ranked, showingNewest ? "newest" : "market");
  const priced = launches.filter((launch) => discoverFiniteNumber(launch.marketCapUsd) > 0).length;
  $("#discoverSummary").textContent = message || `${launches.length} launch${launches.length === 1 ? "" : "es"} found · ${priced} live market cap${priced === 1 ? "" : "s"}`;
}

function toggleDiscoverView() {
  state.discoverView = state.discoverView === "market" ? "newest" : "market";
  renderDiscoverLaunches(state.discoverLaunches);
}

function discoverFallbackLaunches() {
  return [{
    factoryAddress: null,
    token: "0xC29D66d54D2eD13fFFdc89323E5A9d70C197EaEC",
    pool: null,
    poolId: null,
    protocol: "Uniswap v3",
    creator: "",
    positionTokenId: 0n,
    name: "Test",
    symbol: "TESTCOIN",
    metadata: { description: KNOWN_TOKEN_DESCRIPTIONS["0xc29d66d54d2ed13fffdc89323e5a9d70c197eaec"], image: KNOWN_TOKEN_IMAGES["0xc29d66d54d2ed13fffdc89323e5a9d70c197eaec"] },
    logo: null,
    blockNumber: 0,
    marketCapUsd: null,
    marketCapLoading: false,
  }];
}

function readDiscoverSessionCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(DISCOVER_SESSION_KEY) || "null");
    if (!cached || Date.now() - Number(cached.savedAt || 0) > DISCOVER_SESSION_TTL_MS || !Array.isArray(cached.launches)) return null;
    const launches = cached.launches.filter((launch) => isAddress(launch.token)).map((launch) => ({
      ...launch,
      positionTokenId: BigInt(launch.positionTokenId || 0),
      logo: null,
      marketCapLoading: false,
    }));
    return launches.length ? { launches, savedAt: Number(cached.savedAt) } : null;
  } catch {
    sessionStorage.removeItem(DISCOVER_SESSION_KEY);
    return null;
  }
}

function writeDiscoverSessionCache(launches) {
  try {
    const serializable = launches.map(({ logo, ...launch }) => ({
      ...launch,
      positionTokenId: String(launch.positionTokenId || 0),
      marketCapLoading: false,
    }));
    sessionStorage.setItem(DISCOVER_SESSION_KEY, JSON.stringify({ savedAt: Date.now(), launches: serializable }));
  } catch {
    // The directory remains fully functional when private browsing blocks session storage.
  }
}

async function loadRecentLaunches({ force = false } = {}) {
  const sources = configuredFactorySources();
  if (!sources.length || state.discoverLoading) return;
  if (!force && !state.discoverLaunches.length) {
    const cached = readDiscoverSessionCache();
    if (cached) {
      state.discoverLaunches = cached.launches;
      state.discoverLoadedAt = cached.savedAt;
      renderDiscoverLaunches(cached.launches);
      return;
    }
  }
  try {
    await ensureEthersLibrary();
  } catch {
    state.discoverLaunches = discoverFallbackLaunches();
    renderDiscoverLaunches(state.discoverLaunches, "Live market services are temporarily unavailable · showing a known launch");
    return;
  }
  if (!force && state.discoverLaunches.length && Date.now() - state.discoverLoadedAt < 45_000) {
    renderDiscoverLaunches(state.discoverLaunches);
    return;
  }
  state.discoverLoading = true;
  if (force) state.discoverRwiUsdPrice = null;
  const refreshButton = $("#refreshDiscover");
  if (refreshButton) refreshButton.disabled = true;
  if (!state.discoverLaunches.length) {
    $("#discoverSummary").textContent = "Reading confirmed factory launches…";
    $("#discoverTokenGrid").innerHTML = '<div class="discover-loading">Reading Robinhood Chain…</div>';
  }
  try {
    const provider = state.discoverProvider || new window.ethers.JsonRpcProvider(ROBINHOOD_CHAIN.rpcUrls[0], 4663, { staticNetwork: true });
    state.discoverProvider = provider;
    const latestBlock = await provider.getBlockNumber();
    const sourceResults = await Promise.allSettled(sources.map(async (source) => {
      const factory = new window.ethers.Contract(source.address, factoryAbiForSource(source), provider);
      const logs = await queryRecentLaunchLogs(factory, provider, source.deploymentBlock, latestBlock);
      const launchResults = await Promise.allSettled(logs.map((log) => readDiscoverLaunch(log, provider, factory, source)));
      return launchResults.filter((result) => result.status === "fulfilled").map((result) => result.value);
    }));
    const unique = new Map();
    sourceResults
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value)
      .sort((left, right) => right.blockNumber - left.blockNumber)
      .forEach((launch) => {
        const key = launch.token.toLowerCase();
        if (!unique.has(key)) unique.set(key, launch);
      });
    const launches = [...unique.values()].slice(0, 18);
    if (!launches.length) throw new Error("No factory launches returned");
    launches.forEach((launch) => {
      launch.marketCapUsd = null;
      launch.marketCapLoading = true;
    });
    state.discoverLaunches = launches;
    renderDiscoverLaunches(launches, `${launches.length} launch${launches.length === 1 ? "" : "es"} found · updating live market caps…`);
    await Promise.allSettled(launches.map(async (launch) => {
      try {
        launch.marketCapUsd = await readDiscoverMarketCap(launch, provider);
      } finally {
        launch.marketCapLoading = false;
      }
    }));
    state.discoverLoadedAt = Date.now();
    writeDiscoverSessionCache(launches);
    renderDiscoverLaunches(launches);
  } catch {
    if (state.discoverLaunches.length) {
      renderDiscoverLaunches(state.discoverLaunches, "Live refresh was interrupted · showing the last successful results");
    } else {
      state.discoverLaunches = discoverFallbackLaunches();
      renderDiscoverLaunches(state.discoverLaunches, "Live chain data is temporarily unavailable · showing a known launch");
    }
  } finally {
    state.discoverLoading = false;
    if (refreshButton) refreshButton.disabled = false;
  }
}

function feeLabel(amount, symbol) {
  if (amount === null) return `Unavailable ${symbol}`;
  return `${formatUnits(amount, 18, 6)} ${symbol}`;
}

function usdValueLabel(amount) {
  if (amount === null) return "USD estimate unavailable";
  return `$${Number(window.ethers.formatUnits(amount, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function revenueActionButton(label, disabled, handler, secondary = false) {
  const button = dashboardElement("button", `claim-revenue${secondary ? " revenue-secondary" : ""}`, label);
  button.type = "button";
  button.disabled = disabled;
  button.addEventListener("click", () => handler(button));
  return button;
}

function renderCreatorLaunches() {
  const list = $("#revenueList");
  list.textContent = "";
  $("#creatorTokenCount").textContent = `${state.creatorLaunches.length} launch${state.creatorLaunches.length === 1 ? "" : "es"}`;
  if (!state.creatorLaunches.length) {
    list.appendChild(dashboardElement("div", "dashboard-empty", "No tokens launched by this wallet through the configured factory."));
    return;
  }

  for (const launch of state.creatorLaunches) {
    const card = dashboardElement("article", "revenue-token");
    if (launch.internalMatch) card.classList.add("is-internal-match");
    const top = dashboardElement("div", "revenue-token-top");
    const avatar = dashboardElement("div", "revenue-token-avatar");
    const avatarFallback = dashboardElement("span", "", launch.symbol.charAt(0) || "?");
    avatar.appendChild(avatarFallback);
    const renderDashboardTokenImageUrl = (imageUrl) => {
      if (!imageUrl || !avatar.isConnected) return;
      avatar.querySelector("img")?.remove();
      const image = dashboardElement("img", "");
      image.alt = `${launch.name} token logo`;
      image.onload = () => { avatarFallback.hidden = true; };
      image.onerror = () => {
        image.remove();
        avatarFallback.hidden = false;
      };
      image.src = imageUrl;
      avatar.appendChild(image);
    };
    const meta = dashboardElement("div", "revenue-token-meta");
    meta.appendChild(dashboardElement("span", "", `$${launch.symbol}`));
    meta.appendChild(dashboardElement("strong", "", launch.name));
    const tokenLink = dashboardElement("a", "", launch.token);
    tokenLink.href = `${ROBINHOOD_CHAIN.blockExplorerUrls[0]}/token/${launch.token}`;
    tokenLink.target = "_blank";
    tokenLink.rel = "noreferrer";
    meta.appendChild(tokenLink);
    top.appendChild(avatar);
    top.appendChild(meta);
    top.appendChild(dashboardElement("span", "position-chip", `Locked position #${launch.positionTokenId}`));
    card.appendChild(top);

    const fees = dashboardElement("div", "revenue-fees");
    const rwiFee = dashboardElement("div", "");
    const tokenFee = dashboardElement("div", "");
    const pendingFee = dashboardElement("div", "");
    if (launch.internalMatch) {
      rwiFee.appendChild(dashboardElement("span", "", "ETH ready to claim"));
      rwiFee.appendChild(dashboardElement("strong", "", feeLabel(launch.ethQuote, "ETH")));
      tokenFee.appendChild(dashboardElement("span", "", "Estimated ETH value"));
      tokenFee.appendChild(dashboardElement("strong", "", usdValueLabel(launch.claimableEthUsd)));
      pendingFee.appendChild(dashboardElement("span", "", `${launch.symbol} waiting for buys`));
      pendingFee.appendChild(dashboardElement("strong", "", feeLabel(launch.tokenFeeInventory, launch.symbol)));
    } else if (launch.ethOnly) {
      rwiFee.appendChild(dashboardElement("span", "", "Estimated ETH payout"));
      rwiFee.appendChild(dashboardElement("strong", "", feeLabel(launch.ethQuote, "ETH")));
      tokenFee.appendChild(dashboardElement("span", "", "Automatic claim route"));
      tokenFee.appendChild(dashboardElement("strong", "", `${launch.symbol} → RWI → ETH`));
    } else {
      rwiFee.appendChild(dashboardElement("span", "", "Collectible RWI · legacy"));
      rwiFee.appendChild(dashboardElement("strong", "", feeLabel(launch.rwiFees, "RWI")));
      tokenFee.appendChild(dashboardElement("span", "", `Collectible ${launch.symbol} · legacy`));
      tokenFee.appendChild(dashboardElement("strong", "", feeLabel(launch.tokenFees, launch.symbol)));
    }
    const actions = dashboardElement("div", "revenue-actions");
    if (launch.internalMatch) {
      const actionBusy = state.activeClaimPosition !== null;
      const hasUncollected = (launch.uncollectedTokenFees ?? 0n) > 0n || (launch.uncollectedRwiFees ?? 0n) > 0n;
      const hasConvertibleRwi = (launch.convertibleRwi ?? 0n) > 0n;
      const hasClaimableEth = (launch.ethQuote ?? 0n) > 0n;
      if (hasUncollected) {
        actions.appendChild(revenueActionButton("Collect LP fees", actionBusy, (button) => collectCreatorRevenue(launch, button), true));
      }
      if (hasConvertibleRwi) {
        actions.appendChild(revenueActionButton(`Convert ${launch.quoteSymbol || "RWI"} to ETH`, actionBusy, (button) => convertCreatorRevenue(launch, button), true));
      }
      actions.appendChild(revenueActionButton(hasClaimableEth ? "Claim ETH" : "No ETH ready", actionBusy || !hasClaimableEth, (button) => claimCreatorRevenue(launch, button)));
    } else {
      const claim = dashboardElement("button", "claim-revenue", launch.ethOnly ? "Claim ETH" : "Claim revenue");
      claim.type = "button";
      const knownEmpty = launch.rwiFees === 0n && launch.tokenFees === 0n;
      claim.disabled = knownEmpty || state.activeClaimPosition !== null;
      if (knownEmpty) claim.textContent = "No fees yet";
      claim.addEventListener("click", () => claimCreatorRevenue(launch, claim));
      actions.appendChild(claim);
    }
    fees.appendChild(rwiFee);
    fees.appendChild(tokenFee);
    if (launch.internalMatch) fees.appendChild(pendingFee);
    fees.appendChild(actions);
    card.appendChild(fees);
    list.appendChild(card);

    const publicLogoUrl = launch.metadata?.image || launch.metadata?.imageUrl || launch.metadata?.logoURI || null;
    if (publicLogoUrl) renderDashboardTokenImageUrl(publicLogoUrl);

    readLogoAsset(`token:${launch.token.toLowerCase()}`).then((record) => {
      if (!avatar.isConnected) return;
      let logoBlob = record?.blob || null;
      const renderDashboardTokenLogo = (blob) => {
        if (!blob || !avatar.isConnected) return;
        const imageUrl = URL.createObjectURL(blob);
        renderDashboardTokenImageUrl(imageUrl);
        setTimeout(() => URL.revokeObjectURL(imageUrl), 60_000);
      };
      renderDashboardTokenLogo(logoBlob);
      const currentMetadataFactories = [multiPairFactoryAddress(), configuredFactoryAddress(), quoteFactoryAddress(), ponsFactoryAddress()].filter(isAddress);
      if (launch.poolId && currentMetadataFactories.some((address) => sameAddress(launch.factoryAddress, address))) {
        const metadata = { ...(launch.metadata || {}), ...(readLocalTokenMetadata(launch.token) || {}) };
        const publish = dashboardElement("button", "publish-token-logo", logoBlob
          ? (metadata.publicLogoUrl ? "Republish logo" : "Publish logo")
          : "Add public logo");
        publish.type = "button";
        const publishBlob = async (blob) => {
          logoBlob = blob;
          await saveLogoAsset(`token:${launch.token.toLowerCase()}`, blob).catch(() => {});
          renderDashboardTokenLogo(blob);
          publish.disabled = true;
          publish.textContent = "Preparing…";
          try {
            const provider = new window.ethers.BrowserProvider(currentWalletProvider());
            const signer = await provider.getSigner();
            if (!sameAddress(await signer.getAddress(), state.account)) throw new Error("Connected wallet changed. Reload the creator dashboard.");
            publish.textContent = "Approve in wallet…";
            await publishLaunchedTokenAssets(signer, launch.token, launch.poolId, {
              factoryAddress: launch.factoryAddress,
              name: launch.name,
              symbol: launch.symbol,
              description: metadata.description || "",
              links: metadata.links || {},
              imageFile: blob,
            });
            publish.textContent = "Logo published";
            toast(`${launch.symbol} public logo published.`);
            loadRecentLaunches();
          } catch (error) {
            publish.disabled = false;
            publish.textContent = logoBlob ? (metadata.publicLogoUrl ? "Republish logo" : "Publish logo") : "Add public logo";
            toast(String(error?.message || "The public logo could not be published.").slice(0, 180));
          }
        };
        publish.addEventListener("click", async () => {
          if (logoBlob) {
            await publishBlob(logoBlob);
            return;
          }
          const picker = document.createElement("input");
          picker.type = "file";
          picker.accept = "image/png,image/jpeg,image/webp,image/gif";
          picker.addEventListener("change", () => openCropper(picker.files?.[0], publishBlob), { once: true });
          picker.click();
        });
        actions.appendChild(publish);
      }
    }).catch(() => {});
  }
}

async function loadCreatorDashboard({ silent = false } = {}) {
  renderDashboardAccess();
  if (!state.account) return;
  const sources = configuredFactorySources();
  try {
    await ensureEthersLibrary();
  } catch {
    setRevenueMessage("The wallet library could not be loaded. Refresh and try again.");
    return;
  }
  if (!sources.length) {
    setRevenueMessage("The verified factory integration is unavailable.");
    return;
  }
  const requestedAccount = state.account;
  const requestId = ++state.dashboardRequestId;
  state.dashboardLoading = true;
  $("#refreshRevenue").disabled = true;
  if (!silent) setRevenueMessage("Reading creator launches and collectible fees…");
  try {
    const provider = new window.ethers.BrowserProvider(currentWalletProvider());
    const network = await provider.getNetwork();
    if (network.chainId !== 4663n) throw new Error("Switch the wallet to Robinhood Chain to load creator revenue.");
    const latestBlock = await provider.getBlockNumber();
    const developerRevenuePromise = loadDeveloperRevenue(provider).catch(() => {});
    const launchResults = await Promise.allSettled(sources.map(async (source) => {
      const factory = new window.ethers.Contract(source.address, factoryAbiForSource(source), provider);
      const logs = await queryCreatorLaunchLogs(factory, provider, requestedAccount, source.deploymentBlock, latestBlock);
      return Promise.all(logs.map((log) => readCreatorLaunch(log, provider, factory, source)));
    }));
    const launchGroups = launchResults.filter((result) => result.status === "fulfilled").map((result) => result.value);
    if (!launchGroups.length) throw launchResults[0]?.reason || new Error("Creator launch history is unavailable.");
    const launches = launchGroups.flat();
    if (requestId !== state.dashboardRequestId || !sameAddress(state.account, requestedAccount)) return;
    state.creatorLaunches = launches.sort((left, right) => right.blockNumber - left.blockNumber);
    renderCreatorLaunches();
    await developerRevenuePromise;
  } catch (error) {
    if (requestId !== state.dashboardRequestId || !sameAddress(state.account, requestedAccount)) return;
    state.creatorLaunches = [];
    $("#creatorTokenCount").textContent = "Unavailable";
    setRevenueMessage(String(error?.message || "Creator revenue could not be loaded.").slice(0, 180));
  } finally {
    if (requestId === state.dashboardRequestId) {
      state.dashboardLoading = false;
      $("#refreshRevenue").disabled = false;
    }
  }
}

async function creatorRevenueContext(launch) {
  await ensureRobinhoodChain();
  const provider = new window.ethers.BrowserProvider(currentWalletProvider());
  await validateConfiguredFeeFactory(provider, launch.factoryAddress);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  if (!sameAddress(signerAddress, state.account)) throw new Error("Connected wallet changed. Refresh the dashboard.");
  const source = configuredFactorySource(launch.factoryAddress);
  if (!source) throw new Error("This token factory is not in the launchpad configuration.");
  const factory = new window.ethers.Contract(launch.factoryAddress, factoryAbiForSource(source), signer);
  const recordedCreator = isMultiPairMode(source)
    ? (await factory.positions(launch.positionTokenId)).creator
    : await factory.positionCreators(launch.positionTokenId);
  if (!sameAddress(recordedCreator, signerAddress)) throw new Error("This wallet is not the recorded creator for that position.");
  return { factory, source };
}

async function collectCreatorRevenue(launch, button) {
  if (!state.account || state.activeClaimPosition !== null) return;
  state.activeClaimPosition = launch.positionTokenId;
  button.disabled = true;
  button.textContent = "Confirm collection…";
  try {
    const { factory } = await creatorRevenueContext(launch);
    const transaction = await factory.collectFeesForRevenue(launch.positionTokenId);
    button.textContent = "Collecting fees…";
    const receipt = await transaction.wait();
    const event = receipt.logs.map((log) => {
      try { return factory.interface.parseLog(log); } catch { return null; }
    }).find((parsed) => parsed?.name === "FeesCollectedForRevenue");
    const storedTokenFees = event?.args.tokenFees !== undefined
      ? BigInt(event.args.tokenFees)
      : event
        ? BigInt(event.args.grossTokenFees) - BigInt(event.args.compoundedTokenFees)
        : null;
    const storedQuoteFees = event?.args.quoteFees !== undefined
      ? BigInt(event.args.quoteFees)
      : event?.args.rwiFees !== undefined
        ? BigInt(event.args.rwiFees)
        : event
          ? BigInt(event.args.grossQuoteFees) - BigInt(event.args.compoundedQuoteFees)
          : null;
    toast(event
      ? `Stored ${feeLabel(storedTokenFees, launch.symbol)} + ${feeLabel(storedQuoteFees, launch.quoteSymbol || "RWI")} after permanent compounding, without a token-pool swap.`
      : "LP fees were stored without a market swap.");
    await loadCreatorDashboard({ silent: true });
  } catch (error) {
    toast(readableWalletError(error).replace(/^Launch reverted:/, "Collection reverted:"));
  } finally {
    state.activeClaimPosition = null;
    button.disabled = false;
    button.textContent = "Collect LP fees";
  }
}

async function convertCreatorRevenue(launch, button) {
  if (!state.account || state.activeClaimPosition !== null) return;
  state.activeClaimPosition = launch.positionTokenId;
  button.disabled = true;
  button.textContent = "Reading ETH quote…";
  try {
    const { factory } = await creatorRevenueContext(launch);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + ETH_CLAIM_DEADLINE_SECONDS);
    const quote = launch.multiQuote
      ? await factory.convertQuoteRewardsToEth.staticCall(launch.positionTokenId, 0, deadline)
      : await factory.convertRwiRewardsToEth.staticCall(launch.positionTokenId, 0, deadline);
    const grossEthAmount = BigInt(quote.grossEthAmount ?? quote.ethAmount);
    const minimumEthOut = grossEthAmount * (10_000n - ETH_CLAIM_SLIPPAGE_BPS) / 10_000n;
    const convertibleAmount = BigInt(launch.multiQuote ? quote.quoteAmount : quote.rwiAmount);
    if (convertibleAmount === 0n) throw new Error(`No matched ${launch.quoteSymbol || "RWI"} revenue is ready to convert.`);
    button.textContent = "Confirm conversion…";
    const transaction = launch.multiQuote
      ? await factory.convertQuoteRewardsToEth(launch.positionTokenId, minimumEthOut, deadline)
      : await factory.convertRwiRewardsToEth(launch.positionTokenId, minimumEthOut, deadline);
    button.textContent = "Preparing ETH…";
    const receipt = await transaction.wait();
    const event = receipt.logs.map((log) => {
      try { return factory.interface.parseLog(log); } catch { return null; }
    }).find((parsed) => ["RwiRewardsConvertedToEth", "QuoteRewardsConvertedToEth"].includes(parsed?.name));
    toast(event
      ? `${feeLabel(BigInt(event.args.creatorEthAmount ?? event.args.ethAmount), "ETH")} is ready for the creator. The token pool was not traded.`
      : `${launch.quoteSymbol || "RWI"} revenue was converted and the creator ETH is ready to claim.`);
    await loadCreatorDashboard({ silent: true });
  } catch (error) {
    toast(readableWalletError(error).replace(/^Launch reverted:/, "Conversion reverted:"));
  } finally {
    state.activeClaimPosition = null;
    button.disabled = false;
    button.textContent = `Convert ${launch.quoteSymbol || "RWI"} to ETH`;
  }
}

async function claimCreatorRevenue(launch, button) {
  if (!state.account || state.activeClaimPosition !== null) return;
  state.activeClaimPosition = launch.positionTokenId;
  button.disabled = true;
  button.textContent = "Confirm in wallet…";
  try {
    const { factory } = await creatorRevenueContext(launch);
    let transaction;
    let claimInterface = factory.interface;
    if (launch.internalMatch) {
      if ((launch.ethQuote ?? 0n) === 0n) throw new Error("No ETH is currently ready to claim.");
      transaction = await factory.claimEthRewards(launch.positionTokenId);
    } else if (launch.ethOnly) {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + ETH_CLAIM_DEADLINE_SECONDS);
      const quote = await factory.claimFeesInEth.staticCall(launch.positionTokenId, 0, 0, deadline);
      const minimumRwiFromToken = BigInt(quote.rwiFromToken) * (10_000n - ETH_CLAIM_SLIPPAGE_BPS) / 10_000n;
      const minimumEthOut = BigInt(quote.ethAmount) * (10_000n - ETH_CLAIM_SLIPPAGE_BPS) / 10_000n;
      if (BigInt(quote.tokenFees) === 0n && BigInt(quote.rwiFees) === 0n) throw new Error("No creator fees are currently available.");
      transaction = await factory.claimFeesInEth(
        launch.positionTokenId,
        minimumRwiFromToken,
        minimumEthOut,
        deadline,
      );
    } else {
      claimInterface = factory.interface;
      transaction = await factory.collectFees(launch.positionTokenId);
    }
    button.textContent = "Claiming revenue…";
    const receipt = await transaction.wait();
    let collected = null;
    for (const log of receipt.logs) {
      try {
        const parsed = claimInterface.parseLog(log);
        if (["FeesCollected", "FeesClaimedInEth", "EthRewardsClaimed"].includes(parsed?.name) && BigInt(parsed.args.positionTokenId) === launch.positionTokenId) collected = parsed.args;
      } catch {
        // Unrelated token and pool logs are ignored.
      }
    }
    if (collected?.ethAmount !== undefined) {
      toast(`Claimed ${feeLabel(BigInt(collected.ethAmount), "ETH")} to the creator wallet.`);
    } else if (collected) {
      const amounts = splitCollectedFees(launch.token, collected.amount0, collected.amount1);
      toast(`Claimed ${feeLabel(amounts.rwiFees, "RWI")} + ${feeLabel(amounts.tokenFees, launch.symbol)}.`);
    } else {
      toast("Revenue claim confirmed and sent to the creator wallet.");
    }
    state.activeClaimPosition = null;
    await loadCreatorDashboard({ silent: true });
  } catch (error) {
    toast(readableWalletError(error).replace(/^Launch reverted:/, "Claim reverted:"));
  } finally {
    state.activeClaimPosition = null;
    button.disabled = false;
    button.textContent = launch.ethOnly ? "Claim ETH" : "Claim revenue";
  }
}

function sameAddress(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}

async function verifyNewLaunchLiquidity(provider, launchFactory, tokenAddress, expectedPoolId) {
  const ethers = window.ethers;
  const factoryAddress = await launchFactory.getAddress();
  const stateView = new ethers.Contract(FACTORY_CONFIG.uniswapV4StateView, [
    "function getLiquidity(bytes32 poolId) view returns (uint128 liquidity)",
    "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96,int24 tick,uint24 protocolFee,uint24 lpFee)",
    "function getPositionInfo(bytes32 poolId,address owner,int24 tickLower,int24 tickUpper,bytes32 salt) view returns (uint128 liquidity,uint256 feeGrowthInside0LastX128,uint256 feeGrowthInside1LastX128)",
  ], provider);
  const record = await launchFactory.launches(tokenAddress);
  const poolId = String(record.poolId);
  const tickLower = Number(record.tickLower);
  const tickUpper = Number(record.tickUpper);
  const [activeLiquidity, positionInfo, slot0] = await Promise.all([
    stateView.getLiquidity(poolId),
    stateView.getPositionInfo(poolId, factoryAddress, tickLower, tickUpper, ethers.ZeroHash),
    stateView.getSlot0(poolId),
  ]);
  const recordedLiquidity = BigInt(record.liquidity);
  const positionLiquidity = BigInt(positionInfo.liquidity ?? positionInfo[0]);
  const liveLiquidity = BigInt(activeLiquidity);
  const currentTick = Number(slot0.tick ?? slot0[1]);
  const failures = [];
  if (poolId.toLowerCase() !== String(expectedPoolId).toLowerCase()) failures.push("pool ID mismatch");
  if (!record.liquidityPermanentlyLocked) failures.push("lock flag missing");
  if (recordedLiquidity === 0n) failures.push("recorded liquidity is zero");
  if (positionLiquidity !== recordedLiquidity) failures.push("live position differs from the launch record");
  if (liveLiquidity === 0n) failures.push("active pool liquidity is zero");
  if (currentTick < tickLower || currentTick >= tickUpper) failures.push("opening price is outside the locked range");
  if (failures.length) throw new Error(`Onchain liquidity check: ${failures.join(", ")}.`);
  return { recordedLiquidity, positionLiquidity, liveLiquidity, currentTick, tickLower, tickUpper };
}

async function validateFactoryDeployment(provider, address) {
  await ensureFactoryDeploymentBundle();
  const ethers = window.ethers;
  const network = await provider.getNetwork();
  if (network.chainId !== 4663n) throw new Error("Factory was not deployed on Robinhood Chain.");

  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("Factory deployment produced no contract bytecode.");
  const expectedRuntime = normalizeImmutableSlots(FACTORY_DEPLOYMENT.deployedBytecode, FACTORY_DEPLOYMENT.immutableReferences);
  const actualRuntime = normalizeImmutableSlots(code, FACTORY_DEPLOYMENT.immutableReferences);
  if (!expectedRuntime || actualRuntime !== expectedRuntime) throw new Error("Deployed factory bytecode does not match this reviewed build.");
  if ((BigInt(address) & 0x3fffn) !== 0x2088n) throw new Error("Factory address does not encode the required Uniswap v4 hook permissions.");

  const factory = new ethers.Contract(address, FACTORY_ABI, provider);
  const values = await Promise.all([
    factory.RWI(), factory.WETH(), factory.USDG(),
    factory.UNISWAP_V4_POOL_MANAGER(), factory.UNISWAP_V4_STATE_VIEW(), factory.UNISWAP_V4_UNIVERSAL_ROUTER(),
    factory.UNISWAP_V3_FACTORY(), factory.SWAP_ROUTER_02(), factory.RWI_WETH_ORACLE_POOL(), factory.WETH_USDG_ORACLE_POOL(),
    factory.rwi(), factory.ROBINHOOD_CHAIN_ID(), factory.POOL_FEE(), factory.POOL_TICK_SPACING(),
    factory.POOL_ALLOCATION_BPS(),
    factory.LIQUIDITY_PERMANENTLY_LOCKED(), factory.CREATOR_LP_FEE_SHARE_BPS(), factory.TARGET_MARKET_CAP_USD_E18(),
    factory.ORACLE_TWAP_WINDOW(), factory.MAX_RWI_WETH_SPOT_TWAP_DEVIATION(), factory.MAX_WETH_USDG_SPOT_TWAP_DEVIATION(),
    factory.MIN_RWI_WETH_HARMONIC_LIQUIDITY(), factory.MIN_WETH_USDG_HARMONIC_LIQUIDITY(),
    factory.REQUIRED_HOOK_FLAGS(), factory.ALL_HOOK_FLAGS_MASK(), factory.WETH_USDG_ORACLE_FEE(),
    factory.INITIAL_ACTIVE_TOKEN_BPS(), factory.STAGED_TOKEN_BPS(), factory.STAGED_POSITION_COUNT(),
  ]);
  const [
    rwi, weth, usdg, poolManager, stateView, universalRouter, uniswapFactory, swapRouter, rwiWethPool, wethUsdgPool,
    immutableRwi, chainId, poolFee, tickSpacing, poolAllocation, locked, creatorFeeShare, targetMarketCap,
    twapWindow, maxRwiDeviation, maxWethDeviation, minRwiLiquidity, minWethLiquidity, requiredHookFlags,
    allHookFlagsMask, wethUsdgFee, activeBps, stagedBps, stagedPositionCount,
  ] = values;

  const addressChecks = [
    [rwi, RWI_ADDRESS, "RWI"], [weth, FACTORY_CONFIG.wethAddress, "WETH"], [usdg, FACTORY_CONFIG.usdgAddress, "USDG"],
    [poolManager, FACTORY_CONFIG.uniswapV4PoolManager, "v4 PoolManager"], [stateView, FACTORY_CONFIG.uniswapV4StateView, "v4 StateView"],
    [universalRouter, FACTORY_CONFIG.uniswapV4UniversalRouter, "v4 Universal Router"],
    [uniswapFactory, FACTORY_CONFIG.uniswapV3Factory, "v3 factory"], [swapRouter, FACTORY_CONFIG.swapRouter02, "SwapRouter02"],
    [rwiWethPool, FACTORY_CONFIG.rwiWethOraclePool, "RWI/WETH oracle pool"], [wethUsdgPool, FACTORY_CONFIG.wethUsdgOraclePool, "WETH/USDG oracle pool"],
    [immutableRwi, rwi, "immutable RWI"],
  ];
  for (const [actual, expected, label] of addressChecks) {
    if (!sameAddress(actual, expected)) throw new Error(`Factory ${label} integration mismatch.`);
  }
  const v4Quoter = FACTORY_CONFIG.uniswapV4Quoter;
  const permit2 = FACTORY_CONFIG.permit2;
  if (!isAddress(v4Quoter) || !isAddress(permit2)) throw new Error("Factory v4 Quoter or Permit2 configuration is missing.");
  const integrationCodes = await Promise.all([poolManager, stateView, v4Quoter, universalRouter, permit2, uniswapFactory, swapRouter, rwiWethPool, wethUsdgPool].map((integration) => provider.getCode(integration)));
  if (integrationCodes.some((integrationCode) => integrationCode === "0x")) throw new Error("A required Uniswap integration has no deployed code.");
  const immutableStateAbi = ["function poolManager() view returns(address)"];
  const v4Managers = await Promise.all([stateView, v4Quoter, universalRouter].map((integration) => (
    new ethers.Contract(integration, immutableStateAbi, provider).poolManager()
  )));
  if (v4Managers.some((manager) => !sameAddress(manager, poolManager))) {
    throw new Error("A required Uniswap v4 integration points to the wrong PoolManager.");
  }
  if (
    chainId !== 4663n || poolFee !== 10_000n || tickSpacing !== 200n || poolAllocation !== 10_000n || !locked
    || creatorFeeShare !== 10_000n || targetMarketCap !== ethers.parseUnits("10000", 18) || twapWindow !== 1_800n
    || maxRwiDeviation !== 1_000n || maxWethDeviation !== 300n || minRwiLiquidity !== 10n ** 22n
    || minWethLiquidity !== 5n * 10n ** 17n || requiredHookFlags !== 8_328n || allHookFlagsMask !== 16_383n
    || wethUsdgFee !== 100n || activeBps !== 2_500n || stagedBps !== 7_500n || stagedPositionCount !== 10n
  ) {
    throw new Error("Factory launch rules do not match this reviewed build.");
  }
  return ethers.keccak256(code);
}

async function validateQuoteFactoryDeployment(provider, address) {
  const network = await provider.getNetwork();
  if (network.chainId !== 4663n) throw new Error("Switch the wallet to Robinhood Chain.");
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("The ETH/USDG launch factory is not deployed.");
  if (QUOTE_FACTORY_DEPLOYMENT.deployedBytecode) {
    const expected = normalizeImmutableSlots(QUOTE_FACTORY_DEPLOYMENT.deployedBytecode, QUOTE_FACTORY_DEPLOYMENT.immutableReferences || {});
    const actual = normalizeImmutableSlots(code, QUOTE_FACTORY_DEPLOYMENT.immutableReferences || {});
    if (!expected || actual !== expected) throw new Error("The ETH/USDG factory bytecode does not match this build.");
  }
  if ((BigInt(address) & 0x3fffn) !== 0x2088n) throw new Error("The ETH/USDG factory has invalid v4 hook permissions.");
  const factory = new window.ethers.Contract(address, QUOTE_FACTORY_ABI, provider);
  const [developer, weth, usdg, poolManager, stateView, swapRouter, creatorShare, developerShare, locked, targetCap, activeBps, stagedBps, stagedPositionCount] = await Promise.all([
    factory.developerWallet(), factory.weth(), factory.usdg(), factory.poolManager(), factory.stateView(), factory.swapRouter(),
    factory.CREATOR_LP_FEE_SHARE_BPS(), factory.DEVELOPER_LP_FEE_SHARE_BPS(), factory.LIQUIDITY_PERMANENTLY_LOCKED(),
    factory.TARGET_MARKET_CAP_USD_E18(),
    factory.INITIAL_ACTIVE_TOKEN_BPS(), factory.STAGED_TOKEN_BPS(), factory.STAGED_POSITION_COUNT(),
  ]);
  const addressChecks = [
    [developer, DEVELOPER_WALLET, "developer wallet"],
    [weth, QUOTE_FACTORY_CONFIG.wethAddress, "WETH"],
    [usdg, QUOTE_FACTORY_CONFIG.usdgAddress, "USDG"],
    [poolManager, QUOTE_FACTORY_CONFIG.uniswapV4PoolManager, "PoolManager"],
    [stateView, QUOTE_FACTORY_CONFIG.uniswapV4StateView, "StateView"],
    [swapRouter, QUOTE_FACTORY_CONFIG.swapRouter02, "SwapRouter02"],
  ];
  for (const [actual, expected, label] of addressChecks) {
    if (!sameAddress(actual, expected)) throw new Error(`ETH/USDG factory ${label} mismatch.`);
  }
  if (
    creatorShare !== 9000n || developerShare !== 1000n || !locked || targetCap !== 10_000n * 10n ** 18n
    || activeBps !== 2500n || stagedBps !== 7500n || stagedPositionCount !== 10n
  ) {
    throw new Error("The ETH/USDG factory launch or revenue rules do not match this build.");
  }
  return window.ethers.keccak256(code);
}

async function validatePonsFactoryDeployment(provider, address) {
  const network = await provider.getNetwork();
  if (network.chainId !== 4663n) throw new Error("Switch the wallet to Robinhood Chain.");
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("The PONS launch factory is not deployed.");
  const expected = normalizeImmutableSlots(PONS_FACTORY_DEPLOYMENT.deployedBytecode, PONS_FACTORY_DEPLOYMENT.immutableReferences || {});
  const actual = normalizeImmutableSlots(code, PONS_FACTORY_DEPLOYMENT.immutableReferences || {});
  if (!expected || actual !== expected) throw new Error("The PONS factory bytecode does not match this build.");
  if ((BigInt(address) & 0x3fffn) !== 0x2088n) throw new Error("The PONS factory has invalid v4 hook permissions.");
  const factory = new window.ethers.Contract(address, PONS_FACTORY_ABI, provider);
  const [
    developer, pons, weth, usdg, poolManager, stateView, swapRouter, ponsWethPool, wethUsdgPool,
    immutablePons, creatorShare, developerShare, locked, targetCap, activeBps, stagedBps, stagedPositionCount,
  ] = await Promise.all([
    factory.developerWallet(), factory.PONS(), factory.WETH(), factory.USDG(), factory.UNISWAP_V4_POOL_MANAGER(),
    factory.UNISWAP_V4_STATE_VIEW(), factory.SWAP_ROUTER_02(), factory.PONS_WETH_ORACLE_POOL(),
    factory.WETH_USDG_ORACLE_POOL(), factory.rwi(), factory.CREATOR_LP_FEE_SHARE_BPS(),
    factory.DEVELOPER_LP_FEE_SHARE_BPS(), factory.LIQUIDITY_PERMANENTLY_LOCKED(),
    factory.TARGET_MARKET_CAP_USD_E18(), factory.INITIAL_ACTIVE_TOKEN_BPS(), factory.STAGED_TOKEN_BPS(),
    factory.STAGED_POSITION_COUNT(),
  ]);
  const checks = [
    [developer, DEVELOPER_WALLET, "developer wallet"], [pons, PONS_ADDRESS, "PONS"],
    [weth, PONS_FACTORY_CONFIG.wethAddress, "WETH"], [usdg, PONS_FACTORY_CONFIG.usdgAddress, "USDG"],
    [poolManager, PONS_FACTORY_CONFIG.uniswapV4PoolManager, "PoolManager"],
    [stateView, PONS_FACTORY_CONFIG.uniswapV4StateView, "StateView"],
    [swapRouter, PONS_FACTORY_CONFIG.swapRouter02, "SwapRouter02"],
    [ponsWethPool, PONS_FACTORY_CONFIG.ponsWethOraclePool, "PONS/WETH oracle pool"],
    [wethUsdgPool, PONS_FACTORY_CONFIG.wethUsdgOraclePool, "WETH/USDG oracle pool"],
    [immutablePons, PONS_ADDRESS, "immutable PONS"],
  ];
  for (const [value, expectedValue, label] of checks) {
    if (!sameAddress(value, expectedValue)) throw new Error(`PONS factory ${label} mismatch.`);
  }
  if (
    creatorShare !== 9_000n || developerShare !== 1_000n || !locked || targetCap !== 10_000n * 10n ** 18n
    || activeBps !== 2_500n || stagedBps !== 7_500n || stagedPositionCount !== 10n
  ) throw new Error("The PONS launch or 90/10 revenue rules do not match this build.");
  return window.ethers.keccak256(code);
}

async function validateMultiPairFactoryDeployment(provider, address) {
  await ensureMultiPairDeploymentBundle();
  const network = await provider.getNetwork();
  if (network.chainId !== 4663n) throw new Error("Switch the wallet to Robinhood Chain.");
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("The atomic multi-pair hook is not deployed.");
  const expected = normalizeImmutableSlots(
    MULTI_PAIR_FACTORY_DEPLOYMENT.deployedBytecode,
    MULTI_PAIR_FACTORY_DEPLOYMENT.immutableReferences || {},
  );
  const actual = normalizeImmutableSlots(code, MULTI_PAIR_FACTORY_DEPLOYMENT.immutableReferences || {});
  if (!expected || actual !== expected) throw new Error("The multi-pair hook bytecode does not match this reviewed build.");
  if ((BigInt(address) & 0x3fffn) !== 0x2088n) throw new Error("The multi-pair hook has invalid Uniswap v4 permissions.");
  const factory = new window.ethers.Contract(address, MULTI_PAIR_FACTORY_ABI, provider);
  const [
    rwi, weth, usdg, pons, poolManager, stateView, swapRouter, developer, vaultAddress, oracleAddress,
    rwiCreator, otherCreator, developerShare, compoundShare, targetCap,
  ] = await Promise.all([
    factory.RWI(), factory.WETH(), factory.USDG(), factory.PONS(), factory.UNISWAP_V4_POOL_MANAGER(),
    factory.UNISWAP_V4_STATE_VIEW(), factory.SWAP_ROUTER_02(), factory.developerWallet(),
    factory.liquidityVault(), factory.protectedOracle(), factory.RWI_CREATOR_FEE_BPS(),
    factory.OTHER_CREATOR_FEE_BPS(), factory.DEVELOPER_FEE_BPS(), factory.AUTO_COMPOUND_FEE_BPS(),
    factory.TARGET_MARKET_CAP_USD_E18(),
  ]);
  const checks = [
    [rwi, RWI_ADDRESS, "RWI"], [weth, MULTI_PAIR_FACTORY_CONFIG.wethAddress, "WETH"],
    [usdg, MULTI_PAIR_FACTORY_CONFIG.usdgAddress, "USDG"], [pons, PONS_ADDRESS, "PONS"],
    [poolManager, MULTI_PAIR_FACTORY_CONFIG.uniswapV4PoolManager, "PoolManager"],
    [stateView, MULTI_PAIR_FACTORY_CONFIG.uniswapV4StateView, "StateView"],
    [swapRouter, MULTI_PAIR_FACTORY_CONFIG.swapRouter02, "SwapRouter02"],
    [developer, DEVELOPER_WALLET, "developer wallet"],
  ];
  for (const [value, expectedValue, label] of checks) {
    if (!sameAddress(value, expectedValue)) throw new Error(`Multi-pair hook ${label} mismatch.`);
  }
  if (
    rwiCreator !== 9_750n || otherCreator !== 9_000n || developerShare !== 750n
      || compoundShare !== 250n || targetCap !== 10_000n * 10n ** 18n
  ) throw new Error("The multi-pair revenue or opening-value rules do not match this build.");
  const [vaultCode, oracleCode] = await Promise.all([provider.getCode(vaultAddress), provider.getCode(oracleAddress)]);
  if (vaultCode === "0x" || oracleCode === "0x") throw new Error("The permanent vault or protected oracle is missing.");
  const vault = new window.ethers.Contract(vaultAddress, [
    "function launchHook() view returns(address)",
    "function INITIAL_ACTIVE_TOKEN_BPS() view returns(uint16)",
    "function STAGED_TOKEN_BPS() view returns(uint16)",
    "function STAGED_POSITION_COUNT() view returns(uint8)",
    "function AUTO_COMPOUND_FEE_BPS() view returns(uint16)",
  ], provider);
  const [vaultHook, initialBps, stagedBps, stagedCount, vaultCompoundBps] = await Promise.all([
    vault.launchHook(), vault.INITIAL_ACTIVE_TOKEN_BPS(), vault.STAGED_TOKEN_BPS(),
    vault.STAGED_POSITION_COUNT(), vault.AUTO_COMPOUND_FEE_BPS(),
  ]);
  if (
    !sameAddress(vaultHook, address) || initialBps !== 500n || stagedBps !== 9_500n
      || stagedCount !== 16n || vaultCompoundBps !== 250n
  ) throw new Error("The permanent liquidity vault rules do not match this build.");
  return { runtimeCodeHash: window.ethers.keccak256(code), vaultAddress, oracleAddress };
}

async function validateConfiguredFeeFactory(provider, address) {
  const source = configuredFactorySource(address);
  if (!source) throw new Error("This token factory is not in the launchpad configuration.");
  if (isMultiPairMode(source) && source.current) return validateMultiPairFactoryDeployment(provider, address);
  if (isPonsMode(source) && source.current) return validatePonsFactoryDeployment(provider, address);
  if (isPonsMode(source)) {
    const code = await provider.getCode(address);
    if (code === "0x" || !source.runtimeCodeHash || window.ethers.keccak256(code).toLowerCase() !== String(source.runtimeCodeHash).toLowerCase()) {
      throw new Error("Legacy PONS factory bytecode does not match its verified configuration.");
    }
    return source.runtimeCodeHash;
  }
  if (isMultiQuoteMode(source) && source.current) return validateQuoteFactoryDeployment(provider, address);
  if (isMultiQuoteMode(source)) {
    const code = await provider.getCode(address);
    if (code === "0x" || !source.runtimeCodeHash || window.ethers.keccak256(code).toLowerCase() !== String(source.runtimeCodeHash).toLowerCase()) {
      throw new Error("Legacy ETH/USDG factory bytecode does not match its verified configuration.");
    }
    return source.runtimeCodeHash;
  }
  if (source.current && source.feeMode === INTERNAL_MATCH_FEE_MODE) return validateFactoryDeployment(provider, address);
  const network = await provider.getNetwork();
  if (network.chainId !== 4663n) throw new Error("Switch the wallet to Robinhood Chain.");
  const code = await provider.getCode(address);
  if (code === "0x" || !source.runtimeCodeHash || window.ethers.keccak256(code).toLowerCase() !== String(source.runtimeCodeHash).toLowerCase()) {
    throw new Error("Legacy factory bytecode does not match its verified configuration.");
  }
  return source.runtimeCodeHash;
}

function openFactoryDeploymentModal() {
  const modal = $(".launch-modal");
  modal.classList.add("is-factory-deploy");
  $("#modalToken").hidden = true;
  $("#modalDevBuy").hidden = true;
  $("#downloadBrief").hidden = true;
  $("#modalTitle").textContent = FACTORY_CONFIG.launchesPaused ? "Deploy the corrected v4 launch hook." : "Deploy the v4 launch hook.";
  $("#modalCopy").textContent = "Your wallet will submit two Robinhood Chain transactions: a small permissionless CREATE2 helper, then the corrected immutable v4 hook at an address with the required callback permission. No RWI is required.";
  $("#modalNote").textContent = "This hook passed internal tests but not an independent professional audit. Both mainnet transactions are irreversible; continue only if you accept that risk.";
  $("#modalWallet").textContent = state.account ? "Deploy v4 hook with wallet" : "Connect wallet to deploy";
  $("#modalWallet").dataset.action = "deploy-factory";
  $("#launchModal").hidden = false;
  syncModalScrollLock();
}

async function mineBrowserHookSalt(deployerAddress, creationCodeHash, onProgress) {
  const requiredFlags = (1n << 13n) | (1n << 7n) | (1n << 3n);
  const hookMask = (1n << 14n) - 1n;
  for (let candidate = 0n; candidate < 1_000_000n; candidate += 1n) {
    const salt = window.ethers.zeroPadValue(window.ethers.toBeHex(candidate), 32);
    const address = window.ethers.getCreate2Address(deployerAddress, salt, creationCodeHash);
    if ((BigInt(address) & hookMask) === requiredFlags) return { salt, address };
    if (candidate !== 0n && candidate % 10_000n === 0n) {
      onProgress?.(Number(candidate));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
  throw new Error("A valid Uniswap v4 hook address was not found in the bounded salt search.");
}

function restoreLaunchModal() {
  $(".launch-modal").classList.remove("is-factory-deploy");
  $("#modalToken").hidden = false;
  $("#modalDevBuy").hidden = false;
  $("#downloadBrief").hidden = false;
  $("#downloadBrief").textContent = state.imageFile ? "Download metadata kit" : "Download launch brief";
  delete $("#downloadBrief").dataset.action;
  $("#uniswapTradeButton").hidden = true;
  const selected = selectedQuoteAssets();
  $("#modalCopy").textContent = `One token launches into ${selected.length} permanently locked Uniswap pool${selected.length === 1 ? "" : "s"}: ${selected.map((quote) => `$${quote}`).join(", ")}. The fixed supply is divided across the selected pools, with 5% active and 95% released progressively.`;
  renderDevBuyPairOptions();
}

function openLaunchConfirmation() {
  restoreLaunchModal();
  state.lastLaunchTx = null;
  state.lastDevBuyRwiAmount = 0n;
  state.lastDevBuyUsdAmount = "0";
  state.lastDevBuyEthAmount = 0n;
  state.pendingDevBuyRwiAmount = 0n;
  fields.devBuy.value = "";
  fields.devBuy.removeAttribute("aria-invalid");
  $("#modalTitle").textContent = "Review your launch.";
  const quote = selectedDevBuyPair();
  $("#modalNote").textContent = `Enter an optional USD dev buy or leave it blank. The buy is funded with ETH and routed through the selected TOKEN / ${quote} pool; no quote-token balance is required.`;
  $("#modalWallet").textContent = "Launch Token";
  $("#modalWallet").dataset.action = "confirm-launch";
  $("#launchModal").hidden = false;
  updateBalanceState();
  updateDevBuyEstimate();
  syncModalScrollLock();
  requestAnimationFrame(() => fields.devBuy.focus({ preventScroll: true }));
}

async function deployFactoryWithWallet() {
  const button = $("#modalWallet");
  if (!FACTORY_CONFIG.allowBrowserDeployment) return toast("Browser factory deployment is available only from the local launchpad.");
  try {
    await ensureFactoryDeploymentBundle();
  } catch (error) {
    return toast(error?.message || "The v4 deployment bundle did not load. Refresh and try again.");
  }
  if (!window.ethers || !FACTORY_ABI.length || !FACTORY_DEPLOYMENT.bytecode || !HOOK_DEPLOYER_DEPLOYMENT.bytecode || !HOOK_DEPLOYER_DEPLOYMENT.abi?.length) {
    return toast("The v4 deployment bundle did not load. Refresh and try again.");
  }
  if (!state.account && !(await connectWallet())) return;

  state.factoryDeploymentInFlight = true;
  button.disabled = true;
  try {
    await ensureRobinhoodChain();
    const provider = new window.ethers.BrowserProvider(currentWalletProvider());
    const signer = await provider.getSigner();
    state.account = await signer.getAddress();
    renderAccount();

    button.textContent = "Confirm helper deployment…";
    $("#modalNote").textContent = "Transaction 1 of 2 deploys the permissionless CREATE2 helper used to derive the hook address.";
    const helperFactory = new window.ethers.ContractFactory(HOOK_DEPLOYER_DEPLOYMENT.abi, HOOK_DEPLOYER_DEPLOYMENT.bytecode, signer);
    const helper = await helperFactory.deploy();
    const helperTransaction = helper.deploymentTransaction();
    button.textContent = "Deploying CREATE2 helper…";
    $("#modalNote").textContent = `Transaction 1 submitted · ${helperTransaction.hash.slice(0, 10)}…`;
    await helper.waitForDeployment();
    const helperAddress = await helper.getAddress();

    button.textContent = "Finding valid v4 hook address…";
    $("#modalNote").textContent = "Mining the address permission bits locally. No wallet action is required for this step.";
    const creationCodeHash = window.ethers.keccak256(FACTORY_DEPLOYMENT.bytecode);
    const mined = await mineBrowserHookSalt(helperAddress, creationCodeHash, (candidate) => {
      $("#modalNote").textContent = `Checking CREATE2 salts locally · ${candidate.toLocaleString()} tested…`;
    });

    button.textContent = "Confirm v4 hook deployment…";
    $("#modalNote").textContent = `Transaction 2 of 2 deploys the immutable hook at ${mined.address}. Review the mainnet gas charge carefully.`;
    const helperWithSigner = new window.ethers.Contract(helperAddress, HOOK_DEPLOYER_DEPLOYMENT.abi, signer);
    const deploymentTransaction = await helperWithSigner.deploy(mined.salt, FACTORY_DEPLOYMENT.bytecode, { gasLimit: 12_000_000 });
    button.textContent = "Deploying v4 hook…";
    $("#modalNote").textContent = `Transaction 2 submitted · ${deploymentTransaction.hash.slice(0, 10)}…`;
    const deploymentReceipt = await deploymentTransaction.wait();
    const address = mined.address;
    await validateFactoryDeployment(provider, address);

    if (!FACTORY_CONFIG.factoryAddressStorageKey) throw new Error("Local factory storage is not configured.");
    localStorage.setItem(FACTORY_CONFIG.factoryAddressStorageKey, address);
    localStorage.setItem(FACTORY_LOCAL_BLOCK_KEY, String(deploymentReceipt.blockNumber));
    state.lastFactoryAddress = address;
    $("#modalTitle").textContent = "v4 hook deployed and validated.";
    $("#modalCopy").textContent = `${address} is now this browser's local launch hook. Its bytecode, address permission, immutable integrations, and launch rules match the compiled build.`;
    $("#modalNote").textContent = `CREATE2 helper ${helperAddress}. Source verification and canonical site configuration are still required before treating the hook as a public production deployment.`;
    $("#downloadBrief").hidden = false;
    $("#downloadBrief").textContent = "Copy factory address";
    $("#downloadBrief").dataset.action = "copy-factory";
    button.textContent = "Activate factory";
    button.dataset.action = "activate-factory";
    toast("v4 hook deployed and bytecode validated.");
  } catch (error) {
    const message = readableWalletError(error).replace(/^Launch reverted:/, "Deployment reverted:");
    $("#modalNote").textContent = message;
    button.textContent = "Try v4 hook deployment again";
    button.dataset.action = "deploy-factory";
    toast(message);
  } finally {
    state.factoryDeploymentInFlight = false;
    button.disabled = false;
  }
}

async function launchOnQuoteFactory() {
  const quoteSymbol = selectedQuoteAsset();
  const factoryAddress = quoteFactoryAddress();
  if (!factoryAddress || QUOTE_FACTORY_CONFIG.launchesPaused) {
    $("#modalNote").textContent = "The immutable ETH/USDG v4 hook must be deployed, source verified, and configured before this pair can launch.";
    toast("ETH and USDG launches are pending the new hook deployment.");
    return;
  }
  try {
    await ensureEthersLibrary();
  } catch (error) {
    toast(error?.message || "The wallet library did not load. Refresh and try again.");
    return;
  }
  if (!window.ethers || !QUOTE_FACTORY_ABI.length) {
    toast("The ETH/USDG launch integration did not load. Refresh and try again.");
    return;
  }
  if (!state.account && !(await connectWallet())) return;
  const firstFailure = validateForm();
  if (firstFailure) {
    closeModal();
    showValidation(firstFailure);
    return;
  }

  const ethers = window.ethers;
  const button = $("#modalWallet");
  delete button.dataset.action;
  state.launchInFlight = true;
  button.disabled = true;
  try {
    button.textContent = "Preparing launch…";
    await assertImageAllowed(state.imageFile, "token-logo");
    await ensureRobinhoodChain();
    const provider = new ethers.BrowserProvider(currentWalletProvider());
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    state.account = signerAddress;
    await validateQuoteFactoryDeployment(provider, factoryAddress);
    const launchFactory = new ethers.Contract(factoryAddress, QUOTE_FACTORY_ABI, signer);

    button.textContent = "Binding public logo to launch…";
    const launchMetadataAuthorization = await prepareLaunchMetadataAuthorization(signerAddress, factoryAddress);
    const devBuyUsdAmount = configuredDevBuyUsdAmount();
    const quoteAsset = quoteSymbol === "ETH" ? 0 : 1;
    let devBuyQuoteAmount = 0n;
    if (devBuyUsdAmount > 0n) {
      if (quoteSymbol === "ETH") {
        button.textContent = "Reading protected ETH price…";
        const ethUsdPrice = BigInt(await launchFactory.ethUsdPriceE18());
        devBuyQuoteAmount = (devBuyUsdAmount * 10n ** 18n + ethUsdPrice - 1n) / ethUsdPrice;
        const balance = BigInt(await provider.getBalance(signerAddress));
        if (balance <= devBuyQuoteAmount) throw new Error("This wallet does not have enough ETH for the dev buy and network gas.");
      } else {
        devBuyQuoteAmount = devBuyUsdAmount / 10n ** 12n;
        if (devBuyQuoteAmount === 0n) throw new Error("Enter at least $0.000001 for a USDG dev buy.");
      }
    }

    let params = {
      name: fields.name.value.trim(),
      symbol: cleanTicker(fields.ticker.value),
      quoteAsset,
      devBuyQuoteAmount,
      minimumDevBuyTokenOut: 0n,
    };
    button.textContent = "Checking protected launch price…";
    const zeroBuyParams = { ...params, devBuyQuoteAmount: 0n, minimumDevBuyTokenOut: 0n };
    const zeroBuyCalldata = launchFactory.interface.encodeFunctionData("launch", [zeroBuyParams]);
    await provider.call({
      from: signerAddress,
      to: factoryAddress,
      data: `${zeroBuyCalldata}${launchMetadataAuthorization.commitment.slice(2)}`,
      gasLimit: 28_000_000,
    });

    if (quoteSymbol === "USDG" && devBuyQuoteAmount > 0n) {
      const usdg = new ethers.Contract(QUOTE_FACTORY_CONFIG.usdgAddress, [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address,address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)",
      ], signer);
      const [balance, allowance] = await Promise.all([usdg.balanceOf(signerAddress), usdg.allowance(signerAddress, factoryAddress)]);
      if (BigInt(balance) < devBuyQuoteAmount) throw new Error("This wallet does not have enough USDG for the selected dev buy.");
      if (BigInt(allowance) < devBuyQuoteAmount) {
        button.textContent = "Approve USDG dev buy…";
        const approval = await usdg.approve(factoryAddress, devBuyQuoteAmount);
        await approval.wait();
      }
    }

    if (devBuyQuoteAmount > 0n) {
      button.textContent = "Simulating dev buy…";
      const quote = await launchFactory.launch.staticCall(params, {
        value: quoteSymbol === "ETH" ? devBuyQuoteAmount : 0n,
        gasLimit: 28_000_000,
      });
      const devBuyTokenAmount = BigInt(quote.devBuyTokenAmount);
      if (devBuyTokenAmount === 0n) throw new Error("The optional dev buy returned no tokens.");
      params = { ...params, minimumDevBuyTokenOut: devBuyTokenAmount * (10_000n - DEV_BUY_SLIPPAGE_BPS) / 10_000n };
    }

    button.textContent = "Confirm launch in wallet…";
    $("#modalNote").textContent = `$10,000 opening valuation · permanently locked TOKEN / ${quoteSymbol} pool · 90% creator ETH revenue · 10% developer ETH revenue.`;
    const calldata = launchFactory.interface.encodeFunctionData("launch", [params]);
    const transactionRequest = {
      to: factoryAddress,
      data: `${calldata}${launchMetadataAuthorization.commitment.slice(2)}`,
      value: quoteSymbol === "ETH" ? devBuyQuoteAmount : 0n,
    };
    button.textContent = "Preparing safe gas reserve…";
    const gasLimit = await safeLaunchGasLimit(provider, { ...transactionRequest, from: signerAddress });
    button.textContent = "Confirm launch in wallet…";
    const transaction = await signer.sendTransaction({ ...transactionRequest, gasLimit });
    state.lastDevBuyRwiAmount = 0n;
    state.lastDevBuyUsdAmount = formatUnits(devBuyUsdAmount, 18, 2);
    state.lastDevBuyEthAmount = quoteSymbol === "ETH" ? devBuyQuoteAmount : 0n;
    button.textContent = "Creating Uniswap v4 pool…";
    const receipt = await transaction.wait();
    let launchEvent = null;
    for (const log of receipt.logs) {
      try {
        const parsed = launchFactory.interface.parseLog(log);
        if (parsed?.name === "TokenLaunched") launchEvent = parsed;
      } catch {
        // Unrelated token and PoolManager logs are ignored.
      }
    }
    if (!launchEvent) throw new Error("The launch confirmed without a readable TokenLaunched event.");

    let liquidityVerificationWarning = null;
    try {
      button.textContent = "Verifying locked liquidity…";
      await verifyNewLaunchLiquidity(provider, launchFactory, launchEvent.args.token, launchEvent.args.poolId);
    } catch (error) {
      liquidityVerificationWarning = String(error?.message || "The live liquidity check could not be completed.").slice(0, 220);
    }

    state.lastLaunchTx = transaction.hash;
    state.lastTokenAddress = launchEvent.args.token;
    state.lastPoolAddress = null;
    state.lastPoolId = launchEvent.args.poolId;
    let publication = null;
    let publicationWarning = null;
    try {
      await persistLaunchedTokenAssets(state.lastTokenAddress, state.lastPoolId);
    } catch {
      saveLocalTokenMetadata(state.lastTokenAddress, state.lastPoolId, null);
    }
    try {
      button.textContent = "Publishing public logo…";
      publication = await publishLaunchedTokenAssets(signer, state.lastTokenAddress, state.lastPoolId, {
        factoryAddress,
        imageFile: launchMetadataAuthorization.imageFile,
        name: launchMetadataAuthorization.payload.name,
        symbol: launchMetadataAuthorization.payload.symbol,
        description: launchMetadataAuthorization.payload.description,
        links: launchMetadataAuthorization.payload.links,
        launchTxHash: transaction.hash,
        metadataCommitment: launchMetadataAuthorization.commitment,
      });
    } catch (error) {
      publicationWarning = String(error?.message || "The public logo could not be published.").slice(0, 220);
    }

    $("#modalTitle").textContent = "Your token is live.";
    $("#modalDevBuy").hidden = true;
    $("#modalCopy").textContent = publication
      ? `The TOKEN / ${quoteSymbol} pool and its creator-verified logo are live.`
      : `The TOKEN / ${quoteSymbol} pool is live.${publicationWarning ? ` Logo warning: ${publicationWarning}` : ""}`;
    $("#modalNote").textContent = `Token ${String(launchEvent.args.token).slice(0, 8)}… · liquidity locked forever · creator earns 90% in ETH · developer accrues 10% in ETH.${liquidityVerificationWarning ? ` Verification warning: ${liquidityVerificationWarning}` : ""}`;
    $("#uniswapTradeButton").hidden = false;
    toast(`Token launched in a locked ${quoteSymbol} pool.`);
    await completeSuccessfulLaunch(state.lastTokenAddress);
    return;
  } catch (error) {
    const message = readableWalletError(error);
    $("#modalNote").textContent = message;
    if (!state.lastLaunchTx) {
      button.dataset.action = "confirm-launch";
      button.textContent = "Launch Token";
    }
    toast(message);
  } finally {
    state.launchInFlight = false;
    button.disabled = false;
    renderAccount();
  }
}

async function launchOnPonsFactory() {
  const factoryAddress = ponsFactoryAddress();
  if (!factoryAddress || PONS_FACTORY_CONFIG.launchesPaused) {
    $("#modalNote").textContent = "The immutable PONS v4 hook must be deployed, source verified, and configured before this pair can launch.";
    toast("PONS launches are pending the new hook deployment.");
    return;
  }
  try {
    await ensureEthersLibrary();
  } catch (error) {
    toast(error?.message || "The wallet library did not load. Refresh and try again.");
    return;
  }
  if (!window.ethers || !PONS_FACTORY_ABI.length) return toast("The PONS launch integration did not load. Refresh and try again.");
  if (!state.account && !(await connectWallet())) return;
  const firstFailure = validateForm();
  if (firstFailure) {
    closeModal();
    showValidation(firstFailure);
    return;
  }

  const ethers = window.ethers;
  const button = $("#modalWallet");
  delete button.dataset.action;
  state.launchInFlight = true;
  button.disabled = true;
  try {
    button.textContent = "Preparing PONS launch…";
    await assertImageAllowed(state.imageFile, "token-logo");
    await ensureRobinhoodChain();
    const provider = new ethers.BrowserProvider(currentWalletProvider());
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    state.account = signerAddress;
    await validatePonsFactoryDeployment(provider, factoryAddress);
    const launchFactory = new ethers.Contract(factoryAddress, PONS_FACTORY_ABI, signer);

    button.textContent = "Binding public logo to launch…";
    const launchMetadataAuthorization = await prepareLaunchMetadataAuthorization(signerAddress, factoryAddress);
    const devBuyUsdAmount = configuredDevBuyUsdAmount();
    let devBuyPonsAmount = 0n;
    if (devBuyUsdAmount > 0n) {
      button.textContent = "Reading protected PONS price…";
      const [ethUsdRaw, wethPerPons] = await Promise.all([
        launchFactory.ethUsdPriceE18(),
        readDiscoverV3Quote(PONS_FACTORY_CONFIG.ponsWethOraclePool, PONS_ADDRESS, provider),
      ]);
      const ponsUsd = Number(ethers.formatUnits(ethUsdRaw, 18)) * wethPerPons;
      const usdValue = Number(ethers.formatUnits(devBuyUsdAmount, 18));
      if (!Number.isFinite(ponsUsd) || ponsUsd <= 0) throw new Error("The protected PONS price is unavailable.");
      devBuyPonsAmount = ethers.parseUnits((usdValue / ponsUsd).toFixed(18), 18);
      if (devBuyPonsAmount === 0n) throw new Error("The optional PONS dev buy is too small.");
    }

    let params = {
      name: fields.name.value.trim(),
      symbol: cleanTicker(fields.ticker.value),
      devBuyRwiAmount: devBuyPonsAmount,
      minimumDevBuyTokenOut: 0n,
    };
    button.textContent = "Checking protected launch price…";
    const zeroBuyCalldata = launchFactory.interface.encodeFunctionData("launch", [{ ...params, devBuyRwiAmount: 0n }]);
    await provider.call({
      from: signerAddress,
      to: factoryAddress,
      data: `${zeroBuyCalldata}${launchMetadataAuthorization.commitment.slice(2)}`,
      gasLimit: 28_000_000,
    });

    if (devBuyPonsAmount > 0n) {
      const pons = new ethers.Contract(PONS_ADDRESS, [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address,address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)",
      ], signer);
      const [balance, allowance] = await Promise.all([pons.balanceOf(signerAddress), pons.allowance(signerAddress, factoryAddress)]);
      if (BigInt(balance) < devBuyPonsAmount) throw new Error("This wallet does not have enough PONS for the selected dev buy. Leave it blank to launch without one.");
      if (BigInt(allowance) < devBuyPonsAmount) {
        button.textContent = "Approve PONS dev buy…";
        await (await pons.approve(factoryAddress, devBuyPonsAmount)).wait();
      }
      button.textContent = "Simulating PONS dev buy…";
      const quote = await launchFactory.launch.staticCall(params, { gasLimit: 28_000_000 });
      const tokenOut = BigInt(quote.devBuyTokenAmount);
      if (tokenOut === 0n) throw new Error("The optional PONS dev buy returned no tokens.");
      params = { ...params, minimumDevBuyTokenOut: tokenOut * (10_000n - DEV_BUY_SLIPPAGE_BPS) / 10_000n };
    }

    button.textContent = "Confirm launch in wallet…";
    $("#modalNote").textContent = "$10,000 opening valuation · permanently locked TOKEN / PONS pool · 90% creator ETH revenue · 10% developer ETH revenue.";
    const calldata = launchFactory.interface.encodeFunctionData("launch", [params]);
    const transactionRequest = { to: factoryAddress, data: `${calldata}${launchMetadataAuthorization.commitment.slice(2)}` };
    const gasLimit = await safeLaunchGasLimit(provider, { ...transactionRequest, from: signerAddress });
    const transaction = await signer.sendTransaction({ ...transactionRequest, gasLimit });
    button.textContent = "Creating PONS pool…";
    const receipt = await transaction.wait();
    let launchEvent = null;
    for (const log of receipt.logs) {
      try {
        const parsed = launchFactory.interface.parseLog(log);
        if (parsed?.name === "TokenLaunched") launchEvent = parsed;
      } catch {}
    }
    if (!launchEvent) throw new Error("The launch confirmed without a readable TokenLaunched event.");

    let liquidityVerificationWarning = null;
    try {
      await verifyNewLaunchLiquidity(provider, launchFactory, launchEvent.args.token, launchEvent.args.poolId);
    } catch (error) {
      liquidityVerificationWarning = String(error?.message || "The live liquidity check could not be completed.").slice(0, 220);
    }
    state.lastLaunchTx = transaction.hash;
    state.lastTokenAddress = launchEvent.args.token;
    state.lastPoolAddress = null;
    state.lastPoolId = launchEvent.args.poolId;
    let publication = null;
    let publicationWarning = null;
    try {
      await persistLaunchedTokenAssets(state.lastTokenAddress, state.lastPoolId);
    } catch {
      saveLocalTokenMetadata(state.lastTokenAddress, state.lastPoolId, null);
    }
    try {
      button.textContent = "Publishing public logo…";
      publication = await publishLaunchedTokenAssets(signer, state.lastTokenAddress, state.lastPoolId, {
        factoryAddress,
        imageFile: launchMetadataAuthorization.imageFile,
        name: launchMetadataAuthorization.payload.name,
        symbol: launchMetadataAuthorization.payload.symbol,
        description: launchMetadataAuthorization.payload.description,
        links: launchMetadataAuthorization.payload.links,
        launchTxHash: transaction.hash,
        metadataCommitment: launchMetadataAuthorization.commitment,
      });
    } catch (error) {
      publicationWarning = String(error?.message || "The public logo could not be published.").slice(0, 220);
    }
    $("#modalTitle").textContent = "Your token is live.";
    $("#modalDevBuy").hidden = true;
    $("#modalCopy").textContent = publication
      ? "The TOKEN / PONS pool and its creator-verified logo are live."
      : `The TOKEN / PONS pool is live.${publicationWarning ? ` Logo warning: ${publicationWarning}` : ""}`;
    $("#modalNote").textContent = `Liquidity locked forever · creator earns 90% in ETH · developer accrues 10% in ETH.${liquidityVerificationWarning ? ` Verification warning: ${liquidityVerificationWarning}` : ""}`;
    $("#uniswapTradeButton").hidden = false;
    toast("Token launched in a locked PONS pool.");
    await completeSuccessfulLaunch(state.lastTokenAddress);
  } catch (error) {
    const message = readableWalletError(error);
    $("#modalNote").textContent = message;
    if (!state.lastLaunchTx) {
      button.dataset.action = "confirm-launch";
      button.textContent = "Launch Token";
    }
    toast(message);
  } finally {
    state.launchInFlight = false;
    button.disabled = false;
    renderAccount();
  }
}

function selectedPairMask() {
  const bits = { RWI: 1, ETH: 2, USDG: 4, PONS: 8 };
  return selectedQuoteAssets().reduce((mask, quote) => mask | bits[quote], 0);
}

async function quoteDevBuyAssetFromEth(provider, quote, ethAmount) {
  if (ethAmount === 0n || quote === "ETH") return ethAmount;
  const quoteAddress = quote === "RWI"
    ? RWI_ADDRESS
    : quote === "USDG"
      ? MULTI_PAIR_FACTORY_CONFIG.usdgAddress
      : PONS_ADDRESS;
  const fee = quote === "USDG" ? 100 : 10_000;
  const path = window.ethers.solidityPacked(
    ["address", "uint24", "address"],
    [MULTI_PAIR_FACTORY_CONFIG.wethAddress, fee, quoteAddress],
  );
  const quoter = new window.ethers.Contract(V3_QUOTER, [
    "function quoteExactInput(bytes path,uint256 amountIn) returns (uint256 amountOut,uint160[] sqrtPriceX96AfterList,uint32[] initializedTicksCrossedList,uint256 gasEstimate)",
  ], provider);
  const result = await quoter.quoteExactInput.staticCall(path, ethAmount);
  return BigInt(result.amountOut ?? result[0]);
}

async function verifyLockedMultiPairLaunch(provider, factory, tokenAddress, launchEvents) {
  const vaultAddress = await factory.liquidityVault();
  if (!isAddress(vaultAddress) || await provider.getCode(vaultAddress) === "0x") {
    throw new Error("The permanent-liquidity vault is unavailable.");
  }
  const vault = new window.ethers.Contract(vaultAddress, [
    "function lockedPools(bytes32 poolId) view returns(address token,int24 openingTick,bool tokenIs0,bool seeded,uint128 launchLiquidity,uint128 compoundedLiquidity,uint256 tokenAllocation)",
  ], provider);
  const stateView = new window.ethers.Contract(MULTI_PAIR_FACTORY_CONFIG.uniswapV4StateView, [
    "function getSlot0(bytes32 poolId) view returns(uint160 sqrtPriceX96,int24 tick,uint24 protocolFee,uint24 lpFee)",
  ], provider);
  const checks = await Promise.all(launchEvents.map(async (event) => {
    const poolId = event.args.poolId;
    const [locked, slot0] = await Promise.all([
      vault.lockedPools(poolId),
      stateView.getSlot0(poolId),
    ]);
    return {
      event,
      locked,
      sqrtPriceX96: BigInt(slot0.sqrtPriceX96 ?? slot0[0]),
    };
  }));
  const invalid = checks.some(({ event, locked, sqrtPriceX96 }) => (
    !Boolean(event.args.liquidityPermanentlyLocked)
    || BigInt(event.args.liquidity) === 0n
    || BigInt(event.args.tokenAmount) === 0n
    || !Boolean(locked.seeded)
    || !sameAddress(locked.token, tokenAddress)
    || BigInt(locked.launchLiquidity) !== BigInt(event.args.liquidity)
    || BigInt(locked.tokenAllocation) !== BigInt(event.args.tokenAmount)
    || sqrtPriceX96 === 0n
  ));
  if (invalid) throw new Error("A selected pool did not pass the permanent-liquidity check.");
  return true;
}

async function launchOnMultiPairFactory() {
  const factoryAddress = multiPairFactoryAddress();
  if (!factoryAddress || MULTI_PAIR_FACTORY_CONFIG.launchesPaused) {
    const reason = MULTI_PAIR_FACTORY_CONFIG.launchesPausedReason
      || "The atomic multi-pair hook must be deployed and runtime-verified before launches are enabled.";
    $("#modalNote").textContent = reason;
    toast("Multi-pair launches are pending the reviewed hook deployment.");
    return;
  }
  if (!MULTI_PAIR_FACTORY_ABI.length) return toast("The multi-pair launch integration did not load. Refresh and try again.");
  if (!state.account && !(await connectWallet())) return;
  const firstFailure = validateForm();
  if (firstFailure) {
    closeModal();
    showValidation(firstFailure);
    return;
  }

  const button = $("#modalWallet");
  delete button.dataset.action;
  state.launchInFlight = true;
  button.disabled = true;
  try {
    await ensureRobinhoodChain();
    const provider = new window.ethers.BrowserProvider(currentWalletProvider());
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    state.account = signerAddress;
    button.textContent = "Validating multi-pair hook…";
    const validation = await validateMultiPairFactoryDeployment(provider, factoryAddress);
    const factory = new window.ethers.Contract(factoryAddress, MULTI_PAIR_FACTORY_ABI, signer);
    button.textContent = "Binding public logo to launch…";
    await assertImageAllowed(state.imageFile, "token-logo");
    const metadataAuthorization = await prepareLaunchMetadataAuthorization(signerAddress, factoryAddress);
    const selected = selectedQuoteAssets();
    const devBuyPair = selectedDevBuyPair();
    const quoteIndexes = { RWI: 0, ETH: 1, USDG: 2, PONS: 3 };
    const devBuyUsdAmount = configuredDevBuyUsdAmount();
    let devBuyEthAmount = 0n;
    let minimumDevBuyQuoteOut = 0n;
    const latestBlock = await provider.getBlock("latest");
    const deadline = BigInt(Number(latestBlock.timestamp) + DEV_BUY_DEADLINE_SECONDS);
    if (devBuyUsdAmount > 0n) {
      button.textContent = "Reading protected ETH price…";
      const oracle = new window.ethers.Contract(validation.oracleAddress, [
        "function ethUsdPriceE18() view returns(uint256)",
      ], provider);
      const ethUsdPrice = BigInt(await oracle.ethUsdPriceE18());
      devBuyEthAmount = (devBuyUsdAmount * 10n ** 18n + ethUsdPrice - 1n) / ethUsdPrice;
      if (BigInt(await provider.getBalance(signerAddress)) <= devBuyEthAmount) {
        throw new Error("This wallet does not have enough ETH for the dev buy and network gas.");
      }
      button.textContent = `Quoting ETH → ${devBuyPair}…`;
      const expectedQuoteOut = await quoteDevBuyAssetFromEth(provider, devBuyPair, devBuyEthAmount);
      if (expectedQuoteOut === 0n) throw new Error(`The ETH to ${devBuyPair} dev-buy route returned no quote.`);
      minimumDevBuyQuoteOut = expectedQuoteOut * (10_000n - DEV_BUY_SLIPPAGE_BPS) / 10_000n;
    }
    let params = {
      name: fields.name.value.trim(),
      symbol: cleanTicker(fields.ticker.value),
      pairMask: selectedPairMask(),
      devBuyPair: quoteIndexes[devBuyPair],
      devBuyEthAmount,
      minimumDevBuyQuoteOut,
      minimumDevBuyTokenOut: 0n,
      deadline,
    };
    button.textContent = "Simulating every selected pool…";
    const simulated = await factory.launch.staticCall(params, {
      value: devBuyEthAmount,
      gasLimit: 45_000_000,
    });
    const simulatedDevBuy = BigInt(simulated.devBuyTokenAmount ?? simulated[1]);
    if (devBuyEthAmount > 0n && simulatedDevBuy === 0n) throw new Error("The optional dev buy returned no tokens.");
    if (simulatedDevBuy > 0n) {
      params = {
        ...params,
        minimumDevBuyTokenOut: simulatedDevBuy * (10_000n - DEV_BUY_SLIPPAGE_BPS) / 10_000n,
      };
    }

    const launchCalldata = factory.interface.encodeFunctionData("launch", [params]);
    const transactionRequest = {
      to: factoryAddress,
      data: `${launchCalldata}${metadataAuthorization.commitment.slice(2)}`,
      value: devBuyEthAmount,
    };
    button.textContent = "Preparing atomic launch…";
    let gasLimit;
    try {
      gasLimit = bufferedLaunchGasLimit(await provider.estimateGas({ ...transactionRequest, from: signerAddress }));
    } catch {
      gasLimit = 12_000_000n + BigInt(selected.length) * 4_000_000n;
    }
    const practicalFloor = 8_000_000n + BigInt(selected.length) * 3_500_000n;
    if (gasLimit < practicalFloor) gasLimit = practicalFloor;
    button.textContent = "Confirm launch in wallet…";
    $("#modalNote").textContent = `${selected.length} selected pool${selected.length === 1 ? "" : "s"} will initialize atomically. If any pool fails, the complete transaction reverts.`;
    const transaction = await signer.sendTransaction({ ...transactionRequest, gasLimit });
    state.lastDevBuyUsdAmount = formatUnits(devBuyUsdAmount, 18, 2);
    state.lastDevBuyEthAmount = devBuyEthAmount;
    button.textContent = `Locking ${selected.length} pool${selected.length === 1 ? "" : "s"}…`;
    const receipt = await transaction.wait();
    const launchEvents = [];
    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed?.name === "TokenLaunched") launchEvents.push(parsed);
      } catch {
        // Token, oracle, vault, and PoolManager logs are intentionally ignored.
      }
    }
    if (launchEvents.length !== selected.length) throw new Error("The launch confirmed without every selected pool event.");
    const tokenAddress = launchEvents[0].args.token;
    if (!launchEvents.every((event) => sameAddress(event.args.token, tokenAddress))) {
      throw new Error("The selected pools did not resolve to one token.");
    }
    state.lastLaunchTx = transaction.hash;
    state.lastTokenAddress = tokenAddress;
    state.lastPoolAddress = null;
    state.lastPoolId = launchEvents[0].args.poolId;
    let liquidityVerificationWarning = null;
    try {
      button.textContent = "Verifying permanent liquidityâ€¦";
      await verifyLockedMultiPairLaunch(provider, factory, tokenAddress, launchEvents);
    } catch (error) {
      liquidityVerificationWarning = String(error?.message || "The live liquidity check could not be completed.").slice(0, 180);
    }
    try {
      await persistLaunchedTokenAssets(tokenAddress, state.lastPoolId);
    } catch {
      saveLocalTokenMetadata(tokenAddress, state.lastPoolId, null);
    }
    let publicationWarning = null;
    try {
      button.textContent = "Publishing public logo…";
      await publishLaunchedTokenAssets(signer, tokenAddress, state.lastPoolId, {
        factoryAddress,
        imageFile: metadataAuthorization.imageFile,
        name: metadataAuthorization.payload.name,
        symbol: metadataAuthorization.payload.symbol,
        description: metadataAuthorization.payload.description,
        links: metadataAuthorization.payload.links,
        launchTxHash: transaction.hash,
        metadataCommitment: metadataAuthorization.commitment,
      });
    } catch (error) {
      publicationWarning = String(error?.message || "The public logo could not be published.").slice(0, 180);
    }
    $("#modalTitle").textContent = "Your token is live.";
    $("#modalDevBuy").hidden = true;
    $("#modalCopy").textContent = `One token is live across ${selected.map((quote) => `$${quote}`).join(", ")}. Use its token page to switch between pool charts and routes.`;
    $("#modalNote").textContent = `5% opening inventory · 95% progressively locked through approximately $1M · 2.5% of pool revenue auto-compounds forever.${liquidityVerificationWarning ? ` Verification warning: ${liquidityVerificationWarning}` : ""}${publicationWarning ? ` Logo warning: ${publicationWarning}` : ""}`;
    $("#uniswapTradeButton").hidden = false;
    toast(`Token launched with ${selected.length} locked pool${selected.length === 1 ? "" : "s"}.`);
    await completeSuccessfulLaunch(tokenAddress);
  } catch (error) {
    const message = readableWalletError(error);
    $("#modalNote").textContent = message;
    if (!state.lastLaunchTx) {
      button.dataset.action = "confirm-launch";
      button.textContent = "Launch Token";
    }
    toast(message);
  } finally {
    state.launchInFlight = false;
    button.disabled = false;
    renderAccount();
  }
}

async function launchOnUniswap() {
  if (multiPairFactoryAddress() || selectedQuoteAssets().length > 1) return launchOnMultiPairFactory();
  if (selectedQuoteAsset() === "PONS") return launchOnPonsFactory();
  if (selectedQuoteAsset() !== "RWI") return launchOnQuoteFactory();
  const factoryAddress = configuredFactoryAddress();
  if (!factoryAddress) {
    if (FACTORY_CONFIG.allowBrowserDeployment) openFactoryDeploymentModal();
    toast("The $10,000 dual-TWAP v4 hook is pending deployment and source verification.");
    return;
  }
  if (effectiveLaunchesPaused()) {
    const reason = FACTORY_CONFIG.launchesPausedReason
      || "New launches are temporarily paused while the corrected immutable hook is deployed.";
    $("#modalWallet").textContent = "Close";
    $("#modalWallet").dataset.action = "close";
    $("#modalNote").textContent = reason;
    toast("New launches are paused; existing token markets remain available.");
    return;
  }
  try {
    await ensureEthersLibrary();
  } catch (error) {
    toast(error?.message || "The wallet library did not load. Refresh and try again.");
    return;
  }
  if (!window.ethers || !FACTORY_ABI.length) {
    $("#modalWallet").textContent = "Close";
    $("#modalWallet").dataset.action = "close";
    toast("The wallet integration did not load. Refresh this page and try again.");
    return;
  }
  if (Number(FACTORY_CONFIG.chainId) !== 4663 || String(FACTORY_CONFIG.rwiAddress).toLowerCase() !== RWI_ADDRESS.toLowerCase()) {
    $("#modalWallet").textContent = "Close";
    $("#modalWallet").dataset.action = "close";
    toast("Factory configuration does not match Robinhood Chain and $RWI.");
    return;
  }
  if (!state.account && !(await connectWallet())) return;

  const firstFailure = validateForm();
  if (firstFailure) {
    closeModal();
    showValidation(firstFailure);
    return;
  }

  const ethers = window.ethers;
  const button = $("#modalWallet");
  delete button.dataset.action;
  state.launchInFlight = true;
  button.disabled = true;
  try {
    button.textContent = "Preparing launch…";
    await assertImageAllowed(state.imageFile, "token-logo");
    await ensureRobinhoodChain();
    const provider = new ethers.BrowserProvider(currentWalletProvider());
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    state.account = signerAddress;
    await validateFactoryDeployment(provider, factoryAddress);

    const launchFactory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
    button.textContent = "Binding public logo to launch…";
    $("#modalNote").textContent = "Preparing one transaction that authorizes both the token launch and its public logo. No second signature will be needed.";
    const launchMetadataAuthorization = await prepareLaunchMetadataAuthorization(signerAddress);
    const devBuyUsdAmount = configuredDevBuyUsdAmount();
    let devBuyRwiAmount = 0n;
    let quotedDevBuyEthAmount = 0n;
    let maximumDevBuyEthAmount = 0n;
    if (devBuyUsdAmount > 0n) {
      button.textContent = "Quoting ETH dev buy…";
      $("#modalNote").textContent = "Calculating the ETH → RWI route for the selected USD value.";
      state.discoverRwiUsdPrice = null;
      const rwiUsdPrice = await readDiscoverRwiUsdPrice(provider);
      devBuyRwiAmount = rwiAmountForUsd(devBuyUsdAmount, rwiUsdPrice);
      quotedDevBuyEthAmount = await quoteEthForExactRwi(provider, devBuyRwiAmount);
      maximumDevBuyEthAmount = maximumDevBuyEthInput(quotedDevBuyEthAmount);
    }
    let params = {
      name: fields.name.value.trim(),
      symbol: cleanTicker(fields.ticker.value),
      devBuyRwiAmount,
      minimumDevBuyTokenOut: 0n,
    };

    button.textContent = "Reading onchain prices…";
    $("#modalNote").textContent = "Checking protected 30-minute RWI/WETH and WETH/USDG prices before opening your wallet. No oracle account or credentials are required.";
    await launchFactory.ORACLE_TWAP_WINDOW();
    const zeroBuyPreflightParams = { ...params, devBuyRwiAmount: 0n, minimumDevBuyTokenOut: 0n };
    const zeroBuyPreflightCalldata = launchFactory.interface.encodeFunctionData("launch", [zeroBuyPreflightParams]);
    await provider.call({
      from: signerAddress,
      to: factoryAddress,
      data: `${zeroBuyPreflightCalldata}${launchMetadataAuthorization.commitment.slice(2)}`,
      gasLimit: 25_000_000,
    });
    let devBuyTokenQuote = 0n;
    if (devBuyRwiAmount > 0n) {
      const rwiToken = new ethers.Contract(RWI_ADDRESS, [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address,address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)",
      ], signer);
      const existingRwiBalance = BigInt(await rwiToken.balanceOf(signerAddress));
      const canReusePendingPurchase = state.pendingDevBuyRwiAmount === devBuyRwiAmount && existingRwiBalance >= devBuyRwiAmount;
      if (!canReusePendingPurchase) {
        const ethBalance = await provider.getBalance(signerAddress);
        if (ethBalance <= maximumDevBuyEthAmount) throw new Error("This wallet does not have enough ETH for the selected dev buy and network gas.");
        const deadline = BigInt(Math.floor(Date.now() / 1000) + DEV_BUY_DEADLINE_SECONDS);
        const ethToRwiPurchase = encodeEthToRwiPurchase(devBuyRwiAmount, maximumDevBuyEthAmount, deadline);
        button.textContent = "Buy dev-buy RWI with ETH…";
        $("#modalNote").textContent = `Confirm up to ${formatUnits(maximumDevBuyEthAmount, 18, 8)} ETH for the $${formatUnits(devBuyUsdAmount, 18, 2)} dev buy. Unused ETH is refunded by the Uniswap router.`;
        const rwiPurchase = await signer.sendTransaction({
          to: LIQUIDITY_MODEL.uniswapV4UniversalRouter,
          data: ethToRwiPurchase.data,
          value: ethToRwiPurchase.nativeValue,
        });
        button.textContent = "Confirming ETH → RWI…";
        await rwiPurchase.wait();
        state.pendingDevBuyRwiAmount = devBuyRwiAmount;
      }

      const [rwiBalance, allowance] = await Promise.all([
        rwiToken.balanceOf(signerAddress),
        rwiToken.allowance(signerAddress, factoryAddress),
      ]);
      if (BigInt(rwiBalance) < devBuyRwiAmount) throw new Error("The ETH → RWI purchase did not provide the required dev-buy amount.");
      if (BigInt(allowance) < devBuyRwiAmount) {
        button.textContent = "Approve dev-buy RWI…";
        $("#modalNote").textContent = `The ETH swap delivered ${formatUnits(devBuyRwiAmount, 18, 6)} RWI. Approve that exact amount for the launch transaction.`;
        const approval = await rwiToken.approve(factoryAddress, devBuyRwiAmount);
        button.textContent = "Confirming RWI approval…";
        await approval.wait();
      }
      button.textContent = "Quoting dev buy…";
      $("#modalNote").textContent = "Simulating the complete launch and first v4 purchase before requesting the launch transaction.";
      const quote = await launchFactory.launch.staticCall(params, { gasLimit: 25_000_000 });
      devBuyTokenQuote = BigInt(quote.devBuyTokenAmount);
      if (devBuyTokenQuote === 0n) throw new Error("The optional dev buy returned no tokens.");
      params = {
        ...params,
        minimumDevBuyTokenOut: devBuyTokenQuote * (10_000n - DEV_BUY_SLIPPAGE_BPS) / 10_000n,
      };
    }
    button.textContent = "Confirm launch in wallet…";
    $("#modalNote").textContent = FACTORY_CONFIG.independentAuditComplete
      ? (devBuyRwiAmount > 0n
        ? `$10,000 opening valuation · ETH funded ${formatUnits(devBuyRwiAmount, 18, 6)} RWI, then the launch buys at least ${formatUnits(params.minimumDevBuyTokenOut, 18, 6)} tokens.`
        : "$10,000 dual-TWAP launch · Deploy the token, seed token-only v4 liquidity, and lock it forever. No RWI is required.")
      : (devBuyRwiAmount > 0n
        ? `ETH has funded the $${formatUnits(devBuyUsdAmount, 18, 2)} dev buy. Source verified · internal review only; confirm the immutable launch transaction if you accept that risk.`
        : "Source verified · Internal security review only; no independent audit. Confirm the immutable launch transaction only if you accept that risk.");
    const launchCalldata = launchFactory.interface.encodeFunctionData("launch", [params]);
    const authorizedLaunchCalldata = `${launchCalldata}${launchMetadataAuthorization.commitment.slice(2)}`;
    const transactionRequest = {
      to: factoryAddress,
      data: authorizedLaunchCalldata,
    };
    button.textContent = "Preparing safe gas reserve…";
    const gasLimit = await safeLaunchGasLimit(provider, { ...transactionRequest, from: signerAddress });
    button.textContent = "Confirm launch in wallet…";
    const transaction = await signer.sendTransaction({ ...transactionRequest, gasLimit });
    state.lastDevBuyRwiAmount = devBuyRwiAmount;
    state.lastDevBuyUsdAmount = formatUnits(devBuyUsdAmount, 18, 2);
    state.lastDevBuyEthAmount = quotedDevBuyEthAmount;
    button.textContent = "Creating Uniswap v4 pool…";
    $("#modalNote").textContent = `Transaction submitted · ${transaction.hash.slice(0, 10)}…`;
    const receipt = await transaction.wait();
    state.pendingDevBuyRwiAmount = 0n;

    let launchEvent = null;
    for (const log of receipt.logs) {
      try {
        const parsed = launchFactory.interface.parseLog(log);
        if (parsed?.name === "TokenLaunched") launchEvent = parsed;
      } catch {
        // Logs from the token and Uniswap pool are intentionally ignored.
      }
    }

    let liquidityVerification = null;
    let liquidityVerificationWarning = null;
    if (launchEvent?.args.token && launchEvent?.args.poolId) {
      try {
        button.textContent = "Verifying locked liquidity…";
        $("#modalNote").textContent = "Checking the live Uniswap position, active liquidity, price range, and permanent lock record onchain.";
        liquidityVerification = await verifyNewLaunchLiquidity(
          provider,
          launchFactory,
          launchEvent.args.token,
          launchEvent.args.poolId,
        );
      } catch (liquidityError) {
        liquidityVerificationWarning = String(liquidityError?.message || "The live liquidity check could not be completed.").slice(0, 220);
      }
    }

    state.lastLaunchTx = transaction.hash;
    state.lastTokenAddress = launchEvent?.args.token || null;
    state.lastPoolAddress = null;
    state.lastPoolId = launchEvent?.args.poolId || null;
    let assetPersistenceWarning = null;
    let publicMetadataWarning = null;
    let publicMetadataPublication = null;
    if (state.lastTokenAddress) {
      try {
        await persistLaunchedTokenAssets(state.lastTokenAddress, state.lastPoolId);
      } catch (assetError) {
        saveLocalTokenMetadata(state.lastTokenAddress, state.lastPoolId, null);
        assetPersistenceWarning = assetError?.message || "The logo could not be verified in browser storage.";
      }
      if (state.lastPoolId) {
        try {
          button.textContent = "Publishing public logo…";
          $("#modalNote").textContent = "The signed launch transaction already authorized this logo. Publishing it for every visitor now.";
          publicMetadataPublication = await publishLaunchedTokenAssets(signer, state.lastTokenAddress, state.lastPoolId, {
            imageFile: launchMetadataAuthorization.imageFile,
            name: launchMetadataAuthorization.payload.name,
            symbol: launchMetadataAuthorization.payload.symbol,
            description: launchMetadataAuthorization.payload.description,
            links: launchMetadataAuthorization.payload.links,
            launchTxHash: transaction.hash,
            metadataCommitment: launchMetadataAuthorization.commitment,
          });
        } catch (metadataError) {
          publicMetadataWarning = metadataError?.code === 4001 || metadataError?.code === "ACTION_REJECTED"
            ? "The public-logo signature was cancelled."
            : String(metadataError?.message || "The public logo could not be published.").slice(0, 220);
        }
      }
    }
    $("#modalTitle").textContent = "Your token is live.";
    $("#modalDevBuy").hidden = true;
    const publicationWarning = publicMetadataPublication ? null : (publicMetadataWarning || assetPersistenceWarning);
    const liquidityCopy = liquidityVerification
      ? " The live position matches the launch record and is active inside its locked range."
      : liquidityVerificationWarning
        ? ` Liquidity verification warning: ${liquidityVerificationWarning}`
        : "";
    $("#modalCopy").textContent = (publicMetadataPublication
      ? "The v4 pool opened at the factory-enforced, tick-rounded $10,000 valuation, and the creator-verified 512×512 logo is now publicly hosted for every launchpad visitor."
      : publicationWarning
        ? `The token and v4 pool are live. ${publicationWarning} Download the publish-ready kit as a backup.`
        : "The token and v4 pool are live. Download the publish-ready metadata kit as a backup.") + liquidityCopy;
    $("#modalNote").textContent = launchEvent
      ? (BigInt(launchEvent.args.initialRwiAmount) > 0n
        ? `Token ${launchEvent.args.token.slice(0, 8)}… launched with a $${state.lastDevBuyUsdAmount} dev buy funded from approximately ${formatUnits(state.lastDevBuyEthAmount, 18, 8)} ETH (${formatUnits(BigInt(launchEvent.args.initialRwiAmount), 18, 6)} RWI). The LP is locked forever${liquidityVerification ? ", its live position was verified," : ""} and the pool already has real swap activity.`
        : `Token ${launchEvent.args.token.slice(0, 8)}… paired with $RWI in v4 pool ${launchEvent.args.poolId.slice(0, 10)}…. Liquidity is locked forever. One real swap is required before market indexers can report price and volume.`)
      : "Launch confirmed. The TOKEN / $RWI pool is live, its LP is locked forever, and there is no graduation step.";
    if (state.lastTokenAddress) $("#uniswapTradeButton").hidden = false;
    toast(publicMetadataPublication
      ? "Token launched and its public logo was verified."
      : "Token launched directly into $RWI liquidity on Uniswap.");
    if (state.lastTokenAddress) {
      await completeSuccessfulLaunch(state.lastTokenAddress);
      return;
    }
    await readEthBalance();
    loadRecentLaunches();
  } catch (error) {
    const message = readableWalletError(error);
    $("#modalNote").textContent = message;
    if (!state.lastLaunchTx) {
      button.dataset.action = "confirm-launch";
      button.textContent = "Launch Token";
    }
    toast(message);
  } finally {
    state.launchInFlight = false;
    button.disabled = false;
    renderAccount();
  }
}

async function handleModalPrimary() {
  if ($("#modalWallet").dataset.action === "deploy-factory") {
    await deployFactoryWithWallet();
    return;
  }
  if ($("#modalWallet").dataset.action === "activate-factory") {
    window.location.reload();
    return;
  }
  if ($("#modalWallet").dataset.action === "close") {
    closeModal();
    return;
  }
  if ($("#modalWallet").dataset.action === "confirm-launch") {
    const failure = validateDevBuySelection();
    if (failure) {
      $("#modalNote").textContent = failure.message;
      failure.element.focus({ preventScroll: true });
      return;
    }
    await launchOnUniswap();
    return;
  }
  if (state.lastLaunchTx) {
    window.open(`${ROBINHOOD_CHAIN.blockExplorerUrls[0]}/tx/${state.lastLaunchTx}`, "_blank", "noopener,noreferrer");
    return;
  }
  await launchOnUniswap();
}

async function syncWallet() {
  const wallet = await discoverWalletProvider();
  if (!wallet) return;
  try {
    const accounts = await wallet.request({ method: "eth_accounts" });
    state.account = accounts[0] || null;
    if (state.account) await ensureEthersLibrary();
    renderAccount();
    if (state.account) {
      const chainId = await wallet.request({ method: "eth_chainId" });
      if (chainId.toLowerCase() === ROBINHOOD_CHAIN.chainId) {
        await readEthBalance();
        if (creatorDashboardIsOpen()) await loadCreatorDashboard();
      }
    }
  } catch {
    state.account = null;
    renderAccount();
  }
}

async function copyRwiAddress() {
  const quote = selectedQuoteAsset();
  const address = quote === "PONS"
    ? PONS_ADDRESS
    : quote === "USDG"
      ? QUOTE_FACTORY_CONFIG.usdgAddress
      : RWI_ADDRESS;
  if (!isAddress(address)) return toast("The selected pair contract is unavailable.");
  try {
    await navigator.clipboard.writeText(address);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = address;
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  toast(`$${quote} contract address copied.`);
}

function downloadFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadLogo() {
  if (!state.imageFile) return toast("Add and crop a token image first.");
  downloadFile(state.imageFile, state.imageFile.name || "token-logo.png");
  toast("512×512 logo downloaded.");
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

async function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  const stamp = zipDateTime();

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(await file.data.arrayBuffer());
    const checksum = crc32(data);
    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(10, stamp.time, true);
    localView.setUint16(12, stamp.date, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    localHeader.set(name, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + name.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(12, stamp.time, true);
    centralView.setUint16(14, stamp.date, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, localOffset, true);
    centralHeader.set(name, 46);
    centralParts.push(centralHeader);
    localOffset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

async function downloadLaunchBrief() {
  const economics = getEconomics();
  const ticker = cleanTicker(fields.ticker.value) || "TOKEN";
  const normalizedTokenAddress = isAddress(state.lastTokenAddress) ? state.lastTokenAddress.toLowerCase() : null;
  const publicLogoPath = normalizedTokenAddress
    ? `assets/tokens/${normalizedTokenAddress}.png`
    : `assets/tokens/${ticker.toLowerCase()}-logo.png`;
  const publicMetadataPath = normalizedTokenAddress
    ? `tokens/${normalizedTokenAddress}.json`
    : `tokens/${ticker.toLowerCase()}-metadata.json`;
  const logoSha256 = state.imageFile ? await sha256BlobHex(state.imageFile) : null;
  const publicMetadata = {
    schemaVersion: 1,
    tokenAddress: state.lastTokenAddress,
    name: fields.name.value.trim(),
    symbol: ticker,
    description: fields.description.value.trim(),
    image: state.imageFile ? publicLogoPath : null,
    links: {
      website: fields.website.value.trim(),
      twitter: fields.twitter.value.trim(),
      telegram: fields.telegram.value.trim(),
    },
    creator: state.account,
    poolId: state.lastPoolId,
    protocol: "Uniswap v4",
    logo: state.imageFile ? {
      mimeType: "image/png",
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      bytes: state.imageFile.size,
      sha256: logoSha256,
    } : null,
  };
  const brief = {
    generatedAt: new Date().toISOString(),
    status: configuredFactoryAddress() ? "launch-enabled" : "factory-deployment-pending",
    launchModel: LIQUIDITY_MODEL,
    token: { address: state.lastTokenAddress, name: fields.name.value.trim(), ticker, description: fields.description.value.trim(), imageFileName: state.imageFile?.name || null, supply: FIXED_TOKEN_SUPPLY.toString(), decimals: 18, supplyPolicy: "fixed-one-billion-no-future-minting" },
    links: { website: fields.website.value.trim(), twitter: fields.twitter.value.trim(), telegram: fields.telegram.value.trim() },
    network: { name: ROBINHOOD_CHAIN.chainName, chainId: 4663, rpc: ROBINHOOD_CHAIN.rpcUrls[0], explorer: ROBINHOOD_CHAIN.blockExplorerUrls[0] },
    pairing: { venue: "Uniswap v4", poolId: state.lastPoolId, hookAddress: configuredFactoryAddress(), poolManager: FACTORY_CONFIG.uniswapV4PoolManager, tradeUrl: state.lastTokenAddress ? uniswapSwapUrl(RWI_ADDRESS, state.lastTokenAddress) : null, poolFee: LIQUIDITY_MODEL.poolFee, asset: "$RWI", address: RWI_ADDRESS, initialRwiLiquidity: "0", initialLiquidityMode: "single-sided-token-position", optionalDevBuyUsd: state.lastDevBuyUsdAmount, optionalDevBuyEthQuoted: state.lastDevBuyEthAmount.toString(), optionalDevBuyRwi: state.lastDevBuyRwiAmount.toString(), devBuyMode: "eth-funded-rwi-bridge-plus-post-lock-exact-input-swap", firstBuyersSupplyRwi: true, poolAllocationPercent: 100, creatorTokenAllocationPercent: 0, tokensEnteringPool: economics.pool.toString(), targetMarketCapUsd: TARGET_MARKET_CAP_USD, openingPriceMode: "30-minute-uniswap-rwi-weth-plus-weth-usdg-dual-twap", liquidityLock: "permanent", liquidityWithdrawable: false, lpFeeRecipient: "token-creator-in-eth", creatorLpFeeShareBps: 10000, launchpadLpFeeShareBps: 0 },
    listing: { metadataVersion: 1, metadataReady: Boolean(state.imageFile), publicMetadataPath, publicLogoPath: state.imageFile ? publicLogoPath : null, logo: state.imageFile ? { fileName: state.imageFile.name, mimeType: "image/png", width: LOGO_SIZE, height: LOGO_SIZE, crop: "square-cover", bytes: state.imageFile.size, sha256: logoSha256, browserAssetKey: state.lastTokenAddress ? `token:${String(state.lastTokenAddress).toLowerCase()}` : DRAFT_LOGO_KEY } : null, imageRequiresPublicHosting: Boolean(state.imageFile), poolStartsWithPricedRwi: false, discoveryRequiresRealRwiSwaps: true },
    note: configuredFactoryAddress()
      ? "The hook enforces a tick-rounded $10,000 opening valuation from protected 30-minute RWI/WETH and WETH/USDG Uniswap TWAPs. The creator supplies no RWI, receives all claimable LP revenue only as ETH, and the v4 liquidity is locked forever with no migration or graduation state."
      : "The dual-TWAP v4 launch hook is compiled but not independently audited. CREATE2 deployment and source verification are still required before transactions are enabled.",
  };
  const metadataBlob = new Blob([JSON.stringify(publicMetadata, null, 2)], { type: "application/json" });
  const reportBlob = new Blob([JSON.stringify(brief, null, 2)], { type: "application/json" });
  if (state.imageFile) {
    const zip = await createZip([
      { name: publicMetadataPath, data: metadataBlob },
      { name: publicLogoPath, data: state.imageFile },
      { name: "launch-report.json", data: reportBlob },
    ]);
    downloadFile(zip, `${ticker.toLowerCase()}-listing-kit.zip`);
    toast(normalizedTokenAddress
      ? "Publish-ready kit downloaded with exact Vercel paths, metadata, and verified logo."
      : "Draft listing kit downloaded; launch once to generate address-specific public paths.");
    return;
  }
  downloadFile(reportBlob, `${ticker.toLowerCase()}-launch-report.json`);
  toast("Launch brief downloaded.");
}

async function handleModalSecondary() {
  if ($("#downloadBrief").dataset.action === "copy-factory" && state.lastFactoryAddress) {
    try {
      await navigator.clipboard.writeText(state.lastFactoryAddress);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = state.lastFactoryAddress;
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    toast("Factory address copied.");
    return;
  }
  await downloadLaunchBrief();
}

function openUniswapTrade() {
  if (!state.lastTokenAddress) return;
  window.location.href = tokenDetailHref(state.lastTokenAddress);
}

fields.name.addEventListener("input", updatePreview);
fields.ticker.addEventListener("input", updatePreview);
fields.description.addEventListener("input", updatePreview);
fields.devBuy.addEventListener("input", scheduleDevBuyEstimate);
$$('input[name="quoteAsset"]').forEach((input) => input.addEventListener("change", () => {
  if (!document.querySelector('input[name="quoteAsset"]:checked')) {
    input.checked = true;
    toast("Select at least one permanent pool.");
  }
  updatePreview();
  renderDevBuyPairOptions();
  renderIntegrationStatus();
  updateDevBuyEstimate();
  queueDraftSave();
}));
fields.image.addEventListener("change", (event) => openCropper(event.target.files[0]));
Object.values(fields).filter((field) => field && field !== fields.image && field !== fields.devBuy).forEach((field) => {
  field.addEventListener("input", queueDraftSave);
  field.addEventListener("change", queueDraftSave);
});
$("#removeImage").addEventListener("click", clearImage);
$("#editImage").addEventListener("click", () => openCropper(state.originalImageFile || state.imageFile));
$("#downloadLogo").addEventListener("click", downloadLogo);
$("#resetDraft").addEventListener("click", resetDraft);
$("#copyRwiAddress").addEventListener("click", copyRwiAddress);
$("#downloadBrief").addEventListener("click", handleModalSecondary);
$("#uniswapTradeButton").addEventListener("click", openUniswapTrade);
$("#deployFactoryButton").addEventListener("click", openFactoryDeploymentModal);

const uploadZone = $("#uploadZone");
uploadZone.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  fields.image.click();
});
["dragenter", "dragover"].forEach((eventName) => uploadZone.addEventListener(eventName, (event) => {
  event.preventDefault(); uploadZone.classList.add("is-dragging");
}));
["dragleave", "drop"].forEach((eventName) => uploadZone.addEventListener(eventName, (event) => {
  event.preventDefault(); uploadZone.classList.remove("is-dragging");
}));
uploadZone.addEventListener("drop", (event) => openCropper(event.dataTransfer.files[0]));

$("#cropZoom").addEventListener("input", drawCrop);
$("#cropReset").addEventListener("click", () => {
  state.cropOffsetX = 0;
  state.cropOffsetY = 0;
  $("#cropZoom").value = "1";
  drawCrop();
});
$("#cropApply").addEventListener("click", applyCrop);
$("#cropCancel").addEventListener("click", closeCropper);
$("#cropClose").addEventListener("click", closeCropper);
$("#cropModal").addEventListener("click", (event) => { if (event.target === $("#cropModal")) closeCropper(); });

const cropCanvas = $("#cropCanvas");
cropCanvas.addEventListener("pointerdown", (event) => {
  if (!state.cropSourceImage) return;
  state.cropDragging = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: state.cropOffsetX, offsetY: state.cropOffsetY };
  cropCanvas.setPointerCapture?.(event.pointerId);
});
cropCanvas.addEventListener("pointermove", (event) => {
  if (!state.cropDragging || state.cropDragging.pointerId !== event.pointerId) return;
  const scale = LOGO_SIZE / cropCanvas.getBoundingClientRect().width;
  state.cropOffsetX = state.cropDragging.offsetX + (event.clientX - state.cropDragging.x) * scale;
  state.cropOffsetY = state.cropDragging.offsetY + (event.clientY - state.cropDragging.y) * scale;
  drawCrop();
});
const stopCropDrag = (event) => {
  if (state.cropDragging?.pointerId === event.pointerId) state.cropDragging = null;
};
cropCanvas.addEventListener("pointerup", stopCropDrag);
cropCanvas.addEventListener("pointercancel", stopCropDrag);

$("#walletButton").addEventListener("click", connectWallet);
$("#modalWallet").addEventListener("click", handleModalPrimary);
$("#dashboardConnect").addEventListener("click", connectWallet);
$$('[data-discover-open]').forEach((opener) => opener.addEventListener("click", (event) => {
  event.preventDefault();
  openDiscover(event.currentTarget);
}));
$("#discoverClose")?.addEventListener("click", () => closeDiscover());
$("#discoverModal")?.addEventListener("click", (event) => {
  if (event.target === $("#discoverModal")) closeDiscover();
});
$("#discoverViewToggle")?.addEventListener("click", toggleDiscoverView);
$("#refreshDiscover")?.addEventListener("click", () => loadRecentLaunches({ force: true }));
$$('[data-dashboard-open]').forEach((opener) => opener.addEventListener("click", (event) => {
  event.preventDefault();
  openCreatorDashboard(event.currentTarget);
}));
$("#dashboardClose")?.addEventListener("click", () => closeCreatorDashboard());
$("#dashboardModal")?.addEventListener("click", (event) => {
  if (event.target === $("#dashboardModal")) closeCreatorDashboard();
});
window.addEventListener?.("hashchange", () => {
  if (window.location.hash === "#discover") {
    window.location.href = "discover.html";
  } else if (window.location.hash === "#dashboard") {
    closeDiscover({ clearHash: false, restoreFocus: false });
    openCreatorDashboard(null, { updateHash: false });
  } else {
    closeDiscover({ clearHash: false, restoreFocus: false });
    closeCreatorDashboard({ clearHash: false, restoreFocus: false });
  }
});
$("#refreshRevenue").addEventListener("click", () => loadCreatorDashboard());
$("#claimDeveloperRevenue")?.addEventListener("click", claimDeveloperRevenue);
$("#creatorProfileForm").addEventListener("submit", saveCreatorProfile);
$("#profileImage").addEventListener("change", (event) => processProfileImage(event.target.files[0]));
$("#removeProfileImage").addEventListener("click", clearProfileImage);
$("#deployProfileRegistry").addEventListener("click", deployProfileRegistry);
$("#creatorName").addEventListener("input", renderProfileAvatar);
$("#creatorBio").addEventListener("input", () => {
  $("#creatorBioCount").textContent = `${$("#creatorBio").value.length} / 160`;
});

$("#launchForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const launchButton = $("#launchButton");
  if (launchButton.disabled) return;
  const failure = validateForm();
  if (failure) {
    showValidation(failure);
    return;
  }
  $("#formMessage").textContent = "";
  openLaunchConfirmation();
});

function closeModal() {
  if (state.launchInFlight || state.factoryDeploymentInFlight) return;
  $("#launchModal").hidden = true;
  syncModalScrollLock();
}
$("#modalClose").addEventListener("click", closeModal);
$("#launchModal").addEventListener("click", (event) => { if (event.target === $("#launchModal")) closeModal(); });
document.addEventListener("keydown", (event) => {
  trapDiscoverFocus(event);
  trapDashboardFocus(event);
  if (event.key !== "Escape") return;
  if (!$("#cropModal").hidden) closeCropper();
  else if (!$("#launchModal").hidden) closeModal();
  else if ($("#discoverModal") && !$("#discoverModal").hidden) closeDiscover();
  else if ($("#dashboardModal") && !$("#dashboardModal").hidden) closeCreatorDashboard();
});

restoreDraft();
restoreDraftLogo();
renderIntegrationStatus();
updatePreview();
renderDashboardAccess();
if (window.location.hash === "#discover") window.location.replace("discover.html");
else if (window.location.hash === "#dashboard") openCreatorDashboard(null, { updateHash: false });
$("#walletOriginWarning").hidden = window.location?.protocol !== "file:";
syncWallet();

window.addEventListener?.("beforeunload", () => {
  for (const imageUrl of state.discoverImageUrls) URL.revokeObjectURL(imageUrl);
  releaseProfileAvatarObjectUrl();
});

window.RWILaunchpad = {
  RWI_ADDRESS,
  ROBINHOOD_CHAIN,
  LIQUIDITY_MODEL,
  FACTORY_CONFIG,
  PROFILE_REGISTRY_CONFIG,
  launchGasPolicy: Object.freeze({
    minimum: LAUNCH_GAS_LIMIT_FLOOR.toString(),
    estimateBufferBps: LAUNCH_GAS_ESTIMATE_BUFFER_BPS.toString(),
    fixedBuffer: LAUNCH_GAS_FIXED_BUFFER.toString(),
  }),
};
