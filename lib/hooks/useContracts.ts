import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { Address, parseEther } from "viem";
import { getContractAddress } from "../wagmi";
import { useMemo } from "react";

// ABI definitions for deployed contracts
const LAUNCHPAD_ABI = [
  {
    inputs: [
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_description", type: "string" },
      { name: "_imageUri", type: "string" },
      { name: "_maxSupply", type: "uint256" },
      { name: "_autoProgress", type: "bool" },
    ],
    name: "createLaunch",
    outputs: [{ name: "launchId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_launchId", type: "uint256" }],
    name: "startLaunch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_launchId", type: "uint256" }],
    name: "getLaunchInfo",
    outputs: [
      { name: "collection", type: "address" },
      { name: "creator", type: "address" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "description", type: "string" },
      { name: "imageUri", type: "string" },
      { name: "maxSupply", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "autoProgress", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveLaunches",
    outputs: [{ name: "activeLaunches", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_creator", type: "address" }],
    name: "getCreatorLaunches",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    name: "completeLaunch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_launchId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelLaunch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_launchId", type: "uint256" }],
    outputs: [],
  },
] as const;

const MARKETPLACE_ABI = [
  {
    inputs: [
      { name: "_collection", type: "address" },
      { name: "_tokenId", type: "uint256" },
      { name: "_price", type: "uint256" },
      { name: "_listingType", type: "uint8" },
      { name: "_auctionDuration", type: "uint256" },
    ],
    name: "listItem",
    outputs: [{ name: "listingId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_listingId", type: "uint256" }],
    name: "buyItem",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "listings",
    outputs: [
      { name: "listingId", type: "uint256" },
      { name: "collection", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "listingType", type: "uint8" },
      { name: "status", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveListings",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const NFT_COLLECTION_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentPhase",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "collectionInfo",
    outputs: [
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
    stateMutability: "view",
    type: "function",
  },
  {
    name: "configurePhase",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_phase", type: "uint8" },
      { name: "_price", type: "uint256" },
      { name: "_startTime", type: "uint256" },
      { name: "_endTime", type: "uint256" },
      { name: "_maxPerWallet", type: "uint256" },
      { name: "_maxSupply", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "updateWhitelist",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_phase", type: "uint8" },
      { name: "_addresses", type: "address[]" },
      { name: "_status", type: "bool" },
    ],
    outputs: [],
  },
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
    name: "phaseConfigs",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint8" }],
    outputs: [
      { name: "price", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "maxPerWallet", type: "uint256" },
      { name: "maxSupply", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// =============================================
// 🚀 LAUNCHPAD CONTRACT HOOKS
// =============================================

export const useLaunchpadContract = () => {
  const { writeContractAsync } = useWriteContract();
  const launchpad = useMemo(() => getContractAddress("LAUNCHPAD"), []);

  const createLaunch = async (
    name: string,
    symbol: string,
    description: string,
    imageUri: string,
    maxSupply: number,
    autoProgress: boolean = true
  ): Promise<`0x${string}`> => {
    return await writeContractAsync({
      address: launchpad,
      abi: LAUNCHPAD_ABI,
      functionName: "createLaunch",
      args: [
        name,
        symbol,
        description,
        imageUri,
        BigInt(maxSupply),
        autoProgress,
      ],
    });
  };

  const startLaunch = async (launchId: number): Promise<`0x${string}`> => {
    return await writeContractAsync({
      address: launchpad,
      abi: LAUNCHPAD_ABI,
      functionName: "startLaunch",
      args: [BigInt(launchId)],
    });
  };

  return { address: launchpad, createLaunch, startLaunch };
};

// Read functions for Launchpad
export const useLaunchInfo = (launchId?: number) => {
  const launchpad = useMemo(() => getContractAddress("LAUNCHPAD"), []);

  return useReadContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: "getLaunchInfo",
    args: launchId !== undefined ? [BigInt(launchId)] : undefined,
    query: { enabled: launchId !== undefined },
  });
};

export const useActiveLaunches = () => {
  const launchpad = useMemo(() => getContractAddress("LAUNCHPAD"), []);

  const result = useReadContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: "getActiveLaunches",
  });

  // Debug logging
  console.log("🔍 useActiveLaunches result:", {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    launchpadAddress: launchpad,
  });

  return result;
};

export const useCreatorLaunches = (creator?: Address) => {
  const launchpad = useMemo(() => getContractAddress("LAUNCHPAD"), []);

  return useReadContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: "getCreatorLaunches",
    args: creator ? [creator] : undefined,
    query: { enabled: !!creator },
  });
};

