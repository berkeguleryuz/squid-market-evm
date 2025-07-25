"use client";

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Address } from 'viem';
import { getContractAddress } from '@/lib/wagmi';
import { NFT_COLLECTION_ABI } from '@/lib/contracts';

export interface BlockchainNFT {
  tokenId: bigint;
  collection: Address;
  collectionName: string;
  owner: Address;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  tokenURI: string;
  isVerified: boolean;
  isListed: boolean;
  listingPrice?: string;
  listingId?: bigint;
}

export function useBlockchainNFTs() {
  const [allNFTs, setAllNFTs] = useState<BlockchainNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get known contract addresses to scan (will be populated dynamically)
  const [knownCollections, setKnownCollections] = useState<Address[]>([]);
  
  // Fetch launchpad collections dynamically
  useEffect(() => {
    const fetchLaunchpadCollections = async () => {
      try {
        const response = await fetch('/api/launchpools');
        const result = await response.json();
        
        if (result.success) {
          const launchpadAddresses = result.data.map((launch: any) => launch.contractAddress as Address);
          const mainCollection = getContractAddress("NFT_COLLECTION");
          
          // Combine main collection with launchpad collections
          const allCollections = [mainCollection, ...launchpadAddresses];
          setKnownCollections(allCollections);
          
          console.log('🔍 Known collections to scan:', allCollections.length, allCollections);
        }
      } catch (error) {
        console.error('Error fetching launchpad collections:', error);
        // Fallback to main collection only
        setKnownCollections([getContractAddress("NFT_COLLECTION")]);
      }
    };
    
    fetchLaunchpadCollections();
  }, []);

  useEffect(() => {
    if (knownCollections.length > 0) {
      scanAllNFTs();
    }
  }, [knownCollections]);

  const scanAllNFTs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allTokens: BlockchainNFT[] = [];

      // Scan each known collection
      for (const collectionAddress of knownCollections) {
        try {
          const collectionTokens = await scanCollection(collectionAddress);
          allTokens.push(...collectionTokens);
        } catch (error) {
          console.error(`Error scanning collection ${collectionAddress}:`, error);
        }
      }

      // Sort by verification status and then by token ID
      const sortedTokens = allTokens.sort((a, b) => {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return Number(a.tokenId) - Number(b.tokenId);
      });

      setAllNFTs(sortedTokens);

    } catch (error) {
      console.error('Error scanning blockchain NFTs:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan blockchain NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  const scanCollection = async (collectionAddress: Address): Promise<BlockchainNFT[]> => {
    const tokens: BlockchainNFT[] = [];

    try {
      // Get collection info
      const response = await fetch(`/api/blockchain/scan-collection/${collectionAddress}`);
      if (!response.ok) {
        throw new Error(`Failed to scan collection ${collectionAddress}`);
      }

      const data = await response.json();
      return data.tokens || [];

    } catch (error) {
      console.error(`Error scanning collection ${collectionAddress}:`, error);
      return [];
    }
  };

  const refetch = () => {
    scanAllNFTs();
  };

  return {
    allNFTs,
    isLoading,
    error,
    refetch,
  };
}

// Hook for getting user's NFTs from blockchain
export function useUserBlockchainNFTs() {
  const { address: userAddress } = useAccount();
  const { allNFTs, isLoading, error, refetch } = useBlockchainNFTs();

  const userNFTs = allNFTs.filter(nft => 
    userAddress && nft.owner.toLowerCase() === userAddress.toLowerCase()
  );

  return {
    userNFTs,
    isLoading,
    error,
    refetch,
  };
}

// Hook for getting marketplace NFTs (all NFTs that are not owned by their original minter)
export function useMarketplaceBlockchainNFTs() {
  const { allNFTs, isLoading, error, refetch } = useBlockchainNFTs();

  // Filter for NFTs that could potentially be on marketplace
  // (This is a simplified approach - in reality you'd check marketplace contract)
  const marketplaceNFTs = allNFTs.filter(nft => {
    // For now, show all NFTs as potentially available
    // In a real marketplace, you'd check if they're actually listed
    return true;
  });

  return {
    marketplaceNFTs,
    isLoading,
    error,
    refetch,
  };
}
