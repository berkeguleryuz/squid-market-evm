// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NFTCollection
 * @dev ERC721 contract with launchpad integration, multi-phase minting, and metadata management
 */
contract NFTCollection is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, Pausable, ReentrancyGuard {

    // Events
    event CollectionCreated(address indexed creator, string name, string symbol, uint256 maxSupply);
    event PhaseConfigured(uint8 phase, uint256 price, uint256 startTime, uint256 endTime, uint256 maxPerWallet);
    event NFTMinted(address indexed to, uint256 indexed tokenId, uint8 phase);
    event PhaseStarted(uint8 phase, uint256 timestamp);
    event PhaseEnded(uint8 phase, uint256 timestamp);
    event WhitelistUpdated(uint8 phase, address[] addresses, bool status);

    // Enums
    enum Phase { NONE, PRESALE, WHITELIST, PUBLIC }
    enum CollectionStatus { PENDING, ACTIVE, COMPLETED, CANCELLED }

    // Structures
    struct PhaseConfig {
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        uint256 maxPerWallet;
        uint256 maxSupply;
        bool isActive;
    }

    struct CollectionInfo {
        string name;
        string symbol;
        string description;
        string image;
        address creator;
        uint256 maxSupply;
        uint256 currentSupply;
        CollectionStatus status;
        uint256 createdAt;
    }

    // State variables
    uint256 private _tokenIdCounter;
    
    CollectionInfo public collectionInfo;
    mapping(uint8 => PhaseConfig) public phaseConfigs;
    mapping(uint8 => mapping(address => bool)) public whitelist;
    mapping(uint8 => mapping(address => uint256)) public mintedPerPhase;
    mapping(address => uint256) public totalMinted;
    
    string private _baseTokenURI;
    address public launchpadContract;
    address public marketplaceContract;
    uint256 public royaltyPercentage = 250; // 2.5%
    
    // Modifiers
    modifier onlyLaunchpad() {
        require(msg.sender == launchpadContract, "Only launchpad can call this");
        _;
    }

    modifier validPhase(uint8 _phase) {
        require(_phase >= uint8(Phase.PRESALE) && _phase <= uint8(Phase.PUBLIC), "Invalid phase");
        _;
    }

    modifier phaseActive(uint8 _phase) {
        PhaseConfig memory config = phaseConfigs[_phase];
        require(config.isActive, "Phase is not active");
        require(block.timestamp >= config.startTime, "Phase not started");
        require(block.timestamp <= config.endTime, "Phase ended");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _image,
        uint256 _maxSupply,
        address _creator
    ) ERC721(_name, _symbol) Ownable(_creator) {
        collectionInfo = CollectionInfo({
            name: _name,
            symbol: _symbol,
            description: _description,
            image: _image,
            creator: _creator,
            maxSupply: _maxSupply,
            currentSupply: 0,
            status: CollectionStatus.PENDING,
            createdAt: block.timestamp
        });

        emit CollectionCreated(_creator, _name, _symbol, _maxSupply);
    }

    /**
     * @dev Configure a minting phase
     */
    function configurePhase(
        uint8 _phase,
        uint256 _price,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxPerWallet,
        uint256 _maxSupply
    ) external validPhase(_phase) {
        require(msg.sender == owner() || msg.sender == launchpadContract, "Only owner or launchpad");
        require(_startTime < _endTime, "Invalid time range");
        require(_maxSupply <= collectionInfo.maxSupply, "Exceeds max supply");

        phaseConfigs[_phase] = PhaseConfig({
            price: _price,
            startTime: _startTime,
            endTime: _endTime,
            maxPerWallet: _maxPerWallet,
            maxSupply: _maxSupply,
            isActive: true
        });

        emit PhaseConfigured(_phase, _price, _startTime, _endTime, _maxPerWallet);
    }

    /**
     * @dev Update whitelist for a specific phase
     */
    function updateWhitelist(
        uint8 _phase,
        address[] memory _addresses,
        bool _status
    ) external validPhase(_phase) {
        require(msg.sender == owner() || msg.sender == launchpadContract, "Only owner or launchpad");
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelist[_phase][_addresses[i]] = _status;
        }
        emit WhitelistUpdated(_phase, _addresses, _status);
    }

    /**
     * @dev Mint NFT during a specific phase
     */
    function mintNFT(
        address _to,
        uint8 _phase,
        string memory _tokenURI
    ) external payable nonReentrant phaseActive(_phase) returns (uint256) {
        PhaseConfig memory config = phaseConfigs[_phase];
        
        // Check payment
        require(msg.value >= config.price, "Insufficient payment");
        
        // Check supply limits
        require(collectionInfo.currentSupply < collectionInfo.maxSupply, "Max supply reached");
        require(collectionInfo.currentSupply < config.maxSupply, "Phase max supply reached");
        
        // Check per-wallet limits
        require(mintedPerPhase[_phase][_to] < config.maxPerWallet, "Max per wallet reached");
        
        // Check whitelist for whitelist phase
        if (_phase == uint8(Phase.WHITELIST)) {
            require(whitelist[_phase][_to], "Not whitelisted");
        }

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // Update counters
        mintedPerPhase[_phase][_to]++;
        totalMinted[_to]++;
        collectionInfo.currentSupply++;

        // Refund excess payment
        if (msg.value > config.price) {
            payable(_to).transfer(msg.value - config.price);
        }

        emit NFTMinted(_to, tokenId, _phase);
        return tokenId;
    }

    /**
     * @dev Batch mint for launchpad (only callable by launchpad contract)
     */
    function launchpadMint(
        address _to,
        uint256 _quantity,
        string[] memory _tokenURIs
    ) external onlyLaunchpad returns (uint256[] memory) {
        require(_quantity == _tokenURIs.length, "Mismatched quantity and URIs");
        require(collectionInfo.currentSupply + _quantity <= collectionInfo.maxSupply, "Exceeds max supply");

        uint256[] memory tokenIds = new uint256[](_quantity);

        for (uint256 i = 0; i < _quantity; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;

            _safeMint(_to, tokenId);
            _setTokenURI(tokenId, _tokenURIs[i]);

            tokenIds[i] = tokenId;
            collectionInfo.currentSupply++;
        }

        return tokenIds;
    }

    /**
     * @dev Set collection status
     */
    function setCollectionStatus(CollectionStatus _status) external onlyOwner {
        collectionInfo.status = _status;
    }

    /**
     * @dev Set launchpad contract address
     */
    function setLaunchpadContract(address _launchpad) external {
        require(launchpadContract == address(0) || msg.sender == owner(), "Already set or not owner");
        launchpadContract = _launchpad;
    }

    /**
     * @dev Set marketplace contract address
     */
    function setMarketplaceContract(address _marketplace) external onlyOwner {
        marketplaceContract = _marketplace;
    }

    /**
     * @dev Set base URI for metadata
     */
    function setBaseURI(string memory _baseURI) external onlyOwner {
        _baseTokenURI = _baseURI;
    }

    /**
     * @dev Set royalty percentage (basis points)
     */
    function setRoyaltyPercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 1000, "Max 10%"); // 10% max royalty
        royaltyPercentage = _percentage;
    }

    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getCollectionInfo() external view returns (CollectionInfo memory) {
        return collectionInfo;
    }

    function getPhaseConfig(uint8 _phase) external view returns (PhaseConfig memory) {
        return phaseConfigs[_phase];
    }

    function isWhitelisted(uint8 _phase, address _address) external view returns (bool) {
        return whitelist[_phase][_address];
    }

    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function totalSupply() external view returns (uint256) {
        return collectionInfo.currentSupply;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
} 