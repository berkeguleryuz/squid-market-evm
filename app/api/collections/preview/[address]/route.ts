import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { sepolia } from 'viem/chains';

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

interface PreviewNFT {
  tokenId: string;
  image: string;
  name?: string;
}

async function fetchTokenMetadata(tokenURI: string): Promise<{ name?: string; image?: string } | null> {
  try {
    // Convert IPFS URLs to Pinata gateway
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      metadataUrl = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(metadataUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SquidMarket/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const metadata = await response.json();
    
    let imageUrl = metadata.image;
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }

    return {
      name: metadata.name,
      image: imageUrl
    };
  } catch (error) {
    console.error(`Failed to fetch metadata from ${tokenURI}:`, error);
    return null;
  }
}

async function getCollectionPreview(address: string, count: number = 6): Promise<PreviewNFT[]> {
  try {
    const contract = getContract({
      address: address as `0x${string}`,
      abi: ERC721_ABI,
      client: publicClient
    });

    // Try to get total supply first
    let totalSupply = 0;
    try {
      const supply = await contract.read.totalSupply();
      totalSupply = Number(supply);
    } catch (error) {
      console.log(`Could not get totalSupply for ${address}, will scan sequentially`);
    }

    const previewNFTs: PreviewNFT[] = [];
    const maxScan = Math.min(totalSupply || 100, 50); // Limit scanning to avoid timeouts

    // If we have totalSupply, get the most recent tokens
    if (totalSupply > 0) {
      const startToken = Math.max(1, totalSupply - count + 1);
      
      for (let tokenId = totalSupply; tokenId >= startToken && previewNFTs.length < count; tokenId--) {
        try {
          // Check if token exists
          await contract.read.ownerOf([BigInt(tokenId)]);
          
          // Get token URI
          const tokenURI = await contract.read.tokenURI([BigInt(tokenId)]);
          if (!tokenURI) continue;

          // Fetch metadata
          const metadata = await fetchTokenMetadata(tokenURI);
          if (metadata?.image) {
            previewNFTs.push({
              tokenId: tokenId.toString(),
              image: metadata.image,
              name: metadata.name
            });
          }
        } catch (error) {
          // Token doesn't exist or error fetching, skip
          continue;
        }
      }
    } else {
      // Sequential scan from token 1
      for (let tokenId = 1; tokenId <= maxScan && previewNFTs.length < count; tokenId++) {
        try {
          // Check if token exists
          await contract.read.ownerOf([BigInt(tokenId)]);
          
          // Get token URI
          const tokenURI = await contract.read.tokenURI([BigInt(tokenId)]);
          if (!tokenURI) continue;

          // Fetch metadata
          const metadata = await fetchTokenMetadata(tokenURI);
          if (metadata?.image) {
            previewNFTs.push({
              tokenId: tokenId.toString(),
              image: metadata.image,
              name: metadata.name
            });
          }
        } catch (error) {
          // Token doesn't exist, continue scanning
          continue;
        }
      }
    }

    return previewNFTs;
  } catch (error) {
    console.error(`Error getting collection preview for ${address}:`, error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '6');

    console.log(`🖼️ Getting collection preview for ${address} (${count} images)`);

    const previewNFTs = await getCollectionPreview(address, count);

    console.log(`✅ Found ${previewNFTs.length} preview images for ${address}`);

    return NextResponse.json({
      success: true,
      data: previewNFTs,
      count: previewNFTs.length,
      collection: address
    });

  } catch (error) {
    console.error('❌ Error getting collection preview:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get collection preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
