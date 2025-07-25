const { PrismaClient } = require('@prisma/client');
const { createPublicClient, http, getContract } = require('viem');
const { sepolia } = require('viem/chains');

const prisma = new PrismaClient();

// Create a public client for blockchain interactions
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

// Verified collections to sync
const VERIFIED_COLLECTIONS = [
  {
    address: '0xE4Ee962f37A4C305c3F8Abf4F5ceC2347fd87A03',
    name: 'BG Test',
    symbol: 'BGTEST',
    description: 'Test collection from our launchpad'
  }
];

// ERC721 ABI
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
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Fetch metadata from IPFS
async function fetchMetadata(tokenURI) {
  try {
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      metadataUrl = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }

    console.log(`📥 Fetching metadata from: ${metadataUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(metadataUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
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
      name: metadata.name || 'Unknown NFT',
      description: metadata.description || '',
      image: imageUrl || '',
      attributes: metadata.attributes || []
    };
  } catch (error) {
    console.warn(`⚠️ Error fetching metadata:`, error.message);
    return null;
  }
}

async function syncVerifiedCollection(collectionInfo) {
  try {
    console.log(`\n🔄 Syncing collection: ${collectionInfo.name} (${collectionInfo.address})`);
    
    const contract = getContract({
      address: collectionInfo.address,
      abi: ERC721_ABI,
      client: publicClient
    });

    // Get total supply
    const totalSupply = await contract.read.totalSupply();
    console.log(`📊 Total supply: ${totalSupply}`);

    // Get collection name and symbol from contract
    const [contractName, contractSymbol] = await Promise.all([
      contract.read.name(),
      contract.read.symbol()
    ]);

    console.log(`📋 Contract info: ${contractName} (${contractSymbol})`);

    // Sync NFTs (get the most recent ones, up to 8)
    const maxNFTs = Math.min(Number(totalSupply), 8);
    console.log(`🎨 Syncing ${maxNFTs} NFTs (tokenId 0 to ${maxNFTs - 1})...`);

    for (let i = 0; i < maxNFTs; i++) {
      try {
        console.log(`\n🔍 Processing NFT #${i}...`);
        
        // Get owner and tokenURI
        const [owner, tokenURI] = await Promise.all([
          contract.read.ownerOf([BigInt(i)]),
          contract.read.tokenURI([BigInt(i)])
        ]);

        console.log(`👤 Owner: ${owner}`);
        console.log(`🔗 TokenURI: ${tokenURI}`);

        // Fetch metadata
        const metadata = await fetchMetadata(tokenURI);
        
        if (!metadata) {
          console.warn(`⚠️ Skipping NFT #${i} - no metadata`);
          continue;
        }

        console.log(`✅ Metadata: ${metadata.name}`);
        console.log(`🖼️ Image: ${metadata.image}`);

        // Upsert NFT in database
        await prisma.nFT.upsert({
          where: {
            tokenId_collectionAddress: {
              tokenId: i.toString(),
              collectionAddress: collectionInfo.address.toLowerCase()
            }
          },
          update: {
            owner: owner.toLowerCase(),
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            metadata: metadata,
            updatedAt: new Date()
          },
          create: {
            tokenId: i.toString(),
            collectionAddress: collectionInfo.address.toLowerCase(),
            owner: owner.toLowerCase(),
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            metadata: metadata,
            lastTransferBlock: '0',
            lastTransferHash: '0x0',
            isListed: false
          }
        });

        console.log(`💾 Saved NFT #${i} to database`);
        
      } catch (error) {
        console.error(`❌ Error processing NFT #${i}:`, error.message);
      }
    }

    // Get collection preview image from first NFT
    let collectionImage = null;
    try {
      const firstNFT = await prisma.nFT.findFirst({
        where: { collectionAddress: collectionInfo.address.toLowerCase() },
        orderBy: { tokenId: 'asc' }
      });
      if (firstNFT && firstNFT.image) {
        collectionImage = firstNFT.image;
        console.log(`🖼️ Collection preview image: ${collectionImage}`);
      }
    } catch (error) {
      console.warn('⚠️ Could not get collection preview image:', error.message);
    }

    // Update collection info in knownCollections cache
    await prisma.collectionCache.upsert({
      where: { address: collectionInfo.address.toLowerCase() },
      update: {
        name: contractName,
        symbol: contractSymbol,
        totalSupply: Number(totalSupply),
        image: collectionImage,
        verified: true,
        updatedAt: new Date()
      },
      create: {
        address: collectionInfo.address.toLowerCase(),
        name: contractName,
        symbol: contractSymbol,
        totalSupply: Number(totalSupply),
        image: collectionImage,
        verified: true,
        description: collectionInfo.description
      }
    });

    console.log(`✅ Collection ${collectionInfo.name} synced successfully!`);
    
  } catch (error) {
    console.error(`❌ Error syncing collection ${collectionInfo.name}:`, error);
  }
}

async function syncAllVerifiedCollections() {
  try {
    console.log('🚀 Starting verified collections sync...');
    
    for (const collection of VERIFIED_COLLECTIONS) {
      await syncVerifiedCollection(collection);
    }
    
    console.log('\n✅ All verified collections synced!');
    
  } catch (error) {
    console.error('❌ Error syncing collections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncAllVerifiedCollections();
