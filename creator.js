const RWI_ADDRESS = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const EXPLORER_URL = "https://robinhoodchain.blockscout.com";
const FACTORY_CONFIG = window.RWI_FACTORY_CONFIG || Object.freeze({});
const FACTORY_ABI = window.RWI_FACTORY_ABI || Object.freeze([]);
const QUOTE_FACTORY_CONFIG = window.RWI_QUOTE_FACTORY_CONFIG || Object.freeze({});
const QUOTE_FACTORY_ABI = window.RWI_QUOTE_FACTORY_ABI || Object.freeze([]);
const PROFILE_REGISTRY_CONFIG = window.RWI_PROFILE_REGISTRY || Object.freeze({});
const PROFILE_REGISTRY_ABI = window.RWI_PROFILE_REGISTRY_ABI || Object.freeze([]);
const INTERNAL_MATCH_FEE_MODE = "internal-match-eth";
const MULTI_QUOTE_FEE_MODE = "internal-match-eth-90-10";
const TOKEN_SUPPLY = 1_000_000_000n;
const SWAP_SCAN_BLOCKS = 750_000;
const MAX_TRADES = 30;
const CHUNK_SIZE = 50_000;
const LEGACY_V4_FACTORY_ABI = Object.freeze([
  "event TokenLaunched(address indexed token,address indexed creator,bytes32 indexed poolId,uint256 positionTokenId,uint128 liquidity,uint256 tokenAmount,uint256 initialRwiAmount,bool liquidityPermanentlyLocked)",
]);
const LEGACY_FACTORY_ABI = Object.freeze([
  "event TokenLaunched(address indexed token,address indexed creator,address indexed pool,uint256 positionTokenId,uint128 liquidity,uint256 tokenAmount,uint256 initialRwiAmount,bool liquidityPermanentlyLocked)",
]);
const V4_SWAP_ABI = Object.freeze([
  "event Swap(bytes32 indexed id,address indexed sender,int128 amount0,int128 amount1,uint160 sqrtPriceX96,uint128 liquidity,int24 tick,uint24 fee)",
]);
const V3_SWAP_ABI = Object.freeze([
  "event Swap(address indexed sender,address indexed recipient,int256 amount0,int256 amount1,uint160 sqrtPriceX96,uint128 liquidity,int24 tick)",
]);
const KNOWN_IMAGES = Object.freeze({
  "0xc29d66d54d2ed13fffdc89323e5a9d70c197eaec": "assets/testcoin.png",
});

const $ = (selector) => document.querySelector(selector);
const state = { avatarUrl: null };

