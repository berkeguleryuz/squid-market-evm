"use client";

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Address } from 'viem';
import { getContractAddress } from '@/lib/wagmi';
import { NFT_COLLECTION_ABI } from '@/lib/contracts';

export interface UserNFT {
  tokenId: bigint;
  collection: Address;
  collectionName: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  isListed: boolean;
  listingId?: bigint;
  price?: string; // in ETH
  acquiredAt?: Date;
  metadataUri?: string;
}

export function useUserNFTs() {
  const { address: userAddress } = useAccount();
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get NFT Collection contract for querying
  const nftCollectionAddress = getContractAddress("NFT_COLLECTION");

  // Get user's NFT balance
  const { data: balance } = useReadContract({
    address: nftCollectionAddress,
    abi: NFT_COLLECTION_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress),
    },
  });

  useEffect(() => {
    if (userAddress && balance) {
      fetchUserNFTs();
    } else {
      setUserNFTs([]);
    }
  }, [userAddress, balance]);

  const fetchUserNFTs = async () => {
    if (!userAddress || !balance) return;

    setIsLoading(true);
    setError(null);

    try {
      const nfts: UserNFT[] = [];
      const balanceNumber = Number(balance);

      // Get all NFTs from our collection that user owns
      for (let i = 0; i < balanceNumber; i++) {
        try {
          // Get token ID by index
          const tokenId = await getTokenByIndex(userAddress, i);
          if (tokenId !== null) {
            const nftData = await fetchNFTMetadata(tokenId);
            if (nftData) {
              nfts.push(nftData);
            }
          }
        } catch (error) {
          console.error(`Error fetching NFT at index ${i}:`, error);
        }
      }

      // Also check for NFTs from database (minted through our launchpad)
      try {
        const dbNFTs = await fetchUserNFTsFromDB(userAddress);
        // Merge with contract NFTs, avoiding duplicates
        const allNFTs = [...nfts];
        dbNFTs.forEach(dbNFT => {
          if (!allNFTs.some(nft => nft.tokenId === dbNFT.tokenId && nft.collection === dbNFT.collection)) {
            allNFTs.push(dbNFT);
          }
        });
        setUserNFTs(allNFTs);
      } catch (dbError) {
        console.error('Error fetching NFTs from database:', dbError);
        setUserNFTs(nfts);
      }

    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  // Get token ID by owner index (if contract supports enumerable)
  const getTokenByIndex = async (owner: Address, index: number): Promise<bigint | null> => {
    try {
      // This would require ERC721Enumerable - for now we'll use a different approach
      // We'll query the database for user's minted NFTs
      return null;
    } catch (error) {
      return null;
    }
  };

  // Fetch NFT metadata from IPFS/contract
  const fetchNFTMetadata = async (tokenId: bigint): Promise<UserNFT | null> => {
    try {
      // Get token URI from contract
      const response = await fetch(`/api/nft-metadata/token/${tokenId}`);
      if (!response.ok) return null;
      
      const metadata = await response.json();
      
      return {
        tokenId,
        collection: nftCollectionAddress,
        collectionName: metadata.collectionName || "Unknown Collection",
        name: metadata.name || `NFT #${tokenId}`,
        description: metadata.description || "",
        image: metadata.image || "/placeholder-nft.png",
        attributes: metadata.attributes || [],
        isListed: false, // Will be updated when we check marketplace
        metadataUri: metadata.metadataUri,
      };
    } catch (error) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      return null;
    }
  };

  // Fetch user NFTs from database (minted through our platform)
  const fetchUserNFTsFromDB = async (userAddress: Address): Promise<UserNFT[]> => {
    try {
      const response = await fetch(`/api/user-nfts/${userAddress}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.nfts || [];
    } catch (error) {
      console.error('Error fetching user NFTs from DB:', error);
      return [];
    }
  };

  const refetch = () => {
    if (userAddress) {
      fetchUserNFTs();
    }
  };

  return {
    userNFTs,
    isLoading,
    error,
    refetch,
  };
}

// Hook to check if user owns a specific NFT
export function useUserOwnsNFT(collection: Address, tokenId: bigint) {
  const { address: userAddress } = useAccount();
  
  const { data: owner } = useReadContract({
    address: collection,
    abi: NFT_COLLECTION_ABI,
    functionName: 'ownerOf',
    args: [tokenId],
    query: {
      enabled: Boolean(userAddress && tokenId),
    },
  });

  return {
    owns: owner === userAddress,
    owner,
  };
}
