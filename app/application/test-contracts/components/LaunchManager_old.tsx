"use client";

import { useState, useEffect } from "react";
import {
  useLaunchpadContract,
  useLaunchOperations,
  useCreatorLaunches,
} from "@/lib/hooks/useContracts";
import { useAccount } from 'wagmi';
import { useRealLaunch } from "@/lib/hooks/useRealLaunches";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, Square, X, Plus, Loader2 } from "lucide-react";
import { Address } from "viem";

// Launch status definitions
const LAUNCH_STATUS = {
  0: { name: "Pending", color: "bg-yellow-500/20 text-yellow-600", icon: "⏳" },
  1: { name: "Active", color: "bg-green-500/20 text-green-600", icon: "🟢" },
  2: { name: "Completed", color: "bg-blue-500/20 text-blue-600", icon: "✅" },
  3: { name: "Cancelled", color: "bg-red-500/20 text-red-600", icon: "❌" },
};

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
  onLoadingChange,
}: LaunchManagerProps) {
  const { address } = useAccount();
  const [newLaunchName, setNewLaunchName] = useState("");
  const [newLaunchSymbol, setNewLaunchSymbol] = useState("");
  const [newLaunchSupply, setNewLaunchSupply] = useState("100");

  // Contract hooks
  const { createLaunch, startLaunch } = useLaunchpadContract();
  const { completeLaunch, cancelLaunch } = useLaunchOperations();

  // Data hooks - Get creator launches (admin control)
  const { data: creatorLaunches, isLoading: isLoadingCreatorLaunches, error: creatorLaunchesError, refetch: refetchCreatorLaunches } = useCreatorLaunches(address);
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
    if (
      creatorLaunches &&
      creatorLaunches.length > 0 &&
      selectedLaunch === null
    ) {
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
    action: () => Promise<string>
  ) => {
    onLoadingChange(actionName);
    try {
      const txHash = await action();
      toast.success(
        `✅ ${actionName} successful! TX: ${txHash.slice(0, 10)}...`
      );

      // Refresh data after actions
      setTimeout(() => {
        refetchCreatorLaunches();
        if (selectedLaunch !== null) refetchSelectedLaunch();
      }, 3000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ ${actionName} failed:`, error);
      toast.error(`❌ ${actionName} failed: ${errorMessage}`);
    } finally {
      onLoadingChange(null);
    }
  };

  const handleCreateLaunch = () =>
    handleAction("Create Launch", async () => {
      const name = newLaunchName || `Test Collection ${Date.now()}`;
      const symbol = newLaunchSymbol || "TEST";
      const supply = parseInt(newLaunchSupply) || 100;

      // Validation
      if (supply <= 0) {
        throw new Error("Max supply must be greater than 0");
      }

      if (supply > 10000) {
        throw new Error("Max supply cannot exceed 10,000");
      }

      console.log("🚀 Creating launch with:", { name, symbol, supply });

      const hash = await createLaunch(
        name,
        symbol,
        "A test NFT collection",
        "https://example.com/test.jpg",
        supply,
        true
      );

      toast.success(`✅ Launch created! Max Supply: ${supply}`);

      return hash;
    });

  const handleStartLaunch = (launchId: number) =>
    handleAction("Start Launch", async () => {
      return await startLaunch(launchId);
    });

  const handleCompleteLaunch = (launchId: number) =>
    handleAction("Complete Launch", async () => {
      return await completeLaunch(launchId);
    });

  const handleCancelLaunch = (launchId: number) =>
    handleAction("Cancel Launch", async () => {
      return await cancelLaunch(launchId);
    });

  return (
    <div className="space-y-6">
      {/* Create New Launch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Launch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Collection Name
              </label>
              <Input
                placeholder="My NFT Collection"
                value={newLaunchName}
                onChange={(e) => setNewLaunchName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <Input
                placeholder="NFT"
                value={newLaunchSymbol}
                onChange={(e) => setNewLaunchSymbol(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Supply
              </label>
              <Input
                type="number"
                placeholder="100"
                value={newLaunchSupply}
                onChange={(e) => setNewLaunchSupply(e.target.value)}
                min="1"
                max="10000"
              />
            </div>
          </div>
          <Button
            onClick={handleCreateLaunch}
            disabled={isLoading === "Create Launch"}
            className="w-full"
          >
            {isLoading === "Create Launch" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Launch
              </>
            )}
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
            <div>Creator Launches: {creatorLaunches ? `[${creatorLaunches.map((id: any) => Number(id)).join(', ')}]` : 'null'}</div>
            <div>Count: {creatorLaunches?.length || 0}</div>
          </div>
          
          {!creatorLaunches || creatorLaunches.length === 0 ? (
            <p className="text-muted-foreground mb-4">
              No launches found. Create the first launch!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatorLaunches.map((launchId: any) => (
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
            <CardTitle>Launch Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
      <Card
        className={`cursor-pointer transition-colors ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Launch #{launchId}</h4>
          <Badge
            className={
              LAUNCH_STATUS[launch.status as keyof typeof LAUNCH_STATUS]?.color
            }
          >
            {LAUNCH_STATUS[launch.status as keyof typeof LAUNCH_STATUS]?.icon}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{launch.name}</p>

        <div className="flex gap-2">
          {launch.status === 0 && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
              disabled={isLoading === "Start Launch"}
            >
              <Play className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}

          {launch.status === 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              disabled={isLoading === "Complete Launch"}
            >
              <Square className="h-3 w-3 mr-1" />
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
              disabled={isLoading === "Cancel Launch"}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
