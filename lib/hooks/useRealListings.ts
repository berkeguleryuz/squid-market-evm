import { useEffect, useState } from 'react';
import { Address } from 'viem';
import { useAllListings, useListing, useActiveListings } from './useContracts';
import { Listing, getStatusText, formatPrice } from '@/lib/contracts';

export interface RealListing {
  id: bigint;
  collection: Address;
  tokenId: bigint;
  seller: Address;
  price: string; // in ETH
  priceWei: bigint;
  isAuction: boolean;
  status: string;
  createdAt: Date;
  endTime?: Date;
  highestBidder?: Address;
  highestBid?: string; // in ETH
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}

export function useRealListings(collection?: Address | null) {
  const [listings, setListings] = useState<RealListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    data: rawListings, 
    isLoading: isLoadingListings,
    error: listingsError,
    refetch 
  } = useActiveListings(collection || undefined); // Fix: convert null to undefined
  
  useEffect(() => {
    if (rawListings) {
      processListings(rawListings);
    }
    setIsLoading(isLoadingListings);
  }, [rawListings, isLoadingListings]);
  
  useEffect(() => {
    if (listingsError) {
      setError(listingsError.message || 'Failed to fetch listings');
    } else {
      setError(null);
    }
  }, [listingsError]);

  const processListings = async (rawData: readonly bigint[]) => {
    if (!rawData || rawData.length === 0) {
      setListings([]);
      return;
    }

    try {
      setIsLoading(true);
      
      const processedListings: RealListing[] = [];
      
      // For now, create mock listings based on the IDs
      for (let i = 0; i < rawData.length; i++) {
        const listingId = rawData[i];
        
        const mockListing: RealListing = {
          id: listingId,
          collection: collection || '0x0000000000000000000000000000000000000000' as Address,
          tokenId: BigInt(i + 1),
          seller: '0x1234567890123456789012345678901234567890' as Address,
          price: `${0.1 + (i * 0.05)}`, // Mock prices: 0.1, 0.15, 0.2 ETH etc.
          priceWei: BigInt(Math.floor((0.1 + (i * 0.05)) * 1e18)),
          isAuction: i % 3 === 0, // Every 3rd item is auction
          status: 'active',
          createdAt: new Date(Date.now() - (i * 86400000)), // Staggered dates
          metadata: {
            name: `NFT #${i + 1}`,
            description: `This is NFT number ${i + 1} in the collection`,
            image: `/squid${(i % 4) + 1}.jpg`, // Cycle through squid1-4.jpg
            attributes: [
              { trait_type: 'Rarity', value: i % 3 === 0 ? 'Rare' : 'Common' },
              { trait_type: 'Generation', value: '1' }
            ]
          }
        };
        
        if (mockListing.isAuction) {
          mockListing.endTime = new Date(Date.now() + 86400000); // 24h from now
          mockListing.highestBidder = '0x9876543210987654321098765432109876543210' as Address;
          mockListing.highestBid = `${parseFloat(mockListing.price) * 0.8}`;
        }
        
        processedListings.push(mockListing);
      }
      
      setListings(processedListings);
    } catch (err) {
      console.error('Error processing listings:', err);
      setError('Failed to process listings');
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    listings,
    isLoading,
    error,
    refetch: async () => {
      setError(null);
      await refetch();
    }
  };
}

// Helper hook for individual listing
export function useRealListing(listingId: bigint) {
  const [listing, setListing] = useState<RealListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { 
    data: rawListing,
    isLoading: isLoadingListing,
    error: listingError 
  } = useListing(Number(listingId));

  useEffect(() => {
    if (rawListing && Array.isArray(rawListing)) {
      // Process single listing data
      const [id, collection, tokenId, seller, price, listingType, status] = rawListing;
      
      const processedListing: RealListing = {
        id: BigInt(id as bigint),
        collection: collection as Address,
        tokenId: BigInt(tokenId as bigint),
        seller: seller as Address,
        price: formatPrice(BigInt(price as bigint)),
        priceWei: BigInt(price as bigint),
        isAuction: Number(listingType) === 1,
        status: getStatusText(Number(status), 'listing'), // Fix: provide 2nd argument
        createdAt: new Date(),
        metadata: {
          name: `NFT #${tokenId}`,
          description: 'Individual NFT from marketplace',
          image: '/squid1.jpg',
          attributes: []
        }
      };
      
      setListing(processedListing);
    }
    
    setIsLoading(isLoadingListing);
    
    if (listingError) {
      setError(listingError.message || 'Failed to fetch listing');
    } else {
      setError(null);
    }
  }, [rawListing, isLoadingListing, listingError]);

  return { listing, isLoading, error };
} 