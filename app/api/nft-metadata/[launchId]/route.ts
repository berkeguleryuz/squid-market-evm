import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { launchId: string } }
) {
  try {
    const launchId = parseInt(params.launchId);

    if (isNaN(launchId)) {
      return NextResponse.json(
        { error: "Invalid launch ID" },
        { status: 400 }
      );
    }

    // Get all unminted NFTs for this launch
    const availableNFTs = await prisma.nFTMetadata.findMany({
      where: {
        launchId,
        isMinted: false,
      },
      orderBy: {
        tokenId: "asc",
      },
    });

    console.log(`🔍 Found ${availableNFTs.length} available NFTs for launch ${launchId}`);

    return NextResponse.json({
      success: true,
      launchId,
      availableNFTs,
      count: availableNFTs.length,
    });
  } catch (error) {
    console.error("❌ Error fetching NFT metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch NFT metadata" },
      { status: 500 }
    );
  }
}

// Mark NFT as minted
export async function PATCH(
  request: NextRequest,
  { params }: { params: { launchId: string } }
) {
  try {
    const launchId = parseInt(params.launchId);
    const { tokenId, mintedTo } = await request.json();

    if (isNaN(launchId) || !tokenId || !mintedTo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Mark NFT as minted
    const updatedNFT = await prisma.nFTMetadata.update({
      where: {
        launchId_tokenId: {
          launchId,
          tokenId: parseInt(tokenId),
        },
      },
      data: {
        isMinted: true,
        mintedTo,
        mintedAt: new Date(),
      },
    });

    console.log(`✅ NFT ${tokenId} marked as minted to ${mintedTo}`);

    return NextResponse.json({
      success: true,
      nft: updatedNFT,
    });
  } catch (error) {
    console.error("❌ Error updating NFT metadata:", error);
    return NextResponse.json(
      { error: "Failed to update NFT metadata" },
      { status: 500 }
    );
  }
}
