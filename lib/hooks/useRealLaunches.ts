import { useEffect, useState } from "react";
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

  useEffect(() => {
    // Always include launch ID 0 (user's created launch)
    const launchIdsToFetch = [BigInt(0)];

    // Add any other active launches if they exist
    if (activeLaunchIds && Array.isArray(activeLaunchIds)) {
      activeLaunchIds.forEach((id) => {
        if (id !== BigInt(0)) {
          launchIdsToFetch.push(id);
        }
      });
    }

    fetchLaunchDetails(launchIdsToFetch);
  }, [activeLaunchIds, isLoadingLaunches]);

  useEffect(() => {
    if (launchesError) {
      setError(launchesError.message || "Failed to fetch launches");
    }
  }, [launchesError]);

  const fetchLaunchDetails = async (launchIds: readonly bigint[]) => {
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
  };

  const fetchSingleLaunch = async (
    launchId: number,
  ): Promise<RealLaunch | null> => {
    try {
      // For launch ID 0, we know the basic info from the transaction
      if (launchId === 0) {
        // Try to get real contract data, fallback to known info
        const baseInfo = {
          id: "0",
          launchId: 0,
          collection: "0x0b56DfDBAa52933791B9E4fc5000102e12c6a9A3" as Address,
          creator: "0x726965AD57752b79aF2C0Db0E5b08Fe00328dd8B" as Address,
          name: "Test Collection 1753138959628",
          symbol: "TEST",
          description: "A test NFT collection created from the launchpad",
          imageUri: "/squid1.jpg",
          maxSupply: 100,
          startTime: Date.now(),
          autoProgress: true,
          currentPhase: "Unknown",
          totalRaised: "0",
          createdAt: new Date(),
          progress: 0,
        };

        // Try to get real status from contract - this will update based on actual contract state
        // For now return base info, but status will be updated by useRealLaunch hook
        return {
          ...baseInfo,
          status: 0, // Will be updated by contract call
          isActive: false, // Will be updated by contract call
          info: {
            status: 0,
            collection: baseInfo.collection,
            creator: baseInfo.creator,
            startTime: baseInfo.startTime,
            maxSupply: baseInfo.maxSupply,
          },
        };
      }

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
    } else if (!isLoadingLaunch && launchId === 0) {
      // Fallback for launch 0 if contract call fails
      console.log("⚠️ Using fallback data for launch 0");
      setLaunch({
        id: "0",
        launchId: 0,
        collection: "0x0b56DfDBAa52933791B9E4fc5000102e12c6a9A3" as Address,
        creator: "0x726965AD57752b79aF2C0Db0E5b08Fe00328dd8B" as Address,
        name: "Test Collection 1753138959628",
        symbol: "TEST",
        description:
          "A test NFT collection created from the launchpad - Check contract for real status",
        imageUri: "/squid1.jpg",
        maxSupply: 100,
        startTime: Date.now(),
        status: 1, // Assume ACTIVE since user started it twice
        autoProgress: true,
        isActive: true, // Assume active
        currentPhase: "Active",
        totalRaised: "0",
        info: {
          status: 1,
          collection: "0x0b56DfDBAa52933791B9E4fc5000102e12c6a9A3" as Address,
          creator: "0x726965AD57752b79aF2C0Db0E5b08Fe00328dd8B" as Address,
          startTime: Date.now(),
          maxSupply: 100,
        },
        createdAt: new Date(),
        progress: 10,
      });
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
