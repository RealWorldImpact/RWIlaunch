const assert = require("assert");
const path = require("path");
const ganache = require("ganache");
const { ethers } = require("ethers");
const compile = require("./compile");

const root = path.resolve(__dirname, "..");
const REQUIRED_HOOK_FLAGS = (1n << 13n) | (1n << 7n) | (1n << 3n);
const ALL_HOOK_FLAGS_MASK = (1n << 14n) - 1n;
const NATIVE_ETH = ethers.ZeroAddress;

function artifact(source, name) {
  return require(path.join(root, "artifacts", "contracts", source, `${name}.json`));
}

async function deploy(signer, source, name, args = []) {
  const compiled = artifact(source, name);
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function deployHookWithPermissionBits(signer, deployer, args) {
  const compiled = artifact("test/TestableEthUsdgV4LaunchHook.sol", "TestableEthUsdgV4LaunchHook");
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, signer);
  const creationCode = (await factory.getDeployTransaction(...args)).data;
  const creationCodeHash = ethers.keccak256(creationCode);
  let salt;
  let address;
  for (let candidate = 0n; candidate < 100_000n; candidate += 1n) {
    const candidateSalt = ethers.zeroPadValue(ethers.toBeHex(candidate), 32);
    const candidateAddress = ethers.getCreate2Address(deployer.target, candidateSalt, creationCodeHash);
    if ((BigInt(candidateAddress) & ALL_HOOK_FLAGS_MASK) === REQUIRED_HOOK_FLAGS) {
      salt = candidateSalt;
      address = candidateAddress;
      break;
    }
  }
  assert.ok(salt && address, "a valid ETH/USDG hook salt should be found");
  await (await deployer.deploy(salt, creationCode, { gasLimit: 28_000_000 })).wait();
  assert.equal((BigInt(address) & ALL_HOOK_FLAGS_MASK).toString(), REQUIRED_HOOK_FLAGS.toString());
  return new ethers.Contract(address, compiled.abi, signer);
}

async function expectRevert(promise, label) {
  let reverted = false;
  try { await promise; } catch { reverted = true; }
  assert.ok(reverted, `${label} should revert`);
}

function launchParams(quoteAsset, overrides = {}) {
  return {
    name: quoteAsset === 0 ? "Ether Launch" : "Dollar Launch",
    symbol: quoteAsset === 0 ? "ETHER" : "DOLLAR",
    quoteAsset,
    devBuyQuoteAmount: 0n,
    minimumDevBuyTokenOut: 0n,
    ...overrides,
  };
}

function tickForRawRatio(rawRatio) {
  return Math.floor(Math.log(rawRatio) / Math.log(1.0001));
}

function findEvent(receipt, contract, eventName) {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === eventName) return parsed;
    } catch {}
  }
  throw new Error(`${eventName} event missing`);
}

function findEvents(receipt, contract, eventName) {
  const events = [];
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === eventName) events.push(parsed);
    } catch {}
  }
  return events;
}

