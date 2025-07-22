import { Address } from "viem";

// Contract ABIs (simplified versions for frontend use)
export const LAUNCHPAD_ABI = [
  // Launch creation
  {
    name: "createLaunch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_description", type: "string" },
      { name: "_image", type: "string" },
      { name: "_maxSupply", type: "uint256" },
      { name: "_autoProgressPhases", type: "bool" },
    ],
    outputs: [
      { name: "launchId", type: "uint256" },
      { name: "collection", type: "address" },
    ],
  },
  // Phase configuration
  {
    name: "configureLaunchPhase",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_launchId", type: "uint256" },
      { name: "_phase", type: "uint8" },
      { name: "_price", type: "uint256" },
      { name: "_startTime", type: "uint256" },
      { name: "_endTime", type: "uint256" },
      { name: "_maxPerWallet", type: "uint256" },
      { name: "_maxSupply", type: "uint256" },
    ],
    outputs: [],
  },
  // Purchase NFT
  {
    name: "purchaseNFT",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_launchId", type: "uint256" },
      { name: "_tokenURI", type: "string" },
    ],
    outputs: [],
  },
  // View functions
  {
    name: "getLaunchInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_launchId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "collection", type: "address" },
          { name: "creator", type: "address" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "totalRaised", type: "uint256" },
          { name: "currentPhase", type: "uint8" },
          { name: "autoProgressPhases", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getCurrentLaunchId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const MARKETPLACE_ABI = [
  // List item
  {
    name: "listItem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_collection", type: "address" },
      { name: "_tokenId", type: "uint256" },
      { name: "_price", type: "uint256" },
      { name: "_listingType", type: "uint8" },
      { name: "_auctionDuration", type: "uint256" },
    ],
    outputs: [{ name: "listingId", type: "uint256" }],
  },
  // Buy item
  {
    name: "buyItem",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_listingId", type: "uint256" }],
    outputs: [],
  },
  // Place bid
  {
    name: "placeBid",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_listingId", type: "uint256" }],
    outputs: [],
  },
  // View functions
  {
    name: "getListing",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_listingId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "listingId", type: "uint256" },
          { name: "collection", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "price", type: "uint256" },
          { name: "listingType", type: "uint8" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "highestBidder", type: "address" },
          { name: "highestBid", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getActiveListings",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_collection", type: "address" },
      { name: "_offset", type: "uint256" },
      { name: "_limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "listingId", type: "uint256" },
          { name: "collection", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "price", type: "uint256" },
          { name: "listingType", type: "uint8" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
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
  type: "launch" | "listing",
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
