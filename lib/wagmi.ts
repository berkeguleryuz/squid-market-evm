import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { Address } from "viem";

// Contract addresses for Sepolia testnet only
export const CONTRACT_ADDRESSES: Record<string, Address> = {
  LAUNCHPAD: "0x6CC9C89C78036f553F6969253D35F17a1CdD3870" as Address, // ✅ LaunchpadCore Deployed & Verified with getActiveLaunches!
  MARKETPLACE: "0x4c37452412Aed0ef80A68980Dc555E9EcB46277A" as Address, // ✅ Deployed & Verified
  PAYMENT_HANDLER: "0xe362BE87d431bDA6EE84CAB3d8c4C88d8213E9bA" as Address, // ✅ Deployed & Verified
  NFT_COLLECTION: "0xE6C16bF41Fb43278C5AD59dacB69381643689E8A" as Address, // ✅ Deployed & Verified
};

// Chain configuration for Sepolia
export const CHAIN_CONFIG = {
  name: "Sepolia",
  blockExplorer: "https://sepolia.etherscan.io",
  nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
};

export const config = getDefaultConfig({
  appName: "Squid Market",
  projectId: "c33b21c2ba3fbef73b4bfef2e8b0bba0", // Updated WalletConnect Project ID
  chains: [sepolia], // Only Sepolia
  ssr: true,
});

// Helper functions
export const getContractAddress = (contractName: string): Address => {
  const address = CONTRACT_ADDRESSES[contractName];
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    throw new Error(`Contract ${contractName} not deployed yet`);
  }
  return address;
};

// Function to update contract addresses after deployment
export const updateContractAddress = (
  contractName: string,
  address: Address
) => {
  CONTRACT_ADDRESSES[contractName] = address;
};
