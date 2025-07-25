import { createPublicClient, http, Address } from "viem";
import { sepolia } from "viem/chains";
import { KNOWN_COLLECTIONS, KnownCollection } from "@/lib/config/knownCollections";

// Create public client for blockchain scanning
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export interface ScannedNFT {
  tokenId: string;
  owner: string;
  collectionAddress: string;
  collectionName: string;
  name: string; // Made required with fallback
  description: string; // Made required with fallback
  image?: string;
  metadata?: any;
  tokenURI?: string;
  // Marketplace specific fields
  isListed?: boolean;
  isVerified?: boolean;
  listingPrice?: string;
  collection?: {
    name: string;
    verified: boolean;
  };
}

export interface CollectionStats {
  address: string;
  name: string;
  symbol?: string;
  totalSupply: number;
  verified: boolean;
  type: 'ERC721' | 'ERC1155';
  nftCount: number;
  uniqueHolders: number;
}

// ERC721 ABI for basic functions
const ERC721_ABI = [
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Scan a specific collection for NFTs
export async function scanCollection(
  collectionAddress: string,
  maxTokens: number = 100
): Promise<ScannedNFT[]> {
  try {
    console.log(`🔍 Scanning collection: ${collectionAddress}`);
    
    const knownCollection = KNOWN_COLLECTIONS.find(
      c => c.address.toLowerCase() === collectionAddress.toLowerCase()
    );
    
    const nfts: ScannedNFT[] = [];
    
    // Get basic collection info
    let totalSupply = 0;
    let collectionName = knownCollection?.name || 'Unknown Collection';
    
    try {
      const totalSupplyResult = await publicClient.readContract({
        address: collectionAddress as Address,
        abi: ERC721_ABI,
        functionName: 'totalSupply',
      });
      totalSupply = Number(totalSupplyResult);
      
      // Get collection name from contract if not in known list
      if (!knownCollection) {
        try {
          const nameResult = await publicClient.readContract({
            address: collectionAddress as Address,
            abi: ERC721_ABI,
            functionName: 'name',
          });
          collectionName = nameResult as string;
        } catch (error) {
          console.log(`⚠️ Could not get name for ${collectionAddress}`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not get totalSupply for ${collectionAddress}, trying sequential scan`);
    }
    
    // Determine scan range
    const scanLimit = Math.min(totalSupply || maxTokens, maxTokens);
    console.log(`📊 Scanning ${scanLimit} tokens from ${collectionAddress}`);
    
    // Scan tokens (start from 1, most NFTs start from token ID 1)
    for (let tokenId = 1; tokenId <= scanLimit; tokenId++) {
      try {
        // Get owner
        const owner = await publicClient.readContract({
          address: collectionAddress as Address,
          abi: ERC721_ABI,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)],
        }) as string;
        
        // Get token URI
        let tokenURI = '';
        let metadata = null;
        try {
          tokenURI = await publicClient.readContract({
            address: collectionAddress as Address,
            abi: ERC721_ABI,
            functionName: 'tokenURI',
            args: [BigInt(tokenId)],
          }) as string;
          
          // Fetch metadata if URI is available
          if (tokenURI) {
            try {
              // Convert IPFS URLs to gateway URLs
              const metadataURL = tokenURI.startsWith('ipfs://')
                ? tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                : tokenURI;
              
              const metadataResponse = await fetch(metadataURL, { 
                signal: AbortSignal.timeout(5000) 
              });
              if (metadataResponse.ok) {
                metadata = await metadataResponse.json();
              }
            } catch (metadataError) {
              console.log(`⚠️ Could not fetch metadata for token ${tokenId}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not get tokenURI for token ${tokenId}`);
        }
        
        const knownCollection = KNOWN_COLLECTIONS.find(
          c => c.address.toLowerCase() === collectionAddress.toLowerCase()
        );
        
        const nft: ScannedNFT = {
          tokenId: tokenId.toString(),
          owner: owner.toLowerCase(),
          collectionAddress: collectionAddress.toLowerCase(),
          collectionName,
          name: metadata?.name || `${collectionName} #${tokenId}`,
          description: metadata?.description || `${collectionName} NFT #${tokenId}`,
          image: metadata?.image ? (
            metadata.image.startsWith('ipfs://') 
              ? metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
              : metadata.image
          ) : undefined,
          metadata,
          tokenURI,
          // Marketplace specific fields
          isListed: false, // Default to not listed
          isVerified: knownCollection?.verified || false,
          listingPrice: undefined,
          collection: {
            name: collectionName,
            verified: knownCollection?.verified || false,
          },
        };
        
        nfts.push(nft);
        
        // Log progress every 10 tokens
        if (tokenId % 10 === 0) {
          console.log(`📍 Scanned ${tokenId}/${scanLimit} tokens from ${collectionAddress}`);
        }
        
      } catch (error) {
        // Token might not exist or be burned, skip
        continue;
      }
    }
    
    console.log(`✅ Found ${nfts.length} NFTs in collection ${collectionAddress}`);
    return nfts;
    
  } catch (error) {
    console.error(`❌ Failed to scan collection ${collectionAddress}:`, error);
    return [];
  }
}

// Get collection statistics
export async function getCollectionStats(collectionAddress: string): Promise<CollectionStats | null> {
  try {
    const knownCollection = KNOWN_COLLECTIONS.find(
      c => c.address.toLowerCase() === collectionAddress.toLowerCase()
    );
    
    // Get basic contract info
    let name = knownCollection?.name || 'Unknown Collection';
    let symbol = knownCollection?.symbol || '';
    let totalSupply = 0;
    
    try {
      const [nameResult, symbolResult, totalSupplyResult] = await Promise.allSettled([
        publicClient.readContract({
          address: collectionAddress as Address,
          abi: ERC721_ABI,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: collectionAddress as Address,
          abi: ERC721_ABI,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: collectionAddress as Address,
          abi: ERC721_ABI,
          functionName: 'totalSupply',
        }),
      ]);
      
      if (nameResult.status === 'fulfilled') {
        name = nameResult.value as string;
      }
      if (symbolResult.status === 'fulfilled') {
        symbol = symbolResult.value as string;
      }
      if (totalSupplyResult.status === 'fulfilled') {
        totalSupply = Number(totalSupplyResult.value);
      }
    } catch (error) {
      console.log(`⚠️ Could not get full contract info for ${collectionAddress}`);
    }
    
    // Quick scan to get holder count (scan first 50 tokens)
    const holders = new Set<string>();
    const scanLimit = Math.min(totalSupply || 50, 50);
    
    for (let tokenId = 1; tokenId <= scanLimit; tokenId++) {
      try {
        const owner = await publicClient.readContract({
          address: collectionAddress as Address,
          abi: ERC721_ABI,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)],
        }) as string;
        holders.add(owner.toLowerCase());
      } catch (error) {
        // Token might not exist, skip
        continue;
      }
    }
    
    return {
      address: collectionAddress.toLowerCase(),
      name,
      symbol,
      totalSupply,
      verified: knownCollection?.verified || false,
      type: knownCollection?.type || 'ERC721',
      nftCount: totalSupply,
      uniqueHolders: holders.size,
    };
    
  } catch (error) {
    console.error(`❌ Failed to get stats for collection ${collectionAddress}:`, error);
    return null;
  }
}

// Scan all known collections
export async function scanAllKnownCollections(): Promise<ScannedNFT[]> {
  console.log(`🚀 Scanning ${KNOWN_COLLECTIONS.length} known collections...`);
  
  const allNFTs: ScannedNFT[] = [];
  
  for (const collection of KNOWN_COLLECTIONS) {
    try {
      const nfts = await scanCollection(collection.address, 20); // Limit to 20 per collection for performance
      allNFTs.push(...nfts);
    } catch (error) {
      console.error(`❌ Failed to scan collection ${collection.address}:`, error);
    }
  }
  
  console.log(`✅ Total NFTs found: ${allNFTs.length}`);
  return allNFTs;
}

// Get NFTs owned by a specific address
export async function getNFTsOwnedBy(ownerAddress: string): Promise<ScannedNFT[]> {
  const allNFTs = await scanAllKnownCollections();
  return allNFTs.filter(nft => nft.owner.toLowerCase() === ownerAddress.toLowerCase());
}

// Get all NFTs for marketplace
export async function getAllMarketplaceNFTs(): Promise<ScannedNFT[]> {
  return await scanAllKnownCollections();
}
