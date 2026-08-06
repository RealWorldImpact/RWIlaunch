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
const PREDICTED_HOOK = "0x7fbDd9A55F11A854aD0d1c18F63aE47D58c7E088";
const HOOK_SALT = "0x0000000000000000000000000000000000000000000000000000000000001d25";
const EXPECTED_CREATION_HASH = "0xc1d0213f30e0917b69d4d760d9384a22673d48c9443857dec389fdf827932758";
const REQUIRED_FLAGS = 0x2088n;
const HOOK_MASK = 0x3fffn;
const GAS_LIMIT = 12_000_000n;
const ADDRESSES = Object.freeze({
  rwi: "0x2286397228be256529BE1ae9ed8D7d16549e9C6A",
  weth: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  usdg: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  pons: "0x39dBED3a2bd333467115dE45665cC57F813C4571",
  poolManager: "0x8366a39CC670B4001A1121B8F6A443A643e40951",
  stateView: "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b",
  swapRouter: "0xCaf681a66D020601342297493863E78C959E5cb2",
  rwiWethPool: "0xFf6AA24815d1274a9bE0CfD17C7c7489Cd40A697",
  ponsWethPool: "0x10CC6BD38112cAc182db90B6a71d8Bb5939526bA",
  wethUsdgPool: "0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca",
});
const DEPLOYMENT = window.RWI_MULTI_PAIR_FACTORY_DEPLOYMENT || {};
const HOOK_ABI = window.RWI_MULTI_PAIR_FACTORY_ABI || [];
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
    if (Number(error?.code) !== 4902) throw error;
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
  if (code === "0x") throw new Error("No unified hook bytecode was deployed.");
  const runtimeBytes = (code.length - 2) / 2;
  if (runtimeBytes > 24_576) throw new Error("The deployed runtime exceeds the EVM contract-size limit.");
  if ((BigInt(address) & HOOK_MASK) !== REQUIRED_FLAGS) throw new Error("The deployed address has invalid Uniswap v4 hook permissions.");
  const expected = normalizeImmutableSlots(DEPLOYMENT.deployedBytecode, DEPLOYMENT.immutableReferences);
  const actual = normalizeImmutableSlots(code, DEPLOYMENT.immutableReferences);
  if (!expected || actual !== expected) throw new Error("The deployed runtime does not match the reviewed unified build.");

  const hook = new window.ethers.Contract(address, HOOK_ABI, provider);
  const [rwi, weth, usdg, pons, manager, stateView, swapRouter, oracleAddress, vaultAddress, developer,
    rwiCreator, otherCreator, developerFee, compoundFee, targetMarketCap] = await Promise.all([
    hook.rwi(), hook.weth(), hook.usdg(), hook.pons(), hook.poolManager(), hook.stateView(), hook.swapRouter(),
    hook.protectedOracle(), hook.liquidityVault(), hook.developerWallet(), hook.RWI_CREATOR_FEE_BPS(),
    hook.OTHER_CREATOR_FEE_BPS(), hook.DEVELOPER_FEE_BPS(), hook.AUTO_COMPOUND_FEE_BPS(),
    hook.TARGET_MARKET_CAP_USD_E18(),
  ]);
  const expectedAddresses = [
    [rwi, ADDRESSES.rwi, "RWI"], [weth, ADDRESSES.weth, "WETH"], [usdg, ADDRESSES.usdg, "USDG"],
    [pons, ADDRESSES.pons, "PONS"], [manager, ADDRESSES.poolManager, "PoolManager"],
    [stateView, ADDRESSES.stateView, "StateView"], [swapRouter, ADDRESSES.swapRouter, "SwapRouter02"],
    [developer, DEVELOPER_WALLET, "developer wallet"],
  ];
  for (const [actualAddress, expectedAddress, label] of expectedAddresses) {
    if (!sameAddress(actualAddress, expectedAddress)) throw new Error(`${label} integration mismatch.`);
  }
  if (rwiCreator !== 9_750n || otherCreator !== 9_000n || developerFee !== 750n || compoundFee !== 250n) {
    throw new Error("The creator, developer, or auto-compounding revenue rules do not match.");
  }
  if (targetMarketCap !== 10_000n * 10n ** 18n) throw new Error("The opening market-cap target does not match.");

  const [oracleCode, vaultCode] = await Promise.all([provider.getCode(oracleAddress), provider.getCode(vaultAddress)]);
  if (oracleCode === "0x" || vaultCode === "0x") throw new Error("The protected oracle or permanent-liquidity vault was not deployed.");
  const vault = new window.ethers.Contract(vaultAddress, [
    "function launchHook() view returns(address)", "function poolManager() view returns(address)",
    "function stateView() view returns(address)", "function INITIAL_ACTIVE_TOKEN_BPS() view returns(uint16)",
    "function STAGED_TOKEN_BPS() view returns(uint16)", "function STAGED_POSITION_COUNT() view returns(uint8)",
    "function AUTO_COMPOUND_FEE_BPS() view returns(uint16)",
  ], provider);
  const [vaultHook, vaultManager, vaultStateView, activeBps, stagedBps, stageCount, vaultCompoundFee] = await Promise.all([
    vault.launchHook(), vault.poolManager(), vault.stateView(), vault.INITIAL_ACTIVE_TOKEN_BPS(),
    vault.STAGED_TOKEN_BPS(), vault.STAGED_POSITION_COUNT(), vault.AUTO_COMPOUND_FEE_BPS(),
  ]);
  if (!sameAddress(vaultHook, address) || !sameAddress(vaultManager, ADDRESSES.poolManager) || !sameAddress(vaultStateView, ADDRESSES.stateView)) {
    throw new Error("The permanent-liquidity vault integrations do not match.");
  }
  if (activeBps !== 500n || stagedBps !== 9_500n || stageCount !== 16n || vaultCompoundFee !== 250n) {
    throw new Error("The 5/95 progressive-liquidity vault rules do not match.");
  }

  const oracle = new window.ethers.Contract(oracleAddress, [
    "function rwi() view returns(address)", "function weth() view returns(address)", "function usdg() view returns(address)",
    "function pons() view returns(address)", "function rwiWethPool() view returns(address)",
    "function ponsWethPool() view returns(address)", "function wethUsdgPool() view returns(address)",
    "function quoteUsdPriceE18(address quote) view returns(uint256)",
  ], provider);
  const [oracleRwi, oracleWeth, oracleUsdg, oraclePons, rwiWethPool, ponsWethPool, wethUsdgPool,
    rwiPrice, ethPrice, usdgPrice, ponsPrice] = await Promise.all([
    oracle.rwi(), oracle.weth(), oracle.usdg(), oracle.pons(), oracle.rwiWethPool(), oracle.ponsWethPool(),
    oracle.wethUsdgPool(), oracle.quoteUsdPriceE18(ADDRESSES.rwi), oracle.quoteUsdPriceE18(window.ethers.ZeroAddress),
    oracle.quoteUsdPriceE18(ADDRESSES.usdg), oracle.quoteUsdPriceE18(ADDRESSES.pons),
  ]);
  const oracleAddresses = [
    [oracleRwi, ADDRESSES.rwi, "oracle RWI"], [oracleWeth, ADDRESSES.weth, "oracle WETH"],
    [oracleUsdg, ADDRESSES.usdg, "oracle USDG"], [oraclePons, ADDRESSES.pons, "oracle PONS"],
    [rwiWethPool, ADDRESSES.rwiWethPool, "RWI/WETH oracle pool"],
    [ponsWethPool, ADDRESSES.ponsWethPool, "PONS/WETH oracle pool"],
    [wethUsdgPool, ADDRESSES.wethUsdgPool, "WETH/USDG oracle pool"],
  ];
  for (const [actualAddress, expectedAddress, label] of oracleAddresses) {
    if (!sameAddress(actualAddress, expectedAddress)) throw new Error(`${label} mismatch.`);
  }
  if ([rwiPrice, ethPrice, usdgPrice, ponsPrice].some((price) => price === 0n)) {
    throw new Error("One or more protected launch prices are unavailable.");
  }
  return {
    runtimeCodeHash: window.ethers.keccak256(code),
    runtimeBytes,
    protectedOracle: oracleAddress,
    liquidityVault: vaultAddress,
  };
}

