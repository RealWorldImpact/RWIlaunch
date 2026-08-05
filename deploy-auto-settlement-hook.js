const AUTO_CHAIN = Object.freeze({
  chainId: "0x1237",
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
});
const AUTO_DEVELOPER_WALLET = "0x9CD7C9196A4C1836A3DF089cb210272e07e6A5e5";
const AUTO_CREATE2_HELPER = "0xc9B89693d27476ff0DC799Aa2E41C6f9524FAFB7";
const AUTO_CREATE2_HELPER_RUNTIME_HASH = "0xb9fe0b176dba4f366689b957676e31bb78f9089484d66bee919dfbc401c8ab95";
const AUTO_REQUIRED_FLAGS = 0x2088n;
const AUTO_HOOK_MASK = 0x3fffn;
const AUTO_DEPLOYMENT = window.RWI_QUOTE_FACTORY_DEPLOYMENT || {};
const AUTO_ABI = window.RWI_QUOTE_FACTORY_ABI || [];
const AUTO_HELPER_ABI = ["function deploy(bytes32 salt,bytes creationCode) returns(address deployed)"];
const autoProviders = new Map();
const autoState = { wallet: null, account: null, deploying: false, result: null };
const auto$ = (selector) => document.querySelector(selector);

window.addEventListener?.("eip6963:announceProvider", (event) => {
  if (!event?.detail?.provider?.request) return;
  const key = event.detail.info?.uuid || event.detail.info?.rdns || String(autoProviders.size);
  autoProviders.set(key, event.detail.provider);
});
window.dispatchEvent?.(new Event("eip6963:requestProvider"));

function autoStatus(message) { auto$("#deployStatus").textContent = message; }
function autoSameAddress(left, right) { return String(left).toLowerCase() === String(right).toLowerCase(); }
function autoShortAddress(address) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }

async function autoWalletProvider() {
  if (autoState.wallet?.request) return autoState.wallet;
  if (window.ethereum?.request) autoState.wallet = window.ethereum;
  if (!autoState.wallet) {
    window.dispatchEvent?.(new Event("eip6963:requestProvider"));
    await new Promise((resolve) => setTimeout(resolve, 180));
    autoState.wallet = autoProviders.values().next().value || null;
  }
  if (!autoState.wallet?.request) throw new Error("Open this page in a browser with an EVM wallet.");
  return autoState.wallet;
}

async function autoEnsureChain(wallet) {
  const chainId = await wallet.request({ method: "eth_chainId" });
  if (String(chainId).toLowerCase() === AUTO_CHAIN.chainId) return;
  try {
    await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: AUTO_CHAIN.chainId }] });
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await wallet.request({ method: "wallet_addEthereumChain", params: [AUTO_CHAIN] });
  }
}

function autoSyncButtons() {
  auto$("#connectWallet").textContent = autoState.account ? autoShortAddress(autoState.account) : "Connect wallet";
  auto$("#deployHook").disabled = autoState.deploying || !autoState.account || !auto$("#riskAccepted").checked;
}

async function autoConnect() {
  try {
    const wallet = await autoWalletProvider();
    const accounts = await wallet.request({ method: "eth_requestAccounts" });
    await autoEnsureChain(wallet);
    autoState.account = accounts[0] || null;
    if (!autoSameAddress(autoState.account, AUTO_DEVELOPER_WALLET)) {
      throw new Error(`Connect the developer wallet ${AUTO_DEVELOPER_WALLET}.`);
    }
    autoStatus(`Developer wallet connected · ${autoState.account}`);
  } catch (error) {
    autoState.account = null;
    autoStatus(error?.message || "Wallet connection failed.");
  }
  autoSyncButtons();
}

function autoMineSalt(deployerAddress, creationCodeHash) {
  for (let candidate = 0n; candidate < 1_000_000n; candidate += 1n) {
    const salt = window.ethers.zeroPadValue(window.ethers.toBeHex(candidate), 32);
    const address = window.ethers.getCreate2Address(deployerAddress, salt, creationCodeHash);
    if ((BigInt(address) & AUTO_HOOK_MASK) === AUTO_REQUIRED_FLAGS) return { salt, address };
  }
  throw new Error("No valid v4 hook address was found in the bounded CREATE2 search.");
}

function autoNormalizeImmutableSlots(bytecode, references = {}) {
  const bytes = String(bytecode || "").replace(/^0x/, "").toLowerCase().split("");
  for (const entries of Object.values(references)) {
    for (const entry of entries) {
      const start = Number(entry.start) * 2;
      const end = start + Number(entry.length) * 2;
      for (let index = start; index < end; index += 1) bytes[index] = "0";
    }
  }
  return bytes.join("");
}

