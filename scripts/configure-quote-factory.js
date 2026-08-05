const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const projectRoot = path.resolve(__dirname, "..");
const artifact = require("../artifacts/contracts/RobinhoodEthUsdgV4LaunchHook.sol/RobinhoodEthUsdgV4LaunchHook.json");
const address = process.env.ROBINHOOD_QUOTE_FACTORY_ADDRESS;

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

async function main() {
  if (!ethers.isAddress(address)) throw new Error("Set ROBINHOOD_QUOTE_FACTORY_ADDRESS to the deployed ETH/USDG hook.");
  const provider = new ethers.JsonRpcProvider(process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com");
  if ((await provider.getNetwork()).chainId !== 4663n) throw new Error("Expected Robinhood Chain 4663.");
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("No deployed bytecode exists at the supplied address.");
  if (normalizeImmutableSlots(code, artifact.immutableReferences) !== normalizeImmutableSlots(artifact.deployedBytecode, artifact.immutableReferences)) {
    throw new Error("The deployed runtime does not match the reviewed ETH/USDG hook build.");
  }
  if ((BigInt(address) & 0x3fffn) !== 0x2088n) throw new Error("The address does not encode the required v4 hook permissions.");
  const hook = new ethers.Contract(address, artifact.abi, provider);
  const [developer, creatorShare, developerShare, locked] = await Promise.all([
    hook.developerWallet(), hook.CREATOR_LP_FEE_SHARE_BPS(), hook.DEVELOPER_LP_FEE_SHARE_BPS(), hook.LIQUIDITY_PERMANENTLY_LOCKED(),
  ]);
  if (ethers.getAddress(developer) !== ethers.getAddress("0x9CD7C9196A4C1836A3DF089cb210272e07e6A5e5")) throw new Error("Developer wallet mismatch.");
  if (creatorShare !== 9000n || developerShare !== 1000n || !locked) throw new Error("Revenue split or lock rules mismatch.");
  const [activeBps, stagedBps, stagedPositionCount] = await Promise.all([
    hook.INITIAL_ACTIVE_TOKEN_BPS(), hook.STAGED_TOKEN_BPS(), hook.STAGED_POSITION_COUNT(),
  ]);
  if (activeBps !== 2500n || stagedBps !== 7500n || stagedPositionCount !== 10n) {
    throw new Error("Staged liquidity rules mismatch.");
  }

  const deploymentTransaction = await provider.getTransaction(process.env.ROBINHOOD_QUOTE_FACTORY_DEPLOYMENT_TX || "").catch(() => null);
  const deploymentBlock = Number(process.env.ROBINHOOD_QUOTE_FACTORY_DEPLOYMENT_BLOCK || deploymentTransaction?.blockNumber || 0);
  if (!deploymentBlock) throw new Error("Set ROBINHOOD_QUOTE_FACTORY_DEPLOYMENT_BLOCK or ROBINHOOD_QUOTE_FACTORY_DEPLOYMENT_TX.");
  const verified = await fetch(`https://robinhoodchain.blockscout.com/api/v2/smart-contracts/${address}`).then((response) => response.ok ? response.json() : null);
  if (!verified?.source_code || verified?.name !== "RobinhoodEthUsdgV4LaunchHook") throw new Error("Blockscout source verification is not confirmed yet.");

  const configPath = path.join(projectRoot, "quote-factory-config.js");
  const previousText = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";
  const previousMatch = previousText.match(/Object\.freeze\(([\s\S]+)\);\s*$/);
  const previous = previousMatch ? JSON.parse(previousMatch[1]) : {};
  const legacyFactories = [...(previous.legacyFactories || [])];
  if (ethers.isAddress(previous.factoryAddress) && ethers.getAddress(previous.factoryAddress) !== ethers.getAddress(address)) {
    legacyFactories.unshift({
      address: ethers.getAddress(previous.factoryAddress),
      deploymentBlock: Number(previous.deploymentBlock || 0),
      protocol: "Uniswap v4",
      feeMode: "internal-match-eth-90-10",
      sourceVerified: previous.sourceVerified === true,
      runtimeCodeHash: previous.runtimeCodeHash || null,
      launchesDeprecated: true,
    });
  }
  const config = {
    chainId: 4663,
    factoryAddress: ethers.getAddress(address),
    hookAddress: ethers.getAddress(address),
    deploymentBlock,
    sourceVerified: true,
    independentAuditComplete: process.env.FACTORY_AUDIT_ACKNOWLEDGED === "true",
    protocol: "Uniswap v4",
    rewardMode: "internal-match-eth-90-10",
    poolFee: 10000,
    poolTickSpacing: 200,
    creatorLpFeeShareBps: 9000,
    developerLpFeeShareBps: 1000,
    developerWallet: ethers.getAddress(developer),
    permissionlessSettlement: true,
    settlementMinOutputBps: 9500,
    settlementBatcher: "0xcA11bde05977b3631167028862bE2a173976CA11",
    wethAddress: await hook.WETH(),
    usdgAddress: await hook.USDG(),
    uniswapV4PoolManager: await hook.UNISWAP_V4_POOL_MANAGER(),
    uniswapV4StateView: await hook.UNISWAP_V4_STATE_VIEW(),
    uniswapV4Quoter: "0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94",
    uniswapV4UniversalRouter: "0x8876789976dEcBfCbBbe364623C63652db8C0904",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    uniswapV3Factory: await hook.UNISWAP_V3_FACTORY(),
    swapRouter02: await hook.SWAP_ROUTER_02(),
    wethUsdgOraclePool: await hook.WETH_USDG_ORACLE_POOL(),
    targetMarketCapUsd: 10000,
    initialActiveTokenBps: 2500,
    stagedTokenBps: 7500,
    stagedPositionCount: 10,
    stagedTrancheTokenBps: 750,
    stagedTickOffsets: [16000, 18600, 21200, 23800, 26400, 28800, 31400, 34000, 36600, 39200],
    stagedActivationMarketCapsUsd: [49500, 64200, 83300, 108000, 140100, 178100, 231000, 299600, 388500, 503900],
    runtimeCodeHash: ethers.keccak256(code),
    launchesPaused: false,
    legacyFactories: legacyFactories.filter((entry, index, values) => (
      ethers.isAddress(entry.address)
      && values.findIndex((candidate) => String(candidate.address).toLowerCase() === String(entry.address).toLowerCase()) === index
    )),
  };
  const serializedConfig = `window.RWI_QUOTE_FACTORY_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)});\n`;
  fs.writeFileSync(configPath, serializedConfig);
  fs.writeFileSync(path.join(projectRoot, "quote-factory-live-config.js"), serializedConfig);
  console.log(`Configured ETH/USDG launches at ${config.factoryAddress} from block ${deploymentBlock}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
