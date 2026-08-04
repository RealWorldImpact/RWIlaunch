const CHAIN = Object.freeze({
  chainId: "0x1237",
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
});
const DEVELOPER_WALLET = "0x9CD7C9196A4C1836A3DF089cb210272e07e6A5e5";
const REQUIRED_FLAGS = 0x2088n;
const HOOK_MASK = 0x3fffn;
const DEPLOYMENT = window.RWI_QUOTE_FACTORY_DEPLOYMENT || {};
const DEPLOYER = window.RWI_HOOK_DEPLOYER_DEPLOYMENT || {};
const ABI = window.RWI_QUOTE_FACTORY_ABI || [];
const discoveredProviders = new Map();
const state = { wallet: null, account: null, deploying: false, result: null };
const $ = (selector) => document.querySelector(selector);

window.addEventListener?.("eip6963:announceProvider", (event) => {
  if (!event?.detail?.provider?.request) return;
  const key = event.detail.info?.uuid || event.detail.info?.rdns || String(discoveredProviders.size);
  discoveredProviders.set(key, event.detail.provider);
});
window.dispatchEvent?.(new Event("eip6963:requestProvider"));

function setStatus(message) { $("#deployStatus").textContent = message; }
function sameAddress(left, right) { return String(left).toLowerCase() === String(right).toLowerCase(); }
function shortAddress(address) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }

async function walletProvider() {
  if (state.wallet?.request) return state.wallet;
  if (window.ethereum?.request) state.wallet = window.ethereum;
  if (!state.wallet) {
    window.dispatchEvent?.(new Event("eip6963:requestProvider"));
    await new Promise((resolve) => setTimeout(resolve, 180));
    state.wallet = discoveredProviders.values().next().value || null;
  }
  if (!state.wallet?.request) throw new Error("Open this page in a browser with an EVM wallet.");
  return state.wallet;
}

async function ensureChain(wallet) {
  const chainId = await wallet.request({ method: "eth_chainId" });
  if (String(chainId).toLowerCase() === CHAIN.chainId) return;
  try {
    await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.chainId }] });
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await wallet.request({ method: "wallet_addEthereumChain", params: [CHAIN] });
  }
}

function syncButtons() {
  $("#connectWallet").textContent = state.account ? shortAddress(state.account) : "Connect wallet";
  $("#deployHook").disabled = state.deploying || !state.account || !$("#riskAccepted").checked;
}

async function connect() {
  try {
    const wallet = await walletProvider();
    const accounts = await wallet.request({ method: "eth_requestAccounts" });
    await ensureChain(wallet);
    state.account = accounts[0] || null;
    if (!sameAddress(state.account, DEVELOPER_WALLET)) {
      throw new Error(`Connect the developer wallet ${DEVELOPER_WALLET}.`);
    }
    setStatus(`Developer wallet connected · ${state.account}`);
  } catch (error) {
    state.account = null;
    setStatus(error?.message || "Wallet connection failed.");
  }
  syncButtons();
}

function mineSalt(deployerAddress, creationCodeHash) {
  for (let candidate = 0n; candidate < 1_000_000n; candidate += 1n) {
    const salt = window.ethers.zeroPadValue(window.ethers.toBeHex(candidate), 32);
    const address = window.ethers.getCreate2Address(deployerAddress, salt, creationCodeHash);
    if ((BigInt(address) & HOOK_MASK) === REQUIRED_FLAGS) return { salt, address, candidate };
  }
  throw new Error("No valid hook address was found in the bounded CREATE2 search.");
}

