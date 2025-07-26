"use client";

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
import { toast } from 'sonner';
import { MARKETPLACE_ABI } from '@/lib/contracts';
import { getContractAddress } from '@/lib/wagmi';

interface BuyNFTDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nft: {
    collection: string;
    tokenId: string;
    name: string;
    image: string;
    listingPrice?: string;
    listingId?: string;
    owner: string;
  };
  onSuccess?: () => void;
}

export function BuyNFTDialog({ isOpen, onClose, nft, onSuccess }: BuyNFTDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract, data: hash, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleBuy = async () => {
    if (!nft.listingPrice || !nft.listingId) {
      toast.error('NFT is not available for purchase');
      return;
    }

    try {
      setIsLoading(true);
      
      const priceInWei = parseEther(nft.listingPrice);
      
      await writeContract({
        address: getContractAddress('MARKETPLACE'),
        abi: MARKETPLACE_ABI,
        functionName: 'buyItem',
        args: [BigInt(nft.listingId)],
        value: priceInWei,
      });

    } catch (error) {
      console.error('Error buying NFT:', error);
      toast.error('Failed to buy NFT');
      setIsLoading(false);
    }
  };

  // Handle transaction success
  if (isSuccess) {
    toast.success('NFT purchased successfully!');
    onSuccess?.();
    onClose();
    setIsLoading(false);
  }

  // Handle transaction error
  if (error) {
    toast.error('Transaction failed');
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy NFT</DialogTitle>
          <DialogDescription>
            Confirm your purchase of this NFT
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
            <div className="flex-1">
              <h3 className="font-semibold">{nft.name}</h3>
              <p className="text-sm text-muted-foreground">
                Token ID: #{nft.tokenId}
              </p>
            </div>
          </div>

          {/* Price Display */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Purchase Price</span>
              <span className="text-2xl font-bold">{nft.listingPrice} ETH</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Platform fee (2.5%) is deducted from seller&apos;s proceeds
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• This transaction cannot be reversed</p>
            <p>• Gas fees are additional to the purchase price</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBuy}
            disabled={isLoading || isConfirming || !nft.listingPrice}
          >
            {isLoading || isConfirming ? 'Purchasing...' : `Buy for ${nft.listingPrice} ETH`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
