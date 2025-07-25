const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearCollectionCache() {
  try {
    console.log('🗑️ Clearing collection cache...');
    
    // Clear all collection cache entries
    const deleteResult = await prisma.collectionCache.deleteMany({});
    
    console.log(`✅ Cleared ${deleteResult.count} collection cache entries`);
    console.log('🔄 Collections will be fetched fresh from blockchain on next request');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCollectionCache();
