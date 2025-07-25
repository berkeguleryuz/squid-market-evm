import { Address } from 'viem';

export interface VerifiedCollection {
  address: Address;
  name: string;
  symbol: string;
  description: string;
  image: string;
  verified: boolean;
  featured: boolean;
  totalSupply?: number;
  floorPrice?: string;
  volume24h?: string;
}

// Verified collections list - can be managed via database later
export const VERIFIED_COLLECTIONS: VerifiedCollection[] = [
  {
    address: "0xE6C16bF41Fb43278C5AD59dacB69381643689E8A" as Address,
    name: "Squid Market NFTs",
    symbol: "SQUID",
    description: "Official Squid Market NFT Collection",
    image: "https://via.placeholder.com/400x400/6366f1/ffffff?text=SQUID",
    verified: true,
    featured: true,
  },
  // Add more verified collections here
];

// Function to check if a collection is verified
export function isCollectionVerified(address: string): boolean {
  return VERIFIED_COLLECTIONS.some(
    collection => collection.address.toLowerCase() === address.toLowerCase()
  );
}

// Function to get verified collection info
export function getVerifiedCollection(address: string): VerifiedCollection | undefined {
  return VERIFIED_COLLECTIONS.find(
    collection => collection.address.toLowerCase() === address.toLowerCase()
  );
}

// Function to get featured collections
export function getFeaturedCollections(): VerifiedCollection[] {
  return VERIFIED_COLLECTIONS.filter(collection => collection.featured);
}

// Function to get all verified collections
export function getAllVerifiedCollections(): VerifiedCollection[] {
  return VERIFIED_COLLECTIONS.filter(collection => collection.verified);
}
