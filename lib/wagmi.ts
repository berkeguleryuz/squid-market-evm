import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { Address } from "viem";

// Contract addresses for Sepolia testnet only
export const CONTRACT_ADDRESSES: Record<string, Address> = {
  LAUNCHPAD: "0xBD23D1248c8B41B3De6c4A3f47B46e0c53B4e953" as Address, // ✅ LaunchpadCore with totalSupply support - Deployed & Verified
  MARKETPLACE: "0x126B30c43dcA61Ca51478A6C066DAA116569A3C1" as Address, // ✅ Marketplace with fee management - Deployed & Verified
  PAYMENT_HANDLER: "0x4328Ab91644ba9bC7A35bFEB6946eEB092fd102A" as Address, // ✅ PaymentHandler - Deployed & Verified
  NFT_COLLECTION: "0x6bC75FEb1dF7680D6C53033cD8fd62Cd7b659Db9" as Address, // ✅ NFTCollection with totalSupply - Deployed & Verified
};

// Chain configuration for Sepolia
export const CHAIN_CONFIG = {
  name: "Sepolia",
  blockExplorer: "https://sepolia.etherscan.io",
  nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
};

export const config = getDefaultConfig({
  appName: "Squid Market",
  projectId: "7504c75ad44ced16476ec45c5e7709fa", // Test WalletConnect Project ID - Replace with your own
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
