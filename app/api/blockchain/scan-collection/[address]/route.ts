import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, Address } from "viem";
import { sepolia } from "viem/chains";
import { NFT_COLLECTION_ABI } from "@/lib/contracts";
// Contract addresses - hardcoded for server-side use
const CONTRACT_ADDRESSES = {
  NFT_COLLECTION: "0xE6C16bF41Fb43278C5AD59dacB69381643689E8A" as const,
  MARKETPLACE: "0x..." as const, // Add marketplace address when available
};

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    console.log('Scanning collection:', address);
    
    if (!address) {
      return NextResponse.json(
        { error: "Collection address parameter is required" },
        { status: 400 }
      );
    }

    const collectionAddress = address as Address;
    
    // Get collection basic info
    let collectionName = "Unknown Collection";
    let totalSupply = 0n;
    
    try {
      collectionName = await publicClient.readContract({
        address: collectionAddress,
        abi: NFT_COLLECTION_ABI,
        functionName: 'name',
        args: [],
      }) as string;

      totalSupply = await publicClient.readContract({
        address: collectionAddress,
        abi: NFT_COLLECTION_ABI,
        functionName: 'totalSupply',
        args: [],
      }) as bigint;
    } catch (error) {
      console.error("Error getting collection info:", error);
      return NextResponse.json(
        { error: "Invalid ERC721 contract or contract not accessible" },
        { status: 400 }
      );
    }

    const tokens = [];
    const maxTokensToScan = Math.min(Number(totalSupply), 1000); // Limit to prevent timeout

    // Scan all tokens in the collection
    for (let tokenId = 0; tokenId < maxTokensToScan; tokenId++) {
      try {
        // Check if token exists
        let owner: Address;
        try {
          owner = await publicClient.readContract({
            address: collectionAddress,
            abi: NFT_COLLECTION_ABI,
            functionName: 'ownerOf',
            args: [BigInt(tokenId)],
          }) as Address;
        } catch (error) {
          // Token doesn't exist or was burned
          continue;
        }

        // Get token URI
        let tokenURI = "";
        let metadata = {
          name: `${collectionName} #${tokenId}`,
          description: "",
          image: "/placeholder-nft.png",
          attributes: [],
        };

        try {
          tokenURI = await publicClient.readContract({
            address: collectionAddress,
            abi: NFT_COLLECTION_ABI,
            functionName: 'tokenURI',
            args: [BigInt(tokenId)],
          }) as string;

          // Fetch metadata from IPFS or HTTP
          if (tokenURI && (tokenURI.startsWith('http') || tokenURI.startsWith('ipfs://'))) {
            let metadataUrl = tokenURI;
            if (tokenURI.startsWith('ipfs://')) {
              metadataUrl = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
            }

            try {
              const metadataResponse = await fetch(metadataUrl);
              
              if (metadataResponse.ok) {
                const fetchedMetadata = await metadataResponse.json();
                metadata = {
                  name: fetchedMetadata.name || metadata.name,
                  description: fetchedMetadata.description || metadata.description,
                  image: fetchedMetadata.image || metadata.image,
                  attributes: fetchedMetadata.attributes || metadata.attributes,
                };

                // Convert IPFS image URLs
                if (metadata.image.startsWith('ipfs://')) {
                  metadata.image = metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                }
              }
            } catch (metadataError) {
              console.error(`Error fetching metadata for token ${tokenId}:`, metadataError);
            }
          }
        } catch (error) {
          console.error(`Error getting tokenURI for token ${tokenId}:`, error);
        }

        // Check if collection is verified (our own collections are verified)
        const isVerified = collectionAddress.toLowerCase() === CONTRACT_ADDRESSES.NFT_COLLECTION.toLowerCase();

        // TODO: Check if NFT is listed on marketplace
        const isListed = false;
        const listingPrice = undefined;
        const listingId = undefined;

        tokens.push({
          tokenId: tokenId.toString(), // Convert BigInt to string for JSON serialization
          collection: collectionAddress,
          collectionName,
          owner,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          attributes: metadata.attributes,
          tokenURI,
          isVerified,
          isListed,
          listingPrice: listingPrice?.toString(), // Convert BigInt to string if exists
          listingId: listingId?.toString(), // Convert BigInt to string if exists
        });

      } catch (error) {
        console.error(`Error processing token ${tokenId}:`, error);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      collection: {
        address: collectionAddress,
        name: collectionName,
        totalSupply: totalSupply.toString(),
        scannedTokens: tokens.length,
      },
      tokens,
    });

  } catch (error) {
    console.error("Error scanning collection:", error);
    return NextResponse.json(
      { error: "Failed to scan collection" },
      { status: 500 }
    );
  }
}
