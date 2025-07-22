import { run, network } from "hardhat";

async function main() {
  console.log("🔍 Verifying NFTCollection contract...");

  const networkName = network.name;
  const chainId = await network.provider.send("eth_chainId");

  console.log(`Network: ${networkName} (Chain ID: ${parseInt(chainId, 16)})`);

  // NFTCollection address from deployment
  const nftCollection = "0xE6C16bF41Fb43278C5AD59dacB69381643689E8A";
  const deployer = "0x726965AD57752b79aF2C0Db0E5b08Fe00328dd8B";

  // Give Etherscan some time to index the contract
  console.log("⏳ Waiting for contract to be indexed by Etherscan...");
  await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds

  // Verify NFTCollection
  try {
    console.log("\n🔍 Verifying NFTCollection...");
    await run("verify:verify", {
      address: nftCollection,
      constructorArguments: [
        "Squid Test Collection",
        "SQUID",
        "A test collection for Squid Market",
        "https://example.com/collection.jpg",
        1000,
        deployer,
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
  console.log(`View NFTCollection on Etherscan:`);
  console.log(`https://sepolia.etherscan.io/address/${nftCollection}`);
  console.log("==============================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
