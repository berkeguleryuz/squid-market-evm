"use client";

import { useState, useCallback } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { toast } from "sonner";
import { Upload, X, Image, Plus, Trash2 } from "lucide-react";

interface NFTMetadata {
  id?: number;
  name: string;
  description: string;
  image: string;
  imageData?: string; // Base64 image data for API upload
  isUploading?: boolean; // Track if image is being uploaded to IPFS
  ipfsUploaded?: boolean; // Track if image has been uploaded to IPFS
  uploadFailed?: boolean; // Track if image upload failed
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface BatchNFTUploadProps {
  launchId: number;
  maxSupply: number;
  collectionName?: string;
  onUploadComplete?: () => void;
  onUpload: (nfts: NFTMetadata[]) => void;
  isUploading?: boolean;
}

export function BatchNFTUpload({
  onUpload,
  launchId,
  maxSupply = 100,
  collectionName,
  onUploadComplete,
  isUploading = false,
}: BatchNFTUploadProps) {
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collectionNameState, setCollectionNameState] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [fullMetadata, setFullMetadata] = useState<any[]>([]);
  
  // Check if max supply is reached
  const isMaxSupplyReached = nfts.length >= maxSupply;
  const remainingSlots = maxSupply - nfts.length;

  // Add single NFT
  const addNFT = useCallback(() => {
    if (isMaxSupplyReached) {
      toast.error(`Maximum supply of ${maxSupply} NFTs reached`);
      return;
    }

    const newNFT: NFTMetadata = {
      id: nfts.length + 1,
      name: `${collectionName || "NFT"} #${nfts.length + 1}`,
      description: collectionDescription || "",
      image: "",
      attributes: [],
    };

    setNfts((prev) => [...prev, newNFT]);
  }, [nfts.length, maxSupply, collectionName, collectionDescription]);

  // Remove NFT
  const removeNFT = useCallback((id: number) => {
    setNfts((prev) => prev.filter((nft) => nft.id !== id));
  }, []);

  // Update NFT
  const updateNFT = useCallback(
    (id: number | undefined, updates: Partial<NFTMetadata>) => {
      if (id === undefined) return;
      setNfts((prev) =>
        prev.map((nft) => (nft.id === id ? { ...nft, ...updates } : nft))
      );
    },
    []
  );

