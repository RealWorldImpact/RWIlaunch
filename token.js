const RWI_ADDRESS = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const FACTORY_CONFIG = window.RWI_FACTORY_CONFIG || Object.freeze({});
const FACTORY_ABI = window.RWI_FACTORY_ABI || Object.freeze([]);
const PROFILE_REGISTRY_CONFIG = window.RWI_PROFILE_REGISTRY || Object.freeze({});
const PROFILE_REGISTRY_ABI = window.RWI_PROFILE_REGISTRY_ABI || Object.freeze([]);
const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const EXPLORER_URL = "https://robinhoodchain.blockscout.com";
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
const state = { token: null, creator: null, pool: null, positionTokenId: null, imageUrl: null, creatorImageUrl: null };

function isAddress(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

function sameAddress(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}

function configuredFactoryAddresses() {
  const addresses = [];
  if (isAddress(FACTORY_CONFIG.factoryAddress)) addresses.push(FACTORY_CONFIG.factoryAddress);
  for (const entry of FACTORY_CONFIG.legacyFactories || []) {
    if (isAddress(entry?.address) && !addresses.some((address) => sameAddress(address, entry.address))) addresses.push(entry.address);
  }
  return addresses;
}

async function findFactoryLaunch(address, provider) {
  for (const factoryAddress of configuredFactoryAddresses()) {
    try {
      const factory = new window.ethers.Contract(factoryAddress, FACTORY_ABI, provider);
      const launch = await factory.launches(address);
      if (isAddress(launch.creator) && !sameAddress(launch.creator, window.ethers.ZeroAddress) && isAddress(launch.pool)) {
        return { launch, factoryAddress };
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
  $("#creatorBioText").textContent = profile?.bio || "This wallet created the token and permanently receives 100% of collectible LP fees.";
  $("#creatorProfileSource").textContent = resolvedProfile?.source || "Recorded onchain";
  $("#creatorExplorer").href = `${EXPLORER_URL}/address/${creator}`;
  const registryAddress = resolvedProfile?.registryAddress;
  $("#profileRegistryExplorer").hidden = !registryAddress;
  if (registryAddress) $("#profileRegistryExplorer").href = `${EXPLORER_URL}/address/${registryAddress}`;
  const initial = (profile?.name?.charAt(0) || creator.slice(2, 3)).toUpperCase();
  $("#creatorPageInitial").textContent = initial;
  if (profile?.avatar) {
    $("#creatorPageAvatar").style.backgroundImage = `url("${profile.avatar}")`;
    $("#creatorPageInitial").textContent = "";
  }
}

function renderToken({ address, name, symbol, supply, decimals, launch, metadata, creatorProfile }) {
  state.token = address;
  state.creator = launch.creator;
  state.pool = launch.pool;
  state.positionTokenId = launch.positionTokenId;
  document.title = `${name} ($${symbol}) · RWI Launchpad`;
  $("#detailName").textContent = name;
  $("#detailSymbol").textContent = `$${symbol}`;
  $("#detailDescription").textContent = metadata.description || "A fixed-supply token launched directly into permanently locked TOKEN / RWI liquidity.";
  renderTokenLinks(metadata.links);
  $("#detailAddress").textContent = address;
  $("#detailMonogram").textContent = symbol.charAt(0) || "?";
  $("#detailSupply").textContent = formatSupply(supply, decimals);
  $("#detailPair").textContent = `${symbol} / RWI`;
  $("#detailPosition").textContent = `#${launch.positionTokenId}`;
  $("#detailPool").textContent = launch.pool;
  if (metadata.imageUrl) {
    $("#detailArt").style.backgroundImage = `url("${metadata.imageUrl}")`;
    $("#detailMonogram").textContent = "";
  }
  $("#buyOnUniswap").href = uniswapSwapUrl(RWI_ADDRESS, address);
  $("#sellOnUniswap").href = uniswapSwapUrl(address, RWI_ADDRESS);
  $("#uniswapTokenPage").href = `https://app.uniswap.org/explore/tokens/robinhood/${address}`;
  $("#poolExplorer").href = `${EXPLORER_URL}/address/${launch.pool}`;
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
        launch: { creator: knownLaunch.creator, pool: knownLaunch.pool, positionTokenId: knownLaunch.positionTokenId },
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
    if (!isAddress(launch.creator) || sameAddress(launch.creator, window.ethers.ZeroAddress) || !isAddress(launch.pool)) {
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
      launch: { creator: launch.creator, pool: launch.pool, positionTokenId: BigInt(launch.positionTokenId) },
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

window.addEventListener?.("beforeunload", () => {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  if (state.creatorImageUrl) URL.revokeObjectURL(state.creatorImageUrl);
});
if (!window.RWI_TOKEN_PAGE_TEST_MODE) window.RWI_TOKEN_PAGE_READY = loadTokenPage();

window.RWITokenPage = { uniswapSwapUrl, isAddress, resolveAssetUrl, normalizeSocialUrl, loadTokenPage, withTimeout };
