import { createPublicClient, http, Address, getContract } from "viem";
import { sepolia } from "viem/chains";

// Create public client for blockchain scanning
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// ERC721 interface for contract detection
const ERC721_INTERFACE = [
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "uint256" }],
    name: "tokenURI",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "uint256" }],
    name: "ownerOf",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface DiscoveredCollection {
  address: Address;
  name: string;
  symbol: string;
  totalSupply: bigint;
  isERC721: boolean;
  isERC1155: boolean;
  blockNumber: bigint;
}

export interface DiscoveredNFT {
  tokenId: bigint;
  collection: Address;
  collectionName: string;
  owner: Address;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  tokenURI: string;
}

// Discover ERC721/ERC1155 collections by scanning recent blocks
export async function discoverCollections(
  fromBlock: bigint = 0n,
  toBlock: bigint | "latest" = "latest",
  maxCollections: number = 100
): Promise<DiscoveredCollection[]> {
  console.log('🔍 Starting blockchain collection discovery...');
  
  try {
    const currentBlock = await publicClient.getBlockNumber();
    const startBlock = fromBlock === 0n ? currentBlock - 10000n : fromBlock; // Last ~10k blocks
    
    console.log(`📊 Scanning blocks ${startBlock} to ${currentBlock}`);
    
    // Get all logs for potential NFT contract deployments
    const logs = await publicClient.getLogs({
      fromBlock: startBlock,
      toBlock: currentBlock,
      // Look for Transfer events (ERC721/ERC1155 signature)
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer(address,address,uint256)
      ],
    });
    
    console.log(`📝 Found ${logs.length} Transfer events`);
    
    // Extract unique contract addresses
    const contractAddresses = new Set<Address>();
    logs.forEach(log => {
      if (log.address) {
        contractAddresses.add(log.address);
      }
    });
    
    console.log(`🏭 Found ${contractAddresses.size} unique contract addresses`);
    
    // Test each contract to see if it's ERC721/ERC1155
    const discoveries: DiscoveredCollection[] = [];
    let tested = 0;
    
    for (const address of contractAddresses) {
      if (discoveries.length >= maxCollections) break;
      
      try {
        tested++;
        console.log(`🧪 Testing contract ${tested}/${contractAddresses.size}: ${address}`);
        
        const discovery = await testContract(address);
        if (discovery) {
          discoveries.push(discovery);
          console.log(`✅ Discovered: ${discovery.name} (${discovery.symbol}) - ${discovery.totalSupply} tokens`);
        }
      } catch (error) {
        console.log(`❌ Contract ${address} failed test:`, error);
      }
    }
    
    console.log(`🎉 Discovery complete! Found ${discoveries.length} NFT collections`);
    return discoveries;
    
  } catch (error) {
    console.error('❌ Collection discovery failed:', error);
    return [];
  }
}

// Test if a contract is ERC721/ERC1155
async function testContract(address: Address): Promise<DiscoveredCollection | null> {
  try {
    // Try to call ERC721 functions
    const contract = getContract({
      address,
      abi: ERC721_INTERFACE,
      client: publicClient,
    });
    
    // Test basic ERC721 functions
    const [name, symbol, totalSupply] = await Promise.all([
      contract.read.name(),
      contract.read.symbol(),
      contract.read.totalSupply(),
    ]);
    
    // If we got here, it's likely ERC721
    if (name && symbol && totalSupply !== undefined) {
      return {
        address,
        name: name as string,
        symbol: symbol as string,
        totalSupply: totalSupply as bigint,
        isERC721: true,
        isERC1155: false,
        blockNumber: await publicClient.getBlockNumber(),
      };
    }
    
    return null;
  } catch (error) {
    // Contract doesn't support ERC721, might be ERC1155 or not an NFT
    return null;
  }
}

