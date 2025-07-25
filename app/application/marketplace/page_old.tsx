"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { usePaginatedNFTs } from '@/lib/hooks/usePaginatedNFTs';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Grid, List, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const { nfts: marketplaceNFTs, pagination, isLoading, error, nextPage, prevPage, goToPage, refetch } = usePaginatedNFTs(1, 9, true);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter and sort NFTs
  const filteredNFTs = marketplaceNFTs
    .filter((nft) => {
      const matchesSearch =
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "listed" && nft.isListed) ||
        (filterBy === "not-listed" && !nft.isListed);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price || "0") - parseFloat(b.price || "0");
        case "price-high":
          return parseFloat(b.price || "0") - parseFloat(a.price || "0");
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "newest":
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  const handleBuyNFT = async (nftId: string) => {
    console.log("Buying NFT:", nftId);
    // Will implement with marketplace contract
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>🔗 Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to browse the marketplace.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">🏪 NFT Marketplace</h1>
          <p className="text-muted-foreground">
            Discover, buy, and sell unique digital assets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search NFTs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter */}
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All NFTs</SelectItem>
                <SelectItem value="listed">Listed for Sale</SelectItem>
                <SelectItem value="not-listed">Not Listed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{marketplaceNFTs.length}</div>
            <div className="text-sm text-muted-foreground">Total NFTs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {allNFTs.filter((nft) => nft.isListed).length}
            </div>
            <div className="text-sm text-muted-foreground">Listed for Sale</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{filteredNFTs.length}</div>
            <div className="text-sm text-muted-foreground">
              Filtered Results
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {isLoadingNFTs ? "..." : "🟢"}
            </div>
            <div className="text-sm text-muted-foreground">Status</div>
          </CardContent>
        </Card>
      </div>

      {/* NFT Grid/List */}
      {isLoadingNFTs ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNFTs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              {searchTerm || filterBy !== "all"
                ? "No NFTs found matching your criteria."
                : "No NFTs available in the marketplace yet."}
            </div>
            {searchTerm || filterBy !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterBy("all");
                }}
                className="mt-4">
                Clear Filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
              : "space-y-4"
          }>
          {filteredNFTs.map((nft) => (
            <Card
              key={nft.id}
              className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                {viewMode === "grid" ? (
                  <>
                    {/* Image */}
                    <div className="aspect-square relative mb-4 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={nft.image}
                        alt={nft.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {nft.isListed && (
                        <Badge className="absolute top-2 right-2">
                          For Sale
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold truncate">{nft.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {nft.description}
                      </p>

                      {nft.price && (
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">
                            {nft.price} ETH
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleBuyNFT(nft.id)}
                            disabled={!nft.isListed}>
                            {nft.isListed ? "Buy Now" : "Not Listed"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={nft.image}
                        alt={nft.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{nft.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {nft.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {nft.isListed && <Badge size="sm">For Sale</Badge>}
                        <span className="text-xs text-muted-foreground">
                          Token #{nft.tokenId}
                        </span>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="text-right flex-shrink-0">
                      {nft.price && (
                        <div className="font-bold text-lg">{nft.price} ETH</div>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleBuyNFT(nft.id)}
                        disabled={!nft.isListed}
                        className="mt-2">
                        {nft.isListed ? "Buy" : "Not Listed"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
