"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useNFTListing } from "@/lib/hooks/useMarketplaceListings";
import { useBlockchainNFTs } from "@/lib/hooks/useBlockchainNFTs";
import { ListNFTDialog } from "@/components/ui/list-nft-dialog";
import { BuyNFTDialog } from "@/components/ui/buy-nft-dialog";
import { formatEther } from "viem";

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address: userAddress } = useAccount();
  
  const collection = params.collection as string;
  const tokenId = params.tokenId as string;
  
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [updatePriceDialogOpen, setUpdatePriceDialogOpen] = useState(false);

  // Get all NFTs and find the specific one
  const { allNFTs, isLoading: nftsLoading } = useBlockchainNFTs();
  const nft = allNFTs.find(
    n => n.collection.toLowerCase() === collection.toLowerCase() && 
         n.tokenId.toString() === tokenId
  );

  // Get listing information
  const { listing, isListed, isLoading: listingLoading } = useNFTListing(collection, tokenId);
  
  const isOwner = userAddress && nft?.owner && 
    userAddress.toLowerCase() === nft.owner.toLowerCase();

  if (nftsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Back Button Skeleton */}
        <div className="mb-6">
          <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Skeleton */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg bg-muted animate-pulse"></div>
          </div>

          {/* Details Skeleton */}
          <div className="space-y-6">
            {/* Title Skeleton */}
            <div className="space-y-2">
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
            </div>

            {/* Price Card Skeleton */}
            <div className="border rounded-lg p-6 space-y-4">
              <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-40 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
            </div>

            {/* Details Card Skeleton */}
            <div className="border rounded-lg p-6 space-y-3">
              <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Buttons Skeleton */}
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">NFT Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The requested NFT could not be found.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleListClick = () => {
    setListDialogOpen(true);
  };

  const handleBuyClick = () => {
    setBuyDialogOpen(true);
  };

  const handleUnlistClick = async () => {
    // TODO: Implement unlist functionality
    // This would require a marketplace contract function to cancel listing
    console.log('Unlist functionality not yet implemented');
  };

  const handleUpdatePriceClick = () => {
    setUpdatePriceDialogOpen(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: nft.name || `NFT #${tokenId}`,
          text: `Check out this NFT: ${nft.name || `#${tokenId}`}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NFT Image */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {nft.image ? (
              <Image
                src={nft.image}
                alt={nft.name || `NFT #${tokenId}`}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.jpg";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <span className="text-6xl font-bold text-muted-foreground">
                  #{tokenId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* NFT Details */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">
                {nft.name || `NFT #${tokenId}`}
              </h1>
              {isListed && (
                <Badge variant="default">Listed</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Collection: {nft.collectionName || 'Unknown'}
            </p>
          </div>

          {/* Price */}
          {isListed && listing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatEther(BigInt(listing.price))} ETH
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ≈ ${(parseFloat(formatEther(BigInt(listing.price))) * 2500).toFixed(2)} USD
                </p>
              </CardContent>
            </Card>
          )}

          {/* Owner & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token ID</span>
                <span className="font-medium">#{tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract</span>
                <span className="font-medium font-mono text-sm">
                  {collection.slice(0, 6)}...{collection.slice(-4)}
                </span>
              </div>
              {nft.owner && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium font-mono text-sm">
                    {isOwner ? 'You' : `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blockchain</span>
                <span className="font-medium">Ethereum Sepolia</span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {nft.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {nft.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {isOwner ? (
              // Owner actions
              isListed ? (
                <>
                  <Button size="lg" variant="destructive" onClick={handleUnlistClick} disabled={listingLoading}>
                    Unlist NFT
                  </Button>
                  <Button size="lg" variant="secondary" onClick={handleUpdatePriceClick} disabled={listingLoading}>
                    Update Price
                  </Button>
                </>
              ) : (
                <Button size="lg" onClick={handleListClick} disabled={listingLoading}>
                  List for Sale
                </Button>
              )
            ) : (
              // Non-owner actions
              isListed ? (
                <Button size="lg" onClick={handleBuyClick} disabled={listingLoading}>
                  Buy Now
                </Button>
              ) : (
                <Button size="lg" variant="outline" disabled>
                  Not for Sale
                </Button>
              )
            )}
            
            <Button size="lg" variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            
            <Button size="lg" variant="outline" asChild>
              <Link href={`https://sepolia.etherscan.io/token/${collection}?a=${tokenId}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Etherscan
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {isOwner && (
        <ListNFTDialog
          isOpen={listDialogOpen}
          onClose={() => setListDialogOpen(false)}
          nft={{
            collection,
            tokenId,
            name: nft.name || `NFT #${tokenId}`,
            image: nft.image || '',
          }}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {!isOwner && listing && (
        <BuyNFTDialog
          isOpen={buyDialogOpen}
          onClose={() => setBuyDialogOpen(false)}
          nft={{
            collection,
            tokenId,
            name: nft.name || `NFT #${tokenId}`,
            image: nft.image || '',
            listingPrice: formatEther(BigInt(listing.price)),
            listingId: listing.listingId,
            owner: nft.owner || '',
          }}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Update Price Dialog - Simple implementation */}
      {isOwner && listing && (
        <ListNFTDialog
          isOpen={updatePriceDialogOpen}
          onClose={() => setUpdatePriceDialogOpen(false)}
          nft={{
            collection,
            tokenId,
            name: nft.name || `NFT #${tokenId}`,
            image: nft.image || '',
          }}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
