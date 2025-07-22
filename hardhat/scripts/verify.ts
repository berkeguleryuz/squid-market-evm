import { run, network } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🔍 Starting contract verification...");

  const networkName = network.name;
  const chainId = await network.provider.send("eth_chainId");

  console.log(`Network: ${networkName} (Chain ID: ${parseInt(chainId, 16)})`);

  // Load deployment addresses
  const deploymentFile = join(
    __dirname,
    `../deployments/${networkName}-${parseInt(chainId, 16)}.json`,
  );

  try {
    const deploymentData = JSON.parse(readFileSync(deploymentFile, "utf8"));
    const contracts = deploymentData.contracts;

    // Give Etherscan some time to index the contracts
    console.log("⏳ Waiting for contracts to be indexed by Etherscan...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 seconds

    // Verify PaymentHandler
    try {
      console.log("\n🔍 Verifying PaymentHandler...");
      await run("verify:verify", {
        address: contracts.PaymentHandler,
        constructorArguments: [deploymentData.deployer], // _feeRecipient
      });
      console.log("✅ PaymentHandler verified!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Already Verified")) {
        console.log("✅ PaymentHandler already verified!");
      } else {
        console.log("❌ PaymentHandler verification failed:", errorMessage);
      }
    }

    // Verify Marketplace
    try {
      console.log("\n🔍 Verifying Marketplace...");
      await run("verify:verify", {
        address: contracts.Marketplace,
        constructorArguments: [deploymentData.deployer], // _feeRecipient
      });
      console.log("✅ Marketplace verified!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Already Verified")) {
        console.log("✅ Marketplace already verified!");
      } else {
        console.log("❌ Marketplace verification failed:", errorMessage);
      }
    }

    // Verify Launchpad
    try {
      console.log("\n🔍 Verifying Launchpad...");
      await run("verify:verify", {
        address: contracts.Launchpad,
        constructorArguments: [deploymentData.deployer], // _feeRecipient
      });
      console.log("✅ Launchpad verified!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Already Verified")) {
        console.log("✅ Launchpad already verified!");
      } else {
        console.log("❌ Launchpad verification failed:", errorMessage);
      }
    }

    // Verify NFTCollection
    try {
      console.log("\n🔍 Verifying NFTCollection...");
      await run("verify:verify", {
        address: contracts.NFTCollection,
        constructorArguments: [
          "Squid Test Collection",
          "SQUID",
          "A test collection for Squid Market",
          "https://example.com/collection.jpg",
          1000,
          deploymentData.deployer,
        ],
      });
      console.log("✅ NFTCollection verified!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Already Verified")) {
        console.log("✅ NFTCollection already verified!");
      } else {
        console.log("❌ NFTCollection verification failed:", errorMessage);
      }
    }

    console.log("\n🎉 VERIFICATION COMPLETED!");
    console.log("==============================");
    console.log("View your contracts on Etherscan:");
    console.log(
      `PaymentHandler: https://sepolia.etherscan.io/address/${contracts.PaymentHandler}`,
    );
    console.log(
      `Marketplace: https://sepolia.etherscan.io/address/${contracts.Marketplace}`,
    );
    console.log(
      `Launchpad: https://sepolia.etherscan.io/address/${contracts.Launchpad}`,
    );
    console.log(
      `NFTCollection: https://sepolia.etherscan.io/address/${contracts.NFTCollection}`,
    );
    console.log("==============================");
  } catch (error) {
    console.error("❌ Failed to load deployment file:", error);
    console.log("Make sure you have deployed the contracts first!");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
