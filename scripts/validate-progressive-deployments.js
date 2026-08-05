const { ethers } = require("ethers");

const RWI_HOOK = process.env.ROBINHOOD_FACTORY_ADDRESS;
const QUOTE_HOOK = process.env.ROBINHOOD_QUOTE_FACTORY_ADDRESS;
const HELPER = process.env.ROBINHOOD_HOOK_DEPLOYER_ADDRESS;
const RWI_TX = process.env.ROBINHOOD_FACTORY_DEPLOYMENT_TX;
const QUOTE_TX = process.env.ROBINHOOD_QUOTE_FACTORY_DEPLOYMENT_TX;
const HELPER_TX = process.env.ROBINHOOD_HOOK_DEPLOYER_TX;
const EXPECTED_RWI_HASH = process.env.ROBINHOOD_FACTORY_RUNTIME_HASH;
const EXPECTED_QUOTE_HASH = process.env.ROBINHOOD_QUOTE_FACTORY_RUNTIME_HASH;
const EXPECTED_RWI_BLOCK = Number(process.env.ROBINHOOD_FACTORY_DEPLOYMENT_BLOCK || 0);
const EXPECTED_QUOTE_BLOCK = Number(process.env.ROBINHOOD_QUOTE_FACTORY_DEPLOYMENT_BLOCK || 0);
const RPC = process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const BLOCKSCOUT = "https://robinhoodchain.blockscout.com";
const HOOK_MASK = 0x3fffn;
const REQUIRED_FLAGS = 0x2088n;

const rwiArtifact = require("../artifacts/contracts/RobinhoodRWIV4LaunchHook.sol/RobinhoodRWIV4LaunchHook.json");
const quoteArtifact = require("../artifacts/contracts/RobinhoodEthUsdgV4LaunchHook.sol/RobinhoodEthUsdgV4LaunchHook.json");
const deployerArtifact = require("../artifacts/contracts/RWIV4HookDeployer.sol/RWIV4HookDeployer.json");

function requireAddress(value, label) {
  if (!ethers.isAddress(value)) throw new Error(`Set a valid ${label}.`);
  return ethers.getAddress(value);
}

function requireHash(value, label) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value || "")) throw new Error(`Set a valid ${label}.`);
  return value.toLowerCase();
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

async function transactionRecord(provider, hash, expectedBlock, helper, label) {
  requireHash(hash, `${label} transaction hash`);
  const [tx, receipt] = await Promise.all([provider.getTransaction(hash), provider.getTransactionReceipt(hash)]);
  if (!tx || !receipt || receipt.status !== 1) throw new Error(`${label} deployment transaction is missing or reverted.`);
  if (!ethers.isAddress(tx.to) || ethers.getAddress(tx.to) !== helper) throw new Error(`${label} transaction did not call the supplied CREATE2 helper.`);
  if (expectedBlock && receipt.blockNumber !== expectedBlock) throw new Error(`${label} deployment block mismatch.`);
  return { hash, blockNumber: receipt.blockNumber, from: tx.from, to: tx.to };
}

async function verifiedSource(address, contractName) {
  const response = await fetch(`${BLOCKSCOUT}/api/v2/smart-contracts/${address}`, {
    headers: { accept: "application/json", "user-agent": "RWI-Launchpad-Validator/1.0" },
  });
  if (!response.ok) return false;
  const record = await response.json();
  return Boolean(record.source_code && record.name === contractName);
}

async function validateRuntime(provider, address, artifact, expectedHash, expectedBytes, label) {
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error(`${label} has no runtime bytecode.`);
  const runtimeBytes = (code.length - 2) / 2;
  const runtimeHash = ethers.keccak256(code).toLowerCase();
  if (runtimeBytes !== expectedBytes) throw new Error(`${label} runtime size mismatch.`);
  if (runtimeHash !== expectedHash) throw new Error(`${label} runtime hash mismatch.`);
  if (normalizeImmutableSlots(code, artifact.immutableReferences) !== normalizeImmutableSlots(artifact.deployedBytecode, artifact.immutableReferences)) {
    throw new Error(`${label} runtime does not match the locally compiled reviewed artifact.`);
  }
  if ((BigInt(address) & HOOK_MASK) !== REQUIRED_FLAGS) throw new Error(`${label} has invalid Uniswap v4 hook permission bits.`);
  return { runtimeBytes, runtimeHash };
}

