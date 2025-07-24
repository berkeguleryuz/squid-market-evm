"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Users, Wallet, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Address } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { LAUNCHPAD_ABI } from "@/lib/contracts";
import { getContractAddress } from "@/lib/wagmi";

interface WhitelistManagerProps {
  launchId: number;
  collectionAddress: Address;
}

interface WhitelistEntry {
  address: string;
  phase: number;
  isValid: boolean;
}

export function WhitelistManager({ launchId, collectionAddress }: WhitelistManagerProps) {
  const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<number>(1); // 1=Presale, 2=Whitelist
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkAddresses, setBulkAddresses] = useState("");
  const [bulkPhase, setBulkPhase] = useState<number>(1);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Validate Ethereum address
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Add address to whitelist
  const addToWhitelist = () => {
    if (!newAddress.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }

    if (!isValidAddress(newAddress)) {
      toast.error("Invalid Ethereum address format");
      return;
    }

    // Check if address already exists for this phase
    const exists = whitelistEntries.some(
      (entry) => entry.address.toLowerCase() === newAddress.toLowerCase() && entry.phase === selectedPhase
    );

    if (exists) {
      toast.error(`Address already whitelisted for ${selectedPhase === 1 ? 'Presale' : 'Whitelist'} phase`);
      return;
    }

    const newEntry: WhitelistEntry = {
      address: newAddress,
      phase: selectedPhase,
      isValid: true,
    };

    setWhitelistEntries([...whitelistEntries, newEntry]);
    setNewAddress("");
    toast.success(`Address added to ${selectedPhase === 1 ? 'Presale' : 'Whitelist'} phase`);
  };

  // Remove address from whitelist
  const removeFromWhitelist = (index: number) => {
    const newEntries = whitelistEntries.filter((_, i) => i !== index);
    setWhitelistEntries(newEntries);
    toast.success("Address removed from whitelist");
  };

  // Process bulk addresses from textarea
  const processBulkAddresses = () => {
    if (!bulkAddresses.trim()) {
      toast.error("Please enter wallet addresses");
      return;
    }

    const addresses = bulkAddresses
      .split(/[\n,;\s]+/) // Split by newlines, commas, semicolons, or spaces
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    if (addresses.length === 0) {
      toast.error("No valid addresses found");
      return;
    }

    const validAddresses: WhitelistEntry[] = [];
    const invalidAddresses: string[] = [];

    addresses.forEach(address => {
      if (isValidAddress(address)) {
        // Check if address already exists for this phase
        const exists = whitelistEntries.some(
          entry => entry.address.toLowerCase() === address.toLowerCase() && entry.phase === bulkPhase
        );
        
        if (!exists) {
          validAddresses.push({
            address,
            phase: bulkPhase,
            isValid: true,
          });
        }
      } else {
        invalidAddresses.push(address);
      }
    });

    if (validAddresses.length > 0) {
      setWhitelistEntries([...whitelistEntries, ...validAddresses]);
      toast.success(`Added ${validAddresses.length} addresses to ${bulkPhase === 1 ? 'Presale' : 'Whitelist'} phase`);
      setBulkAddresses("");
    }

    if (invalidAddresses.length > 0) {
      toast.error(`${invalidAddresses.length} invalid addresses skipped`);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      
      // Try to parse as JSON first
      try {
        const jsonData = JSON.parse(text);
        if (Array.isArray(jsonData)) {
          // Array of addresses
          setBulkAddresses(jsonData.join('\n'));
        } else if (jsonData.addresses && Array.isArray(jsonData.addresses)) {
          // Object with addresses array
          setBulkAddresses(jsonData.addresses.join('\n'));
        } else {
          toast.error("Invalid JSON format. Expected array of addresses or object with 'addresses' array.");
          return;
        }
      } catch {
        // Not JSON, treat as plain text with addresses
        setBulkAddresses(text);
      }
      
      toast.success(`File loaded: ${file.name}`);
    } catch (error) {
      toast.error("Failed to read file");
      console.error("File upload error:", error);
    }
    
    // Reset file input
    event.target.value = "";
  };

  // Submit whitelist to contract
  const submitWhitelist = async () => {
    if (whitelistEntries.length === 0) {
      toast.error("No addresses to whitelist");
      return;
    }

    setIsProcessing(true);

    try {
      // Group addresses by phase
      const presaleAddresses = whitelistEntries
        .filter((entry) => entry.phase === 1)
        .map((entry) => entry.address as Address);
      
      const whitelistAddresses = whitelistEntries
        .filter((entry) => entry.phase === 2)
        .map((entry) => entry.address as Address);

      const launchpadAddress = getContractAddress("LAUNCHPAD");

      // Add presale addresses
      if (presaleAddresses.length > 0) {
        toast.info(`Adding ${presaleAddresses.length} addresses to Presale phase...`);
        
        await writeContract({
          address: launchpadAddress,
          abi: LAUNCHPAD_ABI,
          functionName: "addToWhitelist",
          args: [BigInt(launchId), 1, presaleAddresses], // Phase 1 = Presale
        });
      }

      // Add whitelist addresses
      if (whitelistAddresses.length > 0) {
        toast.info(`Adding ${whitelistAddresses.length} addresses to Whitelist phase...`);
        
        await writeContract({
          address: launchpadAddress,
          abi: LAUNCHPAD_ABI,
          functionName: "addToWhitelist",
          args: [BigInt(launchId), 2, whitelistAddresses], // Phase 2 = Whitelist
        });
      }

    } catch (error) {
      console.error("❌ Whitelist submission error:", error);
      toast.error(`Failed to submit whitelist: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsProcessing(false);
    }
  };

  // Handle transaction success
  if (isSuccess && isProcessing) {
    toast.success("✅ Whitelist updated successfully!");
    setWhitelistEntries([]);
    setIsProcessing(false);
  }

  const getPhaseText = (phase: number) => {
    switch (phase) {
      case 1: return "Presale";
      case 2: return "Whitelist";
      case 3: return "Public";
      default: return "Unknown";
    }
  };

  const getPhaseColor = (phase: number) => {
    switch (phase) {
      case 1: return "bg-blue-500";
      case 2: return "bg-purple-500";
      case 3: return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Whitelist Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Address</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-6 mt-6">
            {/* Add New Address */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="address">Wallet Address</Label>
                  <Input
                    id="address"
                    placeholder="0x..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className={!isValidAddress(newAddress) && newAddress ? "border-red-500" : ""}
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor="phase">Phase</Label>
                  <select
                    id="phase"
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Presale</option>
                    <option value={2}>Whitelist</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={addToWhitelist}
                    disabled={!newAddress || !isValidAddress(newAddress)}
                    className="h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="bulk" className="space-y-6 mt-6">
            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="file-upload">Upload File</Label>
                  <div className="flex gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".json,.txt,.csv"
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" className="px-3">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JSON array, TXT (one address per line), CSV
                  </p>
                </div>
                <div className="w-32">
                  <Label htmlFor="bulk-phase">Phase</Label>
                  <select
                    id="bulk-phase"
                    value={bulkPhase}
                    onChange={(e) => setBulkPhase(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Presale</option>
                    <option value={2}>Whitelist</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Textarea Input */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-addresses">Wallet Addresses</Label>
                <Textarea
                  id="bulk-addresses"
                  placeholder="Enter wallet addresses (one per line, or separated by commas/spaces):\n0x1234...\n0x5678...\n0x9abc..."
                  value={bulkAddresses}
                  onChange={(e) => setBulkAddresses(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can paste addresses separated by newlines, commas, semicolons, or spaces
                </p>
              </div>
              
              <Button
                onClick={processBulkAddresses}
                disabled={!bulkAddresses.trim()}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Process Addresses
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Current Whitelist - Always visible */}
        <div className="space-y-4 mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold">Current Whitelist ({whitelistEntries.length})</h3>
          
          {whitelistEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No addresses in whitelist yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {whitelistEntries.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span className="font-mono text-sm">{entry.address}</span>
                    <Badge variant={entry.phase === 1 ? "default" : "secondary"}>
                      {entry.phase === 1 ? "Presale" : "Whitelist"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromWhitelist(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit to Contract */}
        <div className="pt-4 border-t">
          <Button
            onClick={submitWhitelist}
            disabled={whitelistEntries.length === 0 || isProcessing || isPending || isConfirming}
            className="w-full"
          >
            {isProcessing || isPending || isConfirming ? (
              "Processing..."
            ) : (
              `Submit Whitelist to Contract (${whitelistEntries.length} addresses)`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
