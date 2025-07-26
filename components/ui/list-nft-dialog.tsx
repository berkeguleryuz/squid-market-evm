"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MARKETPLACE_ABI } from '@/lib/contracts';
import { getContractAddress } from '@/lib/wagmi';

// ERC721 ABI for approval functions
const ERC721_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getApproved",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface ListNFTDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nft: {
    collection: string;
    tokenId: string;
    name: string;
    image: string;
  };
  onSuccess?: () => void;
}

export function ListNFTDialog({ isOpen, onClose, nft, onSuccess }: ListNFTDialogProps) {
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(true);

  const marketplaceAddress = getContractAddress('MARKETPLACE');

  // Check if NFT is already approved
  const { data: approvedAddress } = useReadContract({
    address: nft.collection as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'getApproved',
    args: [BigInt(nft.tokenId)],
  });

  // Update approval status when data changes
  useEffect(() => {
    if (approvedAddress) {
      setNeedsApproval(approvedAddress.toLowerCase() !== marketplaceAddress.toLowerCase());
    }
  }, [approvedAddress, marketplaceAddress]);

  const { writeContract, data: hash, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });



  const handleListOrApprove = useCallback(async () => {
    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      // If approval is needed, approve first
      if (needsApproval) {
        setIsApproving(true);
        
        await writeContract({
          address: nft.collection as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'approve',
          args: [
            marketplaceAddress,
            BigInt(nft.tokenId),
          ],
        });
        return; // Wait for approval to complete
      }

      // If already approved, proceed with listing
      setIsLoading(true);
      
      const priceInWei = parseEther(price);
      
      await writeContract({
        address: getContractAddress('MARKETPLACE'),
        abi: MARKETPLACE_ABI,
        functionName: 'listItem',
        args: [
          nft.collection as `0x${string}`,
          BigInt(nft.tokenId),
          priceInWei,
          0, // listingType: 0 = fixed price
          BigInt(0), // auctionDuration: 0 for fixed price
        ],
      });

    } catch (error) {
      console.error('Error:', error);
      toast.error(needsApproval ? 'Failed to approve NFT' : 'Failed to list NFT');
      setIsLoading(false);
      setIsApproving(false);
    }
  }, [price, needsApproval, nft.collection, nft.tokenId, marketplaceAddress, writeContract]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      if (isApproving) {
        toast.success('NFT approved! Now listing...');
        setIsApproving(false);
        setNeedsApproval(false);
        // Auto-trigger listing after approval
        setTimeout(() => {
          handleListOrApprove();
        }, 1000);
      } else {
        toast.success('NFT listed successfully!');
        onSuccess?.();
        onClose();
        setPrice('');
        setIsLoading(false);
      }
    }
  }, [isSuccess, isApproving, onSuccess, onClose, handleListOrApprove]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast.error('Transaction failed');
      setIsLoading(false);
      setIsApproving(false);
    }
  }, [error]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>List NFT for Sale</DialogTitle>
          <DialogDescription>
            Set a price for your NFT to list it on the marketplace
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* NFT Preview */}
          <div className="flex items-center space-x-4 p-4 border rounded-lg">
            <img
              src={nft.image}
              alt={nft.name}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.jpg";
              }}
            />
            <div>
              <h3 className="font-semibold">{nft.name}</h3>
              <p className="text-sm text-muted-foreground">
                Token ID: {nft.tokenId}
              </p>
            </div>
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (ETH)</Label>
            <Input
              id="price"
              type="number"
              step="0.001"
              min="0"
              placeholder="0.1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isLoading || isConfirming}
            />
            <p className="text-xs text-muted-foreground">
              Minimum price: 0.001 ETH
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isConfirming || isApproving}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleListOrApprove}
            disabled={isLoading || isConfirming || isApproving || !price}
          >
            {isApproving || isConfirming ? 
              (needsApproval ? 'Approving...' : 'Listing...') : 
              (needsApproval ? 'Approve & List NFT' : 'List NFT')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