function isAddress(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

function sameAddress(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}

function factorySources() {
  const sources = [];
  if (isAddress(QUOTE_FACTORY_CONFIG.factoryAddress)) sources.push({
    address: QUOTE_FACTORY_CONFIG.factoryAddress,
    deploymentBlock: Number(QUOTE_FACTORY_CONFIG.deploymentBlock || 0),
    protocol: "Uniswap v4",
    feeMode: MULTI_QUOTE_FEE_MODE,
  });
  for (const entry of QUOTE_FACTORY_CONFIG.legacyFactories || []) {
    if (!isAddress(entry?.address) || sources.some((source) => sameAddress(source.address, entry.address))) continue;
    sources.push({
      ...entry,
      deploymentBlock: Number(entry.deploymentBlock || 0),
      protocol: "Uniswap v4",
      feeMode: MULTI_QUOTE_FEE_MODE,
    });
  }
  if (isAddress(FACTORY_CONFIG.factoryAddress)) sources.push({
    address: FACTORY_CONFIG.factoryAddress,
    deploymentBlock: Number(FACTORY_CONFIG.deploymentBlock || 0),
    protocol: "Uniswap v4",
    feeMode: FACTORY_CONFIG.rewardMode || FACTORY_CONFIG.feeMode || "eth",
  });
  for (const entry of FACTORY_CONFIG.legacyFactories || []) {
    if (!isAddress(entry?.address) || sources.some((source) => sameAddress(source.address, entry.address))) continue;
    sources.push({ ...entry, deploymentBlock: Number(entry.deploymentBlock || 0) });
  }
  return sources;
}

function factoryAbi(source) {
  if (source.protocol !== "Uniswap v4") return LEGACY_FACTORY_ABI;
  if (source.feeMode === MULTI_QUOTE_FEE_MODE) return QUOTE_FACTORY_ABI;
  return source.feeMode === INTERNAL_MATCH_FEE_MODE ? FACTORY_ABI : LEGACY_V4_FACTORY_ABI;
}

async function queryLogsInBatches(contract, filter, firstBlock, latestBlock) {
  const ranges = [];
  for (let from = firstBlock; from <= latestBlock; from += CHUNK_SIZE) ranges.push([from, Math.min(latestBlock, from + CHUNK_SIZE - 1)]);
  const logs = [];
  for (let index = 0; index < ranges.length; index += 3) {
    const batches = await Promise.allSettled(
      ranges.slice(index, index + 3).map(([from, to]) => contract.queryFilter(filter, from, to)),
    );
    const completed = batches.filter((batch) => batch.status === "fulfilled");
    completed.forEach((batch) => logs.push(...batch.value));
    if (!completed.length) throw batches[0].reason;
  }
  return logs;
}

async function readMetadata(token) {
  try {
    const url = new URL("api/token-metadata", new URL(".", window.location.href));
    url.searchParams.set("token", token);
    const response = await fetch(url, { headers: { accept: "application/json" } });
    return response.ok ? response.json() : {};
  } catch {
    return {};
  }
}

function assetUrl(value) {
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return new URL(String(value).replace(/^\//, ""), new URL(".", window.location.href)).href;
}

async function readCreatorLaunch(eventLog, source, provider) {
  const factory = new window.ethers.Contract(source.address, factoryAbi(source), provider);
  const args = eventLog.args || factory.interface.parseLog(eventLog)?.args;
  const token = String(args.token);
  const tokenContract = new window.ethers.Contract(token, ["function name() view returns(string)", "function symbol() view returns(string)"], provider);
  const launchRecordPromise = source.feeMode === MULTI_QUOTE_FEE_MODE ? factory.launches(token) : Promise.resolve(null);
  const [nameResult, symbolResult, metadataResult, blockResult, recordResult] = await Promise.allSettled([
    tokenContract.name(), tokenContract.symbol(), readMetadata(token), provider.getBlock(eventLog.blockNumber), launchRecordPromise,
  ]);
  const metadata = metadataResult.status === "fulfilled" ? metadataResult.value : {};
  const record = recordResult.status === "fulfilled" ? recordResult.value : null;
  const quoteSymbol = source.feeMode === MULTI_QUOTE_FEE_MODE ? (Number(record?.quoteAsset ?? 0) === 0 ? "ETH" : "USDG") : "RWI";
  const quoteAddress = quoteSymbol === "ETH" ? window.ethers.ZeroAddress : quoteSymbol === "USDG" ? QUOTE_FACTORY_CONFIG.usdgAddress : RWI_ADDRESS;
  return {
    token,
    creator: String(args.creator),
    poolId: source.protocol === "Uniswap v4" ? String(args.poolId) : null,
    pool: source.protocol === "Uniswap v4" ? null : String(args.pool),
    protocol: source.protocol,
    factoryAddress: source.address,
    blockNumber: Number(eventLog.blockNumber || 0),
    timestamp: blockResult.status === "fulfilled" ? Number(blockResult.value?.timestamp || 0) : 0,
    quoteSymbol,
    quoteAddress,
    quoteDecimals: quoteSymbol === "USDG" ? 6 : 18,
    transactionHash: eventLog.transactionHash,
    name: nameResult.status === "fulfilled" ? String(nameResult.value) : "Creator token",
    symbol: symbolResult.status === "fulfilled" ? String(symbolResult.value) : "TOKEN",
    metadata,
  };
}

async function loadCreatorLaunches(creator, provider, latestBlock) {
  const results = await Promise.allSettled(factorySources().map(async (source) => {
    const factory = new window.ethers.Contract(source.address, factoryAbi(source), provider);
    const filter = factory.filters.TokenLaunched(null, creator, null);
    const logs = await queryLogsInBatches(factory, filter, source.deploymentBlock, latestBlock);
    const launches = await Promise.allSettled(logs.map((log) => readCreatorLaunch(log, source, provider)));
    return launches.filter((launch) => launch.status === "fulfilled").map((launch) => launch.value);
  }));
  const unique = new Map();
  results.filter((result) => result.status === "fulfilled").flatMap((result) => result.value)
    .sort((left, right) => right.blockNumber - left.blockNumber)
    .forEach((launch) => { if (!unique.has(launch.token.toLowerCase())) unique.set(launch.token.toLowerCase(), launch); });
  return [...unique.values()];
}

function profileMimeType(value) {
  return ({ 1: "image/jpeg", 2: "image/png", 3: "image/webp" })[Number(value)] || null;
}

async function imageAllowed(blob) {
  try {
    const imageDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const response = await fetch(new URL("api/image-safety", new URL(".", window.location.href)), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ purpose: "profile-picture", imageDataUrl }),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.allowed === true;
  } catch {
    return false;
  }
}

async function queryLatestProfileEvent(registry, creator, version, provider, latestBlock) {
  const firstBlock = Number(PROFILE_REGISTRY_CONFIG.deploymentBlock || 0);
  const filter = registry.filters.ProfileUpdated(creator, version);
  for (let to = latestBlock; to >= firstBlock; to -= CHUNK_SIZE * 3) {
    const floor = Math.max(firstBlock, to - CHUNK_SIZE * 3 + 1);
    const ranges = [];
    for (let from = floor; from <= to; from += CHUNK_SIZE) ranges.push([from, Math.min(to, from + CHUNK_SIZE - 1)]);
    const batches = await Promise.all(ranges.map(([from, end]) => registry.queryFilter(filter, from, end)));
    const logs = batches.flat().sort((left, right) => Number(right.blockNumber) - Number(left.blockNumber));
    if (logs.length) return logs[0];
  }
  return null;
}

async function loadProfile(creator, provider, latestBlock) {
  if (!isAddress(PROFILE_REGISTRY_CONFIG.address) || !PROFILE_REGISTRY_ABI.length) return { name: "Launch creator", bio: "This wallet creates tokens on RWI Launch.", avatar: null, source: "Creator wallet recorded onchain" };
  try {
    const registry = new window.ethers.Contract(PROFILE_REGISTRY_CONFIG.address, PROFILE_REGISTRY_ABI, provider);
    const profile = await registry.profiles(creator);
    const version = BigInt(profile.version);
    if (!version) return { name: "Launch creator", bio: "This wallet creates tokens on RWI Launch.", avatar: null, source: "Creator wallet recorded onchain" };
    const event = await queryLatestProfileEvent(registry, creator, version, provider, latestBlock);
    const avatarBytes = event ? window.ethers.getBytes(event.args.avatar) : new Uint8Array();
    let avatar = null;
    const mime = profileMimeType(profile.avatarMimeType);
    if (avatarBytes.length && mime && window.ethers.keccak256(avatarBytes) === profile.avatarHash) {
      const blob = new Blob([avatarBytes], { type: mime });
      if (await imageAllowed(blob)) {
        state.avatarUrl = URL.createObjectURL(blob);
        avatar = state.avatarUrl;
      }
    }
    return { name: profile.name || "Launch creator", bio: profile.bio || "This wallet creates tokens on RWI Launch.", avatar, source: `Onchain profile v${version}` };
  } catch {
    return { name: "Launch creator", bio: "This wallet creates tokens on RWI Launch.", avatar: null, source: "Creator wallet recorded onchain" };
  }
}

async function queryRecentSwapLogs(launch, provider, latestBlock) {
  const firstBlock = Math.max(launch.blockNumber, latestBlock - SWAP_SCAN_BLOCKS);
  const address = launch.poolId
    ? (QUOTE_FACTORY_CONFIG.uniswapV4PoolManager || FACTORY_CONFIG.uniswapV4PoolManager)
    : launch.pool;
  const contract = new window.ethers.Contract(address, launch.poolId ? V4_SWAP_ABI : V3_SWAP_ABI, provider);
  const filter = launch.poolId ? contract.filters.Swap(launch.poolId) : contract.filters.Swap();
  const logs = [];
  for (let to = latestBlock; to >= firstBlock && logs.length < 12; to -= CHUNK_SIZE) {
    const from = Math.max(firstBlock, to - CHUNK_SIZE + 1);
    logs.push(...await contract.queryFilter(filter, from, to));
  }
  return logs.map((log) => {
    const args = log.args || contract.interface.parseLog(log)?.args;
    const tokenIs0 = BigInt(launch.token) < BigInt(launch.quoteAddress || RWI_ADDRESS);
    const tokenDelta = BigInt(tokenIs0 ? args.amount0 : args.amount1);
    const quoteDelta = BigInt(tokenIs0 ? args.amount1 : args.amount0);
    return {
      launch,
      side: tokenDelta > 0n ? "sell" : "buy",
      tokenAmount: tokenDelta < 0n ? -tokenDelta : tokenDelta,
      quoteAmount: quoteDelta < 0n ? -quoteDelta : quoteDelta,
      sender: String(args.sender),
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
    };
  });
}

async function loadRecentTrades(launches, provider, latestBlock) {
  const results = await Promise.allSettled(launches.slice(0, 12).map((launch) => queryRecentSwapLogs(launch, provider, latestBlock)));
  const trades = results.filter((result) => result.status === "fulfilled").flatMap((result) => result.value)
    .sort((left, right) => right.blockNumber - left.blockNumber).slice(0, MAX_TRADES);
  const blocks = new Map();
  await Promise.all([...new Set(trades.map((trade) => trade.blockNumber))].map(async (blockNumber) => {
    try { blocks.set(blockNumber, await provider.getBlock(blockNumber)); } catch { /* Keep the trade without a timestamp. */ }
  }));
  trades.forEach((trade) => { trade.timestamp = Number(blocks.get(trade.blockNumber)?.timestamp || 0); });
  return trades;
}

function formatAmount(value, decimals = 18, maximumFractionDigits = 4) {
  const number = Number(window.ethers.formatUnits(value, decimals));
  if (!Number.isFinite(number)) return "—";
  if (number > 0 && number < 0.0001) return number.toExponential(3);
  return number.toLocaleString("en-US", { maximumFractionDigits });
}

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function renderProfile(creator, profile, launches) {
  document.title = `${profile.name} · RWI Launchpad`;
  $("#creatorPageName").textContent = profile.name;
  $("#creatorPageBio").textContent = profile.bio;
  $("#creatorPageAddress").textContent = creator;
  $("#creatorAddressExplorer").href = `${EXPLORER_URL}/address/${creator}`;
  $("#creatorProfileSource").textContent = profile.source;
  $("#creatorHeroInitial").textContent = (profile.name.charAt(0) || creator.slice(2, 3)).toUpperCase();
  if (profile.avatar) {
    $("#creatorHeroAvatar").style.backgroundImage = `url("${profile.avatar}")`;
    $("#creatorHeroInitial").textContent = "";
  }
  $("#creatorLaunchCount").textContent = String(launches.length);
  const oldest = [...launches].sort((left, right) => left.blockNumber - right.blockNumber)[0];
  $("#creatorSince").textContent = oldest?.timestamp ? new Date(oldest.timestamp * 1000).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";
}

function renderLaunches(launches) {
  const grid = $("#creatorLaunchGrid");
  grid.textContent = "";
  if (!launches.length) {
    grid.innerHTML = '<div class="creator-panel-empty">No confirmed RWI Launch tokens were found for this wallet.</div>';
    return;
  }
  launches.forEach((launch) => {
    const card = document.createElement("article");
    card.className = "creator-launch-card";
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `Open ${launch.name} token page`);
    const art = document.createElement("div");
    art.className = "creator-launch-art";
    const image = assetUrl(launch.metadata?.image || launch.metadata?.imageUrl || KNOWN_IMAGES[launch.token.toLowerCase()]);
    if (image) art.style.backgroundImage = `url("${image}")`;
    else {
      const monogram = document.createElement("span");
      monogram.textContent = launch.symbol.charAt(0) || "?";
      art.appendChild(monogram);
    }
    const copy = document.createElement("div");
    copy.className = "creator-launch-copy";
    const date = launch.timestamp ? new Date(launch.timestamp * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : `Block ${launch.blockNumber.toLocaleString()}`;
    const meta = document.createElement("span");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const address = document.createElement("code");
    meta.textContent = `$${launch.symbol} · ${date}`;
    title.textContent = launch.name;
    description.textContent = launch.metadata?.description || `Fixed one-billion supply with permanently locked TOKEN / ${launch.quoteSymbol || "RWI"} liquidity.`;
    address.textContent = launch.token;
    copy.append(meta, title, description, address);
    card.append(art, copy);
    const open = () => { window.location.href = `token.html?address=${encodeURIComponent(launch.token)}`; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
    grid.appendChild(card);
  });
}

function renderTrades(trades) {
  const list = $("#creatorTradeList");
  list.textContent = "";
  $("#creatorTradeCount").textContent = String(trades.length);
  if (!trades.length) {
    list.innerHTML = '<div class="creator-panel-empty">No recent swaps were found in this creator’s token/RWI markets.</div>';
    return;
  }
  trades.forEach((trade) => {
    const row = document.createElement("a");
    row.className = "creator-trade-row";
    row.href = `${EXPLORER_URL}/tx/${trade.transactionHash}`;
    row.target = "_blank";
    row.rel = "noreferrer";
    const time = trade.timestamp ? new Date(trade.timestamp * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : `Block ${trade.blockNumber.toLocaleString()}`;
    row.innerHTML = `<span class="creator-trade-side is-${trade.side}">${trade.side}</span><span class="creator-trade-copy"><strong></strong><span></span></span><span class="creator-trade-value"><strong></strong><span></span></span>`;
    row.querySelector(".creator-trade-copy strong").textContent = `$${trade.launch.symbol} · ${formatAmount(trade.tokenAmount)} tokens`;
    row.querySelector(".creator-trade-copy span").textContent = `${time} · ${shortAddress(trade.sender)}`;
    row.querySelector(".creator-trade-value strong").textContent = `${formatAmount(trade.quoteAmount, trade.launch.quoteDecimals)} ${trade.launch.quoteSymbol || "RWI"}`;
    row.querySelector(".creator-trade-value span").textContent = "View transaction ↗";
    list.appendChild(row);
  });
}

function showError(message) {
  const status = $("#creatorPageStatus");
  $("#creatorPageContent").hidden = true;
  status.hidden = false;
  status.textContent = "";
  const title = document.createElement("strong");
  title.textContent = "Creator profile could not load";
  const detail = document.createElement("span");
  detail.textContent = String(message || "Unknown creator-page error.").slice(0, 220);
  const back = document.createElement("a");
  back.href = "index.html#discover";
  back.textContent = "Return to all launches";
  status.append(title, detail, back);
}

async function loadCreatorPage() {
  const creator = new URLSearchParams(window.location.search).get("address");
  if (!isAddress(creator) || !window.ethers) return showError("Choose a valid creator from a token page.");
  try {
    const normalizedCreator = window.ethers.getAddress(creator);
    let profile = { name: "Launch creator", bio: "This wallet creates tokens on RWI Launch.", avatar: null, source: "Creator wallet recorded onchain" };
    let launches = [];
    renderProfile(normalizedCreator, profile, launches);
    const provider = new window.ethers.JsonRpcProvider(RPC_URL, 4663, { staticNetwork: true });
    const latestBlock = await provider.getBlockNumber();
    const profilePromise = loadProfile(creator, provider, latestBlock).then((loadedProfile) => {
      profile = loadedProfile;
      renderProfile(normalizedCreator, profile, launches);
      return profile;
    }).catch(() => profile);
    launches = await loadCreatorLaunches(creator, provider, latestBlock);
    renderProfile(normalizedCreator, profile, launches);
    renderLaunches(launches);
    $("#creatorPageStatus").hidden = true;
    $("#creatorPageContent").hidden = false;
    $("#creatorPageContent").setAttribute("aria-busy", "false");
    profilePromise.catch(() => {});
    const trades = await loadRecentTrades(launches, provider, latestBlock);
    renderTrades(trades);
  } catch (error) {
    showError(error?.message || "Creator profile data is temporarily unavailable.");
  }
}

window.addEventListener?.("beforeunload", () => { if (state.avatarUrl) URL.revokeObjectURL(state.avatarUrl); });
loadCreatorPage();
