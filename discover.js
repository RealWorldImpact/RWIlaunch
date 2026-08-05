(() => {
  "use strict";

  const RELEASE_VERSION = "20260805-discover-page-2";
  const RWI_ADDRESS = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
  const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const FIXED_TOKEN_SUPPLY = 1_000_000_000;
  const CACHE_KEY = "rwi-launchpad-discover-directory-v3";
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const MAX_DIRECTORY_TOKENS = 48;
  const LOG_CHUNK_SIZE = 50_000;
  const FACTORY_CONFIG = window.RWI_FACTORY_CONFIG || {};
  const FACTORY_ABI = window.RWI_FACTORY_ABI || [];
  const QUOTE_FACTORY_CONFIG = window.RWI_QUOTE_FACTORY_CONFIG || {};
  const QUOTE_FACTORY_ABI = window.RWI_QUOTE_FACTORY_ABI || [];
  const V4_EVENT_ABI = [
    "event TokenLaunched(address indexed token,address indexed creator,bytes32 indexed poolId,uint256 positionTokenId,uint128 liquidity,uint256 tokenAmount,uint256 initialQuoteAmount,bool liquidityPermanentlyLocked)",
  ];
  const V3_EVENT_ABI = [
    "event TokenLaunched(address indexed token,address indexed creator,address indexed pool,uint256 positionTokenId,uint128 liquidity,uint256 tokenAmount,uint256 initialRwiAmount,bool liquidityPermanentlyLocked)",
  ];
  const TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
  ];
  const ROBINHOOD_CHAIN = Object.freeze({
    chainId: 4663,
    rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  });

  const state = {
    launches: [],
    sort: new URLSearchParams(window.location.search).get("sort") || "market",
    query: "",
    loading: false,
    provider: null,
    rwiUsdPrice: null,
    rwiUsdPromise: null,
    imageUrls: [],
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function isAddress(value) {
    return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
  }

  function sameAddress(left, right) {
    return String(left || "").toLowerCase() === String(right || "").toLowerCase();
  }

  function finiteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async function withRetry(task, attempts = 3) {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await task();
      } catch (error) {
        lastError = error;
        if (attempt + 1 < attempts) await delay(180 * (attempt + 1));
      }
    }
    throw lastError;
  }

  function toast(message) {
    const node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("is-visible"), 3200);
  }

  async function ensureEthers() {
    if (window.ethers) return window.ethers;
    if (ensureEthers.promise) return ensureEthers.promise;
    ensureEthers.promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `vendor/ethers.umd.min.js?v=${RELEASE_VERSION}`;
      script.async = true;
      script.onload = () => window.ethers ? resolve(window.ethers) : reject(new Error("Market library unavailable"));
      script.onerror = () => reject(new Error("Market library unavailable"));
      document.head.appendChild(script);
    }).catch((error) => {
      ensureEthers.promise = null;
      throw error;
    });
    return ensureEthers.promise;
  }

  function configuredFactorySources() {
    const sources = [];
    const addSource = (source) => {
      if (!isAddress(source?.address) || sources.some((entry) => sameAddress(entry.address, source.address))) return;
      sources.push({ ...source, deploymentBlock: Number(source.deploymentBlock || 0) });
    };
    addSource({
      address: QUOTE_FACTORY_CONFIG.factoryAddress,
      deploymentBlock: QUOTE_FACTORY_CONFIG.deploymentBlock,
      protocol: "Uniswap v4",
      quoteFactory: true,
      current: true,
    });
    (QUOTE_FACTORY_CONFIG.legacyFactories || []).forEach((entry) => addSource({
      ...entry,
      protocol: entry.protocol || "Uniswap v4",
      quoteFactory: true,
      current: false,
    }));
    addSource({
      address: FACTORY_CONFIG.factoryAddress,
      deploymentBlock: FACTORY_CONFIG.deploymentBlock,
      protocol: "Uniswap v4",
      quoteFactory: false,
      current: true,
    });
    (FACTORY_CONFIG.legacyFactories || []).forEach((entry) => addSource({
      ...entry,
      quoteFactory: false,
      current: false,
    }));
    return sources;
  }

  function factoryAbi(source) {
    if (source.protocol === "Uniswap v3") return V3_EVENT_ABI;
    if (source.quoteFactory) return QUOTE_FACTORY_ABI.length ? QUOTE_FACTORY_ABI : V4_EVENT_ABI;
    return source.current && FACTORY_ABI.length ? FACTORY_ABI : V4_EVENT_ABI;
  }

  async function mapLimit(items, limit, worker) {
    const results = new Array(items.length);
    let nextIndex = 0;
    async function run() {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        try {
          results[index] = { status: "fulfilled", value: await worker(items[index], index) };
        } catch (reason) {
          results[index] = { status: "rejected", reason };
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return results;
  }

  async function querySourceLogs(source, latestBlock) {
    const factory = new window.ethers.Contract(source.address, factoryAbi(source), state.provider);
    const filter = factory.filters.TokenLaunched();
    const ranges = [];
    const firstBlock = Math.max(0, Number(source.deploymentBlock || 0));
    for (let from = firstBlock; from <= latestBlock; from += LOG_CHUNK_SIZE) {
      ranges.push([from, Math.min(latestBlock, from + LOG_CHUNK_SIZE - 1)]);
    }
    ranges.reverse();
    const logs = [];
    for (let index = 0; index < ranges.length && logs.length < MAX_DIRECTORY_TOKENS; index += 2) {
      const batch = ranges.slice(index, index + 2);
      const results = await Promise.allSettled(batch.map(([from, to]) => withRetry(() => factory.queryFilter(filter, from, to))));
      results.filter((result) => result.status === "fulfilled").forEach((result) => logs.push(...result.value));
    }
    return logs
      .sort((left, right) => Number(right.blockNumber || 0) - Number(left.blockNumber || 0))
      .slice(0, MAX_DIRECTORY_TOKENS)
      .map((log) => ({ log, source, factory }));
  }

  async function fetchPublicMetadata() {
    if (window.location.protocol === "file:") return new Map();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch("api/token-metadata?all=1", {
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) return new Map();
      const payload = await response.json();
      const entries = Array.isArray(payload) ? payload : payload.tokens;
      return new Map((Array.isArray(entries) ? entries : [])
        .filter((entry) => isAddress(entry?.tokenAddress))
        .map((entry) => [entry.tokenAddress.toLowerCase(), entry]));
    } catch {
      return new Map();
    }
  }

  async function readLaunch(entry, metadata) {
    const { log, source, factory } = entry;
    const args = log.args || factory.interface.parseLog(log)?.args;
    const token = String(args.token);
    const tokenContract = new window.ethers.Contract(token, TOKEN_ABI, state.provider);
    const details = await Promise.allSettled([
      withRetry(() => tokenContract.name()),
      withRetry(() => tokenContract.symbol()),
      withRetry(() => tokenContract.totalSupply()),
      withRetry(() => tokenContract.balanceOf(DEAD_ADDRESS)),
      withRetry(() => tokenContract.balanceOf(ZERO_ADDRESS)),
      source.quoteFactory ? withRetry(() => factory.launches(token)) : Promise.resolve(null),
    ]);
    const supplyRaw = details[2].status === "fulfilled" ? BigInt(details[2].value) : window.ethers.parseUnits(String(FIXED_TOKEN_SUPPLY), 18);
    const deadRaw = details[3].status === "fulfilled" ? BigInt(details[3].value) : 0n;
    const zeroRaw = details[4].status === "fulfilled" ? BigInt(details[4].value) : 0n;
    const burnedRaw = deadRaw + zeroRaw > supplyRaw ? supplyRaw : deadRaw + zeroRaw;
    const burnedSupply = Number(window.ethers.formatUnits(burnedRaw, 18));
    const totalSupply = Number(window.ethers.formatUnits(supplyRaw, 18)) || FIXED_TOKEN_SUPPLY;
    const record = details[5].status === "fulfilled" ? details[5].value : null;
    const quoteSymbol = source.quoteFactory ? (Number(record?.quoteAsset ?? 0) === 0 ? "ETH" : "USDG") : "RWI";
    const publicEntry = metadata.get(token.toLowerCase()) || {};
    return {
      factoryAddress: source.address,
      token,
      pool: source.protocol === "Uniswap v3" ? String(args.pool) : null,
      poolId: source.protocol === "Uniswap v4" ? String(args.poolId) : null,
      creator: String(args.creator),
      name: publicEntry.name || (details[0].status === "fulfilled" ? String(details[0].value) : "Factory token"),
      symbol: publicEntry.symbol || (details[1].status === "fulfilled" ? String(details[1].value) : "TOKEN"),
      description: String(publicEntry.description || ""),
      image: publicEntry.image || publicEntry.logoURI || null,
      quoteSymbol,
      quoteAddress: quoteSymbol === "RWI" ? RWI_ADDRESS : quoteSymbol === "USDG" ? QUOTE_FACTORY_CONFIG.usdgAddress : ZERO_ADDRESS,
      protocol: source.protocol || "Uniswap v4",
      blockNumber: Number(log.blockNumber || 0),
      timestamp: 0,
      totalSupply,
      burnedSupply,
      burnedPercent: totalSupply > 0 ? burnedSupply / totalSupply * 100 : 0,
      marketCapUsd: null,
      liquidityUsd: null,
      marketLoading: true,
    };
  }

  async function attachBlockTimes(launches) {
    const blockNumbers = [...new Set(launches.map((launch) => launch.blockNumber).filter(Boolean))];
    const results = await mapLimit(blockNumbers, 3, (blockNumber) => withRetry(() => state.provider.getBlock(blockNumber)));
    const times = new Map();
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value?.timestamp) times.set(blockNumbers[index], Number(result.value.timestamp));
    });
    launches.forEach((launch) => { launch.timestamp = times.get(launch.blockNumber) || 0; });
  }

  function uniqueEntries(entries) {
    const unique = new Map();
    entries.sort((left, right) => Number(right.log.blockNumber || 0) - Number(left.log.blockNumber || 0))
      .forEach((entry) => {
        const token = String(entry.log.args?.token || "").toLowerCase();
        if (isAddress(token) && !unique.has(token)) unique.set(token, entry);
      });
    return [...unique.values()].slice(0, MAX_DIRECTORY_TOKENS);
  }

  async function hydrateEntries(entries, metadata) {
    const results = await mapLimit(entries, 2, (entry) => readLaunch(entry, metadata));
    const launches = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
    await attachBlockTimes(launches);
    return launches;
  }

  async function fetchDexPairs(tokenAddress) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(`/api/dexscreener-market?token=${encodeURIComponent(tokenAddress)}`, {
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) return [];
      const pairs = await response.json();
      return Array.isArray(pairs) ? pairs : [];
    } finally {
      clearTimeout(timeout);
    }
  }

  function pairTokens(pair) {
    return {
      base: String(pair?.baseToken?.address || ""),
      quote: String(pair?.quoteToken?.address || ""),
    };
  }

  function expectedQuoteAddresses(launch) {
    if (launch.quoteSymbol === "ETH") return [ZERO_ADDRESS, QUOTE_FACTORY_CONFIG.wethAddress, FACTORY_CONFIG.wethAddress].filter(isAddress);
    return [launch.quoteAddress || RWI_ADDRESS].filter(isAddress);
  }

  function selectPair(pairs, launch) {
    return pairs
      .filter((pair) => {
        const { base, quote } = pairTokens(pair);
        const matchesAssets = expectedQuoteAddresses(launch).some((expected) => (
          (sameAddress(base, launch.token) && sameAddress(quote, expected))
          || (sameAddress(quote, launch.token) && sameAddress(base, expected))
        ));
        return pair?.chainId === "robinhood" && pair?.dexId === "uniswap" && matchesAssets;
      })
      .sort((left, right) => (finiteNumber(right?.liquidity?.usd) || 0) - (finiteNumber(left?.liquidity?.usd) || 0))[0] || null;
  }

  function tokenUsdFromPair(pair, tokenAddress) {
    if (!pair) return null;
    const { base, quote } = pairTokens(pair);
    const baseUsd = finiteNumber(pair.priceUsd);
    const nativePrice = finiteNumber(pair.priceNative);
    if (sameAddress(base, tokenAddress)) return baseUsd;
    if (sameAddress(quote, tokenAddress) && baseUsd && nativePrice && nativePrice > 0) return baseUsd / nativePrice;
    return null;
  }

  function quoteFromSqrtPrice(sqrtPriceX96, baseIsToken0) {
    const sqrtPrice = Number(sqrtPriceX96) / (2 ** 96);
    const token1PerToken0 = sqrtPrice * sqrtPrice;
    const quote = baseIsToken0 ? token1PerToken0 : 1 / token1PerToken0;
    return Number.isFinite(quote) && quote > 0 ? quote : null;
  }

  async function readV3Quote(poolAddress, baseToken) {
    const pool = new window.ethers.Contract(poolAddress, [
      "function token0() view returns (address)",
      "function slot0() view returns (uint160 sqrtPriceX96,int24 tick,uint16 observationIndex,uint16 observationCardinality,uint16 observationCardinalityNext,uint8 feeProtocol,bool unlocked)",
    ], state.provider);
    const [token0, slot0] = await Promise.all([pool.token0(), pool.slot0()]);
    return quoteFromSqrtPrice(slot0.sqrtPriceX96 ?? slot0[0], sameAddress(token0, baseToken));
  }

  async function readOnchainTokenQuote(launch) {
    if (launch.poolId) {
      const view = new window.ethers.Contract(FACTORY_CONFIG.uniswapV4StateView || QUOTE_FACTORY_CONFIG.uniswapV4StateView, [
        "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96,int24 tick,uint24 protocolFee,uint24 lpFee)",
      ], state.provider);
      const slot0 = await view.getSlot0(launch.poolId);
      return quoteFromSqrtPrice(slot0.sqrtPriceX96 ?? slot0[0], BigInt(launch.token) < BigInt(launch.quoteAddress));
    }
    if (launch.pool) return readV3Quote(launch.pool, launch.token);
    return null;
  }

  function rwiUsdFromPairs(pairs) {
    return pairs.map((pair) => {
      const { base, quote } = pairTokens(pair);
      const baseUsd = finiteNumber(pair?.priceUsd);
      const nativePrice = finiteNumber(pair?.priceNative);
      let price = null;
      if (sameAddress(base, RWI_ADDRESS)) price = baseUsd;
      if (sameAddress(quote, RWI_ADDRESS) && nativePrice && nativePrice > 0) price = baseUsd === null ? null : baseUsd / nativePrice;
      return { price, liquidity: finiteNumber(pair?.liquidity?.usd) || 0 };
    }).filter((entry) => entry.price && entry.price > 0)
      .sort((left, right) => right.liquidity - left.liquidity)[0]?.price || null;
  }

  async function readRwiUsdPrice() {
    if (state.rwiUsdPrice) return state.rwiUsdPrice;
    if (state.rwiUsdPromise) return state.rwiUsdPromise;
    state.rwiUsdPromise = (async () => {
      try {
        const oracle = new window.ethers.Contract(FACTORY_CONFIG.factoryAddress, ["function ethUsdPriceE18() view returns (uint256)"], state.provider);
        const [ethUsdRaw, wethPerRwi] = await Promise.all([
          oracle.ethUsdPriceE18(),
          readV3Quote(FACTORY_CONFIG.rwiWethOraclePool, RWI_ADDRESS),
        ]);
        const price = Number(window.ethers.formatUnits(ethUsdRaw, 18)) * wethPerRwi;
        if (Number.isFinite(price) && price > 0) return price;
      } catch {
        // The indexed RWI market is the secondary source.
      }
      const price = rwiUsdFromPairs(await fetchDexPairs(RWI_ADDRESS));
      if (!price) throw new Error("RWI price unavailable");
      return price;
    })();
    try {
      state.rwiUsdPrice = await state.rwiUsdPromise;
      return state.rwiUsdPrice;
    } finally {
      state.rwiUsdPromise = null;
    }
  }

  async function readQuoteUsd(launch) {
    if (launch.quoteSymbol === "USDG") return 1;
    if (launch.quoteSymbol === "ETH") {
      const oracle = new window.ethers.Contract(QUOTE_FACTORY_CONFIG.factoryAddress || FACTORY_CONFIG.factoryAddress, ["function ethUsdPriceE18() view returns (uint256)"], state.provider);
      return Number(window.ethers.formatUnits(await oracle.ethUsdPriceE18(), 18));
    }
    return readRwiUsdPrice();
  }

  async function readMarket(launch) {
    try {
      const pair = selectPair(await fetchDexPairs(launch.token), launch);
      const tokenUsd = tokenUsdFromPair(pair, launch.token);
      if (tokenUsd && tokenUsd > 0) {
        return {
          marketCapUsd: tokenUsd * launch.totalSupply,
          liquidityUsd: finiteNumber(pair?.liquidity?.usd),
        };
      }
    } catch {
      // Unindexed v4 pools are priced directly from StateView below.
    }
    const [tokenQuote, quoteUsd] = await Promise.all([readOnchainTokenQuote(launch), readQuoteUsd(launch)]);
    const marketCapUsd = tokenQuote * quoteUsd * launch.totalSupply;
    if (!Number.isFinite(marketCapUsd) || marketCapUsd <= 0) throw new Error("Market unavailable");
    return { marketCapUsd, liquidityUsd: null };
  }

  function formatCompactUsd(value) {
    const number = finiteNumber(value);
    if (!number || number <= 0) return "Unavailable";
    if (number < 1) return `<$${number.toFixed(2)}`;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: number >= 1000 ? "compact" : "standard",
      maximumFractionDigits: number >= 1000 ? 2 : 0,
    }).format(number);
  }

  function formatTokenAmount(value) {
    const number = finiteNumber(value) || 0;
    if (number === 0) return "0";
    if (number < 1) return "<1";
    return new Intl.NumberFormat("en-US", { notation: number >= 1000 ? "compact" : "standard", maximumFractionDigits: 2 }).format(number);
  }

  function formatPercent(value) {
    const number = finiteNumber(value) || 0;
    if (number === 0) return "0%";
    if (number < 0.01) return "<0.01%";
    return `${number.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
  }

  function formatAge(timestamp) {
    if (!timestamp) return "Unknown";
    const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 86400 * 365) return `${Math.floor(seconds / (86400 * 30))}mo ago`;
    return `${Math.floor(seconds / (86400 * 365))}y ago`;
  }

  function safeImageUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(String(value), window.location.href);
      return ["http:", "https:", "data:", "blob:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function artwork(launch) {
    const wrap = element("div", "discover-card-art");
    const imageUrl = safeImageUrl(launch.image);
    if (!imageUrl) {
      wrap.appendChild(element("span", "discover-card-monogram", launch.symbol.charAt(0) || "?"));
      return wrap;
    }
    const image = element("img", "");
    image.src = imageUrl;
    image.alt = `${launch.name} token logo`;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.replaceWith(element("span", "discover-card-monogram", launch.symbol.charAt(0) || "?")), { once: true });
    wrap.appendChild(image);
    return wrap;
  }

  function currentViewLaunches() {
    const query = state.query.trim().toLowerCase();
    const launches = state.launches.filter((launch) => !query || [launch.name, launch.symbol, launch.token]
      .some((value) => String(value || "").toLowerCase().includes(query)));
    return launches.sort((left, right) => {
      if (state.sort === "age") return right.timestamp - left.timestamp || right.blockNumber - left.blockNumber;
      if (state.sort === "burned") return right.burnedSupply - left.burnedSupply || right.burnedPercent - left.burnedPercent || right.blockNumber - left.blockNumber;
      return (finiteNumber(right.marketCapUsd) || -1) - (finiteNumber(left.marketCapUsd) || -1) || right.blockNumber - left.blockNumber;
    });
  }

  function createCard(launch, rank) {
    const card = element("article", "discover-directory-card");
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `Open ${launch.name} token page`);
    const href = `token.html?address=${encodeURIComponent(launch.token)}`;
    const top = element("div", "discover-card-top");
    top.appendChild(artwork(launch));
    const identity = element("div", "discover-card-identity");
    identity.appendChild(element("span", "", `$${launch.symbol}`));
    identity.appendChild(element("h3", "", launch.name));
    top.appendChild(identity);
    const rankLabel = state.sort === "age" ? `NEW #${rank}` : state.sort === "burned" ? `BURN #${rank}` : `CAP #${rank}`;
    top.appendChild(element("span", `discover-card-rank is-${state.sort}`, rankLabel));
    card.appendChild(top);

    if (launch.description) card.appendChild(element("p", "discover-card-description", launch.description));
    const address = element("code", "discover-card-address", launch.token);
    card.appendChild(address);

    const market = element("div", "discover-card-market");
    const cap = element("div", "");
    cap.appendChild(element("span", "", "Market cap"));
    cap.appendChild(element("strong", "", launch.marketLoading ? "Updating…" : formatCompactUsd(launch.marketCapUsd)));
    market.appendChild(cap);
    const age = element("div", "");
    age.appendChild(element("span", "", "Launched"));
    age.appendChild(element("strong", "", formatAge(launch.timestamp)));
    market.appendChild(age);
    const burned = element("div", "");
    burned.appendChild(element("span", "", "Burned"));
    burned.appendChild(element("strong", "", `${formatTokenAmount(launch.burnedSupply)} · ${formatPercent(launch.burnedPercent)}`));
    market.appendChild(burned);
    card.appendChild(market);

    const footer = element("div", "discover-card-footer");
    footer.appendChild(element("span", "", `${launch.quoteSymbol} pair · 1% fee`));
    footer.appendChild(element("strong", "", "View market →"));
    card.appendChild(footer);

    const open = () => { window.location.href = href; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open();
    });
    return card;
  }

  function updateViewCopy() {
    const copy = {
      market: ["Leaderboard", "Highest market cap", "Live USD estimates from each token’s selected Uniswap market."],
      age: ["Recent activity", "Newest launches", "Ordered from the latest confirmed RWI Launch factory events."],
      burned: ["Supply watch", "Most tokens burned", "Dead-address balances read directly from each token contract."],
    }[state.sort] || ["Leaderboard", "Highest market cap", "Live market rankings."];
    $("#discoverViewKicker").textContent = copy[0];
    $("#discoverViewTitle").textContent = copy[1];
    $("#discoverViewDescription").textContent = copy[2];
    $$('[data-discover-sort]').forEach((button) => {
      const active = button.dataset.discoverSort === state.sort;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function render(message = "") {
    updateViewCopy();
    const grid = $("#discoverTokenGrid");
    const launches = currentViewLaunches();
    grid.textContent = "";
    grid.setAttribute("aria-busy", String(state.loading));
    if (!launches.length) {
      const empty = element("div", "discover-directory-empty");
      empty.appendChild(element("strong", "", state.query ? "No matching tokens" : "No launches found"));
      empty.appendChild(element("span", "", state.query ? "Try another name, ticker, or contract address." : "Refresh the directory after the next confirmed launch."));
      grid.appendChild(empty);
    } else {
      launches.forEach((launch, index) => grid.appendChild(createCard(launch, index + 1)));
    }
    const priced = state.launches.filter((launch) => finiteNumber(launch.marketCapUsd) > 0).length;
    const totalBurned = state.launches.reduce((sum, launch) => sum + (finiteNumber(launch.burnedSupply) || 0), 0);
    $("#discoverTotal").textContent = String(state.launches.length);
    $("#discoverPriced").textContent = String(priced);
    $("#discoverBurned").textContent = formatTokenAmount(totalBurned);
    $("#discoverSummary").textContent = message || `${launches.length} shown · ${state.launches.length} confirmed · ${priced} live market${priced === 1 ? "" : "s"}`;
  }

  function readCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!cache || !Array.isArray(cache.launches) || Date.now() - Number(cache.savedAt || 0) > CACHE_TTL_MS) return null;
      return cache;
    } catch {
      return null;
    }
  }

  function writeCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), launches: state.launches }));
    } catch {
      // Private browsing may disable session storage; the directory still works.
    }
  }

  async function loadDirectory({ force = false } = {}) {
    if (state.loading) return;
    if (!force && !state.launches.length) {
      const cache = readCache();
      if (cache?.launches?.length) {
        state.launches = cache.launches.map((launch) => ({ ...launch, marketLoading: false }));
        render("Showing recently refreshed markets · use Refresh for the latest block");
        return;
      }
    }
    state.loading = true;
    const refresh = $("#refreshDiscover");
    refresh.disabled = true;
    refresh.textContent = "Refreshing…";
    if (force) state.rwiUsdPrice = null;
    if (state.launches.length) render("Refreshing confirmed launches and live markets…");
    try {
      await ensureEthers();
      state.provider ||= new window.ethers.JsonRpcProvider(ROBINHOOD_CHAIN.rpcUrl, ROBINHOOD_CHAIN.chainId, { staticNetwork: true });
      const [latestBlock, metadata] = await Promise.all([withRetry(() => state.provider.getBlockNumber()), fetchPublicMetadata()]);
      const sources = configuredFactorySources();
      if (!sources.length) throw new Error("No factories configured");
      const existingDirectoryShown = state.launches.length > 0;
      const currentSources = sources.filter((source) => source.current);
      const legacySources = sources.filter((source) => !source.current);
      const currentResults = await mapLimit(currentSources, 1, (source) => querySourceLogs(source, latestBlock));
      const currentEntries = uniqueEntries(currentResults.filter((result) => result.status === "fulfilled").flatMap((result) => result.value));
      let launches = [];
      if (currentEntries.length) {
        await delay(180);
        launches = await hydrateEntries(currentEntries, metadata);
        if (!existingDirectoryShown) {
          state.launches = launches;
          render(`${launches.length} newest confirmed launch${launches.length === 1 ? "" : "es"} · loading launch history…`);
        }
      }
      const legacyResults = await mapLimit(legacySources, 1, (source) => querySourceLogs(source, latestBlock));
      const selected = uniqueEntries([
        ...currentResults.filter((result) => result.status === "fulfilled").flatMap((result) => result.value),
        ...legacyResults.filter((result) => result.status === "fulfilled").flatMap((result) => result.value),
      ]);
      if (!selected.length) throw new Error("No confirmed launches returned");
      const currentAddresses = new Set(launches.map((launch) => launch.token.toLowerCase()));
      const additionalEntries = selected.filter((entry) => !currentAddresses.has(String(entry.log.args?.token || "").toLowerCase()));
      if (additionalEntries.length) {
        await delay(180);
        launches = [...launches, ...await hydrateEntries(additionalEntries, metadata)]
          .sort((left, right) => right.blockNumber - left.blockNumber)
          .slice(0, MAX_DIRECTORY_TOKENS);
      }
      if (!launches.length) throw new Error("Token details unavailable");
      state.launches = launches;
      render(`${launches.length} confirmed launch${launches.length === 1 ? "" : "es"} · updating live markets…`);
      await delay(250);
      const marketResults = await mapLimit(launches, 2, (launch) => withRetry(() => readMarket(launch), 2));
      marketResults.forEach((result, index) => {
        if (result.status === "fulfilled") Object.assign(launches[index], result.value);
        launches[index].marketLoading = false;
      });
      state.launches = launches;
      writeCache();
      render();
    } catch (error) {
      if (state.launches.length) {
        render("Live refresh was interrupted · showing the last successful directory");
        toast("Refresh interrupted. Existing market data is still available.");
      } else {
        render("The live directory is temporarily unavailable · try Refresh again");
        toast("The directory could not reach Robinhood Chain.");
      }
    } finally {
      state.loading = false;
      refresh.disabled = false;
      refresh.textContent = "Refresh ↻";
      $("#discoverTokenGrid").setAttribute("aria-busy", "false");
    }
  }

  function chooseSort(sort) {
    if (!["market", "age", "burned"].includes(sort)) return;
    state.sort = sort;
    const url = new URL(window.location.href);
    url.searchParams.set("sort", sort);
    window.history.replaceState(null, "", url);
    render();
  }

  if (!["market", "age", "burned"].includes(state.sort)) state.sort = "market";
  $$('[data-discover-sort]').forEach((button) => button.addEventListener("click", () => chooseSort(button.dataset.discoverSort)));
  $("#discoverSearch").addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });
  $("#refreshDiscover").addEventListener("click", () => loadDirectory({ force: true }));
  window.addEventListener("beforeunload", () => state.imageUrls.forEach((url) => URL.revokeObjectURL(url)));
  updateViewCopy();
  loadDirectory();
})();
