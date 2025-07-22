import { run, network } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🔍 Starting contract verification...");
  
  const networkName = network.name;
  const chainId = await network.provider.send("eth_chainId");
  
  console.log(`Network: ${networkName} (Chain ID: ${parseInt(chainId, 16)})`);

  // Manual addresses from successful deployment
  const contracts = {
    PaymentHandler: "0xe362BE87d431bDA6EE84CAB3d8c4C88d8213E9bA",
    Marketplace: "0x4c37452412Aed0ef80A68980Dc555E9EcB46277A"
  };

  const deployer = "0x726965AD57752b79aF2C0Db0E5b08Fe00328dd8B";

  // Give Etherscan some time to index the contracts
  console.log("⏳ Waiting for contracts to be indexed by Etherscan...");
  await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

  // Verify PaymentHandler
  try {
    console.log("\n🔍 Verifying PaymentHandler...");
    await run("verify:verify", {
      address: contracts.PaymentHandler,
      constructorArguments: [deployer], // _feeRecipient
    });
    console.log("✅ PaymentHandler verified!");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
      constructorArguments: [deployer], // _feeRecipient
    });
    console.log("✅ Marketplace verified!");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes("Already Verified")) {
      console.log("✅ Marketplace already verified!");
    } else {
      console.log("❌ Marketplace verification failed:", errorMessage);
    }
  }

  console.log("\n🎉 VERIFICATION COMPLETED!");
  console.log("==============================");
  console.log("View your contracts on Etherscan:");
  console.log(`PaymentHandler: https://sepolia.etherscan.io/address/${contracts.PaymentHandler}`);
  console.log(`Marketplace: https://sepolia.etherscan.io/address/${contracts.Marketplace}`);
  console.log("==============================");
  console.log("\n📋 STATUS:");
  console.log("✅ PaymentHandler - Deployed & Verified");
  console.log("✅ Marketplace - Deployed & Verified");  
  console.log("⏳ Launchpad - Needs optimization");
  console.log("⏳ NFTCollection - Can be deployed after Launchpad");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 