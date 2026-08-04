const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ethers } = require("ethers");

const element = () => ({
  addEventListener() {},
  classList: { add() {}, remove() {}, toggle() {} },
  setAttribute() {},
  textContent: "",
  value: "",
  hidden: false,
  dataset: {},
});
const document = {
  querySelector: () => element(),
  querySelectorAll: () => [],
  createElement: () => element(),
  title: "",
};
const context = {
  window: {
    ethers,
    RWI_TOKEN_PAGE_TEST_MODE: true,
    RWI_FACTORY_CONFIG: {
      poolFee: 10_000,
      poolTickSpacing: 200,
      uniswapV4PoolManager: "0x8366a39CC670B4001A1121B8F6A443A643e40951",
    },
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

const page = context.window.RWITokenPage;
const state = page.__testState;
state.token = "0x0327C02821aE603caD215c796080B232C39549b3";
state.tokenSymbol = "BOOMER";
state.tradeSource = { address: "0x0Fb46f019eBf66D0767E891f8fACe687F1156088", protocol: "Uniswap v4" };
const [currency0, currency1, fee, spacing, hooks] = page.directTradePoolKey();
const poolKey = [currency0, currency1, fee, spacing, hooks];
const rwi = "0x2286397228be256529BE1ae9ed8D7d16549e9C6A";
const tokenIs0 = BigInt(state.token) < BigInt(rwi);
const deadline = 2_000_000_000n;
const router = new ethers.Interface(["function execute(bytes commands,bytes[] inputs,uint256 deadline) payable"]);
const coder = ethers.AbiCoder.defaultAbiCoder();

function decodeRouted(quote) {
  const encoded = page.encodeRoutedTrade(quote, deadline);
  const decoded = router.decodeFunctionData("execute", encoded.data);
  assert.strictEqual(decoded[0], encoded.commands);
  assert.strictEqual(decoded[2], deadline);
  return { encoded, commands: decoded[0], inputs: decoded[1] };
}

function v4Quote(direction, asset) {
  const buying = direction === "buy";
  return {
    routeProtocol: "v4",
    direction,
    settlementAsset: asset,
    amountIn: buying ? 1_000_000_000_000_000n : ethers.parseEther("100"),
    minimumAmountOut: buying ? ethers.parseEther("1000") : (asset === "USDG" ? 900_000n : 300_000_000_000_000n),
    minimumRwiOut: buying ? undefined : ethers.parseEther("50"),
    rwiAmount: buying ? ethers.parseEther("50") : undefined,
    bridgePath: buying ? page.v3BridgeExactOutputPath(asset) : page.v3BridgeExactInputPath(asset, "sell"),
    poolKey,
    zeroForOne: buying ? !tokenIs0 : tokenIs0,
  };
}

const buyEth = decodeRouted(v4Quote("buy", "ETH"));
assert.strictEqual(buyEth.commands, "0x0b01100c");
assert.strictEqual(buyEth.encoded.nativeValue, 1_000_000_000_000_000n);
assert.strictEqual(coder.decode(["bytes", "bytes[]"], buyEth.inputs[2])[0], "0x060b0f");

const buyUsdg = decodeRouted(v4Quote("buy", "USDG"));
assert.strictEqual(buyUsdg.commands, "0x0110");
assert.strictEqual(buyUsdg.encoded.nativeValue, 0n);

const sellEth = decodeRouted(v4Quote("sell", "ETH"));
assert.strictEqual(sellEth.commands, "0x10000c");
assert.strictEqual(coder.decode(["bytes", "bytes[]"], sellEth.inputs[0])[0], "0x060b0e");

const sellUsdg = decodeRouted(v4Quote("sell", "USDG"));
assert.strictEqual(sellUsdg.commands, "0x1000");

function directQuote(direction, quoteSymbol, quoteAddress) {
  state.tradeSource = {
    address: "0x0Fb46f019eBf66D0767E891f8fACe687F1156088",
    protocol: "Uniswap v4",
    directQuote: true,
    quoteSymbol,
    quoteAddress,
  };
  state.tradeDirection = direction;
  const directPoolKey = page.directTradePoolKey();
  const buying = direction === "buy";
  return {
    routeProtocol: "v4",
    directQuote: true,
    direction,
    settlementAsset: quoteSymbol,
    amountIn: buying ? ethers.parseEther("0.01") : ethers.parseEther("100"),
    minimumAmountOut: buying ? ethers.parseEther("900") : ethers.parseEther("0.009"),
    quoteAmount: buying ? ethers.parseEther("0.01") : ethers.parseEther("0.01"),
    minimumQuoteOut: buying ? 0n : ethers.parseEther("0.009"),
    poolKey: directPoolKey,
    zeroForOne: page.directTradeCurrencies().zeroForOne,
  };
}

const directEthBuy = decodeRouted(directQuote("buy", "ETH", ethers.ZeroAddress));
assert.strictEqual(directEthBuy.commands, "0x10");
assert.strictEqual(directEthBuy.encoded.nativeValue, ethers.parseEther("0.01"));
assert.strictEqual(coder.decode(["bytes", "bytes[]"], directEthBuy.inputs[0])[0], "0x060b0f");
const directEthSell = decodeRouted(directQuote("sell", "ETH", ethers.ZeroAddress));
assert.strictEqual(directEthSell.commands, "0x10");
assert.strictEqual(directEthSell.encoded.nativeValue, 0n);
assert.strictEqual(coder.decode(["bytes", "bytes[]"], directEthSell.inputs[0])[0], "0x060b0e");
const directUsdgBuy = decodeRouted(directQuote("buy", "USDG", "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"));
assert.strictEqual(directUsdgBuy.commands, "0x10");
assert.strictEqual(directUsdgBuy.encoded.nativeValue, 0n);

function crossDirectQuote(direction, poolQuoteSymbol, settlementAsset) {
  const poolQuoteAddress = poolQuoteSymbol === "USDG"
    ? "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"
    : ethers.ZeroAddress;
  state.tradeSource = {
    address: "0x0Fb46f019eBf66D0767E891f8fACe687F1156088",
    protocol: "Uniswap v4",
    directQuote: true,
    quoteSymbol: poolQuoteSymbol,
    quoteAddress: poolQuoteAddress,
  };
  state.tradeDirection = direction;
  const buying = direction === "buy";
  const directPoolKey = page.directTradePoolKey();
  return {
    routeProtocol: "v4",
    directQuote: true,
    crossSettlement: true,
    direction,
    settlementAsset,
    amountIn: buying ? ethers.parseEther("0.01") : ethers.parseEther("100"),
    minimumAmountOut: buying ? ethers.parseEther("900") : (settlementAsset === "USDG" ? 9_000_000n : ethers.parseEther("0.009")),
    quoteAmount: poolQuoteSymbol === "USDG" ? 10_000_000n : ethers.parseEther("0.01"),
    minimumQuoteOut: poolQuoteSymbol === "USDG" ? 9_000_000n : ethers.parseEther("0.009"),
    bridgePath: buying
      ? page.directQuoteBridgeExactOutputPath(settlementAsset, poolQuoteSymbol)
      : page.directQuoteBridgeExactInputPath(poolQuoteSymbol, settlementAsset),
    poolKey: directPoolKey,
    zeroForOne: page.directTradeCurrencies().zeroForOne,
  };
}

const ethToUsdgPoolBuy = decodeRouted(crossDirectQuote("buy", "USDG", "ETH"));
assert.strictEqual(ethToUsdgPoolBuy.commands, "0x0b01100c");
assert.strictEqual(ethToUsdgPoolBuy.encoded.nativeValue, ethers.parseEther("0.01"));
const usdgPoolToEthSell = decodeRouted(crossDirectQuote("sell", "USDG", "ETH"));
assert.strictEqual(usdgPoolToEthSell.commands, "0x10000c");

const usdgToEthPoolBuy = decodeRouted(crossDirectQuote("buy", "ETH", "USDG"));
assert.strictEqual(usdgToEthPoolBuy.commands, "0x010c10");
assert.strictEqual(usdgToEthPoolBuy.encoded.nativeValue, 0n);
const ethPoolToUsdgSell = decodeRouted(crossDirectQuote("sell", "ETH", "USDG"));
assert.strictEqual(ethPoolToUsdgSell.commands, "0x100b00");

function v3Quote(direction, asset) {
  state.tradeDirection = direction;
  return {
    routeProtocol: "v3",
    direction,
    settlementAsset: asset,
    amountIn: ethers.parseEther("1"),
    minimumAmountOut: ethers.parseEther("2"),
    v3Path: page.legacyV3TradePath(direction, asset, 10_000),
  };
}

assert.strictEqual(decodeRouted(v3Quote("buy", "ETH")).commands, "0x0b00");
assert.strictEqual(decodeRouted(v3Quote("buy", "USDG")).commands, "0x00");
assert.strictEqual(decodeRouted(v3Quote("sell", "ETH")).commands, "0x000c");
assert.strictEqual(decodeRouted(v3Quote("sell", "USDG")).commands, "0x00");

const usdgBuyPath = page.v3BridgeExactInputPath("USDG", "buy").toLowerCase();
assert.ok(usdgBuyPath.startsWith("0x5fc5360d0400a0fd4f2af552add042d716f1d168000064"));
assert.ok(usdgBuyPath.endsWith("0027102286397228be256529be1ae9ed8d7d16549e9c6a"));

const q96 = 2n ** 96n;
assert.strictEqual(page.quoteFromSqrtPrice(q96, true, 18, 18), 1);
assert.strictEqual(page.quoteFromSqrtPrice(q96, true, 18, 6), 1e12);
assert.strictEqual(page.quoteFromSqrtPrice(q96, false, 18, 6), 1e12);

const legacyTruncatedDescription = `${"x".repeat(275)} perf`;
assert.strictEqual(legacyTruncatedDescription.length, 280);
assert.ok(page.displayedTokenDescription(legacyTruncatedDescription).endsWith("…"));
assert.ok(!page.displayedTokenDescription(legacyTruncatedDescription).endsWith("perf"));
const completeDescription = "A complete description with punctuation.";
assert.strictEqual(page.displayedTokenDescription(completeDescription), completeDescription);
console.log("Settlement routing, decimal-aware pricing, description rendering, and path tests passed.");
