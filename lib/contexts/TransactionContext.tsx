'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { useContractContext } from './ContractContext';

interface PendingTransaction {
  hash: `0x${string}`;
  type: 'mint' | 'list' | 'buy' | 'bid' | 'create_launch' | 'configure_phase';
  description: string;
  timestamp: number;
}

interface TransactionContextType {
  // Pending transactions
  pendingTransactions: PendingTransaction[];
  
  // Add a new pending transaction
  addPendingTransaction: (tx: Omit<PendingTransaction, 'timestamp'>) => void;
  
  // Remove a completed transaction
  removePendingTransaction: (hash: `0x${string}`) => void;
  
  // Check if a specific type of transaction is pending
  isPending: (type: PendingTransaction['type']) => boolean;
  
  // Get pending transaction by hash
  getPendingTransaction: (hash: `0x${string}`) => PendingTransaction | undefined;
  
  // Transaction success handler
  onTransactionSuccess: (hash: `0x${string}`, type: PendingTransaction['type']) => void;
  
  // Transaction error handler
  onTransactionError: (hash: `0x${string}`, error: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const { triggerRefetch } = useContractContext();
  
  const addPendingTransaction = useCallback((tx: Omit<PendingTransaction, 'timestamp'>) => {
    const newTransaction: PendingTransaction = {
      ...tx,
      timestamp: Date.now(),
    };
    
    setPendingTransactions(prev => [...prev, newTransaction]);
  }, []);
  
  const removePendingTransaction = useCallback((hash: `0x${string}`) => {
    setPendingTransactions(prev => prev.filter(tx => tx.hash !== hash));
  }, []);
  
  const isPending = useCallback((type: PendingTransaction['type']) => {
    return pendingTransactions.some(tx => tx.type === type);
  }, [pendingTransactions]);
  
  const getPendingTransaction = useCallback((hash: `0x${string}`) => {
    return pendingTransactions.find(tx => tx.hash === hash);
  }, [pendingTransactions]);
  
  const onTransactionSuccess = useCallback((hash: `0x${string}`, type: PendingTransaction['type']) => {
    removePendingTransaction(hash);
    
    // Trigger appropriate refetches based on transaction type
    switch (type) {
      case 'mint':
        triggerRefetch('userNFTs');
        triggerRefetch('collections');
        break;
      case 'list':
        triggerRefetch('listings');
        triggerRefetch('userNFTs');
        break;
      case 'buy':
        triggerRefetch('listings');
        triggerRefetch('userNFTs');
        break;
      case 'bid':
        triggerRefetch('listings');
        break;
      case 'create_launch':
        triggerRefetch('launches');
        break;
      case 'configure_phase':
        triggerRefetch('launches');
        break;
    }
  }, [removePendingTransaction, triggerRefetch]);
  
  const onTransactionError = useCallback((hash: `0x${string}`, error: string) => {
    removePendingTransaction(hash);
    console.error(`Transaction ${hash} failed:`, error);
    // Could add toast notification here
  }, [removePendingTransaction]);
  
  const value: TransactionContextType = {
    pendingTransactions,
    addPendingTransaction,
    removePendingTransaction,
    isPending,
    getPendingTransaction,
    onTransactionSuccess,
    onTransactionError,
  };
  
  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactionContext() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }
  return context;
}

// Hook to watch a specific transaction
export function useTransactionWatcher(hash: `0x${string}` | undefined, type: PendingTransaction['type']) {
  const { onTransactionSuccess, onTransactionError } = useTransactionContext();
  
  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });
  
  React.useEffect(() => {
    if (isSuccess && hash) {
      onTransactionSuccess(hash, type);
    }
  }, [isSuccess, hash, type, onTransactionSuccess]);
  
  React.useEffect(() => {
    if (isError && hash && error) {
      onTransactionError(hash, error.message);
    }
  }, [isError, hash, error, onTransactionError]);
  
  return { isLoading, isSuccess, isError };
} 