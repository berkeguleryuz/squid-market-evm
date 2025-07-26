"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { getContractAddress } from "@/lib/wagmi";
import { LAUNCHPAD_ABI, NFT_COLLECTION_ABI } from "@/lib/contracts";
import { Address } from "viem";

// Phase enum matching contract
export enum Phase {
  NONE = 0,
  PRESALE = 1,
  WHITELIST = 2,
  PUBLIC = 3,
}

export interface PhaseConfig {
  price: bigint;
  startTime: bigint;
  endTime: bigint;
  maxPerWallet: bigint;
  maxSupply: bigint;
  totalSold: bigint;
  isConfigured: boolean;
}

export interface LaunchPhaseInfo {
  phase: Phase;
  config: PhaseConfig;
  isActive: boolean;
  timeRemaining: number;
  canMint: boolean;
}

// Hook to get phase configuration for a launch
export const usePhaseConfig = (launchId: number, phase: Phase) => {
  const launchpad = useMemo(() => getContractAddress("LAUNCHPAD"), []);

  return useReadContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: "launchPhases",
    args: [BigInt(launchId), phase],
    query: {
      enabled: launchId >= 0 && phase > 0, // Allow Launch ID 0
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });
};

// Hook to get current launch info including phase
export const useLaunchPhaseInfo = (launchId: number) => {
  const launchpad = useMemo(() => getContractAddress("LAUNCHPAD"), []);

  const { data: launchInfo } = useReadContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: "launches",
    args: [BigInt(launchId)],
    query: {
      enabled: launchId >= 0,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  const currentPhase = launchInfo ? Number(launchInfo[7]) : 0; // currentPhase is at index 7

  // Get configs for all phases
  const { data: presaleConfig } = usePhaseConfig(launchId, Phase.PRESALE);
  const { data: whitelistConfig } = usePhaseConfig(launchId, Phase.WHITELIST);
  const { data: publicConfig } = usePhaseConfig(launchId, Phase.PUBLIC);

  const [phaseInfo, setPhaseInfo] = useState<LaunchPhaseInfo[]>([]);

  useEffect(() => {
    if (!launchInfo) return;

    const now = Math.floor(Date.now() / 1000);
    const phases: LaunchPhaseInfo[] = [];

    // Process each phase
    const configs = [
      { phase: Phase.PRESALE, config: presaleConfig },
      { phase: Phase.WHITELIST, config: whitelistConfig },
      { phase: Phase.PUBLIC, config: publicConfig },
    ];

    configs.forEach(({ phase, config }) => {
      if (config && config[6]) {
        // isConfigured is at index 6
        const startTime = Number(config[1]);
        const endTime = Number(config[2]);
        const isActive =
          currentPhase === phase && now >= startTime && now <= endTime;
        const timeRemaining = isActive ? endTime - now : 0;

        phases.push({
          phase,
          config: {
            price: config[0],
            startTime: config[1],
            endTime: config[2],
            maxPerWallet: config[3],
            maxSupply: config[4],
            totalSold: config[5],
            isConfigured: config[6],
          },
          isActive,
          timeRemaining,
          canMint: isActive && Number(config[5]) < Number(config[4]), // totalSold < maxSupply
        });
      }
    });

    setPhaseInfo(phases);
  }, [launchInfo, presaleConfig, whitelistConfig, publicConfig, currentPhase]);

  return {
    launchInfo,
    currentPhase,
    phases: phaseInfo,
    activePhase: phaseInfo.find((p) => p.isActive),
    nextPhase: phaseInfo.find(
      (p) => p.phase > currentPhase && p.config.isConfigured
    ),
  };
};

// Hook to configure a phase
export const useConfigurePhase = () => {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const configurePhase = async (
    launchId: number,
    phase: Phase,
    price: string,
    startTime: number,
    endTime: number,
    maxPerWallet: number
  ) => {
    const launchpad = getContractAddress("LAUNCHPAD");

    try {
      // Convert price from ETH to wei (multiply by 10^18)
      const priceInWei = BigInt(Math.floor(parseFloat(price) * 1e18));

      console.log("🔧 Configuring phase - basic info:", {
        launchId,
        phase,
        price,
        startTime,
        endTime,
        maxPerWallet,
      });

      console.log("🔧 Price conversion:", {
        originalPrice: price,
        priceInWei: priceInWei.toString(),
      });

      // Debug contract call parameters
      console.log("🔍 Contract call debug:", {
        launchpadAddress: launchpad,
        addressType: typeof launchpad,
        addressLength: launchpad?.length,
        functionName: "configurePhase",
        argsTypes: [
          typeof BigInt(launchId),
          typeof phase,
          typeof priceInWei,
          typeof BigInt(startTime),
          typeof BigInt(endTime),
          typeof BigInt(maxPerWallet),
        ],
      });

      if (!launchpad) {
        throw new Error("❌ Launchpad address is undefined!");
      }

      if (typeof launchpad !== "string" || launchpad.length !== 42) {
        throw new Error(`❌ Invalid launchpad address format: ${launchpad}`);
      }

      await writeContract({
        address: launchpad,
        abi: LAUNCHPAD_ABI,
        functionName: "configurePhase",
        args: [
          BigInt(launchId),
          phase,
          priceInWei,
          BigInt(startTime),
          BigInt(endTime),
          BigInt(maxPerWallet),
        ],
      });
    } catch (error) {
      console.error("❌ Configure phase error:", error);
      throw error;
    }
  };

  return {
    configurePhase,
    hash,
    isPending,
    isConfirming,
    isSuccess,
  };
};

// Hook to start a launch with phases
export const useStartLaunchWithPhases = () => {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const startLaunch = async (
    launchId: number,
    autoProgressPhases: boolean = true
  ) => {
    const launchpad = getContractAddress("LAUNCHPAD");

    try {
      await writeContract({
        address: launchpad,
        abi: LAUNCHPAD_ABI,
        functionName: "startLaunch",
        args: [BigInt(launchId)],
      });
    } catch (error) {
      console.error("❌ Start launch error:", error);
      throw error;
    }
  };

  return {
    startLaunch,
    hash,
    isPending,
    isConfirming,
    isSuccess,
  };
};

// Hook to check if user is whitelisted for a specific phase
export const useWhitelistStatus = (launchId: number, phase: Phase, userAddress?: Address) => {
  const launchpad = useMemo(() => getContractAddress("LAUNCHPAD"), []);
  const { address } = useAccount();
  const addressToCheck = userAddress || address;

  return useReadContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: "isWhitelisted",
    args: [BigInt(launchId), phase, addressToCheck as Address],
    query: {
      enabled: Boolean(launchId >= 0 && phase > 0 && addressToCheck), // Allow Launch ID 0
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });
};

