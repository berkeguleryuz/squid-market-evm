import { useState, useEffect } from 'react';

interface PreviewNFT {
  tokenId: string;
  image: string;
  name?: string;
}

interface UseCollectionPreviewResult {
  previewImages: PreviewNFT[];
  loading: boolean;
  error: string | null;
}

export function useCollectionPreview(address: string | undefined, count: number = 6): UseCollectionPreviewResult {
  const [previewImages, setPreviewImages] = useState<PreviewNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setPreviewImages([]);
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/collections/preview/${address}?count=${count}`);
        const result = await response.json();
        
        if (result.success) {
          setPreviewImages(result.data);
        } else {
          setError(result.error || 'Failed to fetch collection preview');
          setPreviewImages([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPreviewImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [address, count]);

  return {
    previewImages,
    loading,
    error
  };
}

// Hook for multiple collections
export function useMultipleCollectionPreviews(addresses: string[], count: number = 4): Record<string, UseCollectionPreviewResult> {
  const [previews, setPreviews] = useState<Record<string, UseCollectionPreviewResult>>({});

  useEffect(() => {
    const fetchAllPreviews = async () => {
      const newPreviews: Record<string, UseCollectionPreviewResult> = {};
      
      // Initialize loading states
      addresses.forEach(address => {
        newPreviews[address] = {
          previewImages: [],
          loading: true,
          error: null
        };
      });
      setPreviews(newPreviews);

      // Fetch previews in parallel
      const promises = addresses.map(async (address) => {
        try {
          const response = await fetch(`/api/collections/preview/${address}?count=${count}`);
          const result = await response.json();
          
          return {
            address,
            success: result.success,
            data: result.data || [],
            error: result.error
          };
        } catch (error) {
          return {
            address,
            success: false,
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const results = await Promise.all(promises);
      
      // Update state with results
      setPreviews(prev => {
        const updated = { ...prev };
        results.forEach(result => {
          updated[result.address] = {
            previewImages: result.data,
            loading: false,
            error: result.success ? null : result.error
          };
        });
        return updated;
      });
    };

    if (addresses.length > 0) {
      fetchAllPreviews();
    }
  }, [addresses, count]);

  return previews;
}
