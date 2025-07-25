import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, Address } from "viem";
import { sepolia } from "viem/chains";
import { isCollectionVerified, getVerifiedCollection } from "@/lib/data/verifiedCollections";
import { NFT_COLLECTION_ABI } from "@/lib/contracts";

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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    console.log('Fetching NFTs from collection:', address);
    
    if (!address) {
      return NextResponse.json(
        { error: "Collection address parameter is required" },
        { status: 400 }
      );
    }

    const collectionAddress = address as Address;
    
    // Check if collection is verified
    const isVerified = isCollectionVerified(address);
    const verifiedInfo = getVerifiedCollection(address);
    
    // Get collection basic info
    let collectionName = verifiedInfo?.name || "Unknown Collection";
    let totalSupply = 0n;
    let maxSupply = 0n;
    
    try {
      // First try to get totalSupply (standard ERC721)
      try {
        totalSupply = await publicClient.readContract({
          address: collectionAddress,
          abi: NFT_COLLECTION_ABI,
          functionName: 'totalSupply',
          args: [],
        }) as bigint;
      } catch (e) {
        console.log("totalSupply not available, using getCollectionInfo");
      }

      // Get detailed collection info from our contract
      const collectionInfo = await publicClient.readContract({
        address: collectionAddress,
        abi: NFT_COLLECTION_ABI,
        functionName: 'getCollectionInfo',
        args: [],
      }) as unknown;

      // Handle tuple response from contract
      if (collectionInfo && typeof collectionInfo === 'object') {
        const info = collectionInfo as any;
        collectionName = verifiedInfo?.name || info[0] || "Unknown Collection";
        maxSupply = BigInt(info[5] || 0); // maxSupply
        // Use currentSupply from getCollectionInfo if totalSupply failed
        if (totalSupply === 0n) {
          totalSupply = BigInt(info[6] || 0); // currentSupply
        }
      }
    } catch (error) {
      console.error("Error getting collection info:", error);
      // If it's not our contract or doesn't have getCollectionInfo, return empty result
      return NextResponse.json({
        success: true,
        collection: {
          address: collectionAddress,
          name: collectionName,
          isVerified,
          totalSupply: "0",
          maxSupply: "0",
          scannedTokens: 0,
        },
        nfts: [],
      });
    }

    const nfts = [];
    const maxTokensToScan = Math.min(Number(totalSupply), limit);

    console.log(`Scanning ${maxTokensToScan} tokens from ${collectionName}`);

    // Scan tokens
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

        // Get token URI and metadata
        let tokenURI = "";
        let metadata = {
          name: `${collectionName} #${tokenId}`,
          description: verifiedInfo?.description || "",
          image: verifiedInfo?.image || "/placeholder-nft.png",
          attributes: [],
        };

        try {
          tokenURI = await publicClient.readContract({
            address: collectionAddress,
            abi: NFT_COLLECTION_ABI,
            functionName: 'tokenURI',
            args: [BigInt(tokenId)],
          }) as string;

          // Fetch metadata if tokenURI exists
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

        nfts.push({
          tokenId: BigInt(tokenId),
          collection: collectionAddress,
          collectionName,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          attributes: metadata.attributes,
          owner,
          isVerified,
          isListed: false, // TODO: Check marketplace listings
          listingPrice: undefined,
          listingId: undefined,
        });

      } catch (error) {
        console.error(`Error processing token ${tokenId}:`, error);
        continue;
      }
    }

    console.log(`Successfully scanned ${nfts.length} NFTs from ${collectionName}`);

    return NextResponse.json({
      success: true,
      collection: {
        address: collectionAddress,
        name: collectionName,
        isVerified,
        totalSupply: totalSupply.toString(),
        maxSupply: maxSupply.toString(),
        scannedTokens: nfts.length,
      },
      nfts,
    });

  } catch (error) {
    console.error("Error scanning collection:", error);
    return NextResponse.json(
      { error: "Failed to scan collection" },
      { status: 500 }
    );
  }
}
