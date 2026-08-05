const CHAIN = Object.freeze({
  chainId: "0x1237",
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
});
const DEVELOPER_WALLET = "0x9CD7C9196A4C1836A3DF089cb210272e07e6A5e5";
const DEPLOYER_ADDRESS = "0xc9B89693d27476ff0DC799Aa2E41C6f9524FAFB7";
const DEPLOYER_RUNTIME_HASH = "0xb9fe0b176dba4f366689b957676e31bb78f9089484d66bee919dfbc401c8ab95";
const PONS_ADDRESS = "0x39dBED3a2bd333467115dE45665cC57F813C4571";
const PREDICTED_HOOK = "0xB1bf94BC34E62CF9F2D8d8ee33639afaB0A66088";
const PONS_SALT = "0x0000000000000000000000000000000000000000000000000000000000001a06";
const REQUIRED_FLAGS = 0x2088n;
const HOOK_MASK = 0x3fffn;
const PONS_DEPLOYMENT = window.RWI_PONS_FACTORY_DEPLOYMENT || {};
const PONS_ABI = window.RWI_PONS_FACTORY_ABI || [];
const DEPLOYER = window.RWI_HOOK_DEPLOYER_DEPLOYMENT || {};
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
    if (!sameAddress(state.account, DEVELOPER_WALLET)) throw new Error(`Connect the developer wallet ${DEVELOPER_WALLET}.`);
    setStatus(`Developer wallet connected · ${state.account}`);
  } catch (error) {
    state.account = null;
    setStatus(error?.message || "Wallet connection failed.");
  }
  syncButtons();
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
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("No PONS hook bytecode was deployed.");
  const runtimeBytes = (code.length - 2) / 2;
  if (runtimeBytes > 24_576) throw new Error("The deployed runtime exceeds the EVM contract-size limit.");
  if ((BigInt(address) & HOOK_MASK) !== REQUIRED_FLAGS) throw new Error("The deployed address has invalid Uniswap v4 hook permissions.");
  const expected = normalizeImmutableSlots(PONS_DEPLOYMENT.deployedBytecode, PONS_DEPLOYMENT.immutableReferences);
  const actual = normalizeImmutableSlots(code, PONS_DEPLOYMENT.immutableReferences);
  if (!expected || actual !== expected) throw new Error("The deployed runtime does not match the reviewed PONS build.");

  const hook = new window.ethers.Contract(address, PONS_ABI, provider);
  const [developer, pons, weth, usdg, manager, stateView, swapRouter, ponsWethPool, wethUsdgPool,
    activeBps, stagedBps, stagedCount, allocation, locked, creatorShare, developerShare, ethUsd] = await Promise.all([
    hook.developerWallet(), hook.PONS(), hook.WETH(), hook.USDG(), hook.UNISWAP_V4_POOL_MANAGER(),
    hook.UNISWAP_V4_STATE_VIEW(), hook.SWAP_ROUTER_02(), hook.PONS_WETH_ORACLE_POOL(), hook.WETH_USDG_ORACLE_POOL(),
    hook.INITIAL_ACTIVE_TOKEN_BPS(), hook.STAGED_TOKEN_BPS(), hook.STAGED_POSITION_COUNT(), hook.POOL_ALLOCATION_BPS(),
    hook.LIQUIDITY_PERMANENTLY_LOCKED(), hook.CREATOR_LP_FEE_SHARE_BPS(), hook.DEVELOPER_LP_FEE_SHARE_BPS(),
    hook.ethUsdPriceE18(),
  ]);
  const expectedAddresses = [
    [developer, DEVELOPER_WALLET, "developer wallet"], [pons, PONS_ADDRESS, "PONS"],
    [weth, "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73", "WETH"],
    [usdg, "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", "USDG"],
    [manager, "0x8366a39CC670B4001A1121B8F6A443A643e40951", "PoolManager"],
    [stateView, "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b", "StateView"],
    [swapRouter, "0xCaf681a66D020601342297493863E78C959E5cb2", "SwapRouter02"],
    [ponsWethPool, "0x10CC6BD38112cAc182db90B6a71d8Bb5939526bA", "PONS/WETH oracle"],
    [wethUsdgPool, "0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca", "WETH/USDG oracle"],
  ];
  for (const [actualAddress, expectedAddress, label] of expectedAddresses) {
    if (!sameAddress(actualAddress, expectedAddress)) throw new Error(`${label} integration mismatch.`);
  }
  if (activeBps !== 2_500n || stagedBps !== 7_500n || stagedCount !== 10n || allocation !== 10_000n || !locked) {
    throw new Error("The progressive-liquidity or permanent-lock rules do not match.");
  }
  if (creatorShare !== 9_000n || developerShare !== 1_000n) throw new Error("The 90/10 ETH revenue split does not match.");
  if (ethUsd === 0n) throw new Error("Protected ETH/USD launch pricing is unavailable.");
  return { runtimeCodeHash: window.ethers.keccak256(code), runtimeBytes };
}

