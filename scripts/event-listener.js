const { createPublicClient, http, parseAbiItem } = require('viem');
const { sepolia } = require('viem/chains');
const { PrismaClient } = require('@prisma/client');

// Contract configuration
const LAUNCHPAD_ADDRESS = '0xBD23D1248c8B41B3De6c4A3f47B46e0c53B4e953';
const LAUNCHPAD_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "launchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "collection",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
    ],
    name: "LaunchCreated",
    type: "event",
  },
];

// Initialize clients
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

const prisma = new PrismaClient();

// Event listener function
async function listenForLaunchCreatedEvents() {
  console.log('🎧 Starting LaunchCreated event listener...');
  console.log(`📍 Contract: ${LAUNCHPAD_ADDRESS}`);
  
  try {
    // Get current block number
    const currentBlock = await publicClient.getBlockNumber();
    console.log(`📦 Current block: ${currentBlock}`);
    
    // Scan last 1000 blocks for missed events (adjust as needed)
    const fromBlock = currentBlock - 1000n;
    console.log(`🔍 Scanning from block ${fromBlock} to ${currentBlock}`);
    
    // Get LaunchCreated events
    const logs = await publicClient.getLogs({
      address: LAUNCHPAD_ADDRESS,
      event: parseAbiItem('event LaunchCreated(uint256 indexed launchId, address indexed collection, address indexed creator)'),
      fromBlock: fromBlock,
      toBlock: currentBlock
    });
    
    console.log(`📋 Found ${logs.length} LaunchCreated events`);
    
    // Process each event
    for (const log of logs) {
      const { launchId, collection, creator } = log.args;
      
      console.log(`\n🚀 Processing Launch ID: ${launchId}`);
      console.log(`📄 Collection: ${collection}`);
      console.log(`👤 Creator: ${creator}`);
      
      // Check if launch already exists in database
      const existingLaunch = await prisma.launchPool.findUnique({
        where: { launchId: Number(launchId) }
      });
      
      if (existingLaunch) {
        console.log(`✅ Launch ${launchId} already exists in database`);
        continue;
      }
      
      // Get launch info from contract using launches mapping
      try {
        const launchInfo = await publicClient.readContract({
          address: LAUNCHPAD_ADDRESS,
          abi: [
            {
              inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
              name: "launches",
              outputs: [
                { internalType: "address", name: "collection", type: "address" },
                { internalType: "address", name: "creator", type: "address" },
                { internalType: "string", name: "name", type: "string" },
                { internalType: "string", name: "symbol", type: "string" },
                { internalType: "string", name: "description", type: "string" },
                { internalType: "string", name: "imageUri", type: "string" },
                { internalType: "uint256", name: "maxSupply", type: "uint256" },
                { internalType: "uint256", name: "startTime", type: "uint256" },
                { internalType: "uint8", name: "status", type: "uint8" },
                { internalType: "bool", name: "autoProgress", type: "bool" },
                { internalType: "uint8", name: "currentPhase", type: "uint8" },
              ],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: 'launches',
          args: [launchId],
        });
        
        // Get collection info from NFT contract
        const collectionInfo = await publicClient.readContract({
          address: collection,
          abi: [
            {
              name: "getCollectionInfo",
              type: "function",
              stateMutability: "view",
              inputs: [],
              outputs: [
                {
                  name: "",
                  type: "tuple",
                  components: [
                    { name: "name", type: "string" },
                    { name: "symbol", type: "string" },
                    { name: "description", type: "string" },
                    { name: "image", type: "string" },
                    { name: "creator", type: "address" },
                    { name: "maxSupply", type: "uint256" },
                    { name: "currentSupply", type: "uint256" },
                    { name: "status", type: "uint8" },
                    { name: "createdAt", type: "uint256" },
                  ],
                },
              ],
            },
          ],
          functionName: 'getCollectionInfo',
          args: [],
        });
        
        // Save to database
        const newLaunch = await prisma.launchPool.create({
          data: {
            launchId: Number(launchId),
            name: launchInfo[2] || collectionInfo[0] || `Launch #${launchId}`,
            symbol: launchInfo[3] || collectionInfo[1] || 'NFT',
            description: launchInfo[4] || collectionInfo[2] || 'NFT Collection',
            maxSupply: Number(launchInfo[6] || collectionInfo[5] || 0),
            contractAddress: collection,
            launchpadAddress: LAUNCHPAD_ADDRESS,
            creator: creator,
            status: 'PENDING',
            imageUri: launchInfo[5] || collectionInfo[3] || null,
            startTime: null,
            endTime: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Successfully backfilled Launch ${launchId} to database`);
        console.log(`📝 Name: ${newLaunch.name}`);
        console.log(`🔢 Max Supply: ${newLaunch.maxSupply}`);
        
      } catch (contractError) {
        console.error(`❌ Error reading contract data for Launch ${launchId}:`, contractError.message);
        
        // Create minimal entry if contract read fails
        const minimalLaunch = await prisma.launchPool.create({
          data: {
            launchId: Number(launchId),
            name: `Launch #${launchId}`,
            symbol: 'NFT',
            description: 'NFT Collection',
            maxSupply: 0,
            contractAddress: collection,
            launchpadAddress: LAUNCHPAD_ADDRESS,
            creator: creator,
            status: 'PENDING',
            imageUri: null,
            startTime: null,
            endTime: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`⚠️  Created minimal entry for Launch ${launchId}`);
      }
    }
    
    console.log('\n🎉 Event backfill completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in event listener:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  listenForLaunchCreatedEvents()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { listenForLaunchCreatedEvents };
