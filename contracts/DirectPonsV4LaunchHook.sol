// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {ISwapRouter02Minimal} from "./interfaces/ISwapRouter02Minimal.sol";
import {IUniswapV3OraclePoolMinimal} from "./interfaces/IUniswapV3OraclePoolMinimal.sol";
import {
    IUniswapV4PoolManagerMinimal,
    V4PoolKey,
    V4ModifyLiquidityParams,
    V4SwapParams
} from "./interfaces/IUniswapV4PoolManagerMinimal.sol";
import {IUniswapV4StateViewMinimal} from "./interfaces/IUniswapV4StateViewMinimal.sol";
import {IWETH9} from "./interfaces/IWETH9.sol";
import {RWIOracleMath} from "./libraries/RWIOracleMath.sol";
import {RWILaunchToken} from "./RWILaunchToken.sol";

/// @notice Uniswap v4 launch factory and before-initialize hook for fixed-supply TOKEN/RWI markets.
/// @dev USDG is used as the onchain dollar reference. There is no offchain API, credential, administrator,
///      bonding curve, graduation, migration, liquidity-removal, or creator token-allocation path.
abstract contract DirectPonsV4LaunchHook is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint24 public constant POOL_FEE = 10_000;
    int24 public constant POOL_TICK_SPACING = 200;
    uint24 public constant WETH_USDG_ORACLE_FEE = 100;
    uint16 public constant BPS = 10_000;
    uint16 public constant CREATOR_LP_FEE_SHARE_BPS = 9_000;
    uint16 public constant DEVELOPER_LP_FEE_SHARE_BPS = 1_000;
    uint16 public constant POOL_ALLOCATION_BPS = BPS;
    uint16 public constant INITIAL_ACTIVE_TOKEN_BPS = 2_500;
    uint16 public constant STAGED_TOKEN_BPS = 7_500;
    uint8 public constant STAGED_POSITION_COUNT = 10;
    uint16 private constant STAGED_TRANCHE_TOKEN_BPS = STAGED_TOKEN_BPS / STAGED_POSITION_COUNT;
    uint256 private constant STAGED_TICK_OFFSETS_PACKED =
        0x9920008ef80084d0007aa8007080006720005cf80052d00048a8003e80;
    uint256 private constant MAX_LOCKED_TOKEN_DUST = 1 ether;
    bool public constant LIQUIDITY_PERMANENTLY_LOCKED = true;
    uint256 public constant TARGET_MARKET_CAP_USD_E18 = 10_000 ether;
    uint256 private constant TOKEN_SUPPLY_WHOLE = 1_000_000_000;
    uint256 private constant TOKEN_ADDRESS_SEARCH_ATTEMPTS = 256;
    uint32 public constant ORACLE_TWAP_WINDOW = 30 minutes;
    int24 public constant MAX_RWI_WETH_SPOT_TWAP_DEVIATION = 1_000;
    int24 public constant MAX_WETH_USDG_SPOT_TWAP_DEVIATION = 300;
    uint128 public constant MIN_RWI_WETH_HARMONIC_LIQUIDITY = 10_000_000_000_000_000_000_000;
    uint128 public constant MIN_WETH_USDG_HARMONIC_LIQUIDITY = 500_000_000_000_000_000;
    uint160 public constant REQUIRED_HOOK_FLAGS = (1 << 13) | (1 << 7) | (1 << 3);
    uint160 public constant ALL_HOOK_FLAGS_MASK = (1 << 14) - 1;
    uint160 internal constant MAX_SQRT_PRICE = 1461446703485210103287273052203988822378723970342;

    int24 internal constant MIN_USABLE_TICK = -887_200;
    int24 internal constant MAX_USABLE_TICK = 887_200;
    uint8 private constant ACTION_NONE = 0;
    uint8 private constant ACTION_ADD_LIQUIDITY = 1;
    uint8 private constant ACTION_COLLECT_FEES = 2;
    uint8 private constant ACTION_DEV_BUY = 3;

    IERC20Metadata public immutable rwi;
    IERC20Metadata internal immutable weth;
    IERC20Metadata internal immutable usdg;
    IUniswapV4PoolManagerMinimal internal immutable poolManager;
    IUniswapV4StateViewMinimal internal immutable stateView;
    IUniswapV3Factory internal immutable uniswapV3Factory;
    ISwapRouter02Minimal internal immutable swapRouter;
    IUniswapV3OraclePoolMinimal internal immutable rwiWethPool;
    IUniswapV3OraclePoolMinimal internal immutable wethUsdgPool;
    address payable public immutable developerWallet;

    struct LaunchParams {
        string name;
        string symbol;
        uint256 devBuyRwiAmount;
        uint256 minimumDevBuyTokenOut;
    }

    struct LaunchRecord {
        address creator;
        bytes32 poolId;
        uint256 positionTokenId;
        uint128 liquidity;
        bool liquidityPermanentlyLocked;
        uint256 tokenAmount;
        uint256 initialRwiAmount;
        int24 tickLower;
        int24 tickUpper;
    }

    mapping(address token => LaunchRecord record) public launches;
    mapping(uint256 positionTokenId => address creator) public positionCreators;
    mapping(uint256 positionTokenId => address token) private positionTokens;
    mapping(uint256 positionTokenId => uint256 tokenAmount) public tokenFeeInventory;
    mapping(uint256 positionTokenId => uint256 rwiAmount) public convertibleRwiRewards;
    mapping(uint256 positionTokenId => uint256 ethAmount) public claimableEthRewards;
    uint256 public claimableDeveloperEthRewards;
    uint256 public nextPositionTokenId = 1;

    address private initializingToken;
    uint160 private initializingSqrtPriceX96;
    uint8 private activeUnlockAction;
    address private activeUnlockToken;

    error InvalidIntegration();
    error InvalidHookAddress();
    error InvalidHookCall();
    error InvalidMetadata();
    error PoolCreationFailed();
    error InvalidLiquidityResult();
    error UnknownPosition();
    error NotPositionCreator();
    error NotDeveloperWallet();
    error NoClaimableRewards();
    error NoConvertibleRewards();
    error ClaimExpired();
    error NativeTransferFailed();
    error UnexpectedEther();
    error InvalidOraclePool();
    error OraclePoolLiquidityTooLow(address pool, uint128 actual, uint128 minimum);
    error OracleSpotDeviationTooHigh(address pool, int24 spotTick, int24 twapTick);
    error OraclePriceOutOfRange();
    error PoolManagerSettlementFailed();
    error TokenAddressSearchFailed();

    event TokenLaunched(
        address indexed token,
        address indexed creator,
        bytes32 indexed poolId,
        uint256 positionTokenId,
        uint128 liquidity,
        uint256 tokenAmount,
        uint256 initialRwiAmount,
        bool liquidityPermanentlyLocked
    );
    event FeesCollectedForRevenue(
        uint256 indexed positionTokenId,
        address indexed creator,
        uint256 tokenFees,
        uint256 rwiFees
    );
    event InternalFeeMatch(
        uint256 indexed positionTokenId,
        address indexed token,
        uint256 tokenAmount,
        uint256 rwiAmount
    );
    event EthRewardsClaimed(uint256 indexed positionTokenId, address indexed creator, uint256 ethAmount);
    event DeveloperEthRewardsClaimed(address indexed developerWallet, uint256 ethAmount);

    constructor(
        IERC20Metadata rwi_,
        IERC20Metadata weth_,
        IERC20Metadata usdg_,
        IUniswapV4PoolManagerMinimal poolManager_,
        IUniswapV4StateViewMinimal stateView_,
        IUniswapV3Factory uniswapV3Factory_,
        ISwapRouter02Minimal swapRouter_,
        IUniswapV3OraclePoolMinimal rwiWethPool_,
        IUniswapV3OraclePoolMinimal wethUsdgPool_,
        address payable developerWallet_
    ) {
        if ((uint160(address(this)) & ALL_HOOK_FLAGS_MASK) != REQUIRED_HOOK_FLAGS) revert InvalidHookAddress();
        if (
            address(rwi_).code.length == 0 || address(weth_).code.length == 0 || address(usdg_).code.length == 0
                || address(poolManager_).code.length == 0 || address(stateView_).code.length == 0
                || address(uniswapV3Factory_).code.length == 0
                || address(swapRouter_).code.length == 0 || address(rwiWethPool_).code.length == 0
                || address(wethUsdgPool_).code.length == 0 || developerWallet_ == address(0) || rwi_.decimals() != 18 || weth_.decimals() != 18
                || usdg_.decimals() != 6 || swapRouter_.factory() != address(uniswapV3Factory_)
                || swapRouter_.WETH9() != address(weth_) || uniswapV3Factory_.feeAmountTickSpacing(POOL_FEE) != 200
                || uniswapV3Factory_.feeAmountTickSpacing(WETH_USDG_ORACLE_FEE) != 1
                || stateView_.poolManager() != address(poolManager_)
        ) revert InvalidIntegration();

        _validateOraclePool(uniswapV3Factory_, rwiWethPool_, address(rwi_), address(weth_), POOL_FEE);
        _validateOraclePool(uniswapV3Factory_, wethUsdgPool_, address(weth_), address(usdg_), WETH_USDG_ORACLE_FEE);

        rwi = rwi_;
        weth = weth_;
        usdg = usdg_;
        poolManager = poolManager_;
        stateView = stateView_;
        uniswapV3Factory = uniswapV3Factory_;
        swapRouter = swapRouter_;
        rwiWethPool = rwiWethPool_;
        wethUsdgPool = wethUsdgPool_;
        developerWallet = developerWallet_;
    }

    /// @notice Creates the token and its permanently locked, token-only Uniswap v4 position in one transaction.
    function launch(LaunchParams calldata params)
        external
        nonReentrant
        returns (address token, bytes32 poolId, uint256 positionTokenId, uint256 devBuyTokenAmount)
    {
        _validateMetadata(params);
        if (params.devBuyRwiAmount > uint256(uint128(type(int128).max))) revert InvalidLiquidityResult();
        (, int24 tokenPerRwiTick,,) = _readOpeningPrice();

        (bytes32 tokenSalt, address predictedToken) =
            _findTokenSalt(msg.sender, nextPositionTokenId, params.name, params.symbol);
        RWILaunchToken launchToken =
            new RWILaunchToken{salt: tokenSalt}(params.name, params.symbol, address(this));
        token = address(launchToken);
        if (token != predictedToken || token >= address(rwi)) revert TokenAddressSearchFailed();
        uint256 totalSupply = launchToken.totalSupply();
        V4PoolKey memory key = _poolKey(token);
        int24 openingPoolTick = -tokenPerRwiTick;
        uint160 sqrtPriceX96 = RWIOracleMath.getSqrtRatioAtTick(openingPoolTick);

        initializingToken = token;
        initializingSqrtPriceX96 = sqrtPriceX96;
        int24 initializedTick = poolManager.initialize(key, sqrtPriceX96);
        initializingToken = address(0);
        initializingSqrtPriceX96 = 0;
        if (initializedTick != openingPoolTick) revert PoolCreationFailed();

        (uint128 liquidity, uint256 tokenUsed, int24 tickLower, int24 tickUpper) =
            this.seedLockedLiquidity(token, key, openingPoolTick, sqrtPriceX96, totalSupply);
        if (tokenUsed > totalSupply || totalSupply - tokenUsed > MAX_LOCKED_TOKEN_DUST) {
            revert InvalidLiquidityResult();
        }

        poolId = keccak256(abi.encode(key));
        positionTokenId = nextPositionTokenId++;
        launches[token] = LaunchRecord({
            creator: msg.sender,
            poolId: poolId,
            positionTokenId: positionTokenId,
            liquidity: liquidity,
            liquidityPermanentlyLocked: true,
            tokenAmount: tokenUsed,
            initialRwiAmount: params.devBuyRwiAmount,
            tickLower: tickLower,
            tickUpper: tickUpper
        });
        positionCreators[positionTokenId] = msg.sender;
        positionTokens[positionTokenId] = token;

        if (params.devBuyRwiAmount != 0) {
            IERC20(address(rwi)).safeTransferFrom(msg.sender, address(this), params.devBuyRwiAmount);
            activeUnlockAction = ACTION_DEV_BUY;
            activeUnlockToken = token;
            bytes memory devBuyResult = poolManager.unlock(
                abi.encode(
                    ACTION_DEV_BUY,
                    abi.encode(token, key, msg.sender, params.devBuyRwiAmount, params.minimumDevBuyTokenOut)
                )
            );
            activeUnlockAction = ACTION_NONE;
            activeUnlockToken = address(0);
            devBuyTokenAmount = abi.decode(devBuyResult, (uint256));
        }

        emit TokenLaunched(
            token,
            msg.sender,
            poolId,
            positionTokenId,
            liquidity,
            tokenUsed,
            params.devBuyRwiAmount,
            true
        );
    }

    /// @notice Moves realized LP fees into the revenue inventory without executing a market trade.
    /// @dev Token fees wait for organic RWI buys and are matched by beforeSwap at the current pool price.
    function collectFeesForRevenue(uint256 positionTokenId)
        external
        nonReentrant
        returns (uint256 tokenFees, uint256 rwiFees)
    {
        address creator = positionCreators[positionTokenId];
        if (creator == address(0)) revert UnknownPosition();
        if (msg.sender != creator) revert NotPositionCreator();
        address token = positionTokens[positionTokenId];

        activeUnlockAction = ACTION_COLLECT_FEES;
        activeUnlockToken = token;
        bytes memory result = poolManager.unlock(abi.encode(ACTION_COLLECT_FEES, abi.encode(token)));
        activeUnlockAction = ACTION_NONE;
        activeUnlockToken = address(0);
        (tokenFees, rwiFees) = abi.decode(result, (uint256, uint256));

        tokenFeeInventory[positionTokenId] += tokenFees;
        convertibleRwiRewards[positionTokenId] += rwiFees;
        emit FeesCollectedForRevenue(positionTokenId, creator, tokenFees, rwiFees);
    }

    /// @notice Converts only already-held RWI revenue to native ETH and escrows it for the creator.
    /// @dev This never calls the launched TOKEN/RWI pool. Token-side fees reach this balance only when
    ///      organic token buys are internally matched by beforeSwap.
    function convertRwiRewardsToEth(uint256 positionTokenId, uint256 minimumEthOut, uint256 deadline)
        external
        nonReentrant
        returns (uint256 rwiAmount, uint256 ethAmount)
    {
        address creator = positionCreators[positionTokenId];
        if (creator == address(0)) revert UnknownPosition();
        if (msg.sender != creator) revert NotPositionCreator();
        if (block.timestamp > deadline) revert ClaimExpired();
        rwiAmount = convertibleRwiRewards[positionTokenId];
        if (rwiAmount == 0) revert NoConvertibleRewards();

        convertibleRwiRewards[positionTokenId] = 0;
        IERC20(address(rwi)).forceApprove(address(swapRouter), rwiAmount);
        ethAmount = swapRouter.exactInputSingle(
            ISwapRouter02Minimal.ExactInputSingleParams({
                tokenIn: address(rwi),
                tokenOut: address(weth),
                fee: POOL_FEE,
                recipient: address(this),
                amountIn: rwiAmount,
                amountOutMinimum: minimumEthOut,
                sqrtPriceLimitX96: 0
            })
        );
        IERC20(address(rwi)).forceApprove(address(swapRouter), 0);
        IWETH9(address(weth)).withdraw(ethAmount);
        uint256 developerEthAmount = Math.mulDiv(ethAmount, DEVELOPER_LP_FEE_SHARE_BPS, BPS);
        claimableEthRewards[positionTokenId] += ethAmount - developerEthAmount;
        claimableDeveloperEthRewards += developerEthAmount;
    }

    /// @notice Pays the creator's already-converted rewards as native ETH without touching either market.
    function claimEthRewards(uint256 positionTokenId) external nonReentrant returns (uint256 ethAmount) {
        address creator = positionCreators[positionTokenId];
        if (creator == address(0)) revert UnknownPosition();
        if (msg.sender != creator) revert NotPositionCreator();
        ethAmount = claimableEthRewards[positionTokenId];
        if (ethAmount == 0) revert NoClaimableRewards();

        claimableEthRewards[positionTokenId] = 0;
        (bool sent,) = payable(creator).call{value: ethAmount}("");
        if (!sent) revert NativeTransferFailed();
        emit EthRewardsClaimed(positionTokenId, creator, ethAmount);
    }

    function claimDeveloperEthRewards() external nonReentrant returns (uint256 ethAmount) {
        if (msg.sender != developerWallet) revert NotDeveloperWallet();
        ethAmount = claimableDeveloperEthRewards;
        if (ethAmount == 0) revert NoClaimableRewards();
        claimableDeveloperEthRewards = 0;
        (bool sent,) = developerWallet.call{value: ethAmount}("");
        if (!sent) revert NativeTransferFailed();
        emit DeveloperEthRewardsClaimed(developerWallet, ethAmount);
    }

    /// @notice Returns the protected 30-minute WETH/USDG value of one ETH, scaled to 18 decimals.
    function ethUsdPriceE18() public view returns (uint256 priceE18) {
        int24 wethUsdgTick = _validatedTwap(
            wethUsdgPool,
            MIN_WETH_USDG_HARMONIC_LIQUIDITY,
            MAX_WETH_USDG_SPOT_TWAP_DEVIATION
        );
        uint256 usdgPerWethE6 =
            RWIOracleMath.quoteAtTick(wethUsdgTick, uint128(1 ether), address(weth), address(usdg));
        if (usdgPerWethE6 == 0) revert OraclePriceOutOfRange();
        priceE18 = usdgPerWethE6 * 1e12;
    }

    /// @notice Uniswap v4 hook callback. Only this contract's own launch initialization is accepted.
    function beforeInitialize(address sender, V4PoolKey calldata key, uint160 sqrtPriceX96)
        external
        view
        returns (bytes4)
    {
        address token = initializingToken;
        if (
            msg.sender != address(poolManager) || sender != address(this) || token == address(0)
                || sqrtPriceX96 != initializingSqrtPriceX96 || key.hooks != address(this) || key.fee != POOL_FEE
                || key.tickSpacing != POOL_TICK_SPACING
                || key.currency0 != token || key.currency1 != address(rwi)
        ) revert InvalidHookCall();
        return this.beforeInitialize.selector;
    }

    /// @notice Matches stored token-fee inventory against organic RWI buys before they touch the AMM curve.
    /// @dev The returned delta reduces the user's remaining Uniswap swap. The hook receives RWI and supplies
    ///      tokens at the current pool price, so this matched portion creates no TOKEN/RWI pool-price movement.
    function beforeSwap(address, V4PoolKey calldata key, V4SwapParams calldata params, bytes calldata)
        external
        returns (bytes4 selector, int256 beforeSwapDelta, uint24 lpFeeOverride)
    {
        if (msg.sender != address(poolManager)) revert InvalidHookCall();
        address token = key.currency0;
        LaunchRecord memory record = launches[token];
        if (record.creator == address(0) || !_isExpectedKey(token, key)) revert InvalidHookCall();
        selector = this.beforeSwap.selector;

        // TOKEN is always currency0. Only RWI -> TOKEN buys can consume stored token fees.
        uint256 inventory = tokenFeeInventory[record.positionTokenId];
        if (params.zeroForOne || inventory == 0) return (selector, 0, 0);

        (, int24 currentTick,,) = stateView.getSlot0(record.poolId);
        (uint256 rwiIn, uint256 tokenOut) =
            _internalMatchAmounts(token, currentTick, inventory, params.amountSpecified);
        if (rwiIn == 0 || tokenOut == 0) return (selector, 0, 0);

        tokenFeeInventory[record.positionTokenId] = inventory - tokenOut;
        convertibleRwiRewards[record.positionTokenId] += rwiIn;
        poolManager.take(address(rwi), address(this), rwiIn);
        _settle(token, tokenOut);

        int128 specifiedDelta;
        int128 unspecifiedDelta;
        if (params.amountSpecified < 0) {
            specifiedDelta = _toInt128(rwiIn);
            unspecifiedDelta = -_toInt128(tokenOut);
        } else {
            specifiedDelta = -_toInt128(tokenOut);
            unspecifiedDelta = _toInt128(rwiIn);
        }
        beforeSwapDelta = _packBeforeSwapDelta(specifiedDelta, unspecifiedDelta);
        emit InternalFeeMatch(record.positionTokenId, token, tokenOut, rwiIn);
    }

    /// @notice Uniswap v4 unlock callback used only for locked liquidity, fee collection, or an optional launch buy.
    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert InvalidHookCall();
        (uint8 action, bytes memory payload) = abi.decode(data, (uint8, bytes));
        if (action == ACTION_NONE || action != activeUnlockAction) revert InvalidHookCall();

        if (action == ACTION_ADD_LIQUIDITY) {
            (address token, V4PoolKey memory key, int24 tickLower, int24 tickUpper, uint128 liquidity) =
                abi.decode(payload, (address, V4PoolKey, int24, int24, uint128));
            if (token != activeUnlockToken || !_isExpectedKey(token, key)) revert InvalidHookCall();
            (int256 callerDelta,) = poolManager.modifyLiquidity(
                key,
                V4ModifyLiquidityParams({
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    liquidityDelta: int256(uint256(liquidity)),
                    salt: bytes32(0)
                }),
                bytes("")
            );
            int256 amount0 = _amount0(callerDelta);
            int256 amount1 = _amount1(callerDelta);
            if (amount0 > 0 || amount1 > 0) revert PoolManagerSettlementFailed();
            uint256 owed0 = amount0 < 0 ? uint256(-amount0) : 0;
            uint256 owed1 = amount1 < 0 ? uint256(-amount1) : 0;
            if (owed0 != 0) _settle(key.currency0, owed0);
            if (owed1 != 0) _settle(key.currency1, owed1);
            bool tokenIs0 = token == key.currency0;
            return abi.encode(tokenIs0 ? owed0 : owed1, tokenIs0 ? owed1 : owed0);
        }

        if (action == ACTION_COLLECT_FEES) {
            address token = abi.decode(payload, (address));
            if (token != activeUnlockToken) revert InvalidHookCall();
            LaunchRecord memory record = launches[token];
            if (record.creator == address(0)) revert UnknownPosition();
            V4PoolKey memory key = _poolKey(token);
            uint256 tokenFees;
            uint256 rwiFees;
            for (uint256 index; index <= STAGED_POSITION_COUNT; ++index) {
                int24 lower = index == 0 ? record.tickLower : record.tickLower + _stagedTickOffset(index - 1);
                (int256 feeDelta,) = poolManager.modifyLiquidity(
                    key,
                    V4ModifyLiquidityParams({
                        tickLower: lower,
                        tickUpper: record.tickUpper,
                        liquidityDelta: 0,
                        salt: bytes32(0)
                    }),
                    bytes("")
                );
                int256 fee0 = _amount0(feeDelta);
                int256 fee1 = _amount1(feeDelta);
                if (fee0 < 0 || fee1 < 0) revert PoolManagerSettlementFailed();
                tokenFees += uint256(fee0);
                rwiFees += uint256(fee1);
            }
            if (tokenFees != 0) poolManager.take(token, address(this), tokenFees);
            if (rwiFees != 0) poolManager.take(address(rwi), address(this), rwiFees);
            return abi.encode(tokenFees, rwiFees);
        }

        if (action == ACTION_DEV_BUY) {
            (address token, V4PoolKey memory key, address creator, uint256 rwiAmount, uint256 minimumTokenOut) =
                abi.decode(payload, (address, V4PoolKey, address, uint256, uint256));
            if (token != activeUnlockToken || !_isExpectedKey(token, key)) revert InvalidHookCall();
            int256 swapDelta = poolManager.swap(
                key,
                V4SwapParams({
                    zeroForOne: false,
                    amountSpecified: -int256(rwiAmount),
                    sqrtPriceLimitX96: MAX_SQRT_PRICE - 1
                }),
                bytes("")
            );
            int256 tokenDelta = _amount0(swapDelta);
            int256 rwiDelta = _amount1(swapDelta);
            if (tokenDelta <= 0 || rwiDelta >= 0 || uint256(-rwiDelta) != rwiAmount) {
                revert InvalidLiquidityResult();
            }
            uint256 tokenAmount = uint256(tokenDelta);
            if (tokenAmount < minimumTokenOut) revert InvalidLiquidityResult();
            _settle(address(rwi), rwiAmount);
            poolManager.take(token, creator, tokenAmount);
            return abi.encode(tokenAmount);
        }

        revert InvalidHookCall();
    }

    receive() external payable {
        if (msg.sender != address(weth)) revert UnexpectedEther();
    }

    function poolKey(address token) external view returns (V4PoolKey memory) {
        if (launches[token].creator == address(0)) revert UnknownPosition();
        return _poolKey(token);
    }

    function _readOpeningPrice()
        internal
        view
        returns (uint256 rwiUsdPriceE18, int24 tokenPerRwiTick, int24 rwiWethTick, int24 wethUsdgTick)
    {
        rwiWethTick = _validatedTwap(
            rwiWethPool,
            MIN_RWI_WETH_HARMONIC_LIQUIDITY,
            MAX_RWI_WETH_SPOT_TWAP_DEVIATION
        );
        wethUsdgTick = _validatedTwap(
            wethUsdgPool,
            MIN_WETH_USDG_HARMONIC_LIQUIDITY,
            MAX_WETH_USDG_SPOT_TWAP_DEVIATION
        );

        uint256 wethPerRwiE18 =
            RWIOracleMath.quoteAtTick(rwiWethTick, uint128(1 ether), address(rwi), address(weth));
        uint256 usdgPerWethE6 =
            RWIOracleMath.quoteAtTick(wethUsdgTick, uint128(1 ether), address(weth), address(usdg));
        if (wethPerRwiE18 == 0 || usdgPerWethE6 == 0) revert OraclePriceOutOfRange();
        rwiUsdPriceE18 = Math.mulDiv(wethPerRwiE18, usdgPerWethE6, 1e6);
        if (rwiUsdPriceE18 == 0) revert OraclePriceOutOfRange();

        uint256 tokenPerRwiE18 =
            Math.mulDiv(rwiUsdPriceE18, TOKEN_SUPPLY_WHOLE * 1 ether, TARGET_MARKET_CAP_USD_E18);
        tokenPerRwiTick = RWIOracleMath.nearestUsableTick(tokenPerRwiE18, MIN_USABLE_TICK, MAX_USABLE_TICK);
        if (tokenPerRwiTick <= MIN_USABLE_TICK || tokenPerRwiTick >= MAX_USABLE_TICK) {
            revert OraclePriceOutOfRange();
        }
    }

    function _validatedTwap(IUniswapV3OraclePoolMinimal oraclePool, uint128 minimumLiquidity, int24 maxDeviation)
        internal
        view
        returns (int24 arithmeticMeanTick)
    {
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = ORACLE_TWAP_WINDOW;
        secondsAgos[1] = 0;
        (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s) =
            oraclePool.observe(secondsAgos);
        if (tickCumulatives.length != 2 || secondsPerLiquidityCumulativeX128s.length != 2) {
            revert InvalidOraclePool();
        }

        int56 tickDelta;
        uint160 secondsPerLiquidityDelta;
        unchecked {
            tickDelta = tickCumulatives[1] - tickCumulatives[0];
            secondsPerLiquidityDelta =
                secondsPerLiquidityCumulativeX128s[1] - secondsPerLiquidityCumulativeX128s[0];
        }
        if (secondsPerLiquidityDelta == 0) revert InvalidOraclePool();
        arithmeticMeanTick = int24(tickDelta / int56(uint56(ORACLE_TWAP_WINDOW)));
        if (tickDelta < 0 && tickDelta % int56(uint56(ORACLE_TWAP_WINDOW)) != 0) arithmeticMeanTick--;

        uint192 secondsAgoX160 = uint192(ORACLE_TWAP_WINDOW) * type(uint160).max;
        uint128 harmonicMeanLiquidity =
            uint128(secondsAgoX160 / (uint192(secondsPerLiquidityDelta) << 32));
        if (harmonicMeanLiquidity < minimumLiquidity) {
            revert OraclePoolLiquidityTooLow(address(oraclePool), harmonicMeanLiquidity, minimumLiquidity);
        }

        (, int24 spotTick,,,,,) = oraclePool.slot0();
        int256 deviation = int256(spotTick) - int256(arithmeticMeanTick);
        if (deviation < 0) deviation = -deviation;
        if (deviation > int256(maxDeviation)) {
            revert OracleSpotDeviationTooHigh(address(oraclePool), spotTick, arithmeticMeanTick);
        }
    }

    function _internalMatchAmounts(address token, int24 currentTick, uint256 inventory, int256 amountSpecified)
        private
        view
        returns (uint256 rwiIn, uint256 tokenOut)
    {
        uint256 signedLimit = uint256(uint128(type(int128).max));
        if (amountSpecified < 0) {
            uint256 requestedRwiIn = amountSpecified == type(int256).min
                ? signedLimit
                : uint256(-amountSpecified);
            if (requestedRwiIn > signedLimit) requestedRwiIn = signedLimit;
            if (requestedRwiIn == 0) return (0, 0);
            rwiIn = requestedRwiIn;
            tokenOut = RWIOracleMath.quoteAtTick(currentTick, uint128(rwiIn), address(rwi), token);
        } else {
            tokenOut = uint256(amountSpecified);
            if (tokenOut > signedLimit) tokenOut = signedLimit;
        }

        if (tokenOut > inventory) tokenOut = inventory;
        if (tokenOut == 0) return (0, 0);
        rwiIn = RWIOracleMath.quoteAtTick(
            currentTick,
            uint128(tokenOut),
            token,
            address(rwi)
        );
        if (rwiIn == 0 || rwiIn > signedLimit) return (0, 0);

        if (amountSpecified < 0) {
            uint256 requestedRwiIn = amountSpecified == type(int256).min
                ? type(uint256).max
                : uint256(-amountSpecified);
            if (rwiIn > requestedRwiIn) return (0, 0);
        }
    }

    function _toInt128(uint256 amount) private pure returns (int128 result) {
        if (amount > uint256(uint128(type(int128).max))) revert InvalidLiquidityResult();
        result = int128(uint128(amount));
    }

    function _packBeforeSwapDelta(int128 specifiedDelta, int128 unspecifiedDelta)
        private
        pure
        returns (int256 packed)
    {
        assembly ("memory-safe") {
            packed := or(shl(128, specifiedDelta), and(sub(shl(128, 1), 1), unspecifiedDelta))
        }
    }

    function _settle(address currency, uint256 amount) internal {
        poolManager.sync(currency);
        IERC20(currency).safeTransfer(address(poolManager), amount);
        if (poolManager.settle() != amount) revert PoolManagerSettlementFailed();
    }

    /// @dev A token-only position is active at its lower tick but inactive at its upper tick. CREATE2 lets
    ///      the factory select a token address below RWI, so every new token is currency0 and starts with
    ///      active liquidity without requiring the creator to provide RWI.
    function _findTokenSalt(
        address creator,
        uint256 positionTokenId,
        string calldata name,
        string calldata symbol
    )
        internal
        view
        returns (bytes32 selectedSalt, address predictedToken)
    {
        bytes32 creationCodeHash = keccak256(
            abi.encodePacked(type(RWILaunchToken).creationCode, abi.encode(name, symbol, address(this)))
        );
        for (uint256 attempt; attempt < TOKEN_ADDRESS_SEARCH_ATTEMPTS; attempt++) {
            selectedSalt = keccak256(abi.encode(creator, positionTokenId, name, symbol, attempt));
            predictedToken = address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(bytes1(0xff), address(this), selectedSalt, creationCodeHash)
                        )
                    )
                )
            );
            if (predictedToken < address(rwi)) return (selectedSalt, predictedToken);
        }
        revert TokenAddressSearchFailed();
    }

    function _poolKey(address token) internal view returns (V4PoolKey memory key) {
        if (token >= address(rwi)) revert TokenAddressSearchFailed();
        key = V4PoolKey({
            currency0: token,
            currency1: address(rwi),
            fee: POOL_FEE,
            tickSpacing: POOL_TICK_SPACING,
            hooks: address(this)
        });
    }

    function _isExpectedKey(address token, V4PoolKey memory key) internal view returns (bool) {
        V4PoolKey memory expected = _poolKey(token);
        return key.currency0 == expected.currency0 && key.currency1 == expected.currency1 && key.fee == expected.fee
            && key.tickSpacing == expected.tickSpacing && key.hooks == expected.hooks;
    }

    function _validateMetadata(LaunchParams calldata params) internal pure {
        uint256 nameLength = bytes(params.name).length;
        uint256 symbolLength = bytes(params.symbol).length;
        if (nameLength == 0 || nameLength > 64 || symbolLength == 0 || symbolLength > 16) revert InvalidMetadata();
    }

    function _stagedTickOffset(uint256 index) private pure returns (int24) {
        return int24(uint24(STAGED_TICK_OFFSETS_PACKED >> (index * 24)));
    }

    function _addLockedLiquidity(
        address token,
        V4PoolKey memory key,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity
    ) private returns (uint256 tokenUsed) {
        activeUnlockAction = ACTION_ADD_LIQUIDITY;
        activeUnlockToken = token;
        bytes memory result = poolManager.unlock(
            abi.encode(ACTION_ADD_LIQUIDITY, abi.encode(token, key, tickLower, tickUpper, liquidity))
        );
        activeUnlockAction = ACTION_NONE;
        activeUnlockToken = address(0);
        uint256 rwiUsed;
        (tokenUsed, rwiUsed) = abi.decode(result, (uint256, uint256));
        if (rwiUsed != 0) revert InvalidLiquidityResult();
    }

    function seedLockedLiquidity(
        address token,
        V4PoolKey memory key,
        int24 openingPoolTick,
        uint160 sqrtPriceX96,
        uint256 totalSupply
    ) external returns (uint128 liquidity, uint256 tokenUsed, int24 tickLower, int24 tickUpper) {
        if (msg.sender != address(this)) revert InvalidHookCall();
        tickLower = openingPoolTick;
        tickUpper = MAX_USABLE_TICK;
        uint256 initialAmount = Math.mulDiv(totalSupply, INITIAL_ACTIVE_TOKEN_BPS, BPS);
        liquidity = _liquidityForAmount0(sqrtPriceX96, RWIOracleMath.getSqrtRatioAtTick(tickUpper), initialAmount);
        if (liquidity == 0) revert InvalidLiquidityResult();
        tokenUsed = _addLockedLiquidity(token, key, tickLower, tickUpper, liquidity);
        tokenUsed += _addStagedPositions(
            token,
            key,
            openingPoolTick,
            Math.mulDiv(totalSupply, STAGED_TRANCHE_TOKEN_BPS, BPS)
        );
    }

    function _addStagedPositions(
        address token,
        V4PoolKey memory key,
        int24 openingPoolTick,
        uint256 stagedTokenAmount
    ) private returns (uint256 tokenUsed) {
        int24 upper = MAX_USABLE_TICK;
        uint160 sqrtUpper = RWIOracleMath.getSqrtRatioAtTick(upper);
        for (uint256 index; index < STAGED_POSITION_COUNT; ++index) {
            int24 lower = openingPoolTick + _stagedTickOffset(index);
            uint128 liquidity =
                _liquidityForAmount0(RWIOracleMath.getSqrtRatioAtTick(lower), sqrtUpper, stagedTokenAmount);
            if (liquidity == 0) revert InvalidLiquidityResult();
            uint256 used = _addLockedLiquidity(token, key, lower, upper, liquidity);
            tokenUsed += used;
        }
    }

    function _validateOraclePool(
        IUniswapV3Factory factory,
        IUniswapV3OraclePoolMinimal pool,
        address tokenA,
        address tokenB,
        uint24 expectedFee
    ) private view {
        address token0 = pool.token0();
        address token1 = pool.token1();
        if (
            pool.fee() != expectedFee || factory.getPool(tokenA, tokenB, expectedFee) != address(pool)
                || !(
                    (token0 == tokenA && token1 == tokenB)
                        || (token0 == tokenB && token1 == tokenA)
                )
        ) revert InvalidIntegration();
    }

    function _amount0(int256 balanceDelta) private pure returns (int128 amount) {
        assembly ("memory-safe") {
            amount := sar(128, balanceDelta)
        }
    }

    function _amount1(int256 balanceDelta) private pure returns (int128 amount) {
        assembly ("memory-safe") {
            amount := signextend(15, balanceDelta)
        }
    }

    function _liquidityForAmount0(uint160 sqrtRatioAX96, uint160 sqrtRatioBX96, uint256 amount0)
        private
        pure
        returns (uint128)
    {
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);
        uint256 intermediate = Math.mulDiv(sqrtRatioAX96, sqrtRatioBX96, 1 << 96);
        uint256 liquidity = Math.mulDiv(amount0, intermediate, sqrtRatioBX96 - sqrtRatioAX96);
        if (liquidity > type(uint128).max) revert InvalidLiquidityResult();
        return uint128(liquidity);
    }

    function _liquidityForAmount1(uint160 sqrtRatioAX96, uint160 sqrtRatioBX96, uint256 amount1)
        private
        pure
        returns (uint128)
    {
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);
        uint256 liquidity = Math.mulDiv(amount1, 1 << 96, sqrtRatioBX96 - sqrtRatioAX96);
        if (liquidity > type(uint128).max) revert InvalidLiquidityResult();
        return uint128(liquidity);
    }
}

