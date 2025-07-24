import { useEffect, useState, useCallback } from "react";
import { Address } from "viem";
import { useActiveLaunches, useLaunchInfo } from "./useContracts";

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

  // Always fetch launch ID 0 (the one user created) plus any active launches
  const {
    data: activeLaunchIds,
    isLoading: isLoadingLaunches,
    error: launchesError,
    refetch: refetchLaunches,
  } = useActiveLaunches();

  const fetchLaunchDetails = useCallback(async (launchIds: readonly bigint[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const launchPromises = launchIds.map(async (launchId) => {
        return fetchSingleLaunch(Number(launchId));
      });

      const results = await Promise.allSettled(launchPromises);
      const validLaunches = results
        .filter(
          (result): result is PromiseFulfilledResult<RealLaunch | null> =>
            result.status === "fulfilled" && result.value !== null,
        )
        .map((result) => result.value!);

      setLaunches(validLaunches);
    } catch (err) {
      console.error("Error fetching launch details:", err);
      setError("Failed to fetch launch details");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔍 useRealLaunches effect triggered:', {
      isLoadingLaunches,
      activeLaunchIds,
      activeLaunchIdsType: typeof activeLaunchIds,
      activeLaunchIdsArray: Array.isArray(activeLaunchIds)
    });
    
    if (isLoadingLaunches) {
      console.log('⏳ Still loading launches from contract...');
      return;
    }
    
    // Use all active launches from contract
    const launchIdsToFetch: readonly bigint[] = activeLaunchIds && Array.isArray(activeLaunchIds) 
      ? activeLaunchIds 
      : [];

    console.log('🔄 Fetching launches:', {
      rawIds: activeLaunchIds,
      processedIds: launchIdsToFetch.map(id => Number(id)),
      count: launchIdsToFetch.length
    });
    
    if (launchIdsToFetch.length === 0) {
      console.log('⚠️ No active launches found in contract!');
      setLaunches([]);
      setIsLoading(false);
      return;
    }
    
    fetchLaunchDetails(launchIdsToFetch);
  }, [activeLaunchIds, isLoadingLaunches, fetchLaunchDetails]);

  useEffect(() => {
    if (launchesError) {
      setError(launchesError.message || "Failed to fetch launches");
    }
  }, [launchesError]);

  const fetchSingleLaunch = async (
    launchId: number,
  ): Promise<RealLaunch | null> => {
    try {
      console.log(`📡 Fetching real contract data for launch ${launchId}`);
      
      // This will be implemented by calling the actual contract
      // For now, return null to let useRealLaunch handle individual launches
      return null;
    } catch (err) {
      console.error(`Error fetching launch ${launchId}:`, err);
      return null;
    }
  };

  return {
    launches,
    isLoading,
    error,
    refetch: async () => {
      setError(null);
      await refetchLaunches();
    },
  };
}

// Hook for getting a single launch with REAL contract data
export function useRealLaunch(launchId: number) {
  const [launch, setLaunch] = useState<RealLaunch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    data: launchData,
    isLoading: isLoadingLaunch,
    error: launchError,
    refetch: refetchLaunchData,
  } = useLaunchInfo(launchId);

  useEffect(() => {
    if (launchData && Array.isArray(launchData) && launchData.length >= 10) {
      console.log(
        "🔍 Real contract data for launch",
        launchId,
        ":",
        launchData,
      );

      const [
        collection,
        creator,
        name,
        symbol,
        description,
        imageUri,
        maxSupply,
        startTime,
        status,
        autoProgress,
      ] = launchData;

      const processedLaunch: RealLaunch = {
        id: launchId.toString(),
        launchId: launchId,
        collection: collection as Address,
        creator: creator as Address,
        name: name as string,
        symbol: symbol as string,
        description: description as string,
        imageUri: imageUri as string,
        maxSupply: Number(maxSupply),
        startTime: Number(startTime),
        status: Number(status),
        autoProgress: autoProgress as boolean,
        isActive: Number(status) === 1, // ACTIVE
        currentPhase: getPhaseText(Number(status)),
        totalRaised: "0", // TODO: Calculate from contract
        info: {
          status: Number(status),
          collection: collection as Address,
          creator: creator as Address,
          startTime: Number(startTime),
          maxSupply: Number(maxSupply),
        },
        createdAt: new Date(Number(startTime) * 1000),
        progress: calculateProgress(Number(status), Number(maxSupply), 0),
      };

      console.log("📊 Processed launch:", processedLaunch);
      setLaunch(processedLaunch);
    } else if (!isLoadingLaunch && !launchData) {
      // No data available from contract
      console.log(`⚠️ No contract data available for launch ${launchId}`);
      setLaunch(null);
    }

    setIsLoading(isLoadingLaunch);

    if (launchError) {
      setError(launchError.message || "Failed to fetch launch");
      console.error("Launch fetch error:", launchError);
    }
  }, [launchData, isLoadingLaunch, launchError, launchId]);

  return { launch, isLoading, error, refetch: refetchLaunchData };
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
