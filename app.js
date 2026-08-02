const RWI_ADDRESS = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const FIXED_TOKEN_SUPPLY = 1_000_000_000n;
const FIXED_POOL_ALLOCATION_BPS = 10_000;
const OPENING_TOKENS_PER_RWI = 1_003_806n;
const FACTORY_CONFIG = window.RWI_FACTORY_CONFIG || Object.freeze({});
const FACTORY_ABI = window.RWI_FACTORY_ABI || Object.freeze([]);
const FACTORY_DEPLOYMENT = window.RWI_FACTORY_DEPLOYMENT || Object.freeze({});
const DRAFT_KEY = "rwi-launchpad-draft-v2";
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
  rwiBalance: null,
  rwiDecimals: 18,
  saveTimer: null,
  launchInFlight: false,
  lastLaunchTx: null,
  factoryDeploymentInFlight: false,
  lastFactoryAddress: null,
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
  if (fields.name.value.trim().length >= 2) score += 50;
  if (fields.ticker.value.trim().length >= 2) score += 50;
  return Math.min(score, 100);
}

function updatePreview() {
  const name = fields.name.value.trim() || "Your token";
  const ticker = cleanTicker(fields.ticker.value) || "TOKEN";
  const description = fields.description.value.trim() || "Description optional · launch with only a name and ticker.";
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

function handleImage(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return toast("Choose a PNG, JPG, WEBP, or GIF image.");
  if (file.size > 5 * 1024 * 1024) return toast("Image must be smaller than 5MB.");
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = URL.createObjectURL(file);
  $("#uploadZone").classList.add("has-image");
  $("#uploadArt").style.backgroundImage = `url("${state.imageUrl}")`;
  $("#previewImage").classList.add("has-image");
  $("#previewImage").style.backgroundImage = `url("${state.imageUrl}")`;
  $("#modalAvatar").style.backgroundImage = `url("${state.imageUrl}")`;
  $("#modalAvatar").textContent = "";
  $("#removeImage").hidden = false;
  updatePreview();
  queueDraftSave();
}

function clearImage() {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = null;
  fields.image.value = "";
  $("#uploadZone").classList.remove("has-image");
  $("#uploadArt").style.backgroundImage = "";
  $("#previewImage").classList.remove("has-image");
  $("#previewImage").style.backgroundImage = "";
  $("#modalAvatar").style.backgroundImage = "";
  $("#removeImage").hidden = true;
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
    return;
  }
  button.textContent = `${state.account.slice(0, 6)}…${state.account.slice(-4)}`;
  button.classList.add("is-connected");
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
  $("#downloadBrief").textContent = "Download launch brief";
  delete $("#downloadBrief").dataset.action;
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
    $("#modalTitle").textContent = "Your token is live.";
    $("#modalNote").textContent = launchEvent
      ? `Token ${launchEvent.args.token.slice(0, 8)}… paired with $RWI in pool ${launchEvent.args.pool.slice(0, 8)}…. LP locked forever; no graduation step.`
      : "Launch confirmed. The TOKEN / $RWI pool is live, its LP is locked forever, and there is no graduation step.";
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
      if (chainId.toLowerCase() === ROBINHOOD_CHAIN.chainId) await readRwiBalance();
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

function downloadLaunchBrief() {
  const economics = getEconomics();
  const ticker = cleanTicker(fields.ticker.value) || "TOKEN";
  const brief = {
    generatedAt: new Date().toISOString(),
    status: configuredFactoryAddress() ? "launch-enabled" : "factory-deployment-pending",
    launchModel: LIQUIDITY_MODEL,
    token: { name: fields.name.value.trim(), ticker, description: fields.description.value.trim(), supply: FIXED_TOKEN_SUPPLY.toString(), decimals: 18, supplyPolicy: "fixed-one-billion-no-future-minting" },
    links: { website: fields.website.value.trim(), twitter: fields.twitter.value.trim(), telegram: fields.telegram.value.trim() },
    network: { name: ROBINHOOD_CHAIN.chainName, chainId: 4663, rpc: ROBINHOOD_CHAIN.rpcUrls[0], explorer: ROBINHOOD_CHAIN.blockExplorerUrls[0] },
    pairing: { venue: "Uniswap v3", poolFee: LIQUIDITY_MODEL.poolFee, asset: "$RWI", address: RWI_ADDRESS, initialRwiLiquidity: "0", initialLiquidityMode: "single-sided-token-position", firstBuyersSupplyRwi: true, poolAllocationPercent: 100, creatorTokenAllocationPercent: 0, tokensEnteringPool: economics.pool.toString(), openingTokensPerRwiApprox: economics.rate.toString(), liquidityLock: "permanent", liquidityWithdrawable: false, lpFeeRecipient: "token-creator", creatorLpFeeShareBps: 10000, launchpadLpFeeShareBps: 0 },
    note: configuredFactoryAddress()
      ? "The factory uses a token-only Uniswap v3 position, so the creator supplies no RWI. First buyers bring RWI through swaps. The LP position is locked forever with no migration or graduation state."
      : "The custom launch factory is compiled but must be independently audited and deployed before transactions are enabled.",
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(brief, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ticker.toLowerCase()}-launch-brief.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  downloadLaunchBrief();
}

fields.name.addEventListener("input", updatePreview);
fields.ticker.addEventListener("input", updatePreview);
fields.description.addEventListener("input", updatePreview);
fields.image.addEventListener("change", (event) => handleImage(event.target.files[0]));
Object.values(fields).filter((field) => field && field !== fields.image).forEach((field) => {
  field.addEventListener("input", queueDraftSave);
  field.addEventListener("change", queueDraftSave);
});
$("#removeImage").addEventListener("click", clearImage);
$("#resetDraft").addEventListener("click", resetDraft);
$("#copyRwiAddress").addEventListener("click", copyRwiAddress);
$("#downloadBrief").addEventListener("click", handleModalSecondary);
$("#deployFactoryButton").addEventListener("click", openFactoryDeploymentModal);

const uploadZone = $("#uploadZone");
["dragenter", "dragover"].forEach((eventName) => uploadZone.addEventListener(eventName, (event) => {
  event.preventDefault(); uploadZone.classList.add("is-dragging");
}));
["dragleave", "drop"].forEach((eventName) => uploadZone.addEventListener(eventName, (event) => {
  event.preventDefault(); uploadZone.classList.remove("is-dragging");
}));
uploadZone.addEventListener("drop", (event) => handleImage(event.dataTransfer.files[0]));

$("#walletButton").addEventListener("click", connectWallet);
$("#modalWallet").addEventListener("click", handleModalPrimary);

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
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !$("#launchModal").hidden) closeModal(); });

if (window.ethereum?.on) {
  window.ethereum.on("accountsChanged", async (accounts) => { state.account = accounts[0] || null; state.rwiBalance = null; renderAccount(); if (state.account) await readRwiBalance(); });
  window.ethereum.on("chainChanged", async (chainId) => { state.rwiBalance = null; updateBalanceState(); if (chainId.toLowerCase() === ROBINHOOD_CHAIN.chainId && state.account) await readRwiBalance(); toast("Wallet network changed."); });
}

restoreDraft();
renderIntegrationStatus();
updatePreview();
syncWallet();

window.RWILaunchpad = { RWI_ADDRESS, ROBINHOOD_CHAIN, LIQUIDITY_MODEL, FACTORY_CONFIG };
