"use client";

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { MARKETPLACE_ABI } from '@/lib/contracts';
import { getContractAddress } from '@/lib/wagmi';

export interface MarketplaceListing {
  listingId: string;
  collection: string;
  tokenId: string;
  seller: string;
  price: string;
  listingType: number;
  status: number;
  createdAt: string;
  endTime: string;
  highestBidder: string;
  highestBid: string;
  hasRoyalty: boolean;
  royaltyAmount: string;
  royaltyRecipient: string;
}

export function useMarketplaceListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For now, we'll return empty listings since we need to implement
  // the contract function to get all active listings
  useEffect(() => {
    setIsLoading(false);
    setListings([]);
  }, []);

  return {
    listings,
    isLoading,
    error,
    refetch: () => {
      setIsLoading(true);
      // Refetch logic here
      setIsLoading(false);
    }
  };
}

export function useNFTListing(collection: string, tokenId: string) {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if this specific NFT is listed
  const { data: tokenToListingId } = useReadContract({
    address: getContractAddress('MARKETPLACE'),
    abi: MARKETPLACE_ABI,
    functionName: 'tokenToListing',
    args: [collection as `0x${string}`, BigInt(tokenId)],
  });

  const { data: listingData } = useReadContract({
    address: getContractAddress('MARKETPLACE'),
    abi: MARKETPLACE_ABI,
    functionName: 'listings',
    args: tokenToListingId ? [tokenToListingId] : undefined,
    query: {
      enabled: !!tokenToListingId && tokenToListingId !== BigInt(0),
    },
  });

  useEffect(() => {
    if (tokenToListingId === BigInt(0) || !tokenToListingId) {
      // Not listed
      setListing(null);
      setIsLoading(false);
      return;
    }

    if (listingData) {
      const [
        listingId,
        collectionAddr,
        tokenIdBig,
        seller,
        price,
        listingType,
        status,
        createdAt,
        endTime,
        highestBidder,
        highestBid,
        hasRoyalty,
        royaltyAmount,
        royaltyRecipient
      ] = listingData as readonly [bigint, `0x${string}`, bigint, `0x${string}`, bigint, number, number, bigint, bigint, `0x${string}`, bigint, boolean, bigint, `0x${string}`];

      // Status 0 = ACTIVE, 1 = SOLD, 2 = CANCELLED
      if (status === 0) {
        setListing({
          listingId: listingId.toString(),
          collection: collectionAddr,
          tokenId: tokenIdBig.toString(),
          seller,
          price: price.toString(),
          listingType,
          status,
          createdAt: createdAt.toString(),
          endTime: endTime.toString(),
          highestBidder,
          highestBid: highestBid.toString(),
          hasRoyalty,
          royaltyAmount: royaltyAmount.toString(),
          royaltyRecipient
        });
      } else {
        setListing(null);
      }
      setIsLoading(false);
    }
  }, [tokenToListingId, listingData]);

  return {
    listing,
    isListed: !!listing,
    isLoading,
    error
  };
}
