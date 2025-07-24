'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  useLaunchpadContract,
  useLaunchOperations,
  useCreatorLaunches,
} from '@/lib/hooks/useContracts';
import { useRealLaunch } from '@/lib/hooks/useRealLaunches';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Rocket, Play, Square, CheckCircle, XCircle } from 'lucide-react';
import { Address } from 'viem';

// Launch status mapping
const LAUNCH_STATUS = {
  0: { name: 'Created', color: 'bg-gray-500' },
  1: { name: 'Started', color: 'bg-blue-500' },
  2: { name: 'Completed', color: 'bg-green-500' },
  3: { name: 'Cancelled', color: 'bg-red-500' },
} as const;

interface LaunchManagerProps {
  selectedLaunch: number | null;
  onLaunchSelect: (launchId: number) => void;
  onCollectionChange?: (collection: Address | null) => void;
  isLoading: string | null;
  onLoadingChange: (loading: string | null) => void;
}

export default function LaunchManager({ 
  selectedLaunch, 
  onLaunchSelect, 
  onCollectionChange,
  isLoading, 
  onLoadingChange 
}: LaunchManagerProps) {
  const { address } = useAccount();
  const [newLaunchName, setNewLaunchName] = useState('');
  const [newLaunchSymbol, setNewLaunchSymbol] = useState('');
  const [newLaunchSupply, setNewLaunchSupply] = useState('100');

  // Contract hooks
  const { createLaunch, startLaunch } = useLaunchpadContract();
  const { completeLaunch, cancelLaunch } = useLaunchOperations();
  
  // Data hooks - Get creator launches (admin control)
  const { 
    data: creatorLaunches, 
    isLoading: isLoadingCreatorLaunches, 
    error: creatorLaunchesError, 
    refetch: refetchCreatorLaunches 
  } = useCreatorLaunches(address);
  
  const { launch: selectedLaunchData, refetch: refetchSelectedLaunch } = useRealLaunch(selectedLaunch || 0);

  // Debug logging
  console.log('🔍 LaunchManager - Creator Launches Debug:', {
    address,
    creatorLaunches,
    isLoadingCreatorLaunches,
    creatorLaunchesError,
    selectedLaunch,
    selectedLaunchData
  });

  // Auto-select first launch if available
  useEffect(() => {
    if (creatorLaunches && creatorLaunches.length > 0 && selectedLaunch === null) {
      const firstLaunch = Number(creatorLaunches[0]);
      onLaunchSelect(firstLaunch);
    }
  }, [creatorLaunches, selectedLaunch, onLaunchSelect]);

  // Notify parent when collection address changes
  useEffect(() => {
    if (selectedLaunchData?.collection && onCollectionChange) {
      onCollectionChange(selectedLaunchData.collection);
    }
  }, [selectedLaunchData?.collection, onCollectionChange]);

  const handleAction = async (
    actionName: string,
    action: () => Promise<string>,
    successMessage: string
  ) => {
    onLoadingChange(actionName);
    try {
      const txHash = await action();
      toast.success(`${successMessage}! Tx: ${txHash.slice(0, 10)}...`);

      // Refresh data after actions
      setTimeout(() => {
        refetchCreatorLaunches();
        if (selectedLaunch !== null) refetchSelectedLaunch();
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to ${actionName.toLowerCase()}: ${errorMessage}`);
    } finally {
      onLoadingChange(null);
    }
  };

  const handleCreateLaunch = async () => {
    if (!newLaunchName || !newLaunchSymbol || !newLaunchSupply) {
      toast.error('Please fill all fields');
      return;
    }

    await handleAction(
      'create',
      () => createLaunch({
        name: newLaunchName,
        symbol: newLaunchSymbol,
        description: `${newLaunchName} NFT Collection`,
        imageUri: 'https://via.placeholder.com/400x400?text=NFT',
        maxSupply: BigInt(newLaunchSupply),
        autoProgress: false
      }),
      'Launch created successfully'
    );

    // Clear form
    setNewLaunchName('');
    setNewLaunchSymbol('');
    setNewLaunchSupply('100');
  };

  const handleStartLaunch = async (launchId: number) => {
    await handleAction(
      'start',
      () => startLaunch({ launchId: BigInt(launchId) }),
      'Launch started successfully'
    );
  };

  const handleCompleteLaunch = async (launchId: number) => {
    await handleAction(
      'complete',
      () => completeLaunch({ launchId: BigInt(launchId) }),
      'Launch completed successfully'
    );
  };

  const handleCancelLaunch = async (launchId: number) => {
    await handleAction(
      'cancel',
      () => cancelLaunch({ launchId: BigInt(launchId) }),
      'Launch cancelled successfully'
    );
  };

  return (
    <div className="space-y-6">
      {/* Create New Launch */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Create New Launch</CardTitle>
          <CardDescription>
            Create a new NFT collection launch with custom parameters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Collection Name</label>
              <Input
                placeholder="e.g., Cool Cats"
                value={newLaunchName}
                onChange={(e) => setNewLaunchName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Symbol</label>
              <Input
                placeholder="e.g., COOL"
                value={newLaunchSymbol}
                onChange={(e) => setNewLaunchSymbol(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Supply</label>
              <Input
                type="number"
                placeholder="100"
                value={newLaunchSupply}
                onChange={(e) => setNewLaunchSupply(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={handleCreateLaunch}
            disabled={isLoading === 'create'}
            className="w-full"
          >
            {isLoading === 'create' ? 'Creating...' : '🚀 Create Launch'}
          </Button>
        </CardContent>
      </Card>

      {/* Your Launches (Admin) */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Your Launches (Admin)</CardTitle>
          <CardDescription>
            Manage your NFT launches - create, start, complete, or cancel them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm">
            <div className="font-semibold mb-2">🔍 Debug Info:</div>
            <div>Loading: {isLoadingCreatorLaunches ? 'Yes' : 'No'}</div>
            <div>Error: {creatorLaunchesError ? creatorLaunchesError.message : 'None'}</div>
            <div>Creator Launches: {creatorLaunches ? `[${creatorLaunches.map(id => Number(id)).join(', ')}]` : 'null'}</div>
            <div>Count: {creatorLaunches?.length || 0}</div>
          </div>
          
          {!creatorLaunches || creatorLaunches.length === 0 ? (
            <p className="text-muted-foreground mb-4">
              No launches found. Create the first launch!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatorLaunches.map((launchId) => (
                <LaunchCard
                  key={Number(launchId)}
                  launchId={Number(launchId)}
                  isSelected={selectedLaunch === Number(launchId)}
                  onSelect={() => onLaunchSelect(Number(launchId))}
                  onStart={() => handleStartLaunch(Number(launchId))}
                  onComplete={() => handleCompleteLaunch(Number(launchId))}
                  onCancel={() => handleCancelLaunch(Number(launchId))}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Launch Details */}
      {selectedLaunchData && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Launch Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{selectedLaunchData.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Symbol:</span>
                <p className="font-medium">{selectedLaunchData.symbol}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Max Supply:</span>
                <p className="font-medium">{selectedLaunchData.maxSupply}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  className={
                    LAUNCH_STATUS[
                      selectedLaunchData.status as keyof typeof LAUNCH_STATUS
                    ]?.color
                  }
                >
                  {
                    LAUNCH_STATUS[
                      selectedLaunchData.status as keyof typeof LAUNCH_STATUS
                    ]?.name
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Launch Card Component
function LaunchCard({
  launchId,
  isSelected,
  onSelect,
  onStart,
  onComplete,
  onCancel,
  isLoading,
}: {
  launchId: number;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  isLoading: string | null;
}) {
  const { launch } = useRealLaunch(launchId);

  if (!launch) {
    return (
      <Card className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            Loading launch {launchId}...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">#{launchId}</h3>
            <Badge
              className={
                LAUNCH_STATUS[launch.status as keyof typeof LAUNCH_STATUS]?.color
              }
            >
              {LAUNCH_STATUS[launch.status as keyof typeof LAUNCH_STATUS]?.name}
            </Badge>
          </div>
          
          <div>
            <p className="font-medium">{launch.name}</p>
            <p className="text-sm text-muted-foreground">{launch.symbol}</p>
          </div>

          <div className="flex gap-2">
            {launch.status === 0 && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onStart();
                }}
                disabled={isLoading === 'start'}
              >
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
            
            {launch.status === 1 && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                disabled={isLoading === 'complete'}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Button>
            )}
            
            {(launch.status === 0 || launch.status === 1) && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                disabled={isLoading === 'cancel'}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
