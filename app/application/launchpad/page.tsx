'use client';

import { useState, useEffect } from 'react';
import { 
  Rocket, 
  Plus, 
  Clock, 
  Coins,
  CheckCircle,
  Target,
  Zap,
  Loader2,
  Play,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useRealLaunches, RealLaunch } from '@/lib/hooks/useRealLaunches';
import { useLaunchpadContract } from '@/lib/hooks/useContracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function LaunchpadPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { launches, isLoading, error, refetch } = useRealLaunches();
  const { startLaunch } = useLaunchpadContract();

  useEffect(() => {
    setMounted(true);
    
    // Auto-refresh launches every 10 seconds when component is active
    const interval = setInterval(() => {
      if (!isLoading) {
        console.log('🔄 Auto-refreshing launches...');
        refetch();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isLoading, refetch]);

  // Use launches directly from useRealLaunches (now fetches all active launches)
  const allLaunches = launches || [];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="loading-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleStartLaunch = async (launchId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setActionLoading(`start-${launchId}`);
    try {
      const txHash = await startLaunch(launchId);
      toast.success(`Launch started! TX: ${txHash.slice(0, 10)}...`);
      
      // Refresh launches data
      setTimeout(() => {
        refetch();
        toast.info('Data refreshed - launch status should update shortly');
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start launch';
      console.error('Start launch failed:', error);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshData = async () => {
    setActionLoading('refresh');
    try {
      await refetch();
      toast.success('Data refreshed!');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredLaunches = allLaunches.filter(launch => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return !launch.isActive && launch.status === 0;
    if (filter === 'live') return launch.isActive && launch.status === 1;
    if (filter === 'completed') return launch.status === 2;
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-0 cyber-grid opacity-20"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h1 className="font-exo2 text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">Launch</span>
              <span className="text-white">pad</span>
            </h1>
            <p className="font-inter text-xl text-white/70 max-w-3xl mx-auto mb-4">
              Launch your NFT collection with our advanced launchpad. Create, fund, and distribute your digital assets to a global community.
            </p>
            
            {/* Real-time status */}
            <div className="text-sm text-white/60 mb-4">
              <div className="flex items-center justify-center gap-4">
                <span>Active Launches: {allLaunches.filter(l => l.isActive).length}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshData}
                  disabled={actionLoading === 'refresh'}
                >
                  <RefreshCw className={`h-4 w-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="glass p-6 rounded-2xl border border-white/10 text-center">
              <div className="text-3xl font-bold text-neon-cyan mb-2">{allLaunches.length}</div>
              <div className="text-white/60">Total Launches</div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/10 text-center">
              <div className="text-3xl font-bold text-neon-green mb-2">
                {allLaunches.filter(l => l.isActive).length}
              </div>
              <div className="text-white/60">Active Launches</div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/10 text-center">
              <div className="text-3xl font-bold text-neon-purple mb-2">
                {allLaunches.filter(l => l.status === 2).length}
              </div>
              <div className="text-white/60">Completed</div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/10 text-center">
              <div className="text-3xl font-bold text-white mb-2">100%</div>
              <div className="text-white/60">Success Rate</div>
            </div>
          </div>

          {/* Create Launch Button */}
          <div className="text-center mb-12">
            <Link href="/test-contracts">
              <Button className="btn-cyber px-8 py-4 rounded-xl font-inter font-semibold flex items-center space-x-3 mx-auto">
                <Plus className="h-5 w-5" />
                <span>Create New Launch</span>
              </Button>
            </Link>
          </div>

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && allLaunches.length > 0 && (
            <div className="glass p-4 rounded-lg mb-8 text-sm">
              <div className="text-white/60 mb-2">🐛 Debug Info:</div>
              <div className="text-xs space-y-1">
                <div>Total Launches: {allLaunches.length}</div>
                <div>Active: {allLaunches.filter(l => l.isActive).length}</div>
                <div>Completed: {allLaunches.filter(l => l.status === 2).length}</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { key: 'all', label: 'All Launches', icon: Target },
              { key: 'upcoming', label: 'Upcoming', icon: Clock },
              { key: 'live', label: 'Live', icon: Zap },
              { key: 'completed', label: 'Completed', icon: CheckCircle },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-inter font-medium transition-all ${
                  filter === key
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Launches Grid */}
      <section className="pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-20">
              <Loader2 className="h-12 w-12 mx-auto mb-6 animate-spin text-neon-cyan" />
              <h3 className="font-exo2 text-2xl font-bold mb-4 text-white">Loading Launches...</h3>
              <p className="font-inter text-white/60">Fetching the latest launch data from the blockchain</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <Rocket className="h-10 w-10 text-red-400" />
              </div>
              <h3 className="font-exo2 text-2xl font-bold mb-4 text-white">Failed to Load</h3>
              <p className="font-inter text-white/60 mb-8">{error}</p>
              <Button 
                onClick={handleRefreshData}
                className="btn-cyber px-6 py-3 rounded-xl font-inter font-semibold"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* No Launches */}
          {!isLoading && !error && filteredLaunches.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <Rocket className="h-10 w-10 text-white/40" />
              </div>
              <h3 className="font-exo2 text-2xl font-bold mb-4 text-white">
                {filter === 'all' ? 'No Launches Yet' : `No ${filter} Launches`}
              </h3>
              <p className="font-inter text-white/60 mb-8">
                {filter === 'all' 
                  ? 'Be the first to launch your NFT collection!' 
                  : `No launches match the ${filter} filter.`
                }
              </p>
              <Link href="/test-contracts">
                <Button className="btn-cyber px-6 py-3 rounded-xl font-inter font-semibold">
                  Create First Launch
                </Button>
              </Link>
            </div>
          )}

          {/* Launches Grid */}
          {!isLoading && !error && filteredLaunches.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLaunches.map((launch) => (
                <LaunchCard 
                  key={launch.id} 
                  launch={launch}
                  onStartLaunch={handleStartLaunch}
                  isLoading={actionLoading === `start-${launch.launchId}`}
                  isOwner={launch.creator.toLowerCase() === address?.toLowerCase()}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface LaunchCardProps {
  launch: RealLaunch;
  onStartLaunch: (launchId: number) => void;
  isLoading: boolean;
  isOwner: boolean;
}

function LaunchCard({ launch, onStartLaunch, isLoading, isOwner }: LaunchCardProps) {
  const getStatusBadge = () => {
    switch (launch.status) {
      case 0:
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 1:
        return <Badge variant="default" className="bg-green-500/20 text-green-400">Active</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400">Completed</Badge>;
      case 3:
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="nft-card rounded-2xl group hover-lift bg-white/5 border-white/10">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-exo2 text-xl font-bold text-white mb-1">{launch.name}</h3>
            <p className="text-white/60 text-sm">{launch.symbol}</p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Image */}
        <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-white/5">
          <Image
            src={launch.imageUri || '/squid1.jpg'}
            alt={launch.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Description */}
        <p className="text-white/80 text-sm mb-4 line-clamp-2">
          {launch.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{launch.maxSupply}</div>
            <div className="text-xs text-white/60">Max Supply</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-neon-cyan">{launch.progress}%</div>
            <div className="text-xs text-white/60">Progress</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-neon-green">{launch.totalRaised} ETH</div>
            <div className="text-xs text-white/60">Raised</div>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center justify-between text-sm text-white/60 mb-4">
          <span>Creator:</span>
          <span className="font-mono">{launch.creator.slice(0, 6)}...{launch.creator.slice(-4)}</span>
        </div>

        {/* Collection Address */}
        <div className="flex items-center justify-between text-sm text-white/60 mb-6">
          <span>Collection:</span>
          <a 
            href={`https://sepolia.etherscan.io/address/${launch.collection}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-1"
          >
            {launch.collection.slice(0, 6)}...{launch.collection.slice(-4)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {launch.status === 0 && isOwner && (
            <Button
              onClick={() => onStartLaunch(launch.launchId)}
              disabled={isLoading}
              className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/80 rounded-lg font-inter font-semibold flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <>
                  <Play className="h-4 w-4 text-black" />
                  <span className="text-black">Start Launch</span>
                </>
              )}
            </Button>
          )}

          {launch.status === 1 && (
            <Button
              asChild
              className="w-full bg-green-500 text-white border border-green-400 hover:bg-green-600 rounded-lg font-inter font-semibold"
            >
              <Link href={`/test-contracts`}>
                <Coins className="h-4 w-4 mr-2 text-white" />
                <span className="text-white">Mint NFTs (Set Price First)</span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            className="w-full border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white rounded-lg"
          >
            <Link href={`/test-contracts`}>
              <span className="text-white">View Details & Set Mint Price</span>
            </Link>
          </Button>
        </div>

        {/* Status Debug Info */}
        {launch.launchId === 0 && (
          <div className="mt-4 text-xs text-white/40 border-t border-white/10 pt-2">
            Status: {launch.status} | Active: {launch.isActive ? 'Yes' : 'No'}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 