// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PaymentHandler
 * @dev Manages payment processing, fee distribution, and multi-token support for the platform
 */
contract PaymentHandler is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event PaymentProcessed(
        address indexed payer,
        address indexed recipient,
        address token,
        uint256 amount,
        uint256 platformFee,
        bytes32 indexed paymentId
    );
    event FeeWithdrawn(address indexed token, address indexed recipient, uint256 amount);
    event TokenAllowlistUpdated(address indexed token, bool allowed);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event EmergencyWithdrawal(address indexed token, address indexed recipient, uint256 amount);

    // Structures
    struct PaymentInfo {
        address payer;
        address recipient;
        address token; // address(0) for ETH
        uint256 amount;
        uint256 platformFee;
        uint256 timestamp;
        bool processed;
    }

    struct TokenInfo {
        bool isAllowed;
        uint256 minimumAmount;
        uint256 customFeePercentage; // 0 means use default platform fee
    }

    // State variables
    mapping(bytes32 => PaymentInfo) public payments;
    mapping(address => TokenInfo) public allowedTokens;
    mapping(address => uint256) public collectedFees; // token -> amount
    mapping(address => uint256) public pendingWithdrawals; // user -> amount (ETH only for now)
    
    address public feeRecipient;
    uint256 public platformFeePercentage = 250; // 2.5%
    uint256 public constant MAX_FEE_PERCENTAGE = 1000; // 10%
    
    // Supported tokens list
    address[] public supportedTokens;
    
    // Payment ID nonce
    uint256 private _paymentNonce;

    // Modifiers
    modifier onlyAllowedToken(address _token) {
        require(_token == address(0) || allowedTokens[_token].isAllowed, "Token not allowed");
        _;
    }

    modifier validPayment(bytes32 _paymentId) {
        require(payments[_paymentId].payer != address(0), "Payment does not exist");
        require(!payments[_paymentId].processed, "Payment already processed");
        _;
    }

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        
        // Allow ETH by default
        allowedTokens[address(0)] = TokenInfo({
            isAllowed: true,
            minimumAmount: 0.001 ether,
            customFeePercentage: 0
        });
    }

    /**
     * @dev Process ETH payment
     */
    function processETHPayment(
        address _recipient,
        bytes32 _paymentId
    ) external payable nonReentrant whenNotPaused onlyAllowedToken(address(0)) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_recipient != address(0), "Invalid recipient");
        require(payments[_paymentId].payer == address(0), "Payment ID already used");
        require(msg.value >= allowedTokens[address(0)].minimumAmount, "Below minimum amount");

        uint256 feePercentage = allowedTokens[address(0)].customFeePercentage > 0 
            ? allowedTokens[address(0)].customFeePercentage 
            : platformFeePercentage;

        uint256 platformFee = (msg.value * feePercentage) / 10000;
        uint256 recipientAmount = msg.value - platformFee;

        // Store payment info
        payments[_paymentId] = PaymentInfo({
            payer: msg.sender,
            recipient: _recipient,
            token: address(0),
            amount: msg.value,
            platformFee: platformFee,
            timestamp: block.timestamp,
            processed: false
        });

        // Add to pending withdrawals for recipient
        pendingWithdrawals[_recipient] += recipientAmount;
        
        // Collect platform fee
        collectedFees[address(0)] += platformFee;

        emit PaymentProcessed(msg.sender, _recipient, address(0), msg.value, platformFee, _paymentId);
    }

    /**
     * @dev Process ERC20 token payment
     */
    function processTokenPayment(
        address _token,
        uint256 _amount,
        address _recipient,
        bytes32 _paymentId
    ) external nonReentrant whenNotPaused onlyAllowedToken(_token) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_recipient != address(0), "Invalid recipient");
        require(payments[_paymentId].payer == address(0), "Payment ID already used");
        require(_amount >= allowedTokens[_token].minimumAmount, "Below minimum amount");

        uint256 feePercentage = allowedTokens[_token].customFeePercentage > 0 
            ? allowedTokens[_token].customFeePercentage 
            : platformFeePercentage;

        uint256 platformFee = (_amount * feePercentage) / 10000;
        uint256 recipientAmount = _amount - platformFee;

        // Transfer tokens from payer to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Store payment info
        payments[_paymentId] = PaymentInfo({
            payer: msg.sender,
            recipient: _recipient,
            token: _token,
            amount: _amount,
            platformFee: platformFee,
            timestamp: block.timestamp,
            processed: false
        });

        // Transfer recipient amount directly for ERC20 tokens
        IERC20(_token).safeTransfer(_recipient, recipientAmount);
        
        // Collect platform fee
        collectedFees[_token] += platformFee;

        // Mark as processed
        payments[_paymentId].processed = true;

        emit PaymentProcessed(msg.sender, _recipient, _token, _amount, platformFee, _paymentId);
    }

    /**
     * @dev Batch process multiple payments
     */
    function batchProcessPayments(
        address[] memory _recipients,
        uint256[] memory _amounts,
        bytes32[] memory _paymentIds
    ) external payable nonReentrant whenNotPaused {
        require(_recipients.length == _amounts.length && _amounts.length == _paymentIds.length, "Array length mismatch");
        require(_recipients.length > 0, "Empty arrays");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }
        require(msg.value >= totalAmount, "Insufficient ETH sent");

        uint256 totalFees = 0;
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient");
            require(_amounts[i] > 0, "Amount must be greater than 0");
            require(payments[_paymentIds[i]].payer == address(0), "Payment ID already used");

            uint256 feePercentage = allowedTokens[address(0)].customFeePercentage > 0 
                ? allowedTokens[address(0)].customFeePercentage 
                : platformFeePercentage;

            uint256 platformFee = (_amounts[i] * feePercentage) / 10000;
            uint256 recipientAmount = _amounts[i] - platformFee;

            // Store payment info
            payments[_paymentIds[i]] = PaymentInfo({
                payer: msg.sender,
                recipient: _recipients[i],
                token: address(0),
                amount: _amounts[i],
                platformFee: platformFee,
                timestamp: block.timestamp,
                processed: false
            });

            // Add to pending withdrawals
            pendingWithdrawals[_recipients[i]] += recipientAmount;
            totalFees += platformFee;

            emit PaymentProcessed(msg.sender, _recipients[i], address(0), _amounts[i], platformFee, _paymentIds[i]);
        }

        // Collect total platform fees
        collectedFees[address(0)] += totalFees;

        // Refund excess ETH
        if (msg.value > totalAmount) {
            payable(msg.sender).transfer(msg.value - totalAmount);
        }
    }

    /**
     * @dev Withdraw pending ETH balance
     */
    function withdrawETH() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending withdrawal");

        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev Withdraw collected platform fees (owner only)
     */
    function withdrawPlatformFees(address _token) external onlyOwner nonReentrant {
        uint256 amount = collectedFees[_token];
        require(amount > 0, "No fees to withdraw");

        collectedFees[_token] = 0;

        if (_token == address(0)) {
            payable(feeRecipient).transfer(amount);
        } else {
            IERC20(_token).safeTransfer(feeRecipient, amount);
        }

        emit FeeWithdrawn(_token, feeRecipient, amount);
    }

    /**
     * @dev Add or update allowed token
     */
    function updateAllowedToken(
        address _token,
        bool _allowed,
        uint256 _minimumAmount,
        uint256 _customFeePercentage
    ) external onlyOwner {
        require(_customFeePercentage <= MAX_FEE_PERCENTAGE, "Fee too high");

        bool wasAllowed = allowedTokens[_token].isAllowed;
        
        allowedTokens[_token] = TokenInfo({
            isAllowed: _allowed,
            minimumAmount: _minimumAmount,
            customFeePercentage: _customFeePercentage
        });

        // Update supported tokens list
        if (_allowed && !wasAllowed && _token != address(0)) {
            supportedTokens.push(_token);
        } else if (!_allowed && wasAllowed && _token != address(0)) {
            // Remove from supported tokens list
            for (uint256 i = 0; i < supportedTokens.length; i++) {
                if (supportedTokens[i] == _token) {
                    supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                    supportedTokens.pop();
                    break;
                }
            }
        }

        emit TokenAllowlistUpdated(_token, _allowed);
    }

    /**
     * @dev Set platform fee percentage
     */
    function setPlatformFeePercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= MAX_FEE_PERCENTAGE, "Fee too high");
        
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = _percentage;
        
        emit PlatformFeeUpdated(oldFee, _percentage);
    }

    /**
     * @dev Set fee recipient
     */
    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        
        address oldRecipient = feeRecipient;
        feeRecipient = _recipient;
        
        emit FeeRecipientUpdated(oldRecipient, _recipient);
    }

    /**
     * @dev Generate unique payment ID
     */
    function generatePaymentId(address _payer, address _recipient, uint256 _amount) external returns (bytes32) {
        bytes32 paymentId = keccak256(abi.encodePacked(
            _payer,
            _recipient,
            _amount,
            block.timestamp,
            _paymentNonce++
        ));
        return paymentId;
    }

    /**
     * @dev Mark payment as processed (for external processing)
     */
    function markPaymentProcessed(bytes32 _paymentId) external onlyOwner validPayment(_paymentId) {
        payments[_paymentId].processed = true;
    }

    // View functions
    function getPaymentInfo(bytes32 _paymentId) external view returns (PaymentInfo memory) {
        return payments[_paymentId];
    }

    function getPendingWithdrawal(address _user) external view returns (uint256) {
        return pendingWithdrawals[_user];
    }

    function getCollectedFees(address _token) external view returns (uint256) {
        return collectedFees[_token];
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    function isTokenAllowed(address _token) external view returns (bool) {
        return allowedTokens[_token].isAllowed;
    }

    function getTokenInfo(address _token) external view returns (TokenInfo memory) {
        return allowedTokens[_token];
    }

    function calculateFee(address _token, uint256 _amount) external view returns (uint256) {
        uint256 feePercentage = allowedTokens[_token].customFeePercentage > 0 
            ? allowedTokens[_token].customFeePercentage 
            : platformFeePercentage;
        
        return (_amount * feePercentage) / 10000;
    }

    function getContractBalance(address _token) external view returns (uint256) {
        if (_token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(_token).balanceOf(address(this));
        }
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");

        if (_token == address(0)) {
            require(address(this).balance >= _amount, "Insufficient ETH balance");
            payable(owner()).transfer(_amount);
        } else {
            require(IERC20(_token).balanceOf(address(this)) >= _amount, "Insufficient token balance");
            IERC20(_token).safeTransfer(owner(), _amount);
        }

        emit EmergencyWithdrawal(_token, owner(), _amount);
    }

    // Receive function to accept ETH
    receive() external payable {}
} 