"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, Plus, Minus } from "lucide-react";
import { Address } from "viem";
import { usePhaseConfig, usePurchaseNFT, useWhitelistStatus, Phase } from "@/lib/hooks/usePhaseManagement";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DynamicMintButtonProps {
  launchId: number;
  collectionAddress: Address;
  launchStatus: number;
  className?: string;
}

export function DynamicMintButton({
  launchId,
  collectionAddress,
  launchStatus,
  className,
}: DynamicMintButtonProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [currentPrice, setCurrentPrice] = useState<string>("0");
  const [isMinting, setIsMinting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check phase configurations for all phases
  const { data: presaleConfig } = usePhaseConfig(launchId, 1);
  const { data: whitelistConfig } = usePhaseConfig(launchId, 2);
  const { data: publicConfig } = usePhaseConfig(launchId, 3);

  // Purchase NFT hook
  const { purchaseNFT, hash, isPending, isConfirming, isSuccess } =
    usePurchaseNFT();

  // Whitelist status checks for each phase
  const { data: isPresaleWhitelisted } = useWhitelistStatus(launchId, Phase.PRESALE);
  const { data: isWhitelistPhaseWhitelisted } = useWhitelistStatus(launchId, Phase.WHITELIST);

  // Check if user is eligible to mint in current phase
  const isEligibleToMint = () => {
    if (currentPhase === 3) {
      // Public phase - everyone can mint
      return true;
    } else if (currentPhase === 1) {
      // Presale phase - must be whitelisted
      return Boolean(isPresaleWhitelisted);
    } else if (currentPhase === 2) {
      // Whitelist phase - must be whitelisted
      return Boolean(isWhitelistPhaseWhitelisted);
    }
    return false;
  };

  // Debug logging
  console.log("🔍 DynamicMintButton Debug:", {
    launchId,
    collectionAddress,
    launchStatus,
    isConfigured,
    currentPhase,
    currentPrice,
    presaleConfig,
    whitelistConfig,
    publicConfig,
    isPresaleWhitelisted,
    isWhitelistPhaseWhitelisted,
    isEligibleToMint: isEligibleToMint(),
  });
  
  // Detailed phase config debugging
  console.log("🔍 Phase Config Details:", {
    presaleConfig: {
      raw: presaleConfig,
      isArray: Array.isArray(presaleConfig),
      length: presaleConfig?.length,
      price: presaleConfig?.[0],
      isConfigured: presaleConfig?.[6],
    },
    whitelistConfig: {
      raw: whitelistConfig,
      isArray: Array.isArray(whitelistConfig),
      length: whitelistConfig?.length,
      price: whitelistConfig?.[0],
      isConfigured: whitelistConfig?.[6],
    },
    publicConfig: {
      raw: publicConfig,
      isArray: Array.isArray(publicConfig),
      length: publicConfig?.length,
      price: publicConfig?.[0],
      isConfigured: publicConfig?.[6],
    },
  });
  
  // Detailed whitelist status debugging
  console.log("🔍 Whitelist Status Details:", {
    launchId,
    currentPhase,
    presaleWhitelist: {
      raw: isPresaleWhitelisted,
      type: typeof isPresaleWhitelisted,
      boolean: Boolean(isPresaleWhitelisted),
    },
    whitelistPhase: {
      raw: isWhitelistPhaseWhitelisted,
      type: typeof isWhitelistPhaseWhitelisted,
      boolean: Boolean(isWhitelistPhaseWhitelisted),
    },
    isEligibleResult: isEligibleToMint(),
  });

  useEffect(() => {
    setIsLoading(true);

    // Check if any phase is configured and determine current active phase based on time
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const configs = [
      { config: presaleConfig, phase: 1, name: "Presale" },
      { config: whitelistConfig, phase: 2, name: "Whitelist" },
      { config: publicConfig, phase: 3, name: "Public" },
    ];

    let hasValidPhase = false;
    let activePhase = 1;
    let activePrice = "0";
    let currentActivePhase = null;

    // Find the currently active phase based on time
    for (const { config, phase, name } of configs) {
      if (config && Array.isArray(config) && config.length >= 7) {
        const price = config[0]; // price
        const startTime = Number(config[1]); // startTime
        const endTime = Number(config[2]); // endTime
        const isConfigured = config[6]; // isConfigured

        console.log(`🕐 Phase ${phase} (${name}):`, {
          price: price?.toString(),
          startTime: new Date(startTime * 1000).toLocaleString(),
          endTime: new Date(endTime * 1000).toLocaleString(),
          now: new Date(now * 1000).toLocaleString(),
          isConfigured,
          isActive: startTime <= now && now <= endTime,
        });

        if (price && price > 0 && isConfigured && startTime <= now && now <= endTime) {
          hasValidPhase = true;
          activePhase = phase;
          activePrice = (Number(price) / 1e18).toString();
          currentActivePhase = { phase, name, startTime, endTime };
          console.log(`✅ Active phase found: ${name} (Phase ${phase})`);
          break; // Use first active phase
        }
      }
    }

    if (!currentActivePhase) {
      console.log(`⚠️ No active phase found at ${new Date(now * 1000).toLocaleString()}`);
    }

    setIsConfigured(hasValidPhase);
    setCurrentPhase(activePhase);
    setCurrentPrice(activePrice);
    setIsLoading(false);
  }, [presaleConfig, whitelistConfig, publicConfig]);

  // Handle transaction state changes
  useEffect(() => {
    if (isSuccess) {
      toast.success(`✅ Successfully minted ${quantity} NFT(s)!`);
      setIsDialogOpen(false);
      setQuantity(1);
      setIsMinting(false);
    }
  }, [isSuccess, quantity]);

  // Handle transaction confirmation
  useEffect(() => {
    if (hash && isConfirming) {
      toast.info(`⏳ Transaction submitted, waiting for confirmation...`);
    }
  }, [hash, isConfirming]);

  // Only show for active launches
  if (launchStatus !== 1) return null;

  if (isLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        <span>Checking Phase Status...</span>
      </Button>
    );
  }

  // Handle mint function
  const handleMint = async () => {
    if (!isConfigured || isMinting) return;

    setIsMinting(true);
    try {
      toast.info(`🚀 Starting mint transaction for ${quantity} NFT(s)...`);

      // Convert ETH price to wei (BigInt)
      const priceInWei = (parseFloat(currentPrice) * 1e18).toString();

      console.log("💰 Mint params:", {
        launchId,
        quantity,
        currentPhase,
        currentPrice: `${currentPrice} ETH`,
        priceInWei: `${priceInWei} wei`,
      });

      await purchaseNFT(
        launchId,
        quantity,
        currentPhase,
        priceInWei,
        collectionAddress
      );

      // Success will be handled by useEffect when isSuccess becomes true
      console.log("📝 Transaction submitted successfully");
    } catch (error) {
      console.error("❌ Mint failed:", error);
      toast.error(
        `❌ Mint failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsMinting(false); // Reset on error
    }
    // Don't reset isMinting here - it will be reset in useEffect when transaction completes
  };

  const totalPrice = (parseFloat(currentPrice) * quantity).toFixed(4);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          className={className} 
          disabled={!isConfigured || !isEligibleToMint()}
        >
          <Coins className="h-4 w-4 mr-2 text-white" />
          <span className="text-white">
            {!isConfigured 
              ? "Mint NFTs (Set Price First)"
              : !isEligibleToMint()
              ? "Not Whitelisted"
              : "Mint NFTs"
            }
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-black/20 backdrop-blur">
        <DialogHeader>
          <DialogTitle>Mint NFTs</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Button
                variant="outline"
                className="bg-black/20"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                id="quantity"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="text-center"
              />

              <Button
                variant="outline"
                className="bg-black/20"
                size="sm"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Price per NFT:</span>
              <span>{currentPrice} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{totalPrice} ETH</span>
            </div>
          </div>

          <Button
            onClick={handleMint}
            disabled={isMinting || !isConfigured}
            className="w-full"
          >
            {isMinting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Mint {quantity} NFT{quantity > 1 ? "s" : ""} for {totalPrice}{" "}
                ETH
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
