const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Known verified collections
const VERIFIED_COLLECTIONS = [
  '0xE4Ee962f37A4C305c3F8Abf4F5ceC2347fd87A03', // BG Test
  '0x2a0f1c1ce263202f629bf41fa7caa3d5f8fd52c4', // BTEST2 (if this is the correct address)
];

async function cleanupUnverifiedCollections() {
  try {
    console.log('🔍 Checking current launch pools in database...');
    
    // Get all launch pools
    const allLaunchPools = await prisma.launchPool.findMany({
      select: {
        id: true,
        name: true,
        contractAddress: true,
        symbol: true,
        status: true,
      }
    });
    
    console.log('📊 Current launch pools:');
    allLaunchPools.forEach(pool => {
      console.log(`- ${pool.name} (${pool.symbol}) - ${pool.contractAddress} - Status: ${pool.status}`);
    });
    
    // Find unverified collections
    const unverifiedPools = allLaunchPools.filter(pool => 
      !VERIFIED_COLLECTIONS.includes(pool.contractAddress)
    );
    
    if (unverifiedPools.length === 0) {
      console.log('✅ No unverified collections found in database.');
      return;
    }
    
    console.log('\n🗑️  Unverified collections to be removed:');
    unverifiedPools.forEach(pool => {
      console.log(`- ${pool.name} (${pool.symbol}) - ${pool.contractAddress}`);
    });
    
    // Remove unverified collections
    const deleteResult = await prisma.launchPool.deleteMany({
      where: {
        contractAddress: {
          notIn: VERIFIED_COLLECTIONS
        }
      }
    });
    
    console.log(`\n✅ Removed ${deleteResult.count} unverified collections from database.`);
    
    // Show remaining collections
    const remainingPools = await prisma.launchPool.findMany({
      select: {
        id: true,
        name: true,
        contractAddress: true,
        symbol: true,
        status: true,
      }
    });
    
    console.log('\n📊 Remaining verified collections:');
    remainingPools.forEach(pool => {
      console.log(`- ${pool.name} (${pool.symbol}) - ${pool.contractAddress} - Status: ${pool.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up collections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUnverifiedCollections();
