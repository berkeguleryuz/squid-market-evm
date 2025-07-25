import { NextRequest, NextResponse } from 'next/server';
import { 
  scanCollection, 
  scanAllKnownCollections, 
  getNFTsOwnedBy, 
  getAllMarketplaceNFTs,
  getCollectionStats 
} from '@/lib/services/nftScanner';
import { KNOWN_COLLECTIONS } from '@/lib/config/knownCollections';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const collection = searchParams.get('collection');
    const owner = searchParams.get('owner');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log(`🔍 NFT Scanner API called: action=${action}, collection=${collection}, owner=${owner}`);

    switch (action) {
      case 'scan-collection':
        if (!collection) {
          return NextResponse.json({ 
            success: false, 
            error: 'Collection address required' 
          }, { status: 400 });
        }
        
        const collectionNFTs = await scanCollection(collection, limit);
        return NextResponse.json({
          success: true,
          data: collectionNFTs,
          count: collectionNFTs.length,
          collection: collection
        });

      case 'collection-stats':
        if (!collection) {
          return NextResponse.json({ 
            success: false, 
            error: 'Collection address required' 
          }, { status: 400 });
        }
        
        const stats = await getCollectionStats(collection);
        return NextResponse.json({
          success: true,
          data: stats
        });

      case 'user-nfts':
        if (!owner) {
          return NextResponse.json({ 
            success: false, 
            error: 'Owner address required' 
          }, { status: 400 });
        }
        
        const userNFTs = await getNFTsOwnedBy(owner);
        return NextResponse.json({
          success: true,
          data: userNFTs,
          count: userNFTs.length,
          owner: owner
        });

      case 'marketplace-nfts':
        const marketplaceNFTs = await getAllMarketplaceNFTs();
        
        // Apply pagination
        const startIndex = parseInt(searchParams.get('offset') || '0');
        const endIndex = startIndex + limit;
        const paginatedNFTs = marketplaceNFTs.slice(startIndex, endIndex);
        
        return NextResponse.json({
          success: true,
          data: paginatedNFTs,
          total: marketplaceNFTs.length,
          count: paginatedNFTs.length,
          offset: startIndex,
          limit: limit,
          hasMore: endIndex < marketplaceNFTs.length
        });

      case 'known-collections':
        return NextResponse.json({
          success: true,
          data: KNOWN_COLLECTIONS,
          count: KNOWN_COLLECTIONS.length
        });

      case 'scan-all':
        const allNFTs = await scanAllKnownCollections();
        return NextResponse.json({
          success: true,
          data: allNFTs,
          count: allNFTs.length,
          collections: KNOWN_COLLECTIONS.length
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Available actions: scan-collection, collection-stats, user-nfts, marketplace-nfts, known-collections, scan-all' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ NFT Scanner API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
