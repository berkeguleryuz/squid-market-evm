"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { Address, decodeEventLog } from "viem";
import {
  useLaunchpadContract,
  useLaunchOperations,
} from "@/lib/hooks/useContracts";
import { LAUNCHPAD_ABI } from "@/lib/contracts";
import { CONTRACT_ADDRESSES } from "@/lib/wagmi";
import {
  useDatabaseLaunches,
  useDatabaseLaunch,
  updateLaunchStatus,
  DatabaseLaunch,
} from "@/lib/hooks/useDatabaseLaunches";
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
import { WhitelistManager } from "@/components/ui/whitelist-manager";
import { LaunchOverview } from "@/components/ui/launch-overview";
import PhaseManager from "./PhaseManager";
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

export default function LaunchManagerNew({
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
  const [newLaunchImage, setNewLaunchImage] = useState("");

  // Contract hooks
  const { createLaunch, startLaunch } = useLaunchpadContract();
  const { completeLaunch, cancelLaunch } = useLaunchOperations();
  const publicClient = usePublicClient();

  // Database hooks
  const {
    launches: databaseLaunches,
    isLoading: isLoadingDatabaseLaunches,
    error: databaseLaunchesError,
    refetch: refetchDatabaseLaunches,
  } = useDatabaseLaunches();

  const { launch: selectedLaunchData, refetch: refetchSelectedLaunch } =
    useDatabaseLaunch(selectedLaunch);

  // Debug logging
  console.log("🔍 LaunchManagerNew - Database Debug:", {
    address,
    databaseLaunches,
    isLoadingDatabaseLaunches,
    databaseLaunchesError,
    selectedLaunch,
    selectedLaunchData,
  });

  // Auto-select first launch if available
  useEffect(() => {
    if (
      databaseLaunches &&
      databaseLaunches.length > 0 &&
      selectedLaunch === null
    ) {
      const firstLaunchId = databaseLaunches[0].launchId;
      console.log(`🎯 Auto-selecting first launch: ${firstLaunchId}`);
      onLaunchSelect(firstLaunchId);
    }
  }, [databaseLaunches, selectedLaunch, onLaunchSelect]);

  // Update collection when selected launch changes
  useEffect(() => {
    if (selectedLaunchData && onCollectionChange) {
      console.log(
        `🔗 Setting collection address: ${selectedLaunchData.contractAddress}`
      );
      onCollectionChange(selectedLaunchData.contractAddress as Address);
    } else if (!selectedLaunchData && onCollectionChange) {
      onCollectionChange(null);
    }
  }, [selectedLaunchData, onCollectionChange]);

  // Create new launch with event-driven database writing
  const handleCreateLaunch = async () => {
    if (!address || !newLaunchName || !newLaunchSymbol || !newLaunchSupply) {
      toast.error("Please fill all fields and connect wallet");
      return;
    }

    try {
      onLoadingChange("Creating launch...");
      console.log("🚀 Creating new launch:", {
        newLaunchName,
        newLaunchSymbol,
        newLaunchSupply,
        newLaunchImage,
      });

      const imageUrl =
        newLaunchImage || "https://via.placeholder.com/400x400?text=NFT";
      const description = `${newLaunchName} NFT Collection`;

      // Create launch on contract
      const txHash = await createLaunch(
        newLaunchName,
        newLaunchSymbol,
        description,
        imageUrl,
        parseInt(newLaunchSupply),
        true
      );

      console.log("📝 Transaction hash:", txHash);
      onLoadingChange("Waiting for confirmation...");

      // Wait for transaction receipt
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log("📋 Transaction receipt:", receipt);

      // Parse LaunchCreated event
      const launchCreatedEvent = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: LAUNCHPAD_ABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "LaunchCreated";
        } catch {
          return false;
        }
      });

      if (launchCreatedEvent) {
        const decoded = decodeEventLog({
          abi: LAUNCHPAD_ABI,
          data: launchCreatedEvent.data,
          topics: launchCreatedEvent.topics,
        });

        console.log("🎉 LaunchCreated event:", decoded);

        const { launchId, collection, creator } = decoded.args as {
          launchId: bigint;
          collection: Address;
          creator: Address;
        };

        // Save to database
        onLoadingChange("Saving to database...");
        const requestData = {
          launchId: Number(launchId),
          contractAddress: collection,
          launchpadAddress: CONTRACT_ADDRESSES.LAUNCHPAD,
          name: newLaunchName,
          symbol: newLaunchSymbol,
          description,
          imageUri: imageUrl,
          maxSupply: parseInt(newLaunchSupply),
          creator: creator,
          status: "PENDING",
          autoProgress: true,
        };

        console.log("🔍 Sending to API:", requestData);
        console.log("🔍 Field validation:", {
          launchId: !!requestData.launchId,
          contractAddress: !!requestData.contractAddress,
          launchpadAddress: !!requestData.launchpadAddress,
          name: !!requestData.name,
          symbol: !!requestData.symbol,
          maxSupply: !!requestData.maxSupply,
          creator: !!requestData.creator,
        });

        const response = await fetch("/api/launchpools", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const result = await response.json();
        if (result.success) {
          console.log("✅ Launch saved to database:", result.data);
          toast.success("Launch created and saved successfully!");
        } else {
          console.error("❌ Failed to save to database:", result.error);
          toast.warning("Launch created but failed to save to database");
        }
      } else {
        console.warn("⚠️ LaunchCreated event not found in receipt");
        toast.warning("Launch created but event not found");
      }

      // Clear form
      setNewLaunchName("");
      setNewLaunchSymbol("");
      setNewLaunchSupply("100");
      setNewLaunchImage("");

      // Refresh launches
      refetchDatabaseLaunches();
    } catch (error) {
      console.error("❌ Error creating launch:", error);
      toast.error("Failed to create launch");
    } finally {
      onLoadingChange(null);
    }
  };

  // Start launch
  const handleStartLaunch = async (launch: DatabaseLaunch) => {
    if (!address) {
      toast.error("Please connect wallet");
      return;
    }

    try {
      onLoadingChange("Starting launch...");
      console.log(`🚀 Starting launch ${launch.launchId}...`);

      await startLaunch(launch.launchId);

      // Update database status
      await updateLaunchStatus(launch.id, "ACTIVE", {
        startTime: new Date().toISOString(),
        currentPhase: "PHASE_1",
      });

      toast.success("Launch started successfully!");
      refetchSelectedLaunch();
      refetchDatabaseLaunches();
    } catch (error) {
      console.error(`❌ Error starting launch ${launch.launchId}:`, error);
      toast.error("Failed to start launch");
    } finally {
      onLoadingChange(null);
    }
  };

  // Complete launch
  const handleCompleteLaunch = async (launch: DatabaseLaunch) => {
    if (!address) {
      toast.error("Please connect wallet");
      return;
    }

    try {
      onLoadingChange("Completing launch...");
      console.log(`✅ Completing launch ${launch.launchId}...`);

      await completeLaunch(launch.launchId);

      // Update database status
      await updateLaunchStatus(launch.id, "COMPLETED", {
        endTime: new Date().toISOString(),
      });

      toast.success("Launch completed successfully!");
      refetchSelectedLaunch();
      refetchDatabaseLaunches();
    } catch (error) {
      console.error(`❌ Error completing launch ${launch.launchId}:`, error);
      toast.error("Failed to complete launch");
    } finally {
      onLoadingChange(null);
    }
  };

  // Cancel launch
  const handleCancelLaunch = async (launch: DatabaseLaunch) => {
    if (!address) {
      toast.error("Please connect wallet");
      return;
    }

    try {
      onLoadingChange("Cancelling launch...");
      console.log(`❌ Cancelling launch ${launch.launchId}...`);

      await cancelLaunch(launch.launchId);

      // Update database status
      await updateLaunchStatus(launch.id, "CANCELLED", {
        endTime: new Date().toISOString(),
      });

      toast.success("Launch cancelled successfully!");
      refetchSelectedLaunch();
      refetchDatabaseLaunches();
    } catch (error) {
      console.error(`❌ Error cancelling launch ${launch.launchId}:`, error);
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
            Launch Manager (Database-Driven)
          </CardTitle>
          <CardDescription>
            Create and manage NFT launches from database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Launch</TabsTrigger>
              <TabsTrigger value="manage">Manage Launches</TabsTrigger>
            </TabsList>

            {/* Create Launch Tab */}
            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Collection Name</Label>
                  <Input
                    id="name"
                    value={newLaunchName}
                    onChange={(e) => setNewLaunchName(e.target.value)}
                    placeholder="My NFT Collection"
                  />
                </div>
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={newLaunchSymbol}
                    onChange={(e) => setNewLaunchSymbol(e.target.value)}
                    placeholder="MNC"
                  />
                </div>
                <div>
                  <Label htmlFor="supply">Max Supply</Label>
                  <Input
                    id="supply"
                    type="number"
                    value={newLaunchSupply}
                    onChange={(e) => setNewLaunchSupply(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="md:col-span-2">
                  <ImageUpload
                    label="Collection Cover Image"
                    value={newLaunchImage}
                    onChange={setNewLaunchImage}
                    placeholder="Upload image or enter IPFS/HTTP URL"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateLaunch}
                disabled={!address || isLoading === "Creating launch..."}
                className="w-full"
              >
                {isLoading === "Creating launch..." ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    🚀 Create Launch
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Manage Launches Tab */}
            <TabsContent value="manage" className="space-y-4">
              {isLoadingDatabaseLaunches ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading launches from database...</p>
                </div>
              ) : databaseLaunchesError ? (
                <div className="text-center py-8 text-red-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Error: {databaseLaunchesError}</p>
                  <Button onClick={refetchDatabaseLaunches} className="mt-2">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              ) : !databaseLaunches || databaseLaunches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No launches found in database</p>
                  <p className="text-sm">Create a launch first</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Launch List - Left Side */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Your Launches</h3>
                      <Badge variant="outline">
                        {databaseLaunches.length} Total
                      </Badge>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
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

                  {/* Selected Launch Detail Management - Right Side */}
                  <div className="space-y-4">
                    {selectedLaunch === null ? (
                      <Card className="h-96 flex items-center justify-center">
                        <CardContent className="text-center">
                          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            Select a Launch
                          </h3>
                          <p className="text-sm text-gray-500">
                            Choose a launch from the left to manage its
                            settings, phases, and NFTs
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      (() => {
                        const selectedLaunchData = databaseLaunches.find(
                          (l) => l.launchId === selectedLaunch
                        );
                        if (!selectedLaunchData) return null;

                        return (
                          <Card className="border-2 border-blue-200">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Manage: {selectedLaunchData.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                  <TabsTrigger value="overview">
                                    Overview
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="phases"
                                    disabled={
                                      selectedLaunchData.status === "COMPLETED" ||
                                      selectedLaunchData.status === "CANCELLED"
                                    }
                                  >
                                    Phases
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="nfts"
                                    disabled={
                                      selectedLaunchData.status === "PENDING"
                                    }
                                  >
                                    NFT Upload
                                  </TabsTrigger>
                                  <TabsTrigger value="settings">
                                    Settings
                                  </TabsTrigger>
                                </TabsList>

                                {/* Overview Tab */}
                                <TabsContent
                                  value="overview"
                                  className="space-y-4"
                                >
                                  <LaunchOverview launchData={selectedLaunchData} />
                                </TabsContent>

                                {/* Phase Configuration Tab */}
                                <TabsContent
                                  value="phases"
                                  className="space-y-4"
                                >
                                  {selectedLaunchData.status === "COMPLETED" ||
                                  selectedLaunchData.status === "CANCELLED" ? (
                                    <div className="text-center py-8 text-gray-500">
                                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                      <p>
                                        Phase configuration is not available
                                        for {selectedLaunchData.status.toLowerCase()} launches
                                      </p>
                                      <p className="text-sm mt-1">
                                        Only pending and active launches can configure phases
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-6">
                                      <PhaseManager
                                        selectedCollection={
                                          selectedLaunchData.contractAddress as Address
                                        }
                                        selectedLaunch={selectedLaunchData}
                                        isLoading={isLoading}
                                        onLoadingChange={onLoadingChange}
                                      />
                                      <WhitelistManager
                                        launchId={selectedLaunchData.launchId}
                                        collectionAddress={selectedLaunchData.contractAddress as Address}
                                      />
                                    </div>
                                  )}
                                </TabsContent>

                                {/* NFT Upload Tab */}
                                <TabsContent value="nfts" className="space-y-4">
                                  {selectedLaunchData.status === "COMPLETED" ||
                                  selectedLaunchData.status === "CANCELLED" ? (
                                    <div className="text-center py-8 text-gray-500">
                                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                      <p>
                                        Cannot upload NFTs for{" "}
                                        {selectedLaunchData.status.toLowerCase()}{" "}
                                        launches
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      {selectedLaunchData.status ===
                                        "PENDING" && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                          <div className="flex items-center gap-2 text-yellow-800">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                              Launch Not Started
                                            </span>
                                          </div>
                                          <p className="text-sm text-yellow-700 mt-1">
                                            You can prepare NFT metadata now,
                                            but the launch must be started
                                            before users can mint.
                                          </p>
                                          <Button
                                            onClick={() =>
                                              handleStartLaunch(
                                                selectedLaunchData
                                              )
                                            }
                                            className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                                            disabled={isLoading !== null}
                                            size="sm"
                                          >
                                            Start Launch Now
                                          </Button>
                                        </div>
                                      )}
                                      <BatchNFTUpload
                                        launchId={selectedLaunchData.launchId}
                                        maxSupply={selectedLaunchData.maxSupply}
                                        collectionName={selectedLaunchData.name}
                                        onUpload={async (nfts) => {
                                          try {
                                            onLoadingChange("uploading-nfts");

                                            console.log(
                                              "📦 Starting Batch NFT Upload:",
                                              {
                                                launchId:
                                                  selectedLaunchData.launchId,
                                                collection:
                                                  selectedLaunchData.contractAddress,
                                                nftCount: nfts.length,
                                                firstNFT: nfts[0],
                                                hasImageData: nfts[0]?.imageData
                                                  ? "YES"
                                                  : "NO",
                                              }
                                            );

                                            toast.info(
                                              `🚀 Uploading ${nfts.length} NFTs to IPFS...`
                                            );

                                            // Upload batch NFTs to IPFS
                                            const response = await fetch(
                                              "/api/upload-batch-nfts",
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  nfts,
                                                  launchId:
                                                    selectedLaunchData.launchId,
                                                  collectionAddress:
                                                    selectedLaunchData.contractAddress,
                                                }),
                                              }
                                            );

                                            const result =
                                              await response.json();

                                            if (
                                              !response.ok ||
                                              !result.success
                                            ) {
                                              throw new Error(
                                                result.error || "Upload failed"
                                              );
                                            }

                                            console.log(
                                              "✅ Batch NFT Upload Success:",
                                              result
                                            );

                                            toast.success(
                                              `🎉 Successfully uploaded ${result.successCount}/${result.totalCount} NFTs to IPFS!`
                                            );

                                            if (result.failureCount > 0) {
                                              toast.warning(
                                                `⚠️ ${result.failureCount} NFTs failed to upload. Check console for details.`
                                              );
                                            }

                                            // TODO: Store metadata URIs in database or contract
                                            // This will be used for minting later
                                          } catch (error) {
                                            console.error(
                                              "❌ Batch NFT Upload Error:",
                                              error
                                            );
                                            toast.error(
                                              `Failed to upload NFTs: ${
                                                error instanceof Error
                                                  ? error.message
                                                  : "Unknown error"
                                              }`
                                            );
                                          } finally {
                                            onLoadingChange(null);
                                          }
                                        }}
                                        isUploading={
                                          isLoading === "uploading-nfts"
                                        }
                                      />
                                    </div>
                                  )}
                                </TabsContent>

                                {/* Settings Tab */}
                                <TabsContent
                                  value="settings"
                                  className="space-y-4"
                                >
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Launch Actions
                                      </Label>
                                      <div className="flex gap-2 mt-2">
                                        {selectedLaunchData.status ===
                                          "PENDING" && (
                                          <Button
                                            onClick={() =>
                                              handleStartLaunch(
                                                selectedLaunchData
                                              )
                                            }
                                            disabled={isLoading !== null}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            <Play className="mr-2 h-4 w-4" />
                                            Start Launch
                                          </Button>
                                        )}
                                        {selectedLaunchData.status ===
                                          "ACTIVE" && (
                                          <Button
                                            onClick={() =>
                                              handleCompleteLaunch(
                                                selectedLaunchData
                                              )
                                            }
                                            disabled={isLoading !== null}
                                            className="bg-blue-600 hover:bg-blue-700"
                                          >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Complete Launch
                                          </Button>
                                        )}
                                        {selectedLaunchData.status !==
                                          "COMPLETED" &&
                                          selectedLaunchData.status !==
                                            "CANCELLED" && (
                                            <Button
                                              onClick={() =>
                                                handleCancelLaunch(
                                                  selectedLaunchData
                                                )
                                              }
                                              disabled={isLoading !== null}
                                              variant="destructive"
                                            >
                                              <X className="mr-2 h-4 w-4" />
                                              Cancel Launch
                                            </Button>
                                          )}
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-sm font-medium">
                                        Danger Zone
                                      </Label>
                                      <div className="border border-red-200 rounded-lg p-4 mt-2">
                                        <p className="text-sm text-red-600 mb-2">
                                          These actions cannot be undone.
                                        </p>
                                        <Button
                                          variant="outline"
                                          className="text-red-600 border-red-200 hover:bg-red-50"
                                          onClick={() => {
                                            if (
                                              confirm(
                                                "Are you sure you want to remove this launch from the database?"
                                              )
                                            ) {
                                              // TODO: Implement launch deletion
                                              toast.error(
                                                "Launch deletion not implemented yet"
                                              );
                                            }
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Launch Record
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </CardContent>
                          </Card>
                        );
                      })()
                    )}
                  </div>
                </div>
              )}
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
  const StatusIcon = STATUS_ICONS[launch.status];

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">
                {launch.name} ({launch.symbol})
              </h3>
              <p className="text-sm text-gray-600">
                Launch ID: {launch.launchId} | Supply: {launch.maxSupply}
              </p>
              <p className="text-xs text-gray-500">
                Contract: {launch.contractAddress.slice(0, 10)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[launch.status]}>
              {launch.status}
            </Badge>
            <div className="flex gap-1">
              {launch.status === "PENDING" && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart();
                  }}
                  disabled={isLoading !== null}
                >
                  Start
                </Button>
              )}
              {launch.status === "ACTIVE" && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  disabled={isLoading !== null}
                >
                  Complete
                </Button>
              )}
              {(launch.status === "PENDING" || launch.status === "ACTIVE") && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                  }}
                  disabled={isLoading !== null}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
