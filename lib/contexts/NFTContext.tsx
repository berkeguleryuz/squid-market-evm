"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { 
  useAllListings,
  useActiveLaunches, 
  useLaunchInfo 
} from '@/lib/hooks/useContracts';

// Types
export interface NFT {
  id: string;
  tokenId: number;
  name: string;
  description: string;
  image: string;
  collection: Address;
  owner: Address;
  price?: string;
  isListed?: boolean;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Launch {
  id: string;
  collection: Address;
  creator: Address;
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  maxSupply: number;
  startTime: number;
  status: number;
  autoProgress: boolean;
}

interface NFTContextType {
  // NFTs
  allNFTs: NFT[];
  userNFTs: NFT[];
  isLoadingNFTs: boolean;
  
  // Launches
  activeLaunches: Launch[];
  currentLaunch: Launch | null;
  isLoadingLaunches: boolean;
  
  // Actions
  refreshNFTs: () => void;
  refreshLaunches: () => void;
  setCurrentLaunchId: (id: string) => void;
}

const NFTContext = createContext<NFTContextType | undefined>(undefined);

interface NFTProviderProps {
  children: ReactNode;
}

export function NFTProvider({ children }: NFTProviderProps) {
  const { address: userAddress } = useAccount();
  
  // State
  const [allNFTs, setAllNFTs] = useState<NFT[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [activeLaunches, setActiveLaunches] = useState<Launch[]>([]);
  const [currentLaunch, setCurrentLaunch] = useState<Launch | null>(null);
  const [currentLaunchId, setCurrentLaunchId] = useState<string>('1');

  // Contract hooks
  const { 
    data: listingsData, 
    isLoading: isLoadingListings,
    refetch: refetchListingsQuery 
  } = useAllListings();
  
  // Mock current launch ID for now
  const currentLaunchIdBigInt = BigInt(1);
  
  const {
    data: launchesData,
    isLoading: isLoadingLaunches,
    refetch: refetchLaunches
  } = useActiveLaunches();

  const {
    data: currentLaunchData,
    refetch: refetchCurrentLaunch
  } = useLaunchInfo(Number(currentLaunchId));

  // Transform contract data to our types - use useMemo to prevent unnecessary re-renders
  const processedListings = React.useMemo(() => {
    if (!listingsData || !Array.isArray(listingsData)) return [];
    
    return listingsData.map((listing: unknown, index: number): NFT => {
      // Since listingsData is empty array for now, create mock structure
      return {
        id: `listing-${index}`,
        tokenId: index,
        name: `NFT #${index}`,
        description: 'Mock NFT for testing',
        image: '/squid1.jpg',
        collection: '0x0000000000000000000000000000000000000000' as Address,
        owner: '0x0000000000000000000000000000000000000000' as Address,
        price: '0.1',
        isListed: true,
        attributes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  }, [listingsData]);

  const processedLaunches = React.useMemo(() => {
    if (!launchesData || !Array.isArray(launchesData)) return [];
    
    return launchesData.map((launchId: bigint): Launch => ({
      id: launchId.toString(),
      collection: '0x0000000000000000000000000000000000000000' as Address,
      creator: '0x0000000000000000000000000000000000000000' as Address,
      name: `Launch ${launchId.toString()}`,
      symbol: 'TEST',
      description: 'Test launch',
      imageUri: '/squid1.jpg',
      maxSupply: 1000,
      startTime: Date.now(),
      status: 1,
      autoProgress: true,
    }));
  }, [launchesData]);

  // Update all NFTs when listings change - FIXED: use processedListings instead of raw data
  useEffect(() => {
    if (processedListings.length >= 0) { // Allow empty arrays
      setAllNFTs(processedListings);
    }
  }, [processedListings]); // Now depends on memoized value

  // Filter user NFTs
  useEffect(() => {
    if (userAddress && allNFTs.length > 0) {
      const filtered = allNFTs.filter(
        (nft) => nft.owner.toLowerCase() === userAddress.toLowerCase(),
      );
      setUserNFTs(filtered);
    } else {
      setUserNFTs([]);
    }
  }, [userAddress, allNFTs]);

  // Update launches
  useEffect(() => {
    if (processedLaunches.length >= 0) { // Allow empty arrays
      setActiveLaunches(processedLaunches);
    }
  }, [processedLaunches]); // Now depends on memoized value

  // Update current launch
  useEffect(() => {
    if (currentLaunchData && Array.isArray(currentLaunchData) && currentLaunchData.length >= 10) {
      const [collection, creator, name, symbol, description, imageUri, maxSupply, startTime, status, autoProgress] = currentLaunchData;
      
      setCurrentLaunch({
        id: currentLaunchId,
        collection: collection as Address,
        creator: creator as Address,
        name: name as string,
        symbol: symbol as string,
        description: description as string,
        imageUri: imageUri as string,
        maxSupply: Number(maxSupply),
        startTime: Number(startTime),
        status: Number(status),
        autoProgress: autoProgress as boolean,
      });
    }
  }, [currentLaunchData, currentLaunchId]);

  // Actions
  const refreshNFTs = () => {
    refetchListingsQuery();
  };

  const refreshLaunches = () => {
    refetchLaunches();
    refetchCurrentLaunch();
  };

  const contextValue: NFTContextType = {
    // NFTs
    allNFTs,
    userNFTs,
    isLoadingNFTs: isLoadingListings,
    
    // Launches
    activeLaunches,
    currentLaunch,
    isLoadingLaunches,
    
    // Actions
    refreshNFTs,
    refreshLaunches,
    setCurrentLaunchId,
  };

  return (
    <NFTContext.Provider value={contextValue}>
      {children}
    </NFTContext.Provider>
  );
}

export function useNFT() {
  const context = useContext(NFTContext);
  if (context === undefined) {
    throw new Error('useNFT must be used within an NFTProvider');
  }
  return context;
}
