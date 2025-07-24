import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';

export interface DatabaseLaunch {
  id: string;
  launchId: number;
  contractAddress: Address;
  launchpadAddress: Address;
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  maxSupply: number;
  creator: Address;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: string | null;
  endTime: string | null;
  totalRaised: string;
  currentPhase: string;
  autoProgress: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useDatabaseLaunches() {
  const [launches, setLaunches] = useState<DatabaseLaunch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLaunches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🗄️ Fetching launches from database...');
      
      const response = await fetch('/api/launchpools');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch launches');
      }

      console.log('✅ Database launches fetched:', result.data);
      setLaunches(result.data);
    } catch (err) {
      console.error('❌ Error fetching database launches:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch launches');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLaunches();
  }, [fetchLaunches]);

  const refetch = useCallback(() => {
    console.log('🔄 Refetching database launches...');
    fetchLaunches();
  }, [fetchLaunches]);

  return {
    launches,
    isLoading,
    error,
    refetch,
  };
}

export function useDatabaseLaunch(launchId: number | null) {
  const [launch, setLaunch] = useState<DatabaseLaunch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLaunch = useCallback(async () => {
    if (launchId === null) {
      setLaunch(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🗄️ Fetching launch ${launchId} from database...`);
      
      const response = await fetch('/api/launchpools');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch launch');
      }

      const foundLaunch = result.data.find((l: DatabaseLaunch) => l.launchId === launchId);
      
      if (!foundLaunch) {
        throw new Error(`Launch ${launchId} not found in database`);
      }

      console.log(`✅ Database launch ${launchId} fetched:`, foundLaunch);
      setLaunch(foundLaunch);
    } catch (err) {
      console.error(`❌ Error fetching launch ${launchId}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch launch');
      setLaunch(null);
    } finally {
      setIsLoading(false);
    }
  }, [launchId]);

  useEffect(() => {
    fetchLaunch();
  }, [fetchLaunch]);

  const refetch = useCallback(() => {
    console.log(`🔄 Refetching launch ${launchId}...`);
    fetchLaunch();
  }, [fetchLaunch]);

  return {
    launch,
    isLoading,
    error,
    refetch,
  };
}

// Helper function to update launch status in database
export async function updateLaunchStatus(
  launchId: string,
  status: string,
  additionalData?: {
    startTime?: string;
    endTime?: string;
    currentPhase?: string;
    totalRaised?: string;
  }
) {
  try {
    console.log(`🔄 Updating launch ${launchId} status to ${status}...`);
    
    const response = await fetch('/api/launchpools', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: launchId,
        status,
        ...additionalData,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to update launch status');
    }

    console.log(`✅ Launch ${launchId} status updated:`, result.data);
    return result.data;
  } catch (error) {
    console.error(`❌ Error updating launch ${launchId}:`, error);
    throw error;
  }
}
