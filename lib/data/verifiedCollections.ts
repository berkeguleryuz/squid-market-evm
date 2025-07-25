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

// Static verified collections list
const STATIC_VERIFIED_COLLECTIONS: VerifiedCollection[] = [
  // Add external verified collections here if needed
];

// Dynamic function to get all verified collections (static + launchpad)
export async function getVerifiedCollections(): Promise<VerifiedCollection[]> {
  try {
    // Fetch launchpad collections from database
    const response = await fetch('/api/launchpools');
    const result = await response.json();
    
    if (!result.success) {
      console.error('Failed to fetch launchpad collections:', result.error);
      return STATIC_VERIFIED_COLLECTIONS;
    }
    
    // Convert launchpad collections to verified collections
    const launchpadCollections: VerifiedCollection[] = result.data.map((launch: any) => ({
      address: launch.contractAddress as Address,
      name: launch.name,
      symbol: launch.symbol,
      description: launch.description || `${launch.name} NFT Collection`,
      image: launch.imageUri || 'https://via.placeholder.com/400x400/6366f1/ffffff?text=NFT',
      verified: true, // All launchpad collections are verified
      featured: launch.status === 'ACTIVE', // Active launches are featured
      totalSupply: launch.maxSupply,
    }));
    
    // Combine static and launchpad collections
    return [...STATIC_VERIFIED_COLLECTIONS, ...launchpadCollections];
  } catch (error) {
    console.error('Error fetching verified collections:', error);
    return STATIC_VERIFIED_COLLECTIONS;
  }
}

// Cached version for synchronous access (fallback)
export const VERIFIED_COLLECTIONS: VerifiedCollection[] = STATIC_VERIFIED_COLLECTIONS;

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
