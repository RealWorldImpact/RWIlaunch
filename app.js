const RWI_ADDRESS = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const FIXED_TOKEN_SUPPLY = 1_000_000_000n;
const FIXED_POOL_ALLOCATION_BPS = 10_000;
const TARGET_MARKET_CAP_USD = 10_000;
const ETH_CLAIM_SLIPPAGE_BPS = 500n;
const DEV_BUY_SLIPPAGE_BPS = 500n;
const ETH_CLAIM_DEADLINE_SECONDS = 10 * 60;
const FACTORY_CONFIG = window.RWI_FACTORY_CONFIG || Object.freeze({});
const FACTORY_ABI = window.RWI_FACTORY_ABI || Object.freeze([]);
const FACTORY_DEPLOYMENT = window.RWI_FACTORY_DEPLOYMENT || Object.freeze({});
const HOOK_DEPLOYER_DEPLOYMENT = window.RWI_HOOK_DEPLOYER_DEPLOYMENT || Object.freeze({});
const INTERNAL_MATCH_FEE_MODE = "internal-match-eth";
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
const PROFILE_REGISTRY_LOCAL_ADDRESS_KEY = "rwi-profile-registry-address";
const PROFILE_REGISTRY_LOCAL_BLOCK_KEY = "rwi-profile-registry-block";
const FACTORY_LOCAL_BLOCK_KEY = `${FACTORY_CONFIG.factoryAddressStorageKey || "rwi-launchpad-factory-address-v4"}-deployment-block`;
const PROFILE_AVATAR_MAX_BYTES = 12_000;
const LOGO_SIZE = 512;
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
  rwiBalance: null,
  rwiDecimals: 18,
  saveTimer: null,
  launchInFlight: false,
  lastLaunchTx: null,
  lastTokenAddress: null,
  lastPoolAddress: null,
  lastPoolId: null,
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
  profileSaveInFlight: false,
  profileRegistryDeploymentInFlight: false,
  walletProvider: null,
  walletListenersAttachedTo: null,
  walletConnectionInFlight: false,
  discoverImageUrls: [],
};
const discoveredWalletProviders = new Map();
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const approvedImageHashes = new Set();

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
  devBuy: $("#devBuyRwi"),
  lock: $("#lockLiquidity"),
};

function cleanTicker(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

function parseDecimalAmount(value, decimals = 18) {
  const normalized = String(value || "").trim();
  if (!normalized) return 0n;
  if (!/^(?:0|[1-9]\d*)(?:\.\d*)?$/.test(normalized)) throw new Error("Enter a valid RWI amount.");
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) throw new Error(`Use no more than ${decimals} decimal places.`);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt((fraction || "0").padEnd(decimals, "0"));
}

function configuredDevBuyAmount() {
  const amount = parseDecimalAmount(fields.devBuy.value, 18);
  if (amount > (1n << 127n) - 1n) throw new Error("The dev buy amount is too large.");
  return amount;
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
  const balanceElement = $("#rwiBalance");
  if (!state.account) {
    balanceElement.textContent = "Connect wallet";
    return;
  }
  if (state.rwiBalance === null) {
    balanceElement.textContent = "Unavailable";
    return;
  }
  balanceElement.textContent = `${formatUnits(state.rwiBalance, state.rwiDecimals)} RWI`;
}

function computeSetupCompleteness() {
  let score = 0;
  if (fields.name.value.trim().length >= 2) score += 34;
  if (fields.ticker.value.trim().length >= 2) score += 33;
  if (state.imageFile) score += 33;
  return Math.min(score, 100);
}

