import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying LaunchpadCore with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  try {
    // Deploy LaunchpadCore
    console.log("\n📦 Deploying LaunchpadCore...");
    const LaunchpadCore = await ethers.getContractFactory("LaunchpadCore");
    const launchpadCore = await LaunchpadCore.deploy(deployer.address); // fee recipient
    await launchpadCore.waitForDeployment();
    const launchpadAddress = await launchpadCore.getAddress();
    console.log("✅ LaunchpadCore deployed to:", launchpadAddress);

    // Wait for confirmation
    console.log("\n⏳ Waiting for confirmation...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Save deployment addresses
    const deploymentFile = join(__dirname, `../deployments/launchpad-${network.chainId}.json`);
    const deploymentData = {
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        LaunchpadCore: launchpadAddress
      }
    };

    try {
      writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
      console.log(`\n💾 Deployment saved to: ${deploymentFile}`);
    } catch (error) {
      console.log("📁 Creating deployments directory...");
      const { mkdirSync } = await import("fs");
      mkdirSync(join(__dirname, "../deployments"), { recursive: true });
      writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
      console.log(`✅ Deployment saved to: ${deploymentFile}`);
    }

    // Generate frontend config update
    const frontendUpdate = `
// LaunchpadCore deployed! Add to wagmi.ts:
export const CONTRACT_ADDRESSES = {
  LAUNCHPAD: "${launchpadAddress}" as Address, // ✅ LaunchpadCore deployed!
  MARKETPLACE: "0x4c37452412Aed0ef80A68980Dc555E9EcB46277A" as Address,
  PAYMENT_HANDLER: "0xe362BE87d431bDA6EE84CAB3d8c4C88d8213E9bA" as Address,
  NFT_COLLECTION: "0xE6C16bF41Fb43278C5AD59dacB69381643689E8A" as Address,
};
`;

    writeFileSync(join(__dirname, "../deployments/launchpad-frontend-update.ts"), frontendUpdate);
    console.log("🎨 Frontend update generated!");

    // Display summary
    console.log("\n🎉 LAUNCHPAD DEPLOYMENT COMPLETED!");
    console.log("=====================================");
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`LaunchpadCore: ${launchpadAddress}`);
    console.log("=====================================");

    console.log("\n📋 NEXT STEPS:");
    console.log("1. Verify contract on Etherscan");
    console.log("2. Update lib/wagmi.ts with new address");
    console.log("3. Test launchpad functionality");
    console.log(`4. View on Etherscan: https://sepolia.etherscan.io/address/${launchpadAddress}`);

    return launchpadAddress;

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