window.RWI_FACTORY_ABI = Object.freeze([
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "InvalidIntegration",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidLiquidityResult",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidMetadata",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PoolAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PoolCreationFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnexpectedNFT",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnexpectedRWIUsage",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnknownPosition",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnsupportedFeeTier",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "actualChainId",
        "type": "uint256"
      }
    ],
    "name": "WrongChain",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionTokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount0",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount1",
        "type": "uint256"
      }
    ],
    "name": "FeesCollected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "pool",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "positionTokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "liquidity",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "initialRwiAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "liquidityPermanentlyLocked",
        "type": "bool"
      }
    ],
    "name": "TokenLaunched",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CREATOR_LP_FEE_SHARE_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "INITIAL_RWI_LIQUIDITY",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LIQUIDITY_PERMANENTLY_LOCKED",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_LOCKED_TOKEN_DUST",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "NONFUNGIBLE_POSITION_MANAGER",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "OPENING_ABS_TICK",
    "outputs": [
      {
        "internalType": "int24",
        "name": "",
        "type": "int24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "OPENING_TOKENS_PER_RWI_APPROX",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "POOL_ALLOCATION_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "POOL_FEE",
    "outputs": [
      {
        "internalType": "uint24",
        "name": "",
        "type": "uint24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ROBINHOOD_CHAIN_ID",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "RWI",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "UNISWAP_V3_FACTORY",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionTokenId",
        "type": "uint256"
      }
    ],
    "name": "collectFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amount0",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount1",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol",
            "type": "string"
          }
        ],
        "internalType": "struct DirectRWIUniswapV3LaunchFactory.LaunchParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "launch",
    "outputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "pool",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "positionTokenId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "launches",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "pool",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "positionTokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint128",
        "name": "liquidity",
        "type": "uint128"
      },
      {
        "internalType": "bool",
        "name": "liquidityPermanentlyLocked",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "tokenAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "initialRwiAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "onERC721Received",
    "outputs": [
      {
        "internalType": "bytes4",
        "name": "",
        "type": "bytes4"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionTokenId",
        "type": "uint256"
      }
    ],
    "name": "positionCreators",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "positionManager",
    "outputs": [
      {
        "internalType": "contract INonfungiblePositionManagerMinimal",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rwi",
    "outputs": [
      {
        "internalType": "contract IERC20Metadata",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "uniswapFactory",
    "outputs": [
      {
        "internalType": "contract IUniswapV3Factory",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]);