function updatePreview() {
  const name = fields.name.value.trim() || "Your token";
  const ticker = cleanTicker(fields.ticker.value) || "TOKEN";
  const description = fields.description.value.trim() || "Description optional · name, ticker, and cropped logo required.";
  fields.ticker.value = cleanTicker(fields.ticker.value);

  $("#previewName").textContent = name;
  $("#previewTicker").textContent = `$${ticker}`;
  $("#previewMonogramText").textContent = ticker.charAt(0) || "?";
  $("#previewDescription").textContent = description;
  $("#previewPair").textContent = `${ticker} / RWI`;
  $("#fixedPairLabel").textContent = `${ticker} / $RWI`;
  let devBuyLabel = "0 RWI required";
  try {
    const devBuyAmount = configuredDevBuyAmount();
    if (devBuyAmount > 0n) devBuyLabel = `${formatUnits(devBuyAmount, 18, 6)} RWI dev buy`;
  } catch {
    devBuyLabel = "Check dev buy amount";
  }
  $("#previewLiquidity").textContent = devBuyLabel;
  $("#descriptionCount").textContent = `${fields.description.value.length} / 280`;

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
  try {
    const devBuyAmount = configuredDevBuyAmount();
    if (state.rwiBalance !== null && devBuyAmount > state.rwiBalance) {
      return { message: "The optional dev buy exceeds this wallet's RWI balance.", element: fields.devBuy };
    }
  } catch (error) {
    return { message: error.message, element: fields.devBuy };
  }
  return null;
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
  return registry;
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
  const factoryAddress = configuredFactoryAddress();
  if (!factoryAddress) {
    status.textContent = FACTORY_CONFIG.allowBrowserDeployment
      ? "Launch factory compiled · ready for wallet deployment"
      : "Dual-TWAP v4 hook pending deployment · internal review only";
    status.classList.remove("is-live");
    status.parentElement?.classList.remove("is-live");
    $("#deployFactoryButton").hidden = !FACTORY_CONFIG.allowBrowserDeployment;
    return;
  }
  const localReplacement = usingLocalReplacementFactory();
  const paused = effectiveLaunchesPaused();
  const stateLabel = localReplacement
    ? "Locally validated replacement hook active"
    : FACTORY_CONFIG.sourceVerified
    ? (FACTORY_CONFIG.independentAuditComplete ? "Source-verified audited factory live" : "Source-verified unaudited factory live")
    : "Launch factory active locally";
  status.textContent = paused
    ? `New launches paused for corrected hook deployment · existing markets remain available · ${factoryAddress.slice(0, 6)}…${factoryAddress.slice(-4)}`
    : `${stateLabel} · ${factoryAddress.slice(0, 6)}…${factoryAddress.slice(-4)}`;
  status.classList.toggle("is-live", !paused);
  status.parentElement?.classList.toggle("is-live", !paused);
  const canDeployReplacement = Boolean(FACTORY_CONFIG.allowBrowserDeployment && FACTORY_CONFIG.launchesPaused && !localReplacement);
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
    `Factory: ${configuredFactoryAddress().toLowerCase()}`,
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
    `Factory: ${configuredFactoryAddress().toLowerCase()}`,
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

async function prepareLaunchMetadataAuthorization(creator) {
  const service = await publicMetadataServiceStatus();
  if (!service.configured) throw new Error("Connect a public Vercel Blob store before launching so the token logo can be published.");
  const imageFile = state.imageFile;
  if (!imageFile) throw new Error("The standardized token logo is unavailable.");
  const logoSha256 = String(await sha256BlobHex(imageFile)).replace(/^0x/, "");
  const payload = {
    creator: window.ethers.getAddress(creator),
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
    devBuy: fields.devBuy.value,
  };
  const logoSha256 = String(await sha256BlobHex(imageFile)).replace(/^0x/, "");
  const payload = {
    tokenAddress: window.ethers.getAddress(address),
    creator: window.ethers.getAddress(await signer.getAddress()),
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
  const response = await fetch(new URL("api/token-metadata", new URL(".", window.location.href)), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ ...payload, ...authorization, imageDataUrl: await blobToDataUrl(imageFile) }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The public token metadata could not be published.");
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
  $("#logoStatus").textContent = `Logo ready · ${LOGO_SIZE}×${LOGO_SIZE} PNG · ${file.name}`;
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

function drawCrop() {
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
  const modalOpen = ["#cropModal", "#launchModal", "#dashboardModal"]
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
  button.textContent = "Preparing PNG…";
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
    toast("Square 512×512 logo ready.");
  } catch (error) {
    toast(error?.code === "IMAGE_REJECTED" ? error.message : "The crop could not be saved. Try again.");
  } finally {
    button.disabled = false;
    button.textContent = "Use this crop";
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
  $("#logoStatus").textContent = "Every logo is standardized to a square 512×512 PNG, verified after launch, and automatically published when public storage is connected.";
  $("#editImage").hidden = true;
  $("#downloadLogo").hidden = true;
  $("#removeImage").hidden = true;
  $("#downloadBrief").textContent = "Download launch brief";
  deleteLogoAsset(DRAFT_LOGO_KEY).catch(() => {});
  updatePreview();
}

function draftValues() {
  return {
    name: fields.name.value,
    ticker: fields.ticker.value,
    description: fields.description.value,
    website: fields.website.value,
    twitter: fields.twitter.value,
    telegram: fields.telegram.value,
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
    fields.devBuy.value = draft.devBuy || "";
    $("#draftStatus").textContent = "Draft restored";
  } catch {
    localStorage.removeItem(DRAFT_KEY);
  }
}

function resetDraft() {
  localStorage.removeItem(DRAFT_KEY);
  fields.name.value = "";
  fields.ticker.value = "";
  fields.description.value = "";
  fields.website.value = "";
  fields.twitter.value = "";
  fields.telegram.value = "";
  fields.devBuy.value = "";
  clearImage();
  updatePreview();
  $("#draftStatus").textContent = "Fresh draft";
  toast("Draft reset.");
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
  if (!state.account) {
    button.textContent = "Connect wallet";
    button.classList.remove("is-connected");
    if (!state.launchInFlight) $("#modalWallet").textContent = "Connect wallet";
    updateBalanceState();
    renderDashboardAccess();
    return;
  }
  button.textContent = `${state.account.slice(0, 6)}…${state.account.slice(-4)}`;
  button.classList.add("is-connected");
  renderDashboardAccess();
  if (state.launchInFlight) return;
  if ($("#modalWallet").dataset.action === "deploy-factory") {
    $("#modalWallet").textContent = "Deploy v4 hook with wallet";
    return;
  }
  if (state.lastLaunchTx) {
    $("#modalWallet").textContent = "View transaction ↗";
  } else if (configuredFactoryAddress()) {
    $("#modalWallet").textContent = "Launch on Uniswap";
  } else {
    $("#modalWallet").textContent = "$10K v4 hook pending deployment";
  }
}

async function handleWalletAccountsChanged(accounts) {
  state.account = accounts[0] || null;
  state.rwiBalance = null;
  renderAccount();
  if (state.account) {
    await readRwiBalance();
    await loadCreatorDashboard();
  }
}

async function handleWalletChainChanged(chainId) {
  state.rwiBalance = null;
  updateBalanceState();
  if (String(chainId).toLowerCase() === ROBINHOOD_CHAIN.chainId && state.account) {
    await readRwiBalance();
    await loadCreatorDashboard();
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

async function readRwiBalance() {
  const wallet = currentWalletProvider();
  if (!state.account || !wallet) return;
  $("#rwiBalance").textContent = "Reading…";
  try {
    const paddedAccount = state.account.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const [balanceHex, decimalsHex] = await Promise.all([
      wallet.request({ method: "eth_call", params: [{ to: RWI_ADDRESS, data: `0x70a08231${paddedAccount}` }, "latest"] }),
      wallet.request({ method: "eth_call", params: [{ to: RWI_ADDRESS, data: "0x313ce567" }, "latest"] }),
    ]);
    state.rwiBalance = balanceHex && balanceHex !== "0x" ? BigInt(balanceHex) : 0n;
    state.rwiDecimals = decimalsHex && decimalsHex !== "0x" ? Number(BigInt(decimalsHex)) : 18;
  } catch {
    state.rwiBalance = null;
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
    const accounts = await wallet.request({ method: "eth_requestAccounts" });
    state.account = accounts[0] || null;
    await ensureRobinhoodChain();
    renderAccount();
    await readRwiBalance();
    await loadCreatorDashboard();
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
  return message.replace(/^execution reverted:\s*/i, "Launch reverted: ").slice(0, 220);
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

async function queryProfileAvatarEvent(registry, provider, creator, version) {
  if (!version) return null;
  const latestBlock = await provider.getBlockNumber();
  const firstBlock = configuredProfileRegistryBlock();
  if (!firstBlock || firstBlock > latestBlock) throw new Error("Profile registry deployment block is unavailable.");
  const filter = registry.filters.ProfileUpdated(creator, version);
  const logs = [];
  const chunkSize = 50_000;
  for (let fromBlock = firstBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(latestBlock, fromBlock + chunkSize - 1);
    logs.push(...await registry.queryFilter(filter, fromBlock, toBlock));
  }
  return logs.at(-1) || null;
}

async function readOnchainCreatorProfile(address) {
  const registryAddress = configuredProfileRegistryAddress();
  if (!registryAddress || !window.ethers || !PROFILE_REGISTRY_ABI.length) return null;
  const provider = new window.ethers.JsonRpcProvider(ROBINHOOD_CHAIN.rpcUrls[0], 4663, { staticNetwork: true });
  const registry = await validateProfileRegistryDeployment(provider, registryAddress);
  const profile = await registry.profiles(address);
  const version = BigInt(profile.version);
  if (!version) return null;
  const event = await queryProfileAvatarEvent(registry, provider, address, version);
  const avatarBytes = event ? window.ethers.getBytes(event.args.avatar) : new Uint8Array();
  if (window.ethers.keccak256(avatarBytes) !== profile.avatarHash) throw new Error("Onchain avatar data does not match the registry hash.");
  return {
    name: profile.name,
    bio: profile.bio,
    version,
    updatedAt: Number(profile.updatedAt),
    avatarMimeType: Number(profile.avatarMimeType),
    avatarBytes,
  };
}

async function loadCreatorProfile() {
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

function setRevenueMessage(message) {
  const list = $("#revenueList");
  list.textContent = "";
  list.appendChild(dashboardElement("div", "dashboard-empty", message));
}

function renderDashboardAccess() {
  renderProfileRegistryStatus();
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
    $("#creatorTokenCount").textContent = "0 launches";
    setRevenueMessage("Connect your wallet to load creator revenue.");
    return;
  }
  const shortAddress = `${state.account.slice(0, 6)}…${state.account.slice(-4)}`;
  $("#profileWallet").textContent = state.account;
  $("#feeRecipient").textContent = shortAddress;
  loadCreatorProfile();
}

function setDashboardOpenerState(expanded) {
  $$('[data-dashboard-open]').forEach((opener) => opener.setAttribute("aria-expanded", String(expanded)));
}

function openCreatorDashboard(trigger = null, { updateHash = true } = {}) {
  const modal = $("#dashboardModal");
  if (!modal || !modal.hidden) return;
  state.dashboardReturnFocus = trigger || (document.activeElement !== document.body ? document.activeElement : null);
  modal.hidden = false;
  setDashboardOpenerState(true);
  renderDashboardAccess();
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
    await loadCreatorProfile();
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

async function queryCreatorLaunchLogs(contract, provider, creator, deploymentBlock = 0) {
  const latestBlock = await provider.getBlockNumber();
  const firstBlock = Number(deploymentBlock || 0);
  const filter = contract.filters.TokenLaunched(null, creator, null);
  const logs = [];
  const chunkSize = 50_000;
  for (let fromBlock = firstBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(latestBlock, fromBlock + chunkSize - 1);
    logs.push(...await contract.queryFilter(filter, fromBlock, toBlock));
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
  const internalMatch = source.feeMode === INTERNAL_MATCH_FEE_MODE;
  const ethOnly = source.feeMode !== "tokens";
  const feePreview = internalMatch
    ? Promise.allSettled([
      factory.collectFeesForRevenue.staticCall(positionTokenId, { from: String(args.creator) }),
      factory.tokenFeeInventory(positionTokenId),
      factory.convertibleRwiRewards(positionTokenId),
      factory.claimableEthRewards(positionTokenId),
      factory.claimableEthUsdValueE18(positionTokenId),
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
  const [nameResult, symbolResult, feeResult] = await Promise.allSettled([
    tokenContract.name(),
    tokenContract.symbol(),
    feePreview,
  ]);
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
      const [uncollectedResult, inventoryResult, convertibleResult, claimableResult, usdResult] = feeResult.value;
      const uncollected = uncollectedResult.status === "fulfilled" ? uncollectedResult.value : null;
      fees = {
        ...fees,
        uncollectedTokenFees: uncollected ? BigInt(uncollected.tokenFees) : null,
        uncollectedRwiFees: uncollected ? BigInt(uncollected.rwiFees) : null,
        tokenFeeInventory: inventoryResult.status === "fulfilled" ? BigInt(inventoryResult.value) : null,
        convertibleRwi: convertibleResult.status === "fulfilled" ? BigInt(convertibleResult.value) : null,
        ethQuote: claimableResult.status === "fulfilled" ? BigInt(claimableResult.value) : null,
        claimableEthUsd: usdResult.status === "fulfilled" ? BigInt(usdResult.value) : null,
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

async function queryRecentLaunchLogs(factory, provider, deploymentBlock = 0) {
  const latestBlock = await provider.getBlockNumber();
  const firstBlock = Number(deploymentBlock || 0);
  const filter = factory.filters.TokenLaunched(null, null, null);
  const logs = [];
  const chunkSize = 50_000;
  for (let fromBlock = firstBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(latestBlock, fromBlock + chunkSize - 1);
    logs.push(...await factory.queryFilter(filter, fromBlock, toBlock));
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
  const [nameResult, symbolResult, logoResult, publicMetadataResult] = await Promise.allSettled([
    tokenContract.name(),
    tokenContract.symbol(),
    readLogoAsset(`token:${token.toLowerCase()}`),
    readPublicTokenMetadata(token),
  ]);
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
  };
}

function appendTokenArtwork(card, launch, href) {
  const artLink = dashboardElement("a", "token-card-link");
  artLink.href = href;
  artLink.setAttribute("aria-label", `Open ${launch.symbol} token page`);
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
    artLink.appendChild(image);
  } else {
    artLink.appendChild(dashboardElement("div", "token-art art-one", launch.symbol.charAt(0) || "?"));
  }
  card.appendChild(artLink);
}

function renderDiscoverLaunches(launches) {
  const grid = $("#tokenGrid");
  if (!grid || !launches.length) return;
  for (const imageUrl of state.discoverImageUrls) URL.revokeObjectURL(imageUrl);
  state.discoverImageUrls = [];
  grid.textContent = "";
  for (const launch of launches) {
    const href = tokenDetailHref(launch.token);
    const card = dashboardElement("article", "token-card live-token-card");
    appendTokenArtwork(card, launch, href);

    const tokenMeta = dashboardElement("div", "token-meta");
    const identity = dashboardElement("div", "");
    identity.appendChild(dashboardElement("p", "", `$${launch.symbol}`));
    identity.appendChild(dashboardElement("h3", "", launch.name));
    tokenMeta.appendChild(identity);
    tokenMeta.appendChild(dashboardElement("span", "verified-label", launch.protocol === "Uniswap v4" ? "v4 hook launch" : "Factory launch"));
    card.appendChild(tokenMeta);
    card.appendChild(dashboardElement("p", "", launch.metadata?.description || KNOWN_TOKEN_DESCRIPTIONS[launch.token.toLowerCase()] || "Fixed one-billion supply with direct, permanently locked TOKEN / RWI liquidity."));
    card.appendChild(dashboardElement("code", "token-address", launch.token));

    const stats = dashboardElement("div", "mini-stats");
    const pair = dashboardElement("span", "", "Pair ");
    pair.appendChild(dashboardElement("strong", "", "RWI · 1%"));
    const lp = dashboardElement("span", "", "LP ");
    lp.appendChild(dashboardElement("strong", "", "Locked"));
    stats.appendChild(pair);
    stats.appendChild(lp);
    card.appendChild(stats);
    enableTokenCard(card, launch.token);
    grid.appendChild(card);
  }
}

async function loadRecentLaunches() {
  const sources = configuredFactorySources();
  if (!window.ethers || !sources.length) return;
  try {
    const provider = new window.ethers.JsonRpcProvider(ROBINHOOD_CHAIN.rpcUrls[0], 4663, { staticNetwork: true });
    const launchGroups = await Promise.all(sources.map(async (source) => {
      const factory = new window.ethers.Contract(source.address, factoryAbiForSource(source), provider);
      const logs = await queryRecentLaunchLogs(factory, provider, source.deploymentBlock);
      return Promise.all(logs.map((log) => readDiscoverLaunch(log, provider, factory, source)));
    }));
    const launches = launchGroups.flat().sort((left, right) => right.blockNumber - left.blockNumber).slice(0, 18);
    renderDiscoverLaunches(launches);
  } catch {
    // The verified TESTCOIN card remains usable when a public RPC is temporarily unavailable.
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
    const avatar = dashboardElement("div", "revenue-token-avatar", launch.symbol.charAt(0) || "?");
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
        actions.appendChild(revenueActionButton("Convert RWI to ETH", actionBusy, (button) => convertCreatorRevenue(launch, button), true));
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

    readLogoAsset(`token:${launch.token.toLowerCase()}`).then((record) => {
      if (!avatar.isConnected) return;
      let logoBlob = record?.blob || null;
      const renderDashboardTokenLogo = (blob) => {
        if (!blob || !avatar.isConnected) return;
        const imageUrl = URL.createObjectURL(blob);
        avatar.style.backgroundImage = `url("${imageUrl}")`;
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
        avatar.textContent = "";
        setTimeout(() => URL.revokeObjectURL(imageUrl), 60_000);
      };
      renderDashboardTokenLogo(logoBlob);
      if (launch.poolId && sameAddress(launch.factoryAddress, configuredFactoryAddress())) {
        const metadata = readLocalTokenMetadata(launch.token) || {};
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
  if (!window.ethers || !sources.length) {
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
    const launchGroups = await Promise.all(sources.map(async (source) => {
      const factory = new window.ethers.Contract(source.address, factoryAbiForSource(source), provider);
      const logs = await queryCreatorLaunchLogs(factory, provider, requestedAccount, source.deploymentBlock);
      return Promise.all(logs.map((log) => readCreatorLaunch(log, provider, factory, source)));
    }));
    const launches = launchGroups.flat();
    if (requestId !== state.dashboardRequestId || !sameAddress(state.account, requestedAccount)) return;
    state.creatorLaunches = launches.sort((left, right) => right.blockNumber - left.blockNumber);
    renderCreatorLaunches();
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
  const recordedCreator = await factory.positionCreators(launch.positionTokenId);
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
    toast(event
      ? `Stored ${feeLabel(BigInt(event.args.tokenFees), launch.symbol)} + ${feeLabel(BigInt(event.args.rwiFees), "RWI")} without a swap.`
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
    const quote = await factory.convertRwiRewardsToEth.staticCall(launch.positionTokenId, 0, deadline);
    const minimumEthOut = BigInt(quote.ethAmount) * (10_000n - ETH_CLAIM_SLIPPAGE_BPS) / 10_000n;
    if (BigInt(quote.rwiAmount) === 0n) throw new Error("No matched RWI revenue is ready to convert.");
    button.textContent = "Confirm conversion…";
    const transaction = await factory.convertRwiRewardsToEth(launch.positionTokenId, minimumEthOut, deadline);
    button.textContent = "Preparing ETH…";
    const receipt = await transaction.wait();
    const event = receipt.logs.map((log) => {
      try { return factory.interface.parseLog(log); } catch { return null; }
    }).find((parsed) => parsed?.name === "RwiRewardsConvertedToEth");
    toast(event
      ? `${feeLabel(BigInt(event.args.ethAmount), "ETH")} is ready to claim. The token pool was not traded.`
      : "RWI revenue was converted and the ETH is ready to claim.");
    await loadCreatorDashboard({ silent: true });
  } catch (error) {
    toast(readableWalletError(error).replace(/^Launch reverted:/, "Conversion reverted:"));
  } finally {
    state.activeClaimPosition = null;
    button.disabled = false;
    button.textContent = "Convert RWI to ETH";
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
    factory.rwi(), factory.weth(), factory.usdg(), factory.poolManager(), factory.stateView(), factory.uniswapV3Factory(), factory.swapRouter(), factory.rwiWethPool(), factory.wethUsdgPool(),
    factory.ROBINHOOD_CHAIN_ID(), factory.TOKEN_SUPPLY_WHOLE(), factory.POOL_FEE(), factory.POOL_TICK_SPACING(),
    factory.INITIAL_RWI_LIQUIDITY(), factory.POOL_ALLOCATION_BPS(), factory.MAX_LOCKED_TOKEN_DUST(),
    factory.LIQUIDITY_PERMANENTLY_LOCKED(), factory.CREATOR_LP_FEE_SHARE_BPS(), factory.TARGET_MARKET_CAP_USD_E18(),
    factory.ORACLE_TWAP_WINDOW(), factory.MAX_RWI_WETH_SPOT_TWAP_DEVIATION(), factory.MAX_WETH_USDG_SPOT_TWAP_DEVIATION(),
    factory.MIN_RWI_WETH_HARMONIC_LIQUIDITY(), factory.MIN_WETH_USDG_HARMONIC_LIQUIDITY(),
    factory.REQUIRED_HOOK_FLAGS(), factory.ALL_HOOK_FLAGS_MASK(), factory.WETH_USDG_ORACLE_FEE(),
  ]);
  const [
    rwi, weth, usdg, poolManager, stateView, universalRouter, uniswapFactory, swapRouter, rwiWethPool, wethUsdgPool,
    immutableRwi, immutableWeth, immutableUsdg, immutablePoolManager, immutableStateView, immutableFactory, immutableSwapRouter,
    immutableRwiWethPool, immutableWethUsdgPool, chainId, tokenSupplyWhole, poolFee, tickSpacing, initialRwi,
    poolAllocation, maxDust, locked, creatorFeeShare, targetMarketCap, twapWindow, maxRwiDeviation,
    maxWethDeviation, minRwiLiquidity, minWethLiquidity, requiredHookFlags, allHookFlagsMask, wethUsdgFee,
  ] = values;

  const addressChecks = [
    [rwi, RWI_ADDRESS, "RWI"], [weth, FACTORY_CONFIG.wethAddress, "WETH"], [usdg, FACTORY_CONFIG.usdgAddress, "USDG"],
    [poolManager, FACTORY_CONFIG.uniswapV4PoolManager, "v4 PoolManager"], [stateView, FACTORY_CONFIG.uniswapV4StateView, "v4 StateView"],
    [universalRouter, FACTORY_CONFIG.uniswapV4UniversalRouter, "v4 Universal Router"],
    [uniswapFactory, FACTORY_CONFIG.uniswapV3Factory, "v3 factory"], [swapRouter, FACTORY_CONFIG.swapRouter02, "SwapRouter02"],
    [rwiWethPool, FACTORY_CONFIG.rwiWethOraclePool, "RWI/WETH oracle pool"], [wethUsdgPool, FACTORY_CONFIG.wethUsdgOraclePool, "WETH/USDG oracle pool"],
    [immutableRwi, rwi, "immutable RWI"], [immutableWeth, weth, "immutable WETH"], [immutableUsdg, usdg, "immutable USDG"],
    [immutablePoolManager, poolManager, "immutable PoolManager"], [immutableStateView, stateView, "immutable StateView"],
    [immutableFactory, uniswapFactory, "immutable v3 factory"],
    [immutableSwapRouter, swapRouter, "immutable SwapRouter02"], [immutableRwiWethPool, rwiWethPool, "immutable RWI/WETH pool"],
    [immutableWethUsdgPool, wethUsdgPool, "immutable WETH/USDG pool"],
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
    chainId !== 4663n || tokenSupplyWhole !== 1_000_000_000n || poolFee !== 10_000n || tickSpacing !== 200n
    || initialRwi !== 0n || poolAllocation !== 10_000n || maxDust !== ethers.parseEther("1") || !locked
    || creatorFeeShare !== 10_000n || targetMarketCap !== ethers.parseUnits("10000", 18) || twapWindow !== 1_800n
    || maxRwiDeviation !== 1_000n || maxWethDeviation !== 300n || minRwiLiquidity !== 10n ** 22n
    || minWethLiquidity !== 5n * 10n ** 17n || requiredHookFlags !== 8_328n || allHookFlagsMask !== 16_383n
    || wethUsdgFee !== 100n
  ) {
    throw new Error("Factory launch rules do not match this reviewed build.");
  }
  return ethers.keccak256(code);
}

async function validateConfiguredFeeFactory(provider, address) {
  const source = configuredFactorySource(address);
  if (!source) throw new Error("This token factory is not in the launchpad configuration.");
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
  $("#downloadBrief").hidden = false;
  $("#downloadBrief").textContent = state.imageFile ? "Download metadata kit" : "Download launch brief";
  delete $("#downloadBrief").dataset.action;
  $("#uniswapTradeButton").hidden = true;
  $("#modalCopy").textContent = "One launch transaction deploys exactly 1 billion tokens at a tick-rounded $10,000 dual-TWAP valuation and allocates 100% of the supply to a token-only TOKEN / $RWI v4 position. An optional dev buy executes only after the LP is locked forever.";
}

async function deployFactoryWithWallet() {
  const button = $("#modalWallet");
  if (!FACTORY_CONFIG.allowBrowserDeployment) return toast("Browser factory deployment is available only from the local launchpad.");
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

async function launchOnUniswap() {
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
    const devBuyRwiAmount = configuredDevBuyAmount();
    let params = {
      name: fields.name.value.trim(),
      symbol: cleanTicker(fields.ticker.value),
      devBuyRwiAmount,
      minimumDevBuyTokenOut: 0n,
    };

    button.textContent = "Reading onchain prices…";
    $("#modalNote").textContent = "Checking protected 30-minute RWI/WETH and WETH/USDG prices before opening your wallet. No oracle account or credentials are required.";
    await launchFactory.ORACLE_TWAP_WINDOW();
    let devBuyTokenQuote = 0n;
    if (devBuyRwiAmount > 0n) {
      const rwiToken = new ethers.Contract(RWI_ADDRESS, [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address,address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)",
      ], signer);
      const [rwiBalance, allowance] = await Promise.all([
        rwiToken.balanceOf(signerAddress),
        rwiToken.allowance(signerAddress, factoryAddress),
      ]);
      if (BigInt(rwiBalance) < devBuyRwiAmount) throw new Error("The optional dev buy exceeds this wallet's RWI balance.");
      if (BigInt(allowance) < devBuyRwiAmount) {
        button.textContent = "Approve dev-buy RWI…";
        $("#modalNote").textContent = `Approve exactly ${formatUnits(devBuyRwiAmount, 18, 6)} RWI for the optional first purchase. The token is not launched by this approval.`;
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
        ? `$10,000 opening valuation · Lock the LP, then buy at least ${formatUnits(params.minimumDevBuyTokenOut, 18, 6)} tokens with ${formatUnits(devBuyRwiAmount, 18, 6)} RWI.`
        : "$10,000 dual-TWAP launch · Deploy the token, seed token-only v4 liquidity, and lock it forever. No RWI is required.")
      : "Source verified · Internal security review only; no independent audit. Confirm the immutable launch transaction only if you accept that risk.";
    const launchCalldata = launchFactory.interface.encodeFunctionData("launch", [params]);
    const authorizedLaunchCalldata = `${launchCalldata}${launchMetadataAuthorization.commitment.slice(2)}`;
    const transaction = await signer.sendTransaction({
      to: factoryAddress,
      data: authorizedLaunchCalldata,
    });
    button.textContent = "Creating Uniswap v4 pool…";
    $("#modalNote").textContent = `Transaction submitted · ${transaction.hash.slice(0, 10)}…`;
    const receipt = await transaction.wait();

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
      if (!assetPersistenceWarning && state.lastPoolId) {
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
    const publicationWarning = assetPersistenceWarning || publicMetadataWarning;
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
        ? `Token ${launchEvent.args.token.slice(0, 8)}… launched with a ${formatUnits(BigInt(launchEvent.args.initialRwiAmount), 18, 6)} RWI first purchase. The LP is locked forever${liquidityVerification ? ", its live position was verified," : ""} and the pool already has real swap activity.`
        : `Token ${launchEvent.args.token.slice(0, 8)}… paired with $RWI in v4 pool ${launchEvent.args.poolId.slice(0, 10)}…. Liquidity is locked forever. One real swap is required before market indexers can report price and volume.`)
      : "Launch confirmed. The TOKEN / $RWI pool is live, its LP is locked forever, and there is no graduation step.";
    if (state.lastTokenAddress) $("#uniswapTradeButton").hidden = false;
    toast(publicMetadataPublication
      ? "Token launched and its public logo was verified."
      : "Token launched directly into $RWI liquidity on Uniswap.");
    await readRwiBalance();
    loadRecentLaunches();
  } catch (error) {
    const message = readableWalletError(error);
    $("#modalNote").textContent = message;
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
    renderAccount();
    if (state.account) {
      const chainId = await wallet.request({ method: "eth_chainId" });
      if (chainId.toLowerCase() === ROBINHOOD_CHAIN.chainId) {
        await readRwiBalance();
        await loadCreatorDashboard();
      }
    }
  } catch {
    state.account = null;
    renderAccount();
  }
}

async function copyRwiAddress() {
  try {
    await navigator.clipboard.writeText(RWI_ADDRESS);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = RWI_ADDRESS;
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  toast("$RWI contract address copied.");
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
    pairing: { venue: "Uniswap v4", poolId: state.lastPoolId, hookAddress: configuredFactoryAddress(), poolManager: FACTORY_CONFIG.uniswapV4PoolManager, tradeUrl: state.lastTokenAddress ? uniswapSwapUrl(RWI_ADDRESS, state.lastTokenAddress) : null, poolFee: LIQUIDITY_MODEL.poolFee, asset: "$RWI", address: RWI_ADDRESS, initialRwiLiquidity: "0", initialLiquidityMode: "single-sided-token-position", optionalDevBuyRwi: configuredDevBuyAmount().toString(), devBuyMode: "post-lock-exact-input-swap", firstBuyersSupplyRwi: true, poolAllocationPercent: 100, creatorTokenAllocationPercent: 0, tokensEnteringPool: economics.pool.toString(), targetMarketCapUsd: TARGET_MARKET_CAP_USD, openingPriceMode: "30-minute-uniswap-rwi-weth-plus-weth-usdg-dual-twap", liquidityLock: "permanent", liquidityWithdrawable: false, lpFeeRecipient: "token-creator-in-eth", creatorLpFeeShareBps: 10000, launchpadLpFeeShareBps: 0 },
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
fields.devBuy.addEventListener("input", updatePreview);
fields.image.addEventListener("change", (event) => openCropper(event.target.files[0]));
Object.values(fields).filter((field) => field && field !== fields.image).forEach((field) => {
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
$$('[data-dashboard-open]').forEach((opener) => opener.addEventListener("click", (event) => {
  event.preventDefault();
  openCreatorDashboard(event.currentTarget);
}));
$("#dashboardClose")?.addEventListener("click", () => closeCreatorDashboard());
$("#dashboardModal")?.addEventListener("click", (event) => {
  if (event.target === $("#dashboardModal")) closeCreatorDashboard();
});
window.addEventListener?.("hashchange", () => {
  if (window.location.hash === "#dashboard") openCreatorDashboard(null, { updateHash: false });
  else closeCreatorDashboard({ clearHash: false, restoreFocus: false });
});
$("#refreshRevenue").addEventListener("click", () => loadCreatorDashboard());
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
  restoreLaunchModal();
  $("#modalTitle").textContent = "Preparing your launch.";
  $("#modalNote").textContent = configuredDevBuyAmount() > 0n
    ? "The optional dev buy may require one exact-amount RWI approval, followed by the atomic launch + buy transaction."
    : "One transaction · no RWI approval · 100% of supply enters the locked pool.";
  $("#modalWallet").textContent = "Preparing…";
  delete $("#modalWallet").dataset.action;
  $("#launchModal").hidden = false;
  syncModalScrollLock();
  launchButton.disabled = true;
  try {
    await launchOnUniswap();
  } finally {
    launchButton.disabled = false;
  }
});

function closeModal() {
  if (state.launchInFlight || state.factoryDeploymentInFlight) return;
  $("#launchModal").hidden = true;
  syncModalScrollLock();
}
$("#modalClose").addEventListener("click", closeModal);
$("#launchModal").addEventListener("click", (event) => { if (event.target === $("#launchModal")) closeModal(); });
document.addEventListener("keydown", (event) => {
  trapDashboardFocus(event);
  if (event.key !== "Escape") return;
  if (!$("#cropModal").hidden) closeCropper();
  else if (!$("#launchModal").hidden) closeModal();
  else if ($("#dashboardModal") && !$("#dashboardModal").hidden) closeCreatorDashboard();
});

restoreDraft();
restoreDraftLogo();
renderIntegrationStatus();
updatePreview();
renderDashboardAccess();
if (window.location.hash === "#dashboard") openCreatorDashboard(null, { updateHash: false });
$("#walletOriginWarning").hidden = window.location?.protocol !== "file:";
$$('#tokenGrid [data-token-address]').forEach((card) => enableTokenCard(card, card.dataset.tokenAddress));
loadRecentLaunches();
syncWallet();

window.addEventListener?.("beforeunload", () => {
  for (const imageUrl of state.discoverImageUrls) URL.revokeObjectURL(imageUrl);
  releaseProfileAvatarObjectUrl();
});

window.RWILaunchpad = { RWI_ADDRESS, ROBINHOOD_CHAIN, LIQUIDITY_MODEL, FACTORY_CONFIG, PROFILE_REGISTRY_CONFIG };
