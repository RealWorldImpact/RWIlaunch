const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ethers } = require("ethers");

const RPC = "https://rpc.mainnet.chain.robinhood.com";
const TOKEN = "0x0327C02821aE603caD215c796080B232C39549b3";
const LEGACY_TOKEN = "0xC29D66d54D2eD13fFFdc89323E5A9d70C197EaEC";
const LEGACY_POOL = "0x2350d77331F5290227133a27f0786473862Cb381";
const RWI = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
const HOOK = "0x0Fb46f019eBf66D0767E891f8fACe687F1156088";
const V3_QUOTER = "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7";
const V4_QUOTER = "0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94";
const UNIVERSAL_ROUTER = "0x8876789976dEcBfCbBbe364623C63652db8C0904";

function loadTokenPageHelpers() {
  const noopElement = () => ({
    addEventListener() {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    textContent: "",
    value: "",
    hidden: false,
    dataset: {},
  });
  const document = { querySelector: noopElement, querySelectorAll: () => [], createElement: noopElement, title: "" };
  const context = {
    window: {
      ethers,
      RWI_TOKEN_PAGE_TEST_MODE: true,
      RWI_FACTORY_CONFIG: { poolFee: 10_000, poolTickSpacing: 200, uniswapV4PoolManager: "0x8366a39CC670B4001A1121B8F6A443A643e40951" },
      RWI_FACTORY_ABI: [],
      RWI_PROFILE_REGISTRY: {},
      RWI_PROFILE_REGISTRY_ABI: [],
      addEventListener() {},
      location: { href: "https://rwilaunch.vercel.app/token.html", protocol: "https:" },
    },
    document,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    console,
    Blob,
  };
  context.window.window = context.window;
  context.window.document = document;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "token.js"), "utf8"), context);
  return context.window.RWITokenPage;
}

async function main() {
  const page = loadTokenPageHelpers();
  const state = page.__testState;
  state.token = TOKEN;
  state.tokenSymbol = "BOOMER";
  state.tradeDirection = "buy";
  state.tradeSource = { address: HOOK, protocol: "Uniswap v4" };

  const provider = new ethers.JsonRpcProvider(RPC, 4663, { staticNetwork: true });
  const v3 = new ethers.Contract(V3_QUOTER, [
    "function quoteExactInput(bytes,uint256) returns(uint256,uint160[],uint32[],uint256)",
    "function quoteExactOutput(bytes,uint256) returns(uint256,uint160[],uint32[],uint256)",
  ], provider);
  const v4 = new ethers.Contract(V4_QUOTER, [
    "function quoteExactInputSingle(((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks),bool,uint128,bytes)) returns(uint256,uint256)",
  ], provider);
  const amountIn = ethers.parseEther("0.001");
  const bridgeInputPath = ethers.solidityPacked(["address", "uint24", "address"], [WETH, 10_000, RWI]);
  const bridgeMaximumRwi = BigInt((await v3.quoteExactInput.staticCall(bridgeInputPath, amountIn))[0]);
  const rwiAmount = bridgeMaximumRwi * 9_850n / 10_000n;
  const bridgePath = page.v3BridgeExactOutputPath("ETH");
  const estimatedInput = BigInt((await v3.quoteExactOutput.staticCall(bridgePath, rwiAmount))[0]);
  if (estimatedInput > amountIn) throw new Error("Live bridge quote exceeds the spend maximum.");

  const poolKey = page.directTradePoolKey();
  const zeroForOne = BigInt(RWI) < BigInt(TOKEN);
  const tokenOut = BigInt((await v4.quoteExactInputSingle.staticCall([poolKey, zeroForOne, rwiAmount, "0x"]))[0]);
  const quote = {
    routeProtocol: "v4",
    direction: "buy",
    settlementAsset: "ETH",
    amountIn,
    minimumAmountOut: tokenOut * 9_850n / 10_000n,
    rwiAmount,
    bridgePath,
    poolKey,
    zeroForOne,
  };
  const latest = await provider.getBlock("latest");
  const routed = page.encodeRoutedTrade(quote, BigInt(latest.timestamp + 600));
  const simulationAccount = "0x9CD7C9196A4C1836A3DF089cb210272e07e6A5e5";
  const balance = await provider.getBalance(simulationAccount);
  if (balance < amountIn) throw new Error("The read-only simulation account lacks enough ETH.");
  await provider.call({ from: simulationAccount, to: UNIVERSAL_ROUTER, data: routed.data, value: routed.nativeValue });
  console.log(`Live v4 atomic ETH route simulated successfully (${routed.commands}); no transaction was broadcast.`);

  state.token = LEGACY_TOKEN;
  state.tokenSymbol = "TESTCOIN";
  state.tradeDirection = "buy";
  state.tradeSource = { address: null, protocol: "Uniswap v3", poolAddress: LEGACY_POOL };
  const legacyAmountIn = ethers.parseEther("0.0001");
  const legacyPath = page.legacyV3TradePath("buy", "ETH", 10_000);
  const legacyOut = BigInt((await v3.quoteExactInput.staticCall(legacyPath, legacyAmountIn))[0]);
  const legacyQuote = {
    routeProtocol: "v3",
    direction: "buy",
    settlementAsset: "ETH",
    amountIn: legacyAmountIn,
    minimumAmountOut: legacyOut * 9_700n / 10_000n,
    v3Path: legacyPath,
  };
  const legacyRouted = page.encodeRoutedTrade(legacyQuote, BigInt(latest.timestamp + 600));
  await provider.call({ from: simulationAccount, to: UNIVERSAL_ROUTER, data: legacyRouted.data, value: legacyRouted.nativeValue });
  console.log(`Live v3 atomic ETH route simulated successfully (${legacyRouted.commands}); no transaction was broadcast.`);
}

main().catch((error) => {
  console.error(error?.shortMessage || error?.message || error);
  process.exitCode = 1;
});