// Hook to purchase NFT in current phase
export const usePurchaseNFT = () => {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const { address } = useAccount();

  const purchaseNFT = async (
    launchId: number,
    quantity: number,
    phase: Phase,
    pricePerNFT: string,
    collectionAddress?: Address
  ) => {
    console.log("🔍 purchaseNFT called with:", {
      launchId,
      quantity,
      phase,
      pricePerNFT,
      collectionAddress,
    });

    try {
      if (!address) {
        throw new Error("Please connect your wallet first");
      }

      if (!collectionAddress) {
        throw new Error(
          "Collection address is required for minting. Please ensure the launch is properly configured."
        );
      }

      console.log("🎨 Using collection address:", collectionAddress);

      // pricePerNFT is already in wei format from DynamicMintButton
      const pricePerNFTWei = BigInt(pricePerNFT);
      console.log("💰 Price per NFT (wei):", pricePerNFTWei.toString());

      // Use simple incremental tokenId approach instead of fetching metadata
      console.log(`🚀 Minting ${quantity} NFT(s) for launch ${launchId}...`);
      
      const results = [];

      for (let i = 0; i < quantity; i++) {
        console.log(`🚀 Minting NFT ${i + 1}/${quantity}...`);

        // Use contract's auto-increment tokenId system
        const result = await writeContract({
          address: collectionAddress,
          abi: NFT_COLLECTION_ABI,
          functionName: "mintNFT",
          args: [address as Address, phase, ""], // Empty metadata URI - contract should handle this
          value: pricePerNFTWei,
        });

        console.log(`✅ NFT ${i + 1} mint result:`, result);
        results.push(result);

        // Small delay between mints to avoid nonce issues
        if (i < quantity - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log("✅ All NFTs minted successfully:", results);
      return results[0]; // Return first transaction hash for UI
    } catch (error) {
      console.error("❌ Purchase NFT error:", error);
      throw error;
    }
  };

  return {
    purchaseNFT,
    hash,
    isPending,
    isConfirming,
    isSuccess,
  };
};

// Utility functions
export const getPhaseDisplayName = (phase: Phase): string => {
  switch (phase) {
    case Phase.PRESALE:
      return "Pre-sale";
    case Phase.WHITELIST:
      return "Waitlist";
    case Phase.PUBLIC:
      return "Public Sale";
    default:
      return "Unknown";
  }
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return "Ended";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};
