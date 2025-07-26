import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createPublicClient, http, getContract } from 'viem';
import { sepolia } from 'viem/chains';

const prisma = new PrismaClient();

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

// ERC721 ABI for token scanning
const ERC721_ABI = [
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
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface CachedNFT {
  tokenId: string;
  name: string;
  description?: string;
  image: string;
  owner: string;
  collectionAddress: string;
  cached: boolean;
}

async function fetchTokenMetadata(tokenURI: string): Promise<{ name?: string; description?: string; image?: string } | null> {
  try {
    // Convert IPFS URLs to Pinata gateway
    let url = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      url = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const metadata = await response.json();
    
    // Convert image IPFS URLs
    if (metadata.image && metadata.image.startsWith('ipfs://')) {
      metadata.image = metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }

    return metadata;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

async function getCachedNFTs(collectionAddress: string): Promise<CachedNFT[]> {
  try {
    const nfts = await prisma.nFT.findMany({
      where: {
        collectionAddress: collectionAddress.toLowerCase()
      },
      orderBy: {
        tokenId: 'asc'
      }
    });

    return nfts.map(nft => ({
      tokenId: nft.tokenId.toString(),
      name: nft.name || `NFT #${nft.tokenId}`,
      description: nft.description || undefined,
      image: nft.image || '/placeholder.jpg',
      owner: nft.owner || '',
      collectionAddress: nft.collectionAddress,
      cached: true
    }));
  } catch (error) {
    console.error('Error fetching cached NFTs:', error);
    return [];
  }
}

async function fetchLiveNFTs(collectionAddress: string, offset: number = 0, limit: number = 16): Promise<CachedNFT[]> {
  try {
    const contract = getContract({
      address: collectionAddress as `0x${string}`,
      abi: ERC721_ABI,
      client: publicClient
    });

    const liveNFTs: CachedNFT[] = [];
    
    // Try to get total supply first
    let totalSupply = 0;
    try {
      const supply = await contract.read.totalSupply();
      totalSupply = Number(supply);
    } catch (error) {
      // If totalSupply fails, we'll do sequential scanning
      console.log('totalSupply not available, using sequential scan');
    }

    const maxScan = Math.min(totalSupply || 100, 100); // Limit scanning to 100 tokens max
    
    if (totalSupply > 0) {
      // Use totalSupply-based scanning
      const startToken = Math.max(1, offset + 1);
      const endToken = Math.min(totalSupply, startToken + limit - 1);
      
      for (let tokenId = startToken; tokenId <= endToken && liveNFTs.length < limit; tokenId++) {
        try {
          // Check if token exists and get owner
          const owner = await contract.read.ownerOf([BigInt(tokenId)]);
          
          // Get token URI
          const tokenURI = await contract.read.tokenURI([BigInt(tokenId)]);
          if (!tokenURI) continue;

          // Fetch metadata
          const metadata = await fetchTokenMetadata(tokenURI);
          
          liveNFTs.push({
            tokenId: tokenId.toString(),
            name: metadata?.name || `NFT #${tokenId}`,
            description: metadata?.description,
            image: metadata?.image || '/placeholder.jpg',
            owner: owner.toLowerCase(),
            collectionAddress: collectionAddress.toLowerCase(),
            cached: false
          });

          // Cache this NFT in database
          try {
            await prisma.nFT.upsert({
              where: {
                tokenId_collectionAddress: {
                  tokenId: tokenId.toString(),
                  collectionAddress: collectionAddress.toLowerCase()
                }
              },
              update: {
                name: metadata?.name || `NFT #${tokenId}`,
                description: metadata?.description,
                image: metadata?.image,
                owner: owner.toLowerCase(),
                updatedAt: new Date()
              },
              create: {
                tokenId: tokenId.toString(),
                collectionAddress: collectionAddress.toLowerCase(),
                name: metadata?.name || `NFT #${tokenId}`,
                description: metadata?.description,
                image: metadata?.image,
                owner: owner.toLowerCase()
              }
            });
          } catch (dbError) {
            console.error('Error caching NFT to database:', dbError);
          }
        } catch (error) {
          // Token doesn't exist, continue scanning
          continue;
        }
      }
    } else {
      // Sequential scan from token 1 + offset
      const startToken = 1 + offset;
      for (let tokenId = startToken; tokenId <= startToken + maxScan && liveNFTs.length < limit; tokenId++) {
        try {
          // Check if token exists and get owner
          const owner = await contract.read.ownerOf([BigInt(tokenId)]);
          
          // Get token URI
          const tokenURI = await contract.read.tokenURI([BigInt(tokenId)]);
          if (!tokenURI) continue;

          // Fetch metadata
          const metadata = await fetchTokenMetadata(tokenURI);
          
          liveNFTs.push({
            tokenId: tokenId.toString(),
            name: metadata?.name || `NFT #${tokenId}`,
            description: metadata?.description,
            image: metadata?.image || '/placeholder.jpg',
            owner: owner.toLowerCase(),
            collectionAddress: collectionAddress.toLowerCase(),
            cached: false
          });

          // Cache this NFT in database
          try {
            await prisma.nFT.upsert({
              where: {
                tokenId_collectionAddress: {
                  tokenId: tokenId.toString(),
                  collectionAddress: collectionAddress.toLowerCase()
                }
              },
              update: {
                name: metadata?.name || `NFT #${tokenId}`,
                description: metadata?.description,
                image: metadata?.image,
                owner: owner.toLowerCase(),
                updatedAt: new Date()
              },
              create: {
                tokenId: tokenId.toString(),
                collectionAddress: collectionAddress.toLowerCase(),
                name: metadata?.name || `NFT #${tokenId}`,
                description: metadata?.description,
                image: metadata?.image,
                owner: owner.toLowerCase()
              }
            });
          } catch (dbError) {
            console.error('Error caching NFT to database:', dbError);
          }
        } catch (error) {
          // Token doesn't exist, continue scanning
          continue;
        }
      }
    }

    return liveNFTs;
  } catch (error) {
    console.error(`Error fetching live NFTs for ${collectionAddress}:`, error);
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const collectionAddress = address;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '16');
    const cacheOnly = searchParams.get('cache') === 'true';

    console.log(`🎨 Getting NFTs for collection ${collectionAddress} (page: ${page}, limit: ${limit}, cacheOnly: ${cacheOnly})`);

    if (cacheOnly) {
      // Return only cached NFTs
      const cachedNFTs = await getCachedNFTs(collectionAddress);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNFTs = cachedNFTs.slice(startIndex, endIndex);
      
      console.log(`✅ Returning ${paginatedNFTs.length} cached NFTs for ${collectionAddress}`);
      
      return NextResponse.json({
        success: true,
        data: paginatedNFTs,
        total: cachedNFTs.length,
        page,
        limit,
        hasMore: endIndex < cachedNFTs.length
      });
    }

    // Fetch live NFTs from blockchain
    const offset = (page - 1) * limit;
    const liveNFTs = await fetchLiveNFTs(collectionAddress, offset, limit);
    
    console.log(`✅ Returning ${liveNFTs.length} live NFTs for ${collectionAddress}`);
    
    return NextResponse.json({
      success: true,
      data: liveNFTs,
      total: liveNFTs.length, // We don't know the exact total without scanning all
      page,
      limit,
      hasMore: liveNFTs.length === limit // If we got a full page, there might be more
    });

  } catch (error) {
    console.error('Error in GET /api/collections/[address]/nfts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch NFTs',
        data: []
      },
      { status: 500 }
    );
  }
}
