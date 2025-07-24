"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { LAUNCHPAD_ABI } from '@/lib/contracts';
import { getContractAddress } from '@/lib/wagmi';

// Phase enum matching contract
export enum Phase {
  NONE = 0,
  PRESALE = 1,
  WHITELIST = 2,
  PUBLIC = 3
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
  const launchpad = useMemo(() => getContractAddress('LAUNCHPAD'), []);
  
  return useReadContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: 'launchPhases',
    args: [BigInt(launchId), phase],
    query: {
      enabled: launchId > 0 && phase > 0,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  });
};

// Hook to get current launch info including phase
export const useLaunchPhaseInfo = (launchId: number) => {
  const launchpad = useMemo(() => getContractAddress('LAUNCHPAD'), []);
  
  const { data: launchInfo } = useReadContract({
    address: launchpad,
    abi: LAUNCHPAD_ABI,
    functionName: 'launches',
    args: [BigInt(launchId)],
    query: {
      enabled: launchId > 0,
      refetchInterval: 10000, // Refetch every 10 seconds
    }
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
      { phase: Phase.PUBLIC, config: publicConfig }
    ];

    configs.forEach(({ phase, config }) => {
      if (config && config[6]) { // isConfigured is at index 6
        const startTime = Number(config[1]);
        const endTime = Number(config[2]);
        const isActive = currentPhase === phase && now >= startTime && now <= endTime;
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
            isConfigured: config[6]
          },
          isActive,
          timeRemaining,
          canMint: isActive && Number(config[5]) < Number(config[4]) // totalSold < maxSupply
        });
      }
    });

    setPhaseInfo(phases);
  }, [launchInfo, presaleConfig, whitelistConfig, publicConfig, currentPhase]);

  return {
    launchInfo,
    currentPhase,
    phases: phaseInfo,
    activePhase: phaseInfo.find(p => p.isActive),
    nextPhase: phaseInfo.find(p => p.phase > currentPhase && p.config.isConfigured)
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
    maxPerWallet: number,
    maxSupply: number
  ) => {
    const launchpad = getContractAddress('LAUNCHPAD');
    
    try {
      // Convert price from ETH to wei (multiply by 10^18)
      const priceInWei = BigInt(Math.floor(parseFloat(price) * 1e18));
      
      console.log('🔧 Configuring phase:', {
        launchId,
        phase,
        price: `${price} ETH`,
        priceInWei: priceInWei.toString(),
        startTime: new Date(startTime * 1000).toISOString(),
        endTime: new Date(endTime * 1000).toISOString(),
        maxPerWallet,
        maxSupply
      });
      
      await writeContract({
        address: launchpad,
        abi: LAUNCHPAD_ABI,
        functionName: 'configurePhase',
        args: [
          BigInt(launchId),
          phase,
          priceInWei,
          BigInt(startTime),
          BigInt(endTime),
          BigInt(maxPerWallet),
          BigInt(maxSupply)
        ],
      });
    } catch (error) {
      console.error('❌ Configure phase error:', error);
      throw error;
    }
  };

  return {
    configurePhase,
    hash,
    isPending,
    isConfirming,
    isSuccess
  };
};

// Hook to start a launch with phases
export const useStartLaunchWithPhases = () => {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const startLaunch = async (launchId: number, autoProgressPhases: boolean = true) => {
    const launchpad = getContractAddress('LAUNCHPAD');
    
    try {
      await writeContract({
        address: launchpad,
        abi: LAUNCHPAD_ABI,
        functionName: 'startLaunch',
        args: [BigInt(launchId), autoProgressPhases],
      });
    } catch (error) {
      console.error('❌ Start launch error:', error);
      throw error;
    }
  };

  return {
    startLaunch,
    hash,
    isPending,
    isConfirming,
    isSuccess
  };
};

// Hook to purchase NFT in current phase
export const usePurchaseNFT = () => {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const purchaseNFT = async (launchId: number, quantity: number, phase: Phase, pricePerNFT: string) => {
    const launchpad = getContractAddress('LAUNCHPAD');
    const totalPrice = BigInt(pricePerNFT) * BigInt(quantity);
    
    try {
      await writeContract({
        address: launchpad,
        abi: LAUNCHPAD_ABI,
        functionName: 'purchaseNFT',
        args: [BigInt(launchId), BigInt(quantity)],
        value: totalPrice,
      });
    } catch (error) {
      console.error('❌ Purchase NFT error:', error);
      throw error;
    }
  };

  return {
    purchaseNFT,
    hash,
    isPending,
    isConfirming,
    isSuccess
  };
};

// Utility functions
export const getPhaseDisplayName = (phase: Phase): string => {
  switch (phase) {
    case Phase.PRESALE:
      return 'Pre-sale';
    case Phase.WHITELIST:
      return 'Waitlist';
    case Phase.PUBLIC:
      return 'Public Sale';
    default:
      return 'Unknown';
  }
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Ended';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};
