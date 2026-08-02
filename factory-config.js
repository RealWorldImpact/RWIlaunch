(() => {
  const storageKey = "rwi-launchpad-factory-address-v1";
  const localPage = location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const bootstrapRequested = localPage || new URLSearchParams(location.search).get("deployFactory") === "1";
  let locallyDeployedAddress = null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (/^0x[0-9a-fA-F]{40}$/.test(saved || "")) locallyDeployedAddress = saved;
  } catch {}

  window.RWI_FACTORY_CONFIG = Object.freeze({
    chainId: 4663,
    factoryAddress: locallyDeployedAddress,
    factoryAddressStorageKey: storageKey,
    allowBrowserDeployment: bootstrapRequested,
    sourceVerified: false,
    protocol: "Uniswap v3",
    poolFee: 10000,
    rwiAddress: "0x2286397228be256529BE1ae9ed8D7d16549e9C6A",
    uniswapV3Factory: "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA",
    nonfungiblePositionManager: "0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3",
  });
})();
