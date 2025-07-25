import { NextRequest, NextResponse } from "next/server";
import { discoverCollections, getAllKnownCollections, scanCollectionNFTs } from "@/lib/services/blockchainDiscovery";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'collections';
    const collectionAddress = searchParams.get('collection');
    const maxResults = parseInt(searchParams.get('limit') || '100');

    console.log(`🔍 Blockchain discovery API called: action=${action}, collection=${collectionAddress}`);

    switch (action) {
      case 'collections':
        // Discover all NFT collections
        const collections = await getAllKnownCollections();
        
        console.log(`✅ Found ${collections.length} collections`);
        
        return NextResponse.json({
          success: true,
          collections: collections.slice(0, maxResults),
          total: collections.length,
        });

      case 'scan':
        // Scan specific collection for NFTs
        if (!collectionAddress) {
          return NextResponse.json(
            { success: false, error: "Collection address required for scan action" },
            { status: 400 }
          );
        }

        const nfts = await scanCollectionNFTs(collectionAddress as any, maxResults);
        
        console.log(`✅ Scanned ${nfts.length} NFTs from ${collectionAddress}`);
        
        return NextResponse.json({
          success: true,
          collection: collectionAddress,
          nfts,
          total: nfts.length,
        });

      case 'discover':
        // Discover new collections from recent blocks
        const discovered = await discoverCollections(0n, "latest", maxResults);
        
        console.log(`✅ Discovered ${discovered.length} new collections`);
        
        return NextResponse.json({
          success: true,
          discovered,
          total: discovered.length,
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: collections, scan, or discover" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Blockchain discovery API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Discovery failed' 
      },
      { status: 500 }
    );
  }
}
