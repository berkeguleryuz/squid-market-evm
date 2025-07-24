// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./NFTCollection.sol";

/**
 * @title Launchpad
 * @dev Manages NFT collection launches with multi-phase system, timer functionality, and automated progression
 */
contract Launchpad is Ownable, ReentrancyGuard, Pausable {

    // Events
    event LaunchCreated(
        uint256 indexed launchId, 
        address indexed collection, 
        address indexed creator, 
        uint256 startTime
    );
    event LaunchConfigured(
        uint256 indexed launchId, 
        uint8 phase, 
        uint256 price, 
        uint256 startTime, 
        uint256 endTime
    );
    event LaunchStarted(uint256 indexed launchId, uint8 phase, uint256 timestamp);
    event LaunchPhaseChanged(uint256 indexed launchId, uint8 fromPhase, uint8 toPhase, uint256 timestamp);
    event LaunchCompleted(uint256 indexed launchId, uint256 timestamp, uint256 totalRaised);
    event LaunchCancelled(uint256 indexed launchId, uint256 timestamp);
    event NFTPurchased(
        uint256 indexed launchId, 
        address indexed buyer, 
        uint256 indexed tokenId, 
        uint8 phase, 
        uint256 price
    );
    event RevenueWithdrawn(uint256 indexed launchId, address indexed recipient, uint256 amount);

    // Enums
    enum LaunchStatus { PENDING, ACTIVE, COMPLETED, CANCELLED }
    enum Phase { NONE, PRESALE, WHITELIST, PUBLIC }

    // Structures
    struct LaunchConfig {
        address collection;
        address creator;
        string name;
        string description;
        LaunchStatus status;
        uint256 createdAt;
        uint256 totalRaised;
        uint8 currentPhase;
        bool autoProgressPhases;
    }

    struct PhaseConfig {
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        uint256 maxPerWallet;
        uint256 maxSupply;
        uint256 totalSold;
        bool isConfigured;
    }

    // State variables
    uint256 private _launchIdCounter;
    
    mapping(uint256 => LaunchConfig) public launches;
    mapping(uint256 => mapping(uint8 => PhaseConfig)) public launchPhases;
    mapping(uint256 => mapping(address => uint256)) public purchasedPerLaunch;
    mapping(address => uint256[]) public creatorLaunches;
    
    uint256 public platformFeePercentage = 250; // 2.5%
    address public feeRecipient;
    uint256 public minimumLaunchDuration = 1 hours;
    uint256 public maximumLaunchDuration = 30 days;

    // Modifiers
    modifier validLaunch(uint256 _launchId) {
        require(_launchId < _launchIdCounter, "Invalid launch ID");
        _;
    }

    modifier onlyCreator(uint256 _launchId) {
        require(launches[_launchId].creator == msg.sender, "Only creator can call this");
        _;
    }

    modifier launchActive(uint256 _launchId) {
        require(launches[_launchId].status == LaunchStatus.ACTIVE, "Launch not active");
        _;
    }

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new NFT collection launch
     */
    function createLaunch(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _image,
        uint256 _maxSupply,
        bool _autoProgressPhases
    ) external nonReentrant returns (uint256 launchId, address collection) {
        // Deploy new NFT collection
        NFTCollection nftCollection = new NFTCollection(
            _name,
            _symbol,
            _description,
            _image,
            _maxSupply,
            msg.sender
        );

        launchId = _launchIdCounter;
        _launchIdCounter++;

        // Set this contract as the launchpad
        nftCollection.setLaunchpadContract(address(this));

        // Create launch configuration
        launches[launchId] = LaunchConfig({
            collection: address(nftCollection),
            creator: msg.sender,
            name: _name,
            description: _description,
            status: LaunchStatus.PENDING,
            createdAt: block.timestamp,
            totalRaised: 0,
            currentPhase: uint8(Phase.NONE),
            autoProgressPhases: _autoProgressPhases
        });

        // Track creator's launches
        creatorLaunches[msg.sender].push(launchId);

        emit LaunchCreated(launchId, address(nftCollection), msg.sender, block.timestamp);
        return (launchId, address(nftCollection));
    }

    /**
     * @dev Configure a launch phase
     */
    function configureLaunchPhase(
        uint256 _launchId,
        uint8 _phase,
        uint256 _price,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxPerWallet,
        uint256 _maxSupply
    ) external validLaunch(_launchId) onlyCreator(_launchId) {
        require(_phase >= uint8(Phase.PRESALE) && _phase <= uint8(Phase.PUBLIC), "Invalid phase");
        require(_startTime < _endTime, "Invalid time range");
        require(_endTime - _startTime >= minimumLaunchDuration, "Duration too short");
        require(_endTime - _startTime <= maximumLaunchDuration, "Duration too long");
        require(launches[_launchId].status == LaunchStatus.PENDING, "Cannot modify active launch");

        launchPhases[_launchId][_phase] = PhaseConfig({
            price: _price,
            startTime: _startTime,
            endTime: _endTime,
            maxPerWallet: _maxPerWallet,
            maxSupply: _maxSupply,
            totalSold: 0,
            isConfigured: true
        });

        // Configure phase in NFT collection contract
        NFTCollection collection = NFTCollection(launches[_launchId].collection);
        collection.configurePhase(_phase, _price, _startTime, _endTime, _maxPerWallet, _maxSupply);

        emit LaunchConfigured(_launchId, _phase, _price, _startTime, _endTime);
    }

    /**
     * @dev Start a launch manually (or automatically if auto-progress is enabled)
     */
    function startLaunch(uint256 _launchId) external validLaunch(_launchId) onlyCreator(_launchId) {
        LaunchConfig storage launch = launches[_launchId];
        require(launch.status == LaunchStatus.PENDING, "Launch already started");
        
        // Find the first configured phase to start with
        uint8 startPhase = _findNextPhase(_launchId, uint8(Phase.NONE));
        require(startPhase != uint8(Phase.NONE), "No phases configured");
        
        // Check if the phase is ready to start
        PhaseConfig storage phaseConfig = launchPhases[_launchId][startPhase];
        require(block.timestamp >= phaseConfig.startTime, "Phase not ready to start");

        launch.status = LaunchStatus.ACTIVE;
        launch.currentPhase = startPhase;

        emit LaunchStarted(_launchId, startPhase, block.timestamp);
    }

    /**
     * @dev Purchase NFT from an active launch
     */
    function purchaseNFT(
        uint256 _launchId,
        string memory _tokenURI
    ) external payable nonReentrant validLaunch(_launchId) launchActive(_launchId) {
        LaunchConfig storage launch = launches[_launchId];
        
        // Check and update phase if auto-progression is enabled
        if (launch.autoProgressPhases) {
            _checkAndUpdatePhase(_launchId);
        }

        uint8 currentPhase = launch.currentPhase;
        PhaseConfig storage phaseConfig = launchPhases[_launchId][currentPhase];
        
        require(phaseConfig.isConfigured, "Phase not configured");
        require(block.timestamp >= phaseConfig.startTime, "Phase not started");
        require(block.timestamp <= phaseConfig.endTime, "Phase ended");
        require(msg.value >= phaseConfig.price, "Insufficient payment");
        require(phaseConfig.totalSold < phaseConfig.maxSupply, "Phase sold out");
        require(purchasedPerLaunch[_launchId][msg.sender] < phaseConfig.maxPerWallet, "Max per wallet reached");

        // Mint NFT through collection contract
        NFTCollection collection = NFTCollection(launch.collection);
        uint256 tokenId = collection.mintNFT{value: phaseConfig.price}(
            msg.sender,
            currentPhase,
            _tokenURI
        );

        // Update tracking
        phaseConfig.totalSold++;
        purchasedPerLaunch[_launchId][msg.sender]++;
        launch.totalRaised += phaseConfig.price;

        // Refund excess payment
        if (msg.value > phaseConfig.price) {
            payable(msg.sender).transfer(msg.value - phaseConfig.price);
        }

        emit NFTPurchased(_launchId, msg.sender, tokenId, currentPhase, phaseConfig.price);

        // Check if phase is complete and auto-progress to next
        if (launch.autoProgressPhases && phaseConfig.totalSold >= phaseConfig.maxSupply) {
            _progressToNextPhase(_launchId);
        }
    }

    /**
     * @dev Manually progress to next phase (for creators)
     */
    function progressToNextPhase(uint256 _launchId) external validLaunch(_launchId) onlyCreator(_launchId) {
        _progressToNextPhase(_launchId);
    }

    /**
     * @dev Complete launch manually
     */
    function completeLaunch(uint256 _launchId) external validLaunch(_launchId) onlyCreator(_launchId) {
        LaunchConfig storage launch = launches[_launchId];
        require(launch.status == LaunchStatus.ACTIVE, "Launch not active");
        
        launch.status = LaunchStatus.COMPLETED;
        
        emit LaunchCompleted(_launchId, block.timestamp, launch.totalRaised);
    }

    /**
     * @dev Cancel launch (only if not started or in emergency)
     */
    function cancelLaunch(uint256 _launchId) external validLaunch(_launchId) {
        LaunchConfig storage launch = launches[_launchId];
        require(
            msg.sender == launch.creator || msg.sender == owner(),
            "Only creator or owner can cancel"
        );
        require(launch.status != LaunchStatus.COMPLETED, "Cannot cancel completed launch");
        
        launch.status = LaunchStatus.CANCELLED;
        
        emit LaunchCancelled(_launchId, block.timestamp);
    }

    /**
     * @dev Withdraw raised funds (creator and platform fee)
     */
    function withdrawFunds(uint256 _launchId) external validLaunch(_launchId) nonReentrant {
        LaunchConfig storage launch = launches[_launchId];
        require(launch.status == LaunchStatus.COMPLETED, "Launch not completed");
        require(msg.sender == launch.creator, "Only creator can withdraw");
        require(launch.totalRaised > 0, "No funds to withdraw");

        uint256 platformFee = (launch.totalRaised * platformFeePercentage) / 10000;
        uint256 creatorAmount = launch.totalRaised - platformFee;

        // Reset raised amount to prevent re-withdrawal
        launch.totalRaised = 0;

        // Transfer funds
        if (platformFee > 0) {
            payable(feeRecipient).transfer(platformFee);
        }
        payable(launch.creator).transfer(creatorAmount);

        emit RevenueWithdrawn(_launchId, launch.creator, creatorAmount);
    }

    /**
     * @dev Update whitelist for a launch phase
     */
    function updateWhitelist(
        uint256 _launchId,
        uint8 _phase,
        address[] memory _addresses,
        bool _status
    ) external validLaunch(_launchId) onlyCreator(_launchId) {
        NFTCollection collection = NFTCollection(launches[_launchId].collection);
        collection.updateWhitelist(_phase, _addresses, _status);
    }

    /**
     * @dev Set platform fee percentage
     */
    function setPlatformFeePercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 1000, "Max 10%"); // 10% max fee
        platformFeePercentage = _percentage;
    }

    /**
     * @dev Set fee recipient
     */
    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        feeRecipient = _recipient;
    }

    // Internal functions
    function _checkAndUpdatePhase(uint256 _launchId) internal {
        LaunchConfig storage launch = launches[_launchId];
        uint8 currentPhase = launch.currentPhase;
        PhaseConfig storage phaseConfig = launchPhases[_launchId][currentPhase];

        // Check if current phase has ended
        if (block.timestamp > phaseConfig.endTime || phaseConfig.totalSold >= phaseConfig.maxSupply) {
            _progressToNextPhase(_launchId);
        }
    }

    function _progressToNextPhase(uint256 _launchId) internal {
        LaunchConfig storage launch = launches[_launchId];
        uint8 currentPhase = launch.currentPhase;
        uint8 nextPhase = _findNextPhase(_launchId, currentPhase);

        if (nextPhase == uint8(Phase.NONE)) {
            // No more phases, complete the launch
            launch.status = LaunchStatus.COMPLETED;
            emit LaunchCompleted(_launchId, block.timestamp, launch.totalRaised);
        } else {
            // Progress to next phase
            launch.currentPhase = nextPhase;
            emit LaunchPhaseChanged(_launchId, currentPhase, nextPhase, block.timestamp);
        }
    }

    function _findNextPhase(uint256 _launchId, uint8 _currentPhase) internal view returns (uint8) {
        for (uint8 phase = _currentPhase + 1; phase <= uint8(Phase.PUBLIC); phase++) {
            if (launchPhases[_launchId][phase].isConfigured) {
                PhaseConfig storage phaseConfig = launchPhases[_launchId][phase];
                if (block.timestamp >= phaseConfig.startTime) {
                    return phase;
                }
            }
        }
        return uint8(Phase.NONE);
    }

    // View functions
    function getLaunchInfo(uint256 _launchId) external view validLaunch(_launchId) returns (LaunchConfig memory) {
        return launches[_launchId];
    }

    function getPhaseInfo(uint256 _launchId, uint8 _phase) external view validLaunch(_launchId) returns (PhaseConfig memory) {
        return launchPhases[_launchId][_phase];
    }

    function getCreatorLaunches(address _creator) external view returns (uint256[] memory) {
        return creatorLaunches[_creator];
    }

    function getActiveLaunches() external view returns (uint256[] memory) {
        uint256[] memory activeLaunches = new uint256[](_launchIdCounter);
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < _launchIdCounter; i++) {
            if (launches[i].status == LaunchStatus.ACTIVE) {
                activeLaunches[activeCount] = i;
                activeCount++;
            }
        }
        
        // Create properly sized array
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeLaunches[i];
        }
        
        return result;
    }

    function getCurrentLaunchId() external view returns (uint256) {
        return _launchIdCounter;
    }

    function isPhaseActive(uint256 _launchId, uint8 _phase) external view validLaunch(_launchId) returns (bool) {
        LaunchConfig storage launch = launches[_launchId];
        PhaseConfig storage phaseConfig = launchPhases[_launchId][_phase];
        
        return launch.status == LaunchStatus.ACTIVE &&
               launch.currentPhase == _phase &&
               phaseConfig.isConfigured &&
               block.timestamp >= phaseConfig.startTime &&
               block.timestamp <= phaseConfig.endTime &&
               phaseConfig.totalSold < phaseConfig.maxSupply;
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
} 