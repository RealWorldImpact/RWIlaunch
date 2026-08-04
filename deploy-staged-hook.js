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
const RWI_DEPLOYMENT = window.RWI_FACTORY_DEPLOYMENT || {};
const QUOTE_DEPLOYMENT = window.RWI_QUOTE_FACTORY_DEPLOYMENT || {};
const DEPLOYER = window.RWI_HOOK_DEPLOYER_DEPLOYMENT || {};
const RWI_ABI = window.RWI_FACTORY_ABI || [];
const QUOTE_ABI = window.RWI_QUOTE_FACTORY_ABI || [];
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

async function validateRuntime(provider, address, deployment) {
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("No hook bytecode was deployed.");
  const runtimeBytes = (code.length - 2) / 2;
  if (runtimeBytes > 24_576) throw new Error("The deployed runtime exceeds the EVM contract-size limit.");
  if ((BigInt(address) & HOOK_MASK) !== REQUIRED_FLAGS) {
    throw new Error("The hook address has invalid Uniswap v4 permission bits.");
  }
  const expected = normalizeImmutableSlots(deployment.deployedBytecode, deployment.immutableReferences);
  const actual = normalizeImmutableSlots(code, deployment.immutableReferences);
  if (!expected || actual !== expected) throw new Error("The deployed runtime does not match this progressive build.");
  return { runtimeCodeHash: window.ethers.keccak256(code), runtimeBytes };
}

async function validateRwiHook(provider, address) {
  const runtime = await validateRuntime(provider, address, RWI_DEPLOYMENT);
  const hook = new window.ethers.Contract(address, RWI_ABI, provider);
  const [rwi, activeBps, stagedBps, stagedCount, poolAllocation, locked, creatorShare] = await Promise.all([
    hook.RWI(), hook.INITIAL_ACTIVE_TOKEN_BPS(), hook.STAGED_TOKEN_BPS(), hook.STAGED_POSITION_COUNT(),
    hook.POOL_ALLOCATION_BPS(), hook.LIQUIDITY_PERMANENTLY_LOCKED(), hook.CREATOR_LP_FEE_SHARE_BPS(),
  ]);
  if (!sameAddress(rwi, "0x2286397228be256529BE1ae9ed8D7d16549e9C6A")) throw new Error("RWI address mismatch.");
  if (activeBps !== 2500n || stagedBps !== 7500n || stagedCount !== 10n || poolAllocation !== 10000n || !locked) {
    throw new Error("RWI staged-liquidity or permanent-lock rules do not match.");
  }
  if (creatorShare !== 10000n) throw new Error("RWI creator revenue share mismatch.");
  return runtime;
}

async function validateQuoteHook(provider, address) {
  const runtime = await validateRuntime(provider, address, QUOTE_DEPLOYMENT);
  const hook = new window.ethers.Contract(address, QUOTE_ABI, provider);
  const [developer, activeBps, stagedBps, stagedCount, poolAllocation, locked, creatorShare, developerShare] = await Promise.all([
    hook.developerWallet(), hook.INITIAL_ACTIVE_TOKEN_BPS(), hook.STAGED_TOKEN_BPS(), hook.STAGED_POSITION_COUNT(),
    hook.POOL_ALLOCATION_BPS(), hook.LIQUIDITY_PERMANENTLY_LOCKED(),
    hook.CREATOR_LP_FEE_SHARE_BPS(), hook.DEVELOPER_LP_FEE_SHARE_BPS(),
  ]);
  if (!sameAddress(developer, DEVELOPER_WALLET)) throw new Error("Developer wallet mismatch.");
  if (activeBps !== 2500n || stagedBps !== 7500n || stagedCount !== 10n || poolAllocation !== 10000n || !locked) {
    throw new Error("ETH/USDG staged-liquidity or permanent-lock rules do not match.");
  }
  if (creatorShare !== 9000n || developerShare !== 1000n) throw new Error("ETH/USDG revenue split mismatch.");
  return runtime;
}

