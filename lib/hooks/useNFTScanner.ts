import { useState, useEffect } from 'react';
import { ScannedNFT, CollectionStats } from '@/lib/services/nftScanner';
import { KnownCollection } from '@/lib/config/knownCollections';

interface UseNFTScannerResult {
  nfts: ScannedNFT[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseCollectionStatsResult {
  stats: CollectionStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseKnownCollectionsResult {
  collections: KnownCollection[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Hook for scanning marketplace NFTs
export function useMarketplaceNFTs(limit: number = 50, offset: number = 0): UseNFTScannerResult {
  const [nfts, setNfts] = useState<ScannedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/nft-scanner?action=marketplace-nfts&limit=${limit}&offset=${offset}`
      );
      const result = await response.json();
      
      if (result.success) {
        setNfts(result.data);
      } else {
        setError(result.error || 'Failed to fetch marketplace NFTs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [limit, offset]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNFTs,
  };
}

// Hook for scanning user's NFTs
export function useUserNFTs(userAddress: string | undefined): UseNFTScannerResult {
  const [nfts, setNfts] = useState<ScannedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = async () => {
    if (!userAddress) {
      setNfts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/nft-scanner?action=user-nfts&owner=${userAddress}`
      );
      const result = await response.json();
      
      if (result.success) {
        setNfts(result.data);
      } else {
        setError(result.error || 'Failed to fetch user NFTs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [userAddress]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNFTs,
  };
}

// Hook for scanning a specific collection
export function useCollectionNFTs(collectionAddress: string | undefined, limit: number = 50): UseNFTScannerResult {
  const [nfts, setNfts] = useState<ScannedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = async () => {
    if (!collectionAddress) {
      setNfts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/nft-scanner?action=scan-collection&collection=${collectionAddress}&limit=${limit}`
      );
      const result = await response.json();
      
      if (result.success) {
        setNfts(result.data);
      } else {
        setError(result.error || 'Failed to fetch collection NFTs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [collectionAddress, limit]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNFTs,
  };
}

// Hook for collection statistics
export function useCollectionStats(collectionAddress: string | undefined): UseCollectionStatsResult {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!collectionAddress) {
      setStats(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/nft-scanner?action=collection-stats&collection=${collectionAddress}`
      );
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch collection stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [collectionAddress]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// Hook for known collections
export function useKnownCollections(): UseKnownCollectionsResult {
  const [collections, setCollections] = useState<KnownCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/nft-scanner?action=known-collections');
      const result = await response.json();
      
      if (result.success) {
        setCollections(result.data);
      } else {
        setError(result.error || 'Failed to fetch known collections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
  };
}
