"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useUserBlockchainNFTs } from '@/lib/hooks/useBlockchainDiscovery';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Grid, List, Plus, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ListNFTDialog } from '@/components/ui/list-nft-dialog';
import { NFTCard } from '@/components/ui/nft-card';

export default function MyNFTsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<{
    collection: string;
    tokenId: string;
    name: string;
    image: string;
  } | null>(null);
  
  const { isConnected, address } = useAccount();
  const { nfts: userNFTs, isLoading, error, refetch } = useUserBlockchainNFTs(address);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Filter NFTs based on listing status and search
  const filteredNFTs = userNFTs.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.collectionName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'listed' && nft.isListed) ||
                         (filterStatus === 'unlisted' && !nft.isListed);
    
    return matchesSearch && matchesFilter;
  });

  const totalValue = userNFTs.reduce((sum: number, nft) => {
    return sum + (nft.listingPrice ? parseFloat(nft.listingPrice) : 0);
  }, 0);

  const listedCount = userNFTs.filter(nft => nft.isListed).length;

  // If wallet not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">My NFTs</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your NFT collection
          </p>
          <Button>Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My NFTs</h1>
          <p className="text-muted-foreground">
            Manage your digital collectibles
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          List NFT
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{userNFTs.length}</div>
            <div className="text-sm text-muted-foreground">Total NFTs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{listedCount}</div>
            <div className="text-sm text-muted-foreground">Listed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{userNFTs.filter(nft => nft.isVerified).length}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalValue.toFixed(2)} ETH</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search your NFTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All NFTs</SelectItem>
            <SelectItem value="listed">Listed</SelectItem>
            <SelectItem value="unlisted">Not Listed</SelectItem>
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
            <p className="text-muted-foreground">Loading your NFTs...</p>
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
              <p className="text-muted-foreground mb-4">
                {userNFTs.length === 0 
                  ? "You don't own any NFTs yet" 
                  : "No NFTs match your search criteria"
                }
              </p>
              {userNFTs.length === 0 && (
                <Link href="/application/marketplace">
                  <Button variant="outline">
                    Browse Marketplace
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {filteredNFTs.map((nft) => (
                <NFTCard
                  key={`${nft.collection}-${nft.tokenId}`}
                  nft={nft}
                  showOwnerActions={true}
                  onListClick={(selectedNft) => {
                    setSelectedNFT(selectedNft);
                    setListDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {/* List NFT Dialog */}
      {selectedNFT && (
        <ListNFTDialog
          isOpen={listDialogOpen}
          onClose={() => {
            setListDialogOpen(false);
            setSelectedNFT(null);
          }}
          nft={selectedNFT}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
