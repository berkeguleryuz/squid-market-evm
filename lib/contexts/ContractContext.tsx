'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Address } from 'viem';
import { useContractAddresses } from '@/lib/hooks/useContracts';

interface ContractContextType {
  // Contract addresses
  addresses: {
    launchpad: Address | undefined;
    marketplace: Address | undefined;
    paymentHandler: Address | undefined;
  };
  
  // Refetch triggers
  refetchTriggers: {
    launches: number;
    listings: number;
    userNFTs: number;
    collections: number;
  };
  
  // Refetch functions
  triggerRefetch: (type: keyof ContractContextType['refetchTriggers']) => void;
  
  // Loading states
  isLoading: {
    launches: boolean;
    listings: boolean;
    userNFTs: boolean;
    collections: boolean;
  };
  
  setLoading: (type: keyof ContractContextType['isLoading'], loading: boolean) => void;
  
  // Error states
  errors: {
    launches: string | null;
    listings: string | null;
    userNFTs: string | null;
    collections: string | null;
  };
  
  setError: (type: keyof ContractContextType['errors'], error: string | null) => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const contractAddresses = useContractAddresses();
  
  const [refetchTriggers, setRefetchTriggers] = useState({
    launches: 0,
    listings: 0,
    userNFTs: 0,
    collections: 0,
  });
  
  const [isLoading, setIsLoadingState] = useState({
    launches: false,
    listings: false,
    userNFTs: false,
    collections: false,
  });
  
  const [errors, setErrorsState] = useState({
    launches: null as string | null,
    listings: null as string | null,
    userNFTs: null as string | null,
    collections: null as string | null,
  });
  
  const triggerRefetch = useCallback((type: keyof typeof refetchTriggers) => {
    setRefetchTriggers(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  }, []);
  
  const setLoading = useCallback((type: keyof typeof isLoading, loading: boolean) => {
    setIsLoadingState(prev => ({
      ...prev,
      [type]: loading
    }));
  }, []);
  
  const setError = useCallback((type: keyof typeof errors, error: string | null) => {
    setErrorsState(prev => ({
      ...prev,
      [type]: error
    }));
  }, []);
  
  const value: ContractContextType = {
    addresses: contractAddresses,
    refetchTriggers,
    triggerRefetch,
    isLoading,
    setLoading,
    errors,
    setError,
  };
  
  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContractContext() {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContractContext must be used within a ContractProvider');
  }
  return context;
} 