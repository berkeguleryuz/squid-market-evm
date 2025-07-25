"use client";

import { useState, useEffect } from 'react';
import { Address } from 'viem';

export interface BlockchainCollection {
  address: Address;
  name: string;
  symbol: string;
  totalSupply: string;
  isERC721: boolean;
  isERC1155: boolean;
  blockNumber: string;
}

export interface BlockchainNFT {
  tokenId: string;
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
  // Marketplace properties
  isListed?: boolean;
  listingPrice?: string;
  isVerified?: boolean;
}

export function useBlockchainCollections() {
  const [collections, setCollections] = useState<BlockchainCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Fetching blockchain collections...');
      
      const response = await fetch('/api/blockchain/discover?action=collections&limit=50');
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Found ${data.collections.length} blockchain collections:`, data.collections);
        setCollections(data.collections);
      } else {
        throw new Error(data.error || 'Failed to fetch collections');
      }
    } catch (err) {
      console.error('❌ Error fetching blockchain collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return {
    collections,
    isLoading,
    error,
    refetch: fetchCollections,
  };
}

export function useBlockchainNFTs(collectionAddress?: Address) {
  const [nfts, setNfts] = useState<BlockchainNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = async (address: Address) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching NFTs from collection: ${address}`);
      
      const response = await fetch(`/api/blockchain/discover?action=scan&collection=${address}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Found ${data.nfts.length} NFTs from ${address}:`, data.nfts);
        setNfts(data.nfts);
      } else {
        throw new Error(data.error || 'Failed to fetch NFTs');
      }
    } catch (err) {
      console.error(`❌ Error fetching NFTs from ${address}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (collectionAddress) {
      fetchNFTs(collectionAddress);
    }
  }, [collectionAddress]);

  return {
    nfts,
    isLoading,
    error,
    fetchNFTs,
  };
}

export function useAllBlockchainNFTs() {
  const [nfts, setNfts] = useState<BlockchainNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { collections, isLoading: collectionsLoading } = useBlockchainCollections();

  const fetchAllNFTs = async () => {
    if (collectionsLoading || collections.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching NFTs from ${collections.length} collections...`);
      
      const allNFTs: BlockchainNFT[] = [];
      
      // Fetch NFTs from each collection (limit to prevent overload)
      const collectionsToScan = collections.slice(0, 10); // Limit to first 10 collections
      
      for (const collection of collectionsToScan) {
        try {
          console.log(`📊 Scanning collection: ${collection.name} (${collection.address})`);
          
          const response = await fetch(`/api/blockchain/discover?action=scan&collection=${collection.address}&limit=20`);
          const data = await response.json();
          
          if (data.success) {
            allNFTs.push(...data.nfts);
            console.log(`✅ Added ${data.nfts.length} NFTs from ${collection.name}`);
          } else {
            console.warn(`⚠️ Failed to scan ${collection.name}:`, data.error);
          }
        } catch (collectionError) {
          console.error(`❌ Error scanning collection ${collection.address}:`, collectionError);
        }
      }
      
      console.log(`🎉 Total NFTs found: ${allNFTs.length}`);
      setNfts(allNFTs);
      
    } catch (err) {
      console.error('❌ Error fetching all blockchain NFTs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNFTs();
  }, [collections, collectionsLoading]);

  return {
    nfts,
    isLoading: isLoading || collectionsLoading,
    error,
    refetch: fetchAllNFTs,
  };
}

// Hook for user's NFTs across all collections
export function useUserBlockchainNFTs(userAddress?: Address) {
  const { nfts: allNFTs, isLoading, error, refetch } = useAllBlockchainNFTs();
  
  const userNFTs = userAddress 
    ? allNFTs.filter(nft => nft.owner.toLowerCase() === userAddress.toLowerCase())
    : [];

  return {
    nfts: userNFTs,
    isLoading,
    error,
    refetch,
  };
}
