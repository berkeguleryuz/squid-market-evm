'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  usePhaseManagement,
  usePhaseConfig 
} from '@/lib/hooks/useContracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, Loader2, Clock, DollarSign, Users, Target } from 'lucide-react';
import { Address } from 'viem';

// Phase definitions
const PHASES = {
  0: { name: "None", color: "bg-gray-500/20 text-gray-400", icon: "⚫" },
  1: { name: "Presale", color: "bg-blue-500/20 text-blue-400", icon: "🎯" },
  2: { name: "Whitelist", color: "bg-purple-500/20 text-purple-400", icon: "👥" },
  3: { name: "Public", color: "bg-green-500/20 text-green-400", icon: "🌍" },
};

interface PhaseManagerProps {
  selectedCollection: Address | null;
  isLoading: string | null;
  onLoadingChange: (loading: string | null) => void;
}

export default function PhaseManager({ 
  selectedCollection, 
  isLoading, 
  onLoadingChange 
}: PhaseManagerProps) {
  const { address } = useAccount();
  
  // Phase configuration state
  const [phaseToConfig, setPhaseToConfig] = useState(1);
  const [phasePrice, setPhasePrice] = useState('0.01');
  const [phaseStartTime, setPhaseStartTime] = useState('');
  const [phaseEndTime, setPhaseEndTime] = useState('');
  const [phaseMaxPerWallet, setPhaseMaxPerWallet] = useState('5');
  const [phaseMaxSupply, setPhaseMaxSupply] = useState('50');

  // Contract hooks
  const { configurePhase, updateWhitelist, mintWithPhase } = usePhaseManagement(
    selectedCollection || undefined,
  );
  const { data: phaseConfigData, refetch: refetchPhaseConfig } = usePhaseConfig(
    selectedCollection || undefined, 
    phaseToConfig
  );

  // Set default times
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    setPhaseStartTime(oneHourLater.toISOString().slice(0, 16));
    setPhaseEndTime(oneDayLater.toISOString().slice(0, 16));
  }, []);

  // Auto-refresh phase data when phase or collection changes
  useEffect(() => {
    if (selectedCollection && phaseToConfig) {
      console.log(`🔄 Auto-refreshing phase ${phaseToConfig} data for collection ${selectedCollection}`);
      setTimeout(() => refetchPhaseConfig(), 1000);
    }
  }, [selectedCollection, phaseToConfig, refetchPhaseConfig]);

  const handleAction = async (
    actionName: string,
    action: () => Promise<string>,
  ) => {
    onLoadingChange(actionName);
    try {
      const txHash = await action();
      toast.success(
        `✅ ${actionName} successful! TX: ${txHash.slice(0, 10)}...`,
      );

      // Refresh phase config data
      if (actionName.includes('Configure Phase')) {
        setTimeout(() => refetchPhaseConfig(), 3000);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ ${actionName} failed:`, error);
      toast.error(`❌ ${actionName} failed: ${errorMessage}`);
    } finally {
      onLoadingChange(null);
    }
  };

  const handleConfigurePhase = () => handleAction('Configure Phase', async () => {
    if (!selectedCollection) throw new Error('No collection selected');
    
    const startTimestamp = Math.floor(new Date(phaseStartTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(phaseEndTime).getTime() / 1000);
    
    // Validation
    if (startTimestamp >= endTimestamp) {
      throw new Error('Start time must be before end time');
    }
    
    if (parseFloat(phasePrice) <= 0) {
      throw new Error('Price must be greater than 0');
    }
    
    if (parseInt(phaseMaxPerWallet) <= 0) {
      throw new Error('Max per wallet must be greater than 0');
    }
    
    console.log(`🔧 Configuring ${PHASES[phaseToConfig as keyof typeof PHASES]?.name} phase for collection:`, selectedCollection);
    console.log('⚙️ Phase config:', {
      phase: phaseToConfig,
      price: phasePrice,
      startTime: new Date(startTimestamp * 1000).toLocaleString(),
      endTime: new Date(endTimestamp * 1000).toLocaleString(),
      maxPerWallet: parseInt(phaseMaxPerWallet),
      maxSupply: parseInt(phaseMaxSupply)
    });
    
    const hash = await configurePhase(
      phaseToConfig,
      phasePrice,
      startTimestamp,
      endTimestamp,
      parseInt(phaseMaxPerWallet),
      parseInt(phaseMaxSupply)
    );
    
    // Extra success message with details
    toast.success(`✅ ${PHASES[phaseToConfig as keyof typeof PHASES]?.name} phase configured! Price: ${phasePrice} ETH`);
    
    return hash;
  });

  if (!selectedCollection) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Select a launch to configure phases</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Phase Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phase Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Phase Type</label>
            <Select value={phaseToConfig.toString()} onValueChange={(value) => setPhaseToConfig(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PHASES).slice(1).map(([key, phase]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{phase.icon}</span>
                      <span>{phase.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phase Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Price (ETH)
              </label>
              <Input
                type="number"
                step="0.001"
                placeholder="0.01"
                value={phasePrice}
                onChange={(e) => setPhasePrice(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Max per Wallet
              </label>
              <Input
                type="number"
                placeholder="5"
                value={phaseMaxPerWallet}
                onChange={(e) => setPhaseMaxPerWallet(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                <Target className="h-4 w-4 inline mr-1" />
                Phase Max Supply
              </label>
              <Input
                type="number"
                placeholder="50"
                value={phaseMaxSupply}
                onChange={(e) => setPhaseMaxSupply(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time
              </label>
              <Input
                type="datetime-local"
                value={phaseStartTime}
                onChange={(e) => setPhaseStartTime(e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time
              </label>
              <Input
                type="datetime-local"
                value={phaseEndTime}
                onChange={(e) => setPhaseEndTime(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleConfigurePhase}
            disabled={isLoading === 'Configure Phase'}
            className="w-full"
          >
            {isLoading === 'Configure Phase' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Configuring...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Configure {PHASES[phaseToConfig as keyof typeof PHASES]?.name} Phase
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Phase Info */}
      {phaseConfigData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className={PHASES[phaseToConfig as keyof typeof PHASES]?.color}>
                {PHASES[phaseToConfig as keyof typeof PHASES]?.icon} {PHASES[phaseToConfig as keyof typeof PHASES]?.name}
              </Badge>
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Price:</span>
                <p className="font-medium">{phaseConfigData.price} ETH</p>
              </div>
              <div>
                <span className="text-muted-foreground">Max per Wallet:</span>
                <p className="font-medium">{phaseConfigData.maxPerWallet}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Max Supply:</span>
                <p className="font-medium">{phaseConfigData.maxSupply}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={phaseConfigData.isActive ? "default" : "secondary"}>
                  {phaseConfigData.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