function showResult(result) {
  state.result = result;
  $("#hookAddress").textContent = result.multiPairHook.address;
  $("#explorerLink").href = `${CHAIN.blockExplorerUrls[0]}/address/${result.multiPairHook.address}`;
  $("#deployResult").hidden = false;
}

async function deploy() {
  if (state.deploying) return;
  state.deploying = true;
  syncButtons();
  try {
    if (!DEPLOYMENT.bytecode || !DEPLOYMENT.deployedBytecode || !HOOK_ABI.length || !DEPLOYER.deployedBytecode) {
      throw new Error("The reviewed unified deployment bundle is incomplete.");
    }
    const creationBytes = (DEPLOYMENT.bytecode.length - 2) / 2;
    if (creationBytes > 49_152) throw new Error("The reviewed creation code exceeds the EVM init-code limit.");
    const creationHash = window.ethers.keccak256(DEPLOYMENT.bytecode);
    if (creationHash !== EXPECTED_CREATION_HASH) throw new Error("The reviewed creation-code hash does not match.");
    const predicted = window.ethers.getCreate2Address(DEPLOYER_ADDRESS, HOOK_SALT, creationHash);
    if (!sameAddress(predicted, PREDICTED_HOOK) || (BigInt(predicted) & HOOK_MASK) !== REQUIRED_FLAGS) {
      throw new Error("The reviewed hook address or permission bits do not match.");
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

    const existingCode = await provider.getCode(predicted);
    let transaction = null;
    let block = 0;
    if (existingCode === "0x") {
      setStatus(`Confirm the immutable unified-hook deployment at ${predicted}.`);
      const helper = new window.ethers.Contract(DEPLOYER_ADDRESS, ["function deploy(bytes32 salt,bytes creationCode) returns(address)"], signer);
      const tx = await helper.deploy(HOOK_SALT, DEPLOYMENT.bytecode, { gasLimit: GAS_LIMIT });
      transaction = tx.hash;
      setStatus(`Deployment submitted · ${tx.hash}\nWaiting for confirmation…`);
      const receipt = await tx.wait();
      if (receipt.status !== 1) throw new Error("The unified-hook deployment transaction reverted.");
      block = receipt.blockNumber;
    } else {
      setStatus("The reviewed unified hook already exists. Validating it now…");
      block = await provider.getBlockNumber();
    }
    const validation = await validateDeployment(provider, predicted);
    const result = {
      helperAddress: DEPLOYER_ADDRESS,
      multiPairHook: { address: predicted, block, transaction, salt: HOOK_SALT, ...validation },
    };
    showResult(result);
    setStatus(`Unified hook validated · ${validation.runtimeBytes.toLocaleString()} runtime bytes\n5% active · 95% staged · 2.5% permanently auto-compounded · four atomic pair choices`);
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
  setStatus("Deployment record copied. The launchpad can now be configured with the validated address.");
}

$("#connectWallet").addEventListener("click", connect);
$("#deployHook").addEventListener("click", deploy);
$("#riskAccepted").addEventListener("change", syncButtons);
$("#copyDeployment").addEventListener("click", copyResult);
syncButtons();
