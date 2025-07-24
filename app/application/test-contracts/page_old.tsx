"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import { Address } from "viem";

// Import our new modular components
import LaunchManager from "./components/LaunchManager";
import PhaseManager from "./components/PhaseManager";
import SupplyMonitor from "./components/SupplyMonitor";

export default function TestContractsPage() {
  const { address, isConnected } = useAccount();
  const [selectedLaunch, setSelectedLaunch] = useState<number | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>🔗 Wallet Connection Required</CardTitle>
            <CardDescription>
              Please connect your wallet to manage your NFT launches on Sepolia testnet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">🧪 Test Contracts</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create and manage your NFT launches, configure phases, and monitor collection stats.
          All operations are performed on the Sepolia testnet.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Connected:</span>
          <code className="bg-muted px-2 py-1 rounded text-xs">{address}</code>
          <Button variant="ghost" size="sm" asChild>
            <a
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View on Etherscan
            </a>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="launches" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="launches">Launch Management</TabsTrigger>
          <TabsTrigger value="phases">Phase Configuration</TabsTrigger>
          <TabsTrigger value="monitor">Supply Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="launches" className="space-y-6">
          <LaunchManager
            selectedLaunch={selectedLaunch}
            onLaunchSelect={(launchId) => {
              setSelectedLaunch(launchId);
              // Auto-set collection when launch is selected
              // This will be handled by the LaunchManager component
            }}
            isLoading={isLoading}
            onLoadingChange={setIsLoading}
          />
        </TabsContent>

        <TabsContent value="phases" className="space-y-6">
          <PhaseManager
            selectedCollection={selectedCollection}
            isLoading={isLoading}
            onLoadingChange={setIsLoading}
          />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <SupplyMonitor collectionAddress={selectedCollection} />
        </TabsContent>
      </Tabs>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>🐛 Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Selected Launch:</span>
                <p className="font-mono">{selectedLaunch ?? 'None'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Selected Collection:</span>
                <p className="font-mono text-xs">{selectedCollection ?? 'None'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Loading State:</span>
                <p className="font-mono">{isLoading ?? 'None'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Wallet:</span>
                <p className="font-mono text-xs">{address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
  0: { name: "None", color: "bg-gray-500/20 text-gray-400", icon: "⚫" },
  1: { name: "Presale", color: "bg-blue-500/20 text-blue-400", icon: "🎯" },
  2: {
    name: "Whitelist",
    color: "bg-purple-500/20 text-purple-400",
    icon: "👥",
  },
  3: { name: "Public", color: "bg-green-500/20 text-green-400", icon: "🌍" },
};

// Launch status definitions
const LAUNCH_STATUS = {
  0: { name: "Pending", color: "bg-yellow-500/20 text-yellow-600", icon: "⏳" },
  1: { name: "Active", color: "bg-green-500/20 text-green-600", icon: "🟢" },
  2: { name: "Completed", color: "bg-blue-500/20 text-blue-600", icon: "✅" },
  3: { name: "Cancelled", color: "bg-red-500/20 text-red-600", icon: "❌" },
};

// Supply Monitor Component
function SupplyMonitor({ collectionAddress }: { collectionAddress: Address }) {
  const { totalSupply, maxSupply } = useCollectionStats(collectionAddress);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSupply = () => {
    setIsRefreshing(true);
    totalSupply.refetch();
    maxSupply.refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">📊 Real-time Supply Status</div>
        <Button
          onClick={refreshSupply}
          variant="ghost"
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-purple-600">
            {totalSupply.data?.toString() || '...'}
          </div>
          <div className="text-xs text-muted-foreground">Current Supply</div>
          <div className="text-xs text-muted-foreground">(Minted NFTs)</div>
        </div>
        
        <div>
          <div className="text-lg font-bold text-blue-600">
            {maxSupply.data?.toString() || '...'}
          </div>
          <div className="text-xs text-muted-foreground">Max Supply</div>
          <div className="text-xs text-muted-foreground">(Collection Limit)</div>
        </div>
        
        <div>
          <div className="text-lg font-bold text-green-600">
            {maxSupply.data && totalSupply.data 
              ? (Number(maxSupply.data) - Number(totalSupply.data)).toString()
              : '...'
            }
          </div>
          <div className="text-xs text-muted-foreground">Remaining</div>
          <div className="text-xs text-muted-foreground">(Can Mint)</div>
        </div>
      </div>

      {totalSupply.data && maxSupply.data && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Mint Progress</span>
            <span>{((Number(totalSupply.data) / Number(maxSupply.data)) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: `${(Number(totalSupply.data) / Number(maxSupply.data)) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {Number(totalSupply.data) === 0 && (
        <div className="mt-2 text-xs text-yellow-600 bg-yellow-500/10 p-2 rounded">
          🟡 <strong>Total Supply 0:</strong> Henüz hiç NFT mint edilmemiş. İlk mint'ten sonra 1 olacak.
        </div>
      )}
    </div>
  );
}

export default function LaunchManagementPage() {
  const { address, isConnected } = useAccount();

  // States
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("my-launches");
  const [selectedLaunch, setSelectedLaunch] = useState<number | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Address | null>(
    null,
  );

  // Launch creation states
  const [newLaunchName, setNewLaunchName] = useState("");
  const [newLaunchSymbol, setNewLaunchSymbol] = useState("");
  const [newLaunchSupply, setNewLaunchSupply] = useState("100");

  // Phase management states
  const [phaseToConfig, setPhaseToConfig] = useState<number>(1);
  const [phasePrice, setPhasePrice] = useState("0.01");
  const [phaseStartTime, setPhaseStartTime] = useState("");
  const [phaseEndTime, setPhaseEndTime] = useState("");
  const [phaseMaxPerWallet, setPhaseMaxPerWallet] = useState("5");
  const [phaseMaxSupply, setPhaseMaxSupply] = useState("50");

  // Mint states
  const [mintPhase, setMintPhase] = useState<number>(3);
  const [mintPrice, setMintPrice] = useState("0.01");

  // Image upload states
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  
  // Bulk upload states
  const [uploadedMetadata, setUploadedMetadata] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isBulkMinting, setIsBulkMinting] = useState(false);
  const [processedNFTs, setProcessedNFTs] = useState<any[]>([]);

  // Contract hooks (moved after state declarations)
  const { createLaunch, startLaunch } = useLaunchpadContract();
  const { configurePhase, updateWhitelist, mintWithPhase } = usePhaseManagement(
    selectedCollection || undefined,
  );
  const { completeLaunch, cancelLaunch } = useLaunchOperations();

  // Read hooks
  const { data: userLaunches, refetch: refetchUserLaunches } =
    useUserLaunches(address);
  const { data: activeLaunches } = useActiveLaunches();

  // Get selected launch data
  const { launch: selectedLaunchData, refetch: refetchSelectedLaunch } = useRealLaunch(selectedLaunch || 0);
  const { data: phaseConfigData, refetch: refetchPhaseConfig } = usePhaseConfig(selectedCollection || undefined, phaseToConfig);
  
  // Auto-refresh phase data when phase or collection changes
  useEffect(() => {
    if (selectedCollection && phaseToConfig) {
      console.log(`🔄 Auto-refreshing phase ${phaseToConfig} data for collection ${selectedCollection}`);
      setTimeout(() => refetchPhaseConfig(), 1000);
    }
  }, [selectedCollection, phaseToConfig, refetchPhaseConfig]);

  useEffect(() => {
    // Set default times
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    setPhaseStartTime(oneHourLater.toISOString().slice(0, 16));
    setPhaseEndTime(oneDayLater.toISOString().slice(0, 16));
  }, []);

  // Auto-select first launch if available
  useEffect(() => {
    if (userLaunches && userLaunches.length > 0 && selectedLaunch === null) {
      const firstLaunch = Number(userLaunches[0]);
      setSelectedLaunch(firstLaunch);
    }
  }, [userLaunches, selectedLaunch]);

  // Auto-set collection address when launch is selected
  useEffect(() => {
    if (selectedLaunchData?.collection) {
      setSelectedCollection(selectedLaunchData.collection);
    }
  }, [selectedLaunchData]);

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>🔗 Wallet Connection Required</CardTitle>
            <CardDescription>
              Please connect your wallet to manage your NFT launches on Sepolia
              testnet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleAction = async (
    actionName: string,
    action: () => Promise<string>,
  ) => {
    setIsLoading(actionName);
    try {
      const txHash = await action();
      toast.success(
        `✅ ${actionName} successful! TX: ${txHash.slice(0, 10)}...`,
      );

      // Refresh data after actions
      setTimeout(() => {
        refetchUserLaunches();
        if (selectedLaunch !== null) refetchSelectedLaunch();
        // Also refresh phase config data
        if (actionName.includes('Configure Phase')) {
          refetchPhaseConfig();
        }
      }, 3000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ ${actionName} failed:`, error);
      toast.error(`❌ ${actionName} failed: ${errorMessage}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Action handlers
  const handleCreateLaunch = () => handleAction('Create Launch', async () => {
    const name = newLaunchName || `Test Collection ${Date.now()}`;
    const symbol = newLaunchSymbol || 'TEST';
    const supply = parseInt(newLaunchSupply) || 100;
    
    // Validation
    if (supply <= 0) {
      throw new Error('Max supply must be greater than 0');
    }
    
    if (supply > 10000) {
      throw new Error('Max supply cannot exceed 10,000');
    }
    
    console.log('🚀 Creating launch with:', { name, symbol, supply });
    
    const hash = await createLaunch(name, symbol, "A test NFT collection", "https://example.com/test.jpg", supply, true);
    
    toast.success(`✅ Launch created! Max Supply: ${supply}`);
    
    return hash;
  });

  const handleStartLaunch = (launchId: number) =>
    handleAction("Start Launch", async () => {
      return await startLaunch(launchId);
    });

  const handleCompleteLaunch = (launchId: number) =>
    handleAction("Complete Launch", async () => {
      return await completeLaunch(launchId);
    });

  const handleCancelLaunch = (launchId: number) =>
    handleAction("Cancel Launch", async () => {
      return await cancelLaunch(launchId);
    });

  const handleConfigurePhase = () => handleAction('Configure Phase', async () => {
    if (!selectedCollection) throw new Error('No collection selected');
    
    const startTimestamp = Math.floor(new Date(phaseStartTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(phaseEndTime).getTime() / 1000);
    
    // Validation
    if (startTimestamp >= endTimestamp) {
      throw new Error('Start time must be before end time');
    }
    
    if (parseFloat(phasePrice) <= 0) {
      throw new Error('Price must be greater than 0');
    }
    
    if (parseInt(phaseMaxPerWallet) <= 0) {
      throw new Error('Max per wallet must be greater than 0');
    }
    
    console.log(`🔧 Configuring ${PHASES[phaseToConfig as keyof typeof PHASES]?.name} phase for collection:`, selectedCollection);
    console.log('⚙️ Phase config:', {
      phase: phaseToConfig,
      price: phasePrice,
      startTime: new Date(startTimestamp * 1000).toLocaleString(),
      endTime: new Date(endTimestamp * 1000).toLocaleString(),
      maxPerWallet: parseInt(phaseMaxPerWallet),
      maxSupply: parseInt(phaseMaxSupply)
    });
    
    const hash = await configurePhase(
      phaseToConfig,
      phasePrice,
      startTimestamp,
      endTimestamp,
      parseInt(phaseMaxPerWallet),
      parseInt(phaseMaxSupply)
    );
    
    // Extra success message with details
    toast.success(`✅ ${PHASES[phaseToConfig as keyof typeof PHASES]?.name} phase configured! Price: ${phasePrice} ETH`);
    
    return hash;
  });

  const handleMintWithPhase = () =>
    handleAction("Mint NFT", async () => {
      if (!address || !selectedCollection)
        throw new Error("Wallet or collection not available");

      return await mintWithPhase(
        address,
        mintPhase,
        `https://example.com/token-${Date.now()}.json`,
        mintPrice,
      );
    });

  // Image upload handler
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Real IPFS upload using Pinata
      const formData = new FormData();
      formData.append("file", file);

      // Try Pinata first (if API key is available)
      const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
      
      if (pinataJWT) {
        console.log("🌐 Uploading to IPFS via Pinata...");
        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${pinataJWT}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
          setUploadedImageUrl(ipfsUrl);
          toast.success("✅ Image uploaded to IPFS via Pinata!");
          
          // Auto-set NFT name based on file name
          if (!nftName) {
            setNftName(file.name.replace(/\.[^/.]+$/, ""));
          }
          return;
        } else {
          console.error("❌ Pinata upload failed:", await response.text());
        }
      }

      // Fallback: Try a public IPFS service
      try {
        console.log("🌐 Trying public IPFS service...");
        const publicFormData = new FormData();
        publicFormData.append("file", file);
        
        // Use web3.storage or similar public IPFS gateway
        const publicResponse = await fetch("https://api.web3.storage/upload", {
          method: "POST",
          headers: {
            "Authorization": "Bearer your-web3-storage-token", // This would need proper setup
          },
          body: publicFormData,
        });

        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          setUploadedImageUrl(`https://ipfs.io/ipfs/${publicData.cid}`);
          toast.success("✅ Image uploaded to public IPFS!");
          return;
        }
      } catch (error) {
        console.log("⚠️ Public IPFS also failed, using placeholder");
      }

      // Final fallback: Use a placeholder IPFS image
      console.log("📁 Using placeholder IPFS image");
      const placeholderImages = [
        "https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79XXt34zvH", // Sample 1
        "https://ipfs.io/ipfs/QmZdPdZzZum2jQ7jg1ekfeE3LSz1avAaa42G6mfimw9TEn", // Sample 2
        "https://ipfs.io/ipfs/QmSsYRx3LpDAb1GZQm7zZ1AuHZjfbPkD6J9s9r4C8byqDu", // Sample 3
      ];
      
      const randomPlaceholder = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
      setUploadedImageUrl(randomPlaceholder);
      toast.success("✅ Using placeholder IPFS image (for demo)!");
      
      // Auto-set NFT name based on file name
      if (!nftName) {
        setNftName(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("❌ Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Bulk upload handlers
  const handleMetadataUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedMetadata(files);
    console.log(`📝 ${files.length} metadata files uploaded:`, files.map(f => f.name));
  };

  const handleImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedImages(files);
    console.log(`🖼️ ${files.length} image files uploaded:`, files.map(f => f.name));
  };

  const handleBulkUploadToIPFS = async () => {
    setIsBulkUploading(true);
    const processed: any[] = [];

    try {
      toast.info(`🌐 Starting bulk upload of ${uploadedImages.length} files to IPFS...`);

      for (let i = 0; i < uploadedImages.length; i++) {
        const imageFile = uploadedImages[i];
        const metadataFile = uploadedMetadata[i];

        console.log(`🔄 Processing ${i + 1}/${uploadedImages.length}: ${imageFile.name}`);

        // Upload image to IPFS
        const formData = new FormData();
        formData.append('file', imageFile);

        let imageUrl = '';
        const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

        if (pinataJWT) {
          try {
            const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
              method: "POST",
              headers: { "Authorization": `Bearer ${pinataJWT}` },
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              imageUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
            }
          } catch (error) {
            console.error(`❌ Failed to upload ${imageFile.name}:`, error);
          }
        }

        if (!imageUrl) {
          // Fallback to local URL
          imageUrl = URL.createObjectURL(imageFile);
        }

        // Parse metadata
        let metadata = {};
        if (metadataFile) {
          try {
            const metadataText = await metadataFile.text();
            metadata = JSON.parse(metadataText);
          } catch (error) {
            console.error(`❌ Failed to parse metadata ${metadataFile.name}:`, error);
          }
        }

        // Create processed NFT object
        const processedNFT = {
          id: i + 1,
          imageUrl,
          metadata: {
            ...metadata,
            image: imageUrl,
            external_url: `https://sepolia.etherscan.io/address/${selectedCollection}`,
          },
          originalImageFile: imageFile,
          originalMetadataFile: metadataFile
        };

        processed.push(processedNFT);
        toast.success(`✅ ${i + 1}/${uploadedImages.length} processed`);
      }

      setProcessedNFTs(processed);
      toast.success(`🎉 All ${processed.length} NFTs processed and uploaded to IPFS!`);

    } catch (error) {
      console.error('❌ Bulk upload failed:', error);
      toast.error('❌ Bulk upload failed');
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleBulkMint = async () => {
    if (!selectedCollection || processedNFTs.length === 0) return;

    setIsBulkMinting(true);
    let successCount = 0;

    try {
      toast.info(`🎯 Starting bulk mint of ${processedNFTs.length} NFTs...`);

      for (let i = 0; i < processedNFTs.length; i++) {
        const nft = processedNFTs[i];

        try {
          // Upload metadata to IPFS
          let metadataUrl = '';
          const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

          if (pinataJWT) {
            const metadataBlob = new Blob([JSON.stringify(nft.metadata)], { type: 'application/json' });
            const metadataForm = new FormData();
            metadataForm.append('file', metadataBlob, `metadata-${nft.id}.json`);

            const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
              method: "POST",
              headers: { "Authorization": `Bearer ${pinataJWT}` },
              body: metadataForm,
            });

            if (response.ok) {
              const data = await response.json();
              metadataUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
            }
          }

          if (!metadataUrl) {
            metadataUrl = `data:application/json;base64,${btoa(JSON.stringify(nft.metadata))}`;
          }

          // Mint NFT
          if (address) {
            await mintWithPhase(address, 3, metadataUrl, '0.01'); // Use public phase
            successCount++;
            toast.success(`✅ NFT ${nft.id} minted successfully!`);
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`❌ Failed to mint NFT ${nft.id}:`, error);
          toast.error(`❌ Failed to mint NFT ${nft.id}`);
        }
      }

      toast.success(`🎉 Bulk mint completed! ${successCount}/${processedNFTs.length} NFTs minted successfully.`);

    } catch (error) {
      console.error('❌ Bulk mint failed:', error);
      toast.error('❌ Bulk mint failed');
    } finally {
      setIsBulkMinting(false);
    }
  };

  // Mint with custom image
  const handleMintWithCustomImage = () =>
    handleAction("Mint NFT", async () => {
      if (!address || !selectedCollection)
        throw new Error("Wallet or collection not available");
      if (!uploadedImageUrl) throw new Error("Please upload an image first");

      // Create OpenSea-compatible metadata
      const metadata = {
        name: nftName || `${selectedLaunchData?.name || 'NFT'} #${Date.now()}`,
        description: nftDescription || `A unique digital collectible from ${selectedLaunchData?.name || 'Unknown Collection'}`,
        image: uploadedImageUrl,
        external_url: `https://sepolia.etherscan.io/address/${selectedCollection}`,
        attributes: [
          {
            trait_type: "Phase",
            value: PHASES[mintPhase as keyof typeof PHASES]?.name || "Unknown",
          },
          {
            trait_type: "Collection",
            value: selectedLaunchData?.name || "Unknown Collection",
          },
          {
            trait_type: "Creator",
            value: selectedLaunchData?.creator || address,
          },
          {
            trait_type: "Minted At",
            display_type: "date",
            value: Math.floor(Date.now() / 1000),
          },
          {
            trait_type: "Launch ID",
            display_type: "number", 
            value: selectedLaunchData?.launchId || 0,
          }
        ],
        // OpenSea metadata standard
        background_color: "000000",
        animation_url: null,
        youtube_url: null
      };

      console.log('📝 Generated NFT metadata:', metadata);

      // Upload metadata to IPFS (or use data URL as fallback)
      let metadataUrl;
      
      try {
        // Try to upload metadata to IPFS
        const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
        
        if (pinataJWT) {
          console.log("🌐 Uploading metadata to IPFS...");
          const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
          const metadataForm = new FormData();
          metadataForm.append('file', metadataBlob, 'metadata.json');
          
          const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${pinataJWT}`,
            },
            body: metadataForm,
          });

          if (response.ok) {
            const data = await response.json();
            metadataUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
            console.log('✅ Metadata uploaded to IPFS:', metadataUrl);
          } else {
            throw new Error('IPFS upload failed');
          }
        } else {
          throw new Error('No Pinata JWT');
        }
      } catch (error) {
        // Fallback to data URL
        console.log('⚠️ Using data URL for metadata');
        metadataUrl = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      }

      console.log('🎯 Minting NFT with metadata URL:', metadataUrl);

      const hash = await mintWithPhase(address, mintPhase, metadataUrl, mintPrice);
      
      // Show success with direct links
      const tokenId = Math.floor(Date.now() / 1000) % 1000; // Rough estimate
      toast.success(
        <div>
          <div>✅ NFT Minted Successfully!</div>
          <div className="text-xs mt-1">
            <a href={metadataUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400">
              📄 View Metadata
            </a>
            {' | '}
            <a href={`https://testnets.opensea.io/assets/sepolia/${selectedCollection}`} target="_blank" rel="noopener noreferrer" className="text-blue-400">
              🌊 OpenSea
            </a>
          </div>
        </div>,
        { duration: 10000 }
      );

      return hash;
    });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">🎛️ Launch Management Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Complete NFT collection lifecycle management with advanced phase
          controls
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {userLaunches?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Your Launches</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {activeLaunches?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Global Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {selectedLaunchData
                ? LAUNCH_STATUS[
                    selectedLaunchData.status as keyof typeof LAUNCH_STATUS
                  ]?.icon
                : "⚫"}
            </div>
            <div className="text-sm text-muted-foreground">Selected Status</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">⚙️</div>
            <div className="text-sm text-muted-foreground">
              Phase Management
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="my-launches">📋 My Launches</TabsTrigger>
          <TabsTrigger value="create-launch">➕ Create New</TabsTrigger>
          <TabsTrigger value="phase-management">⚙️ Phase Config</TabsTrigger>
          <TabsTrigger value="bulk-upload">📦 Bulk Upload</TabsTrigger>
          <TabsTrigger value="quick-actions">🚀 Quick Actions</TabsTrigger>
        </TabsList>

        {/* My Launches Tab */}
        <TabsContent value="my-launches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📋 Your Active Launches</CardTitle>
              <CardDescription>
                Manage and monitor your NFT collection launches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userLaunches && userLaunches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userLaunches.map((launchId) => (
                    <LaunchCard
                      key={launchId.toString()}
                      launchId={Number(launchId)}
                      isSelected={selectedLaunch === Number(launchId)}
                      onSelect={() => setSelectedLaunch(Number(launchId))}
                      onStart={() => handleStartLaunch(Number(launchId))}
                      onComplete={() => handleCompleteLaunch(Number(launchId))}
                      onCancel={() => handleCancelLaunch(Number(launchId))}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">No launches found</div>
                  <Button
                    onClick={() => setActiveTab("create-launch")}
                    className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Launch
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Launch Details */}
          {selectedLaunchData && (
            <Card>
              <CardHeader>
                <CardTitle>
                  🔍 Launch Details - {selectedLaunchData.name}
                </CardTitle>
                <CardDescription>
                  Collection: {selectedLaunchData.collection}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {selectedLaunchData.maxSupply}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Max Supply
                  </div>
                </div>
                <div className="text-center">
                  <Badge
                    className={
                      LAUNCH_STATUS[
                        selectedLaunchData.status as keyof typeof LAUNCH_STATUS
                      ]?.color
                    }>
                    {
                      LAUNCH_STATUS[
                        selectedLaunchData.status as keyof typeof LAUNCH_STATUS
                      ]?.name
                    }
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    Status
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {selectedLaunchData.progress}%
                  </div>
                  <div className="text-sm text-muted-foreground">Progress</div>
                </div>
                <div className="text-center">
                  <a
                    href={`https://sepolia.etherscan.io/address/${selectedLaunchData.collection}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 flex items-center justify-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">Contract</span>
                  </a>
                  <div className="text-sm text-muted-foreground">Etherscan</div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Create Launch Tab */}
        <TabsContent value="create-launch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>➕ Create New Launch</CardTitle>
              <CardDescription>
                Launch a new NFT collection with customizable phases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Collection Name:
                  </label>
                  <Input
                    value={newLaunchName}
                    onChange={(e) => setNewLaunchName(e.target.value)}
                    placeholder="My Awesome Collection"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Symbol:</label>
                  <Input
                    value={newLaunchSymbol}
                    onChange={(e) => setNewLaunchSymbol(e.target.value)}
                    placeholder="MAC"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Max Supply:</label>
                  <Input
                    type="number"
                    value={newLaunchSupply}
                    onChange={(e) => setNewLaunchSupply(e.target.value)}
                    placeholder="100"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateLaunch}
                disabled={isLoading === "Create Launch"}
                className="w-full">
                {isLoading === "Create Launch"
                  ? "Creating..."
                  : "Create New Launch"}
              </Button>

              <div className="text-xs text-muted-foreground p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                <strong>💡 What happens next:</strong>
                <br />
                • A new NFT collection contract will be deployed
                <br />
                • You&apos;ll become the owner of this collection
                <br />
                • Configure phases before starting the launch
                <br />• Start the launch when ready to allow minting
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📦 Bulk NFT Collection Upload</CardTitle>
              <CardDescription>
                Upload entire collections with images and metadata (like 7777 NFT collections)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* JSON Metadata Upload */}
                <div className="space-y-4">
                  <h4 className="font-medium">📝 Metadata Upload</h4>
                  
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".json"
                      multiple
                      onChange={handleMetadataUpload}
                      className="hidden"
                      id="metadata-upload"
                    />
                    <label
                      htmlFor="metadata-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        📄
                      </div>
                      <div className="text-sm">Upload NFT Metadata Files</div>
                      <div className="text-xs text-muted-foreground">Select multiple .json files (1.json, 2.json, ...)</div>
                    </label>
                  </div>

                  {uploadedMetadata.length > 0 && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                      <div className="text-sm text-green-600">✅ {uploadedMetadata.length} metadata files uploaded</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Files: {uploadedMetadata.slice(0, 3).map(m => m.name).join(', ')}
                        {uploadedMetadata.length > 3 && ` +${uploadedMetadata.length - 3} more`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Images Upload */}
                <div className="space-y-4">
                  <h4 className="font-medium">🖼️ Images Upload</h4>
                  
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesUpload}
                      className="hidden"
                      id="images-upload"
                    />
                    <label
                      htmlFor="images-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        🖼️
                      </div>
                      <div className="text-sm">Upload NFT Images</div>
                      <div className="text-xs text-muted-foreground">Select multiple images (1.png, 2.png, ...)</div>
                    </label>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                      <div className="text-sm text-green-600">✅ {uploadedImages.length} images uploaded</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Ready for IPFS upload
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bulk Process Controls */}
              {uploadedMetadata.length > 0 && uploadedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded">
                    <div className="font-medium">🔄 Bulk Processing Options</div>
                    <div className="text-sm mt-2 space-y-2">
                      <div>📝 Metadata Files: {uploadedMetadata.length}</div>
                      <div>🖼️ Image Files: {uploadedImages.length}</div>
                      <div>✅ Match Status: {uploadedMetadata.length === uploadedImages.length ? '🟢 Perfect Match' : '🟡 Count Mismatch'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={handleBulkUploadToIPFS}
                      disabled={isBulkUploading || uploadedMetadata.length !== uploadedImages.length}
                      className="w-full"
                    >
                      {isBulkUploading ? 'Uploading to IPFS...' : `🌐 Upload All to IPFS`}
                    </Button>

                    <Button
                      onClick={handleBulkMint}
                      disabled={isBulkMinting || !selectedLaunchData || processedNFTs.length === 0}
                      className="w-full"
                      variant="outline"
                    >
                      {isBulkMinting ? 'Bulk Minting...' : `🎯 Bulk Mint ${processedNFTs.length} NFTs`}
                    </Button>
                  </div>

                  {processedNFTs.length > 0 && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                      <div className="font-medium">🎯 Ready for Minting:</div>
                      <div className="text-sm mt-1 space-y-1">
                        <div>📦 Collection: {selectedLaunchData?.name}</div>
                        <div>🎨 NFTs Ready: {processedNFTs.length}</div>
                        <div>🌐 IPFS Status: All uploaded</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-muted-foreground p-3 bg-gray-500/10 border border-gray-500/20 rounded">
                <strong>📋 Bulk Upload Instructions:</strong><br/>
                1. Prepare your NFT files: 1.json, 2.json, ... and 1.png, 2.png, ...<br/>
                2. Upload metadata JSON files (must contain name, description, attributes)<br/>
                3. Upload corresponding images (same numbering)<br/>
                4. System will upload all to IPFS and update metadata<br/>
                5. Bulk mint all NFTs to the selected collection<br/>
                <br/>
                <strong>💡 Metadata Format:</strong> Standard OpenSea JSON with name, description, image, attributes
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase Management Tab */}
        <TabsContent value="phase-management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Phase Configuration</CardTitle>
              <CardDescription>
                {selectedLaunchData
                  ? `Configure phases for: ${selectedLaunchData.name} (${selectedLaunchData.collection})`
                  : 'Select a launch from "My Launches" tab first'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedLaunchData ? (
                <>
                  {/* Collection Info Banner */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          🎯 Configuring Collection:
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedLaunchData.name}
                        </div>
                        <div className="text-xs font-mono bg-black/20 px-2 py-1 rounded mt-1">
                          {selectedLaunchData.collection}
                        </div>
                      </div>
                      <Badge
                        className={
                          LAUNCH_STATUS[
                            selectedLaunchData.status as keyof typeof LAUNCH_STATUS
                          ]?.color
                        }>
                        {
                          LAUNCH_STATUS[
                            selectedLaunchData.status as keyof typeof LAUNCH_STATUS
                          ]?.name
                        }
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phase Configuration */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Configure Phase</h4>

                      <div>
                        <label className="text-sm font-medium">
                          Phase Type:
                        </label>
                        <Select
                          value={phaseToConfig.toString()}
                          onValueChange={(value) =>
                            setPhaseToConfig(parseInt(value))
                          }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">
                              <div className="flex items-center gap-2">
                                <span>🎯</span>
                                <span>Presale</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="2">
                              <div className="flex items-center gap-2">
                                <span>👥</span>
                                <span>Whitelist</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="3">
                              <div className="flex items-center gap-2">
                                <span>🌍</span>
                                <span>Public</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            Price (ETH):
                          </label>
                          <Input
                            type="number"
                            step="0.001"
                            value={phasePrice}
                            onChange={(e) => setPhasePrice(e.target.value)}
                            placeholder="0.01"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            Max Per Wallet:
                          </label>
                          <Input
                            type="number"
                            value={phaseMaxPerWallet}
                            onChange={(e) =>
                              setPhaseMaxPerWallet(e.target.value)
                            }
                            placeholder="5"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Phase Max Supply:
                        </label>
                        <Input
                          type="number"
                          value={phaseMaxSupply}
                          onChange={(e) => setPhaseMaxSupply(e.target.value)}
                          placeholder="50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            Start Time:
                          </label>
                          <Input
                            type="datetime-local"
                            value={phaseStartTime}
                            onChange={(e) => setPhaseStartTime(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            End Time:
                          </label>
                          <Input
                            type="datetime-local"
                            value={phaseEndTime}
                            onChange={(e) => setPhaseEndTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleConfigurePhase}
                        disabled={
                          isLoading === "Configure Phase" || !selectedCollection
                        }
                        className="w-full">
                        {isLoading === "Configure Phase"
                          ? "Configuring..."
                          : `Configure ${
                              PHASES[phaseToConfig as keyof typeof PHASES]?.name
                            } Phase for ${selectedLaunchData.name}`}
                      </Button>

                      {!selectedCollection && (
                        <div className="text-xs text-red-500 p-2 bg-red-500/10 border border-red-500/20 rounded">
                          ⚠️ Collection address not set. Try refreshing or
                          selecting the launch again.
                        </div>
                      )}
                    </div>

                    {/* Current Phase Info */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Current Phase Status</h4>

                      {phaseConfigData ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded">
                            <div className="font-medium">
                              {
                                PHASES[phaseToConfig as keyof typeof PHASES]
                                  ?.name
                              }{" "}
                              Phase Status
                            </div>
                            <div className="text-sm space-y-1 mt-2">
                              <div>
                                💰 Price:{" "}
                                {formatEther(phaseConfigData[0] || BigInt(0))}{" "}
                                ETH
                              </div>
                              <div>
                                ⏰ Start:{" "}
                                {phaseConfigData[1]
                                  ? new Date(
                                      Number(phaseConfigData[1]) * 1000,
                                    ).toLocaleString()
                                  : "Not set"}
                              </div>
                              <div>
                                ⏰ End:{" "}
                                {phaseConfigData[2]
                                  ? new Date(
                                      Number(phaseConfigData[2]) * 1000,
                                    ).toLocaleString()
                                  : "Not set"}
                              </div>
                              <div>
                                👤 Max per Wallet:{" "}
                                {phaseConfigData[3]?.toString() || "0"}
                              </div>
                              <div>
                                📦 Phase Supply:{" "}
                                {phaseConfigData[4]?.toString() || "0"}
                              </div>
                              <div>
                                ✅ Status:{" "}
                                {phaseConfigData[5]
                                  ? "🟢 Active"
                                  : "🔴 Inactive"}
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => {
                              // Refresh phase data
                              console.log('🔄 Manual refresh requested');
                              refetchPhaseConfig();
                              toast.info('🔄 Refreshing phase data...');
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Phase Data
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 bg-muted rounded text-center text-muted-foreground">
                          <div>Phase not configured yet</div>
                          <div className="text-xs mt-1">
                            Configure the phase above to see its status
                          </div>
                        </div>
                      )}

                      {/* Phase Troubleshooting */}
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
                        <div className="font-medium text-yellow-700">🔧 Phase Configuration Tips:</div>
                        <div className="text-yellow-600 mt-1 space-y-1">
                          <div>• Start time must be in the future</div>
                          <div>• End time must be after start time</div>
                          <div>• Price must be greater than 0</div>
                          <div>• Phase supply cannot exceed collection max supply</div>
                          <div>• Changes take a few seconds to reflect on-chain</div>
                        </div>
                      </div>

                      {/* Phase Overview */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          All Phases Overview:
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {Object.entries(PHASES)
                            .slice(1)
                            .map(([key, phase]) => (
                              <div
                                key={key}
                                className={`p-2 rounded text-center ${phase.color}`}>
                                <div>{phase.icon}</div>
                                <div className="font-medium">{phase.name}</div>
                                <div className="text-xs">Phase {key}</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    No launch selected
                  </div>
                  <Button
                    onClick={() => setActiveTab("my-launches")}
                    className="mt-4">
                    <Eye className="h-4 w-4 mr-2" />
                    Select a Launch
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Quick Actions</CardTitle>
              <CardDescription>
                {selectedLaunchData 
                  ? `Quick actions for: ${selectedLaunchData.name}`
                  : "Select a launch first"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedLaunchData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NFT Testing & Verification */}
                  <div className="space-y-4">
                    <h4 className="font-medium">🔍 NFT Testing & Verification</h4>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                        <div className="font-medium">📋 Collection Info:</div>
                        <div className="text-sm space-y-1 mt-2">
                          <div>📝 Name: {selectedLaunchData.name}</div>
                          <div>🔗 Contract: <code className="text-xs">{selectedLaunchData.collection}</code></div>
                          <div>📦 Max Supply: {selectedLaunchData.maxSupply}</div>
                        </div>
                      </div>

                      {/* Supply Monitoring */}
                      <SupplyMonitor collectionAddress={selectedLaunchData.collection} />

                      {/* Contract Debug Info */}
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <div className="font-medium">🐛 Debug Info</div>
                        <div className="text-sm space-y-1 mt-2">
                          <div>Launch Max Supply: {selectedLaunchData.maxSupply}</div>
                          <div className="text-xs text-yellow-600 mt-2">
                            ⚠️ If Max Supply shows 0 in Etherscan, the contract was deployed with maxSupply=0. 
                            This is a contract deployment issue that needs to be fixed in the Launchpad contract.
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => window.open(`https://sepolia.etherscan.io/address/${selectedLaunchData.collection}`, '_blank')}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Etherscan
                        </Button>
                        
                        <Button
                          onClick={() => window.open(`https://testnets.opensea.io/assets/sepolia/${selectedLaunchData.collection}`, '_blank')}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          🌊 OpenSea
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground p-3 bg-green-500/10 border border-green-500/20 rounded">
                        <strong>✅ NFT Görsel Test:</strong><br/>
                        • Etherscan&apos;da contract&apos;ı aç<br/>
                        • &quot;Contract&quot; tab → &quot;Read Contract&quot; <br/>
                        • tokenURI fonksiyonunu çağır (token ID: 0, 1, 2...)<br/>
                        • Metadata URL&apos;ini aç → image field&apos;ı kontrol et<br/>
                        • OpenSea testnet&apos;te collection&apos;ı ara<br/>
                        <br/>
                        <strong>🎯 Quick Test Links:</strong><br/>
                        • Token 0: <a href={`https://testnets.opensea.io/assets/sepolia/${selectedLaunchData.collection}/0`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">OpenSea View</a><br/>
                        • Contract: <a href={`https://sepolia.etherscan.io/token/${selectedLaunchData.collection}?a=0`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Etherscan NFT</a>
                      </div>

                      <div className="text-xs text-muted-foreground p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <strong>⚠️ Supply Açıklaması:</strong><br/>
                        • <strong>Max Supply:</strong> Collection&apos;ın maximum NFT limiti<br/>
                        • <strong>Total Supply:</strong> Şu ana kadar mint edilen NFT sayısı<br/>
                        • Örnek: Max 100, Total 0 = Henüz hiç mint edilmemiş<br/>
                        • Her mint işleminde Total Supply artar (0→1→2...)
                      </div>
                    </div>
                  </div>

                  {/* NFT Minting with Image Upload */}
                  <div className="space-y-4">
                    <h4 className="font-medium">
                      🎨 Mint NFT with Custom Image
                    </h4>
                    
                    {/* Image Upload Section */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">NFT Image:</label>
                      
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="nft-image-upload"
                        />
                        <label
                          htmlFor="nft-image-upload"
                          className="cursor-pointer flex flex-col items-center gap-2">
                          {uploadedImageUrl ? (
                            <div className="space-y-2">
                              <img 
                                src={uploadedImageUrl} 
                                alt="NFT Preview" 
                                className="w-32 h-32 object-cover rounded-lg border"
                              />
                              <div className="text-sm text-green-600">
                                ✅ Image uploaded successfully
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Click to change image
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                📸
                              </div>
                              <div className="text-sm">
                                Click to upload NFT image
                              </div>
                              <div className="text-xs text-muted-foreground">
                                JPG, PNG, GIF up to 10MB
                              </div>
                            </div>
                          )}
                        </label>
                      </div>

                      {isUploading && (
                        <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                          <div className="text-blue-600">
                            📤 Uploading to IPFS...
                          </div>
                          <div className="text-xs text-muted-foreground">
                            This may take a few seconds
                          </div>
                        </div>
                      )}
                    </div>

                    {/* NFT Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">NFT Name:</label>
                        <Input
                          value={nftName}
                          onChange={(e) => setNftName(e.target.value)}
                          placeholder="My Awesome NFT #1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">
                          NFT Description:
                        </label>
                        <Input
                          value={nftDescription}
                          onChange={(e) => setNftDescription(e.target.value)}
                          placeholder="A unique digital collectible"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Phase:</label>
                        <Select
                          value={mintPhase.toString()}
                          onValueChange={(value) =>
                            setMintPhase(parseInt(value))
                          }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">🎯 Presale</SelectItem>
                            <SelectItem value="2">👥 Whitelist</SelectItem>
                            <SelectItem value="3">🌍 Public</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">
                          Price (ETH):
                        </label>
                        <Input
                          type="number"
                          step="0.001"
                          value={mintPrice}
                          onChange={(e) => setMintPrice(e.target.value)}
                          placeholder="0.01"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleMintWithCustomImage}
                      disabled={isLoading === "Mint NFT" || !uploadedImageUrl}
                      className="w-full">
                      {isLoading === "Mint NFT"
                        ? "Minting..."
                        : `Mint NFT in ${
                            PHASES[mintPhase as keyof typeof PHASES]?.name
                          } Phase`}
                    </Button>

                    {!uploadedImageUrl && (
                      <div className="text-xs text-yellow-600 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        ⚠️ Please upload an image first to mint your NFT
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                      <strong>📸 Image Storage:</strong>
                      <br />
                      • Images are uploaded to IPFS (Decentralized storage)
                      <br />
                      • IPFS URLs are permanent and censorship-resistant
                      <br />• Metadata is stored on-chain with IPFS image hash
                      <br />
                      <br />
                      <strong>🔧 Pinata Setup:</strong>
                      <br />
                      • JWT Token: {process.env.NEXT_PUBLIC_PINATA_JWT ? '✅ Configured' : '❌ Not configured'}
                      <br />
                      • Fallback: Placeholder IPFS images
                      <br />
                      • Real URLs work in OpenSea/Etherscan
                      <br />
                      <br />
                      {!process.env.NEXT_PUBLIC_PINATA_JWT && (
                        <div className="text-yellow-600 bg-yellow-500/10 p-2 rounded mt-2">
                          <strong>⚙️ Setup Pinata:</strong><br/>
                          1. Go to Pinata dashboard → API Keys<br/>
                          2. Create new key → Copy JWT token<br/>
                          3. Add to .env.local: NEXT_PUBLIC_PINATA_JWT=your_jwt_here<br/>
                          4. Restart dev server
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    No launch selected
                  </div>
                  <Button
                    onClick={() => setActiveTab("my-launches")}
                    className="mt-4">
                    <Eye className="h-4 w-4 mr-2" />
                    Select a Launch
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Launch Card Component
function LaunchCard({
  launchId,
  isSelected,
  onSelect,
  onStart,
  onComplete,
  onCancel,
  isLoading,
}: {
  launchId: number;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  isLoading: string | null;
}) {
  const { launch } = useRealLaunch(launchId);

  if (!launch) {
    return (
      <Card
        className={`cursor-pointer transition-all ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <div className="font-medium">{launch.name}</div>
            <div className="text-sm text-muted-foreground">
              ID: {launch.launchId}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              className={
                LAUNCH_STATUS[launch.status as keyof typeof LAUNCH_STATUS]
                  ?.color
              }>
              {LAUNCH_STATUS[launch.status as keyof typeof LAUNCH_STATUS]?.icon}{" "}
              {LAUNCH_STATUS[launch.status as keyof typeof LAUNCH_STATUS]?.name}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {launch.maxSupply} supply
            </div>
          </div>

          {isSelected && (
            <div className="pt-2 border-t space-y-2">
              {launch.status === 0 && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart();
                  }}
                  disabled={isLoading === "Start Launch"}
                  size="sm"
                  className="w-full">
                  <Play className="h-3 w-3 mr-1" />
                  Start
                </Button>
              )}

              {launch.status === 1 && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  disabled={isLoading === "Complete Launch"}
                  size="sm"
                  variant="outline"
                  className="w-full">
                  <Square className="h-3 w-3 mr-1" />
                  Complete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
