import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { useNFTBalance, useTokenURI } from './useContracts';
import { useRealListings } from './useRealListings';

export interface UserNFT {
  tokenId: bigint;
  collection: Address;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  isListed: boolean;
  listingId?: bigint;
  price?: string; // in ETH
  acquiredAt?: Date;
}

export function useRealUserNFTs() {
  const { address: userAddress } = useAccount();
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get all listings to check which user NFTs are listed
  const { listings } = useRealListings();
  
  useEffect(() => {
    if (userAddress) {
      fetchUserNFTs();
    } else {
      setUserNFTs([]);
    }
  }, [userAddress]);
  
  const fetchUserNFTs = async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // We need to fetch NFTs from all known collections
      // For now, we'll return empty array until we have a way to discover collections
      const nfts: UserNFT[] = [];
      
      // TODO: Implement collection discovery
      // This could be done by:
      // 1. Listening to Transfer events to the user's address
      // 2. Maintaining a registry of known collections
      // 3. Using a subgraph or indexing service
      
      setUserNFTs(nfts);
    } catch (err) {
      console.error('Error fetching user NFTs:', err);
      setError('Failed to fetch your NFTs');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchNFTsFromCollection = async (collection: Address, userAddress: Address) => {
    // This would check user's balance and then fetch each token
    // For now, return empty array
    return [];
  };
  
  const fetchNFTMetadata = async (collection: Address, tokenId: bigint) => {
    // Fetch token URI and then metadata
    return {
      name: `NFT #${tokenId}`,
      description: 'User owned NFT',
      image: '/squid1.jpg',
      attributes: []
    };
  };
  
  // Update listing status when listings change
  useEffect(() => {
    if (listings.length > 0 && userNFTs.length > 0) {
      const updatedNFTs = userNFTs.map(nft => {
        const listing = listings.find(l => 
          l.collection === nft.collection && 
          l.tokenId === nft.tokenId &&
          l.seller === userAddress
        );
        
        return {
          ...nft,
          isListed: !!listing,
          listingId: listing?.id,
          price: listing?.price,
        };
      });
      
      setUserNFTs(updatedNFTs);
    }
  }, [listings, userNFTs, userAddress]);
  
  return {
    userNFTs,
    isLoading,
    error,
    refetch: fetchUserNFTs,
  };
}

// Hook to check if user owns a specific NFT
export function useUserOwnsNFT(collection: Address, tokenId: bigint) {
  const { address: userAddress } = useAccount();
  const { userNFTs } = useRealUserNFTs();
  
  const ownsNFT = userNFTs.some(nft => 
    nft.collection === collection && nft.tokenId === tokenId
  );
  
  return ownsNFT;
} 