  // Generate batch NFTs
  const generateBatch = useCallback(
    async (count: number) => {
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
            name: `${collectionName || "NFT"} #${i}`,
            description: collectionDescription || "",
            image: `https://via.placeholder.com/400x400?text=${encodeURIComponent(
              collectionName || "NFT"
            )}+${i}`, // Placeholder
            attributes: [
              {
                trait_type: "Rarity",
                value:
                  i <= count * 0.1
                    ? "Legendary"
                    : i <= count * 0.3
                    ? "Rare"
                    : "Common",
              },
              { trait_type: "Generation", value: "1" },
              { trait_type: "ID", value: i.toString() },
            ],
          });
        }

        setNfts(generatedNFTs);
        toast.success(`Generated ${count} NFTs`);
      } catch (error) {
        console.error("Generation error:", error);
        toast.error("Failed to generate NFTs");
      } finally {
        setIsGenerating(false);
      }
    },
    [maxSupply]
  );

  // Handle single JSON file upload
  const handleJSONUpload = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (Array.isArray(data)) {
          const validNFTs = data.filter(
            (item) =>
              item.name && item.description && typeof item.id !== "undefined"
          );

          if (validNFTs.length > maxSupply) {
            toast.error(`Too many NFTs. Maximum allowed: ${maxSupply}`);
            return;
          }

          setNfts(validNFTs);
          toast.success(`Loaded ${validNFTs.length} NFTs from JSON`);
        } else {
          toast.error("Invalid JSON format. Expected array of NFT objects.");
        }
      } catch (error) {
        console.error("JSON parse error:", error);
        toast.error("Failed to parse JSON file");
      }
    },
    [maxSupply]
  );

  // Store full metadata for matching (already declared above)

  // Handle metadata.json upload
  const handleMetadataUpload = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (Array.isArray(data)) {
        setFullMetadata(data);
        toast.success(
          `📋 Loaded metadata for ${data.length} NFTs. Now you can upload images to match them.`
        );
      } else {
        toast.error("Metadata file should contain an array of NFT objects.");
      }
    } catch (error) {
      console.error("Metadata parse error:", error);
      toast.error("Failed to parse metadata.json file");
    }
  }, []);

  // Handle multiple image files upload with metadata matching
  const handleMultipleImageUpload = useCallback(
    async (files: FileList) => {
      const imageFiles = Array.from(files).filter(
        (file) =>
          file.type.startsWith("image/") &&
          (file.type.includes("png") ||
            file.type.includes("jpg") ||
            file.type.includes("jpeg") ||
            file.type.includes("gif") ||
            file.type.includes("webp"))
      );

      if (imageFiles.length === 0) {
        toast.error(
          "No image files found. Please select PNG, JPG, JPEG, GIF, or WebP files."
        );
        return;
      }

      if (imageFiles.length > maxSupply) {
        toast.error(
          `Too many images (${imageFiles.length}). Maximum allowed: ${maxSupply}`
        );
        return;
      }

      toast.info(`Processing ${imageFiles.length} image files...`);

      try {
        // Create NFT metadata for each image
        const imageNFTs: NFTMetadata[] = [];

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

          // Extract ID from filename (e.g., "001.png" -> 1, "nft-123.png" -> 123)
          let nftId = i + 1;
          const idMatch = fileName.match(/(\d+)/);
          if (idMatch) {
            nftId = parseInt(idMatch[1]);
          }

          // Create a temporary URL for preview (will be replaced with IPFS URL)
          const imageUrl = URL.createObjectURL(file);

          // Convert to base64 for API upload
          const base64Image = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          // Try to match with loaded metadata
          let matchedMetadata: any = null;
          if (fullMetadata.length > 0) {
            // Look for metadata with matching ID or index
            matchedMetadata = fullMetadata.find(
              (meta: any) =>
                meta.id === nftId ||
                meta.tokenId === nftId ||
                meta.edition === nftId ||
                fullMetadata.indexOf(meta) + 1 === nftId
            );
          }

          const nft: NFTMetadata = {
            id: nftId,
            name:
              matchedMetadata?.name ||
              (fileName.includes("#")
                ? fileName
                : `${collectionName || "NFT"} #${nftId}`),
            description:
              matchedMetadata?.description || collectionDescription || "",
            image: imageUrl, // Temporary URL for preview (will be updated with IPFS URL)
            imageData: base64Image, // Base64 data for API upload
            isUploading: true, // Track upload status
            attributes: matchedMetadata?.attributes || [
              {
                trait_type: "File Name",
                value: fileName,
              },
              {
                trait_type: "File Type",
                value: file.type,
              },
            ],
          };

          // Add rarity info if available
          if (matchedMetadata?.rarity) {
            nft.attributes = nft.attributes || [];
            nft.attributes.push({
              trait_type: "Rarity",
              value: matchedMetadata.rarity,
            });
          }

          imageNFTs.push(nft);
        }

        // Set initial NFTs with blob URLs
        setNfts([...nfts, ...imageNFTs]);

        // Start uploading images to IPFS immediately
        toast.info("Uploading images to IPFS...");

        // Upload images progressively and update UI
        for (let i = 0; i < imageNFTs.length; i++) {
          const nft = imageNFTs[i];
          const file = imageFiles[i];

          try {
            // Upload individual image to IPFS
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch("/api/upload-image", {
              method: "POST",
              body: formData,
            });

            const uploadResult = await uploadResponse.json();

            if (uploadResult.success && uploadResult.ipfsUrl) {
              // Update the NFT with IPFS URL in the state
              setNfts((currentNfts) =>
                currentNfts.map((currentNft) =>
                  currentNft.id === nft.id && currentNft.image === nft.image
                    ? {
                        ...currentNft,
                        image: uploadResult.ipfsUrl,
                        isUploading: false,
                        ipfsUploaded: true,
                      }
                    : currentNft
                )
              );

              console.log(
                `✅ Image uploaded to IPFS for NFT #${nft.id}: ${uploadResult.ipfsUrl}`
              );
            } else {
              console.error(
                `❌ Failed to upload image for NFT #${nft.id}:`,
                uploadResult.error
              );
              // Mark as failed but keep blob URL
              setNfts((currentNfts) =>
                currentNfts.map((currentNft) =>
                  currentNft.id === nft.id && currentNft.image === nft.image
                    ? { ...currentNft, isUploading: false, uploadFailed: true }
                    : currentNft
                )
              );
            }
          } catch (error) {
            console.error(
              `❌ Error uploading image for NFT #${nft.id}:`,
              error
            );
            // Mark as failed but keep blob URL
            setNfts((currentNfts) =>
              currentNfts.map((currentNft) =>
                currentNft.id === nft.id && currentNft.image === nft.image
                  ? { ...currentNft, isUploading: false, uploadFailed: true }
                  : currentNft
              )
            );
          }
        }

        toast.success(
          `✅ Loaded ${imageNFTs.length} NFTs from image files. Images are being uploaded to IPFS...`
        );
      } catch (error) {
        console.error("Error processing images:", error);
        toast.error("Failed to process image files");
      }
    },
    [maxSupply]
  );

  // Handle multiple JSON files upload
  const handleMultipleJSONUpload = useCallback(
    async (files: FileList) => {
      const jsonFiles = Array.from(files).filter(
        (file) => file.type === "application/json"
      );

      if (jsonFiles.length === 0) {
        toast.error("No JSON files found. Please select JSON files.");
        return;
      }

      let allNFTs: NFTMetadata[] = [];
      let successCount = 0;
      let errorCount = 0;

      toast.info(`Processing ${jsonFiles.length} JSON files...`);

      for (const file of jsonFiles) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);

          if (Array.isArray(data)) {
            // Handle array of NFTs
            const validNFTs = data
              .filter(
                (item) =>
                  item.name &&
                  typeof item.id !== "undefined"
              )
              .map((item, index) => ({
                ...item,
                id: allNFTs.length + index + 1, // Ensure unique IDs
              }));

            allNFTs = [...allNFTs, ...validNFTs];
            successCount++;
          } else if (data.name) {
            // Handle single NFT object
            allNFTs.push({
              ...data,
              id: allNFTs.length + 1,
            });
            successCount++;
          } else {
            console.warn(`Invalid format in ${file.name}:`, data);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error parsing ${file.name}:`, error);
          errorCount++;
        }
      }

      if (allNFTs.length > maxSupply) {
        toast.error(
          `Too many NFTs (${allNFTs.length}). Maximum allowed: ${maxSupply}. Only first ${maxSupply} will be loaded.`
        );
        allNFTs = allNFTs.slice(0, maxSupply);
      }

      if (allNFTs.length > 0) {
        setNfts(allNFTs);
        toast.success(
          `✅ Loaded ${allNFTs.length} NFTs from ${successCount} files${
            errorCount > 0 ? ` (${errorCount} files failed)` : ""
          }`
        );
      } else {
        toast.error("No valid NFT data found in the selected files.");
      }
    },
    [maxSupply]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (file.type === "application/json") {
        await handleJSONUpload(file);
      } else {
        toast.error("Please upload a JSON file");
      }
    },
    [handleJSONUpload]
  );

  // Submit batch
  const handleSubmit = useCallback(() => {
    if (nfts.length === 0) {
      toast.error("Please add at least one NFT");
      return;
    }

    const invalidNFTs = nfts.filter((nft) => !nft.name);
    if (invalidNFTs.length > 0) {
      toast.error("All NFTs must have a name");
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

      {/* Collection Description Input */}
      <div className="mb-4">
        <label
          htmlFor="collection-description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Collection Description (Optional)
        </label>
        <textarea
          id="collection-description"
          value={collectionDescription}
          onChange={(e) => setCollectionDescription(e.target.value)}
          placeholder="Enter a description for all NFTs in this collection (leave empty for no description)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
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
          {isGenerating ? "Generating..." : "Generate 10"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => generateBatch(maxSupply)}
          disabled={isGenerating || nfts.length >= maxSupply}
        >
          {isGenerating ? "Generating..." : `Generate ${maxSupply}`}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("metadata-upload")?.click()}
          disabled={isMaxSupplyReached}
        >
          <Upload className="h-4 w-4 mr-1" />
          Load Metadata.json
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("json-upload")?.click()}
          disabled={isMaxSupplyReached}
        >
          <Upload className="h-4 w-4 mr-1" />
          Upload JSON
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("multi-json-upload")?.click()}
          className="bg-blue-50 hover:bg-blue-100 border-blue-200"
          disabled={isMaxSupplyReached}
        >
          <Upload className="h-4 w-4 mr-1" />
          Upload Multiple JSONs
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("multi-image-upload")?.click()}
          className="bg-green-50 hover:bg-green-100 border-green-200"
          disabled={isMaxSupplyReached}
        >
          <Image className="h-4 w-4 mr-1" />
          Upload Images
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

        <input
          id="multi-json-upload"
          type="file"
          accept=".json"
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleMultipleJSONUpload(files);
            }
          }}
          className="hidden"
        />

        <input
          id="metadata-upload"
          type="file"
          accept=".json"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleMetadataUpload(files[0]);
            }
          }}
          className="hidden"
        />

        <input
          id="multi-image-upload"
          type="file"
          accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleMultipleImageUpload(files);
            }
          }}
          className="hidden"
        />
      </div>

      {/* Max Supply Status */}
      {isMaxSupplyReached && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Collection Complete!</span>
          </div>
          <p className="mt-1 text-sm text-green-700">
            Maximum supply of {maxSupply} NFTs reached. No more NFTs can be added to this collection.
          </p>
        </div>
      )}

      {/* Upload Progress Summary */}
      {nfts.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>IPFS Upload Progress:</span>
            <span>
              {nfts.filter((nft) => nft.ipfsUploaded).length} / {nfts.length}{" "}
              uploaded
              {nfts.some((nft) => nft.isUploading) && (
                <span className="ml-2 text-blue-600">Uploading...</span>
              )}
              {nfts.some((nft) => nft.uploadFailed) && (
                <span className="ml-2 text-red-600">
                  ({nfts.filter((nft) => nft.uploadFailed).length} failed)
                </span>
              )}
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (nfts.filter((nft) => nft.ipfsUploaded).length /
                    nfts.length) *
                  100
                }%`,
              }}
            ></div>
          </div>
          {!isMaxSupplyReached && (
            <p className="mt-2 text-xs text-gray-600">
              {remainingSlots} slots remaining (Max: {maxSupply})
            </p>
          )}
        </div>
      )}

      {/* NFT List */}
      {nfts.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {nfts.map((nft) => (
            <Card key={nft.id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
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

                  {/* Upload Status Indicator */}
                  {nft.isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    </div>
                  )}

                  {nft.ipfsUploaded && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                      <svg
                        className="w-2 h-2 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  {nft.uploadFailed && (
                    <div className="absolute top-1 right-1 bg-red-500 rounded-full p-1">
                      <svg
                        className="w-2 h-2 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Form */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={nft.name}
                      onChange={(e) =>
                        updateNFT(nft.id, { name: e.target.value })
                      }
                      placeholder="NFT Name"
                      className="h-8"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Image URL</Label>
                    <Input
                      value={nft.image}
                      onChange={(e) =>
                        updateNFT(nft.id, { image: e.target.value })
                      }
                      placeholder="https://..."
                      className="h-8"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs">Description</Label>
                    <div className="bg-gray-50 p-3 rounded-md border">
                      <p className="text-sm text-gray-600">
                        {collectionDescription || "No description set"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        All NFTs use the collection description above
                      </p>
                    </div>
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
            {isUploading ? "Uploading..." : `Upload ${nfts.length} NFTs`}
          </Button>
        </div>
      )}
    </div>
  );
}