async function autoValidate(provider, address) {
  const code = await provider.getCode(address);
  const runtimeBytes = (code.length - 2) / 2;
  if (code === "0x" || runtimeBytes > 24_576) throw new Error("The deployed hook is missing or exceeds the EVM size limit.");
  if ((BigInt(address) & AUTO_HOOK_MASK) !== AUTO_REQUIRED_FLAGS) throw new Error("The deployed address has invalid v4 hook permissions.");
  const expected = autoNormalizeImmutableSlots(AUTO_DEPLOYMENT.deployedBytecode, AUTO_DEPLOYMENT.immutableReferences);
  const actual = autoNormalizeImmutableSlots(code, AUTO_DEPLOYMENT.immutableReferences);
  if (!expected || actual !== expected) throw new Error("The deployed runtime does not match this automatic-settlement build.");
  const hook = new window.ethers.Contract(address, AUTO_ABI, provider);
  const [developer, creatorShare, developerShare, locked, active, staged, count] = await Promise.all([
    hook.developerWallet(), hook.CREATOR_LP_FEE_SHARE_BPS(), hook.DEVELOPER_LP_FEE_SHARE_BPS(),
    hook.LIQUIDITY_PERMANENTLY_LOCKED(), hook.INITIAL_ACTIVE_TOKEN_BPS(), hook.STAGED_TOKEN_BPS(),
    hook.STAGED_POSITION_COUNT(),
  ]);
  if (!autoSameAddress(developer, AUTO_DEVELOPER_WALLET)) throw new Error("Developer wallet mismatch.");
  if (creatorShare !== 9_000n || developerShare !== 1_000n || !locked || active !== 2_500n || staged !== 7_500n || count !== 10n) {
    throw new Error("Revenue or progressive-liquidity rules do not match the reviewed build.");
  }
  return { runtimeCodeHash: window.ethers.keccak256(code), runtimeBytes };
}

async function autoDeploy() {
  if (autoState.deploying) return;
  autoState.deploying = true;
  autoSyncButtons();
  try {
    if (!AUTO_DEPLOYMENT.bytecode || !AUTO_DEPLOYMENT.deployedBytecode || !AUTO_ABI.length) {
      throw new Error("The reviewed automatic-settlement deployment bundle is incomplete.");
    }
    const runtimeBytes = (AUTO_DEPLOYMENT.deployedBytecode.length - 2) / 2;
    if (runtimeBytes > 24_576) throw new Error("The compiled hook exceeds the EVM contract-size limit.");
    const wallet = await autoWalletProvider();
    await autoEnsureChain(wallet);
    const provider = new window.ethers.BrowserProvider(wallet);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();
    if (!autoSameAddress(account, AUTO_DEVELOPER_WALLET)) throw new Error("The connected signer is not the developer wallet.");
    const helperCode = await provider.getCode(AUTO_CREATE2_HELPER);
    if (helperCode === "0x" || window.ethers.keccak256(helperCode).toLowerCase() !== AUTO_CREATE2_HELPER_RUNTIME_HASH) {
      throw new Error("The reviewed CREATE2 helper is unavailable.");
    }
    autoStatus("Finding the deterministic v4 hook address. No wallet action is needed.");
    const mined = autoMineSalt(AUTO_CREATE2_HELPER, window.ethers.keccak256(AUTO_DEPLOYMENT.bytecode));
    const helper = new window.ethers.Contract(AUTO_CREATE2_HELPER, AUTO_HELPER_ABI, signer);
    autoStatus(`Confirm the immutable deployment at ${mined.address}.`);
    const transaction = await helper.deploy(mined.salt, AUTO_DEPLOYMENT.bytecode, { gasLimit: 28_000_000 });
    autoStatus(`Deployment submitted · ${transaction.hash}\nWaiting for confirmation…`);
    const receipt = await transaction.wait();
    const validation = await autoValidate(provider, mined.address);
    autoState.result = {
      address: mined.address,
      block: receipt.blockNumber,
      transaction: transaction.hash,
      salt: mined.salt,
      helperAddress: AUTO_CREATE2_HELPER,
      permissionlessSettlement: true,
      settlementMinOutputBps: 9_500,
      ...validation,
    };
    auto$("#hookAddress").textContent = mined.address;
    auto$("#explorerLink").href = `${AUTO_CHAIN.blockExplorerUrls[0]}/address/${mined.address}`;
    auto$("#deployResult").hidden = false;
    autoStatus(`Deployment validated · block ${receipt.blockNumber}\n${validation.runtimeBytes.toLocaleString()} of 24,576 runtime bytes`);
  } catch (error) {
    autoStatus(String(error?.shortMessage || error?.message || "Deployment failed.").slice(0, 700));
  } finally {
    autoState.deploying = false;
    autoSyncButtons();
  }
}

async function autoCopyResult() {
  if (!autoState.result) return;
  await navigator.clipboard.writeText(JSON.stringify(autoState.result, null, 2));
  autoStatus("Deployment record copied. Source verification and launchpad configuration are still required.");
}

auto$("#connectWallet").addEventListener("click", autoConnect);
auto$("#deployHook").addEventListener("click", autoDeploy);
auto$("#riskAccepted").addEventListener("change", autoSyncButtons);
auto$("#copyDeployment").addEventListener("click", autoCopyResult);
autoSyncButtons();
