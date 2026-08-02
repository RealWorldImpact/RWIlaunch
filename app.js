const RWI_ADDRESS = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const FIXED_TOKEN_SUPPLY = 1_000_000_000n;
const FIXED_POOL_ALLOCATION_BPS = 10_000;
const OPENING_TOKENS_PER_RWI = 1_003_806n;
const FACTORY_CONFIG = window.RWI_FACTORY_CONFIG || Object.freeze({});
const FACTORY_ABI = window.RWI_FACTORY_ABI || Object.freeze([]);
const FACTORY_DEPLOYMENT = window.RWI_FACTORY_DEPLOYMENT || Object.freeze({});
const DRAFT_KEY = "rwi-launchpad-draft-v2";
const LOGO_DATABASE = "rwi-launchpad-assets-v1";
const LOGO_STORE = "logos";
const DRAFT_LOGO_KEY = "current-draft-logo";
const LOGO_SIZE = 512;
const LIQUIDITY_MODEL = Object.freeze({
  venue: "Uniswap v3",
  poolFee: FACTORY_CONFIG.poolFee || 10000,
  pairAsset: "$RWI",
  pairAssetAddress: RWI_ADDRESS,
  uniswapV3Factory: FACTORY_CONFIG.uniswapV3Factory || "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA",
  nonfungiblePositionManager: FACTORY_CONFIG.nonfungiblePositionManager || "0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3",
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
  openingTokensPerRwiApprox: OPENING_TOKENS_PER_RWI.toString(),
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
  rwiBalance: null,
  rwiDecimals: 18,
  saveTimer: null,
  launchInFlight: false,
  lastLaunchTx: null,
  lastTokenAddress: null,
  lastPoolAddress: null,
  factoryDeploymentInFlight: false,
  lastFactoryAddress: null,
  creatorLaunches: [],
  dashboardLoading: false,
  dashboardRequestId: 0,
  activeClaimPosition: null,
  profileAvatarData: null,
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const fields = {
  name: $("#tokenName"), ticker: $("#tokenTicker"), description: $("#tokenDescription"),
  image: $("#tokenImage"),
  website: $("#website"), twitter: $("#twitter"), telegram: $("#telegram"),
  lock: $("#lockLiquidity"),
};

function cleanTicker(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

function getEconomics() {
  const supply = FIXED_TOKEN_SUPPLY;
  const pool = supply;
  const creator = 0n;
  const rate = OPENING_TOKENS_PER_RWI;
  return { supply, pool, creator, rate };
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
  $("#previewLiquidity").textContent = "0 RWI upfront";
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

function configuredFactoryAddress() {
  return isAddress(FACTORY_CONFIG.factoryAddress) ? FACTORY_CONFIG.factoryAddress : null;
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
      : "Launch factory deployment pending";
    status.classList.remove("is-live");
    status.parentElement?.classList.remove("is-live");
    $("#deployFactoryButton").hidden = !FACTORY_CONFIG.allowBrowserDeployment;
    return;
  }
  const stateLabel = FACTORY_CONFIG.sourceVerified ? "Source-verified launch factory live" : "Launch factory active locally";
  status.textContent = `${stateLabel} · ${factoryAddress.slice(0, 6)}…${factoryAddress.slice(-4)}`;
  status.classList.add("is-live");
  status.parentElement?.classList.add("is-live");
  $("#deployFactoryButton").hidden = true;
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

function closeCropper() {
  $("#cropModal").hidden = true;
  if ($("#launchModal").hidden) document.body.style.overflow = "";
  state.cropDragging = null;
  state.cropSourceImage = null;
  if (state.cropSourceUrl) URL.revokeObjectURL(state.cropSourceUrl);
  state.cropSourceUrl = null;
  state.cropInputFile = null;
  fields.image.value = "";
}

function openCropper(file) {
  if (!file) return;
  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
  if (!allowedTypes.has(file.type)) return toast("Choose a PNG, JPG, WEBP, or GIF image.");
  if (file.size > 5 * 1024 * 1024) return toast("Image must be smaller than 5MB.");
  if (state.cropSourceUrl) URL.revokeObjectURL(state.cropSourceUrl);
  state.cropInputFile = file;
  state.cropSourceUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    state.cropSourceImage = image;
    state.cropOffsetX = 0;
    state.cropOffsetY = 0;
    $("#cropZoom").value = "1";
    $("#cropModal").hidden = false;
    document.body.style.overflow = "hidden";
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
    state.originalImageFile = state.cropInputFile;
    setProcessedLogo(file);
    closeCropper();
    toast("Square 512×512 logo ready.");
  } catch {
    toast("The crop could not be saved. Try again.");
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
  $("#logoStatus").textContent = "Every logo is standardized to a square 512×512 PNG and saved with the draft.";
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
  clearImage();
  updatePreview();
  $("#draftStatus").textContent = "Fresh draft";
  toast("Draft reset.");
}

async function ensureRobinhoodChain() {
  if (!window.ethereum) throw new Error("No browser wallet found");
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (current.toLowerCase() === ROBINHOOD_CHAIN.chainId) return;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ROBINHOOD_CHAIN.chainId }] });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [ROBINHOOD_CHAIN] });
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
    $("#modalWallet").textContent = "Deploy factory with wallet";
    return;
  }
  if (state.lastLaunchTx) {
    $("#modalWallet").textContent = "View transaction ↗";
  } else if (configuredFactoryAddress()) {
    $("#modalWallet").textContent = "Launch on Uniswap";
  } else {
    $("#modalWallet").textContent = "Factory deployment pending";
  }
}

