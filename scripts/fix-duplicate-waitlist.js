const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDuplicateWaitlist() {
  try {
    console.log('🔍 Checking for duplicate waitlist entries...');
    
    // Get all waitlist entries
    const allEntries = await prisma.waitlist.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📊 Found ${allEntries.length} total waitlist entries`);
    
    // Group by email to find duplicates
    const emailGroups = {};
    allEntries.forEach(entry => {
      if (!emailGroups[entry.email]) {
        emailGroups[entry.email] = [];
      }
      emailGroups[entry.email].push(entry);
    });
    
    // Find duplicates
    const duplicates = Object.entries(emailGroups).filter(([email, entries]) => entries.length > 1);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate entries found');
      return;
    }
    
    console.log(`⚠️ Found ${duplicates.length} duplicate emails:`);
    duplicates.forEach(([email, entries]) => {
      console.log(`  - ${email}: ${entries.length} entries`);
    });
    
    // Remove duplicates (keep the oldest entry)
    let removedCount = 0;
    for (const [email, entries] of duplicates) {
      // Keep the first (oldest) entry, remove the rest
      const toRemove = entries.slice(1);
      
      for (const entry of toRemove) {
        await prisma.waitlist.delete({
          where: { id: entry.id }
        });
        removedCount++;
        console.log(`🗑️ Removed duplicate entry for ${email} (ID: ${entry.id})`);
      }
    }
    
    console.log(`✅ Removed ${removedCount} duplicate entries`);
    console.log(`📊 Remaining unique entries: ${allEntries.length - removedCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing duplicate waitlist entries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateWaitlist();
