// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {ISwapRouter02Minimal} from "../interfaces/ISwapRouter02Minimal.sol";
import {IUniswapV3OraclePoolMinimal} from "../interfaces/IUniswapV3OraclePoolMinimal.sol";
import {IUniswapV4PoolManagerMinimal} from "../interfaces/IUniswapV4PoolManagerMinimal.sol";
import {IUniswapV4StateViewMinimal} from "../interfaces/IUniswapV4StateViewMinimal.sol";
import {DirectEthUsdgV4LaunchHook} from "../DirectEthUsdgV4LaunchHook.sol";

contract TestableEthUsdgV4LaunchHook is DirectEthUsdgV4LaunchHook {
    constructor(
        address weth_,
        address usdg_,
        address poolManager_,
        address stateView_,
        address uniswapV3Factory_,
        address swapRouter_,
        address wethUsdgPool_,
        address payable developerWallet_
    )
        DirectEthUsdgV4LaunchHook(
            IERC20Metadata(weth_),
            IERC20Metadata(usdg_),
            IUniswapV4PoolManagerMinimal(poolManager_),
            IUniswapV4StateViewMinimal(stateView_),
            IUniswapV3Factory(uniswapV3Factory_),
            ISwapRouter02Minimal(swapRouter_),
            IUniswapV3OraclePoolMinimal(wethUsdgPool_),
            developerWallet_
        )
    {}

    /// @dev Mock PoolManager helper; production integration accepts native ETH directly.
    function activeQuoteCurrency() external view returns (address) {
        return activeUnlockQuoteToken;
    }
}