async function readRwiBalance() {
  if (!state.account || !window.ethereum) return;
  $("#rwiBalance").textContent = "Reading…";
  try {
    const paddedAccount = state.account.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const [balanceHex, decimalsHex] = await Promise.all([
      window.ethereum.request({ method: "eth_call", params: [{ to: RWI_ADDRESS, data: `0x70a08231${paddedAccount}` }, "latest"] }),
      window.ethereum.request({ method: "eth_call", params: [{ to: RWI_ADDRESS, data: "0x313ce567" }, "latest"] }),
    ]);
    state.rwiBalance = balanceHex && balanceHex !== "0x" ? BigInt(balanceHex) : 0n;
    state.rwiDecimals = decimalsHex && decimalsHex !== "0x" ? Number(BigInt(decimalsHex)) : 18;
  } catch {
    state.rwiBalance = null;
  }
  updateBalanceState();
}

async function connectWallet() {
  if (!window.ethereum) {
    toast("No EVM browser wallet found. Install Robinhood Wallet or MetaMask.");
    return false;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    state.account = accounts[0] || null;
    await ensureRobinhoodChain();
    renderAccount();
    await readRwiBalance();
    await loadCreatorDashboard();
    toast("Connected to Robinhood Chain.");
    return Boolean(state.account);
  } catch (error) {
    toast(error?.message ? `Wallet: ${error.message}` : "Wallet connection was cancelled.");
    return false;
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

function loadCreatorProfile() {
  if (!state.account) return;
  let profile = null;
  try {
    profile = JSON.parse(localStorage.getItem(creatorProfileKey(state.account)) || "null");
  } catch {
    localStorage.removeItem(creatorProfileKey(state.account));
  }
  $("#creatorName").value = profile?.name || "";
  $("#creatorBio").value = profile?.bio || "";
  state.profileAvatarData = profile?.avatar || null;
  $("#creatorBioCount").textContent = `${$("#creatorBio").value.length} / 160`;
  $("#profileStatus").textContent = profile
    ? "Profile loaded for this creator wallet. Changes are saved to this browser."
    : "Profile details are saved to this browser for the connected wallet.";
  renderProfileAvatar();
}

function setRevenueMessage(message) {
  const list = $("#revenueList");
  list.textContent = "";
  list.appendChild(dashboardElement("div", "dashboard-empty", message));
}

function renderDashboardAccess() {
  const connected = Boolean(state.account);
  $("#dashboardGate").hidden = connected;
  $("#dashboardContent").hidden = !connected;
  if (!connected) {
    state.dashboardRequestId += 1;
    state.dashboardLoading = false;
    state.creatorLaunches = [];
    state.profileAvatarData = null;
    $("#creatorTokenCount").textContent = "0 launches";
    setRevenueMessage("Connect your wallet to load creator revenue.");
    return;
  }
  const shortAddress = `${state.account.slice(0, 6)}…${state.account.slice(-4)}`;
  $("#profileWallet").textContent = state.account;
  $("#feeRecipient").textContent = shortAddress;
  loadCreatorProfile();
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
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    const scale = Math.max(256 / image.naturalWidth, 256 / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.fillStyle = "#e8e5dc";
    context.fillRect(0, 0, 256, 256);
    context.drawImage(image, (256 - width) / 2, (256 - height) / 2, width, height);
    state.profileAvatarData = canvas.toDataURL("image/jpeg", 0.88);
    renderProfileAvatar();
    $("#profileStatus").textContent = "Profile picture ready. Save profile to keep it.";
  } catch {
    toast("That profile picture could not be processed.");
  } finally {
    URL.revokeObjectURL(objectUrl);
    $("#profileImage").value = "";
  }
}

function saveCreatorProfile(event) {
  event.preventDefault();
  if (!state.account) return toast("Connect the creator wallet first.");
  const name = $("#creatorName").value.trim();
  const bio = $("#creatorBio").value.trim();
  if (name && name.length < 2) return toast("Creator name must be at least 2 characters or left blank.");
  const profile = { name, bio, avatar: state.profileAvatarData, wallet: state.account, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(creatorProfileKey(state.account), JSON.stringify(profile));
    $("#profileStatus").textContent = "Profile saved to this browser for the connected wallet.";
    toast("Creator profile saved.");
  } catch {
    toast("Profile storage is unavailable in this browser.");
  }
}

async function queryCreatorLaunchLogs(contract, provider, creator) {
  const latestBlock = await provider.getBlockNumber();
  const firstBlock = Number(FACTORY_CONFIG.deploymentBlock || 0);
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

async function readCreatorLaunch(eventLog, provider, factory) {
  const args = eventLog.args || factory.interface.parseLog(eventLog)?.args;
  const token = String(args.token);
  const pool = String(args.pool);
  const positionTokenId = BigInt(args.positionTokenId);
  const tokenContract = new window.ethers.Contract(token, ["function name() view returns (string)", "function symbol() view returns (string)"], provider);
  const [nameResult, symbolResult, feeResult] = await Promise.allSettled([
    tokenContract.name(),
    tokenContract.symbol(),
    factory.collectFees.staticCall(positionTokenId),
  ]);
  const fees = feeResult.status === "fulfilled"
    ? splitCollectedFees(token, feeResult.value[0], feeResult.value[1])
    : { tokenFees: null, rwiFees: null };
  return {
    token,
    pool,
    positionTokenId,
    name: nameResult.status === "fulfilled" ? nameResult.value : "Creator token",
    symbol: symbolResult.status === "fulfilled" ? symbolResult.value : "TOKEN",
    tokenFees: fees.tokenFees,
    rwiFees: fees.rwiFees,
    blockNumber: Number(eventLog.blockNumber || 0),
  };
}

function dashboardElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function feeLabel(amount, symbol) {
  if (amount === null) return `Unavailable ${symbol}`;
  return `${formatUnits(amount, 18, 6)} ${symbol}`;
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
    top.appendChild(dashboardElement("span", "position-chip", `Position #${launch.positionTokenId}`));
    card.appendChild(top);

    const fees = dashboardElement("div", "revenue-fees");
    const rwiFee = dashboardElement("div", "");
    rwiFee.appendChild(dashboardElement("span", "", "Collectible RWI"));
    rwiFee.appendChild(dashboardElement("strong", "", feeLabel(launch.rwiFees, "RWI")));
    const tokenFee = dashboardElement("div", "");
    tokenFee.appendChild(dashboardElement("span", "", `Collectible ${launch.symbol}`));
    tokenFee.appendChild(dashboardElement("strong", "", feeLabel(launch.tokenFees, launch.symbol)));
    const claim = dashboardElement("button", "claim-revenue", "Claim revenue");
    claim.type = "button";
    const knownEmpty = launch.rwiFees === 0n && launch.tokenFees === 0n;
    claim.disabled = knownEmpty || state.activeClaimPosition !== null;
    if (knownEmpty) claim.textContent = "No fees yet";
    claim.addEventListener("click", () => claimCreatorRevenue(launch, claim));
    fees.appendChild(rwiFee);
    fees.appendChild(tokenFee);
    fees.appendChild(claim);
    card.appendChild(fees);
    list.appendChild(card);

    readLogoAsset(`token:${launch.token.toLowerCase()}`).then((record) => {
      if (!record?.blob || !avatar.isConnected) return;
      const imageUrl = URL.createObjectURL(record.blob);
      avatar.style.backgroundImage = `url("${imageUrl}")`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.textContent = "";
      setTimeout(() => URL.revokeObjectURL(imageUrl), 60_000);
    }).catch(() => {});
  }
}

async function loadCreatorDashboard({ silent = false } = {}) {
  renderDashboardAccess();
  if (!state.account) return;
  if (!window.ethers || !configuredFactoryAddress()) {
    setRevenueMessage("The verified factory integration is unavailable.");
    return;
  }
  const requestedAccount = state.account;
  const requestId = ++state.dashboardRequestId;
  state.dashboardLoading = true;
  $("#refreshRevenue").disabled = true;
  if (!silent) setRevenueMessage("Reading creator launches and collectible fees…");
  try {
    const provider = new window.ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId !== 4663n) throw new Error("Switch the wallet to Robinhood Chain to load creator revenue.");
    const factory = new window.ethers.Contract(configuredFactoryAddress(), FACTORY_ABI, provider);
    const logs = await queryCreatorLaunchLogs(factory, provider, requestedAccount);
    const launches = await Promise.all(logs.map((log) => readCreatorLaunch(log, provider, factory)));
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

async function claimCreatorRevenue(launch, button) {
  if (!state.account || state.activeClaimPosition !== null) return;
  state.activeClaimPosition = launch.positionTokenId;
  button.disabled = true;
  button.textContent = "Confirm in wallet…";
  try {
    await ensureRobinhoodChain();
    const provider = new window.ethers.BrowserProvider(window.ethereum);
    await validateFactoryDeployment(provider, configuredFactoryAddress());
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (!sameAddress(signerAddress, state.account)) throw new Error("Connected wallet changed. Refresh the dashboard.");
    const factory = new window.ethers.Contract(configuredFactoryAddress(), FACTORY_ABI, signer);
    const recordedCreator = await factory.positionCreators(launch.positionTokenId);
    if (!sameAddress(recordedCreator, signerAddress)) throw new Error("This wallet is not the recorded creator for that position.");
    const transaction = await factory.collectFees(launch.positionTokenId);
    button.textContent = "Claiming revenue…";
    const receipt = await transaction.wait();
    let collected = null;
    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed?.name === "FeesCollected" && BigInt(parsed.args.positionTokenId) === launch.positionTokenId) collected = parsed.args;
      } catch {
        // Unrelated token and pool logs are ignored.
      }
    }
    if (collected) {
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
    button.textContent = "Claim revenue";
  }
}

function sameAddress(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
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

  const factory = new ethers.Contract(address, FACTORY_ABI, provider);
  const [rwi, uniswapFactory, positionManager, immutableRwi, immutableFactory, immutableManager, chainId, poolFee, initialRwi, poolAllocation, maxDust, locked, creatorFeeShare] = await Promise.all([
    factory.RWI(),
    factory.UNISWAP_V3_FACTORY(),
    factory.NONFUNGIBLE_POSITION_MANAGER(),
    factory.rwi(),
    factory.uniswapFactory(),
    factory.positionManager(),
    factory.ROBINHOOD_CHAIN_ID(),
    factory.POOL_FEE(),
    factory.INITIAL_RWI_LIQUIDITY(),
    factory.POOL_ALLOCATION_BPS(),
    factory.MAX_LOCKED_TOKEN_DUST(),
    factory.LIQUIDITY_PERMANENTLY_LOCKED(),
    factory.CREATOR_LP_FEE_SHARE_BPS(),
  ]);

  if (!sameAddress(rwi, RWI_ADDRESS) || !sameAddress(immutableRwi, rwi)) throw new Error("Factory RWI integration mismatch.");
  if (!sameAddress(uniswapFactory, FACTORY_CONFIG.uniswapV3Factory) || !sameAddress(immutableFactory, uniswapFactory)) throw new Error("Factory Uniswap integration mismatch.");
  if (!sameAddress(positionManager, FACTORY_CONFIG.nonfungiblePositionManager) || !sameAddress(immutableManager, positionManager)) throw new Error("Factory position-manager integration mismatch.");
  if (chainId !== 4663n || poolFee !== 10_000n || initialRwi !== 0n || poolAllocation !== 10_000n || maxDust !== ethers.parseEther("1") || !locked || creatorFeeShare !== 10_000n) {
    throw new Error("Factory launch rules do not match this reviewed build.");
  }
  return ethers.keccak256(code);
}

function openFactoryDeploymentModal() {
  const modal = $(".launch-modal");
  modal.classList.add("is-factory-deploy");
  $("#modalToken").hidden = true;
  $("#downloadBrief").hidden = true;
  $("#modalTitle").textContent = "Deploy the launch factory.";
  $("#modalCopy").textContent = "Your wallet will deploy the reviewed custom factory on Robinhood Chain. This is a one-time, irreversible mainnet transaction paid in ETH; it does not require RWI.";
  $("#modalNote").textContent = "This custom factory has completed an internal review but not an independent professional audit. Confirm only if you accept that risk.";
  $("#modalWallet").textContent = state.account ? "Deploy factory with wallet" : "Connect wallet to deploy";
  $("#modalWallet").dataset.action = "deploy-factory";
  $("#launchModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function restoreLaunchModal() {
  $(".launch-modal").classList.remove("is-factory-deploy");
  $("#modalToken").hidden = false;
  $("#downloadBrief").hidden = false;
  $("#downloadBrief").textContent = state.imageFile ? "Download metadata kit" : "Download launch brief";
  delete $("#downloadBrief").dataset.action;
  $("#geckoTerminalButton").hidden = true;
  $("#modalCopy").textContent = "One transaction deploys exactly 1 billion tokens and allocates 100% of the supply to a token-only TOKEN / $RWI position. You supply no $RWI; first buyers bring it through swaps. The LP position is locked forever.";
}

async function deployFactoryWithWallet() {
  const button = $("#modalWallet");
  if (!FACTORY_CONFIG.allowBrowserDeployment) return toast("Browser factory deployment is available only from the local launchpad.");
  if (!window.ethers || !FACTORY_ABI.length || !FACTORY_DEPLOYMENT.bytecode) return toast("Factory deployment bundle did not load. Refresh and try again.");
  if (!state.account && !(await connectWallet())) return;

  state.factoryDeploymentInFlight = true;
  button.disabled = true;
  try {
    await ensureRobinhoodChain();
    const provider = new window.ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    state.account = await signer.getAddress();
    renderAccount();

    button.textContent = "Confirm deployment in wallet…";
    $("#modalNote").textContent = "Review the Robinhood Chain gas charge in your wallet. The transaction creates the launch factory and cannot be reversed.";
    const contractFactory = new window.ethers.ContractFactory(FACTORY_ABI, FACTORY_DEPLOYMENT.bytecode, signer);
    const factory = await contractFactory.deploy();
    const deploymentTransaction = factory.deploymentTransaction();
    button.textContent = "Deploying factory…";
    $("#modalNote").textContent = `Transaction submitted · ${deploymentTransaction.hash.slice(0, 10)}…`;
    await factory.waitForDeployment();
    const address = await factory.getAddress();
    await validateFactoryDeployment(provider, address);

    localStorage.setItem(FACTORY_CONFIG.factoryAddressStorageKey, address);
    state.lastFactoryAddress = address;
    $("#modalTitle").textContent = "Factory deployed and validated.";
    $("#modalCopy").textContent = `${address} is now the local launch factory. Activate it to enable token launches in this browser.`;
    $("#modalNote").textContent = "Source verification on Blockscout is still required before treating this as a public production deployment.";
    $("#downloadBrief").hidden = false;
    $("#downloadBrief").textContent = "Copy factory address";
    $("#downloadBrief").dataset.action = "copy-factory";
    button.textContent = "Activate factory";
    button.dataset.action = "activate-factory";
    toast("Factory deployed and bytecode validated.");
  } catch (error) {
    const message = readableWalletError(error).replace(/^Launch reverted:/, "Deployment reverted:");
    $("#modalNote").textContent = message;
    button.textContent = "Try factory deployment again";
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
    openFactoryDeploymentModal();
    toast("Deploy the launch factory before launching a token.");
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
    await ensureRobinhoodChain();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    state.account = signerAddress;
    await validateFactoryDeployment(provider, factoryAddress);

    const launchFactory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
    const params = {
      name: fields.name.value.trim(),
      symbol: cleanTicker(fields.ticker.value),
    };

    button.textContent = "Confirm launch in wallet…";
    $("#modalNote").textContent = FACTORY_CONFIG.independentAuditComplete
      ? "One transaction · Deploy the token, seed token-only liquidity, and lock the LP position forever. No $RWI approval required."
      : "Source verified · Internal security review only; no independent audit. Confirm the launch transaction only if you accept that risk.";
    const transaction = await launchFactory.launch(params);
    button.textContent = "Creating Uniswap pool…";
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

    state.lastLaunchTx = transaction.hash;
    state.lastTokenAddress = launchEvent?.args.token || null;
    state.lastPoolAddress = launchEvent?.args.pool || null;
    if (state.lastTokenAddress && state.imageFile) {
      saveLogoAsset(`token:${String(state.lastTokenAddress).toLowerCase()}`, state.imageFile).catch(() => {});
    }
    $("#modalTitle").textContent = "Your token is live.";
    $("#modalCopy").textContent = "The pool is registered onchain and the standardized logo is saved in this browser. Download the metadata kit for the public listing workflow. GeckoTerminal may keep the page hidden until real swaps bring priced RWI into the zero-RWI pool.";
    $("#modalNote").textContent = launchEvent
      ? `Token ${launchEvent.args.token.slice(0, 8)}… paired with $RWI in pool ${launchEvent.args.pool.slice(0, 8)}…. LP locked forever; no graduation step.`
      : "Launch confirmed. The TOKEN / $RWI pool is live, its LP is locked forever, and there is no graduation step.";
    if (state.lastPoolAddress) $("#geckoTerminalButton").hidden = false;
    toast("Token launched directly into $RWI liquidity on Uniswap.");
    await readRwiBalance();
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
  if (!window.ethereum) return;
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    state.account = accounts[0] || null;
    renderAccount();
    if (state.account) {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
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
  const brief = {
    generatedAt: new Date().toISOString(),
    status: configuredFactoryAddress() ? "launch-enabled" : "factory-deployment-pending",
    launchModel: LIQUIDITY_MODEL,
    token: { address: state.lastTokenAddress, name: fields.name.value.trim(), ticker, description: fields.description.value.trim(), imageFileName: state.imageFile?.name || null, supply: FIXED_TOKEN_SUPPLY.toString(), decimals: 18, supplyPolicy: "fixed-one-billion-no-future-minting" },
    links: { website: fields.website.value.trim(), twitter: fields.twitter.value.trim(), telegram: fields.telegram.value.trim() },
    network: { name: ROBINHOOD_CHAIN.chainName, chainId: 4663, rpc: ROBINHOOD_CHAIN.rpcUrls[0], explorer: ROBINHOOD_CHAIN.blockExplorerUrls[0] },
    pairing: { venue: "Uniswap v3", pool: state.lastPoolAddress, geckoTerminalUrl: state.lastPoolAddress ? `https://www.geckoterminal.com/robinhood/pools/${state.lastPoolAddress.toLowerCase()}` : null, poolFee: LIQUIDITY_MODEL.poolFee, asset: "$RWI", address: RWI_ADDRESS, initialRwiLiquidity: "0", initialLiquidityMode: "single-sided-token-position", firstBuyersSupplyRwi: true, poolAllocationPercent: 100, creatorTokenAllocationPercent: 0, tokensEnteringPool: economics.pool.toString(), openingTokensPerRwiApprox: economics.rate.toString(), liquidityLock: "permanent", liquidityWithdrawable: false, lpFeeRecipient: "token-creator", creatorLpFeeShareBps: 10000, launchpadLpFeeShareBps: 0 },
    listing: { metadataVersion: 1, metadataReady: Boolean(state.imageFile), logo: state.imageFile ? { fileName: state.imageFile.name, mimeType: "image/png", width: LOGO_SIZE, height: LOGO_SIZE, crop: "square-cover", browserAssetKey: state.lastTokenAddress ? `token:${String(state.lastTokenAddress).toLowerCase()}` : DRAFT_LOGO_KEY } : null, imageRequiresPublicHosting: Boolean(state.imageFile), poolStartsWithPricedRwi: false, discoveryRequiresRealRwiSwaps: true, geckoTerminalInfoUpdateUrl: "https://www.geckoterminal.com/request-form/update-token" },
    note: configuredFactoryAddress()
      ? "The factory uses a token-only Uniswap v3 position, so the creator supplies no RWI. First buyers bring RWI through swaps. The LP position is locked forever with no migration or graduation state."
      : "The custom launch factory is compiled but must be independently audited and deployed before transactions are enabled.",
  };
  const metadataName = `${ticker.toLowerCase()}-metadata.json`;
  const metadataBlob = new Blob([JSON.stringify(brief, null, 2)], { type: "application/json" });
  if (state.imageFile) {
    const zip = await createZip([
      { name: metadataName, data: metadataBlob },
      { name: state.imageFile.name || `${ticker.toLowerCase()}-logo.png`, data: state.imageFile },
    ]);
    downloadFile(zip, `${ticker.toLowerCase()}-listing-kit.zip`);
    toast("Listing kit downloaded with metadata and 512×512 logo.");
    return;
  }
  downloadFile(metadataBlob, metadataName);
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

function openGeckoTerminalPool() {
  if (!state.lastPoolAddress) return;
  window.open(`https://www.geckoterminal.com/robinhood/pools/${state.lastPoolAddress.toLowerCase()}`, "_blank", "noopener,noreferrer");
}

fields.name.addEventListener("input", updatePreview);
fields.ticker.addEventListener("input", updatePreview);
fields.description.addEventListener("input", updatePreview);
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
$("#geckoTerminalButton").addEventListener("click", openGeckoTerminalPool);
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
$("#refreshRevenue").addEventListener("click", () => loadCreatorDashboard());
$("#creatorProfileForm").addEventListener("submit", saveCreatorProfile);
$("#profileImage").addEventListener("change", (event) => processProfileImage(event.target.files[0]));
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
  $("#modalNote").textContent = "One transaction · no $RWI approval · 100% of supply enters the locked pool.";
  $("#modalWallet").textContent = "Preparing…";
  delete $("#modalWallet").dataset.action;
  $("#launchModal").hidden = false;
  document.body.style.overflow = "hidden";
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
  document.body.style.overflow = "";
}
$("#modalClose").addEventListener("click", closeModal);
$("#launchModal").addEventListener("click", (event) => { if (event.target === $("#launchModal")) closeModal(); });
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!$("#cropModal").hidden) closeCropper();
  else if (!$("#launchModal").hidden) closeModal();
});

if (window.ethereum?.on) {
  window.ethereum.on("accountsChanged", async (accounts) => {
    state.account = accounts[0] || null;
    state.rwiBalance = null;
    renderAccount();
    if (state.account) {
      await readRwiBalance();
      await loadCreatorDashboard();
    }
  });
  window.ethereum.on("chainChanged", async (chainId) => {
    state.rwiBalance = null;
    updateBalanceState();
    if (chainId.toLowerCase() === ROBINHOOD_CHAIN.chainId && state.account) {
      await readRwiBalance();
      await loadCreatorDashboard();
    } else if (state.account) {
      setRevenueMessage("Switch the wallet to Robinhood Chain to load creator revenue.");
    }
    toast("Wallet network changed.");
  });
}

restoreDraft();
restoreDraftLogo();
renderIntegrationStatus();
updatePreview();
renderDashboardAccess();
syncWallet();

window.RWILaunchpad = { RWI_ADDRESS, ROBINHOOD_CHAIN, LIQUIDITY_MODEL, FACTORY_CONFIG };
