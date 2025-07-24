"use client";

import { useState, useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { Address, decodeEventLog } from "viem";
import { 
  useLaunchpadContract,
  useLaunchOperations,
} from '@/lib/hooks/useContracts';
import { LAUNCHPAD_ABI } from '@/lib/contracts';
import { useDatabaseLaunches, useDatabaseLaunch, updateLaunchStatus, DatabaseLaunch } from '@/lib/hooks/useDatabaseLaunches';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ui/image-upload";
import { BatchNFTUpload } from "@/components/ui/batch-nft-upload";
import { PhaseConfiguration } from "@/components/ui/phase-configuration";
import { toast } from "sonner";
import {
  Rocket,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Play,
  X,
  Trash2,
  Plus,
} from "lucide-react";

const STATUS_COLORS = {
  PENDING: "bg-yellow-500",
  ACTIVE: "bg-green-500", 
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-red-500",
} as const;

const STATUS_ICONS = {
  PENDING: Clock,
  ACTIVE: Rocket,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
} as const;

interface LaunchManagerProps {
  selectedLaunch: number | null;
  onLaunchSelect: (launchId: number) => void;
  onCollectionChange?: (collection: Address | null) => void;
  isLoading: string | null;
  onLoadingChange: (loading: string | null) => void;
}

export default function LaunchManagerImproved({
  selectedLaunch,
  onLaunchSelect,
  onCollectionChange,
  isLoading,
  onLoadingChange,
}: LaunchManagerProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: databaseLaunches, refetch: refetchDatabaseLaunches } = useDatabaseLaunches();
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    maxSupply: "",
    imageUrl: "",
  });

  // Contract operations
  const { createLaunch, startLaunch, completeLaunch, cancelLaunch } = useLaunchOperations();

  // Create launch handler
  const handleCreateLaunch = async () => {
    if (!address || !formData.name || !formData.symbol || !formData.maxSupply) {
      toast.error("Please fill all required fields and connect wallet");
      return;
    }

    try {
      onLoadingChange("Creating launch...");
      
      const result = await createLaunch({
        name: formData.name,
        symbol: formData.symbol,
        maxSupply: BigInt(formData.maxSupply),
        imageUrl: formData.imageUrl || `https://via.placeholder.com/400x400?text=${formData.name}`,
      });

      if (result.success && result.hash) {
        toast.success("Launch created successfully!");
        setFormData({ name: "", symbol: "", maxSupply: "", imageUrl: "" });
        setTimeout(() => refetchDatabaseLaunches(), 2000);
      } else {
        toast.error(result.error || "Failed to create launch");
      }
    } catch (error) {
      console.error("Create launch error:", error);
      toast.error("Failed to create launch");
    } finally {
      onLoadingChange(null);
    }
  };

  // Launch action handlers
  const handleStartLaunch = async (launch: DatabaseLaunch) => {
    try {
      onLoadingChange("Starting launch...");
      const result = await startLaunch(launch.launchId);
      
      if (result.success) {
        toast.success("Launch started successfully!");
        await updateLaunchStatus(launch.id, "ACTIVE");
        refetchDatabaseLaunches();
      } else {
        toast.error(result.error || "Failed to start launch");
      }
    } catch (error) {
      console.error("Start launch error:", error);
      toast.error("Failed to start launch");
    } finally {
      onLoadingChange(null);
    }
  };

  const handleCompleteLaunch = async (launch: DatabaseLaunch) => {
    try {
      onLoadingChange("Completing launch...");
      const result = await completeLaunch(launch.launchId);
      
      if (result.success) {
        toast.success("Launch completed successfully!");
        await updateLaunchStatus(launch.id, "COMPLETED");
        refetchDatabaseLaunches();
      } else {
        toast.error(result.error || "Failed to complete launch");
      }
    } catch (error) {
      console.error("Complete launch error:", error);
      toast.error("Failed to complete launch");
    } finally {
      onLoadingChange(null);
    }
  };

  const handleCancelLaunch = async (launch: DatabaseLaunch) => {
    try {
      onLoadingChange("Cancelling launch...");
      const result = await cancelLaunch(launch.launchId);
      
      if (result.success) {
        toast.success("Launch cancelled successfully!");
        await updateLaunchStatus(launch.id, "CANCELLED");
        refetchDatabaseLaunches();
      } else {
        toast.error(result.error || "Failed to cancel launch");
      }
    } catch (error) {
      console.error("Cancel launch error:", error);
      toast.error("Failed to cancel launch");
    } finally {
      onLoadingChange(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Launch Management
          </CardTitle>
          <CardDescription>
            Create new NFT collections and manage existing launches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manage" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manage">Manage Launches</TabsTrigger>
              <TabsTrigger value="create">Create New Launch</TabsTrigger>
            </TabsList>

            {/* Manage Launches Tab */}
            <TabsContent value="manage" className="space-y-6">
              {!databaseLaunches || databaseLaunches.length === 0 ? (
                <Card className="p-8 text-center">
                  <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Launches Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first NFT launch to get started
                  </p>
                  <Button onClick={() => document.querySelector('[value="create"]')?.click()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Launch
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Launch List - Left Side (2/3 width) */}
                  <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Your Launches</h3>
                      <Badge variant="outline">
                        {databaseLaunches.length} Total
                      </Badge>
                    </div>
                    
                    <div className="grid gap-3">
                      {databaseLaunches.map((launch) => (
                        <LaunchCard
                          key={launch.id}
                          launch={launch}
                          isSelected={selectedLaunch === launch.launchId}
                          onSelect={() => onLaunchSelect(launch.launchId)}
                          onStart={() => handleStartLaunch(launch)}
                          onComplete={() => handleCompleteLaunch(launch)}
                          onCancel={() => handleCancelLaunch(launch)}
                          isLoading={isLoading}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Launch Details - Right Side (1/3 width) */}
                  <div className="xl:col-span-1">
                    <LaunchDetailsPanel
                      selectedLaunch={selectedLaunch}
                      databaseLaunches={databaseLaunches}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Create Launch Tab */}
            <TabsContent value="create" className="space-y-6">
              <CreateLaunchForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateLaunch}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Launch Card Component
function LaunchCard({
  launch,
  isSelected,
  onSelect,
  onStart,
  onComplete,
  onCancel,
  isLoading,
}: {
  launch: DatabaseLaunch;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  isLoading: string | null;
}) {
  const StatusIcon = STATUS_ICONS[launch.status as keyof typeof STATUS_ICONS];
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {launch.imageUrl && (
              <img 
                src={launch.imageUrl} 
                alt={launch.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h4 className="font-semibold">{launch.name}</h4>
              <p className="text-sm text-gray-600">{launch.symbol}</p>
              <p className="text-xs text-gray-500">Supply: {launch.maxSupply}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${STATUS_COLORS[launch.status as keyof typeof STATUS_COLORS]} text-white`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {launch.status}
            </Badge>
            
            {launch.status === "PENDING" && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onStart();
                }}
                disabled={!!isLoading}
              >
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Launch Details Panel Component
function LaunchDetailsPanel({
  selectedLaunch,
  databaseLaunches,
}: {
  selectedLaunch: number | null;
  databaseLaunches: DatabaseLaunch[];
}) {
  if (selectedLaunch === null) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <CardContent className="text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Launch</h3>
          <p className="text-sm text-gray-500">
            Choose a launch from the left to manage its settings, phases, and NFTs
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedLaunchData = databaseLaunches.find(l => l.launchId === selectedLaunch);
  if (!selectedLaunchData) return null;

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {selectedLaunchData.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Collection Address</Label>
                <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                  {selectedLaunchData.collectionAddress || "Not deployed yet"}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={`${STATUS_COLORS[selectedLaunchData.status as keyof typeof STATUS_COLORS]} text-white`}>
                  {selectedLaunchData.status}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium">Max Supply</Label>
                <p className="text-sm text-gray-600">{selectedLaunchData.maxSupply}</p>
              </div>

              {selectedLaunchData.imageUrl && (
                <div>
                  <Label className="text-sm font-medium">Cover Image</Label>
                  <img 
                    src={selectedLaunchData.imageUrl} 
                    alt={selectedLaunchData.name}
                    className="w-full h-32 object-cover rounded-lg mt-2"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <PhaseConfiguration launchId={selectedLaunch} />
          </TabsContent>

          <TabsContent value="nfts" className="space-y-4">
            {selectedLaunchData.status === "ACTIVE" ? (
              <BatchNFTUpload launchId={selectedLaunch} />
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Launch Not Started</h3>
                <p className="text-sm text-gray-500">
                  Start the launch first to upload NFT metadata
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Create Launch Form Component
function CreateLaunchForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
}: {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Launch</CardTitle>
        <CardDescription>
          Set up a new NFT collection launch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name *</Label>
            <Input
              id="name"
              placeholder="My Awesome NFTs"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol *</Label>
            <Input
              id="symbol"
              placeholder="MAN"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxSupply">Max Supply *</Label>
          <Input
            id="maxSupply"
            type="number"
            placeholder="1000"
            value={formData.maxSupply}
            onChange={(e) => setFormData({ ...formData, maxSupply: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Cover Image</Label>
          <ImageUpload
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
            currentImage={formData.imageUrl}
          />
        </div>

        <Button 
          onClick={onSubmit} 
          disabled={!!isLoading || !formData.name || !formData.symbol || !formData.maxSupply}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {isLoading}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Launch
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
