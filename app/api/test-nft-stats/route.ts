import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createPublicClient, http, Address } from "viem";
import { sepolia } from "viem/chains";

const prisma = new PrismaClient();

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export async function GET() {
  try {
    console.log('🧪 Testing NFT stats API...');
    
    const collectionAddress = "0xE4Ee962f37A4C305c3F8Abf4F5ceC2347fd87A03";
    
    // Test 1: Check if Prisma client has NFT model
    console.log('📊 Testing Prisma client...');
    
    // Test basic Prisma connection
    const waitlistCount = await prisma.waitlist.count();
    console.log(`✅ Waitlist count: ${waitlistCount}`);
    
    const launchPoolCount = await prisma.launchPool.count();
    console.log(`✅ LaunchPool count: ${launchPoolCount}`);
    
    // Test NFT model (this might fail)
    let nftCount = 0;
    try {
      nftCount = await prisma.nFT.count();
      console.log(`✅ NFT count: ${nftCount}`);
    } catch (nftError) {
      console.error('❌ NFT model error:', nftError);
      return NextResponse.json({
        success: false,
        error: 'NFT model not available in Prisma client',
        details: nftError instanceof Error ? nftError.message : 'Unknown error',
        waitlistCount,
        launchPoolCount,
      });
    }
    
    // Test 2: Get contract stats
    console.log('🔗 Testing contract connection...');
    
    let contractStats = {
      totalSupply: 0,
      name: "Unknown Collection",
      symbol: "NFT",
    };
    
    try {
      const [name, symbol, totalSupply] = await Promise.all([
        publicClient.readContract({
          address: collectionAddress as Address,
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
          address: collectionAddress as Address,
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
          address: collectionAddress as Address,
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
      };

      console.log(`✅ Contract stats:`, contractStats);
    } catch (contractError) {
      console.error(`⚠️ Contract error:`, contractError);
    }
    
    // Test 3: Get launch pool info
    const launchPool = await prisma.launchPool.findFirst({
      where: {
        contractAddress: collectionAddress.toLowerCase(),
      },
    });
    
    console.log(`📋 Launch pool:`, launchPool ? 'Found' : 'Not found');
    
    return NextResponse.json({
      success: true,
      test: 'NFT Stats API Test',
      results: {
        database: {
          waitlistCount,
          launchPoolCount,
          nftCount,
          launchPoolFound: !!launchPool,
        },
        contract: contractStats,
        collection: {
          address: collectionAddress,
          maxSupply: launchPool?.maxSupply || 0,
          currentSupply: launchPool?.currentSupply || 0,
          holderCount: launchPool?.holderCount || 0,
        },
      },
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
