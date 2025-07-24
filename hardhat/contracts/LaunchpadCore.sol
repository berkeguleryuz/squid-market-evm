// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./NFTCollection.sol";

/**
 * @title LaunchpadCore
 * @dev Core launch management functions - optimized for size
 */
contract LaunchpadCore is Ownable, ReentrancyGuard, Pausable {
    // Events
    event LaunchCreated(
        uint256 indexed launchId,
        address indexed collection,
        address indexed creator
    );
    event LaunchStatusChanged(uint256 indexed launchId, LaunchStatus newStatus);
    event PhaseConfigured(
        uint256 indexed launchId,
        uint8 phase,
        uint256 price,
        uint256 startTime,
        uint256 endTime,
        uint256 maxPerWallet
    );
    event LaunchStarted(
        uint256 indexed launchId,
        uint8 phase,
        uint256 timestamp
    );
    event LaunchPhaseChanged(
        uint256 indexed launchId,
        uint8 fromPhase,
        uint8 toPhase,
        uint256 timestamp
    );
    event NFTPurchased(
        uint256 indexed launchId,
        address indexed buyer,
        uint256 indexed tokenId,
        uint8 phase,
        uint256 price
    );
    event WhitelistUpdated(
        uint256 indexed launchId,
        uint8 indexed phase,
        address indexed user,
        bool isWhitelisted
    );

    // Enums
    enum LaunchStatus {
        PENDING,
        ACTIVE,
        COMPLETED,
        CANCELLED
    }
    enum Phase {
        NONE,
        PRESALE,
        WHITELIST,
        PUBLIC
    }

    // Structures
    struct LaunchInfo {
        address collection;
        address creator;
        string name;
        string symbol;
        string description;
        string imageUri;
        uint256 maxSupply;
        uint256 startTime;
        LaunchStatus status;
        bool autoProgress;
        uint8 currentPhase;
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
    uint256 public launchCounter;
    mapping(uint256 => LaunchInfo) public launches;
    mapping(address => uint256[]) public creatorLaunches;
    mapping(uint256 => mapping(uint8 => PhaseConfig)) public launchPhases;
    mapping(uint256 => mapping(uint8 => mapping(address => bool)))
        public whitelists;
    mapping(uint256 => mapping(address => uint256)) public purchaseCounts;

    // Platform settings
    address payable public feeRecipient;
    uint256 public platformFeePercentage = 250; // 2.5%

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = payable(_feeRecipient);
    }

    /**
     * @dev Create a new NFT collection launch
     */
    function createLaunch(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _imageUri,
        uint256 _maxSupply,
        bool _autoProgress
    ) external whenNotPaused returns (uint256 launchId) {
        require(_maxSupply > 0 && _maxSupply <= 10000, "Invalid max supply");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_symbol).length > 0, "Symbol required");

        launchId = launchCounter++;

        // Deploy NFT collection
        NFTCollection collection = new NFTCollection(
            _name,
            _symbol,
            _description,
            _imageUri,
            _maxSupply,
            msg.sender
        );
        
        // Set launchpad contract address in NFT collection for automatic permission
        collection.setLaunchpadContract(address(this));

        // Store launch info
        launches[launchId] = LaunchInfo({
            collection: address(collection),
            creator: msg.sender,
            name: _name,
            symbol: _symbol,
            description: _description,
            imageUri: _imageUri,
            maxSupply: _maxSupply,
            startTime: block.timestamp,
            status: LaunchStatus.PENDING,
            autoProgress: _autoProgress,
            currentPhase: uint8(Phase.NONE)
        });

        // Track creator launches
        creatorLaunches[msg.sender].push(launchId);

        emit LaunchCreated(launchId, address(collection), msg.sender);
    }

    /**
     * @dev Start a launch
     */
    function startLaunch(uint256 _launchId) external {
        LaunchInfo storage launch = launches[_launchId];
        require(
            launch.creator == msg.sender || msg.sender == owner(),
            "Not authorized"
        );
        require(
            launch.status == LaunchStatus.PENDING,
            "Launch already started"
        );

        launch.status = LaunchStatus.ACTIVE;
        launch.startTime = block.timestamp;

        emit LaunchStatusChanged(_launchId, LaunchStatus.ACTIVE);
    }

    /**
     * @dev Complete a launch
     */
    function completeLaunch(uint256 _launchId) external {
        LaunchInfo storage launch = launches[_launchId];
        require(
            launch.creator == msg.sender || msg.sender == owner(),
            "Not authorized"
        );
        require(launch.status == LaunchStatus.ACTIVE, "Launch not active");

        launch.status = LaunchStatus.COMPLETED;

        emit LaunchStatusChanged(_launchId, LaunchStatus.COMPLETED);
    }

    /**
     * @dev Cancel a launch
     */
    function cancelLaunch(uint256 _launchId) external {
        LaunchInfo storage launch = launches[_launchId];
        require(
            launch.creator == msg.sender || msg.sender == owner(),
            "Not authorized"
        );
        require(
            launch.status != LaunchStatus.COMPLETED,
            "Launch already completed"
        );

        launch.status = LaunchStatus.CANCELLED;

        emit LaunchStatusChanged(_launchId, LaunchStatus.CANCELLED);
    }

    /**
     * @dev Get launch info
     */
    function getLaunchInfo(
        uint256 _launchId
    ) external view returns (LaunchInfo memory) {
        return launches[_launchId];
    }

    /**
     * @dev Get creator's launches
     */
    function getCreatorLaunches(
        address _creator
    ) external view returns (uint256[] memory) {
        return creatorLaunches[_creator];
    }

    /**
     * @dev Get active launches (simplified - returns first 10)
     */
    function getActiveLaunches()
        external
        view
        returns (uint256[] memory activeLaunches)
    {
        uint256[] memory temp = new uint256[](10);
        uint256 count = 0;

        for (uint256 i = 0; i < launchCounter && count < 10; i++) {
            if (launches[i].status == LaunchStatus.ACTIVE) {
                temp[count] = i;
                count++;
            }
        }

        activeLaunches = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            activeLaunches[i] = temp[i];
        }
    }

    // Admin functions
    function setFeeRecipient(address payable _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = _fee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Phase Management Functions

    /**
     * @dev Configure a phase for a launch
     */
    function configurePhase(
        uint256 _launchId,
        uint8 _phase,
        uint256 _price,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxPerWallet
    ) external {
        require(_launchId < launchCounter, "Invalid launch ID");
        LaunchInfo storage launch = launches[_launchId];
        require(
            msg.sender == launch.creator || msg.sender == owner(),
            "Not authorized"
        );
        require(
            launch.status == LaunchStatus.PENDING ||
                launch.status == LaunchStatus.ACTIVE,
            "Cannot configure"
        );
        require(
            _phase >= uint8(Phase.PRESALE) && _phase <= uint8(Phase.PUBLIC),
            "Invalid phase"
        );
        require(_startTime < _endTime, "Invalid time range");
        require(_price > 0, "Price must be greater than 0");

        launchPhases[_launchId][_phase] = PhaseConfig({
            price: _price,
            startTime: _startTime,
            endTime: _endTime,
            maxPerWallet: _maxPerWallet,
            maxSupply: launch.maxSupply, // Use launch max supply
            totalSold: 0,
            isConfigured: true
        });
        
        // Also configure phase in NFT collection contract for security
        NFTCollection collection = NFTCollection(launch.collection);
        collection.configurePhase(_phase, _price, _startTime, _endTime, _maxPerWallet, launch.maxSupply);
        
        emit PhaseConfigured(
            _launchId,
            _phase,
            _price,
            _startTime,
            _endTime,
            _maxPerWallet
        );
    }

    /**
     * @dev Get phase configuration
     */
    function getPhaseConfig(
        uint256 _launchId,
        uint8 _phase
    )
        external
        view
        returns (
            uint256 price,
            uint256 startTime,
            uint256 endTime,
            uint256 maxPerWallet,
            uint256 maxSupply,
            uint256 totalSold,
            bool isConfigured
        )
    {
        PhaseConfig storage config = launchPhases[_launchId][_phase];
        return (
            config.price,
            config.startTime,
            config.endTime,
            config.maxPerWallet,
            config.maxSupply,
            config.totalSold,
            config.isConfigured
        );
    }

    /**
     * @dev Add addresses to whitelist for a specific phase
     */
    function addToWhitelist(
        uint256 _launchId,
        uint8 _phase,
        address[] calldata _addresses
    ) external {
        require(_launchId < launchCounter, "Invalid launch ID");
        LaunchInfo storage launch = launches[_launchId];
        require(
            msg.sender == launch.creator || msg.sender == owner(),
            "Not authorized"
        );

        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelists[_launchId][_phase][_addresses[i]] = true;
            emit WhitelistUpdated(_launchId, _phase, _addresses[i], true);
        }
    }

    /**
     * @dev Remove addresses from whitelist for a specific phase
     */
    function removeFromWhitelist(
        uint256 _launchId,
        uint8 _phase,
        address[] calldata _addresses
    ) external {
        require(_launchId < launchCounter, "Invalid launch ID");
        LaunchInfo storage launch = launches[_launchId];
        require(
            msg.sender == launch.creator || msg.sender == owner(),
            "Not authorized"
        );

        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelists[_launchId][_phase][_addresses[i]] = false;
            emit WhitelistUpdated(_launchId, _phase, _addresses[i], false);
        }
    }

    /**
     * @dev Check if address is whitelisted for a phase
     */
    function isWhitelisted(
        uint256 _launchId,
        uint8 _phase,
        address _address
    ) external view returns (bool) {
        return whitelists[_launchId][_phase][_address];
    }

    /**
     * @dev Get current active phase for a launch
     */
    function getCurrentPhase(uint256 _launchId) external view returns (uint8) {
        require(_launchId < launchCounter, "Invalid launch ID");
        LaunchInfo storage launch = launches[_launchId];

        if (launch.status != LaunchStatus.ACTIVE) {
            return uint8(Phase.NONE);
        }

        // Check each phase in order to find the current active one
        for (
            uint8 phase = uint8(Phase.PRESALE);
            phase <= uint8(Phase.PUBLIC);
            phase++
        ) {
            PhaseConfig storage config = launchPhases[_launchId][phase];
            if (
                config.isConfigured &&
                block.timestamp >= config.startTime &&
                block.timestamp <= config.endTime
            ) {
                return phase;
            }
        }

        return uint8(Phase.NONE);
    }
}
