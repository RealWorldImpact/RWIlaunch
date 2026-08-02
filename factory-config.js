window.RWI_FACTORY_CONFIG = Object.freeze({
  "chainId": 4663,
  "factoryAddress": "0x1CD4ba989b530E0c5bf13cB780346A2d2BAaE000",
  "hookAddress": "0x1CD4ba989b530E0c5bf13cB780346A2d2BAaE000",
  "sourceVerified": true,
  "independentAuditComplete": false,
  "unauditedRiskAccepted": true,
  "launchesPaused": true,
  "launchesPausedReason": "The first v4 deployment can initialize token-as-currency1 pools with zero reported active liquidity. Existing launches remain readable and directly tradable; new launches require the corrected immutable hook.",
  "allowBrowserDeployment": true,
  "factoryAddressStorageKey": "rwi-launchpad-factory-address-v4",
  "protocol": "Uniswap v4",
  "poolFee": 10000,
  "poolTickSpacing": 200,
  "rwiAddress": "0x2286397228be256529BE1ae9ed8D7d16549e9C6A",
  "wethAddress": "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  "usdgAddress": "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  "uniswapV4PoolManager": "0x8366a39CC670B4001A1121B8F6A443A643e40951",
  "uniswapV4StateView": "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b",
  "uniswapV4UniversalRouter": "0x8876789976dEcBfCbBbe364623C63652db8C0904",
  "uniswapV3Factory": "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA",
  "swapRouter02": "0xCaf681a66D020601342297493863E78C959E5cb2",
  "rwiWethOraclePool": "0xFf6AA24815d1274a9bE0CfD17C7c7489Cd40A697",
  "wethUsdgOraclePool": "0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca",
  "targetMarketCapUsd": 10000,
  "pricingBasis": "30-minute RWI/WETH and WETH/USDG Uniswap v3 TWAPs",
  "deploymentBlock": 26068777,
  "configuredAtBlock": 26073051,
  "runtimeCodeHash": "0x9a9573b03ca9969ca2e1f89295f3bc051be88f62f2350b7fb8beedffa71c4938",
  "legacyFactories": [
    {
      "address": "0x660a415CA5C39E14d31e54Bf783eaE4f26A962fA",
      "deploymentBlock": 25680584,
      "protocol": "Uniswap v3",
      "feeMode": "eth",
      "sourceVerified": true,
      "runtimeCodeHash": "0xca0036391b2672d29d9913aeaca5eed7087849c2a05ee952aef98d988a11abc3"
    },
    {
      "address": "0xD8F82ed33D9663854b164705dafBD467f31C9F16",
      "deploymentBlock": 25524373,
      "protocol": "Uniswap v3",
      "feeMode": "tokens",
      "sourceVerified": true,
      "runtimeCodeHash": "0xce400717e76333cba9a592494830fc55c8cf4e853442d276ef843006d38ebcba"
    }
  ]
});