async function deployHook(helper, mined, deployment, label) {
  setStatus(`${label} · confirm deployment at ${mined.address}.`);
  const tx = await helper.deploy(mined.salt, deployment.bytecode, { gasLimit: 28_000_000 });
  setStatus(`${label} submitted · ${tx.hash}\nWaiting for confirmation…`);
  const receipt = await tx.wait();
  return { address: mined.address, block: receipt.blockNumber, transaction: tx.hash, salt: mined.salt };
}

async function deploy() {
  if (state.deploying) return;
  state.deploying = true;
  syncButtons();
  try {
    if (
      !RWI_DEPLOYMENT.bytecode || !QUOTE_DEPLOYMENT.bytecode || !DEPLOYER.bytecode
      || !DEPLOYER.abi?.length || !RWI_ABI.length || !QUOTE_ABI.length
    ) throw new Error("The reviewed dual-hook deployment bundle is incomplete.");

    const wallet = await walletProvider();
    await ensureChain(wallet);
    const provider = new window.ethers.BrowserProvider(wallet);
    const network = await provider.getNetwork();
    if (network.chainId !== 4663n) throw new Error("Switch the wallet to Robinhood Chain.");
    const signer = await provider.getSigner();
    const account = await signer.getAddress();
    if (!sameAddress(account, DEVELOPER_WALLET)) throw new Error("The connected signer is not the developer wallet.");

    setStatus("Step 1 of 3 · confirm the small CREATE2 helper deployment.");
    const helperFactory = new window.ethers.ContractFactory(DEPLOYER.abi, DEPLOYER.bytecode, signer);
    const helper = await helperFactory.deploy();
    const helperTx = helper.deploymentTransaction();
    setStatus(`Step 1 submitted · ${helperTx.hash}\nWaiting for the CREATE2 helper…`);
    await helper.waitForDeployment();
    const helperAddress = await helper.getAddress();
    const helperWithSigner = new window.ethers.Contract(helperAddress, DEPLOYER.abi, signer);

    setStatus("Preparing two permissioned hook addresses. No wallet action is needed.");
    const rwiMined = mineSalt(helperAddress, window.ethers.keccak256(RWI_DEPLOYMENT.bytecode));
    const quoteMined = mineSalt(helperAddress, window.ethers.keccak256(QUOTE_DEPLOYMENT.bytecode));
    const rwiResult = await deployHook(helperWithSigner, rwiMined, RWI_DEPLOYMENT, "Step 2 of 3 · $RWI hook");
    const rwiValidation = await validateRwiHook(provider, rwiResult.address);
    const quoteResult = await deployHook(helperWithSigner, quoteMined, QUOTE_DEPLOYMENT, "Step 3 of 3 · ETH/USDG hook");
    const quoteValidation = await validateQuoteHook(provider, quoteResult.address);

    state.result = {
      helperAddress,
      helperTransaction: helperTx.hash,
      rwiHook: { ...rwiResult, ...rwiValidation },
      ethUsdgHook: { ...quoteResult, ...quoteValidation },
    };
    $("#rwiHookAddress").textContent = rwiResult.address;
    $("#quoteHookAddress").textContent = quoteResult.address;
    $("#rwiExplorerLink").href = `${CHAIN.blockExplorerUrls[0]}/address/${rwiResult.address}`;
    $("#quoteExplorerLink").href = `${CHAIN.blockExplorerUrls[0]}/address/${quoteResult.address}`;
    $("#deployResult").hidden = false;
    setStatus(
      `Both deployments validated · blocks ${rwiResult.block} and ${quoteResult.block}\n`
      + `$RWI ${rwiValidation.runtimeBytes.toLocaleString()} bytes · ETH/USDG ${quoteValidation.runtimeBytes.toLocaleString()} bytes`,
    );
  } catch (error) {
    setStatus(String(error?.shortMessage || error?.message || "Deployment failed.").slice(0, 700));
  } finally {
    state.deploying = false;
    syncButtons();
  }
}

async function copyResult() {
  if (!state.result) return;
  await navigator.clipboard.writeText(JSON.stringify(state.result, null, 2));
  setStatus("Both deployment records copied. Source verification and launchpad configuration are still required.");
}

$("#connectWallet").addEventListener("click", connect);
$("#deployHook").addEventListener("click", deploy);
$("#riskAccepted").addEventListener("change", syncButtons);
$("#copyDeployment").addEventListener("click", copyResult);
syncButtons();