function normalizeImmutableSlots(bytecode, references = {}) {
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

async function validateDeployment(provider, address) {
  const network = await provider.getNetwork();
  if (network.chainId !== 4663n) throw new Error("The hook was not deployed on Robinhood Chain.");
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("No hook bytecode was deployed.");
  if ((code.length - 2) / 2 > 24_576) throw new Error("The deployed runtime exceeds the EVM contract-size limit.");
  if ((BigInt(address) & HOOK_MASK) !== REQUIRED_FLAGS) throw new Error("The hook address has invalid Uniswap v4 permission bits.");
  const expected = normalizeImmutableSlots(DEPLOYMENT.deployedBytecode, DEPLOYMENT.immutableReferences);
  const actual = normalizeImmutableSlots(code, DEPLOYMENT.immutableReferences);
  if (!expected || actual !== expected) throw new Error("The deployed runtime does not match this staged build.");
  const hook = new window.ethers.Contract(address, ABI, provider);
  const [developer, activeBps, stagedBps, offset, poolAllocation, locked, creatorShare, developerShare] = await Promise.all([
    hook.developerWallet(), hook.INITIAL_ACTIVE_TOKEN_BPS(), hook.STAGED_TOKEN_BPS(), hook.STAGED_TICK_OFFSET(),
    hook.POOL_ALLOCATION_BPS(), hook.LIQUIDITY_PERMANENTLY_LOCKED(),
    hook.CREATOR_LP_FEE_SHARE_BPS(), hook.DEVELOPER_LP_FEE_SHARE_BPS(),
  ]);
  if (!sameAddress(developer, DEVELOPER_WALLET)) throw new Error("Developer wallet mismatch.");
  if (activeBps !== 9000n || stagedBps !== 1000n || offset !== 2200n || poolAllocation !== 10000n || !locked) {
    throw new Error("Staged liquidity or permanent-lock rules do not match.");
  }
  if (creatorShare !== 9000n || developerShare !== 1000n) throw new Error("Revenue split mismatch.");
  return { runtimeCodeHash: window.ethers.keccak256(code), runtimeBytes: (code.length - 2) / 2 };
}

async function deploy() {
  if (state.deploying) return;
  state.deploying = true;
  syncButtons();
  try {
    if (!DEPLOYMENT.bytecode || !DEPLOYER.bytecode || !DEPLOYER.abi?.length || !ABI.length) {
      throw new Error("The reviewed deployment bundle is incomplete.");
    }
    const wallet = await walletProvider();
    await ensureChain(wallet);
    const provider = new window.ethers.BrowserProvider(wallet);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();
    if (!sameAddress(account, DEVELOPER_WALLET)) throw new Error("The connected signer is not the developer wallet.");

    setStatus("Transaction 1 of 2 · confirm the small CREATE2 helper deployment in your wallet.");
    const helperFactory = new window.ethers.ContractFactory(DEPLOYER.abi, DEPLOYER.bytecode, signer);
    const helper = await helperFactory.deploy();
    const helperTx = helper.deploymentTransaction();
    setStatus(`Transaction 1 submitted · ${helperTx.hash}\nWaiting for the CREATE2 helper…`);
    await helper.waitForDeployment();
    const helperAddress = await helper.getAddress();

    setStatus("Finding an address with the exact Uniswap v4 hook permission bits. No wallet action is needed.");
    const mined = mineSalt(helperAddress, window.ethers.keccak256(DEPLOYMENT.bytecode));
    setStatus(`Transaction 2 of 2 · confirm deployment of the immutable hook at ${mined.address}.`);
    const helperWithSigner = new window.ethers.Contract(helperAddress, DEPLOYER.abi, signer);
    const hookTx = await helperWithSigner.deploy(mined.salt, DEPLOYMENT.bytecode, { gasLimit: 28_000_000 });
    setStatus(`Transaction 2 submitted · ${hookTx.hash}\nWaiting for the staged hook…`);
    const receipt = await hookTx.wait();
    const validation = await validateDeployment(provider, mined.address);
    state.result = {
      address: mined.address,
      deploymentBlock: receipt.blockNumber,
      deploymentTransaction: hookTx.hash,
      helperAddress,
      helperTransaction: helperTx.hash,
      salt: mined.salt,
      ...validation,
    };
    $("#hookAddress").textContent = mined.address;
    $("#explorerLink").href = `${CHAIN.blockExplorerUrls[0]}/address/${mined.address}`;
    $("#deployResult").hidden = false;
    setStatus(`Deployment validated · block ${receipt.blockNumber}\nRuntime ${validation.runtimeBytes.toLocaleString()} bytes · hash ${validation.runtimeCodeHash}`);
  } catch (error) {
    setStatus(String(error?.shortMessage || error?.message || "Deployment failed.").slice(0, 600));
  } finally {
    state.deploying = false;
    syncButtons();
  }
}

async function copyResult() {
  if (!state.result) return;
  await navigator.clipboard.writeText(JSON.stringify(state.result, null, 2));
  setStatus("Deployment details copied. The hook still needs source verification and launchpad configuration.");
}

$("#connectWallet").addEventListener("click", connect);
$("#deployHook").addEventListener("click", deploy);
$("#riskAccepted").addEventListener("change", syncButtons);
$("#copyDeployment").addEventListener("click", copyResult);
syncButtons();
