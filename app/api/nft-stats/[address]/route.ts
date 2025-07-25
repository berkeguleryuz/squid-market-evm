import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createPublicClient, http, Address } from "viem";
import { sepolia } from "viem/chains";

const prisma = new PrismaClient();

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    if (!address) {
      return NextResponse.json(
        { error: "Collection address parameter is required" },
        { status: 400 }
      );
    }

    const collectionAddress = address.toLowerCase();
    
    console.log(`📊 Getting NFT stats for collection: ${collectionAddress}`);

    // Get collection info from database
    const launchPool = await prisma.launchPool.findFirst({
      where: {
        contractAddress: collectionAddress,
      },
    });

    // Get real-time stats from blockchain
    let contractStats = {
      totalSupply: 0,
      maxSupply: 0,
      name: "Unknown Collection",
      symbol: "NFT",
    };

    try {
      // Get contract info
      const [name, symbol, totalSupply] = await Promise.all([
        publicClient.readContract({
          address: address as Address,
          abi: [
            {
              inputs: [],
              name: "name",
              outputs: [{ type: "string" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: 'name',
        }),
        publicClient.readContract({
          address: address as Address,
          abi: [
            {
              inputs: [],
              name: "symbol",
              outputs: [{ type: "string" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: address as Address,
          abi: [
            {
              inputs: [],
              name: "totalSupply",
              outputs: [{ type: "uint256" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: 'totalSupply',
        }),
      ]);

      contractStats = {
        name: name as string,
        symbol: symbol as string,
        totalSupply: Number(totalSupply as bigint),
        maxSupply: launchPool?.maxSupply || 0,
      };

      console.log(`✅ Contract stats:`, contractStats);
    } catch (contractError) {
      console.error(`⚠️ Failed to get contract stats:`, contractError);
    }

    // Get holder count from database (indexed NFTs)
    const holderCount = await prisma.nFT.groupBy({
      by: ['owner'],
      where: {
        collectionAddress: collectionAddress,
      },
      _count: {
        owner: true,
      },
    });

    // Get total transfers count
    const totalTransfers = await prisma.nFT.count({
      where: {
        collectionAddress: collectionAddress,
      },
    });

    // Get recent transfers
    const recentTransfers = await prisma.nFT.findMany({
      where: {
        collectionAddress: collectionAddress,
        lastTransferHash: { not: null },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
      select: {
        tokenId: true,
        owner: true,
        lastTransferBlock: true,
        lastTransferHash: true,
        updatedAt: true,
      },
    });

    const stats = {
      collection: {
        address: collectionAddress,
        name: contractStats.name,
        symbol: contractStats.symbol,
        maxSupply: contractStats.maxSupply,
        totalSupply: contractStats.totalSupply, // Real-time from contract
        holderCount: holderCount.length, // From indexed data
        isVerified: !!launchPool, // Verified if in our launchpool
      },
      activity: {
        totalTransfers,
        recentTransfers,
      },
      lastUpdated: new Date().toISOString(),
    };

    console.log(`📈 Final stats:`, {
      totalSupply: stats.collection.totalSupply,
      maxSupply: stats.collection.maxSupply,
      holders: stats.collection.holderCount,
      transfers: stats.activity.totalTransfers,
    });

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('❌ Error getting NFT stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get NFT stats' 
      },
      { status: 500 }
    );
  }
}
