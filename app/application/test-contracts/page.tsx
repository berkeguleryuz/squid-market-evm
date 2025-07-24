"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import { Address } from "viem";

// Import our new modular components
import LaunchManagerNew from "./components/LaunchManagerNew";
import PhaseManager from "./components/PhaseManager";
import SupplyMonitor from "./components/SupplyMonitor";

export default function TestContractsPage() {
  const { address, isConnected } = useAccount();
  const [selectedLaunch, setSelectedLaunch] = useState<number | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>🔗 Wallet Connection Required</CardTitle>
            <CardDescription>
              Please connect your wallet to manage your NFT launches on Sepolia testnet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">🧪 Test Contracts</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create and manage your NFT launches, configure phases, and monitor collection stats.
          All operations are performed on the Sepolia testnet.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Connected:</span>
          <code className="bg-muted px-2 py-1 rounded text-xs">{address}</code>
          <Button variant="ghost" size="sm" asChild>
            <a
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View on Etherscan
            </a>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="launches" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="launches">Launch Management</TabsTrigger>
          <TabsTrigger value="phases">Phase Configuration</TabsTrigger>
          <TabsTrigger value="monitor">Supply Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="launches" className="space-y-6">
          <LaunchManagerNew
            selectedLaunch={selectedLaunch}
            onLaunchSelect={(launchId) => {
              setSelectedLaunch(launchId);
            }}
            onCollectionChange={(collection) => {
              setSelectedCollection(collection);
            }}
            isLoading={isLoading}
            onLoadingChange={setIsLoading}
          />
        </TabsContent>

        <TabsContent value="phases" className="space-y-6">
          <PhaseManager
            selectedCollection={selectedCollection}
            isLoading={isLoading}
            onLoadingChange={setIsLoading}
          />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <SupplyMonitor collectionAddress={selectedCollection} />
        </TabsContent>
      </Tabs>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>🐛 Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Wallet Connected:</span>
                <p className="font-mono">{isConnected ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Wallet Address:</span>
                <p className="font-mono text-xs">{address || 'None'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Selected Launch:</span>
                <p className="font-mono">{selectedLaunch ?? 'None'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Selected Collection:</span>
                <p className="font-mono text-xs">{selectedCollection ?? 'None'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Loading State:</span>
                <p className="font-mono">{isLoading ?? 'None'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Network:</span>
                <p className="font-mono">Sepolia Testnet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