// =============================================
// 🏪 MARKETPLACE CONTRACT HOOKS
// =============================================

export const useMarketplaceContract = () => {
  const { writeContractAsync } = useWriteContract();
  const marketplace = useMemo(() => getContractAddress("MARKETPLACE"), []);

  const listItem = async (
    collection: Address,
    tokenId: number,
    priceInEth: string,
    isAuction: boolean = false,
    auctionDuration: number = 86400 // 24 hours
  ): Promise<`0x${string}`> => {
    const priceWei = parseEther(priceInEth);
    const listingType = isAuction ? 1 : 0; // 0 = FIXED_PRICE, 1 = AUCTION

    return await writeContractAsync({
      address: marketplace,
      abi: MARKETPLACE_ABI,
      functionName: "listItem",
      args: [
        collection,
        BigInt(tokenId),
        priceWei,
        listingType,
        BigInt(auctionDuration),
      ],
    });
  };

  const buyItem = async (
    listingId: number,
    priceInEth: string
  ): Promise<`0x${string}`> => {
    const priceWei = parseEther(priceInEth);

    return await writeContractAsync({
      address: marketplace,
      abi: MARKETPLACE_ABI,
      functionName: "buyItem",
      args: [BigInt(listingId)],
      value: priceWei,
    });
  };

  return { address: marketplace, listItem, buyItem };
};

export const useListing = (listingId?: number) => {
  const marketplace = useMemo(() => getContractAddress("MARKETPLACE"), []);

  return useReadContract({
    address: marketplace,
    abi: MARKETPLACE_ABI,
    functionName: "listings",
    args: listingId !== undefined ? [BigInt(listingId)] : undefined,
    query: { enabled: listingId !== undefined },
  });
};

// Marketplace active listings
export const useActiveListings = (collection?: Address) => {
  const marketplace = useMemo(() => getContractAddress("MARKETPLACE"), []);

  return useReadContract({
    address: marketplace,
    abi: MARKETPLACE_ABI,
    functionName: "getActiveListings",
    query: { enabled: true },
  });
};

// Mock function for all listings - STABLE VERSION to prevent infinite loops
export const useAllListings = () => {
  // Use useMemo to create stable return object
  return useMemo(
    () => ({
      data: [] as never[], // Stable empty array
      isLoading: false,
      error: null,
      refetch: () => Promise.resolve(),
    }),
    []
  ); // Empty dependency array = never changes
};

// =============================================
// 🎨 NFT COLLECTION HOOKS
// =============================================

export const useNFTCollectionContract = () => {
  const { writeContractAsync } = useWriteContract();
  const nftCollection = useMemo(() => getContractAddress("NFT_COLLECTION"), []);

  const mint = async (
    to: Address,
    amount: number,
    pricePerToken: string = "0"
  ): Promise<`0x${string}`> => {
    const totalPrice = parseEther(
      (parseFloat(pricePerToken) * amount).toString()
    );

    return await writeContractAsync({
      address: nftCollection,
      abi: NFT_COLLECTION_ABI,
      functionName: "mint",
      args: [to, BigInt(amount)],
      value: totalPrice,
    });
  };

  return { address: nftCollection, mint };
};

export const useNFTBalance = (owner?: Address) => {
  const nftCollection = useMemo(() => getContractAddress("NFT_COLLECTION"), []);

  return useReadContract({
    address: nftCollection,
    abi: NFT_COLLECTION_ABI,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner },
  });
};

