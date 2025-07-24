import { useEffect, useState, useCallback } from "react";
import { Address } from "viem";

export interface RealLaunch {
  id: string;
  launchId: number;
  collection: Address;
  creator: Address;
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  maxSupply: number;
  startTime: number;
  status: number; // 0: PENDING, 1: ACTIVE, 2: COMPLETED, 3: CANCELLED
  autoProgress: boolean;
  isActive: boolean;
  currentPhase: string;
  totalRaised: string;
  info: {
    status: number;
    collection: Address;
    creator: Address;
    startTime: number;
    maxSupply: number;
  };
  createdAt: Date;
  progress: number; // 0-100
}

export function useRealLaunches() {
  const [launches, setLaunches] = useState<RealLaunch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch launches from database (only active ones for launchpad)
  const fetchLaunchesFromDatabase = useCallback(async (): Promise<RealLaunch[]> => {
    try {
      console.log('🔄 Fetching active launches from database...');
      const response = await fetch('/api/launchpools');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch launches');
      }
      
      // Filter for active launches only
      const activeLaunches = result.data.filter((launch: any) => launch.status === 'ACTIVE');
      
      console.log('✅ Found active launches:', activeLaunches.length);
      
      // Transform database data to RealLaunch format
      return activeLaunches.map((launch: any) => ({
        id: launch.id,
        launchId: launch.launchId,
        collection: (launch.contractAddress || launch.collectionAddress) as Address,
        creator: launch.creator as Address,
        name: launch.name,
        symbol: launch.symbol,
        description: launch.description || '',
        imageUri: (launch.imageUri || launch.imageUrl) || '',
        maxSupply: launch.maxSupply,
        startTime: new Date(launch.createdAt).getTime() / 1000,
        status: launch.status === 'ACTIVE' ? 1 : 0,
        autoProgress: launch.autoProgress || false,
        isActive: launch.status === 'ACTIVE',
        currentPhase: 'public',
        totalRaised: '0',
        info: {
          status: launch.status === 'ACTIVE' ? 1 : 0,
          collection: (launch.contractAddress || launch.collectionAddress) as Address,
          creator: launch.creator as Address,
          startTime: new Date(launch.createdAt).getTime() / 1000,
          maxSupply: launch.maxSupply,
        },
        createdAt: new Date(launch.createdAt),
        progress: 0,
      }));
    } catch (err) {
      console.error('❌ Error fetching launches from database:', err);
      throw err;
    }
  }, []);

  // Fetch launch details on mount and set up auto-refresh
  const fetchLaunchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const launchData = await fetchLaunchesFromDatabase();
      setLaunches(launchData);
      
      console.log('✅ Successfully loaded active launches:', launchData.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch launches';
      console.error('❌ Error in fetchLaunchDetails:', errorMessage);
      setError(errorMessage);
      setLaunches([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLaunchesFromDatabase]);

  // Load active launches on mount
  useEffect(() => {
    fetchLaunchDetails();
  }, [fetchLaunchDetails]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing active launches...');
      fetchLaunchDetails();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLaunchDetails]);

  const refetch = useCallback(() => {
    console.log('🔄 Manual refetch requested...');
    fetchLaunchDetails();
  }, [fetchLaunchDetails]);

  return {
    launches,
    isLoading,
    error,
    refetch,
  };
}

// Hook for getting a single launch with REAL contract data
export function useRealLaunch(launchId: number) {
  const [launch, setLaunch] = useState<RealLaunch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`⚠️ useRealLaunch called for launch ${launchId} - using database fallback`);
    setLaunch(null);
    setError('Individual launch fetching not implemented - use useRealLaunches instead');
    setIsLoading(false);
  }, [launchId]);

  return { launch, isLoading, error, refetch: () => {} };
}

// Helper functions
function getPhaseText(status: number): string {
  switch (status) {
    case 0:
      return "Funding";
    case 1:
      return "Active";
    case 2:
      return "Completed";
    case 3:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

function calculateProgress(
  status: number,
  maxSupply: number,
  minted: number,
): number {
  if (status === 2) return 100; // Completed
  if (status === 3) return 0; // Cancelled
  if (maxSupply === 0) return 0;

  return Math.min((minted / maxSupply) * 100, 100);
}