async function main() {
  const rwiAddress = requireAddress(RWI_HOOK, "ROBINHOOD_FACTORY_ADDRESS");
  const quoteAddress = requireAddress(QUOTE_HOOK, "ROBINHOOD_QUOTE_FACTORY_ADDRESS");
  const helperAddress = requireAddress(HELPER, "ROBINHOOD_HOOK_DEPLOYER_ADDRESS");
  const rwiHash = requireHash(EXPECTED_RWI_HASH, "ROBINHOOD_FACTORY_RUNTIME_HASH");
  const quoteHash = requireHash(EXPECTED_QUOTE_HASH, "ROBINHOOD_QUOTE_FACTORY_RUNTIME_HASH");
  const provider = new ethers.JsonRpcProvider(RPC);
  const network = await provider.getNetwork();
  if (network.chainId !== 4663n) throw new Error(`Expected Robinhood Chain 4663, received ${network.chainId}.`);

  const helperCode = await provider.getCode(helperAddress);
  if (helperCode === "0x" || helperCode.toLowerCase() !== deployerArtifact.deployedBytecode.toLowerCase()) {
    throw new Error("CREATE2 helper bytecode does not match the reviewed deployer.");
  }
  const helperTransaction = await provider.getTransactionReceipt(requireHash(HELPER_TX, "ROBINHOOD_HOOK_DEPLOYER_TX"));
  if (!helperTransaction || helperTransaction.status !== 1 || helperTransaction.contractAddress !== helperAddress) {
    throw new Error("CREATE2 helper creation transaction mismatch.");
  }

  const [rwiRuntime, quoteRuntime, rwiTransaction, quoteTransaction] = await Promise.all([
    validateRuntime(provider, rwiAddress, rwiArtifact, rwiHash, 24_257, "$RWI hook"),
    validateRuntime(provider, quoteAddress, quoteArtifact, quoteHash, 24_550, "ETH/USDG hook"),
    transactionRecord(provider, RWI_TX, EXPECTED_RWI_BLOCK, helperAddress, "$RWI hook"),
    transactionRecord(provider, QUOTE_TX, EXPECTED_QUOTE_BLOCK, helperAddress, "ETH/USDG hook"),
  ]);

  const rwi = new ethers.Contract(rwiAddress, rwiArtifact.abi, provider);
  const quote = new ethers.Contract(quoteAddress, quoteArtifact.abi, provider);
  const [
    rwiToken, rwiWeth, rwiUsdg, rwiManager, rwiStateView, rwiCreatorShare, rwiActive, rwiStaged, rwiCount,
    rwiLocked, rwiPoolAllocation, rwiNextPosition, rwiEthUsd,
    quoteWeth, quoteUsdg, quoteManager, quoteStateView, quoteDeveloper, quoteCreatorShare, quoteDeveloperShare,
    quoteActive, quoteStaged, quoteCount, quoteLocked, quotePoolAllocation, quoteNextPosition, quoteEthUsd,
  ] = await Promise.all([
    rwi.RWI(), rwi.WETH(), rwi.USDG(), rwi.UNISWAP_V4_POOL_MANAGER(), rwi.UNISWAP_V4_STATE_VIEW(),
    rwi.CREATOR_LP_FEE_SHARE_BPS(), rwi.INITIAL_ACTIVE_TOKEN_BPS(), rwi.STAGED_TOKEN_BPS(), rwi.STAGED_POSITION_COUNT(),
    rwi.LIQUIDITY_PERMANENTLY_LOCKED(), rwi.POOL_ALLOCATION_BPS(), rwi.nextPositionTokenId(), rwi.ethUsdPriceE18(),
    quote.WETH(), quote.USDG(), quote.UNISWAP_V4_POOL_MANAGER(), quote.UNISWAP_V4_STATE_VIEW(), quote.developerWallet(),
    quote.CREATOR_LP_FEE_SHARE_BPS(), quote.DEVELOPER_LP_FEE_SHARE_BPS(), quote.INITIAL_ACTIVE_TOKEN_BPS(),
    quote.STAGED_TOKEN_BPS(), quote.STAGED_POSITION_COUNT(), quote.LIQUIDITY_PERMANENTLY_LOCKED(),
    quote.POOL_ALLOCATION_BPS(), quote.nextPositionTokenId(), quote.ethUsdPriceE18(),
  ]);

  const expected = {
    rwi: "0x2286397228be256529BE1ae9ed8D7d16549e9C6A",
    weth: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
    usdg: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    manager: "0x8366a39CC670B4001A1121B8F6A443A643e40951",
    stateView: "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b",
    developer: "0x9CD7C9196A4C1836A3DF089cb210272e07e6A5e5",
  };
  const same = (left, right) => ethers.getAddress(left) === ethers.getAddress(right);
  if (!same(rwiToken, expected.rwi) || !same(rwiWeth, expected.weth) || !same(rwiUsdg, expected.usdg)) throw new Error("$RWI hook token integrations mismatch.");
  if (!same(quoteWeth, expected.weth) || !same(quoteUsdg, expected.usdg)) throw new Error("ETH/USDG hook token integrations mismatch.");
  if (!same(rwiManager, expected.manager) || !same(quoteManager, expected.manager) || !same(rwiStateView, expected.stateView) || !same(quoteStateView, expected.stateView)) {
    throw new Error("Uniswap v4 integration mismatch.");
  }
  if (!same(quoteDeveloper, expected.developer)) throw new Error("Developer wallet mismatch.");
  if (rwiCreatorShare !== 10_000n || quoteCreatorShare !== 9_000n || quoteDeveloperShare !== 1_000n) throw new Error("Revenue rules mismatch.");
  if (rwiActive !== 2_500n || quoteActive !== 2_500n || rwiStaged !== 7_500n || quoteStaged !== 7_500n || rwiCount !== 10n || quoteCount !== 10n) {
    throw new Error("Progressive liquidity rules mismatch.");
  }
  if (!rwiLocked || !quoteLocked || rwiPoolAllocation !== 10_000n || quotePoolAllocation !== 10_000n) throw new Error("Permanent lock or full allocation rule mismatch.");
  if (rwiNextPosition < 1n || quoteNextPosition < 1n) throw new Error("A progressive hook returned an invalid position counter.");
  if (rwiEthUsd === 0n || quoteEthUsd === 0n) throw new Error("ETH/USD oracle read failed.");

  const integrationCodes = await Promise.all([expected.rwi, expected.weth, expected.usdg, expected.manager, expected.stateView].map((address) => provider.getCode(address)));
  if (integrationCodes.some((code) => code === "0x")) throw new Error("A required integration has no deployed code.");
  const [rwiVerified, quoteVerified] = await Promise.all([
    verifiedSource(rwiAddress, "RobinhoodRWIV4LaunchHook"),
    verifiedSource(quoteAddress, "RobinhoodEthUsdgV4LaunchHook"),
  ]);

  console.log(JSON.stringify({
    chainId: network.chainId.toString(),
    helper: { address: helperAddress, blockNumber: helperTransaction.blockNumber },
    rwiHook: { address: rwiAddress, ...rwiRuntime, transaction: rwiTransaction, sourceVerified: rwiVerified },
    ethUsdgHook: { address: quoteAddress, ...quoteRuntime, transaction: quoteTransaction, sourceVerified: quoteVerified },
    schedule: { initialActiveBps: Number(rwiActive), stagedBps: Number(rwiStaged), stagedPositions: Number(rwiCount) },
    revenue: { rwiCreatorBps: Number(rwiCreatorShare), quoteCreatorBps: Number(quoteCreatorShare), developerBps: Number(quoteDeveloperShare) },
    launchedPositions: { rwi: (rwiNextPosition - 1n).toString(), ethUsdg: (quoteNextPosition - 1n).toString() },
    nextPositionTokenIds: { rwi: rwiNextPosition.toString(), ethUsdg: quoteNextPosition.toString() },
    ethUsdPriceE18: rwiEthUsd.toString(),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