// Scan a specific collection for all NFTs
export async function scanCollectionNFTs(
  collectionAddress: Address,
  maxTokens: number = 1000
): Promise<DiscoveredNFT[]> {
  console.log(`🔍 Scanning collection ${collectionAddress} for NFTs...`);
  
  try {
    const contract = getContract({
      address: collectionAddress,
      abi: ERC721_INTERFACE,
      client: publicClient,
    });
    
    // Get collection info
    const [name, totalSupply] = await Promise.all([
      contract.read.name(),
      contract.read.totalSupply(),
    ]);
    
    const collectionName = name as string;
    const supply = totalSupply as bigint;
    const tokensToScan = supply > BigInt(maxTokens) ? BigInt(maxTokens) : supply;
    
    console.log(`📊 Collection: ${collectionName}, Total Supply: ${supply}, Scanning: ${tokensToScan}`);
    
    if (supply === 0n) {
      console.log('⚠️ Collection has 0 total supply');
      return [];
    }
    
    const nfts: DiscoveredNFT[] = [];
    
    // Scan tokens (assuming token IDs start from 0 or 1)
    for (let tokenId = 0n; tokenId < tokensToScan; tokenId++) {
      try {
        // Try tokenId starting from 0, then 1 if 0 fails
        let actualTokenId = tokenId;
        let owner: Address;
        let tokenURI: string;
        
        try {
          [owner, tokenURI] = await Promise.all([
            contract.read.ownerOf([tokenId]),
            contract.read.tokenURI([tokenId]),
          ]);
        } catch (error) {
          // Try tokenId + 1 (some contracts start from 1)
          actualTokenId = tokenId + 1n;
          [owner, tokenURI] = await Promise.all([
            contract.read.ownerOf([actualTokenId]),
            contract.read.tokenURI([actualTokenId]),
          ]);
        }
        
        // Fetch metadata
        let metadata = {
          name: `${collectionName} #${actualTokenId}`,
          description: '',
          image: '',
          attributes: [],
        };
        
        if (tokenURI) {
          try {
            // Convert IPFS URLs to gateway URLs
            const metadataUrl = tokenURI.startsWith('ipfs://')
              ? `https://gateway.pinata.cloud/ipfs/${tokenURI.slice(7)}`
              : tokenURI;
            
            const metadataResponse = await fetch(metadataUrl, { 
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (metadataResponse.ok) {
              const fetchedMetadata = await metadataResponse.json();
              metadata = {
                name: fetchedMetadata.name || metadata.name,
                description: fetchedMetadata.description || '',
                image: fetchedMetadata.image?.startsWith('ipfs://')
                  ? `https://gateway.pinata.cloud/ipfs/${fetchedMetadata.image.slice(7)}`
                  : fetchedMetadata.image || '',
                attributes: fetchedMetadata.attributes || [],
              };
            }
          } catch (metadataError) {
            console.log(`⚠️ Failed to fetch metadata for token ${actualTokenId}:`, metadataError);
          }
        }
        
        nfts.push({
          tokenId: actualTokenId,
          collection: collectionAddress,
          collectionName,
          owner: owner as Address,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          attributes: metadata.attributes,
          tokenURI,
        });
        
        if (nfts.length % 10 === 0) {
          console.log(`📈 Scanned ${nfts.length}/${tokensToScan} tokens...`);
        }
        
      } catch (tokenError) {
        // Token might not exist or be burned
        console.log(`⚠️ Token ${tokenId} not found or burned`);
      }
    }
    
    console.log(`✅ Scanned ${nfts.length} NFTs from ${collectionName}`);
    return nfts;
    
  } catch (error) {
    console.error(`❌ Failed to scan collection ${collectionAddress}:`, error);
    return [];
  }
}

// Get known collections (launchpad + discovered)
export async function getAllKnownCollections(): Promise<DiscoveredCollection[]> {
  try {
    // Get launchpad collections
    const launchpadResponse = await fetch('/api/launchpools');
    const launchpadResult = await launchpadResponse.json();
    
    const launchpadCollections: DiscoveredCollection[] = [];
    
    if (launchpadResult.success) {
      for (const launch of launchpadResult.data) {
        try {
          const discovery = await testContract(launch.contractAddress as Address);
          if (discovery) {
            launchpadCollections.push(discovery);
          }
        } catch (error) {
          console.error(`Failed to test launchpad collection ${launch.contractAddress}:`, error);
        }
      }
    }
    
    // Discover additional collections
    const discoveredCollections = await discoverCollections();
    
    // Combine and deduplicate
    const allCollections = new Map<Address, DiscoveredCollection>();
    
    [...launchpadCollections, ...discoveredCollections].forEach(collection => {
      allCollections.set(collection.address, collection);
    });
    
    return Array.from(allCollections.values());
    
  } catch (error) {
    console.error('Failed to get all known collections:', error);
    return [];
  }
}
