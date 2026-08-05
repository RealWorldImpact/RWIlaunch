// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {ISwapRouter02Minimal} from "./interfaces/ISwapRouter02Minimal.sol";
import {IUniswapV3OraclePoolMinimal} from "./interfaces/IUniswapV3OraclePoolMinimal.sol";
import {IUniswapV4PoolManagerMinimal} from "./interfaces/IUniswapV4PoolManagerMinimal.sol";
import {IUniswapV4StateViewMinimal} from "./interfaces/IUniswapV4StateViewMinimal.sol";
import {DirectPonsV4LaunchHook} from "./DirectPonsV4LaunchHook.sol";

/// @notice Immutable Robinhood Chain configuration for TOKEN/PONS launch markets.
contract RobinhoodPonsV4LaunchHook is DirectPonsV4LaunchHook {
    address public constant PONS = 0x39dBED3a2bd333467115dE45665cC57F813C4571;
    address public constant WETH = 0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73;
    address public constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168;
    address public constant UNISWAP_V4_POOL_MANAGER = 0x8366a39CC670B4001A1121B8F6A443A643e40951;
    address public constant UNISWAP_V4_STATE_VIEW = 0xF3334192D15450CdD385c8B70e03f9A6bD9E673b;
    address public constant UNISWAP_V3_FACTORY = 0x1f7d7550B1b028f7571E69A784071F0205FD2EfA;
    address public constant SWAP_ROUTER_02 = 0xCaf681a66D020601342297493863E78C959E5cb2;
    address public constant PONS_WETH_ORACLE_POOL = 0x10CC6BD38112cAc182db90B6a71d8Bb5939526bA;
    address public constant WETH_USDG_ORACLE_POOL = 0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca;
    address payable public constant DEVELOPMENT_WALLET = payable(0x9CD7C9196A4C1836A3DF089cb210272e07e6A5e5);
    uint256 public constant ROBINHOOD_CHAIN_ID = 4663;

    error WrongChain(uint256 actualChainId);

    constructor()
        DirectPonsV4LaunchHook(
            IERC20Metadata(PONS),
            IERC20Metadata(WETH),
            IERC20Metadata(USDG),
            IUniswapV4PoolManagerMinimal(UNISWAP_V4_POOL_MANAGER),
            IUniswapV4StateViewMinimal(UNISWAP_V4_STATE_VIEW),
            IUniswapV3Factory(UNISWAP_V3_FACTORY),
            ISwapRouter02Minimal(SWAP_ROUTER_02),
            IUniswapV3OraclePoolMinimal(PONS_WETH_ORACLE_POOL),
            IUniswapV3OraclePoolMinimal(WETH_USDG_ORACLE_POOL),
            DEVELOPMENT_WALLET
        )
    {
        if (block.chainid != ROBINHOOD_CHAIN_ID) revert WrongChain(block.chainid);
    }
}
