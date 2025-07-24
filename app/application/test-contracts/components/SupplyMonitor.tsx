'use client';

import { useState } from 'react';
import { useCollectionStats } from '@/lib/hooks/useContracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Using custom progress bar instead of shadcn Progress component
import { RefreshCw, BarChart3 } from 'lucide-react';
import { Address } from 'viem';

interface SupplyMonitorProps {
  collectionAddress: Address | null;
}

export default function SupplyMonitor({ collectionAddress }: SupplyMonitorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { totalSupply, maxSupply } = useCollectionStats(collectionAddress || undefined);

  const refreshSupply = () => {
    setIsRefreshing(true);
    totalSupply.refetch();
    maxSupply.refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!collectionAddress) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Select a collection to monitor supply</p>
        </CardContent>
      </Card>
    );
  }

  const currentSupply = totalSupply.data ? Number(totalSupply.data) : 0;
  const maxSupplyValue = maxSupply.data ? Number(maxSupply.data) : 0;
  const supplyPercentage = maxSupplyValue > 0 ? (currentSupply / maxSupplyValue) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Real-time Supply Status
          </div>
          <Button
            onClick={refreshSupply}
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Supply Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Minted Supply</span>
            <span>{currentSupply} / {maxSupplyValue}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${supplyPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {supplyPercentage.toFixed(1)}% minted
          </div>
        </div>

        {/* Supply Stats Grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <div className="text-lg font-bold text-blue-400">{currentSupply}</div>
            <div className="text-xs text-muted-foreground">Current Supply</div>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
            <div className="text-lg font-bold text-purple-400">{maxSupplyValue}</div>
            <div className="text-xs text-muted-foreground">Max Supply</div>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
            <div className="text-lg font-bold text-green-400">{maxSupplyValue - currentSupply}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>

        {/* Collection Address */}
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Collection:</span>
          <br />
          <code className="bg-muted px-1 py-0.5 rounded text-xs">
            {collectionAddress}
          </code>
        </div>

        {/* Loading States */}
        {(totalSupply.isLoading || maxSupply.isLoading) && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading supply data...
            </div>
          </div>
        )}

        {/* Error States */}
        {(totalSupply.error || maxSupply.error) && (
          <div className="text-center py-2 text-sm text-red-400">
            Failed to load supply data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
