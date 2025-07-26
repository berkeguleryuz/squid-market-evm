import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    console.log("📤 Uploading image to IPFS:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // For now, we'll use a simple approach with Pinata
    // You'll need to add PINATA_JWT to your .env.local file
    const pinataJWT = process.env.PINATA_JWT;

    if (!pinataJWT) {
      // Fallback: return a placeholder URL for development
      console.warn("⚠️ PINATA_JWT not found, using placeholder");
      const placeholderUrl = `https://via.placeholder.com/400x400?text=${encodeURIComponent(
        file.name
      )}`;

      return NextResponse.json({
        success: true,
        ipfsUrl: placeholderUrl,
        message: "Using placeholder (PINATA_JWT not configured)",
      });
    }

    // Upload to Pinata IPFS with retry logic for 429 errors
    const uploadToPinata = async (retryCount = 0): Promise<{ IpfsHash: string; [key: string]: any }> => {
      const pinataFormData = new FormData();
      pinataFormData.append("file", file);

      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          type: "nft-collection-cover",
        },
      });
      pinataFormData.append("pinataMetadata", metadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 0,
      });
      pinataFormData.append("pinataOptions", pinataOptions);

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${pinataJWT}`,
          },
          body: pinataFormData,
        }
      );

      const result = await response.json();

      // Handle 429 (Rate Limit) errors with retry
      if (response.status === 429) {
        const maxRetries = 10; // Maximum retry attempts
        const baseDelay = 1000; // Base delay in milliseconds
        const backoffMultiplier = 2; // Exponential backoff multiplier
        
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(backoffMultiplier, retryCount);
          console.warn(`⚠️ Pinata rate limit hit (429), retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Recursive retry
          return uploadToPinata(retryCount + 1);
        } else {
          throw new Error(`Pinata rate limit exceeded after ${maxRetries} attempts`);
        }
      }

      if (!response.ok) {
        throw new Error(result.error?.details || `Pinata upload failed with status ${response.status}`);
      }

      return result;
    };

    const result = await uploadToPinata();

    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

    console.log("✅ Image uploaded to IPFS successfully:", {
      hash: result.IpfsHash,
      url: ipfsUrl,
      fileName: file.name,
      fileSize: file.size,
    });

    return NextResponse.json({
      success: true,
      ipfsUrl,
      ipfsHash: result.IpfsHash,
      gateway: "https://gateway.pinata.cloud/ipfs/",
    });
  } catch (error) {
    console.error("❌ IPFS upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
