"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useNFTListing } from '@/lib/hooks/useMarketplaceListings';
import { formatEther } from 'viem';

interface NFTCardProps {
  nft: {
    collection: string;
    tokenId: string;
    name: string;
    image: string;
    description?: string;
    collectionName?: string;
    owner?: string;
    isVerified?: boolean;
  };
  onListClick?: (nft: any) => void;
  onBuyClick?: (nft: any) => void;
  showOwnerActions?: boolean; // true for My NFTs page, false for marketplace
}

export function NFTCard({ nft, onListClick, onBuyClick, showOwnerActions = false }: NFTCardProps) {
  const { address: userAddress } = useAccount();
  const { listing, isListed, isLoading: listingLoading } = useNFTListing(nft.collection, nft.tokenId);
  
  const isOwner = userAddress && nft.owner && 
    userAddress.toLowerCase() === nft.owner.toLowerCase();

  const handleListClick = () => {
    onListClick?.(nft);
  };

  const handleBuyClick = () => {
    if (listing) {
      onBuyClick?.({
        ...nft,
        listingPrice: formatEther(BigInt(listing.price)),
        listingId: listing.listingId,
      });
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <Image
          src={nft.image}
          alt={nft.name}
          width={400}
          height={400}
          className="w-full h-64 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder-nft.png";
          }}
        />
        {nft.isVerified && (
          <Badge className="absolute top-2 left-2" variant="secondary">
            Verified
          </Badge>
        )}
        {isListed && (
          <Badge className="absolute top-2 right-2" variant="default">
            Listed
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{nft.name}</CardTitle>
        {nft.collectionName && (
          <CardDescription className="text-sm">
            {nft.collectionName}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {nft.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {nft.description}
          </p>
        )}
        
        {/* Price Display */}
        {isListed && listing && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="font-semibold">{formatEther(BigInt(listing.price))} ETH</span>
          </div>
        )}
        
        {/* Owner Info */}
        {nft.owner && !showOwnerActions && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">Owner</span>
            <span className="text-sm">
              {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
            </span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" size="sm" variant="outline">
            View Details
          </Button>
          
          {/* Show different buttons based on context and ownership */}
          {showOwnerActions ? (
            // My NFTs page - show list/unlist for owned NFTs
            isListed ? (
              <Button size="sm" variant="secondary" disabled={listingLoading}>
                Unlist
              </Button>
            ) : (
              <Button size="sm" onClick={handleListClick} disabled={listingLoading}>
                List for Sale
              </Button>
            )
          ) : (
            // Marketplace page - show buy button only for listed NFTs that user doesn't own
            isListed && !isOwner ? (
              <Button size="sm" onClick={handleBuyClick} disabled={listingLoading}>
                Buy Now
              </Button>
            ) : isOwner ? (
              <Button size="sm" variant="outline" disabled>
                You Own This
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                Not Listed
              </Button>
            )
          )}
          
          <Button size="sm" variant="outline">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
