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
        internalType: "uint8",
        name: "fromPhase",
        type: "uint8",
      },
      { indexed: false, internalType: "uint8", name: "toPhase", type: "uint8" },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "LaunchPhaseChanged",
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
      { indexed: false, internalType: "uint8", name: "phase", type: "uint8" },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "LaunchStarted",
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
        internalType: "uint256",
        name: "launchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      { indexed: false, internalType: "uint8", name: "phase", type: "uint8" },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "NFTPurchased",
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
        internalType: "uint256",
        name: "launchId",
        type: "uint256",
      },
      { indexed: false, internalType: "uint8", name: "phase", type: "uint8" },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxPerWallet",
        type: "uint256",
      },
    ],
    name: "PhaseConfigured",
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
        internalType: "uint8",
        name: "phase",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isWhitelisted",
        type: "bool",
      },
    ],
    name: "WhitelistUpdated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_launchId", type: "uint256" },
      { internalType: "uint8", name: "_phase", type: "uint8" },
      { internalType: "address[]", name: "_addresses", type: "address[]" },
    ],
    name: "addToWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
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
      { internalType: "uint256", name: "_launchId", type: "uint256" },
      { internalType: "uint8", name: "_phase", type: "uint8" },
      { internalType: "uint256", name: "_price", type: "uint256" },
      { internalType: "uint256", name: "_startTime", type: "uint256" },
      { internalType: "uint256", name: "_endTime", type: "uint256" },
      { internalType: "uint256", name: "_maxPerWallet", type: "uint256" },
    ],
    name: "configurePhase",
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
    name: "getCurrentPhase",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
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
          { internalType: "uint8", name: "currentPhase", type: "uint8" },
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
    inputs: [
      { internalType: "uint256", name: "_launchId", type: "uint256" },
      { internalType: "uint8", name: "_phase", type: "uint8" },
    ],
    name: "getPhaseConfig",
    outputs: [
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "uint256", name: "maxPerWallet", type: "uint256" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" },
      { internalType: "uint256", name: "totalSold", type: "uint256" },
      { internalType: "bool", name: "isConfigured", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_launchId", type: "uint256" },
      { internalType: "uint8", name: "_phase", type: "uint8" },
      { internalType: "address", name: "_address", type: "address" },
    ],
    name: "isWhitelisted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
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
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint8", name: "", type: "uint8" },
    ],
    name: "launchPhases",
    outputs: [
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "uint256", name: "maxPerWallet", type: "uint256" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" },
      { internalType: "uint256", name: "totalSold", type: "uint256" },
      { internalType: "bool", name: "isConfigured", type: "bool" },
    ],
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
      { internalType: "uint8", name: "currentPhase", type: "uint8" },
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
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "purchaseCounts",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_launchId", type: "uint256" },
      { internalType: "uint8", name: "_phase", type: "uint8" },
      { internalType: "address[]", name: "_addresses", type: "address[]" },
    ],
    name: "removeFromWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
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
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint8", name: "", type: "uint8" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "whitelists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const MARKETPLACE_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_feeRecipient",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
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
        internalType: "uint8",
        name: "fromPhase",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "toPhase",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "LaunchPhaseChanged",
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
        internalType: "uint8",
        name: "phase",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "LaunchStarted",
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
        internalType: "uint256",
        name: "launchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
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
        internalType: "uint8",
        name: "phase",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "NFTPurchased",
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
        internalType: "uint256",
        name: "launchId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "phase",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxPerWallet",
        type: "uint256",
      },
    ],
    name: "PhaseConfigured",
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
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "_phase",
        type: "uint8",
      },
      {
        internalType: "address[]",
        name: "_addresses",
        type: "address[]",
      },
    ],
    name: "addToWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
    ],
    name: "cancelLaunch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
    ],
    name: "completeLaunch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "_phase",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_startTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_endTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxPerWallet",
        type: "uint256",
      },
    ],
    name: "configurePhase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "string",
        name: "_description",
        type: "string",
      },
      {
        internalType: "string",
        name: "_imageUri",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_maxSupply",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_autoProgress",
        type: "bool",
      },
    ],
    name: "createLaunch",
    outputs: [
      {
        internalType: "uint256",
        name: "launchId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "creatorLaunches",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveLaunches",
    outputs: [
      {
        internalType: "uint256[]",
        name: "activeLaunches",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_creator",
        type: "address",
      },
    ],
    name: "getCreatorLaunches",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
    ],
    name: "getCurrentPhase",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
    ],
    name: "getLaunchInfo",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "collection",
            type: "address",
          },
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "symbol",
            type: "string",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "string",
            name: "imageUri",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "maxSupply",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256",
          },
          {
            internalType: "enum LaunchpadCore.LaunchStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "autoProgress",
            type: "bool",
          },
          {
            internalType: "uint8",
            name: "currentPhase",
            type: "uint8",
          },
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
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "_phase",
        type: "uint8",
      },
    ],
    name: "getPhaseConfig",
    outputs: [
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "startTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "endTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxPerWallet",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalSold",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isConfigured",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "_phase",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "isWhitelisted",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "launchCounter",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    name: "launchPhases",
    outputs: [
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "startTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "endTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxPerWallet",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalSold",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isConfigured",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "launches",
    outputs: [
      {
        internalType: "address",
        name: "collection",
        type: "address",
      },
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "string",
        name: "imageUri",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "maxSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "startTime",
        type: "uint256",
      },
      {
        internalType: "enum LaunchpadCore.LaunchStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "autoProgress",
        type: "bool",
      },
      {
        internalType: "uint8",
        name: "currentPhase",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
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
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeePercentage",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "purchaseCounts",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "_phase",
        type: "uint8",
      },
      {
        internalType: "address[]",
        name: "_addresses",
        type: "address[]",
      },
    ],
    name: "removeFromWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [
      {
        internalType: "uint256",
        name: "_fee",
        type: "uint256",
      },
    ],
    name: "setPlatformFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_launchId",
        type: "uint256",
      },
    ],
    name: "startLaunch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
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
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "whitelists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
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
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
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
