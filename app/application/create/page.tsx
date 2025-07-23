'use client';

import { Header } from '@/components/header';
import { useState, useEffect } from 'react';
import { 
  Upload, 
  Plus, 
  X, 
  Rocket,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { useLaunchpadContract } from '@/lib/hooks/useContracts';
import { useTransactionContext, useTransactionWatcher } from '@/lib/contexts/TransactionContext';
import { toast } from 'sonner';

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface LaunchPhase {
  name: string;
  price: string; // in ETH
  maxPerWallet: number;
  startTime: Date | null;
  endTime: Date | null;
  isWhitelist: boolean;
}

export default function CreatePage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'nft' | 'collection'>('nft');
  
  // NFT Creation State
  const [nftImage, setNftImage] = useState<File | null>(null);
  const [nftImagePreview, setNftImagePreview] = useState<string>('');
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [nftAttributes, setNftAttributes] = useState<NFTAttribute[]>([]);
  const [royaltyPercentage, setRoyaltyPercentage] = useState(5);
  const [isNFTMinting, setIsNFTMinting] = useState(false);
  
  // Collection Launch State
  const [collectionImage, setCollectionImage] = useState<File | null>(null);
  const [collectionImagePreview, setCollectionImagePreview] = useState<string>('');
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [maxSupply, setMaxSupply] = useState(10000);
  const [phases, setPhases] = useState<LaunchPhase[]>([
    {
      name: 'Whitelist',
      price: '0.05',
      maxPerWallet: 3,
      startTime: null,
      endTime: null,
      isWhitelist: true
    },
    {
      name: 'Public Sale',
      price: '0.08',
      maxPerWallet: 10,
      startTime: null,
      endTime: null,
      isWhitelist: false
    }
  ]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchTxHash, setLaunchTxHash] = useState<`0x${string}` | undefined>();

  const { address: userAddress, isConnected } = useAccount();
  const { createLaunch } = useLaunchpadContract();
  const { addPendingTransaction } = useTransactionContext();

  // Watch launch transaction
  const { isLoading: isWatchingTx, isSuccess: txSuccess } = useTransactionWatcher(
    launchTxHash, 
    'create_launch'
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (txSuccess) {
      toast.success('Launch created successfully!');
      setIsLaunching(false);
      setLaunchTxHash(undefined);
      // Reset form
      resetCollectionForm();
    }
  }, [txSuccess]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="loading-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const resetCollectionForm = () => {
    setCollectionName('');
    setCollectionSymbol('');
    setCollectionDescription('');
    setCollectionImage(null);
    setCollectionImagePreview('');
    setMaxSupply(10000);
    setPhases([
      {
        name: 'Whitelist',
        price: '0.05',
        maxPerWallet: 3,
        startTime: null,
        endTime: null,
        isWhitelist: true
      },
      {
        name: 'Public Sale',
        price: '0.08',
        maxPerWallet: 10,
        startTime: null,
        endTime: null,
        isWhitelist: false
      }
    ]);
  };

  const handleImageUpload = (file: File, type: 'nft' | 'collection') => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        if (type === 'nft') {
          setNftImage(file);
          setNftImagePreview(preview);
        } else {
          setCollectionImage(file);
          setCollectionImagePreview(preview);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addAttribute = () => {
    setNftAttributes([...nftAttributes, { trait_type: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const updated = [...nftAttributes];
    updated[index][field] = value;
    setNftAttributes(updated);
  };

  const removeAttribute = (index: number) => {
    setNftAttributes(nftAttributes.filter((_, i) => i !== index));
  };

  const addPhase = () => {
    setPhases([...phases, {
      name: `Phase ${phases.length + 1}`,
      price: '0.1',
      maxPerWallet: 5,
      startTime: null,
      endTime: null,
      isWhitelist: false
    }]);
  };

  const updatePhase = (index: number, field: keyof LaunchPhase, value: string | number | boolean | Date | null) => {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    setPhases(updated);
  };

  const removePhase = (index: number) => {
    if (phases.length > 1) {
      setPhases(phases.filter((_, i) => i !== index));
    }
  };

  const handleCreateNFT = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!nftName || !nftDescription || !nftImage) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsNFTMinting(true);
    try {
      // In a real implementation, we would:
      // 1. Upload image and metadata to IPFS
      // 2. Call the mint function on an NFT contract
      
      toast.info('NFT minting will be available once collections are deployed');
      
    } catch (error) {
      console.error('Minting failed:', error);
      toast.error('Failed to mint NFT');
    } finally {
      setIsNFTMinting(false);
    }
  };

  const handleCreateLaunch = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!collectionName || !collectionSymbol || !collectionDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (phases.length === 0) {
      toast.error('Please add at least one launch phase');
      return;
    }

    setIsLaunching(true);
    try {
      // In a real implementation, we would upload the image to IPFS first
      const imageUrl = collectionImagePreview || '/squid1.jpg'; // Placeholder
      
      const hash = await createLaunch(
        collectionName,
        collectionSymbol,
        collectionDescription,
        imageUrl,
        BigInt(maxSupply),
        true // auto-progress phases
      );

      setLaunchTxHash(hash);
      addPendingTransaction({
        hash: hash,
        type: 'create_launch',
        description: `Creating launch for ${collectionName}`,
      });
      toast.info('Launch creation transaction submitted!');

    } catch (error) {
      console.error('Launch creation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create launch');
      setIsLaunching(false);
    }
  };

  // If wallet not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="pt-32 pb-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <Rocket className="h-24 w-24 mx-auto mb-6 text-white/40" />
              <h1 className="font-exo2 text-4xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="font-inter text-white/60 mb-8">
                Connect your wallet to create NFTs and launch collections
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-0 cyber-grid opacity-20"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h1 className="font-exo2 text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">Create</span>
            </h1>
            <p className="font-inter text-xl text-white/70 max-w-3xl mx-auto">
              Mint individual NFTs or launch entire collections with advanced features.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center mb-12">
            <div className="glass p-2 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('nft')}
                className={`px-8 py-4 rounded-lg font-inter font-semibold transition-all ${
                  activeTab === 'nft'
                    ? 'bg-neon-cyan text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Single NFT
              </button>
              <button
                onClick={() => setActiveTab('collection')}
                className={`px-8 py-4 rounded-lg font-inter font-semibold transition-all ${
                  activeTab === 'collection'
                    ? 'bg-neon-cyan text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Collection Launch
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'nft' ? (
            <NFTCreationForm
              imagePreview={nftImagePreview}
              name={nftName}
              description={nftDescription}
              attributes={nftAttributes}
              royaltyPercentage={royaltyPercentage}
              isMinting={isNFTMinting}
              onImageUpload={handleImageUpload}
              onNameChange={setNftName}
              onDescriptionChange={setNftDescription}
              onRoyaltyChange={setRoyaltyPercentage}
              onAddAttribute={addAttribute}
              onUpdateAttribute={updateAttribute}
              onRemoveAttribute={removeAttribute}
              onMint={handleCreateNFT}
            />
          ) : (
            <CollectionLaunchForm
              imagePreview={collectionImagePreview}
              name={collectionName}
              symbol={collectionSymbol}
              description={collectionDescription}
              maxSupply={maxSupply}
              phases={phases}
              isLaunching={isLaunching || isWatchingTx}
              onImageUpload={handleImageUpload}
              onNameChange={setCollectionName}
              onSymbolChange={setCollectionSymbol}
              onDescriptionChange={setCollectionDescription}
              onMaxSupplyChange={setMaxSupply}
              onAddPhase={addPhase}
              onUpdatePhase={updatePhase}
              onRemovePhase={removePhase}
              onLaunch={handleCreateLaunch}
            />
          )}
        </div>
      </section>
    </div>
  );
}