async function fixture(provider) {
  const deployerSigner = await provider.getSigner(0);
  const creator = await provider.getSigner(1);
  const outsider = await provider.getSigner(2);
  const developer = await provider.getSigner(3);
  const weth = await deploy(deployerSigner, "test/MockERC20.sol", "MockWETH");
  const usdg = await deploy(deployerSigner, "test/MockERC20.sol", "MockUSDG");
  await (await deployerSigner.sendTransaction({ to: weth.target, value: ethers.parseEther("500") })).wait();
  const uniswapV3Factory = await deploy(deployerSigner, "test/MockUniswapV3.sol", "MockUniswapV3Factory");
  const swapRouter = await deploy(deployerSigner, "test/MockUniswapV3.sol", "MockSwapRouter02", [
    uniswapV3Factory.target,
    weth.target,
  ]);
  const poolManager = await deploy(deployerSigner, "test/MockUniswapV4.sol", "MockUniswapV4PoolManager");
  const stateView = await deploy(deployerSigner, "test/MockUniswapV4.sol", "MockUniswapV4StateView", [poolManager.target]);

  const wethIsUsdgPoolToken0 = BigInt(weth.target) < BigInt(usdg.target);
  const wethUsdgRawRatio = wethIsUsdgPoolToken0 ? 2_500e6 / 1e18 : 1e18 / 2_500e6;
  const wethUsdgTick = tickForRawRatio(wethUsdgRawRatio);
  const wethUsdgPool = await deploy(deployerSigner, "test/MockUniswapV3.sol", "MockOraclePool", [
    wethIsUsdgPoolToken0 ? weth.target : usdg.target,
    wethIsUsdgPoolToken0 ? usdg.target : weth.target,
    100,
    wethUsdgTick,
    10n ** 20n,
  ]);
  await (await uniswapV3Factory.setPool(weth.target, usdg.target, 100, wethUsdgPool.target)).wait();

  const hookDeployer = await deploy(deployerSigner, "RWIV4HookDeployer.sol", "RWIV4HookDeployer");
  const hook = await deployHookWithPermissionBits(deployerSigner, hookDeployer, [
    weth.target,
    usdg.target,
    poolManager.target,
    stateView.target,
    uniswapV3Factory.target,
    swapRouter.target,
    wethUsdgPool.target,
    await developer.getAddress(),
  ]);
  return {
    deployerSigner,
    creator,
    outsider,
    developer,
    weth,
    usdg,
    uniswapV3Factory,
    swapRouter,
    poolManager,
    stateView,
    wethUsdgPool,
    hook,
  };
}

async function launchAndRead(hook, creator, quoteAsset, overrides = {}, txOverrides = {}) {
  const receipt = await (await hook.connect(creator).launch(
    launchParams(quoteAsset, overrides),
    { gasLimit: 22_000_000, ...txOverrides },
  )).wait();
  const event = findEvent(receipt, hook, "TokenLaunched");
  const quoteEvent = findEvent(receipt, hook, "LaunchQuoteSelected");
  const stagedEvents = findEvents(receipt, hook, "StagedLiquidityConfigured");
  const pricingEvent = findEvent(receipt, hook, "QuoteLaunchPriced");
  const token = new ethers.Contract(event.args.token, artifact("RWILaunchToken.sol", "RWILaunchToken").abi, creator);
  const record = await hook.launches(token.target);
  const pricing = pricingEvent.args;
  const storedKey = await hook.poolKey(token.target);
  const key = {
    currency0: storedKey.currency0,
    currency1: storedKey.currency1,
    fee: storedKey.fee,
    tickSpacing: storedKey.tickSpacing,
    hooks: storedKey.hooks,
  };
  return { receipt, event, quoteEvent, stagedEvents, token, record, pricing, key };
}

