const RWI_ADDRESS = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const FACTORY_CONFIG = window.RWI_FACTORY_CONFIG || Object.freeze({});
const FACTORY_ABI = window.RWI_FACTORY_ABI || Object.freeze([]);
const INTERNAL_MATCH_FEE_MODE = "internal-match-eth";
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
const DIRECT_TRADE_SLIPPAGE_BPS = 300n;
const DIRECT_TRADE_DEADLINE_SECONDS = 10 * 60;
const PROFILE_PREFIX = "rwi-creator-profile:";
const TOKEN_METADATA_PREFIX = "rwi-token-metadata:";
const LOGO_DATABASE = "rwi-launchpad-assets-v1";
const LOGO_STORE = "logos";
const PROFILE_REGISTRY_LOCAL_ADDRESS_KEY = "rwi-profile-registry-address";
const PROFILE_REGISTRY_LOCAL_BLOCK_KEY = "rwi-profile-registry-block";
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
  imageUrl: null, creatorImageUrl: null, tradeDirection: "buy", tradeSource: null,
  tradeQuote: null, tradeQuoteRequest: 0, tradeInFlight: false,
  directTradeIntegrationsValidated: false,
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

function setDirectTradeStatus(message, warning = false) {
  const element = $("#directTradeStatus");
  element.textContent = message;
  element.classList.toggle("is-warning", warning);
}

function directTradePoolKey() {
  if (!state.token || !state.tradeSource?.address) throw new Error("The v4 launch source is unavailable.");
  const tokenIs0 = BigInt(state.token) < BigInt(RWI_ADDRESS);
  return [
    tokenIs0 ? state.token : RWI_ADDRESS,
    tokenIs0 ? RWI_ADDRESS : state.token,
    Number(FACTORY_CONFIG.poolFee || 10_000),
    Number(FACTORY_CONFIG.poolTickSpacing || 200),
    state.tradeSource.address,
  ];
}

function directTradeCurrencies() {
  const inputCurrency = state.tradeDirection === "buy" ? RWI_ADDRESS : state.token;
  const outputCurrency = state.tradeDirection === "buy" ? state.token : RWI_ADDRESS;
  const poolKey = directTradePoolKey();
  return { inputCurrency, outputCurrency, poolKey, zeroForOne: sameAddress(inputCurrency, poolKey[0]) };
}

function formatTradeUnits(value, symbol) {
  const raw = window.ethers.formatUnits(value, 18);
  const [whole, fraction = ""] = raw.split(".");
  const trimmed = fraction.slice(0, 8).replace(/0+$/, "");
  if (BigInt(value) > 0n && whole === "0" && !trimmed) return `<0.00000001 ${symbol}`;
  return `${BigInt(whole).toLocaleString("en-US")}${trimmed ? `.${trimmed}` : ""} ${symbol}`;
}

function readTradeAmount() {
  const raw = $("#tradeAmount").value.trim();
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(raw)) throw new Error("Enter a valid amount.");
  const amount = window.ethers.parseUnits(raw, 18);
  if (amount <= 0n) throw new Error("Enter an amount greater than zero.");
  if (amount > (1n << 128n) - 1n) throw new Error("That amount is too large.");
  return amount;
}

async function validateDirectTradeIntegrations(provider) {
  if (state.directTradeIntegrationsValidated) return;
  const expectedPoolManager = FACTORY_CONFIG.uniswapV4PoolManager;
  const integrations = [V4_QUOTER, V4_STATE_VIEW, V4_UNIVERSAL_ROUTER, PERMIT2];
  if (!isAddress(expectedPoolManager) || integrations.some((address) => !isAddress(address))) {
    throw new Error("The pinned Uniswap v4 integration configuration is incomplete.");
  }
  const codes = await Promise.all(integrations.map((address) => provider.getCode(address)));
  if (codes.some((code) => code === "0x")) throw new Error("A pinned Uniswap v4 integration has no deployed code.");
  const immutableStateAbi = ["function poolManager() view returns(address)"];
  const managerAddresses = await Promise.all([V4_QUOTER, V4_STATE_VIEW, V4_UNIVERSAL_ROUTER].map((address) => (
    new window.ethers.Contract(address, immutableStateAbi, provider).poolManager()
  )));
  if (managerAddresses.some((address) => !sameAddress(address, expectedPoolManager))) {
    throw new Error("A pinned Uniswap v4 integration points to the wrong PoolManager.");
  }
  state.directTradeIntegrationsValidated = true;
}

