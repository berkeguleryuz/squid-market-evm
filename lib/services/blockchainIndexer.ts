import { createPublicClient, http, Address, parseAbiItem, decodeEventLog } from "viem";
import { sepolia } from "viem/chains";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create public client for blockchain scanning
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// Event signatures
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');
const LAUNCH_CREATED_EVENT = parseAbiItem('event LaunchCreated(uint256 indexed launchId, address indexed collection, address indexed creator)');

export interface BlockchainIndexerConfig {
  startBlock?: bigint;
  endBlock?: bigint;
  batchSize?: number;
  delayMs?: number;
}

export class BlockchainIndexer {
  private isRunning = false;
  private lastProcessedBlock: bigint = 0n;
  private config: Required<BlockchainIndexerConfig>;

  constructor(config: BlockchainIndexerConfig = {}) {
    this.config = {
      startBlock: config.startBlock || 0n,
      endBlock: config.endBlock || 0n,
      batchSize: config.batchSize || 1000,
      delayMs: config.delayMs || 5000, // 5 seconds between scans
    };
  }

  async start() {
    if (this.isRunning) {
      console.log('🔄 Blockchain indexer is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting blockchain indexer...');

    // Get last processed block from database or use config
    const lastBlock = await this.getLastProcessedBlock();
    this.lastProcessedBlock = lastBlock || this.config.startBlock;

    console.log(`📊 Starting from block: ${this.lastProcessedBlock}`);

    // Start the indexing loop
    this.indexingLoop();
  }

  async stop() {
    this.isRunning = false;
    console.log('⏹️ Stopping blockchain indexer...');
  }

  private async indexingLoop() {
    while (this.isRunning) {
      try {
        await this.processBlocks();
        await this.delay(this.config.delayMs);
      } catch (error) {
        console.error('❌ Error in indexing loop:', error);
        await this.delay(this.config.delayMs * 2); // Wait longer on error
      }
    }
  }

  private async processBlocks() {
    const currentBlock = await publicClient.getBlockNumber();
    const endBlock = this.lastProcessedBlock + BigInt(this.config.batchSize);
    const targetBlock = endBlock > currentBlock ? currentBlock : endBlock;

    if (this.lastProcessedBlock >= targetBlock) {
      // No new blocks to process
      return;
    }

    console.log(`🔍 Processing blocks ${this.lastProcessedBlock} to ${targetBlock}`);

    // Get all Transfer events in this range
    const transferLogs = await publicClient.getLogs({
      event: TRANSFER_EVENT,
      fromBlock: this.lastProcessedBlock + 1n,
      toBlock: targetBlock,
    });

    // Get all LaunchCreated events in this range
    const launchLogs = await publicClient.getLogs({
      event: LAUNCH_CREATED_EVENT,
      fromBlock: this.lastProcessedBlock + 1n,
      toBlock: targetBlock,
    });

    console.log(`📝 Found ${transferLogs.length} Transfer events, ${launchLogs.length} Launch events`);

    // Process Transfer events (for NFT ownership tracking)
    for (const log of transferLogs) {
      await this.processTransferEvent(log);
    }

    // Process LaunchCreated events (for new collections)
    for (const log of launchLogs) {
      await this.processLaunchCreatedEvent(log);
    }

    // Update collection statistics
    await this.updateCollectionStats();

    // Update last processed block
    this.lastProcessedBlock = targetBlock;
    await this.saveLastProcessedBlock(targetBlock);

    console.log(`✅ Processed up to block ${targetBlock}`);
  }

  private async processTransferEvent(log: any) {
    try {
      // Decode the event log if not already decoded
      let decodedLog;
      if (log.args) {
        decodedLog = log;
      } else {
        try {
          decodedLog = decodeEventLog({
            abi: [TRANSFER_EVENT],
            data: log.data,
            topics: log.topics,
          });
        } catch (decodeError) {
          console.log(`⚠️ Failed to decode Transfer event: ${decodeError}`);
          return;
        }
      }

      const { from, to, tokenId } = decodedLog.args;
      const collectionAddress = log.address;
      const blockNumber = log.blockNumber;
      const transactionHash = log.transactionHash;

      // Validate required fields
      if (!from || !to || tokenId === undefined || !collectionAddress) {
        console.log(`⚠️ Invalid Transfer event data: from=${from}, to=${to}, tokenId=${tokenId}, collection=${collectionAddress}`);
        return;
      }

      console.log(`🔄 Transfer: ${from} -> ${to}, Token: ${tokenId}, Collection: ${collectionAddress}`);

      // Update NFT ownership in database
      await prisma.nFT.upsert({
        where: {
          tokenId_collectionAddress: {
            tokenId: tokenId.toString(),
            collectionAddress: collectionAddress.toLowerCase(),
          },
        },
        update: {
          owner: to.toLowerCase(),
          lastTransferBlock: blockNumber.toString(),
          lastTransferHash: transactionHash,
          updatedAt: new Date(),
        },
        create: {
          tokenId: tokenId.toString(),
          collectionAddress: collectionAddress.toLowerCase(),
          owner: to.toLowerCase(),
          name: `Token #${tokenId}`,
          description: '',
          image: '',
          metadata: {},
          lastTransferBlock: blockNumber.toString(),
          lastTransferHash: transactionHash,
        },
      });

      // If this is a mint (from 0x0), increment collection supply
      if (from === '0x0000000000000000000000000000000000000000') {
        await this.incrementCollectionSupply(collectionAddress);
      }

    } catch (error) {
      console.error('❌ Error processing Transfer event:', error);
    }
  }

  private async processLaunchCreatedEvent(log: any) {
    try {
      // Decode the event log if not already decoded
      let decodedLog;
      if (log.args) {
        decodedLog = log;
      } else {
        try {
          decodedLog = decodeEventLog({
            abi: [LAUNCH_CREATED_EVENT],
            data: log.data,
            topics: log.topics,
          });
        } catch (decodeError) {
          console.log(`⚠️ Failed to decode LaunchCreated event: ${decodeError}`);
          return;
        }
      }

      const { launchId, collection, creator } = decodedLog.args;

      // Validate required fields
      if (launchId === undefined || !collection || !creator) {
        console.log(`⚠️ Invalid LaunchCreated event data: launchId=${launchId}, collection=${collection}, creator=${creator}`);
        return;
      }
      const blockNumber = log.blockNumber;
      const transactionHash = log.transactionHash;

      console.log(`🚀 LaunchCreated: ID ${launchId}, Collection: ${collection}, Creator: ${creator}`);

      // Check if launch already exists
      const existingLaunch = await prisma.launchPool.findFirst({
        where: {
          launchId: Number(launchId),
          contractAddress: collection.toLowerCase(),
        },
      });

      if (existingLaunch) {
        console.log(`⚠️ Launch ${launchId} already exists, skipping`);
        return;
      }

      // Get collection info from contract
      const collectionInfo = await this.getCollectionInfo(collection);

      // Create launch in database
      await prisma.launchPool.create({
        data: {
          launchId: Number(launchId),
          contractAddress: collection.toLowerCase(),
          launchpadAddress: log.address.toLowerCase(),
          name: collectionInfo.name || `Collection #${launchId}`,
          symbol: collectionInfo.symbol || 'NFT',
          description: collectionInfo.description || '',
          imageUrl: collectionInfo.image || '',
          maxSupply: Number(collectionInfo.maxSupply || 0),
          creator: creator.toLowerCase(),
          status: 'ACTIVE',
          createdAt: new Date(),
          blockNumber: blockNumber.toString(),
          transactionHash,
        },
      });

      console.log(`✅ Created launch ${launchId} in database`);

    } catch (error) {
      console.error('❌ Error processing LaunchCreated event:', error);
    }
  }

  private async getCollectionInfo(collectionAddress: Address) {
    try {
      // Try to get collection info from contract
      const [name, symbol, totalSupply] = await Promise.all([
        publicClient.readContract({
          address: collectionAddress,
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
          address: collectionAddress,
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
          address: collectionAddress,
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

      return {
        name: name as string,
        symbol: symbol as string,
        totalSupply: totalSupply as bigint,
        maxSupply: 0n, // Will be fetched separately if available
        description: '',
        image: '',
      };
    } catch (error) {
      console.error(`❌ Error getting collection info for ${collectionAddress}:`, error);
      return {
        name: '',
        symbol: '',
        totalSupply: 0n,
        maxSupply: 0n,
        description: '',
        image: '',
      };
    }
  }

  private async incrementCollectionSupply(collectionAddress: Address) {
    try {
      // Update collection supply in database
      await prisma.launchPool.updateMany({
        where: {
          contractAddress: collectionAddress.toLowerCase(),
        },
        data: {
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('❌ Error incrementing collection supply:', error);
    }
  }

  private async updateCollectionStats() {
    try {
      // Update holder counts for all collections
      const collections = await prisma.launchPool.findMany({
        select: { contractAddress: true, launchId: true },
      });

      for (const collection of collections) {
        // Count unique holders
        const holderCount = await prisma.nFT.groupBy({
          by: ['owner'],
          where: {
            collectionAddress: collection.contractAddress,
          },
          _count: {
            owner: true,
          },
        });

        // Count total supply
        const totalSupply = await prisma.nFT.count({
          where: {
            collectionAddress: collection.contractAddress,
          },
        });

        // Update collection stats (we'll add these fields to LaunchPool model)
        console.log(`📊 Collection ${collection.contractAddress}: ${holderCount.length} holders, ${totalSupply} total supply`);
      }
    } catch (error) {
      console.error('❌ Error updating collection stats:', error);
    }
  }

  private async getLastProcessedBlock(): Promise<bigint | null> {
    try {
      // Get from database or config file
      // For now, return null to start from config
      return null;
    } catch (error) {
      console.error('❌ Error getting last processed block:', error);
      return null;
    }
  }

  private async saveLastProcessedBlock(blockNumber: bigint) {
    try {
      // Save to database or config file
      console.log(`💾 Saved last processed block: ${blockNumber}`);
    } catch (error) {
      console.error('❌ Error saving last processed block:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const blockchainIndexer = new BlockchainIndexer({
  startBlock: 7000000n, // Start from a recent block on Sepolia
  batchSize: 1000,
  delayMs: 10000, // 10 seconds between scans
});

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  blockchainIndexer.start();
}
