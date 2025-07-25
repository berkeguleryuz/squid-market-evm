import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface NFTMetadata {
  id: number;
  name: string;
  description: string;
  image: string;
  imageData?: string; // Base64 image data
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { nfts, launchId, collectionAddress } = await request.json();

    if (!nfts || !Array.isArray(nfts) || nfts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No NFTs provided" },
        { status: 400 }
      );
    }

    if (launchId === undefined || launchId === null || !collectionAddress) {
      return NextResponse.json(
        { success: false, error: "Launch ID and collection address required" },
        { status: 400 }
      );
    }

    console.log("📦 Batch NFT Upload Request:", {
      launchId,
      collectionAddress,
      nftCount: nfts.length,
      firstNFT: nfts[0],
    });

    // Validate NFT metadata
    const validatedNFTs: NFTMetadata[] = [];
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      if (!nft.name) {
        return NextResponse.json(
          { success: false, error: `NFT #${i + 1} missing name` },
          { status: 400 }
        );
      }

      validatedNFTs.push({
        id: nft.id || i + 1,
        name: nft.name,
        description: nft.description,
        image: nft.image || "",
        attributes: nft.attributes || [],
      });
    }

    // Upload each NFT metadata to IPFS
    const pinataJWT = process.env.PINATA_JWT;
    const uploadedNFTs = [];

    if (!pinataJWT) {
      console.warn("⚠️ PINATA_JWT not found, using mock metadata");

      // Mock upload for development
      for (let i = 0; i < validatedNFTs.length; i++) {
        const nft = validatedNFTs[i];
        uploadedNFTs.push({
          tokenId: i + 1,
          name: nft.name,
          description: nft.description,
          image:
            nft.image ||
            `https://via.placeholder.com/400x400?text=NFT+${i + 1}`,
          attributes: nft.attributes,
          metadataUri: `https://mock-metadata.com/nft/${i + 1}.json`,
        });
      }
    } else {
      // Real IPFS upload
      for (let i = 0; i < validatedNFTs.length; i++) {
        const nft = validatedNFTs[i];

        try {
          console.log(
            `🔄 Uploading NFT ${i + 1}/${validatedNFTs.length}: ${nft.name}`
          );

          let imageUrl = nft.image;
          
          console.log(`🔍 NFT ${i + 1} - imageData exists: ${!!nft.imageData}`);
          console.log(`🔍 NFT ${i + 1} - imageData starts with data: ${nft.imageData?.startsWith("data:") || false}`);
          console.log(`🔍 NFT ${i + 1} - initial imageUrl: ${imageUrl}`);

          // Upload image to IPFS if base64 data is available
          if (nft.imageData && nft.imageData.startsWith("data:")) {
            console.log(`📸 Uploading image for NFT ${i + 1}...`);
            console.log(`🔍 Base64 data length: ${nft.imageData.length}`);
            console.log(`🔍 Base64 prefix: ${nft.imageData.substring(0, 50)}...`);

            try {
              // Convert base64 to blob
              const base64Data = nft.imageData.split(',')[1];
              const mimeType = nft.imageData.split(',')[0].split(':')[1].split(';')[0];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const imageBlob = new Blob([byteArray], { type: mimeType });
              
              // Create form data for image upload
              const imageFormData = new FormData();
              const fileExtension = mimeType.split('/')[1] || 'png';
              const fileName = `${nft.name.replace(
                /[^a-zA-Z0-9]/g,
                "_"
              )}_image.${fileExtension}`;
              imageFormData.append("file", imageBlob, fileName);

              const imagePinataMetadata = JSON.stringify({
                name: `${nft.name} - Image`,
                keyvalues: {
                  tokenId: (i + 1).toString(),
                  collection: collectionAddress,
                  launchId: launchId.toString(),
                  type: "nft-image",
                },
              });
              imageFormData.append("pinataMetadata", imagePinataMetadata);

              // Upload image to IPFS
              const imageUploadResponse = await fetch(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${pinataJWT}`,
                  },
                  body: imageFormData,
                }
              );

              const imageResult = await imageUploadResponse.json();

              if (imageUploadResponse.ok) {
                imageUrl = `https://gateway.pinata.cloud/ipfs/${imageResult.IpfsHash}`;
                console.log(`✅ Image uploaded for NFT ${i + 1}: ${imageUrl}`);
              } else {
                console.error(
                  `❌ Failed to upload image for NFT ${i + 1}:`,
                  imageResult
                );
                // Keep original URL as fallback
              }
            } catch (imageError) {
              console.error(
                `❌ Image upload error for NFT ${i + 1}:`,
                imageError
              );
              // Keep original URL as fallback
            }
          }

          // Create metadata JSON with IPFS image URL
          const metadata = {
            name: nft.name,
            description: nft.description,
            image: imageUrl,
            attributes: nft.attributes,
            tokenId: i + 1,
            collection: collectionAddress,
            launchId: launchId,
          };

          // Upload metadata to IPFS
          const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
            type: "application/json",
          });

          const formData = new FormData();
          formData.append(
            "file",
            metadataBlob,
            `${nft.name.replace(/[^a-zA-Z0-9]/g, "_")}_metadata.json`
          );

          const pinataMetadata = JSON.stringify({
            name: `${nft.name} - Metadata`,
            keyvalues: {
              tokenId: (i + 1).toString(),
              collection: collectionAddress,
              launchId: launchId.toString(),
              type: "nft-metadata",
            },
          });
          formData.append("pinataMetadata", pinataMetadata);

          const response = await fetch(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${pinataJWT}`,
              },
              body: formData,
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error?.details || "Pinata upload failed");
          }

          const metadataUri = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

          // Save to database
          try {
            await prisma.nFTMetadata.create({
              data: {
                launchId: parseInt(launchId),
                collectionAddress,
                tokenId: i + 1,
                name: nft.name,
                description: nft.description,
                image: imageUrl,
                attributes: nft.attributes,
                metadataUri,
                ipfsHash: result.IpfsHash,
                isMinted: false,
              },
            });
            console.log(`💾 NFT ${i + 1} saved to database`);
          } catch (dbError) {
            console.error(`❌ Failed to save NFT ${i + 1} to database:`, dbError);
            // Continue with upload even if database save fails
          }

          uploadedNFTs.push({
            tokenId: i + 1,
            name: nft.name,
            description: nft.description,
            image: nft.image,
            attributes: nft.attributes,
            metadataUri,
            ipfsHash: result.IpfsHash,
          });

          console.log(`✅ NFT ${i + 1} uploaded: ${metadataUri}`);
        } catch (error) {
          console.error(`❌ Failed to upload NFT ${i + 1}:`, error);

          // Continue with placeholder for failed uploads
          uploadedNFTs.push({
            tokenId: i + 1,
            name: nft.name,
            description: nft.description,
            image:
              nft.image ||
              `https://via.placeholder.com/400x400?text=NFT+${i + 1}`,
            attributes: nft.attributes,
            metadataUri: `https://placeholder-metadata.com/nft/${i + 1}.json`,
            error: error instanceof Error ? error.message : "Upload failed",
          });
        }
      }
    }

    console.log("✅ Batch NFT upload completed:", {
      launchId,
      collectionAddress,
      totalNFTs: uploadedNFTs.length,
      successfulUploads: uploadedNFTs.filter((nft) => !nft.error).length,
      failedUploads: uploadedNFTs.filter((nft) => nft.error).length,
    });

    return NextResponse.json({
      success: true,
      launchId,
      collectionAddress,
      nfts: uploadedNFTs,
      totalCount: uploadedNFTs.length,
      successCount: uploadedNFTs.filter((nft) => !nft.error).length,
      failureCount: uploadedNFTs.filter((nft) => nft.error).length,
    });
  } catch (error) {
    console.error("❌ Batch NFT upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Batch upload failed",
      },
      { status: 500 }
    );
  }
}