async function quoteDirectTrade({ quiet = false } = {}) {
  if (!state.tradeSource || state.tradeSource.protocol !== "Uniswap v4") return null;
  const requestId = ++state.tradeQuoteRequest;
  try {
    const amountIn = readTradeAmount();
    const { inputCurrency, outputCurrency, poolKey, zeroForOne } = directTradeCurrencies();
    if (!quiet) $("#tradeQuote").textContent = "Reading v4 pool…";
    const provider = new window.ethers.JsonRpcProvider(RPC_URL, 4663, { staticNetwork: true });
    await validateDirectTradeIntegrations(provider);
    const quoter = new window.ethers.Contract(V4_QUOTER, [
      "function quoteExactInputSingle(((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bool zeroForOne,uint128 exactAmount,bytes hookData) params) returns (uint256 amountOut,uint256 gasEstimate)",
    ], provider);
    const [amountOut] = await quoter.quoteExactInputSingle.staticCall([poolKey, zeroForOne, amountIn, "0x"]);
    if (requestId !== state.tradeQuoteRequest) return null;
    if (amountOut <= 0n) throw new Error("The pool returned no output for that amount.");
    const minimumAmountOut = amountOut * (10_000n - DIRECT_TRADE_SLIPPAGE_BPS) / 10_000n;
    const outputSymbol = state.tradeDirection === "buy" ? document.querySelector("#detailSymbol").textContent.replace(/^\$/, "") : "RWI";
    state.tradeQuote = { amountIn, amountOut, minimumAmountOut, inputCurrency, outputCurrency, poolKey, zeroForOne };
    $("#tradeQuote").textContent = formatTradeUnits(minimumAmountOut, outputSymbol);
    setDirectTradeStatus("Direct route found. The displayed minimum includes a 3% price-movement buffer.");
    return state.tradeQuote;
  } catch (error) {
    if (requestId !== state.tradeQuoteRequest) return null;
    state.tradeQuote = null;
    $("#tradeQuote").textContent = "No quote";
    const message = state.tradeDirection === "sell"
      ? "No RWI is available on the sell side yet. Complete the first direct buy, then selling becomes available."
      : (error?.shortMessage || error?.message || "A direct quote is not available.");
    setDirectTradeStatus(message, true);
    if (!quiet && !$("#tradeAmount").value.trim()) {
      $("#tradeQuote").textContent = "Enter an amount";
      setDirectTradeStatus("Quotes and swaps use Uniswap's official v4 contracts on Robinhood Chain. A 3% minimum-output buffer is enforced.");
    }
    return null;
  }
}

function scheduleDirectTradeQuote() {
  clearTimeout(scheduleDirectTradeQuote.timer);
  state.tradeQuote = null;
  if (!$("#tradeAmount").value.trim()) {
    $("#tradeQuote").textContent = "Enter an amount";
    setDirectTradeStatus("Quotes and swaps use Uniswap's official v4 contracts on Robinhood Chain. A 3% minimum-output buffer is enforced.");
    refreshPoolActivation();
    return;
  }
  scheduleDirectTradeQuote.timer = setTimeout(() => quoteDirectTrade(), 350);
}

