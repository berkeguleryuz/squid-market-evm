"use client";

import { useEffect, useState } from 'react';
import { Address } from 'viem';
import { VERIFIED_COLLECTIONS, VerifiedCollection } from '@/lib/data/verifiedCollections';

export interface PaginatedNFT {
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
  owner: Address;
  isVerified: boolean;
  isListed: boolean;
  listingPrice?: string;
  listingId?: bigint;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function usePaginatedNFTs(page: number = 1, itemsPerPage: number = 9, verifiedOnly: boolean = true) {
  const [nfts, setNfts] = useState<PaginatedNFT[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 9,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaginatedNFTs();
  }, [page, itemsPerPage, verifiedOnly]);

  const fetchPaginatedNFTs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const collectionsToScan = verifiedOnly 
        ? VERIFIED_COLLECTIONS.filter(c => c.verified)
        : VERIFIED_COLLECTIONS;

      const allNFTs: PaginatedNFT[] = [];

      // Scan each collection
      for (const collection of collectionsToScan) {
        try {
          const collectionNFTs = await fetchCollectionNFTs(collection);
          allNFTs.push(...collectionNFTs);
        } catch (error) {
          console.error(`Error fetching NFTs from collection ${collection.address}:`, error);
        }
      }

      // Sort NFTs: verified collections first, then by token ID
      const sortedNFTs = allNFTs.sort((a, b) => {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return Number(a.tokenId) - Number(b.tokenId);
      });

      // Calculate pagination
      const totalItems = sortedNFTs.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedNFTs = sortedNFTs.slice(startIndex, endIndex);

      setNfts(paginatedNFTs);
      setPagination({
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      });

    } catch (error) {
      console.error('Error fetching paginated NFTs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollectionNFTs = async (collection: VerifiedCollection): Promise<PaginatedNFT[]> => {
    try {
      const response = await fetch(`/api/nfts/collection/${collection.address}?limit=50`);
      if (!response.ok) {
        throw new Error(`Failed to fetch NFTs from ${collection.name}`);
      }

      const data = await response.json();
      return data.nfts || [];
    } catch (error) {
      console.error(`Error fetching collection ${collection.address}:`, error);
      return [];
    }
  };

  const nextPage = () => {
    if (pagination.hasNext) {
      fetchPaginatedNFTs();
    }
  };

  const prevPage = () => {
    if (pagination.hasPrev) {
      fetchPaginatedNFTs();
    }
  };

  const goToPage = (targetPage: number) => {
    if (targetPage >= 1 && targetPage <= pagination.totalPages) {
      fetchPaginatedNFTs();
    }
  };

  const refetch = () => {
    fetchPaginatedNFTs();
  };

  return {
    nfts,
    pagination,
    isLoading,
    error,
    nextPage,
    prevPage,
    goToPage,
    refetch,
  };
}
