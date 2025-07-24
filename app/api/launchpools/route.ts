import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - List all launch pools
export async function GET() {
  try {
    const launchPools = await prisma.launchPool.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: launchPools,
    });
  } catch (error) {
    console.error("Error fetching launch pools:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch launch pools" },
      { status: 500 }
    );
  }
}

// POST - Create new launch pool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      launchId,
      contractAddress,
      launchpadAddress,
      name,
      symbol,
      description,
      imageUri,
      maxSupply,
      creator,
      status = "PENDING",
      autoProgress = false,
    } = body;

    // Debug logging
    console.log("🔍 API Request Body:", {
      launchId,
      contractAddress,
      launchpadAddress,
      name,
      symbol,
      description,
      imageUri,
      maxSupply,
      creator,
      status,
      autoProgress,
    });

    // Validate required fields
    if (
      !launchId ||
      !contractAddress ||
      !launchpadAddress ||
      !name ||
      !symbol ||
      !maxSupply ||
      !creator
    ) {
      console.error("❌ Missing required fields:", {
        launchId: !!launchId,
        contractAddress: !!contractAddress,
        launchpadAddress: !!launchpadAddress,
        name: !!name,
        symbol: !!symbol,
        maxSupply: !!maxSupply,
        creator: !!creator,
      });
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const launchPool = await prisma.launchPool.create({
      data: {
        launchId: parseInt(launchId),
        contractAddress,
        launchpadAddress,
        name,
        symbol,
        description: description || `${name} NFT Collection`,
        imageUri: imageUri || "https://via.placeholder.com/400x400?text=NFT",
        maxSupply: parseInt(maxSupply),
        creator,
        status,
        autoProgress,
      },
    });

    return NextResponse.json({
      success: true,
      data: launchPool,
    });
  } catch (error) {
    console.error("Error creating launch pool:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create launch pool" },
      { status: 500 }
    );
  }
}

// PUT - Update launch pool status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, startTime, endTime, currentPhase, totalRaised } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Launch pool ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (currentPhase) updateData.currentPhase = currentPhase;
    if (totalRaised) updateData.totalRaised = totalRaised;

    const launchPool = await prisma.launchPool.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: launchPool,
    });
  } catch (error) {
    console.error("Error updating launch pool:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update launch pool" },
      { status: 500 }
    );
  }
}
