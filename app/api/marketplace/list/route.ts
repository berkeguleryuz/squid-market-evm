import { NextRequest, NextResponse } from "next/server";
// Contract addresses - hardcoded for server-side use
const CONTRACT_ADDRESSES = {
  MARKETPLACE: "0x..." as const, // Add marketplace address when available
};
import { MARKETPLACE_ABI } from "@/lib/contracts";
import { parseEther } from "viem";

export async function POST(request: NextRequest) {
  try {
    const { collection, tokenId, price, listingType = 0 } = await request.json();

    if (!collection || !tokenId || !price) {
      return NextResponse.json(
        { error: "Missing required fields: collection, tokenId, price" },
        { status: 400 }
      );
    }

    // Validate price
    const priceInWei = parseEther(price);
    if (priceInWei <= 0n) {
      return NextResponse.json(
        { error: "Price must be greater than 0" },
        { status: 400 }
      );
    }

    // Note: In a real implementation, you would need to handle wallet connection
    // and transaction signing on the frontend. This API provides the necessary
    // contract interaction details for the frontend.

    return NextResponse.json({
      success: true,
      message: "List transaction should be handled on frontend with connected wallet",
      contractAddress: CONTRACT_ADDRESSES.MARKETPLACE,
      functionName: "listNFT",
      args: [
        collection,
        BigInt(tokenId),
        priceInWei.toString(),
        listingType,
        0, // endTime (0 for fixed price listings)
      ],
      steps: [
        {
          step: 1,
          description: "Approve NFT for marketplace",
          contractAddress: collection,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.MARKETPLACE, BigInt(tokenId)],
        },
        {
          step: 2,
          description: "List NFT on marketplace",
          contractAddress: CONTRACT_ADDRESSES.MARKETPLACE,
          functionName: "listNFT",
          args: [
            collection,
            BigInt(tokenId),
            priceInWei.toString(),
            listingType,
            0,
          ],
        },
      ],
    });

  } catch (error) {
    console.error("Error processing list request:", error);
    return NextResponse.json(
      { error: "Failed to process list request" },
      { status: 500 }
    );
  }
}
