const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Only verified collection addresses (case insensitive check)
const VERIFIED_COLLECTIONS = [
  '0xE4Ee962f37A4C305c3F8Abf4F5ceC2347fd87A03', // BG Test
];

// Case insensitive check function
function isVerifiedCollection(address) {
  return VERIFIED_COLLECTIONS.some(verified => 
    verified.toLowerCase() === address.toLowerCase()
  );
}

async function cleanupUnverifiedNFTs() {
  try {
    console.log('🔍 Checking current NFTs in database...');
    
    // Get all NFTs grouped by collection
    const allNFTs = await prisma.nFT.groupBy({
      by: ['collectionAddress'],
      _count: {
        tokenId: true
      }
    });
    
    console.log('📊 Current NFTs by collection:');
    for (const group of allNFTs) {
      const verified = isVerifiedCollection(group.collectionAddress);
      console.log(`- ${group.collectionAddress}: ${group._count.tokenId} NFTs ${verified ? '✅ VERIFIED' : '❌ UNVERIFIED'}`);
    }
    
    // Find unverified NFTs
    const unverifiedCollections = allNFTs
      .filter(group => !isVerifiedCollection(group.collectionAddress))
      .map(group => group.collectionAddress);
    
    if (unverifiedCollections.length === 0) {
      console.log('✅ No unverified NFTs found in database.');
      return;
    }
    
    console.log('\n🗑️  Removing NFTs from unverified collections...');
    
    // Remove unverified NFTs
    const deleteResult = await prisma.nFT.deleteMany({
      where: {
        collectionAddress: {
          in: unverifiedCollections
        }
      }
    });
    
    console.log(`✅ Removed ${deleteResult.count} NFTs from unverified collections.`);
    
    // Show remaining NFTs
    const remainingNFTs = await prisma.nFT.groupBy({
      by: ['collectionAddress'],
      _count: {
        tokenId: true
      }
    });
    
    console.log('\n📊 Remaining NFTs (verified collections only):');
    for (const group of remainingNFTs) {
      console.log(`- ${group.collectionAddress}: ${group._count.tokenId} NFTs ✅`);
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up NFTs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUnverifiedNFTs();
