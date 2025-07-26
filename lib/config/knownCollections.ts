// Known NFT Collections on Sepolia
export interface KnownCollection {
  address: string;
  name: string;
  symbol?: string;
  type: "ERC721" | "ERC1155";
  verified: boolean;
  description?: string;
  image?: string;
}

export const KNOWN_COLLECTIONS: KnownCollection[] = [
  {
    address: "0xE4Ee962f37A4C305c3F8Abf4F5ceC2347fd87A03",
    name: "BG Test",
    symbol: "BGTEST",
    type: "ERC721",
    verified: true,
    description: "Our Launchpad Collection",
    image:
      "https://gateway.pinata.cloud/ipfs/QmTsP6tHg2Lde4t6t2gidNLKmvDhvHb4cH2KCMyju3g5rM",
  },
];

// Get collection by address
export function getKnownCollection(
  address: string
): KnownCollection | undefined {
  return KNOWN_COLLECTIONS.find(
    (collection) => collection.address.toLowerCase() === address.toLowerCase()
  );
}

// Get verified collections only
export function getVerifiedCollections(): KnownCollection[] {
  return KNOWN_COLLECTIONS.filter((collection) => collection.verified);
}

// Get all collection addresses
export function getAllCollectionAddresses(): string[] {
  return KNOWN_COLLECTIONS.map((collection) => collection.address);
}
