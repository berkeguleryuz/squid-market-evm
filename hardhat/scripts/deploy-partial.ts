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

  // Deployment results - using existing addresses from last successful deploy
  const deployments: Record<string, string> = {
    PaymentHandler: "0xe362BE87d431bDA6EE84CAB3d8c4C88d8213E9bA",
    Marketplace: "0x4c37452412Aed0ef80A68980Dc555E9EcB46277A",
  };

  try {
    // Deploy a simplified NFTCollection for demo (without Launchpad dependency)
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

    // Set up basic relationships
    console.log("\n🔗 Setting up contract relationships...");

    // Set marketplace in NFT collection
    await nftCollection.setMarketplaceContract(deployments.Marketplace);
    console.log("✅ Marketplace contract set in NFTCollection");

    // Get marketplace contract instance to set payment handler
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = Marketplace.attach(deployments.Marketplace);

    // Set payment handler in marketplace
    await marketplace.setPaymentHandler(deployments.PaymentHandler);
    console.log("✅ PaymentHandler set in Marketplace");

    // Wait for transactions to be mined
    console.log("\n⏳ Waiting for transactions to be confirmed...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

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
      note: "Partial deployment - Launchpad excluded due to size limit",
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
    const frontendConfig = `// Auto-generated deployment addresses (Partial - No Launchpad)
export const SEPOLIA_ADDRESSES = {
  MARKETPLACE: '${deployments.Marketplace}' as const,
  PAYMENT_HANDLER: '${deployments.PaymentHandler}' as const,
  TEST_NFT_COLLECTION: '${deployments.NFTCollection}' as const,
};

// Copy these addresses to lib/wagmi.ts
export const CONTRACT_ADDRESSES_UPDATE = {
  [11155111]: { // Sepolia chain ID
    MARKETPLACE: '${deployments.Marketplace}',
    PAYMENT_HANDLER: '${deployments.PaymentHandler}',
    // LAUNCHPAD: 'TO_BE_DEPLOYED_AFTER_OPTIMIZATION',
  }
};
`;

    writeFileSync(
      join(__dirname, "../deployments/frontend-config.ts"),
      frontendConfig,
    );
    console.log("🎨 Frontend config generated!");

    // Display summary
    console.log("\n🎉 PARTIAL DEPLOYMENT COMPLETED!");
    console.log("=====================================");
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Fee Recipient: ${deployer.address}`);
    console.log(`PaymentHandler: ${deployments.PaymentHandler}`);
    console.log(`Marketplace: ${deployments.Marketplace}`);
    console.log(`Test NFTCollection: ${deployments.NFTCollection}`);
    console.log("⚠️  Launchpad: Not deployed (size limit)");
    console.log("=====================================");

    console.log("\n📋 NEXT STEPS:");
    console.log("1. Run verification: npm run verify");
    console.log("2. Update frontend with addresses");
    console.log("3. Optimize Launchpad contract size");
    console.log("4. Deploy Launchpad separately when optimized");
    console.log(
      `5. View on Etherscan: https://sepolia.etherscan.io/address/${deployments.Marketplace}`,
    );

    return deployments;
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
