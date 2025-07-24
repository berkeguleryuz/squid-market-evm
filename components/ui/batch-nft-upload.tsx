"use client";

import { useState, useCallback } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { toast } from 'sonner';
import { Upload, X, Image, Plus, Trash2 } from 'lucide-react';

interface NFTMetadata {
  id: number;
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface BatchNFTUploadProps {
  onUpload: (nfts: NFTMetadata[]) => void;
  isUploading?: boolean;
  maxSupply?: number;
}

export function BatchNFTUpload({ 
  onUpload, 
  isUploading = false, 
  maxSupply = 100 
}: BatchNFTUploadProps) {
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Add single NFT
  const addNFT = useCallback(() => {
    const newId = nfts.length + 1;
    const newNFT: NFTMetadata = {
      id: newId,
      name: `NFT #${newId}`,
      description: '',
      image: '',
      attributes: []
    };
    setNfts(prev => [...prev, newNFT]);
  }, [nfts.length]);

  // Remove NFT
  const removeNFT = useCallback((id: number) => {
    setNfts(prev => prev.filter(nft => nft.id !== id));
  }, []);

  // Update NFT
  const updateNFT = useCallback((id: number, updates: Partial<NFTMetadata>) => {
    setNfts(prev => prev.map(nft => 
      nft.id === id ? { ...nft, ...updates } : nft
    ));
  }, []);

  // Generate batch NFTs
  const generateBatch = useCallback(async (count: number) => {
    if (count > maxSupply) {
      toast.error(`Cannot generate more than ${maxSupply} NFTs`);
      return;
    }

    setIsGenerating(true);
    try {
      const generatedNFTs: NFTMetadata[] = [];
      
      for (let i = 1; i <= count; i++) {
        generatedNFTs.push({
          id: i,
          name: `NFT #${i}`,
          description: `Unique NFT #${i} from this collection`,
          image: `https://via.placeholder.com/400x400?text=NFT+${i}`, // Placeholder
          attributes: [
            { trait_type: 'Rarity', value: i <= count * 0.1 ? 'Legendary' : i <= count * 0.3 ? 'Rare' : 'Common' },
            { trait_type: 'Generation', value: '1' },
            { trait_type: 'ID', value: i.toString() }
          ]
        });
      }

      setNfts(generatedNFTs);
      toast.success(`Generated ${count} NFTs`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate NFTs');
    } finally {
      setIsGenerating(false);
    }
  }, [maxSupply]);

  // Handle JSON file upload
  const handleJSONUpload = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        const validNFTs = data.filter(item => 
          item.name && item.description && typeof item.id !== 'undefined'
        );
        
        if (validNFTs.length > maxSupply) {
          toast.error(`Too many NFTs. Maximum allowed: ${maxSupply}`);
          return;
        }

        setNfts(validNFTs);
        toast.success(`Loaded ${validNFTs.length} NFTs from JSON`);
      } else {
        toast.error('Invalid JSON format. Expected array of NFT objects.');
      }
    } catch (error) {
      console.error('JSON parse error:', error);
      toast.error('Failed to parse JSON file');
    }
  }, [maxSupply]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type === 'application/json') {
      await handleJSONUpload(file);
    } else {
      toast.error('Please upload a JSON file');
    }
  }, [handleJSONUpload]);

  // Submit batch
  const handleSubmit = useCallback(() => {
    if (nfts.length === 0) {
      toast.error('Please add at least one NFT');
      return;
    }

    const invalidNFTs = nfts.filter(nft => !nft.name || !nft.description);
    if (invalidNFTs.length > 0) {
      toast.error('All NFTs must have name and description');
      return;
    }

    onUpload(nfts);
  }, [nfts, onUpload]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Batch NFT Upload</h3>
          <p className="text-sm text-gray-600">
            Upload NFT metadata for your collection (Max: {maxSupply})
          </p>
        </div>
        <Badge variant="outline">
          {nfts.length} / {maxSupply} NFTs
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addNFT}
          disabled={nfts.length >= maxSupply}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add NFT
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => generateBatch(10)}
          disabled={isGenerating || nfts.length >= maxSupply}
        >
          {isGenerating ? 'Generating...' : 'Generate 10'}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => generateBatch(maxSupply)}
          disabled={isGenerating || nfts.length >= maxSupply}
        >
          {isGenerating ? 'Generating...' : `Generate ${maxSupply}`}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('json-upload')?.click()}
        >
          <Upload className="h-4 w-4 mr-1" />
          Upload JSON
        </Button>

        <input
          id="json-upload"
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          className="hidden"
        />
      </div>

      {/* NFT List */}
      {nfts.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {nfts.map((nft) => (
            <Card key={nft.id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {nft.image ? (
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Form */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={nft.name}
                      onChange={(e) => updateNFT(nft.id, { name: e.target.value })}
                      placeholder="NFT Name"
                      className="h-8"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Image URL</Label>
                    <Input
                      value={nft.image}
                      onChange={(e) => updateNFT(nft.id, { image: e.target.value })}
                      placeholder="https://..."
                      className="h-8"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={nft.description}
                      onChange={(e) => updateNFT(nft.id, { description: e.target.value })}
                      placeholder="NFT Description"
                      className="h-16 resize-none"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNFT(nft.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {nfts.length === 0 && (
        <Card className="p-8 text-center">
          <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-medium mb-2">No NFTs Added</h4>
          <p className="text-sm text-gray-600 mb-4">
            Add NFTs manually, generate batch, or upload JSON file
          </p>
          <Button onClick={addNFT} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add First NFT
          </Button>
        </Card>
      )}

      {/* Submit */}
      {nfts.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isUploading || nfts.length === 0}
            className="min-w-32"
          >
            {isUploading ? 'Uploading...' : `Upload ${nfts.length} NFTs`}
          </Button>
        </div>
      )}
    </div>
  );
}
