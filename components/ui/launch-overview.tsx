"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Coins, 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  Target,
  Activity
} from "lucide-react";
import { Address } from "viem";
import { usePhaseConfig } from "@/lib/hooks/usePhaseManagement";

interface LaunchOverviewProps {
  launchData: {
    launchId: number;
    name: string;
    symbol: string;
    description?: string;
    maxSupply: number;
    status: string;
    contractAddress: string;
    creator: string;
    imageUri?: string;
    startTime?: string | null;
    endTime?: string | null;
  };
}

interface PhaseInfo {
  phase: number;
  name: string;
  price: string;
  startTime: Date | null;
  endTime: Date | null;
  isActive: boolean;
  isConfigured: boolean;
}

export function LaunchOverview({ launchData }: LaunchOverviewProps) {
  const [mintedCount, setMintedCount] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<string>("NONE");
  const [phaseDetails, setPhaseDetails] = useState<PhaseInfo[]>([]);

  // Get phase configurations
  const { data: presaleConfig } = usePhaseConfig(launchData.launchId, 1);
  const { data: whitelistConfig } = usePhaseConfig(launchData.launchId, 2);
  const { data: publicConfig } = usePhaseConfig(launchData.launchId, 3);

  // Fetch minted count from database
  useEffect(() => {
    const fetchMintedCount = async () => {
      try {
        const response = await fetch(`/api/nft-metadata/${launchData.launchId}`);
        if (response.ok) {
          const data = await response.json();
          // Count minted NFTs
          const totalNFTs = await fetch(`/api/nft-metadata/${launchData.launchId}?includeMinted=true`);
          if (totalNFTs.ok) {
            const totalData = await totalNFTs.json();
            const totalCount = Number(totalData.totalCount) || 0;
            const remainingCount = Number(data.count) || 0;
            const minted = Math.max(0, totalCount - remainingCount);
            setMintedCount(minted);
          } else {
            setMintedCount(0);
          }
        } else {
          setMintedCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch minted count:", error);
        setMintedCount(0);
      }
    };

    if (launchData.launchId) {
      fetchMintedCount();
    }
  }, [launchData.launchId]);

  // Process phase configurations
  useEffect(() => {
    const phases: PhaseInfo[] = [];
    const configs = [
      { config: presaleConfig, phase: 1, name: "Presale" },
      { config: whitelistConfig, phase: 2, name: "Whitelist" },
      { config: publicConfig, phase: 3, name: "Public Sale" },
    ];

    let activePhase = "NONE";

    for (const { config, phase, name } of configs) {
      if (config && Array.isArray(config) && config.length >= 7) {
        const price = config[0]; // price
        const startTime = config[1]; // startTime
        const endTime = config[2]; // endTime
        const isConfigured = config[6]; // isConfigured

        if (isConfigured && price > 0) {
          const startDate = startTime > 0 ? new Date(Number(startTime) * 1000) : null;
          const endDate = endTime > 0 ? new Date(Number(endTime) * 1000) : null;
          const now = new Date();
          
          const isActive = startDate && endDate && 
            now >= startDate && now <= endDate;

          if (isActive) {
            activePhase = name.toUpperCase();
          }

          phases.push({
            phase,
            name,
            price: (Number(price) / 1e18).toString(),
            startTime: startDate,
            endTime: endDate,
            isActive: !!isActive,
            isConfigured: true,
          });
        }
      }
    }

    setPhaseDetails(phases);
    setCurrentPhase(activePhase);
  }, [presaleConfig, whitelistConfig, publicConfig]);

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE": return "bg-green-500";
      case "PENDING": return "bg-yellow-500";
      case "COMPLETED": return "bg-blue-500";
      case "CANCELLED": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase.toUpperCase()) {
      case "PRESALE": return "bg-blue-500";
      case "WHITELIST": return "bg-purple-500";
      case "PUBLIC SALE": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Launch Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Launch Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-lg font-semibold">{launchData.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Symbol</Label>
              <p className="font-mono">{launchData.symbol}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Supply</Label>
              <p>{launchData.maxSupply}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge className={`${getStatusColor(launchData.status)} text-white`}>
                {launchData.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Contract Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Launch ID</Label>
              <p className="font-mono">{launchData.launchId}</p>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Launch Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Minted / Total</p>
                <p className="text-2xl font-bold">{mintedCount || 0} / {launchData.maxSupply || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Phase</p>
                <p className="text-2xl font-bold">
                  {currentPhase === "NONE" ? "Not Started" : currentPhase}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Phase Details */}
      {phaseDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Phase Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phaseDetails.map((phase) => (
                <div
                  key={phase.phase}
                  className={`p-4 rounded-lg border-2 ${
                    phase.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getPhaseColor(phase.name)} text-white`}>
                        {phase.name}
                      </Badge>
                      {phase.isActive && (
                        <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{phase.price} ETH</p>
                      <p className="text-sm text-gray-600">per NFT</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Start Time:</p>
                      <p className="font-mono">{formatDate(phase.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Time:</p>
                      <p className="font-mono">{formatDate(phase.endTime)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cover Image */}
      {launchData.imageUri && (
        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-md mx-auto">
              <img
                src={launchData.imageUri}
                alt={launchData.name}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
