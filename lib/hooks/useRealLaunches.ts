import { useEffect, useState, useCallback } from "react";
import { Address } from "viem";
import { useActiveLaunches, useCreatorLaunches, useLaunchInfo } from "./useContracts";
import { useAccount } from "wagmi";

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
  const { address } = useAccount();

  // Fetch both active launches and creator launches for comprehensive admin view
  const {
    data: activeLaunchIds,
    isLoading: isLoadingActive,
    error: activeLaunchesError,
    refetch: refetchActiveLaunches,
  } = useActiveLaunches();

  const {
    data: creatorLaunchIds,
    isLoading: isLoadingCreator,
    error: creatorLaunchesError,
    refetch: refetchCreatorLaunches,
  } = useCreatorLaunches(address);

  const fetchSingleLaunch = useCallback(async (
    launchId: number,
  ): Promise<RealLaunch | null> => {
    try {
      console.log(`📡 Fetching real contract data for launch ${launchId}`);
      
      // Note: Real contract data fetching will be handled by useRealLaunch hook
      
      // For now, we'll create a simplified launch object
      // The actual data fetching will be handled by individual useRealLaunch hooks
      const simpleLaunch: RealLaunch = {
        id: launchId.toString(),
        launchId,
        collection: '0x0000000000000000000000000000000000000000' as Address,
        creator: '0x0000000000000000000000000000000000000000' as Address,
        name: `Launch ${launchId}`,
        symbol: `L${launchId}`,
        description: `Launch ${launchId} description`,
        imageUri: '',
        maxSupply: 100,
        startTime: Date.now(),
        status: 1, // ACTIVE
        autoProgress: false,
        isActive: true,
        currentPhase: 'Active',
        totalRaised: '0',
        info: {
          status: 1,
          collection: '0x0000000000000000000000000000000000000000' as Address,
          creator: '0x0000000000000000000000000000000000000000' as Address,
          startTime: Date.now(),
          maxSupply: 100,
        },
        createdAt: new Date(),
        progress: 0,
      };
      
      return simpleLaunch;
    } catch (err) {
      console.error(`Error fetching launch ${launchId}:`, err);
      return null;
    }
  }, []);

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
  }, [fetchSingleLaunch]);

  useEffect(() => {
    const isLoading = isLoadingActive || isLoadingCreator;
    
    console.log('🔍 useRealLaunches effect triggered:', {
      isLoadingActive,
      isLoadingCreator,
      isLoading,
      activeLaunchIds,
      creatorLaunchIds,
      address
    });
    
    if (isLoading) {
      console.log('⏳ Still loading launches from contract...');
      return;
    }
    
    // Use creator launches as primary source (includes PENDING and ACTIVE)
    // Active launches only includes ACTIVE status launches
    const activeIds = activeLaunchIds && Array.isArray(activeLaunchIds) ? activeLaunchIds : [];
    const creatorIds = creatorLaunchIds && Array.isArray(creatorLaunchIds) ? creatorLaunchIds : [];
    
    // Prioritize creator launches for admin interface (shows all launches by creator)
    // Then add any additional active launches not created by this user
    const primaryIds = creatorIds.length > 0 ? creatorIds : activeIds;
    const secondaryIds = creatorIds.length > 0 ? activeIds : [];
    
    // Merge and deduplicate launch IDs
    const allIds = [...primaryIds, ...secondaryIds];
    const uniqueIds = Array.from(new Set(allIds.map(id => Number(id)))).map(id => BigInt(id));

    console.log('🔄 Fetching launches (Admin View):', {
      activeIds: activeIds.map(id => Number(id)),
      creatorIds: creatorIds.map(id => Number(id)),
      primarySource: creatorIds.length > 0 ? 'creator' : 'active',
      uniqueIds: uniqueIds.map(id => Number(id)),
      count: uniqueIds.length
    });
    
    if (uniqueIds.length === 0) {
      console.log('⚠️ No launches found in contract!');
      setLaunches([]);
      setIsLoading(false);
      return;
    }

    fetchLaunchDetails(uniqueIds);
  }, [activeLaunchIds, creatorLaunchIds, isLoadingActive, isLoadingCreator, fetchLaunchDetails, address]);

  // Handle errors
  useEffect(() => {
    const error = activeLaunchesError || creatorLaunchesError;
    if (error) {
      setError(error.message || 'Failed to fetch launches');
    }
  }, [activeLaunchesError, creatorLaunchesError]);

  const refetch = useCallback(() => {
    console.log('🔄 Refetching launches...');
    refetchActiveLaunches();
    refetchCreatorLaunches();
  }, [refetchActiveLaunches, refetchCreatorLaunches]);

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

  const {
    data: launchData,
    isLoading: isLoadingLaunch,
    error: launchError,
    refetch: refetchLaunchData,
  } = useLaunchInfo(launchId);

  useEffect(() => {
    // Handle contract errors for invalid launch IDs
    if (launchError) {
      console.error(`❌ Contract error for launch ${launchId}:`, launchError);
      setLaunch(null);
      setError(`Launch ${launchId} is invalid or corrupted`);
      setIsLoading(false);
      return;
    }

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