async function main() {
  if (process.env.SKIP_COMPILE !== "1") compile();
  const runtime = artifact("RobinhoodEthUsdgV4LaunchHook.sol", "RobinhoodEthUsdgV4LaunchHook").deployedBytecode;
  assert.ok((runtime.length - 2) / 2 <= 24_576, "the immutable production hook must fit EIP-170");

  const eip1193 = ganache.provider({
    logging: { quiet: true },
    chain: { hardfork: "shanghai", allowUnlimitedContractSize: false },
    miner: { blockGasLimit: 30_000_000 },
    wallet: { defaultBalance: 10_000 },
  });
  const provider = new ethers.BrowserProvider(eip1193);

  {
    const { creator, developer, poolManager, hook } = await fixture(provider);
    const creatorAddress = await creator.getAddress();
    const launched = await launchAndRead(hook, creator, 0);
    assert.ok(launched.receipt.gasUsed < 10_000_000n, "progressive launch gas must stay practical");
    assert.deepEqual(
      hook.interface.getFunction("launch").inputs[0].components.map((component) => component.name),
      ["name", "symbol", "quoteAsset", "devBuyQuoteAmount", "minimumDevBuyTokenOut"],
    );
    assert.equal(launched.record.creator, creatorAddress);
    assert.equal(launched.record.quoteToken, NATIVE_ETH);
    assert.equal(launched.record.quoteAsset, 0n);
    assert.equal(launched.key.currency0, NATIVE_ETH, "native ETH must be currency0");
    assert.equal(launched.key.currency1, launched.token.target);
    assert.equal(launched.record.tickLower, -887_200n);
    assert.equal(launched.record.tickUpper, launched.pricing.tokenPerQuoteTick);
    assert.equal(launched.quoteEvent.args.creatorFeeShareBps, 9_000n);
    assert.equal(launched.quoteEvent.args.developerFeeShareBps, 1_000n);
    assert.equal(await hook.developerWallet(), await developer.getAddress());
    assert.equal(await hook.CREATOR_LP_FEE_SHARE_BPS(), 9_000n);
    assert.equal(await hook.DEVELOPER_LP_FEE_SHARE_BPS(), 1_000n);
    assert.equal(await hook.INITIAL_ACTIVE_TOKEN_BPS(), 2_500n);
    assert.equal(await hook.STAGED_TOKEN_BPS(), 7_500n);
    assert.equal(await hook.STAGED_POSITION_COUNT(), 10n);
    await expectRevert(
      hook.connect(creator).seedLockedLiquidity(
        launched.token.target,
        NATIVE_ETH,
        launched.key,
        launched.record.tickUpper,
        0,
        ethers.parseEther("1000000000"),
      ),
      "externally invoked liquidity seeding helper",
    );
    assert.equal(await launched.token.balanceOf(creatorAddress), 0n);
    assert.equal(await launched.token.balanceOf(poolManager.target), launched.record.tokenAmount);
    assert.equal(launched.stagedEvents.length, 10, "ten progressive liquidity positions should be locked");
    const expectedOffsets = [16_000n, 18_600n, 21_200n, 23_800n, 26_400n, 28_800n, 31_400n, 34_000n, 36_600n, 39_200n];
    for (let index = 0; index < launched.stagedEvents.length; index++) {
      const staged = launched.stagedEvents[index];
      assert.ok(
        staged.args.stagedTokenAmount >= ethers.parseEther("74999999")
          && staged.args.stagedTokenAmount <= ethers.parseEther("75000000"),
        "each progressive position should lock 7.5% of supply",
      );
      assert.equal(staged.args.tickLower, launched.record.tickLower);
      assert.equal(staged.args.tickUpper, launched.record.tickUpper - expectedOffsets[index]);
      assert.equal(
        await poolManager.positionLiquidity(
          launched.event.args.poolId,
          hook.target,
          staged.args.tickLower,
          staged.args.tickUpper,
        ),
        staged.args.stagedLiquidity,
      );
    }
    const fullRangeLiquidity = launched.record.liquidity * 4n;
    const responsivenessBps = fullRangeLiquidity * 10_000n / launched.record.liquidity;
    assert.equal(responsivenessBps, 40_000n, "opening liquidity should use only 25% of supply");
    const tokensPerEthRaw = 1.0001 ** Number(launched.pricing.tokenPerQuoteTick);
    const impliedCap = Number(ethers.formatUnits(launched.pricing.quoteUsdPriceE18, 18)) * 1_000_000_000 / tokensPerEthRaw;
    assert.ok(impliedCap >= 9_900 && impliedCap <= 10_100, `ETH launch implied cap ${impliedCap}`);
  }

  {
    const { creator, usdg, poolManager, hook } = await fixture(provider);
    const launched = await launchAndRead(hook, creator, 1);
    assert.equal(launched.record.quoteToken, usdg.target);
    assert.equal(launched.record.quoteAsset, 1n);
    assert.ok(launched.key.currency0 === usdg.target || launched.key.currency1 === usdg.target);
    assert.equal(launched.pricing.quoteUsdPriceE18, ethers.parseEther("1"));
    const rawTokenPerUsdgUnit = 1.0001 ** Number(launched.pricing.tokenPerQuoteTick);
    const humanTokensPerUsdg = rawTokenPerUsdgUnit / 1e12;
    const impliedCap = 1_000_000_000 / humanTokensPerUsdg;
    assert.ok(impliedCap >= 9_900 && impliedCap <= 10_100, `USDG launch implied cap ${impliedCap}`);
    assert.equal(await launched.token.balanceOf(poolManager.target), launched.record.tokenAmount);
    const tokenIs0 = launched.key.currency0 === launched.token.target;
    assert.equal(launched.stagedEvents.length, 10);
    assert.equal(
      launched.stagedEvents[0].args.tickLower,
      tokenIs0 ? launched.record.tickLower + 16_000n : launched.record.tickLower,
    );
    assert.equal(
      launched.stagedEvents[0].args.tickUpper,
      tokenIs0 ? launched.record.tickUpper : launched.record.tickUpper - 16_000n,
    );
  }

  {
    const { creator, poolManager, hook } = await fixture(provider);
    const devBuyAmount = ethers.parseEther("2");
    await expectRevert(
      hook.connect(creator).launch.staticCall(launchParams(0, { devBuyQuoteAmount: devBuyAmount }), { value: 0 }),
      "ETH dev buy without native value",
    );
    const quote = await hook.connect(creator).launch.staticCall(
      launchParams(0, { devBuyQuoteAmount: devBuyAmount }),
      { value: devBuyAmount, gasLimit: 22_000_000 },
    );
    const launched = await launchAndRead(
      hook,
      creator,
      0,
      { devBuyQuoteAmount: devBuyAmount, minimumDevBuyTokenOut: quote.devBuyTokenAmount },
      { value: devBuyAmount },
    );
    assert.equal(launched.record.initialQuoteAmount, devBuyAmount);
    assert.equal(await launched.token.balanceOf(await creator.getAddress()), quote.devBuyTokenAmount);
    assert.equal(BigInt(await provider.send("eth_getBalance", [hook.target, "latest"])), 0n);
    assert.equal(await poolManager.swapCallCount(), 1n);
  }

  {
    const { creator, usdg, poolManager, hook } = await fixture(provider);
    const creatorAddress = await creator.getAddress();
    const devBuyAmount = ethers.parseUnits("250", 6);
    await (await usdg.mint(creatorAddress, devBuyAmount)).wait();
    await (await usdg.connect(creator).approve(hook.target, devBuyAmount)).wait();
    await expectRevert(
      hook.connect(creator).launch.staticCall(launchParams(1), { value: 1n }),
      "USDG launch with native value",
    );
    const launched = await launchAndRead(hook, creator, 1, { devBuyQuoteAmount: devBuyAmount });
    assert.equal(launched.record.initialQuoteAmount, devBuyAmount);
    assert.equal(await usdg.balanceOf(creatorAddress), 0n);
    assert.ok(await launched.token.balanceOf(creatorAddress) > 0n);
    assert.equal(await poolManager.swapCallCount(), 1n);
  }

  {
    const { deployerSigner, creator, outsider, developer, poolManager, swapRouter, hook } = await fixture(provider);
    const creatorAddress = await creator.getAddress();
    const developerAddress = await developer.getAddress();
    const launched = await launchAndRead(hook, creator, 0);
    const tokenFee = ethers.parseEther("100");
    const ethFee = ethers.parseEther("1");
    const stagedTokenFee = ethers.parseEther("50");
    const stagedEthFee = ethers.parseEther("0.5");
    const tokenIs0 = launched.key.currency0 === launched.token.target;
    await (await deployerSigner.sendTransaction({ to: poolManager.target, value: ethers.parseEther("10") })).wait();
    await (await poolManager.seedFees(
      launched.event.args.poolId,
      hook.target,
      launched.record.tickLower,
      launched.record.tickUpper,
      tokenIs0 ? tokenFee : ethFee,
      tokenIs0 ? ethFee : tokenFee,
    )).wait();
    await (await poolManager.seedFees(
      launched.event.args.poolId,
      hook.target,
      launched.stagedEvents.at(-1).args.tickLower,
      launched.stagedEvents.at(-1).args.tickUpper,
      tokenIs0 ? stagedTokenFee : stagedEthFee,
      tokenIs0 ? stagedEthFee : stagedTokenFee,
    )).wait();

    await (await hook.connect(outsider).collectFeesForRevenue(launched.record.positionTokenId)).wait();
    const totalTokenFee = tokenFee + stagedTokenFee;
    const totalEthFee = ethFee + stagedEthFee;
    assert.equal(await hook.tokenFeeInventory(launched.record.positionTokenId), totalTokenFee);
    assert.equal(await hook.claimableEthRewards(launched.record.positionTokenId), totalEthFee * 9n / 10n);
    assert.equal(await hook.claimableDeveloperEthRewards(), totalEthFee / 10n);
    assert.equal(await poolManager.swapCallCount(), 0n);
    assert.equal(await swapRouter.swapCallCount(), 0n);

    const buyParams = {
      zeroForOne: launched.key.currency0 === NATIVE_ETH,
      amountSpecified: -ethers.parseEther("1"),
      sqrtPriceLimitX96: 4_295_128_740n,
    };
    const internalReceipt = await (await poolManager.simulateBeforeSwap(launched.key, buyParams)).wait();
    const matched = findEvent(internalReceipt, hook, "InternalFeeMatch");
    assert.equal(matched.args.tokenAmount, totalTokenFee);
    assert.ok(matched.args.quoteAmount > 0n);
    const developerShare = totalEthFee / 10n + matched.args.quoteAmount / 10n;
    const creatorShare = totalEthFee + matched.args.quoteAmount - developerShare;
    assert.equal(await hook.claimableEthRewards(launched.record.positionTokenId), creatorShare);
    assert.equal(await hook.claimableDeveloperEthRewards(), developerShare);
    assert.equal(await hook.tokenFeeInventory(launched.record.positionTokenId), 0n);
    assert.equal(await poolManager.swapCallCount(), 0n, "native revenue matching must not touch the token AMM");

    await expectRevert(
      hook.connect(outsider).claimEthRewards.staticCall(launched.record.positionTokenId),
      "non-creator native reward claim",
    );
    await (await hook.connect(creator).claimEthRewards(launched.record.positionTokenId)).wait();
    assert.equal(await hook.claimableEthRewards(launched.record.positionTokenId), 0n);
    assert.equal(await provider.getBalance(hook.target), developerShare);
    const developerBalanceBefore = BigInt(await provider.send("eth_getBalance", [developerAddress, "latest"]));
    const devReceipt = await (await hook.connect(outsider).claimDeveloperEthRewards()).wait();
    const developerClaim = findEvent(devReceipt, hook, "DeveloperEthRewardsClaimed");
    assert.equal(developerClaim.args.developerWallet, developerAddress);
    assert.equal(developerClaim.args.ethAmount, developerShare);
    assert.equal(
      BigInt(await provider.send("eth_getBalance", [developerAddress, "latest"])),
      developerBalanceBefore + developerShare,
    );
    assert.equal(BigInt(await provider.send("eth_getBalance", [hook.target, "latest"])), 0n);
    assert.equal(await poolManager.swapCallCount(), 0n);
    assert.equal(await swapRouter.swapCallCount(), 0n);
    assert.equal(await launched.token.balanceOf(creatorAddress), 0n);
  }

  {
    const { creator, outsider, usdg, poolManager, swapRouter, hook } = await fixture(provider);
    const launched = await launchAndRead(hook, creator, 1);
    const tokenFee = ethers.parseEther("250");
    const usdgFee = ethers.parseUnits("100", 6);
    const stagedTokenFee = ethers.parseEther("125");
    const stagedUsdgFee = ethers.parseUnits("50", 6);
    const tokenIs0 = launched.key.currency0 === launched.token.target;
    await (await usdg.mint(poolManager.target, ethers.parseUnits("1000", 6))).wait();
    await (await poolManager.seedFees(
      launched.event.args.poolId,
      hook.target,
      launched.record.tickLower,
      launched.record.tickUpper,
      tokenIs0 ? tokenFee : usdgFee,
      tokenIs0 ? usdgFee : tokenFee,
    )).wait();
    await (await poolManager.seedFees(
      launched.event.args.poolId,
      hook.target,
      launched.stagedEvents[0].args.tickLower,
      launched.stagedEvents[0].args.tickUpper,
      tokenIs0 ? stagedTokenFee : stagedUsdgFee,
      tokenIs0 ? stagedUsdgFee : stagedTokenFee,
    )).wait();
    await (await hook.connect(outsider).collectFeesForRevenue(launched.record.positionTokenId)).wait();
    const totalTokenFee = tokenFee + stagedTokenFee;
    const totalUsdgFee = usdgFee + stagedUsdgFee;
    assert.equal(await hook.convertibleQuoteRewards(launched.record.positionTokenId), totalUsdgFee);
    assert.equal(await hook.claimableEthRewards(launched.record.positionTokenId), 0n);

    const buyParams = {
      zeroForOne: launched.key.currency0 === usdg.target,
      amountSpecified: -ethers.parseUnits("50", 6),
      sqrtPriceLimitX96: 4_295_128_740n,
    };
    const internalReceipt = await (await poolManager.simulateBeforeSwap(launched.key, buyParams)).wait();
    const matched = findEvent(internalReceipt, hook, "InternalFeeMatch");
    assert.equal(matched.args.tokenAmount, totalTokenFee);
    assert.ok(matched.args.quoteAmount > 0n);
    const convertible = totalUsdgFee + matched.args.quoteAmount;
    assert.equal(await hook.convertibleQuoteRewards(launched.record.positionTokenId), convertible);
    assert.equal(await poolManager.swapCallCount(), 0n);

    const latestBlock = await provider.getBlock("latest");
    const deadline = BigInt(latestBlock.timestamp + 600);
    await (await swapRouter.setOutputScale(10n ** 12n, 2_500n)).wait();
    await (await swapRouter.setOutputBps(9_400)).wait();
    await expectRevert(
      hook.connect(outsider).convertQuoteRewardsToEth.staticCall(
        launched.record.positionTokenId,
        0,
        deadline,
      ),
      "permissionless USDG conversion below the oracle floor",
    );
    await (await swapRouter.setOutputBps(9_900)).wait();
    const quote = await hook.connect(outsider).convertQuoteRewardsToEth.staticCall(
      launched.record.positionTokenId,
      0,
      deadline,
    );
    assert.equal(quote.quoteAmount, convertible);
    assert.equal(quote.grossEthAmount, convertible * 10n ** 12n / 2_500n * 9_900n / 10_000n);
    assert.equal(quote.creatorEthAmount + quote.developerEthAmount, quote.grossEthAmount);
    assert.equal(quote.developerEthAmount, quote.grossEthAmount / 10n);
    await expectRevert(
      hook.connect(creator).convertQuoteRewardsToEth.staticCall(
        launched.record.positionTokenId,
        quote.grossEthAmount + 1n,
        deadline,
      ),
      "USDG-to-ETH minimum output",
    );
    await (await hook.connect(outsider).convertQuoteRewardsToEth(
      launched.record.positionTokenId,
      quote.grossEthAmount,
      deadline,
    )).wait();
    assert.equal(await hook.convertibleQuoteRewards(launched.record.positionTokenId), 0n);
    assert.equal(await hook.claimableEthRewards(launched.record.positionTokenId), quote.creatorEthAmount);
    assert.equal(await hook.claimableDeveloperEthRewards(), quote.developerEthAmount);
    const usdValue = quote.creatorEthAmount * await hook.ethUsdPriceE18() / 10n ** 18n;
    const impliedEthUsd = Number(ethers.formatUnits(usdValue, 18)) / Number(ethers.formatEther(quote.creatorEthAmount));
    assert.ok(impliedEthUsd >= 2_475 && impliedEthUsd <= 2_525, `implied ETH/USD ${impliedEthUsd}`);
    assert.equal(await poolManager.swapCallCount(), 0n, "USDG conversion must not sell into the token pool");
    assert.equal(await swapRouter.swapCallCount(), 1n, "only the USDG/WETH conversion may swap");

    await (await hook.connect(creator).claimEthRewards(launched.record.positionTokenId)).wait();
    await (await hook.connect(outsider).claimDeveloperEthRewards()).wait();
    assert.equal(BigInt(await provider.send("eth_getBalance", [hook.target, "latest"])), 0n);
    assert.equal(await poolManager.swapCallCount(), 0n);
    assert.equal(await swapRouter.swapCallCount(), 1n);
  }

  console.log("ETH/USDG launch pricing, native settlement, internal matching, and 90/10 ETH revenue tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
