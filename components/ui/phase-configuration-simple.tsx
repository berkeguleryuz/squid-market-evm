"use client";

import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Clock, Settings } from 'lucide-react';

interface PhaseConfigurationProps {
  launchId: number;
  maxSupply: number;
  onPhaseConfigured?: () => void;
}

export function PhaseConfiguration({ 
  launchId, 
  maxSupply, 
  onPhaseConfigured 
}: PhaseConfigurationProps) {
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
              For now, you can use the basic launch system with Start/Complete actions from the Settings tab.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
