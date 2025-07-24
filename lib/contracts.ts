import { Address } from "viem";

// Contract ABIs (simplified versions for frontend use)
export const LAUNCHPAD_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_feeRecipient", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "EnforcedPause", type: "error" },
  { inputs: [], name: "ExpectedPause", type: "error" },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "launchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "collection",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
    ],
    name: "LaunchCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "launchId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum LaunchpadCore.LaunchStatus",
        name: "newStatus",
        type: "uint8",
      },
    ],
    name: "LaunchStatusChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "_launchId", type: "uint256" }],
    name: "cancelLaunch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_launchId", type: "uint256" }],
    name: "completeLaunch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "string", name: "_symbol", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "string", name: "_imageUri", type: "string" },
      { internalType: "uint256", name: "_maxSupply", type: "uint256" },
      { internalType: "bool", name: "_autoProgress", type: "bool" },
    ],
    name: "createLaunch",
    outputs: [{ internalType: "uint256", name: "launchId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "creatorLaunches",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [{ internalType: "address payable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveLaunches",
    outputs: [
      { internalType: "uint256[]", name: "activeLaunches", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_creator", type: "address" }],
    name: "getCreatorLaunches",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_launchId", type: "uint256" }],
    name: "getLaunchInfo",
    outputs: [
      {
        components: [
          { internalType: "address", name: "collection", type: "address" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "symbol", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "imageUri", type: "string" },
          { internalType: "uint256", name: "maxSupply", type: "uint256" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          {
            internalType: "enum LaunchpadCore.LaunchStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "bool", name: "autoProgress", type: "bool" },
        ],
        internalType: "struct LaunchpadCore.LaunchInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "launchCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "launches",
    outputs: [
      { internalType: "address", name: "collection", type: "address" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "imageUri", type: "string" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      {
        internalType: "enum LaunchpadCore.LaunchStatus",
        name: "status",
        type: "uint8",
      },
      { internalType: "bool", name: "autoProgress", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeePercentage",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "_feeRecipient",
        type: "address",
      },
    ],
    name: "setFeeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_fee", type: "uint256" }],
    name: "setPlatformFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_launchId", type: "uint256" }],
    name: "startLaunch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const MARKETPLACE_ABI = [
  {
    inputs: [
      {
        internalType: "address payable",
        name: "_feeRecipient",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "EnforcedPause", type: "error" },
  { inputs: [], name: "ExpectedPause", type: "error" },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newEndTime",
        type: "uint256",
      },
    ],
    name: "AuctionExtended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "bidder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "BidPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
    ],
    name: "ItemCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "collection",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      { indexed: false, internalType: "bool", name: "isAuction", type: "bool" },
    ],
    name: "ItemListed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "collection",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "ItemSold",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newPrice",
        type: "uint256",
      },
    ],
    name: "ItemUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "collection",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "RoyaltyPaid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "allCollections",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "auctionBids",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auctionExtensionTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_listingId", type: "uint256" }],
    name: "buyItem",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_listingId", type: "uint256" }],
    name: "cancelListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "collections",
    outputs: [
      { internalType: "bool", name: "isVerified", type: "bool" },
      { internalType: "uint256", name: "floorPrice", type: "uint256" },
      { internalType: "uint256", name: "totalVolume", type: "uint256" },
      { internalType: "uint256", name: "totalItems", type: "uint256" },
      { internalType: "address", name: "creator", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "defaultAuctionDuration",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_listingId", type: "uint256" }],
    name: "emergencyCancelListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [{ internalType: "address payable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_listingId", type: "uint256" }],
    name: "finalizeAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collection", type: "address" },
      { internalType: "uint256", name: "_offset", type: "uint256" },
      { internalType: "uint256", name: "_limit", type: "uint256" },
    ],
    name: "getActiveListings",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "listingId", type: "uint256" },
          { internalType: "address", name: "collection", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "address payable", name: "seller", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          {
            internalType: "enum Marketplace.ListingType",
            name: "listingType",
            type: "uint8",
          },
          {
            internalType: "enum Marketplace.ListingStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "address", name: "highestBidder", type: "address" },
          { internalType: "uint256", name: "highestBid", type: "uint256" },
          { internalType: "bool", name: "hasRoyalty", type: "bool" },
          { internalType: "uint256", name: "royaltyAmount", type: "uint256" },
          {
            internalType: "address",
            name: "royaltyRecipient",
            type: "address",
          },
        ],
        internalType: "struct Marketplace.Listing[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllCollections",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_collection", type: "address" }],
    name: "getCollectionInfo",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "isVerified", type: "bool" },
          { internalType: "uint256", name: "floorPrice", type: "uint256" },
          { internalType: "uint256", name: "totalVolume", type: "uint256" },
          { internalType: "uint256", name: "totalItems", type: "uint256" },
          { internalType: "address", name: "creator", type: "address" },
        ],
        internalType: "struct Marketplace.CollectionInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_listingId", type: "uint256" }],
    name: "getListing",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "listingId", type: "uint256" },
          { internalType: "address", name: "collection", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "address payable", name: "seller", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          {
            internalType: "enum Marketplace.ListingType",
            name: "listingType",
            type: "uint8",
          },
          {
            internalType: "enum Marketplace.ListingStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "address", name: "highestBidder", type: "address" },
          { internalType: "uint256", name: "highestBid", type: "uint256" },
          { internalType: "bool", name: "hasRoyalty", type: "bool" },
          { internalType: "uint256", name: "royaltyAmount", type: "uint256" },
          {
            internalType: "address",
            name: "royaltyRecipient",
            type: "address",
          },
        ],
        internalType: "struct Marketplace.Listing",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_listingId", type: "uint256" }],
    name: "getMinimumBid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getUserListings",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_listingId", type: "uint256" }],
    name: "isAuctionEnded",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collection", type: "address" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "uint256", name: "_price", type: "uint256" },
      {
        internalType: "enum Marketplace.ListingType",
        name: "_listingType",
        type: "uint8",
      },
      { internalType: "uint256", name: "_auctionDuration", type: "uint256" },
    ],
    name: "listItem",
    outputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "listings",
    outputs: [
      { internalType: "uint256", name: "listingId", type: "uint256" },
      { internalType: "address", name: "collection", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "address payable", name: "seller", type: "address" },
      { internalType: "uint256", name: "price", type: "uint256" },
      {
        internalType: "enum Marketplace.ListingType",
        name: "listingType",
        type: "uint8",
      },
      {
        internalType: "enum Marketplace.ListingStatus",
        name: "status",
        type: "uint8",
      },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "address", name: "highestBidder", type: "address" },
      { internalType: "uint256", name: "highestBid", type: "uint256" },
      { internalType: "bool", name: "hasRoyalty", type: "bool" },
      { internalType: "uint256", name: "royaltyAmount", type: "uint256" },
      { internalType: "address", name: "royaltyRecipient", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minimumBidIncrement",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "onERC721Received",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_listingId", type: "uint256" }],
    name: "placeBid",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeePercentage",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address payable", name: "_recipient", type: "address" },
    ],
    name: "setFeeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_percentage", type: "uint256" }],
    name: "setMinimumBidIncrement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_percentage", type: "uint256" }],
    name: "setPlatformFeePercentage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "supportedCollections",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "tokenToListing",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_listingId", type: "uint256" },
      { internalType: "uint256", name: "_newPrice", type: "uint256" },
    ],
    name: "updatePrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "userListings",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collection", type: "address" },
      { internalType: "bool", name: "_verified", type: "bool" },
    ],
    name: "verifyCollection",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const NFT_COLLECTION_ABI = [
  // Standard ERC721 functions
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "setApprovalForAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  // Custom functions
  {
    name: "mintNFT",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_to", type: "address" },
      { name: "_phase", type: "uint8" },
      { name: "_tokenURI", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getCollectionInfo",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "description", type: "string" },
          { name: "image", type: "string" },
          { name: "creator", type: "address" },
          { name: "maxSupply", type: "uint256" },
          { name: "currentSupply", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
  },
] as const;

// Contract addresses type
export interface ContractAddresses {
  LAUNCHPAD: Address;
  MARKETPLACE: Address;
  PAYMENT_HANDLER: Address;
}

// Type definitions
export interface LaunchInfo {
  collection: Address;
  creator: Address;
  name: string;
  description: string;
  status: number;
  createdAt: bigint;
  totalRaised: bigint;
  currentPhase: number;
  autoProgressPhases: boolean;
}

export interface Listing {
  listingId: bigint;
  collection: Address;
  tokenId: bigint;
  seller: Address;
  price: bigint;
  listingType: number;
  status: number;
  createdAt: bigint;
  endTime: bigint;
  highestBidder: Address;
  highestBid: bigint;
}

export interface CollectionInfo {
  name: string;
  symbol: string;
  description: string;
  image: string;
  creator: Address;
  maxSupply: bigint;
  currentSupply: bigint;
  status: number;
  createdAt: bigint;
}

// Enums
export enum LaunchStatus {
  PENDING = 0,
  ACTIVE = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

export enum Phase {
  NONE = 0,
  PRESALE = 1,
  WHITELIST = 2,
  PUBLIC = 3,
}

export enum ListingStatus {
  ACTIVE = 0,
  SOLD = 1,
  CANCELLED = 2,
}

export enum ListingType {
  FIXED_PRICE = 0,
  AUCTION = 1,
}

// Helper functions
export const formatPrice = (price: bigint): string => {
  return (Number(price) / 1e18).toFixed(4);
};

export const parsePrice = (price: string): bigint => {
  return BigInt(Math.floor(parseFloat(price) * 1e18));
};

export const getStatusText = (
  status: number,
  type: "launch" | "listing"
): string => {
  if (type === "launch") {
    switch (status) {
      case LaunchStatus.PENDING:
        return "Pending";
      case LaunchStatus.ACTIVE:
        return "Active";
      case LaunchStatus.COMPLETED:
        return "Completed";
      case LaunchStatus.CANCELLED:
        return "Cancelled";
      default:
        return "Unknown";
    }
  } else {
    switch (status) {
      case ListingStatus.ACTIVE:
        return "Active";
      case ListingStatus.SOLD:
        return "Sold";
      case ListingStatus.CANCELLED:
        return "Cancelled";
      default:
        return "Unknown";
    }
  }
};

export const getPhaseText = (phase: number): string => {
  switch (phase) {
    case Phase.PRESALE:
      return "Presale";
    case Phase.WHITELIST:
      return "Whitelist";
    case Phase.PUBLIC:
      return "Public Sale";
    default:
      return "Not Started";
  }
};
