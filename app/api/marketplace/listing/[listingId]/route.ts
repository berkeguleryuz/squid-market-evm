import { NextRequest, NextResponse } from "next/server";
// Contract addresses - hardcoded for server-side use
const CONTRACT_ADDRESSES = {
  NFT_COLLECTION: "0xE6C16bF41Fb43278C5AD59dacB69381643689E8A" as const,
  MARKETPLACE: "0x..." as const, // Add marketplace address when available
};
import { MARKETPLACE_ABI, NFT_COLLECTION_ABI } from "@/lib/contracts";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    
    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID parameter is required" },
        { status: 400 }
      );
    }

    const marketplaceAddress = CONTRACT_ADDRESSES.MARKETPLACE;
    const listingIdBigInt = BigInt(listingId);

    // Get listing data from contract
    const listingData = await publicClient.readContract({
      address: marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'listings',
      args: [listingIdBigInt],
    }) as any[];

    if (!listingData || listingData.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Parse listing data
    const [
      listingIdFromContract,
      collection,
      tokenId,
      seller,
      price,
      listingType,
      status,
      createdAt,
      endTime,
      highestBidder,
      highestBid
    ] = listingData;

    // Get NFT metadata
    let nftMetadata = {
      name: `NFT #${tokenId}`,
      description: "",
      image: "/placeholder-nft.png",
      attributes: [],
    };

    try {
      // Try to get metadata from our database first
      const dbResponse = await fetch(`${request.nextUrl.origin}/api/nft-metadata/token/${tokenId}`);
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        nftMetadata = {
          name: dbData.name || nftMetadata.name,
          description: dbData.description || nftMetadata.description,
          image: dbData.image || nftMetadata.image,
          attributes: dbData.attributes || nftMetadata.attributes,
        };
      } else {
        // Fallback to contract tokenURI
        const tokenURI = await publicClient.readContract({
          address: collection,
          abi: NFT_COLLECTION_ABI,
          functionName: 'tokenURI',
          args: [tokenId],
        }) as string;

        if (tokenURI && tokenURI.startsWith('http')) {
          const metadataResponse = await fetch(tokenURI);
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            nftMetadata = {
              name: metadata.name || nftMetadata.name,
              description: metadata.description || nftMetadata.description,
              image: metadata.image || nftMetadata.image,
              attributes: metadata.attributes || nftMetadata.attributes,
            };
          }
        }
      }
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
    }

    // Get collection name
    let collectionName = "Unknown Collection";
    try {
      collectionName = await publicClient.readContract({
        address: collection,
        abi: NFT_COLLECTION_ABI,
        functionName: 'name',
        args: [],
      }) as string;
    } catch (error) {
      console.error("Error fetching collection name:", error);
    }

    // Check if collection is verified (for now, we'll consider our own collections as verified)
    const isVerified = collection.toLowerCase() === CONTRACT_ADDRESSES.NFT_COLLECTION.toLowerCase();

    // Format the listing
    const formattedListing = {
      listingId: listingIdBigInt,
      tokenId,
      collection,
      collectionName,
      name: nftMetadata.name,
      description: nftMetadata.description,
      image: nftMetadata.image,
      attributes: nftMetadata.attributes,
      seller,
      price: (Number(price) / 1e18).toString(), // Convert from wei to ETH
      listingType: Number(listingType),
      status: Number(status),
      createdAt: new Date(Number(createdAt) * 1000),
      endTime: Number(endTime) > 0 ? new Date(Number(endTime) * 1000) : undefined,
      highestBidder: highestBidder !== '0x0000000000000000000000000000000000000000' ? highestBidder : undefined,
      highestBid: Number(highestBid) > 0 ? (Number(highestBid) / 1e18).toString() : undefined,
      isVerified,
    };

    return NextResponse.json({
      success: true,
      listing: formattedListing,
    });

  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}
