// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title Marketplace
 * @dev NFT marketplace with commission system, auctions, and aggregator functionality
 */
contract Marketplace is Ownable, ReentrancyGuard, Pausable, IERC721Receiver {

    // Events
    event ItemListed(
        uint256 indexed listingId,
        address indexed collection,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        bool isAuction
    );
    event ItemSold(
        uint256 indexed listingId,
        address indexed collection,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    event ItemUpdated(uint256 indexed listingId, uint256 newPrice);
    event ItemCancelled(uint256 indexed listingId);
    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount,
        uint256 timestamp
    );
    event AuctionExtended(uint256 indexed listingId, uint256 newEndTime);
    event RoyaltyPaid(
        address indexed collection,
        uint256 indexed tokenId,
        address recipient,
        uint256 amount
    );

    // Enums
    enum ListingStatus { ACTIVE, SOLD, CANCELLED }
    enum ListingType { FIXED_PRICE, AUCTION }

    // Structures
    struct Listing {
        uint256 listingId;
        address collection;
        uint256 tokenId;
        address payable seller;
        uint256 price;
        ListingType listingType;
        ListingStatus status;
        uint256 createdAt;
        uint256 endTime; // For auctions
        address highestBidder;
        uint256 highestBid;
        bool hasRoyalty;
        uint256 royaltyAmount;
        address royaltyRecipient;
    }

    struct CollectionInfo {
        bool isVerified;
        uint256 floorPrice;
        uint256 totalVolume;
        uint256 totalItems;
        address creator;
    }

    // State variables
    uint256 private _listingIdCounter;
    
    mapping(uint256 => Listing) public listings;
    mapping(address => CollectionInfo) public collections;
    mapping(address => mapping(uint256 => uint256)) public tokenToListing; // collection -> tokenId -> listingId
    mapping(address => uint256[]) public userListings;
    mapping(uint256 => mapping(address => uint256)) public auctionBids; // listingId -> bidder -> amount
    
    // Platform settings
    uint256 public platformFeePercentage = 250; // 2.5%
    address payable public feeRecipient;
    uint256 public minimumBidIncrement = 100; // 1%
    uint256 public auctionExtensionTime = 10 minutes;
    uint256 public defaultAuctionDuration = 24 hours;
    
    // Aggregator settings
    mapping(address => bool) public supportedCollections;
    address[] public allCollections;

    // Modifiers
    modifier validListing(uint256 _listingId) {
        require(_listingId < _listingIdCounter, "Invalid listing ID");
        require(listings[_listingId].status == ListingStatus.ACTIVE, "Listing not active");
        _;
    }

    modifier onlySeller(uint256 _listingId) {
        require(listings[_listingId].seller == msg.sender, "Only seller can call this");
        _;
    }

    modifier notSeller(uint256 _listingId) {
        require(listings[_listingId].seller != msg.sender, "Seller cannot bid on own item");
        _;
    }

    constructor(address payable _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev List an NFT for sale (fixed price or auction)
     */
    function listItem(
        address _collection,
        uint256 _tokenId,
        uint256 _price,
        ListingType _listingType,
        uint256 _auctionDuration
    ) external nonReentrant whenNotPaused returns (uint256 listingId) {
        IERC721 nftContract = IERC721(_collection);
        require(nftContract.ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(nftContract.isApprovedForAll(msg.sender, address(this)) || 
                nftContract.getApproved(_tokenId) == address(this), "Contract not approved");
        require(_price > 0, "Price must be greater than 0");

        // Check if item is already listed
        uint256 existingListingId = tokenToListing[_collection][_tokenId];
        if (existingListingId != 0) {
            require(listings[existingListingId].status != ListingStatus.ACTIVE, "Item already listed");
        }

        listingId = _listingIdCounter;
        _listingIdCounter++;

        // Get royalty info if supported
        (bool hasRoyalty, uint256 royaltyAmount, address royaltyRecipient) = _getRoyaltyInfo(_collection, _tokenId, _price);

        // Set auction end time
        uint256 endTime = 0;
        if (_listingType == ListingType.AUCTION) {
            endTime = block.timestamp + (_auctionDuration > 0 ? _auctionDuration : defaultAuctionDuration);
        }

        // Create listing
        listings[listingId] = Listing({
            listingId: listingId,
            collection: _collection,
            tokenId: _tokenId,
            seller: payable(msg.sender),
            price: _price,
            listingType: _listingType,
            status: ListingStatus.ACTIVE,
            createdAt: block.timestamp,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            hasRoyalty: hasRoyalty,
            royaltyAmount: royaltyAmount,
            royaltyRecipient: royaltyRecipient
        });

        // Update mappings
        tokenToListing[_collection][_tokenId] = listingId;
        userListings[msg.sender].push(listingId);

        // Add collection if not tracked
        if (!supportedCollections[_collection]) {
            supportedCollections[_collection] = true;
            allCollections.push(_collection);
            collections[_collection] = CollectionInfo({
                isVerified: false,
                floorPrice: _price,
                totalVolume: 0,
                totalItems: 1,
                creator: msg.sender
            });
        } else {
            collections[_collection].totalItems++;
            if (_price < collections[_collection].floorPrice || collections[_collection].floorPrice == 0) {
                collections[_collection].floorPrice = _price;
            }
        }

        emit ItemListed(listingId, _collection, _tokenId, msg.sender, _price, _listingType == ListingType.AUCTION);
    }

    /**
     * @dev Buy an item with fixed price
     */
    function buyItem(uint256 _listingId) external payable nonReentrant validListing(_listingId) notSeller(_listingId) {
        Listing storage listing = listings[_listingId];
        require(listing.listingType == ListingType.FIXED_PRICE, "Item is auction only");
        require(msg.value >= listing.price, "Insufficient payment");

        _executeSale(_listingId, msg.sender, listing.price);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 _listingId) external payable nonReentrant validListing(_listingId) notSeller(_listingId) {
        Listing storage listing = listings[_listingId];
        require(listing.listingType == ListingType.AUCTION, "Item is not an auction");
        require(block.timestamp < listing.endTime, "Auction ended");
        
        uint256 minBid = listing.highestBid == 0 ? listing.price : 
                        listing.highestBid + (listing.highestBid * minimumBidIncrement / 10000);
        require(msg.value >= minBid, "Bid too low");

        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }

        // Update auction state
        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;
        auctionBids[_listingId][msg.sender] = msg.value;

        // Extend auction if bid placed in last 10 minutes
        if (listing.endTime - block.timestamp < auctionExtensionTime) {
            listing.endTime = block.timestamp + auctionExtensionTime;
            emit AuctionExtended(_listingId, listing.endTime);
        }

        emit BidPlaced(_listingId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Finalize auction (callable by anyone after auction ends)
     */
    function finalizeAuction(uint256 _listingId) external nonReentrant validListing(_listingId) {
        Listing storage listing = listings[_listingId];
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp >= listing.endTime, "Auction not ended");
        require(listing.highestBidder != address(0), "No bids placed");

        _executeSale(_listingId, listing.highestBidder, listing.highestBid);
    }

    /**
     * @dev Update listing price (fixed price only)
     */
    function updatePrice(uint256 _listingId, uint256 _newPrice) external validListing(_listingId) onlySeller(_listingId) {
        Listing storage listing = listings[_listingId];
        require(listing.listingType == ListingType.FIXED_PRICE, "Cannot update auction price");
        require(_newPrice > 0, "Price must be greater than 0");

        listing.price = _newPrice;
        
        // Update collection floor price if needed
        if (_newPrice < collections[listing.collection].floorPrice) {
            collections[listing.collection].floorPrice = _newPrice;
        }

        emit ItemUpdated(_listingId, _newPrice);
    }

    /**
     * @dev Cancel listing
     */
    function cancelListing(uint256 _listingId) external validListing(_listingId) onlySeller(_listingId) {
        Listing storage listing = listings[_listingId];
        
        // Refund highest bidder if auction
        if (listing.listingType == ListingType.AUCTION && listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }

        listing.status = ListingStatus.CANCELLED;
        tokenToListing[listing.collection][listing.tokenId] = 0;

        emit ItemCancelled(_listingId);
    }

    /**
     * @dev Emergency cancel by owner
     */
    function emergencyCancelListing(uint256 _listingId) external onlyOwner validListing(_listingId) {
        Listing storage listing = listings[_listingId];
        
        // Refund highest bidder if auction
        if (listing.listingType == ListingType.AUCTION && listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }

        listing.status = ListingStatus.CANCELLED;
        tokenToListing[listing.collection][listing.tokenId] = 0;

        emit ItemCancelled(_listingId);
    }

    /**
     * @dev Verify collection (admin function)
     */
    function verifyCollection(address _collection, bool _verified) external onlyOwner {
        collections[_collection].isVerified = _verified;
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
    function setFeeRecipient(address payable _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        feeRecipient = _recipient;
    }

    /**
     * @dev Set minimum bid increment percentage
     */
    function setMinimumBidIncrement(uint256 _percentage) external onlyOwner {
        require(_percentage >= 100 && _percentage <= 1000, "Between 1% and 10%");
        minimumBidIncrement = _percentage;
    }

    // Internal functions
    function _executeSale(uint256 _listingId, address _buyer, uint256 _salePrice) internal {
        Listing storage listing = listings[_listingId];
        
        // Calculate fees
        uint256 platformFee = (_salePrice * platformFeePercentage) / 10000;
        uint256 royaltyFee = 0;
        
        if (listing.hasRoyalty) {
            royaltyFee = listing.royaltyAmount;
        }
        
        uint256 sellerAmount = _salePrice - platformFee - royaltyFee;

        // Transfer NFT to buyer
        IERC721(listing.collection).safeTransferFrom(listing.seller, _buyer, listing.tokenId);

        // Distribute payments
        if (platformFee > 0) {
            feeRecipient.transfer(platformFee);
        }
        
        if (royaltyFee > 0) {
            payable(listing.royaltyRecipient).transfer(royaltyFee);
            emit RoyaltyPaid(listing.collection, listing.tokenId, listing.royaltyRecipient, royaltyFee);
        }
        
        listing.seller.transfer(sellerAmount);

        // Update listing status
        listing.status = ListingStatus.SOLD;
        tokenToListing[listing.collection][listing.tokenId] = 0;

        // Update collection stats
        collections[listing.collection].totalVolume += _salePrice;

        emit ItemSold(_listingId, listing.collection, listing.tokenId, listing.seller, _buyer, _salePrice);
    }

    function _getRoyaltyInfo(address _collection, uint256 _tokenId, uint256 _salePrice) 
        internal view returns (bool hasRoyalty, uint256 royaltyAmount, address royaltyRecipient) {
        
        // Check if contract supports EIP-2981 royalty standard
        if (IERC165(_collection).supportsInterface(type(IERC2981).interfaceId)) {
            try IERC2981(_collection).royaltyInfo(_tokenId, _salePrice) returns (
                address receiver,
                uint256 amount
            ) {
                if (receiver != address(0) && amount > 0 && amount <= _salePrice) {
                    return (true, amount, receiver);
                }
            } catch {}
        }
        
        return (false, 0, address(0));
    }

    // View functions
    function getListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }

    function getCollectionInfo(address _collection) external view returns (CollectionInfo memory) {
        return collections[_collection];
    }

    function getUserListings(address _user) external view returns (uint256[] memory) {
        return userListings[_user];
    }

    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    function getActiveListings(address _collection, uint256 _offset, uint256 _limit) 
        external view returns (Listing[] memory) {
        
        uint256 totalListings = _listingIdCounter;
        uint256 count = 0;
        
        // First pass: count active listings for this collection
        for (uint256 i = 0; i < totalListings; i++) {
            if (listings[i].status == ListingStatus.ACTIVE && 
                (_collection == address(0) || listings[i].collection == _collection)) {
                count++;
            }
        }
        
        // Apply pagination
        uint256 start = _offset;
        uint256 end = _offset + _limit;
        if (end > count) end = count;
        if (start >= count) return new Listing[](0);
        
        Listing[] memory result = new Listing[](end - start);
        uint256 resultIndex = 0;
        uint256 currentIndex = 0;
        
        // Second pass: collect listings within range
        for (uint256 i = 0; i < totalListings && resultIndex < result.length; i++) {
            if (listings[i].status == ListingStatus.ACTIVE && 
                (_collection == address(0) || listings[i].collection == _collection)) {
                
                if (currentIndex >= start) {
                    result[resultIndex] = listings[i];
                    resultIndex++;
                }
                currentIndex++;
            }
        }
        
        return result;
    }

    function isAuctionEnded(uint256 _listingId) external view returns (bool) {
        Listing storage listing = listings[_listingId];
        return listing.listingType == ListingType.AUCTION && block.timestamp >= listing.endTime;
    }

    function getMinimumBid(uint256 _listingId) external view returns (uint256) {
        Listing storage listing = listings[_listingId];
        if (listing.listingType != ListingType.AUCTION) return 0;
        
        return listing.highestBid == 0 ? listing.price : 
               listing.highestBid + (listing.highestBid * minimumBidIncrement / 10000);
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

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
} 