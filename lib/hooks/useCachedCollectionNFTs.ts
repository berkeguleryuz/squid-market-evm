import { useState, useEffect, useCallback } from 'react';

interface CachedNFT {
  tokenId: string;
  name: string;
  description?: string;
  image: string;
  owner: string;
  collectionAddress: string;
  cached: boolean;
}

interface UseCachedCollectionNFTsResult {
  nfts: CachedNFT[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export function useCachedCollectionNFTs(
  collectionAddress: string | undefined,
  initialLimit: number = 16
): UseCachedCollectionNFTsResult {
  const [nfts, setNfts] = useState<CachedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNFTs = useCallback(async (page: number = 1, append: boolean = false, skipCache: boolean = false) => {
    if (!collectionAddress) return;

    try {
      setLoading(true);
      setError(null);

      // First load: try to get cached NFTs (only if not skipping cache)
      if (page === 1 && !skipCache) {
        console.log(`🎨 Loading cached NFTs for ${collectionAddress}`);
        
        const cachedResponse = await fetch(
          `/api/collections/${collectionAddress}/nfts?cache=true`
        );
        const cachedResult = await cachedResponse.json();

        if (cachedResult.success && cachedResult.data.length > 0) {
          console.log(`✅ Loaded ${cachedResult.data.length} cached NFTs`);
          setNfts(cachedResult.data);
          setHasMore(cachedResult.hasMore);
          setLoading(false);
          return;
        }
      }

      // Load live NFTs from blockchain
      console.log(`🔍 Loading live NFTs for ${collectionAddress} (page: ${page})`);
      
      const response = await fetch(
        `/api/collections/${collectionAddress}/nfts?page=${page}&limit=${initialLimit}`
      );
      const result = await response.json();

      if (result.success) {
        console.log(`✅ Loaded ${result.data.length} live NFTs (page: ${page})`);
        
        if (append) {
          setNfts(prev => [...prev, ...result.data]);
        } else {
          setNfts(result.data);
        }
        
        setHasMore(result.hasMore);
        setCurrentPage(page);
      } else {
        setError(result.error || 'Failed to fetch NFTs');
      }
    } catch (err) {
      console.error('Error fetching collection NFTs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [collectionAddress, initialLimit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNFTs(currentPage + 1, true);
    }
  }, [loading, hasMore, currentPage, fetchNFTs]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setNfts([]);
    fetchNFTs(1, false, true); // Skip cache on refresh
  }, [fetchNFTs]);

  useEffect(() => {
    if (collectionAddress) {
      setCurrentPage(1);
      setNfts([]);
      setHasMore(true);
      fetchNFTs(1, false); // Use cache on initial load
    }
  }, [collectionAddress, fetchNFTs]);

  return {
    nfts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}
