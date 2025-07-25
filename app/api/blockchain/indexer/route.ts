import { NextRequest, NextResponse } from "next/server";
import { blockchainIndexer } from "@/lib/services/blockchainIndexer";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        await blockchainIndexer.start();
        return NextResponse.json({
          success: true,
          message: 'Blockchain indexer started',
        });

      case 'stop':
        await blockchainIndexer.stop();
        return NextResponse.json({
          success: true,
          message: 'Blockchain indexer stopped',
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start or stop' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Blockchain indexer API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Indexer operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Blockchain indexer API is running',
    endpoints: {
      'POST /api/blockchain/indexer': {
        actions: ['start', 'stop'],
        description: 'Control blockchain indexer',
      },
    },
  });
}
