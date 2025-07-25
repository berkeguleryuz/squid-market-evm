import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createPublicClient, http, getContract } from 'viem';
import { sepolia } from 'viem/chains';

const prisma = new PrismaClient();

// Create a public client for blockchain interactions
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

// ERC721 ABI for basic collection info and NFT metadata
const ERC721_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface RealCollection {
  address: string;
  name: string;
  symbol: string;
  type: 'ERC721';
  verified: boolean;
  description?: string;
  image?: string;
  totalSupply?: number;
  source: 'launchpad' | 'blockchain';
}

// Fetch metadata from tokenURI
async function fetchTokenMetadata(tokenURI: string): Promise<{ name?: string; description?: string; image?: string } | null> {
  try {
    // Convert IPFS URLs to Pinata gateway
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      metadataUrl = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }

    console.log(`📥 Fetching metadata from: ${metadataUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(metadataUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch metadata: ${response.status}`);
      return null;
    }
    
    const metadata = await response.json();
    
    // Convert IPFS image URLs to Pinata gateway
    let imageUrl = metadata.image;
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    return {
      name: metadata.name,
      description: metadata.description,
      image: imageUrl
    };
  } catch (error) {
    console.warn(`⚠️ Error fetching metadata from ${tokenURI}:`, error);
    return null;
  }
}

// Get collection preview image from first available NFT
async function getCollectionPreviewImage(address: string, totalSupply: number): Promise<string | null> {
  try {
    if (totalSupply === 0) return null;
    
    const contract = getContract({
      address: address as `0x${string}`,
      abi: ERC721_ABI,
      client: publicClient
    });

    // Try to get metadata from first few tokens (starting from 0)
    const maxTries = Math.min(5, totalSupply);
    
    for (let tokenId = 0; tokenId < maxTries; tokenId++) {
      try {
        const tokenURI = await contract.read.tokenURI([BigInt(tokenId)]);
        if (tokenURI) {
          const metadata = await fetchTokenMetadata(tokenURI as string);
          if (metadata?.image) {
            console.log(`🖼️ Found preview image for collection ${address} from token #${tokenId}: ${metadata.image}`);
            return metadata.image;
          }
        }
      } catch {
        // Continue to next token if this one fails
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️ Error getting preview image for ${address}:`, error);
    return null;
  }
}

// Cache collection info in database
async function cacheCollectionInfo(address: string, info: Partial<RealCollection> & { image?: string }) {
  try {
    await prisma.collectionCache.upsert({
      where: { address: address.toLowerCase() },
      update: {
        name: info.name,
        symbol: info.symbol,
        totalSupply: info.totalSupply,
        image: info.image,
        updatedAt: new Date()
      },
      create: {
        address: address.toLowerCase(),
        name: info.name || 'Unknown Collection',
        symbol: info.symbol || 'UNKNOWN',
        totalSupply: info.totalSupply || 0,
        image: info.image,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`💾 Cached collection info for ${address}`);
  } catch (error) {
    console.warn(`⚠️ Failed to cache collection info for ${address}:`, error);
  }
}

// Get cached collection info from database
async function getCachedCollectionInfo(address: string): Promise<Partial<RealCollection> | null> {
  try {
    const cached = await prisma.collectionCache.findUnique({
      where: { address: address.toLowerCase() }
    });
    
    if (cached) {
      // Check if cache is older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (cached.updatedAt > oneHourAgo) {
        console.log(`📋 Using cached info for ${address}`);
        return {
          name: cached.name,
          symbol: cached.symbol,
          totalSupply: cached.totalSupply,
          image: cached.image || undefined,
          type: 'ERC721' as const
        };
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️ Error getting cached info for ${address}:`, error);
    return null;
  }
}

async function getCollectionInfo(address: string): Promise<Partial<RealCollection> | null> {
  try {
    // First check cache
    const cached = await getCachedCollectionInfo(address);
    if (cached) {
      return cached;
    }
    
    console.log(`🔍 Fetching fresh collection info for ${address}`);
    
    const contract = getContract({
      address: address as `0x${string}`,
      abi: ERC721_ABI,
      client: publicClient
    });

    const [name, symbol, totalSupply] = await Promise.all([
      contract.read.name().catch(() => 'Unknown Collection'),
      contract.read.symbol().catch(() => 'UNKNOWN'),
      contract.read.totalSupply().catch(() => BigInt(0))
    ]);

    const totalSupplyNum = Number(totalSupply);
    
    // Get preview image from first NFT
    const previewImage = await getCollectionPreviewImage(address, totalSupplyNum);
    
    const collectionInfo = {
      name: name as string,
      symbol: symbol as string,
      totalSupply: totalSupplyNum,
      image: previewImage || undefined,
      type: 'ERC721' as const
    };
    
    // Cache the result
    await cacheCollectionInfo(address, collectionInfo);
    
    return collectionInfo;
  } catch (error) {
    console.error(`Failed to get collection info for ${address}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verifiedOnly = searchParams.get('verified') === 'true';
    
    console.log('🔍 Fetching real collections from blockchain and database...');

    // 1. Get collections from our launchpad database
    const launchPools = await prisma.launchPool.findMany({
      where: verifiedOnly ? { status: 'ACTIVE' } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    const collections: RealCollection[] = [];

    // 2. Process launchpad collections
    for (const launch of launchPools) {
      if (!launch.contractAddress) continue;

      // Get blockchain info for this collection
      const blockchainInfo = await getCollectionInfo(launch.contractAddress);
      
      const collection: RealCollection = {
        address: launch.contractAddress,
        name: launch.name || blockchainInfo?.name || 'Unknown Collection',
        symbol: launch.symbol || blockchainInfo?.symbol || 'UNKNOWN',
        type: 'ERC721',
        verified: launch.status === 'ACTIVE', // Active launches are considered verified
        description: launch.description || undefined,
        image: blockchainInfo?.image || launch.imageUrl || undefined, // Prefer blockchain image over DB image
        totalSupply: blockchainInfo?.totalSupply || 0,
        source: 'launchpad'
      };

      collections.push(collection);
    }

    // 3. Only include verified external collections (none for now)
    // All unverified external collections removed to prevent display in marketplace

    // 4. Filter verified only if requested
    const filteredCollections = verifiedOnly 
      ? collections.filter(c => c.verified)
      : collections;

    console.log(`✅ Found ${filteredCollections.length} real collections (${collections.length} total, verified filter: ${verifiedOnly})`);

    return NextResponse.json({
      success: true,
      data: filteredCollections,
      count: filteredCollections.length,
      total: collections.length
    });

  } catch (error) {
    console.error('❌ Error fetching real collections:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch collections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
