import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    // Get all NFTs minted by this user from our database
    const userNFTs = await prisma.nFTMetadata.findMany({
      where: {
        mintedTo: address.toLowerCase(),
        isMinted: true,
      },
      orderBy: {
        mintedAt: 'desc',
      },
    });

    // Get launch info for each NFT
    const launchIds = [...new Set(userNFTs.map(nft => nft.launchId))];
    const launches = await prisma.launchPool.findMany({
      where: {
        launchId: {
          in: launchIds,
        },
      },
    });

    // Transform data for frontend
    const formattedNFTs = userNFTs.map((nft) => {
      const launch = launches.find(l => l.launchId === nft.launchId);
      
      return {
        tokenId: BigInt(nft.tokenId),
        collection: nft.collectionAddress || "",
        collectionName: launch?.name || "Unknown Collection",
        name: nft.name,
        description: nft.description || "",
        image: nft.image || "/placeholder.jpg",
        attributes: nft.attributes || [],
        isListed: false, // Will be updated when we check marketplace listings
        metadataUri: nft.metadataUri,
        acquiredAt: nft.mintedAt,
        launchId: nft.launchId,
      };
    });

    return NextResponse.json({
      success: true,
      nfts: formattedNFTs,
      count: formattedNFTs.length,
    });

  } catch (error) {
    console.error("Error fetching user NFTs:", error);
    return NextResponse.json(
      { error: "Failed to fetch user NFTs" },
      { status: 500 }
    );
  }
}
