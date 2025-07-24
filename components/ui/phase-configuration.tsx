"use client";

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Separator } from './separator';
import { toast } from 'sonner';
import { Clock, Users, DollarSign, Package, Play, Settings } from 'lucide-react';
import { Phase, getPhaseDisplayName, formatTimeRemaining, useLaunchPhaseInfo, useConfigurePhase } from '@/lib/hooks/usePhaseManagement';

interface PhaseConfigurationProps {
  launchId: number;
  maxSupply: number;
  onPhaseConfigured?: () => void;
}

interface PhaseFormData {
  price: string;
  startTime: string;
  endTime: string;
  maxPerWallet: string;
  maxSupply: string;
}

const PHASE_COLORS: Record<Phase, string> = {
  [Phase.NONE]: 'bg-gray-100 text-gray-800 border-gray-200',
  [Phase.PRESALE]: 'bg-purple-100 text-purple-800 border-purple-200',
  [Phase.WHITELIST]: 'bg-blue-100 text-blue-800 border-blue-200',
  [Phase.PUBLIC]: 'bg-green-100 text-green-800 border-green-200',
};

const PHASE_ICONS: Record<Phase, any> = {
  [Phase.NONE]: Settings,
  [Phase.PRESALE]: Users,
  [Phase.WHITELIST]: Package,
  [Phase.PUBLIC]: Play,
};

export function PhaseConfiguration({ 
  launchId, 
  maxSupply, 
  onPhaseConfigured 
}: PhaseConfigurationProps) {
  // Phase management temporarily disabled - contract doesn't support it yet
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Multi-Phase Launch System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-4">
              <Settings className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-gray-600 mb-4">
              Multi-phase launch system (Pre-sale, Waitlist, Public Sale) is currently under development.
            </p>
            <p className="text-sm text-gray-500">
              For now, you can use the basic launch system with Start/Complete actions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Original phase management code (disabled)
  /*
  const { launchInfo, currentPhase, phases, activePhase } = useLaunchPhaseInfo(launchId);
  const { configurePhase, isPending, isConfirming, isSuccess } = useConfigurePhase();

  const [selectedPhase, setSelectedPhase] = useState<Phase>(Phase.PRESALE);
  */
  const [formData, setFormData] = useState<PhaseFormData>({
    price: '0.01',
    startTime: '',
    endTime: '',
    maxPerWallet: '5',
    maxSupply: Math.floor(maxSupply * 0.3).toString() // Default to 30% of total supply
  });

  // Set default times
  useEffect(() => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours duration

    setFormData(prev => ({
      ...prev,
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16)
    }));
  }, []);

  // Handle successful configuration
  useEffect(() => {
    if (isSuccess) {
      toast.success(`${getPhaseDisplayName(selectedPhase)} configured successfully!`);
      onPhaseConfigured?.();
    }
  }, [isSuccess, selectedPhase, onPhaseConfigured]);

  const handleConfigurePhase = async () => {
    try {
      const startTimestamp = Math.floor(new Date(formData.startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(formData.endTime).getTime() / 1000);

      if (startTimestamp <= Math.floor(Date.now() / 1000)) {
        toast.error('Start time must be in the future');
        return;
      }

      if (endTimestamp <= startTimestamp) {
        toast.error('End time must be after start time');
        return;
      }

      if (parseInt(formData.maxSupply) > maxSupply) {
        toast.error(`Phase supply cannot exceed total supply (${maxSupply})`);
        return;
      }

      await configurePhase(
        launchId,
        selectedPhase,
        formData.price,
        startTimestamp,
        endTimestamp,
        parseInt(formData.maxPerWallet),
        parseInt(formData.maxSupply)
      );

    } catch (error) {
      console.error('❌ Phase configuration error:', error);
      toast.error('Failed to configure phase');
    }
  };

  const getPhaseStatus = (phase: Phase) => {
    const phaseInfo = phases.find(p => p.phase === phase);
    if (!phaseInfo) return 'Not Configured';
    if (phaseInfo.isActive) return 'Active';
    if (phaseInfo.timeRemaining > 0) return 'Upcoming';
    return 'Ended';
  };

  const getRecommendedSupply = (phase: Phase) => {
    switch (phase) {
      case Phase.PRESALE:
        return Math.floor(maxSupply * 0.2); // 20%
      case Phase.WHITELIST:
        return Math.floor(maxSupply * 0.3); // 30%
      case Phase.PUBLIC:
        return Math.floor(maxSupply * 0.5); // 50%
      default:
        return maxSupply;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {launchInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Launch Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Current Phase</p>
                <Badge className={currentPhase > 0 ? PHASE_COLORS[currentPhase as Phase] : 'bg-gray-100'}>
                  {currentPhase > 0 ? getPhaseDisplayName(currentPhase as Phase) : 'Not Started'}
                </Badge>
              </div>
              
              {activePhase && (
                <>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Time Remaining</p>
                    <p className="font-semibold">
                      {formatTimeRemaining(activePhase.timeRemaining)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Sold / Supply</p>
                    <p className="font-semibold">
                      {Number(activePhase.config.totalSold)} / {Number(activePhase.config.maxSupply)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {[Phase.PRESALE, Phase.WHITELIST, Phase.PUBLIC].map((phase) => {
              const PhaseIcon = PHASE_ICONS[phase];
              const status = getPhaseStatus(phase);
              const phaseInfo = phases.find(p => p.phase === phase);
              
              return (
                <div
                  key={phase}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPhase === phase ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPhase(phase)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PhaseIcon className="h-5 w-5" />
                      <div>
                        <h4 className="font-semibold">{getPhaseDisplayName(phase)}</h4>
                        {phaseInfo && (
                          <p className="text-sm text-gray-600">
                            Price: {Number(phaseInfo.config.price) / 1e18} ETH | 
                            Supply: {Number(phaseInfo.config.maxSupply)} | 
                            Max per wallet: {Number(phaseInfo.config.maxPerWallet)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      className={
                        status === 'Active' ? 'bg-green-100 text-green-800' :
                        status === 'Upcoming' ? 'bg-blue-100 text-blue-800' :
                        status === 'Ended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Phase Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure {getPhaseDisplayName(selectedPhase)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price per NFT (ETH)</Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="maxPerWallet">Max per Wallet</Label>
              <Input
                id="maxPerWallet"
                type="number"
                value={formData.maxPerWallet}
                onChange={(e) => setFormData(prev => ({ ...prev, maxPerWallet: e.target.value }))}
                placeholder="5"
              />
            </div>
            
            <div>
              <Label htmlFor="maxSupply">
                Phase Supply 
                <span className="text-sm text-gray-500 ml-1">
                  (Recommended: {getRecommendedSupply(selectedPhase)})
                </span>
              </Label>
              <Input
                id="maxSupply"
                type="number"
                value={formData.maxSupply}
                onChange={(e) => setFormData(prev => ({ ...prev, maxSupply: e.target.value }))}
                placeholder={getRecommendedSupply(selectedPhase).toString()}
              />
            </div>
            
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              onClick={handleConfigurePhase}
              disabled={isPending || isConfirming}
              className="min-w-32"
            >
              {isPending || isConfirming ? 'Configuring...' : `Configure ${getPhaseDisplayName(selectedPhase)}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
