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
    event LaunchCreated(uint256 indexed launchId, address indexed collection, address indexed creator);
    event LaunchStatusChanged(uint256 indexed launchId, LaunchStatus newStatus);

    // Enums
    enum LaunchStatus { PENDING, ACTIVE, COMPLETED, CANCELLED }

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
    }

    // State variables
    uint256 public launchCounter;
    mapping(uint256 => LaunchInfo) public launches;
    mapping(address => uint256[]) public creatorLaunches;
    
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
            autoProgress: _autoProgress
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
        require(launch.creator == msg.sender || msg.sender == owner(), "Not authorized");
        require(launch.status == LaunchStatus.PENDING, "Launch already started");

        launch.status = LaunchStatus.ACTIVE;
        launch.startTime = block.timestamp;

        emit LaunchStatusChanged(_launchId, LaunchStatus.ACTIVE);
    }

    /**
     * @dev Complete a launch
     */
    function completeLaunch(uint256 _launchId) external {
        LaunchInfo storage launch = launches[_launchId];
        require(launch.creator == msg.sender || msg.sender == owner(), "Not authorized");
        require(launch.status == LaunchStatus.ACTIVE, "Launch not active");

        launch.status = LaunchStatus.COMPLETED;

        emit LaunchStatusChanged(_launchId, LaunchStatus.COMPLETED);
    }

    /**
     * @dev Cancel a launch
     */
    function cancelLaunch(uint256 _launchId) external {
        LaunchInfo storage launch = launches[_launchId];
        require(launch.creator == msg.sender || msg.sender == owner(), "Not authorized");
        require(launch.status != LaunchStatus.COMPLETED, "Launch already completed");

        launch.status = LaunchStatus.CANCELLED;

        emit LaunchStatusChanged(_launchId, LaunchStatus.CANCELLED);
    }

    /**
     * @dev Get launch info
     */
    function getLaunchInfo(uint256 _launchId) external view returns (LaunchInfo memory) {
        return launches[_launchId];
    }

    /**
     * @dev Get creator's launches
     */
    function getCreatorLaunches(address _creator) external view returns (uint256[] memory) {
        return creatorLaunches[_creator];
    }

    /**
     * @dev Get active launches (simplified - returns first 10)
     */
    function getActiveLaunches() external view returns (uint256[] memory activeLaunches) {
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
} 