/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRealCollection } from "@/lib/hooks/useRealCollections";
import { useBlockchainNFTs } from "@/lib/hooks/useBlockchainNFTs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,

  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Grid, List } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BuyNFTDialog } from "@/components/ui/buy-nft-dialog";
import { NFTCard } from "@/components/ui/nft-card";

export default function CollectionDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<{
    collection: string;
    tokenId: string;
    name: string;
    image: string;
    description?: string;
    collectionName?: string;
    owner?: string;
    isVerified?: boolean;
    listingPrice?: string;
    listingId?: string;
  } | null>(null);

  const { collection, loading: collectionLoading, error: collectionError } = useRealCollection(address);
  const { allNFTs, isLoading: nftsLoading, error: nftsError } = useBlockchainNFTs();
  
  // Filter NFTs for this specific collection
  const nfts = allNFTs.filter(nft => nft.collection.toLowerCase() === address.toLowerCase());

  if (collectionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading collection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (collectionError || !collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Collection Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {collectionError || "The requested collection could not be found."}
            </p>
            <Link href="/application/marketplace">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/application/marketplace">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </Link>
      </div>

      {/* Collection Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Collection Image */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 rounded-lg overflow-hidden bg-muted">
              {collection.image ? (
                <Image
                  src={collection.image}
                  alt={collection.name}
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <span className="text-4xl font-bold text-muted-foreground">
                    {collection.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Collection Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold">{collection.name}</h1>
              {collection.verified && (
                <Badge variant="default" className="bg-green-500">
                  Verified
                </Badge>
              )}
              <Badge variant="outline">{collection.symbol}</Badge>
            </div>

            {collection.description && (
              <p className="text-muted-foreground mb-6 text-lg">
                {collection.description}
              </p>
            )}

            {/* Collection Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{collection.totalSupply || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Supply</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{nfts.length}</div>
                  <div className="text-sm text-muted-foreground">Items</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">—</div>
                  <div className="text-sm text-muted-foreground">Floor Price</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">—</div>
                  <div className="text-sm text-muted-foreground">Volume</div>
                </CardContent>
              </Card>
            </div>

            {/* Collection Address */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Contract:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                {address}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* NFTs Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Items</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* NFTs Loading */}
        {nftsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading NFTs...</p>
            </div>
          </div>
        )}

        {/* NFTs Error */}
        {nftsError && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Error loading NFTs: {nftsError}</p>
          </div>
        )}

        {/* NFTs Grid */}
        {!nftsLoading && !nftsError && nfts.length > 0 && (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {nfts.map((nft) => (
              <NFTCard
                key={`${address}-${nft.tokenId}`}
                nft={{
                  collection: address,
                  tokenId: nft.tokenId.toString(),
                  name: nft.name || `${collection.name} #${nft.tokenId}`,
                  image: nft.image || '',
                  description: nft.description,
                  collectionName: collection.name,
                  owner: nft.owner || '',
                  isVerified: collection.verified
                }}
                showOwnerActions={false}
                onBuyClick={(selectedNft) => {
                  setSelectedNFT(selectedNft);
                  setBuyDialogOpen(true);
                }}
                onViewDetails={(selectedNft) => {
                  window.open(`/application/nft/${selectedNft.collection}/${selectedNft.tokenId}`, '_blank');
                }}
              />
            ))}
          </div>
        )}

        {/* No NFTs */}
        {!nftsLoading && !nftsError && nfts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No NFTs found in this collection.</p>
          </div>
        )}

        {/* All NFTs are loaded at once from blockchain */}

        {/* Loading More Skeleton */}
        {nftsLoading && nfts.length > 0 && (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6"
            : "space-y-4 mt-6"
          }>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Buy NFT Dialog */}
      {selectedNFT && (
        <BuyNFTDialog
          isOpen={buyDialogOpen}
          onClose={() => {
            setBuyDialogOpen(false);
            setSelectedNFT(null);
          }}
          nft={{
            ...selectedNFT,
            owner: selectedNFT.owner || '',
            listingPrice: selectedNFT.listingPrice || '0',
            listingId: selectedNFT.listingId || '0'
          }}
          onSuccess={() => {
            // Refresh NFTs after successful purchase
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