// 📊 COLLECTION STATS
export const useCollectionStats = (collectionAddress?: Address) => {
  const nftCollection =
    collectionAddress || getContractAddress("NFT_COLLECTION");

  const totalSupply = useReadContract({
    address: nftCollection,
    abi: NFT_COLLECTION_ABI,
    functionName: "totalSupply",
    query: {
      enabled: !!nftCollection,
      refetchInterval: 5000, // Auto-refresh every 5 seconds
    },
  });

  const maxSupply = useReadContract({
    address: nftCollection,
    abi: NFT_COLLECTION_ABI,
    functionName: "maxSupply",
    query: {
      enabled: !!nftCollection,
      refetchInterval: 5000,
    },
  });

  const currentPhase = useReadContract({
    address: nftCollection,
    abi: NFT_COLLECTION_ABI,
    functionName: "getCurrentPhase",
    query: {
      enabled: !!nftCollection,
      refetchInterval: 5000,
    },
  });

  // Additional collection info
  const collectionInfo = useReadContract({
    address: nftCollection,
    abi: NFT_COLLECTION_ABI,
    functionName: "collectionInfo",
    query: {
      enabled: !!nftCollection,
      refetchInterval: 10000,
    },
  });

  return { totalSupply, maxSupply, currentPhase, collectionInfo };
};

// 🔧 PHASE MANAGEMENT
export const usePhaseManagement = (collectionAddress?: Address) => {
  const { writeContractAsync } = useWriteContract();

  const configurePhase = async (
    phase: number,
    price: string,
    startTime: number,
    endTime: number,
    maxPerWallet: number,
    maxSupply: number
  ) => {
    if (!collectionAddress) throw new Error("Collection address required");

    const hash = await writeContractAsync({
      address: collectionAddress,
      abi: NFT_COLLECTION_ABI,
      functionName: "configurePhase",
      args: [
        phase,
        parseEther(price),
        BigInt(startTime),
        BigInt(endTime),
        BigInt(maxPerWallet),
        BigInt(maxSupply),
      ],
    });

    return hash;
  };

  const updateWhitelist = async (
    phase: number,
    addresses: Address[],
    status: boolean
  ) => {
    if (!collectionAddress) throw new Error("Collection address required");

    const hash = await writeContractAsync({
      address: collectionAddress,
      abi: NFT_COLLECTION_ABI,
      functionName: "updateWhitelist",
      args: [phase, addresses, status],
    });

    return hash;
  };

  const mintWithPhase = async (
    to: Address,
    phase: number,
    tokenURI: string,
    price: string
  ) => {
    if (!collectionAddress) throw new Error("Collection address required");

    const hash = await writeContractAsync({
      address: collectionAddress,
      abi: NFT_COLLECTION_ABI,
      functionName: "mintNFT",
      args: [to, phase, tokenURI],
      value: parseEther(price),
    });

    return hash;
  };

  return { configurePhase, updateWhitelist, mintWithPhase };
};

// 📊 PHASE INFO READING
export const usePhaseConfig = (collectionAddress?: Address, phase?: number) => {
  return useReadContract({
    address: collectionAddress,
    abi: NFT_COLLECTION_ABI,
    functionName: "phaseConfigs",
    args: phase !== undefined ? [phase] : undefined,
    query: {
      enabled: !!collectionAddress && phase !== undefined,
    },
  });
};

// 🚀 ENHANCED LAUNCH OPERATIONS
export const useLaunchOperations = () => {
  const { writeContractAsync } = useWriteContract();

  const completeLaunch = async (launchId: number) => {
    const hash = await writeContractAsync({
      address: getContractAddress("LAUNCHPAD"),
      abi: LAUNCHPAD_ABI,
      functionName: "completeLaunch",
      args: [BigInt(launchId)],
    });

    return hash;
  };

  const cancelLaunch = async (launchId: number) => {
    const hash = await writeContractAsync({
      address: getContractAddress("LAUNCHPAD"),
      abi: LAUNCHPAD_ABI,
      functionName: "cancelLaunch",
      args: [BigInt(launchId)],
    });

    return hash;
  };

  return { completeLaunch, cancelLaunch };
};

// 📋 USER'S LAUNCHES
export const useUserLaunches = (userAddress?: Address) => {
  return useReadContract({
    address: getContractAddress("LAUNCHPAD"),
    abi: LAUNCHPAD_ABI,
    functionName: "getCreatorLaunches",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
};

// =============================================
// 🔧 HELPER HOOKS
// =============================================

export const useContractAddresses = () => {
  return useMemo(
    () => ({
      launchpad: getContractAddress("LAUNCHPAD"),
      marketplace: getContractAddress("MARKETPLACE"),
      paymentHandler: getContractAddress("PAYMENT_HANDLER"),
      nftCollection: getContractAddress("NFT_COLLECTION"),
    }),
    []
  );
};
