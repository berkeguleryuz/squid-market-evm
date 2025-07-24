"use client";

import { useAccount, useReadContract } from "wagmi";
import { getContractAddress } from "@/lib/wagmi";
import { useMemo } from "react";

// Minimal ABI for testing
const MINIMAL_ABI = [
  {
    inputs: [],
    name: "getActiveLaunches",
    outputs: [{ name: "activeLaunches", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_creator", type: "address" }],
    name: "getCreatorLaunches",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_launchId", type: "uint256" }],
    name: "getLaunchInfo",
    outputs: [
      { name: "collection", type: "address" },
      { name: "creator", type: "address" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "description", type: "string" },
      { name: "imageUri", type: "string" },
      { name: "maxSupply", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "autoProgress", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function TestContractConnection() {
  const { address, isConnected } = useAccount();
  const launchpadAddress = useMemo(() => getContractAddress("LAUNCHPAD"), []);

  // Direct contract call tests
  const {
    data: activeLaunches,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: launchpadAddress,
    abi: MINIMAL_ABI,
    functionName: "getActiveLaunches",
  });

  // Test creator launches
  const {
    data: creatorLaunches,
    isLoading: isLoadingCreator,
    error: creatorError,
  } = useReadContract({
    address: launchpadAddress,
    abi: MINIMAL_ABI,
    functionName: "getCreatorLaunches",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  // Test specific launch info (if we have creator launches)
  const firstLaunchId =
    creatorLaunches && creatorLaunches.length > 0 ? creatorLaunches[0] : null;
  const {
    data: launchInfo,
    isLoading: isLoadingInfo,
    error: infoError,
  } = useReadContract({
    address: launchpadAddress,
    abi: MINIMAL_ABI,
    functionName: "getLaunchInfo",
    args: firstLaunchId ? [firstLaunchId] : undefined,
    query: {
      enabled: !!firstLaunchId,
    },
  });

  console.log("🧪 Contract Connection Test:", {
    launchpadAddress,
    activeLaunches,
    creatorLaunches,
    launchInfo,
    isLoading,
    error,
    isConnected,
    address,
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">🧪 Contract Connection Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Status */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Wallet Status</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Connected:</strong> {isConnected ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              <strong>Address:</strong> {address || "Not connected"}
            </div>
          </div>
        </div>

        {/* Active Launches */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Active Launches</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Loading:</strong> {isLoading ? "⏳ Yes" : "✅ No"}
            </div>
            <div>
              <strong>Error:</strong>{" "}
              {error ? `❌ ${error.message}` : "✅ None"}
            </div>
            <div>
              <strong>Count:</strong> {activeLaunches?.length || 0}
            </div>
            <div>
              <strong>IDs:</strong>{" "}
              {activeLaunches?.map((id) => id.toString()).join(", ") || "None"}
            </div>
          </div>
        </div>

        {/* Creator Launches */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Your Launches</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Loading:</strong> {isLoadingCreator ? "⏳ Yes" : "✅ No"}
            </div>
            <div>
              <strong>Error:</strong>{" "}
              {creatorError ? `❌ ${creatorError.message}` : "✅ None"}
            </div>
            <div>
              <strong>Count:</strong> {creatorLaunches?.length || 0}
            </div>
            <div>
              <strong>IDs:</strong>{" "}
              {creatorLaunches?.map((id) => id.toString()).join(", ") || "None"}
            </div>
          </div>
        </div>
      </div>

      {/* Launch Info */}
      {firstLaunchId && (
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">
            Launch Info (ID: {firstLaunchId.toString()})
          </h2>
          {launchInfo ? (
            <div className="space-y-2 text-sm">
              <div>
                <strong>Name:</strong> {launchInfo[2]}
              </div>
              <div>
                <strong>Symbol:</strong> {launchInfo[3]}
              </div>
              <div>
                <strong>Status:</strong> {launchInfo[8].toString()}
              </div>
              <div>
                <strong>Collection:</strong> {launchInfo[0]}
              </div>
              <div>
                <strong>Creator:</strong> {launchInfo[1]}
              </div>
              <div>
                <strong>Max Supply:</strong> {launchInfo[6].toString()}
              </div>
              <div>
                <strong>Start Time:</strong> {launchInfo[7].toString()}
              </div>
            </div>
          ) : (
            <div>Loading launch info...</div>
          )}
        </div>
      )}

      {/* Raw Data */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Raw Contract Data</h2>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
          {JSON.stringify(
            {
              activeLaunches: activeLaunches
                ? activeLaunches.map((id) => id.toString())
                : null,
              creatorLaunches: creatorLaunches
                ? creatorLaunches.map((id) => id.toString())
                : null,
              launchInfo: launchInfo
                ? {
                    collection: launchInfo[0],
                    creator: launchInfo[1],
                    name: launchInfo[2],
                    symbol: launchInfo[3],
                    status: launchInfo[8].toString(),
                  }
                : null,
              errors: {
                active: error?.message || null,
                creator: creatorError?.message || null,
                info: infoError?.message || null,
              },
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* Actions */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 Refetch Data
        </button>
      </div>

      {/* Instructions */}
      <div className="p-4 border rounded-lg bg-yellow-50">
        <h2 className="text-lg font-semibold mb-4">📋 Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Connect your wallet if not already connected</li>
          <li>Make sure you're on Sepolia testnet</li>
          <li>Check if contract data loads successfully</li>
          <li>If no active launches, create one in test-contracts page</li>
          <li>Check browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
}
