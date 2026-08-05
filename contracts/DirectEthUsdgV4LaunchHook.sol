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

/// @notice Immutable Uniswap v4 launch factory for TOKEN/ETH and TOKEN/USDG markets.
/// @dev Every launch uses token-only liquidity, a $10,000 USDG-denominated opening, and permanent positions.
///      Token-side LP fees are internally matched against later organic buys before those buys touch the AMM.
abstract contract DirectEthUsdgV4LaunchHook is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum QuoteAsset {
        ETH,
        USDG
    }

    uint24 public constant POOL_FEE = 10_000;
    int24 public constant POOL_TICK_SPACING = 200;
    uint24 private constant WETH_USDG_POOL_FEE = 100;
    uint16 public constant BPS = 10_000;
    uint16 public constant CREATOR_LP_FEE_SHARE_BPS = 9_000;
    uint16 public constant DEVELOPER_LP_FEE_SHARE_BPS = 1_000;
    uint16 private constant PERMISSIONLESS_SETTLEMENT_MIN_OUTPUT_BPS = 9_500;
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
    uint32 public constant ORACLE_TWAP_WINDOW = 30 minutes;
    int24 public constant MAX_WETH_USDG_SPOT_TWAP_DEVIATION = 300;
    uint128 public constant MIN_WETH_USDG_HARMONIC_LIQUIDITY = 500_000_000_000_000_000;
    uint160 private constant REQUIRED_HOOK_FLAGS = (1 << 13) | (1 << 7) | (1 << 3);
    uint160 private constant ALL_HOOK_FLAGS_MASK = (1 << 14) - 1;
    uint160 internal constant MIN_SQRT_PRICE = 4_295_128_739;
    uint160 internal constant MAX_SQRT_PRICE = 1461446703485210103287273052203988822378723970342;

    int24 internal constant MIN_USABLE_TICK = -887_200;
    int24 internal constant MAX_USABLE_TICK = 887_200;
    uint8 private constant ACTION_NONE = 0;
    uint8 private constant ACTION_ADD_LIQUIDITY = 1;
    uint8 private constant ACTION_COLLECT_FEES = 2;
    uint8 private constant ACTION_DEV_BUY = 3;

    IERC20Metadata public immutable weth;
    IERC20Metadata public immutable usdg;
    IUniswapV4PoolManagerMinimal public immutable poolManager;
    IUniswapV4StateViewMinimal public immutable stateView;
    IUniswapV3Factory public immutable uniswapV3Factory;
    ISwapRouter02Minimal public immutable swapRouter;
    IUniswapV3OraclePoolMinimal public immutable wethUsdgPool;
    address payable public immutable developerWallet;

    struct LaunchParams {
        string name;
        string symbol;
        QuoteAsset quoteAsset;
        uint256 devBuyQuoteAmount;
        uint256 minimumDevBuyTokenOut;
    }

    struct LaunchRecord {
        address creator;
        bytes32 poolId;
        uint256 positionTokenId;
        uint128 liquidity;
        bool liquidityPermanentlyLocked;
        uint256 tokenAmount;
        uint256 initialQuoteAmount;
        int24 tickLower;
        int24 tickUpper;
        address quoteToken;
        QuoteAsset quoteAsset;
    }

    mapping(address token => LaunchRecord record) public launches;
    mapping(uint256 positionTokenId => address creator) public positionCreators;
    mapping(uint256 positionTokenId => address token) private positionTokens;
    mapping(uint256 positionTokenId => uint256 tokenAmount) public tokenFeeInventory;
    mapping(uint256 positionTokenId => uint256 quoteAmount) public convertibleQuoteRewards;
    mapping(uint256 positionTokenId => uint256 ethAmount) public claimableEthRewards;
    uint256 public claimableDeveloperEthRewards;
    uint256 public nextPositionTokenId = 1;

    address private initializingToken;
    address private initializingQuoteToken;
    uint160 private initializingSqrtPriceX96;
    uint8 private activeUnlockAction;
    address private activeUnlockToken;
    address internal activeUnlockQuoteToken;

    error InvalidIntegration();
    error InvalidHookAddress();
    error InvalidHookCall();
    error InvalidMetadata();
    error InvalidNativeValue();
    error PoolCreationFailed();
    error InvalidLiquidityResult();
    error UnknownPosition();
    error NotPositionCreator();
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

    /// @dev Kept signature-compatible with the existing RWI factory event for shared discovery.
    event TokenLaunched(
        address indexed token,
        address indexed creator,
        bytes32 indexed poolId,
        uint256 positionTokenId,
        uint128 liquidity,
        uint256 tokenAmount,
        uint256 initialQuoteAmount,
        bool liquidityPermanentlyLocked
    );
    event LaunchQuoteSelected(
        address indexed token,
        address indexed quoteToken,
        QuoteAsset indexed quoteAsset,
        uint16 creatorFeeShareBps,
        uint16 developerFeeShareBps
    );
    event QuoteLaunchPriced(
        address indexed token,
        address indexed quoteToken,
        uint256 quoteUsdPriceE18,
        int24 tokenPerQuoteTick,
        int24 wethUsdgTwapTick,
        uint32 twapWindow,
        uint256 targetMarketCapUsdE18
    );
    event StagedLiquidityConfigured(
        address indexed token,
        uint128 stagedLiquidity,
        uint256 stagedTokenAmount,
        int24 tickLower,
        int24 tickUpper
    );
    event FeesCollectedForRevenue(
        uint256 indexed positionTokenId,
        address indexed creator,
        uint256 tokenFees,
        uint256 quoteFees
    );
    event InternalFeeMatch(
        uint256 indexed positionTokenId,
        address indexed token,
        uint256 tokenAmount,
        uint256 quoteAmount
    );
    event QuoteRewardsConvertedToEth(
        uint256 indexed positionTokenId,
        address indexed creator,
        uint256 quoteAmount,
        uint256 grossEthAmount,
        uint256 creatorEthAmount,
        uint256 developerEthAmount
    );
    event EthRewardsAccrued(
        uint256 indexed positionTokenId,
        uint256 grossEthAmount,
        uint256 creatorEthAmount,
        uint256 developerEthAmount
    );
    event EthRewardsClaimed(uint256 indexed positionTokenId, address indexed creator, uint256 ethAmount);
    event DeveloperEthRewardsClaimed(address indexed developerWallet, uint256 ethAmount);

    constructor(
        IERC20Metadata weth_,
        IERC20Metadata usdg_,
        IUniswapV4PoolManagerMinimal poolManager_,
        IUniswapV4StateViewMinimal stateView_,
        IUniswapV3Factory uniswapV3Factory_,
        ISwapRouter02Minimal swapRouter_,
        IUniswapV3OraclePoolMinimal wethUsdgPool_,
        address payable developerWallet_
    ) {
        if ((uint160(address(this)) & ALL_HOOK_FLAGS_MASK) != REQUIRED_HOOK_FLAGS) revert InvalidHookAddress();
        if (
            address(weth_).code.length == 0 || address(usdg_).code.length == 0
                || address(poolManager_).code.length == 0 || address(stateView_).code.length == 0
                || address(uniswapV3Factory_).code.length == 0 || address(swapRouter_).code.length == 0
                || address(wethUsdgPool_).code.length == 0 || developerWallet_ == address(0)
                || weth_.decimals() != 18 || usdg_.decimals() != 6
                || swapRouter_.factory() != address(uniswapV3Factory_)
                || swapRouter_.WETH9() != address(weth_)
                || uniswapV3Factory_.feeAmountTickSpacing(POOL_FEE) != POOL_TICK_SPACING
                || uniswapV3Factory_.feeAmountTickSpacing(WETH_USDG_POOL_FEE) != 1
                || stateView_.poolManager() != address(poolManager_)
        ) revert InvalidIntegration();

        _validateOraclePool(uniswapV3Factory_, wethUsdgPool_, address(weth_), address(usdg_));
        weth = weth_;
        usdg = usdg_;
        poolManager = poolManager_;
        stateView = stateView_;
        uniswapV3Factory = uniswapV3Factory_;
        swapRouter = swapRouter_;
        wethUsdgPool = wethUsdgPool_;
        developerWallet = developerWallet_;
    }

    /// @notice Creates a token and its permanently locked TOKEN/ETH or TOKEN/USDG position.
    function launch(LaunchParams calldata params)
        external
        payable
        nonReentrant
        returns (address token, bytes32 poolId, uint256 positionTokenId, uint256 devBuyTokenAmount)
    {
        _validateMetadata(params);
        if (params.devBuyQuoteAmount > uint256(uint128(type(int128).max))) revert InvalidLiquidityResult();
        address quoteToken = params.quoteAsset == QuoteAsset.ETH ? address(0) : address(usdg);
        if (
            (params.quoteAsset == QuoteAsset.ETH && msg.value != params.devBuyQuoteAmount)
                || (params.quoteAsset == QuoteAsset.USDG && msg.value != 0)
        ) revert InvalidNativeValue();

        (uint256 quoteUsdPriceE18, int24 tokenPerQuoteTick, int24 wethUsdgTick) =
            _readOpeningPrice(params.quoteAsset);
        RWILaunchToken launchToken = new RWILaunchToken(params.name, params.symbol, address(this));
        token = address(launchToken);
        uint256 totalSupply = launchToken.totalSupply();
        V4PoolKey memory key = _poolKey(token, quoteToken);
        int24 openingPoolTick = quoteToken < token ? tokenPerQuoteTick : -tokenPerQuoteTick;
        uint160 sqrtPriceX96 = RWIOracleMath.getSqrtRatioAtTick(openingPoolTick);

        initializingToken = token;
        initializingQuoteToken = quoteToken;
        initializingSqrtPriceX96 = sqrtPriceX96;
        int24 initializedTick = poolManager.initialize(key, sqrtPriceX96);
        initializingToken = address(0);
        initializingQuoteToken = address(0);
        initializingSqrtPriceX96 = 0;
        if (initializedTick != openingPoolTick) revert PoolCreationFailed();

        (uint128 liquidity, uint256 tokenUsed, int24 tickLower, int24 tickUpper) =
            this.seedLockedLiquidity(token, quoteToken, key, openingPoolTick, sqrtPriceX96, totalSupply);
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
            initialQuoteAmount: params.devBuyQuoteAmount,
            tickLower: tickLower,
            tickUpper: tickUpper,
            quoteToken: quoteToken,
            quoteAsset: params.quoteAsset
        });
        positionCreators[positionTokenId] = msg.sender;
        positionTokens[positionTokenId] = token;

        if (params.devBuyQuoteAmount != 0) {
            if (params.quoteAsset == QuoteAsset.USDG) {
                IERC20(address(usdg)).safeTransferFrom(msg.sender, address(this), params.devBuyQuoteAmount);
            }
            _setUnlock(ACTION_DEV_BUY, token, quoteToken);
            bytes memory devBuyResult = poolManager.unlock(
                abi.encode(
                    ACTION_DEV_BUY,
                    abi.encode(token, key, msg.sender, params.devBuyQuoteAmount, params.minimumDevBuyTokenOut)
                )
            );
            _clearUnlock();
            devBuyTokenAmount = abi.decode(devBuyResult, (uint256));
        }

        emit TokenLaunched(
            token,
            msg.sender,
            poolId,
            positionTokenId,
            liquidity,
            tokenUsed,
            params.devBuyQuoteAmount,
            true
        );
        emit LaunchQuoteSelected(
            token,
            quoteToken,
            params.quoteAsset,
            CREATOR_LP_FEE_SHARE_BPS,
            DEVELOPER_LP_FEE_SHARE_BPS
        );
        emit QuoteLaunchPriced(
            token,
            quoteToken,
            quoteUsdPriceE18,
            tokenPerQuoteTick,
            wethUsdgTick,
            ORACLE_TWAP_WINDOW,
            TARGET_MARKET_CAP_USD_E18
        );
    }

    /// @notice Permissionlessly moves realized LP fees into revenue inventory without selling the launched token.
    function collectFeesForRevenue(uint256 positionTokenId)
        external
        nonReentrant
        returns (uint256 tokenFees, uint256 quoteFees)
    {
        address creator = positionCreators[positionTokenId];
        if (creator == address(0)) revert UnknownPosition();
        address token = positionTokens[positionTokenId];
        LaunchRecord memory record = launches[token];

        _setUnlock(ACTION_COLLECT_FEES, token, record.quoteToken);
        bytes memory result = poolManager.unlock(abi.encode(ACTION_COLLECT_FEES, abi.encode(token)));
        _clearUnlock();
        (tokenFees, quoteFees) = abi.decode(result, (uint256, uint256));

        tokenFeeInventory[positionTokenId] += tokenFees;
        if (record.quoteAsset == QuoteAsset.ETH) _creditEthRewards(positionTokenId, quoteFees);
        else convertibleQuoteRewards[positionTokenId] += quoteFees;
        emit FeesCollectedForRevenue(positionTokenId, creator, tokenFees, quoteFees);
    }

    /// @notice Permissionlessly converts already-held USDG revenue to native ETH, then applies the immutable 90/10 split.
    /// @dev The caller cannot weaken the oracle-derived minimum output used by automatic settlement.
    function convertQuoteRewardsToEth(uint256 positionTokenId, uint256 minimumEthOut, uint256 deadline)
        external
        nonReentrant
        returns (uint256 quoteAmount, uint256 grossEthAmount, uint256 creatorEthAmount, uint256 developerEthAmount)
    {
        address creator = positionCreators[positionTokenId];
        if (creator == address(0)) revert UnknownPosition();
        if (block.timestamp > deadline) revert ClaimExpired();
        LaunchRecord memory record = launches[positionTokens[positionTokenId]];
        if (record.quoteAsset != QuoteAsset.USDG) revert NoConvertibleRewards();
        quoteAmount = convertibleQuoteRewards[positionTokenId];
        if (quoteAmount == 0) revert NoConvertibleRewards();

        uint256 protectedEthOut = Math.mulDiv(quoteAmount, 1e30, ethUsdPriceE18());
        protectedEthOut = Math.mulDiv(protectedEthOut, PERMISSIONLESS_SETTLEMENT_MIN_OUTPUT_BPS, BPS);
        if (minimumEthOut < protectedEthOut) minimumEthOut = protectedEthOut;

        convertibleQuoteRewards[positionTokenId] = 0;
        IERC20(address(usdg)).forceApprove(address(swapRouter), quoteAmount);
        grossEthAmount = swapRouter.exactInputSingle(
            ISwapRouter02Minimal.ExactInputSingleParams({
                tokenIn: address(usdg),
                tokenOut: address(weth),
                fee: WETH_USDG_POOL_FEE,
                recipient: address(this),
                amountIn: quoteAmount,
                amountOutMinimum: minimumEthOut,
                sqrtPriceLimitX96: 0
            })
        );
        IERC20(address(usdg)).forceApprove(address(swapRouter), 0);
        IWETH9(address(weth)).withdraw(grossEthAmount);
        (creatorEthAmount, developerEthAmount) = _creditEthRewards(positionTokenId, grossEthAmount);

        emit QuoteRewardsConvertedToEth(
            positionTokenId,
            creator,
            quoteAmount,
            grossEthAmount,
            creatorEthAmount,
            developerEthAmount
        );
    }

    /// @notice Pays only the creator's net rewards in native ETH and performs no swap.
    function claimEthRewards(uint256 positionTokenId) external nonReentrant returns (uint256 ethAmount) {
        address creator = positionCreators[positionTokenId];
        if (creator == address(0)) revert UnknownPosition();
        if (msg.sender != creator) revert NotPositionCreator();
        ethAmount = claimableEthRewards[positionTokenId];
        if (ethAmount == 0) revert NoClaimableRewards();

        claimableEthRewards[positionTokenId] = 0;
        _sendEth(payable(creator), ethAmount);
        emit EthRewardsClaimed(positionTokenId, creator, ethAmount);
    }

    /// @notice Permissionlessly pays the immutable developer wallet its accumulated 10% share in native ETH.
    /// @dev The caller can trigger settlement but cannot redirect the payout.
    function claimDeveloperEthRewards() external nonReentrant returns (uint256 ethAmount) {
        ethAmount = claimableDeveloperEthRewards;
        if (ethAmount == 0) revert NoClaimableRewards();
        claimableDeveloperEthRewards = 0;
        _sendEth(developerWallet, ethAmount);
        emit DeveloperEthRewardsClaimed(developerWallet, ethAmount);
    }

    function ethUsdPriceE18() public view returns (uint256 priceE18) {
        int24 wethUsdgTick = _validatedTwap();
        uint256 usdgPerWethE6 =
            RWIOracleMath.quoteAtTick(wethUsdgTick, uint128(1 ether), address(weth), address(usdg));
        if (usdgPerWethE6 == 0) revert OraclePriceOutOfRange();
        priceE18 = usdgPerWethE6 * 1e12;
    }

    function beforeInitialize(address sender, V4PoolKey calldata key, uint160 sqrtPriceX96)
        external
        view
        returns (bytes4)
    {
        address token = initializingToken;
        address quoteToken = initializingQuoteToken;
        if (
            msg.sender != address(poolManager) || sender != address(this) || token == address(0)
                || sqrtPriceX96 != initializingSqrtPriceX96 || !_isExpectedKey(token, quoteToken, key)
        ) revert InvalidHookCall();
        return this.beforeInitialize.selector;
    }

    /// @notice Matches stored token fees against organic quote-token buys at the current pool price.
    function beforeSwap(address, V4PoolKey calldata key, V4SwapParams calldata params, bytes calldata)
        external
        returns (bytes4 selector, int256 beforeSwapDelta, uint24 lpFeeOverride)
    {
        if (msg.sender != address(poolManager)) revert InvalidHookCall();
        address token = launches[key.currency0].creator != address(0) ? key.currency0 : key.currency1;
        LaunchRecord memory record = launches[token];
        if (record.creator == address(0) || !_isExpectedKey(token, record.quoteToken, key)) revert InvalidHookCall();
        selector = this.beforeSwap.selector;

        bool quoteIs0 = record.quoteToken == key.currency0;
        bool isQuoteToTokenBuy = params.zeroForOne == quoteIs0;
        uint256 inventory = tokenFeeInventory[record.positionTokenId];
        if (!isQuoteToTokenBuy || inventory == 0) return (selector, 0, 0);

        (, int24 currentTick,,) = stateView.getSlot0(record.poolId);
        (uint256 quoteIn, uint256 tokenOut) =
            _internalMatchAmounts(token, record.quoteToken, currentTick, inventory, params.amountSpecified);
        if (quoteIn == 0 || tokenOut == 0) return (selector, 0, 0);

        tokenFeeInventory[record.positionTokenId] = inventory - tokenOut;
        poolManager.take(record.quoteToken, address(this), quoteIn);
        if (record.quoteAsset == QuoteAsset.ETH) _creditEthRewards(record.positionTokenId, quoteIn);
        else convertibleQuoteRewards[record.positionTokenId] += quoteIn;
        _settle(token, tokenOut);

        int128 specifiedDelta;
        int128 unspecifiedDelta;
        if (params.amountSpecified < 0) {
            specifiedDelta = _toInt128(quoteIn);
            unspecifiedDelta = -_toInt128(tokenOut);
        } else {
            specifiedDelta = -_toInt128(tokenOut);
            unspecifiedDelta = _toInt128(quoteIn);
        }
        beforeSwapDelta = _packBeforeSwapDelta(specifiedDelta, unspecifiedDelta);
        emit InternalFeeMatch(record.positionTokenId, token, tokenOut, quoteIn);
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert InvalidHookCall();
        (uint8 action, bytes memory payload) = abi.decode(data, (uint8, bytes));
        if (action == ACTION_NONE || action != activeUnlockAction) revert InvalidHookCall();

        if (action == ACTION_ADD_LIQUIDITY) {
            (address token, V4PoolKey memory key, int24 tickLower, int24 tickUpper, uint128 liquidity) =
                abi.decode(payload, (address, V4PoolKey, int24, int24, uint128));
            if (token != activeUnlockToken || !_isExpectedKey(token, activeUnlockQuoteToken, key)) {
                revert InvalidHookCall();
            }
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
            V4PoolKey memory key = _poolKey(token, record.quoteToken);
            bool tokenIs0 = token == key.currency0;
            uint256 tokenFees;
            uint256 quoteFees;
            for (uint256 index; index <= STAGED_POSITION_COUNT; ++index) {
                int24 offset = index == 0 ? int24(0) : _stagedTickOffset(index - 1);
                int24 lower = index == 0 || !tokenIs0 ? record.tickLower : record.tickLower + offset;
                int24 upper = index == 0 || tokenIs0 ? record.tickUpper : record.tickUpper - offset;
                (int256 feeDelta,) = poolManager.modifyLiquidity(
                    key,
                    V4ModifyLiquidityParams({
                        tickLower: lower,
                        tickUpper: upper,
                        liquidityDelta: 0,
                        salt: bytes32(0)
                    }),
                    bytes("")
                );
                int256 fee0 = _amount0(feeDelta);
                int256 fee1 = _amount1(feeDelta);
                if (fee0 < 0 || fee1 < 0) revert PoolManagerSettlementFailed();
                tokenFees += uint256(tokenIs0 ? fee0 : fee1);
                quoteFees += uint256(tokenIs0 ? fee1 : fee0);
            }
            if (tokenFees != 0) poolManager.take(token, address(this), tokenFees);
            if (quoteFees != 0) poolManager.take(record.quoteToken, address(this), quoteFees);
            return abi.encode(tokenFees, quoteFees);
        }

        if (action == ACTION_DEV_BUY) {
            (address token, V4PoolKey memory key, address creator, uint256 quoteAmount, uint256 minimumTokenOut) =
                abi.decode(payload, (address, V4PoolKey, address, uint256, uint256));
            address quoteToken = activeUnlockQuoteToken;
            if (token != activeUnlockToken || !_isExpectedKey(token, quoteToken, key)) revert InvalidHookCall();
            bool quoteIs0 = quoteToken == key.currency0;
            int256 swapDelta = poolManager.swap(
                key,
                V4SwapParams({
                    zeroForOne: quoteIs0,
                    amountSpecified: -int256(quoteAmount),
                    sqrtPriceLimitX96: quoteIs0 ? MIN_SQRT_PRICE + 1 : MAX_SQRT_PRICE - 1
                }),
                bytes("")
            );
            int256 tokenDelta = token == key.currency0 ? _amount0(swapDelta) : _amount1(swapDelta);
            int256 quoteDelta = quoteToken == key.currency0 ? _amount0(swapDelta) : _amount1(swapDelta);
            if (tokenDelta <= 0 || quoteDelta >= 0 || uint256(-quoteDelta) != quoteAmount) {
                revert InvalidLiquidityResult();
            }
            uint256 tokenAmount = uint256(tokenDelta);
            if (tokenAmount < minimumTokenOut) revert InvalidLiquidityResult();
            _settle(quoteToken, quoteAmount);
            poolManager.take(token, creator, tokenAmount);
            return abi.encode(tokenAmount);
        }

        revert InvalidHookCall();
    }

    receive() external payable {
        if (msg.sender != address(weth) && msg.sender != address(poolManager)) revert UnexpectedEther();
    }

    function poolKey(address token) external view returns (V4PoolKey memory) {
        LaunchRecord memory record = launches[token];
        if (record.creator == address(0)) revert UnknownPosition();
        return _poolKey(token, record.quoteToken);
    }

    function _readOpeningPrice(QuoteAsset quoteAsset)
        internal
        view
        returns (uint256 quoteUsdPriceE18, int24 tokenPerQuoteTick, int24 wethUsdgTick)
    {
        wethUsdgTick = _validatedTwap();
        uint256 usdgPerWethE6 =
            RWIOracleMath.quoteAtTick(wethUsdgTick, uint128(1 ether), address(weth), address(usdg));
        if (usdgPerWethE6 == 0) revert OraclePriceOutOfRange();
        quoteUsdPriceE18 = quoteAsset == QuoteAsset.ETH ? usdgPerWethE6 * 1e12 : 1 ether;

        uint256 humanTokenPerQuoteE18 =
            Math.mulDiv(quoteUsdPriceE18, TOKEN_SUPPLY_WHOLE * 1 ether, TARGET_MARKET_CAP_USD_E18);
        uint256 rawTokenPerQuoteRatioE18 = quoteAsset == QuoteAsset.USDG
            ? humanTokenPerQuoteE18 * 1e12
            : humanTokenPerQuoteE18;
        tokenPerQuoteTick =
            RWIOracleMath.nearestUsableTick(rawTokenPerQuoteRatioE18, MIN_USABLE_TICK, MAX_USABLE_TICK);
        if (tokenPerQuoteTick <= MIN_USABLE_TICK || tokenPerQuoteTick >= MAX_USABLE_TICK) {
            revert OraclePriceOutOfRange();
        }
    }

    function _validatedTwap() internal view returns (int24 arithmeticMeanTick) {
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = ORACLE_TWAP_WINDOW;
        secondsAgos[1] = 0;
        (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s) =
            wethUsdgPool.observe(secondsAgos);
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
        if (harmonicMeanLiquidity < MIN_WETH_USDG_HARMONIC_LIQUIDITY) {
            revert OraclePoolLiquidityTooLow(
                address(wethUsdgPool), harmonicMeanLiquidity, MIN_WETH_USDG_HARMONIC_LIQUIDITY
            );
        }

        (, int24 spotTick,,,,,) = wethUsdgPool.slot0();
        int256 deviation = int256(spotTick) - int256(arithmeticMeanTick);
        if (deviation < 0) deviation = -deviation;
        if (deviation > int256(MAX_WETH_USDG_SPOT_TWAP_DEVIATION)) {
            revert OracleSpotDeviationTooHigh(address(wethUsdgPool), spotTick, arithmeticMeanTick);
        }
    }

    function _internalMatchAmounts(
        address token,
        address quoteToken,
        int24 currentTick,
        uint256 inventory,
        int256 amountSpecified
    ) private pure returns (uint256 quoteIn, uint256 tokenOut) {
        uint256 signedLimit = uint256(uint128(type(int128).max));
        if (amountSpecified < 0) {
            uint256 requestedQuoteIn = amountSpecified == type(int256).min
                ? signedLimit
                : uint256(-amountSpecified);
            if (requestedQuoteIn > signedLimit) requestedQuoteIn = signedLimit;
            if (requestedQuoteIn == 0) return (0, 0);
            quoteIn = requestedQuoteIn;
            tokenOut = RWIOracleMath.quoteAtTick(currentTick, uint128(quoteIn), quoteToken, token);
        } else {
            tokenOut = uint256(amountSpecified);
            if (tokenOut > signedLimit) tokenOut = signedLimit;
        }

        if (tokenOut > inventory) tokenOut = inventory;
        if (tokenOut == 0) return (0, 0);
        quoteIn = RWIOracleMath.quoteAtTick(currentTick, uint128(tokenOut), token, quoteToken);
        if (quoteIn == 0 || quoteIn > signedLimit) return (0, 0);

        if (amountSpecified < 0) {
            uint256 requestedQuoteIn = amountSpecified == type(int256).min
                ? type(uint256).max
                : uint256(-amountSpecified);
            if (quoteIn > requestedQuoteIn) return (0, 0);
        }
    }

    function _creditEthRewards(uint256 positionTokenId, uint256 grossEthAmount)
        private
        returns (uint256 creatorEthAmount, uint256 developerEthAmount)
    {
        if (grossEthAmount == 0) return (0, 0);
        developerEthAmount = Math.mulDiv(grossEthAmount, DEVELOPER_LP_FEE_SHARE_BPS, BPS);
        creatorEthAmount = grossEthAmount - developerEthAmount;
        claimableEthRewards[positionTokenId] += creatorEthAmount;
        claimableDeveloperEthRewards += developerEthAmount;
        emit EthRewardsAccrued(positionTokenId, grossEthAmount, creatorEthAmount, developerEthAmount);
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
        uint256 settled;
        if (currency == address(0)) settled = poolManager.settle{value: amount}();
        else {
            IERC20(currency).safeTransfer(address(poolManager), amount);
            settled = poolManager.settle();
        }
        if (settled != amount) revert PoolManagerSettlementFailed();
    }

    function _poolKey(address token, address quoteToken) internal view returns (V4PoolKey memory key) {
        if (token == quoteToken) revert InvalidIntegration();
        (address currency0, address currency1) = token < quoteToken ? (token, quoteToken) : (quoteToken, token);
        key = V4PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: POOL_FEE,
            tickSpacing: POOL_TICK_SPACING,
            hooks: address(this)
        });
    }

    function _isExpectedKey(address token, address quoteToken, V4PoolKey memory key)
        internal
        view
        returns (bool)
    {
        V4PoolKey memory expected = _poolKey(token, quoteToken);
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

    function _validateOraclePool(
        IUniswapV3Factory factory,
        IUniswapV3OraclePoolMinimal pool,
        address tokenA,
        address tokenB
    ) private view {
        address token0 = pool.token0();
        address token1 = pool.token1();
        if (
            pool.fee() != WETH_USDG_POOL_FEE || factory.getPool(tokenA, tokenB, WETH_USDG_POOL_FEE) != address(pool)
                || !((token0 == tokenA && token1 == tokenB) || (token0 == tokenB && token1 == tokenA))
        ) revert InvalidIntegration();
    }

    function _setUnlock(uint8 action, address token, address quoteToken) private {
        activeUnlockAction = action;
        activeUnlockToken = token;
        activeUnlockQuoteToken = quoteToken;
    }

    function _addLockedLiquidity(
        address token,
        address quoteToken,
        V4PoolKey memory key,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity
    ) private returns (uint256 tokenUsed) {
        _setUnlock(ACTION_ADD_LIQUIDITY, token, quoteToken);
        bytes memory result = poolManager.unlock(
            abi.encode(ACTION_ADD_LIQUIDITY, abi.encode(token, key, tickLower, tickUpper, liquidity))
        );
        _clearUnlock();
        uint256 quoteUsed;
        (tokenUsed, quoteUsed) = abi.decode(result, (uint256, uint256));
        if (quoteUsed != 0) revert InvalidLiquidityResult();
    }

    function seedLockedLiquidity(
        address token,
        address quoteToken,
        V4PoolKey memory key,
        int24 openingPoolTick,
        uint160 sqrtPriceX96,
        uint256 totalSupply
    ) external returns (uint128 liquidity, uint256 tokenUsed, int24 tickLower, int24 tickUpper) {
        if (msg.sender != address(this)) revert InvalidHookCall();
        bool tokenIs0 = token == key.currency0;
        tickLower = tokenIs0 ? openingPoolTick : MIN_USABLE_TICK;
        tickUpper = tokenIs0 ? MAX_USABLE_TICK : openingPoolTick;
        uint256 initialAmount = Math.mulDiv(totalSupply, INITIAL_ACTIVE_TOKEN_BPS, BPS);
        liquidity = tokenIs0
            ? _liquidityForAmount0(sqrtPriceX96, RWIOracleMath.getSqrtRatioAtTick(tickUpper), initialAmount)
            : _liquidityForAmount1(RWIOracleMath.getSqrtRatioAtTick(tickLower), sqrtPriceX96, initialAmount);
        if (liquidity == 0) revert InvalidLiquidityResult();
        tokenUsed = _addLockedLiquidity(token, quoteToken, key, tickLower, tickUpper, liquidity);
        tokenUsed += _addStagedPositions(
            token,
            quoteToken,
            key,
            openingPoolTick,
            tokenIs0,
            Math.mulDiv(totalSupply, STAGED_TRANCHE_TOKEN_BPS, BPS)
        );
    }

    function _addStagedPositions(
        address token,
        address quoteToken,
        V4PoolKey memory key,
        int24 openingPoolTick,
        bool tokenIs0,
        uint256 stagedTokenAmount
    ) private returns (uint256 tokenUsed) {
        for (uint256 index; index < STAGED_POSITION_COUNT; ++index) {
            int24 offset = _stagedTickOffset(index);
            int24 lower = tokenIs0 ? openingPoolTick + offset : MIN_USABLE_TICK;
            int24 upper = tokenIs0 ? MAX_USABLE_TICK : openingPoolTick - offset;
            uint128 liquidity = tokenIs0
                ? _liquidityForAmount0(
                    RWIOracleMath.getSqrtRatioAtTick(lower), RWIOracleMath.getSqrtRatioAtTick(upper), stagedTokenAmount
                )
                : _liquidityForAmount1(
                    RWIOracleMath.getSqrtRatioAtTick(lower), RWIOracleMath.getSqrtRatioAtTick(upper), stagedTokenAmount
                );
            if (liquidity == 0) revert InvalidLiquidityResult();
            uint256 used = _addLockedLiquidity(token, quoteToken, key, lower, upper, liquidity);
            tokenUsed += used;
            emit StagedLiquidityConfigured(token, liquidity, used, lower, upper);
        }
    }

    function _clearUnlock() private {
        activeUnlockAction = ACTION_NONE;
        activeUnlockToken = address(0);
        activeUnlockQuoteToken = address(0);
    }

    function _sendEth(address payable recipient, uint256 amount) private {
        (bool sent,) = recipient.call{value: amount}("");
        if (!sent) revert NativeTransferFailed();
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
