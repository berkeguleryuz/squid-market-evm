'use client';

import { Header } from '@/components/header';
import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Grid3X3, 
  List, 
  Search,
  MoreVertical,
  ExternalLink,
  Edit,
  Share,
  Heart,
  Coins,
  Tag,
  TrendingUp,
  Plus,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useUserBlockchainNFTs } from '@/lib/hooks/useBlockchainNFTs';
import { BlockchainNFT } from '@/lib/hooks/useBlockchainNFTs';
import { useTransactionContext } from '@/lib/contexts/TransactionContext';
import { toast } from 'sonner';

export default function MyNFTsPage() {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { isConnected } = useAccount();
  const { userNFTs, isLoading, error, refetch } = useUserBlockchainNFTs();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="loading-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Filter NFTs based on listing status and search
  const filteredNFTs = userNFTs.filter((nft: BlockchainNFT) => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.collection.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'listed' && nft.isListed) ||
                         (filter === 'unlisted' && !nft.isListed);
    
    return matchesSearch && matchesFilter;
  });

  const totalValue = userNFTs.reduce((sum: number, nft: BlockchainNFT) => {
    return sum + (nft.listingPrice ? parseFloat(nft.listingPrice) : 0);
  }, 0);

  const listedCount = userNFTs.filter((nft: BlockchainNFT) => nft.isListed).length;

  // If wallet not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="pt-32 pb-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <Wallet className="h-24 w-24 mx-auto mb-6 text-white/40" />
              <h1 className="font-exo2 text-4xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="font-inter text-white/60 mb-8">
                Connect your wallet to view and manage your NFT collection
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-0 cyber-grid opacity-20"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h1 className="font-exo2 text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">My Collection</span>
            </h1>
            <p className="font-inter text-xl text-white/70 max-w-3xl mx-auto">
              Manage your NFT portfolio, track performance, and discover new opportunities.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="glass p-6 rounded-xl text-center">
              <Wallet className="h-8 w-8 text-neon-cyan mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-2">{userNFTs.length}</div>
              <div className="text-white/60 text-sm">Owned NFTs</div>
            </div>
            <div className="glass p-6 rounded-xl text-center">
              <Tag className="h-8 w-8 text-neon-purple mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-2">{listedCount}</div>
              <div className="text-white/60 text-sm">Listed</div>
            </div>
            <div className="glass p-6 rounded-xl text-center">
              <TrendingUp className="h-8 w-8 text-neon-pink mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-2">{totalValue.toFixed(1)}</div>
              <div className="text-white/60 text-sm">Total Value (ETH)</div>
            </div>
            <div className="glass p-6 rounded-xl text-center">
              <Coins className="h-8 w-8 text-neon-green mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-2">-</div>
              <div className="text-white/60 text-sm">Floor Price</div>
            </div>
          </div>

          {/* Controls */}
          <div className="glass p-6 rounded-2xl border border-white/10 mb-8">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full lg:w-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search your NFTs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white focus:outline-none focus:border-neon-cyan/50"
                >
                  <option value="all">All NFTs</option>
                  <option value="listed">Listed</option>
                  <option value="unlisted">Not Listed</option>
                </select>

                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
                </button>

                <Link
                  href="/create"
                  className="btn-cyber px-6 py-3 rounded-xl font-inter font-semibold flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create NFT</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NFTs Grid */}
      <section className="pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-20">
              <Loader2 className="h-12 w-12 mx-auto mb-6 animate-spin text-neon-cyan" />
              <h3 className="font-exo2 text-2xl font-bold mb-4 text-white">Loading Your NFTs...</h3>
              <p className="font-inter text-white/60">Scanning your wallet for NFTs</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <Wallet className="h-10 w-10 text-red-400" />
              </div>
              <h3 className="font-exo2 text-2xl font-bold mb-4 text-white">Failed to Load</h3>
              <p className="font-inter text-white/60 mb-8">{error}</p>
              <button 
                onClick={refetch}
                className="btn-cyber px-6 py-3 rounded-xl font-inter font-semibold"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No NFTs */}
          {!isLoading && !error && filteredNFTs.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <Wallet className="h-10 w-10 text-white/40" />
              </div>
              <h3 className="font-exo2 text-2xl font-bold mb-4 text-white">
                {searchQuery ? 'No NFTs Found' : 'No NFTs in Your Wallet'}
              </h3>
              <p className="font-inter text-white/60 mb-8">
                {searchQuery 
                  ? 'Try adjusting your search' 
                  : 'Start building your collection today'
                }
              </p>
              {!searchQuery && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/marketplace"
                    className="btn-cyber px-8 py-4 rounded-xl font-inter font-semibold inline-flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Browse Marketplace</span>
                  </Link>
                  <Link
                    href="/create"
                    className="glass px-8 py-4 rounded-xl font-inter font-semibold text-white hover:bg-white/10 transition-all inline-flex items-center space-x-2"
                  >
                    <Edit className="h-5 w-5" />
                    <span>Create NFT</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* NFTs Grid */}
          {!isLoading && !error && filteredNFTs.length > 0 && (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {filteredNFTs.map((nft) => (
                <UserNFTCard key={`${nft.collection}-${nft.tokenId}`} nft={nft} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface UserNFTCardProps {
  nft: UserNFT;
  viewMode: 'grid' | 'list';
}

function UserNFTCard({ nft, viewMode }: UserNFTCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleListForSale = async () => {
    try {
      // This would open a modal for listing - for now just show toast
      toast.info('Listing functionality coming soon!');
    } catch (error) {
      console.error('Listing failed:', error);
      toast.error('Failed to list NFT');
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (viewMode === 'list') {
    return (
      <div className="nft-card p-6 rounded-2xl group hover-lift flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden">
          <Image
            src={nft.image}
            alt={nft.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {nft.isListed && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-neon-green rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-exo2 text-xl font-bold text-white">{nft.name}</h3>
            {nft.isListed && (
              <span className="px-2 py-1 bg-neon-green/20 border border-neon-green/30 rounded-lg text-xs font-semibold text-neon-green">
                Listed
              </span>
            )}
          </div>
          <p className="font-inter text-white/60 mb-1">
            {nft.collection.slice(0, 6)}...{nft.collection.slice(-4)}
          </p>
          <p className="font-inter text-sm text-white/40">
            Acquired: {formatDate(nft.acquiredAt)}
          </p>
        </div>

        <div className="text-right">
          <p className="font-inter text-sm text-white/60 mb-1">
            {nft.isListed ? 'Listed Price' : 'Token ID'}
          </p>
          <div className="flex items-center gap-2 mb-4">
            {nft.isListed ? (
              <>
                <Coins className="h-4 w-4 text-white" />
                <span className="font-exo2 text-xl font-bold text-white">{nft.price}</span>
              </>
            ) : (
              <span className="font-mono text-lg font-bold text-white">#{nft.tokenId.toString()}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-full mt-2 w-48 glass border border-white/10 rounded-xl p-2 z-10">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors">
                    <ExternalLink className="h-4 w-4" />
                    View Details
                  </button>
                  <button 
                    onClick={handleListForSale}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    {nft.isListed ? 'Edit Listing' : 'List for Sale'}
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors">
                    <Share className="h-4 w-4" />
                    Share
                  </button>
                </div>
              )}
            </div>
            
            <Link 
              href={`/my-nfts/${nft.collection}/${nft.tokenId}`}
              className="btn-cyber px-4 py-2 rounded-lg font-inter font-semibold text-sm"
            >
              Manage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-card p-6 rounded-2xl group hover-lift">
      <div className="relative aspect-square rounded-xl overflow-hidden mb-6">
        <Image
          src={nft.image}
          alt={nft.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Status Indicators */}
        {nft.isListed && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-neon-green/20 border border-neon-green/30 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full"></div>
            <span className="font-inter text-sm font-semibold text-neon-green">Listed</span>
          </div>
        )}

        {/* Token ID Badge */}
        <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 rounded-lg">
          <span className="font-mono text-xs text-white/80">#{nft.tokenId.toString()}</span>
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button className="p-3 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors">
            <ExternalLink className="h-5 w-5 text-white" />
          </button>
          <button className="p-3 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors">
            <Share className="h-5 w-5 text-white" />
          </button>
          <button 
            onClick={handleListForSale}
            className="p-3 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <Edit className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-exo2 text-xl font-bold text-white mb-1">{nft.name}</h3>
          <p className="font-inter text-white/60">
            {nft.collection.slice(0, 6)}...{nft.collection.slice(-4)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-inter text-sm text-white/60 mb-1">
              {nft.isListed ? 'Listed Price' : 'Value'}
            </p>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-white" />
              <span className="font-exo2 text-lg font-bold text-white">
                {nft.price || '-'}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-inter text-sm text-white/60 mb-1">Acquired</p>
            <p className="font-inter text-sm text-white/80">{formatDate(nft.acquiredAt)}</p>
          </div>
        </div>

        {/* Attributes Preview */}
        <div className="grid grid-cols-2 gap-2">
          {nft.attributes.slice(0, 4).map((attr, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-2">
              <p className="font-inter text-xs text-white/60">{attr.trait_type}</p>
              <p className="font-inter text-xs text-white font-semibold truncate">{attr.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/60">
            <Heart className="h-4 w-4" />
            <span className="font-inter text-sm">#{nft.tokenId.toString()}</span>
          </div>
          
          <Link 
            href={`/my-nfts/${nft.collection}/${nft.tokenId}`}
            className="btn-cyber px-4 py-2 rounded-lg font-inter font-semibold text-sm flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Manage</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 