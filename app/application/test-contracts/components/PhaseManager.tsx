"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  useConfigurePhase,
  usePhaseConfig,
} from "@/lib/hooks/usePhaseManagement";
import { useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/wagmi";
import { NFT_COLLECTION_ABI } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  Loader2,
  Clock,
  DollarSign,
  Users,
  Target,
  Package,
  Play,
} from "lucide-react";
import { Address } from "viem";

// Phase definitions
const PHASES = {
  0: { name: "None", color: "bg-gray-500/20 text-gray-400", icon: "⚫" },
  1: { name: "Presale", color: "bg-blue-500/20 text-blue-400", icon: "🎯" },
  2: {
    name: "Whitelist",
    color: "bg-purple-500/20 text-purple-400",
    icon: "👥",
  },
  3: { name: "Public", color: "bg-green-500/20 text-green-400", icon: "🌍" },
};

interface PhaseManagerProps {
  selectedCollection: Address | null;
  selectedLaunch: any | null;
  isLoading: string | null;
  onLoadingChange: (loading: string | null) => void;
}

export default function PhaseManager({
  selectedCollection,
  selectedLaunch,
  isLoading,
  onLoadingChange,
}: PhaseManagerProps) {
  const { address } = useAccount();

  // Phase configuration state
  const [phaseToConfig, setPhaseToConfig] = useState(1);
  const [isSelectedPhaseExpired, setIsSelectedPhaseExpired] = useState(false);
  const [phasePrice, setPhasePrice] = useState("0.01");
  const [phaseStartTime, setPhaseStartTime] = useState("");
  const [phaseEndTime, setPhaseEndTime] = useState("");
  const [phaseMaxPerWallet, setPhaseMaxPerWallet] = useState("5");
  const [phaseMaxSupply, setPhaseMaxSupply] = useState("50");

  // Contract hooks
  const { configurePhase } = useConfigurePhase();
  const { writeContractAsync } = useWriteContract();
  const { data: phaseConfigData, refetch: refetchPhaseConfig } = usePhaseConfig(
    selectedLaunch?.launchId ?? 0,
    phaseToConfig
  );
  
  // Get phase config data for all phases to check expiration
  const { data: presaleConfigData } = usePhaseConfig(selectedLaunch?.launchId ?? 0, 1);
  const { data: whitelistConfigData } = usePhaseConfig(selectedLaunch?.launchId ?? 0, 2);
  const { data: publicConfigData } = usePhaseConfig(selectedLaunch?.launchId ?? 0, 3);

  // Set default times
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    setPhaseStartTime(oneHourLater.toISOString().slice(0, 16));
    setPhaseEndTime(oneDayLater.toISOString().slice(0, 16));
  }, []);

  // Auto-refresh phase data when phase or collection changes
  useEffect(() => {
    if (selectedCollection && phaseToConfig) {
      console.log(
        `🔄 Auto-refreshing phase ${phaseToConfig} data for collection ${selectedCollection}`
      );
      setTimeout(() => refetchPhaseConfig(), 1000);
    }
  }, [selectedCollection, phaseToConfig, refetchPhaseConfig]);

  // Check if selected phase is expired
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    let phaseData;
    
    // Get the correct phase data for selected phase
    switch (phaseToConfig) {
      case 1:
        phaseData = presaleConfigData;
        break;
      case 2:
        phaseData = whitelistConfigData;
        break;
      case 3:
        phaseData = publicConfigData;
        break;
      default:
        phaseData = null;
    }
    
    let isExpired = false;
    if (phaseData && Array.isArray(phaseData) && phaseData.length >= 7) {
      const isConfigured = phaseData[6];
      const endTime = Number(phaseData[2]);
      isExpired = isConfigured && endTime > 0 && endTime < now;
    }
    
    setIsSelectedPhaseExpired(isExpired);
  }, [phaseToConfig, presaleConfigData, whitelistConfigData, publicConfigData]);

  const handleAction = async (
    actionName: string,
    action: () => Promise<string>
  ) => {
    onLoadingChange(actionName);
    try {
      const txHash = await action();
      toast.success(`✅ ${actionName} successful! TX: ${txHash}`);

      // Refresh phase config data
      if (actionName.includes("Configure Phase")) {
        setTimeout(() => refetchPhaseConfig(), 3000);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ ${actionName} failed:`, error);
      toast.error(`❌ ${actionName} failed: ${errorMessage}`);
    } finally {
      onLoadingChange(null);
    }
  };

  const handleConfigurePhase = () =>
    handleAction("Configure Phase", async () => {
      if (!selectedCollection) throw new Error("No collection selected");

      const startTimestamp = Math.floor(
        new Date(phaseStartTime).getTime() / 1000
      );
      const endTimestamp = Math.floor(new Date(phaseEndTime).getTime() / 1000);

      // Validation
      if (startTimestamp >= endTimestamp) {
        throw new Error("Start time must be before end time");
      }

      if (parseFloat(phasePrice) <= 0) {
        throw new Error("Price must be greater than 0");
      }

      if (parseInt(phaseMaxPerWallet) <= 0) {
        throw new Error("Max per wallet must be greater than 0");
      }

      console.log(
        `🔧 Configuring ${
          PHASES[phaseToConfig as keyof typeof PHASES]?.name
        } phase for collection:`,
        selectedCollection
      );
      console.log("⚙️ Phase config:", {
        phase: phaseToConfig,
        price: phasePrice,
        startTime: new Date(startTimestamp * 1000).toLocaleString(),
        endTime: new Date(endTimestamp * 1000).toLocaleString(),
        maxPerWallet: parseInt(phaseMaxPerWallet),
        maxSupply: parseInt(phaseMaxSupply),
      });

      // Debug parameters before calling configurePhase
      if (!selectedLaunch?.launchId && selectedLaunch?.launchId !== 0) {
        throw new Error("No valid launch selected for phase configuration");
      }
      
      const params = {
        launchId: selectedLaunch.launchId, // Use exact launch ID, including 0
        phase: phaseToConfig,
        price: phasePrice.toString(), // Ensure price is always string
        startTime: startTimestamp,
        endTime: endTimestamp,
        maxPerWallet: parseInt(phaseMaxPerWallet),
        maxSupply: parseInt(phaseMaxSupply),
      };
      console.log("🔍 configurePhase parameters:", params);
      console.log("🔍 Parameter types:", {
        launchId: typeof params.launchId,
        phase: typeof params.phase,
        price: typeof params.price,
        startTime: typeof params.startTime,
        endTime: typeof params.endTime,
        maxPerWallet: typeof params.maxPerWallet,
        maxSupply: typeof params.maxSupply,
      });

      const hash = await configurePhase(
        params.launchId,
        params.phase,
        params.price,
        params.startTime,
        params.endTime,
        params.maxPerWallet
      );

      console.log("📝 Transaction hash:", hash);
      toast.info("⏳ Transaction submitted, waiting for confirmation...");

      // The success toast will be shown by the transaction receipt handler
      console.log("✅ Phase configuration transaction submitted successfully");

      return hash;
    });

  if (!selectedCollection) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Select a launch to configure phases
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Phase Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phase Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Phase Type</label>
            <Select
              value={phaseToConfig.toString()}
              onValueChange={(value) => setPhaseToConfig(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PHASES)
                  .slice(1)
                  .map(([key, phase]) => {
                    // Check if phase is expired
                    const now = Math.floor(Date.now() / 1000);
                    const phaseNum = parseInt(key);
                    let phaseData;
                    
                    // Get the correct phase data for each phase
                    switch (phaseNum) {
                      case 1:
                        phaseData = presaleConfigData;
                        break;
                      case 2:
                        phaseData = whitelistConfigData;
                        break;
                      case 3:
                        phaseData = publicConfigData;
                        break;
                      default:
                        phaseData = null;
                    }
                    
                    let isExpired = false;
                    
                    // Only consider expired if phase is configured AND end time has passed
                    if (phaseData && Array.isArray(phaseData) && phaseData.length >= 7) {
                      const isConfigured = phaseData[6]; // isConfigured flag
                      const endTime = Number(phaseData[2]);
                      // Phase is expired only if it's configured AND end time has passed
                      isExpired = isConfigured && endTime > 0 && endTime < now;
                    }
                    
                    return (
                      <SelectItem 
                        key={key} 
                        value={key}
                        disabled={isExpired}
                      >
                        <div className="flex items-center gap-2">
                          <span>{phase.icon}</span>
                          <span>{phase.name}</span>
                          {isExpired && (
                            <span className="text-xs text-red-500 ml-2">(Expired)</span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* Phase Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Price (ETH)
              </label>
              <Input
                type="number"
                step="0.001"
                placeholder="0.01"
                value={phasePrice}
                onChange={(e) => setPhasePrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Max per Wallet
              </label>
              <Input
                type="number"
                placeholder="5"
                value={phaseMaxPerWallet}
                onChange={(e) => setPhaseMaxPerWallet(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Target className="h-4 w-4 inline mr-1" />
                Phase Max Supply
              </label>
              <Input
                type="number"
                placeholder="50"
                value={phaseMaxSupply}
                onChange={(e) => setPhaseMaxSupply(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                {phaseToConfig === 1 ? "Presale Start" : phaseToConfig === 2 ? "Whitelist Start" : "Public Sale Start"}
              </label>
              <Input
                type="datetime-local"
                value={phaseStartTime}
                onChange={(e) => {
                  setPhaseStartTime(e.target.value);
                  // Auto-set end time to 24 hours later if not already set
                  if (!phaseEndTime || new Date(phaseEndTime) <= new Date(e.target.value)) {
                    const startDate = new Date(e.target.value);
                    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                    setPhaseEndTime(endDate.toISOString().slice(0, 16));
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                {phaseToConfig === 1 ? "Presale End" : phaseToConfig === 2 ? "Whitelist End" : "Public Sale End"}
              </label>
              <Input
                type="datetime-local"
                value={phaseEndTime}
                onChange={(e) => setPhaseEndTime(e.target.value)}
                min={phaseStartTime}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Phase duration: {phaseStartTime && phaseEndTime ? 
                  `${Math.round((new Date(phaseEndTime).getTime() - new Date(phaseStartTime).getTime()) / (1000 * 60 * 60))} hours` : 
                  'Set start and end times'
                }
              </p>
            </div>
          </div>

          {/* Phase Status Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Phase Status</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {phaseConfigData && Array.isArray(phaseConfigData) && phaseConfigData.length >= 7 ? (
                <>
                  <p>Current Price: {(Number(phaseConfigData[0]) / 1e18).toFixed(4)} ETH</p>
                  <p>Start Time: {new Date(Number(phaseConfigData[1]) * 1000).toLocaleString()}</p>
                  <p>End Time: {new Date(Number(phaseConfigData[2]) * 1000).toLocaleString()}</p>
                  <p>Max Per Wallet: {phaseConfigData[3]?.toString()}</p>
                  <p>Max Supply: {phaseConfigData[4]?.toString()}</p>
                  <p>Status: {phaseConfigData[6] ? '✅ Configured' : '❌ Not Configured'}</p>
                </>
              ) : (
                <p>Phase not configured yet</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleConfigurePhase}
            disabled={isLoading === "Configure Phase" || isSelectedPhaseExpired}
            className="w-full"
          >
            {isLoading === "Configure Phase" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Configuring Phase...
              </>
            ) : isSelectedPhaseExpired ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Phase Expired - Cannot Configure
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Configure {PHASES[phaseToConfig as keyof typeof PHASES]?.name} Phase
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Phase Info */}
      {phaseConfigData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge
                className={PHASES[phaseToConfig as keyof typeof PHASES]?.color}
              >
                {PHASES[phaseToConfig as keyof typeof PHASES]?.icon}{" "}
                {PHASES[phaseToConfig as keyof typeof PHASES]?.name}
              </Badge>
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {phaseConfigData && Array.isArray(phaseConfigData) ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <p className="font-medium">
                    {phaseConfigData[0]
                      ? (Number(phaseConfigData[0]) / 1e18).toFixed(4)
                      : "0"}{" "}
                    ETH
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Max per Wallet:</span>
                  <p className="font-medium">
                    {phaseConfigData[3] ? Number(phaseConfigData[3]) : "0"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Supply:</span>
                  <p className="font-medium">
                    {phaseConfigData[4] ? Number(phaseConfigData[4]) : "0"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={phaseConfigData[6] ? "default" : "secondary"}>
                    {phaseConfigData[6] ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <p>Loading phase configuration...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
