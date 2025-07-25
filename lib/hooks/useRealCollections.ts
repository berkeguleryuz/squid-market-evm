import { useState, useEffect, useCallback } from 'react';

export interface RealCollection {
  address: string;
  name: string;
  symbol: string;
  type: 'ERC721';
  verified: boolean;
  description?: string;
  image?: string;
  totalSupply?: number;
  source: 'launchpad' | 'blockchain';
}

interface UseRealCollectionsResult {
  collections: RealCollection[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRealCollections(verifiedOnly: boolean = false): UseRealCollectionsResult {
  const [collections, setCollections] = useState<RealCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching real collections...', { verifiedOnly });
      
      const url = `/api/collections${verifiedOnly ? '?verified=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Real collections loaded:', result.data.length);
        setCollections(result.data);
      } else {
        console.error('❌ Failed to fetch collections:', result.error);
        setError(result.error || 'Failed to fetch collections');
      }
    } catch (err) {
      console.error('❌ Collections fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionsCallback = useCallback(fetchCollections, [verifiedOnly]);

  useEffect(() => {
    fetchCollectionsCallback();
  }, [fetchCollectionsCallback]);

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
  };
}

// Hook for getting a specific collection by address
export function useRealCollection(address: string | undefined): {
  collection: RealCollection | null;
  loading: boolean;
  error: string | null;
} {
  const [collection, setCollection] = useState<RealCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setCollection(null);
      setLoading(false);
      return;
    }

    const fetchCollection = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/collections');
        const result = await response.json();
        
        if (result.success) {
          const found = result.data.find((c: RealCollection) => 
            c.address.toLowerCase() === address.toLowerCase()
          );
          setCollection(found || null);
        } else {
          setError(result.error || 'Failed to fetch collection');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [address]);

  return { collection, loading, error };
}