function showResult(result) {
  state.result = result;
  $("#hookAddress").textContent = result.ponsHook.address;
  $("#explorerLink").href = `${CHAIN.blockExplorerUrls[0]}/address/${result.ponsHook.address}`;
  $("#deployResult").hidden = false;
}

async function deploy() {
  if (state.deploying) return;
  state.deploying = true;
  syncButtons();
  try {
    if (!PONS_DEPLOYMENT.bytecode || !PONS_DEPLOYMENT.deployedBytecode || !PONS_ABI.length || !DEPLOYER.deployedBytecode) {
      throw new Error("The reviewed PONS deployment bundle is incomplete.");
    }
    const wallet = await walletProvider();
    await ensureChain(wallet);
    const provider = new window.ethers.BrowserProvider(wallet);
    if ((await provider.getNetwork()).chainId !== 4663n) throw new Error("Switch the wallet to Robinhood Chain.");
    const signer = await provider.getSigner();
    const account = await signer.getAddress();
    if (!sameAddress(account, DEVELOPER_WALLET)) throw new Error("The connected signer is not the developer wallet.");

    const helperCode = await provider.getCode(DEPLOYER_ADDRESS);
    if (helperCode === "0x" || window.ethers.keccak256(helperCode) !== DEPLOYER_RUNTIME_HASH) {
      throw new Error("The existing CREATE2 helper does not match the reviewed deployer.");
    }
    const creationHash = window.ethers.keccak256(PONS_DEPLOYMENT.bytecode);
    const predicted = window.ethers.getCreate2Address(DEPLOYER_ADDRESS, PONS_SALT, creationHash);
    if (!sameAddress(predicted, PREDICTED_HOOK) || (BigInt(predicted) & HOOK_MASK) !== REQUIRED_FLAGS) {
      throw new Error("The reviewed PONS hook address or permission bits do not match.");
    }

    const existingCode = await provider.getCode(predicted);
    let transaction = null;
    let block = 0;
    if (existingCode === "0x") {
      setStatus(`Confirm the immutable PONS hook deployment at ${predicted}.`);
      const helper = new window.ethers.Contract(DEPLOYER_ADDRESS, ["function deploy(bytes32 salt,bytes creationCode) returns (address)"], signer);
      const tx = await helper.deploy(PONS_SALT, PONS_DEPLOYMENT.bytecode, { gasLimit: 28_000_000 });
      transaction = tx.hash;
      setStatus(`Deployment submitted · ${tx.hash}\nWaiting for confirmation…`);
      const receipt = await tx.wait();
      if (receipt.status !== 1) throw new Error("The PONS deployment transaction reverted.");
      block = receipt.blockNumber;
    } else {
      setStatus("The reviewed PONS hook is already deployed. Validating it now…");
      block = await provider.getBlockNumber();
    }
    const validation = await validateDeployment(provider, predicted);
    const result = {
      helperAddress: DEPLOYER_ADDRESS,
      ponsHook: { address: predicted, block, transaction, salt: PONS_SALT, ...validation },
    };
    showResult(result);
    setStatus(`PONS hook validated · ${validation.runtimeBytes.toLocaleString()} bytes\n90% creator ETH · 10% developer ETH · permanent progressive liquidity`);
  } catch (error) {
    setStatus(String(error?.shortMessage || error?.message || "Deployment failed.").slice(0, 900));
  } finally {
    state.deploying = false;
    syncButtons();
  }
}

async function copyResult() {
  if (!state.result) return;
  await navigator.clipboard.writeText(JSON.stringify(state.result, null, 2));
  setStatus("PONS deployment record copied. The launchpad configuration can now be published.");
}

$("#connectWallet").addEventListener("click", connect);
$("#deployHook").addEventListener("click", deploy);
$("#riskAccepted").addEventListener("change", syncButtons);
$("#copyDeployment").addEventListener("click", copyResult);
syncButtons();
