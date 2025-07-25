import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString(),
  );

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  // Deployment results
  const deployments: Record<string, string> = {};

  try {
    // 1. Deploy PaymentHandler first (needs _feeRecipient)
    console.log("\n📦 Deploying PaymentHandler...");
    const PaymentHandler = await ethers.getContractFactory("PaymentHandler");
    const paymentHandler = await PaymentHandler.deploy(deployer.address); // Pass deployer as fee recipient
    await paymentHandler.waitForDeployment();
    const paymentHandlerAddress = await paymentHandler.getAddress();
    deployments.PaymentHandler = paymentHandlerAddress;
    console.log("✅ PaymentHandler deployed to:", paymentHandlerAddress);

    // 2. Deploy Marketplace (needs _feeRecipient)
    console.log("\n📦 Deploying Marketplace...");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(deployer.address); // Pass deployer as fee recipient
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    deployments.Marketplace = marketplaceAddress;
    console.log("✅ Marketplace deployed to:", marketplaceAddress);

    // 3. Deploy LaunchpadCore (needs _feeRecipient)
    console.log("\n📦 Deploying LaunchpadCore...");
    const LaunchpadCore = await ethers.getContractFactory("LaunchpadCore");
    const launchpadCore = await LaunchpadCore.deploy(deployer.address); // Pass deployer as fee recipient
    await launchpadCore.waitForDeployment();
    const launchpadCoreAddress = await launchpadCore.getAddress();
    deployments.LaunchpadCore = launchpadCoreAddress;
    console.log("✅ LaunchpadCore deployed to:", launchpadCoreAddress);

    // 4. Deploy a test NFTCollection for demo
    console.log("\n📦 Deploying test NFTCollection...");
    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    const nftCollection = await NFTCollection.deploy(
      "Squid Test Collection",
      "SQUID",
      "A test collection for Squid Market",
      "https://example.com/collection.jpg",
      1000, // maxSupply
      deployer.address, // creator
    );
    await nftCollection.waitForDeployment();
    const nftCollectionAddress = await nftCollection.getAddress();
    deployments.NFTCollection = nftCollectionAddress;
    console.log("✅ Test NFTCollection deployed to:", nftCollectionAddress);

    // Set up relationships
    console.log("\n🔗 Setting up contract relationships...");

    // Set launchpad in NFT collection
    await nftCollection.setLaunchpadContract(launchpadCoreAddress);
    console.log("✅ Launchpad contract set in NFTCollection");

    // Set marketplace in NFT collection
    await nftCollection.setMarketplaceContract(marketplaceAddress);
    console.log("✅ Marketplace contract set in NFTCollection");

    // Set fee recipient in marketplace (for commission earnings)
    await marketplace.setFeeRecipient(deployer.address);
    console.log("✅ Fee recipient set in Marketplace");

    // Set platform fee percentage (2.5% default)
    await marketplace.setPlatformFeePercentage(250); // 2.5%
    console.log("✅ Platform fee percentage set to 2.5%");

    // Wait for transactions to be mined
    console.log("\n⏳ Waiting for transactions to be confirmed...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Save deployment addresses
    const deploymentFile = join(
      __dirname,
      `../deployments/${network.name}-${network.chainId}.json`,
    );
    const deploymentData = {
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployments,
      gasUsed: {
        // Will be filled by verification script
      },
    };

    // Create deployments directory if it doesn't exist
    try {
      writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
      console.log(`\n💾 Deployment addresses saved to: ${deploymentFile}`);
    } catch (error) {
      console.log("📁 Creating deployments directory...");
      const { mkdirSync } = await import("fs");
      mkdirSync(join(__dirname, "../deployments"), { recursive: true });
      writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
      console.log(`✅ Deployment addresses saved to: ${deploymentFile}`);
    }

    // Generate frontend config
    const frontendConfig = `// Auto-generated deployment addresses
export const SEPOLIA_ADDRESSES = {
  LAUNCHPAD: '${launchpadCoreAddress}' as const,
  MARKETPLACE: '${marketplaceAddress}' as const,
  PAYMENT_HANDLER: '${paymentHandlerAddress}' as const,
  TEST_NFT_COLLECTION: '${nftCollectionAddress}' as const,
};

// Copy these addresses to lib/wagmi.ts
export const CONTRACT_ADDRESSES_UPDATE = {
  [11155111]: { // Sepolia chain ID
    LAUNCHPAD: '${launchpadCoreAddress}',
    MARKETPLACE: '${marketplaceAddress}',
    PAYMENT_HANDLER: '${paymentHandlerAddress}',
  }
};
`;

    writeFileSync(
      join(__dirname, "../deployments/frontend-config.ts"),
      frontendConfig,
    );
    console.log("🎨 Frontend config generated!");

    // Display summary
    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=====================================");
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Fee Recipient: ${deployer.address}`);
    console.log(`PaymentHandler: ${paymentHandlerAddress}`);
    console.log(`Marketplace: ${marketplaceAddress}`);
    console.log(`Launchpad: ${launchpadCoreAddress}`);
    console.log(`Test NFTCollection: ${nftCollectionAddress}`);
    console.log("=====================================");

    console.log("\n📋 NEXT STEPS:");
    console.log("1. Run verification script: npm run verify");
    console.log("2. Update lib/wagmi.ts with the new addresses");
    console.log("3. Test the contracts on Sepolia testnet");
    console.log(
      `4. View on Etherscan: https://sepolia.etherscan.io/address/${launchpadCoreAddress}`,
    );

    return deployments;
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