function selectTradeDirection(direction) {
  state.tradeDirection = direction;
  state.tradeQuote = null;
  $("#tradeBuyTab").setAttribute("aria-selected", String(direction === "buy"));
  $("#tradeSellTab").setAttribute("aria-selected", String(direction === "sell"));
  $("#tradeDirectionLabel").textContent = direction === "buy" ? "Buy token" : "Sell token";
  $("#tradeInputSymbol").textContent = direction === "buy"
    ? "RWI"
    : document.querySelector("#detailSymbol").textContent.replace(/^\$/, "");
  $("#tradeAmount").placeholder = direction === "buy" ? "0.001" : "100";
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

function encodeDirectV4Swap(quote, deadline) {
  const coder = window.ethers.AbiCoder.defaultAbiCoder();
  const swapParams = coder.encode([
    "tuple(tuple(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bool zeroForOne,uint128 amountIn,uint128 amountOutMinimum,uint256 minHopPriceX36,bytes hookData)",
  ], [[quote.poolKey, quote.zeroForOne, quote.amountIn, quote.minimumAmountOut, 0, "0x"]]);
  const settleParams = coder.encode(["address", "uint256"], [quote.inputCurrency, quote.amountIn]);
  const takeParams = coder.encode(["address", "uint256"], [quote.outputCurrency, quote.minimumAmountOut]);
  const v4Input = coder.encode(["bytes", "bytes[]"], ["0x060c0f", [swapParams, settleParams, takeParams]]);
  const router = new window.ethers.Interface(["function execute(bytes commands,bytes[] inputs,uint256 deadline) payable"]);
  return router.encodeFunctionData("execute", ["0x10", [v4Input], deadline]);
}

async function refreshPoolActivation() {
  if (!state.poolId || state.tradeSource?.protocol !== "Uniswap v4") return;
  try {
    const provider = new window.ethers.JsonRpcProvider(RPC_URL, 4663, { staticNetwork: true });
    const view = new window.ethers.Contract(V4_STATE_VIEW, ["function getLiquidity(bytes32 poolId) view returns (uint128)"], provider);
    const activeLiquidity = await view.getLiquidity(state.poolId);
    if (activeLiquidity === 0n && !state.tradeQuote) {
      setDirectTradeStatus("This launch is waiting for its first direct RWI buy. Even a very small buy activates the locked position for public route discovery.", true);
    }
  } catch {
    // Trading remains available when the optional state read is unavailable.
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
    if (!quote) throw new Error("A valid direct v4 quote is required before trading.");
    const provider = new window.ethers.BrowserProvider(window.ethereum);
    await validateDirectTradeIntegrations(provider);
    const signer = await provider.getSigner();
    const inputToken = new window.ethers.Contract(quote.inputCurrency, [
      "function balanceOf(address owner) view returns (uint256)",
      "function allowance(address owner,address spender) view returns (uint256)",
      "function approve(address spender,uint256 amount) returns (bool)",
    ], signer);
    const balance = await inputToken.balanceOf(account);
    if (balance < quote.amountIn) throw new Error("Your wallet does not have enough of the input token.");

    if (await inputToken.allowance(account, PERMIT2) < quote.amountIn) {
      button.textContent = "Approve token in wallet…";
      setDirectTradeStatus("First-time setup: approve Uniswap Permit2 to transfer this input token.");
      await (await inputToken.approve(PERMIT2, window.ethers.MaxUint256)).wait();
    }

    const permit2 = new window.ethers.Contract(PERMIT2, [
      "function allowance(address owner,address token,address spender) view returns (uint160 amount,uint48 expiration,uint48 nonce)",
      "function approve(address token,address spender,uint160 amount,uint48 expiration)",
    ], signer);
    const permitAllowance = await permit2.allowance(account, quote.inputCurrency, V4_UNIVERSAL_ROUTER);
    const now = Math.floor(Date.now() / 1000);
    if (BigInt(permitAllowance.amount) < quote.amountIn || Number(permitAllowance.expiration) <= now + DIRECT_TRADE_DEADLINE_SECONDS) {
      button.textContent = "Authorize official router…";
      setDirectTradeStatus("Authorize the official Uniswap router for only this amount and a short time window.");
      await (await permit2.approve(quote.inputCurrency, V4_UNIVERSAL_ROUTER, quote.amountIn, now + 30 * 60)).wait();
    }

    const latestBlock = await provider.getBlock("latest");
    const deadline = BigInt(Number(latestBlock.timestamp) + DIRECT_TRADE_DEADLINE_SECONDS);
    const data = encodeDirectV4Swap(quote, deadline);
    button.textContent = "Confirm swap in wallet…";
    setDirectTradeStatus("Confirm the direct Uniswap v4 swap. The minimum output shown above is enforced onchain.");
    const transaction = await signer.sendTransaction({ to: V4_UNIVERSAL_ROUTER, data });
    button.textContent = "Swap submitted…";
    setDirectTradeStatus(`Swap submitted: ${transaction.hash.slice(0, 10)}…`);
    await transaction.wait();
    toast("Direct Uniswap v4 trade confirmed.");
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
    button.textContent = window.ethereum?.request ? "Trade through Uniswap v4" : "Connect wallet to trade";
  }
}

function setupDirectTrade(launch) {
  state.tradeSource = launch.protocol === "Uniswap v4"
    ? { address: launch.factoryAddress, protocol: launch.protocol }
    : null;
  $("#directV4Trade").hidden = !state.tradeSource;
  if (!state.tradeSource) return;
  $("#directTradeButton").textContent = window.ethereum?.request ? "Trade through Uniswap v4" : "Connect wallet to trade";
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
  const local = readLocalJson(profileKey(creator));
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
      state.creatorImageUrl = URL.createObjectURL(new Blob([avatarBytes], { type: mime }));
      avatar = state.creatorImageUrl;
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
  $("#creatorBioText").textContent = profile?.bio || "This wallet created the token and permanently receives its LP revenue; internal-match launches escrow native ETH before a chart-neutral claim.";
  $("#creatorProfileSource").textContent = resolvedProfile?.source || "Recorded onchain";
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
  $("#detailDescription").textContent = metadata.description || "A fixed-supply token launched directly into permanently locked TOKEN / RWI liquidity.";
  renderTokenLinks(metadata.links);
  $("#detailAddress").textContent = address;
  $("#detailMonogram").textContent = symbol.charAt(0) || "?";
  $("#detailSupply").textContent = formatSupply(supply, decimals);
  $("#detailPair").textContent = `${symbol} / RWI`;
  $("#detailPosition").textContent = `#${launch.positionTokenId}`;
  $("#detailPool").textContent = launch.poolId || launch.pool;
  $("#detailPoolLabel").textContent = launch.poolId ? "v4 pool ID" : "Pool";
  if (metadata.imageUrl) {
    detailArt.style.backgroundImage = `url("${metadata.imageUrl}")`;
    $("#detailMonogram").textContent = "";
  }
  $("#buyOnUniswap").href = uniswapSwapUrl(RWI_ADDRESS, address);
  $("#sellOnUniswap").href = uniswapSwapUrl(address, RWI_ADDRESS);
  $("#uniswapTokenPage").href = `https://app.uniswap.org/explore/tokens/robinhood/${address}`;
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
  renderCreator(launch.creator, creatorProfile);
  $("#tokenPageStatus").hidden = true;
  $("#tokenDetail").hidden = false;
  $("#tokenFacts").hidden = false;
  $("#tokenPageGrid").hidden = false;
}

async function loadTokenPage() {
  const address = new URLSearchParams(window.location.search).get("address");
  if (!isAddress(address) || !configuredFactoryAddresses().length) {
    showTokenPageError("Invalid token address. Return to the launchpad and choose a verified launch.");
    return;
  }
  const normalizedAddress = address.toLowerCase();
  const knownLaunch = KNOWN_LAUNCHES[normalizedAddress] || null;
  const metadataPromise = resolveTokenMetadata(address).catch(() => KNOWN_METADATA[normalizedAddress] || {});
  try {
    if (!window.ethers) throw new Error("The wallet library did not load. Refresh the page and try again.");
    if (knownLaunch) {
      const cachedMetadata = await withTimeout(metadataPromise, 2_500, "Cached token metadata timed out.").catch(() => KNOWN_METADATA[normalizedAddress] || {});
      renderToken({
        address: window.ethers.getAddress(address),
        name: knownLaunch.name,
        symbol: knownLaunch.symbol,
        decimals: knownLaunch.decimals,
        supply: knownLaunch.supply,
        launch: { creator: knownLaunch.creator, pool: knownLaunch.pool, poolId: null, protocol: "Uniswap v3", positionTokenId: knownLaunch.positionTokenId, factoryAddress: null },
        metadata: cachedMetadata,
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
    const [factoryLaunch, name, symbol, decimals, supply, metadata] = await withTimeout(Promise.all([
      findFactoryLaunch(address, provider), token.name(), token.symbol(), token.decimals(), token.totalSupply(), metadataPromise,
    ]), 12_000, "Robinhood Chain did not return token data within 12 seconds.");
    const launch = factoryLaunch.launch;
    const isV4 = factoryLaunch.source.protocol === "Uniswap v4";
    const pool = isV4 ? null : String(launch.pool);
    const poolId = isV4 ? String(launch.poolId) : null;
    if (!isAddress(launch.creator) || sameAddress(launch.creator, window.ethers.ZeroAddress) || !(isV4 ? isPoolId(poolId) : isAddress(pool))) {
      throw new Error("This token was not launched by the configured factory.");
    }
    const creatorProfile = await withTimeout(
      resolveCreatorProfile(launch.creator, provider),
      10_000,
      "The shared creator profile timed out.",
    ).catch(() => ({ profile: readLocalJson(profileKey(launch.creator)), source: "Creator wallet recorded onchain", registryAddress: configuredProfileRegistryAddress() }));
    renderToken({
      address: window.ethers.getAddress(address),
      name,
      symbol,
      decimals: Number(decimals),
      supply,
      launch: { creator: launch.creator, pool, poolId, protocol: factoryLaunch.source.protocol, positionTokenId: BigInt(launch.positionTokenId), factoryAddress: factoryLaunch.factoryAddress },
      metadata,
      creatorProfile,
    });
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
$("#tradeAmount").addEventListener("input", scheduleDirectTradeQuote);
$("#directTradeButton").addEventListener("click", executeDirectTrade);

window.addEventListener?.("beforeunload", () => {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  if (state.creatorImageUrl) URL.revokeObjectURL(state.creatorImageUrl);
});
if (!window.RWI_TOKEN_PAGE_TEST_MODE) window.RWI_TOKEN_PAGE_READY = loadTokenPage();

window.RWITokenPage = {
  uniswapSwapUrl, isAddress, resolveAssetUrl, normalizeSocialUrl, loadTokenPage, withTimeout,
  directTradePoolKey, directTradeCurrencies, encodeDirectV4Swap, validateDirectTradeIntegrations,
};
