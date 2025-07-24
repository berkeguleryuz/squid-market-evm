import { run, network } from "hardhat";

async function main() {
  console.log("🔍 Verifying LaunchpadCore contract...");
  
  const networkName = network.name;
  const chainId = await network.provider.send("eth_chainId");
  
  console.log(`Network: ${networkName} (Chain ID: ${parseInt(chainId, 16)})`);

  // LaunchpadCore address from deployment
  const launchpadCore = "0x87763147AeA7a9903af63518Aa85D00Ae0FB68f0";
  const deployer = "0x726965AD57752b79aF2C0Db0E5b08Fe00328dd8B";

  // Give Etherscan some time to index the contract
  console.log("⏳ Waiting for contract to be indexed by Etherscan...");
  await new Promise((resolve) => setTimeout(resolve, 15000)); // 15 seconds

  // Verify LaunchpadCore
  try {
    console.log("\n🔍 Verifying LaunchpadCore...");
    await run("verify:verify", {
      address: launchpadCore,
      constructorArguments: [deployer], // _feeRecipient
    });
    console.log("✅ LaunchpadCore verified!");
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("Already Verified")) {
      console.log("✅ LaunchpadCore already verified!");
    } else {
      console.log("❌ LaunchpadCore verification failed:", errorMessage);
    }
  }

  console.log("\n🎉 VERIFICATION COMPLETED!");
  console.log("==============================");
  console.log(`View LaunchpadCore on Etherscan:`);
  console.log(`https://sepolia.etherscan.io/address/${launchpadCore}`);
  console.log("==============================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 