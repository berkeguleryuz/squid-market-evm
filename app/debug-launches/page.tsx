"use client";

import { useActiveLaunches } from '@/lib/hooks/useContracts';
import { useRealLaunches } from '@/lib/hooks/useRealLaunches';

export default function DebugLaunchesPage() {
  const { data: activeLaunches, isLoading: isLoadingActive, error: activeError } = useActiveLaunches();
  const { launches: realLaunches, isLoading: isLoadingReal, error: realError } = useRealLaunches();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">🔍 Debug Active Launches</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* useActiveLaunches Hook */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">useActiveLaunches Hook</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Loading:</strong> {isLoadingActive ? 'Yes' : 'No'}</div>
            <div><strong>Error:</strong> {activeError ? activeError.message : 'None'}</div>
            <div><strong>Data Type:</strong> {typeof activeLaunches}</div>
            <div><strong>Is Array:</strong> {Array.isArray(activeLaunches) ? 'Yes' : 'No'}</div>
            <div><strong>Length:</strong> {activeLaunches?.length || 0}</div>
            <div><strong>Raw Data:</strong></div>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(activeLaunches, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
              , 2)}
            </pre>
          </div>
        </div>

        {/* useRealLaunches Hook */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">useRealLaunches Hook</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Loading:</strong> {isLoadingReal ? 'Yes' : 'No'}</div>
            <div><strong>Error:</strong> {realError ? realError : 'None'}</div>
            <div><strong>Data Type:</strong> {typeof realLaunches}</div>
            <div><strong>Is Array:</strong> {Array.isArray(realLaunches) ? 'Yes' : 'No'}</div>
            <div><strong>Length:</strong> {realLaunches?.length || 0}</div>
            <div><strong>Launches:</strong></div>
            <div className="space-y-2">
              {realLaunches && realLaunches.length > 0 ? (
                realLaunches.map((launch, index) => (
                  <div key={index} className="bg-gray-100 p-2 rounded text-xs">
                    <div><strong>ID:</strong> {launch.id}</div>
                    <div><strong>Name:</strong> {launch.name}</div>
                    <div><strong>Status:</strong> {launch.status}</div>
                    <div><strong>Collection:</strong> {launch.collection}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No launches found</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Console Logs */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Console Instructions</h2>
        <p className="text-sm text-gray-600">
          Open browser developer tools (F12) and check the console for detailed debug logs from the hooks.
        </p>
      </div>
    </div>
  );
}
