"use client";

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Address } from 'viem';
import { getContractAddress } from '@/lib/wagmi';
import { MARKETPLACE_ABI } from '@/lib/contracts';

export interface MarketplaceNFT {
  listingId: bigint;
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
  seller: Address;
  price: string; // in ETH
  listingType: number; // 0 = Fixed Price, 1 = Auction
  status: number; // 0 = Active, 1 = Sold, 2 = Cancelled
  createdAt: Date;
  endTime?: Date;
  highestBidder?: Address;
  highestBid?: string;
  isVerified: boolean; // Whether the collection is verified
}

export function useMarketplaceNFTs() {
  const { address: userAddress } = useAccount();
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get marketplace contract
  const marketplaceAddress = getContractAddress("MARKETPLACE");

  // Get total number of listings
  const { data: listingCounter } = useReadContract({
    address: marketplaceAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'listingCounter',
    query: {
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  useEffect(() => {
    if (listingCounter) {
      fetchMarketplaceNFTs();
    }
  }, [listingCounter]);

  const fetchMarketplaceNFTs = async () => {
    if (!listingCounter) return;

    setIsLoading(true);
    setError(null);

    try {
      const listings: MarketplaceNFT[] = [];
      const totalListings = Number(listingCounter);

      // Fetch all active listings
      for (let i = 0; i < totalListings; i++) {
        try {
          const listingData = await fetchListingData(BigInt(i));
          if (listingData && listingData.status === 0) { // Only active listings
            listings.push(listingData);
          }
        } catch (error) {
          console.error(`Error fetching listing ${i}:`, error);
        }
      }

      // Sort by creation date (newest first) and prioritize verified collections
      const sortedListings = listings.sort((a, b) => {
        // First sort by verification status
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        
        // Then by creation date
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      setMarketplaceNFTs(sortedListings);

    } catch (error) {
      console.error('Error fetching marketplace NFTs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch marketplace NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch individual listing data
  const fetchListingData = async (listingId: bigint): Promise<MarketplaceNFT | null> => {
    try {
      // Get listing info from contract
      const response = await fetch(`/api/marketplace/listing/${listingId}`);
      if (!response.ok) return null;
      
      const listingData = await response.json();
      return listingData.listing;
    } catch (error) {
      console.error(`Error fetching listing ${listingId}:`, error);
      return null;
    }
  };

  const refetch = () => {
    if (listingCounter) {
      fetchMarketplaceNFTs();
    }
  };

  return {
    marketplaceNFTs,
    isLoading,
    error,
    refetch,
  };
}

// Hook for buying NFT
export function useBuyNFT() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyNFT = async (listingId: bigint, price: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listingId.toString(),
          price,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to buy NFT');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to buy NFT';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    buyNFT,
    isLoading,
    error,
  };
}

// Hook for listing NFT for sale
export function useListNFT() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listNFT = async (
    collection: Address,
    tokenId: bigint,
    price: string,
    listingType: number = 0 // 0 = Fixed Price, 1 = Auction
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection,
          tokenId: tokenId.toString(),
          price,
          listingType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to list NFT');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to list NFT';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    listNFT,
    isLoading,
    error,
  };
}