// NFT Creation Form Component
interface NFTCreationFormProps {
  imagePreview: string;
  name: string;
  description: string;
  attributes: NFTAttribute[];
  royaltyPercentage: number;
  isMinting: boolean;
  onImageUpload: (file: File, type: 'nft') => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onRoyaltyChange: (percentage: number) => void;
  onAddAttribute: () => void;
  onUpdateAttribute: (index: number, field: 'trait_type' | 'value', value: string) => void;
  onRemoveAttribute: (index: number) => void;
  onMint: () => void;
}

function NFTCreationForm({
  imagePreview,
  name,
  description,
  attributes,
  royaltyPercentage,
  isMinting,
  onImageUpload,
  onNameChange,
  onDescriptionChange,
  onRoyaltyChange,
  onAddAttribute,
  onUpdateAttribute,
  onRemoveAttribute,
  onMint
}: NFTCreationFormProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left Column - Preview */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-2xl border border-white/10">
            <h3 className="font-exo2 text-2xl font-bold mb-6">Preview</h3>
            <div className="nft-card p-6 rounded-2xl">
              <div className="relative aspect-square rounded-xl overflow-hidden mb-6">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="NFT Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-white/40" />
                  </div>
                )}
              </div>
              <h4 className="font-exo2 text-xl font-bold mb-2">{name || 'Untitled NFT'}</h4>
              <p className="font-inter text-white/60 text-sm mb-4">{description || 'No description'}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Royalty: {royaltyPercentage}%</span>
                <span className="text-white/60">{attributes.length} traits</span>
              </div>
            </div>
          </div>

          {/* Attributes Preview */}
          {attributes.length > 0 && (
            <div className="glass p-6 rounded-2xl border border-white/10">
              <h4 className="font-exo2 text-lg font-bold mb-4">Attributes</h4>
              <div className="grid grid-cols-2 gap-3">
                {attributes.map((attr, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3">
                    <p className="font-inter text-xs text-white/60 mb-1">{attr.trait_type}</p>
                    <p className="font-inter text-sm font-semibold">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Form */}
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="glass p-8 rounded-2xl border border-white/10">
            <h3 className="font-exo2 text-2xl font-bold mb-6">Upload Media</h3>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'nft')}
                className="hidden"
                id="nft-image-upload"
              />
              <label htmlFor="nft-image-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-white/40" />
                <p className="font-inter text-white/60 mb-2">Click to upload image</p>
                <p className="font-inter text-sm text-white/40">PNG, JPG, GIF up to 10MB</p>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="glass p-8 rounded-2xl border border-white/10">
            <h3 className="font-exo2 text-2xl font-bold mb-6">Basic Information</h3>
            <div className="space-y-6">
              <div>
                <label className="block font-inter text-sm font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Enter NFT name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Describe your NFT"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50 resize-none"
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-semibold mb-2">Royalty Percentage</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={royaltyPercentage}
                  onChange={(e) => onRoyaltyChange(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white focus:outline-none focus:border-neon-cyan/50"
                />
                                 <p className="font-inter text-xs text-white/60 mt-2">Royalty you will receive on secondary sales</p>
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="glass p-8 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-exo2 text-2xl font-bold">Attributes</h3>
              <button
                onClick={onAddAttribute}
                className="btn-cyber px-4 py-2 rounded-lg font-inter font-semibold text-sm flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-4">
              {attributes.map((attr, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Trait type"
                    value={attr.trait_type}
                    onChange={(e) => onUpdateAttribute(index, 'trait_type', e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={attr.value}
                    onChange={(e) => onUpdateAttribute(index, 'value', e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
                  />
                  <button
                    onClick={() => onRemoveAttribute(index)}
                    className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    <X className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mint Button */}
          <button
            onClick={onMint}
            disabled={isMinting || !name || !description}
            className="w-full btn-cyber py-4 rounded-xl font-inter font-semibold text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMinting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Minting...</span>
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5" />
                <span>Mint NFT</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Collection Launch Form Component
interface CollectionLaunchFormProps {
  imagePreview: string;
  name: string;
  symbol: string;
  description: string;
  maxSupply: number;
  phases: LaunchPhase[];
  isLaunching: boolean;
  onImageUpload: (file: File, type: 'collection') => void;
  onNameChange: (name: string) => void;
  onSymbolChange: (symbol: string) => void;
  onDescriptionChange: (description: string) => void;
  onMaxSupplyChange: (supply: number) => void;
  onAddPhase: () => void;
  onUpdatePhase: (index: number, field: keyof LaunchPhase, value: string | number | boolean | Date | null) => void;
  onRemovePhase: (index: number) => void;
  onLaunch: () => void;
}

function CollectionLaunchForm({
  imagePreview,
  name,
  symbol,
  description,
  maxSupply,
  phases,
  isLaunching,
  onImageUpload,
  onNameChange,
  onSymbolChange,
  onDescriptionChange,
  onMaxSupplyChange,
  onAddPhase,
  onUpdatePhase,
  onRemovePhase,
  onLaunch
}: CollectionLaunchFormProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Column - Preview */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-2xl border border-white/10">
            <h3 className="font-exo2 text-2xl font-bold mb-6">Preview</h3>
            <div className="nft-card p-6 rounded-2xl">
              <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Collection Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-white/40" />
                  </div>
                )}
              </div>
              <h4 className="font-exo2 text-xl font-bold mb-2">{name || 'Untitled Collection'}</h4>
              <p className="font-inter text-white/60 text-sm mb-4">{description || 'No description'}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Symbol:</span>
                  <span>{symbol || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Max Supply:</span>
                  <span>{maxSupply.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Phases:</span>
                  <span>{phases.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle & Right Columns - Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upload Section */}
          <div className="glass p-8 rounded-2xl border border-white/10">
            <h3 className="font-exo2 text-2xl font-bold mb-6">Collection Image</h3>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'collection')}
                className="hidden"
                id="collection-image-upload"
              />
              <label htmlFor="collection-image-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-white/40" />
                <p className="font-inter text-white/60 mb-2">Click to upload collection image</p>
                <p className="font-inter text-sm text-white/40">PNG, JPG, GIF up to 10MB</p>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="glass p-8 rounded-2xl border border-white/10">
            <h3 className="font-exo2 text-2xl font-bold mb-6">Collection Details</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-inter text-sm font-semibold mb-2">Collection Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g. Cosmic Squids"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-semibold mb-2">Symbol *</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
                  placeholder="e.g. COSMIC"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-inter text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Describe your collection"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan/50 resize-none"
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-semibold mb-2">Max Supply</label>
                <input
                  type="number"
                  min="1"
                  value={maxSupply}
                  onChange={(e) => onMaxSupplyChange(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white focus:outline-none focus:border-neon-cyan/50"
                />
              </div>
            </div>
          </div>

          {/* Launch Phases */}
          <div className="glass p-8 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-exo2 text-2xl font-bold">Launch Phases</h3>
              <button
                onClick={onAddPhase}
                className="btn-cyber px-4 py-2 rounded-lg font-inter font-semibold text-sm flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Phase</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {phases.map((phase, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-exo2 text-lg font-bold">Phase {index + 1}</h4>
                    {phases.length > 1 && (
                      <button
                        onClick={() => onRemovePhase(index)}
                        className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <X className="h-4 w-4 text-red-400" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-sm font-semibold mb-2">Phase Name</label>
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => onUpdatePhase(index, 'name', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white focus:outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-sm font-semibold mb-2">Price (ETH)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={phase.price}
                        onChange={(e) => onUpdatePhase(index, 'price', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white focus:outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-sm font-semibold mb-2">Max Per Wallet</label>
                      <input
                        type="number"
                        min="1"
                        value={phase.maxPerWallet}
                        onChange={(e) => onUpdatePhase(index, 'maxPerWallet', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-inter text-white focus:outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={phase.isWhitelist}
                          onChange={(e) => onUpdatePhase(index, 'isWhitelist', e.target.checked)}
                          className="w-5 h-5 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-neon-cyan/50"
                        />
                        <span className="font-inter text-sm">Whitelist Only</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={onLaunch}
            disabled={isLaunching || !name || !symbol || !description || phases.length === 0}
            className="w-full btn-cyber py-4 rounded-xl font-inter font-semibold text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLaunching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating Launch...</span>
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5" />
                <span>Create Launch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 