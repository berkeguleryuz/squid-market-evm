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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MARKETPLACE_ABI } from '@/lib/contracts';
import { getContractAddress } from '@/lib/wagmi';

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

  const { writeContract, data: hash, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleList = async () => {
    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
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
      console.error('Error listing NFT:', error);
      toast.error('Failed to list NFT');
      setIsLoading(false);
    }
  };

  // Handle transaction success
  if (isSuccess) {
    toast.success('NFT listed successfully!');
    onSuccess?.();
    onClose();
    setPrice('');
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
                target.src = "/placeholder-nft.png";
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
            disabled={isLoading || isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleList}
            disabled={isLoading || isConfirming || !price}
          >
            {isLoading || isConfirming ? 'Listing...' : 'List NFT'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
