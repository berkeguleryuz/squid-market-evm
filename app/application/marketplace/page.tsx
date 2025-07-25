"use client";

import { useState, useEffect } from "react";
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
import { Search, Grid, List, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const [currentPage, setCurrentPage] = useState(1);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { 
    nfts, 
    pagination, 
    isLoading, 
    error, 
    refetch 
  } = usePaginatedNFTs(currentPage, 9, verifiedOnly);

  // Filter NFTs based on search
  const filteredNFTs = nfts.filter((nft) => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.collectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (pagination.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrev) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">NFT Marketplace</h1>
        <p className="text-muted-foreground">
          Discover, collect, and trade unique digital assets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{pagination.totalItems}</div>
            <div className="text-sm text-muted-foreground">Total NFTs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{nfts.filter(nft => nft.isListed).length}</div>
            <div className="text-sm text-muted-foreground">Listed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{nfts.filter(nft => nft.isVerified).length}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {nfts.filter(nft => nft.listingPrice).length}
            </div>
            <div className="text-sm text-muted-foreground">For Sale</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search NFTs, collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={verifiedOnly ? "verified" : "all"} onValueChange={(value) => setVerifiedOnly(value === "verified")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            <SelectItem value="verified">Verified Only</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
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
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading NFTs...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error loading NFTs: {error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* NFT Grid */}
      {!isLoading && !error && (
        <>
          {filteredNFTs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No NFTs found</p>
              <Button onClick={refetch} variant="outline">
                Refresh
              </Button>
            </div>
          ) : (
            <div className={`grid gap-6 mb-8 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {filteredNFTs.map((nft) => (
                <Card key={`${nft.collection}-${nft.tokenId}`} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    {nft.isListed && (
                      <Badge className="absolute top-2 right-2" variant="default">
                        Listed
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{nft.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {nft.collectionName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {nft.description || "No description available"}
                    </p>
                    
                    {nft.listingPrice && (
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <span className="font-semibold">{nft.listingPrice} ETH</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        View Details
                      </Button>
                      {nft.isListed && (
                        <Button variant="outline" size="sm">
                          Buy Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.hasNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
