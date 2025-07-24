const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addLaunch() {
  try {
    console.log('🚀 Adding launch to database...');
    
    const launchPool = await prisma.launchPool.create({
      data: {
        launchId: 0,
        contractAddress: '0xbc350383126fe41126e7987433283e7bd7e08f89',
        launchpadAddress: '0x6CC9C89C78036f553F6969253D35F17a1CdD3870',
        name: 'Test Launch',
        symbol: 'TEST',
        description: 'Test Launch NFT Collection',
        imageUri: 'https://via.placeholder.com/400x400?text=NFT',
        maxSupply: 100,
        creator: '0x726965AD57752b79aF2C0Db0E5b08Fe00328dd8B',
        status: 'PENDING',
        currentPhase: 'NONE',
        autoProgress: false
      }
    });

    console.log('✅ Launch added successfully:', launchPool);
  } catch (error) {
    console.error('❌ Error adding launch:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLaunch();
