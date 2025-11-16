'use client';

/**
 * MintForm Component
 *
 * Form for minting new NFTs with image upload
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet, useNFTContract } from '@/lib/hooks/useWallet';
import { pinataService } from '@/lib/ipfs/pinata';
import { toast } from 'react-hot-toast';

interface Attribute {
  trait_type: string;
  value: string;
}

interface MintFormProps {
  contractId: string;
  onSuccess?: (tokenId: number) => void;
  onCancel?: () => void;
}

export function MintForm({ contractId, onSuccess, onCancel }: MintFormProps) {
  const { publicKey, isConnected } = useWallet();
  const { mint, isLoading: isMinting } = useNFTContract(contractId);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Handle file drop
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  /**
   * Remove selected file
   */
  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  /**
   * Add attribute
   */
  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  /**
   * Remove attribute
   */
  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  /**
   * Update attribute
   */
  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!file) {
      toast.error('Please select an image');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Step 1: Upload to IPFS
      toast.loading('Uploading to IPFS...', { id: 'upload' });

      const metadata = {
        name: name.trim(),
        description: description.trim(),
        external_url: externalUrl.trim() || undefined,
        attributes: attributes.filter(a => a.trait_type && a.value),
      };

      const { imageHash, metadataHash, imageUrl, metadataUrl } = await pinataService.uploadNFT(
        file,
        metadata,
        {
          imageKeyvalues: {
            creator: publicKey,
            name: name.trim(),
          },
          metadataKeyvalues: {
            creator: publicKey,
            name: name.trim(),
          },
        }
      );

      toast.success('Uploaded to IPFS!', { id: 'upload' });
      setUploadProgress(50);

      // Step 2: Mint on blockchain
      toast.loading('Minting NFT...', { id: 'mint' });

      // Generate token ID (in production, this would come from your backend or contract)
      const tokenId = Math.floor(Math.random() * 1000000);

      await mint(publicKey, tokenId, {
        name: name.trim(),
        description: description.trim(),
        image_uri: imageUrl,
        metadata_uri: metadataUrl,
      });

      toast.success('NFT minted successfully!', { id: 'mint' });
      setUploadProgress(100);

      // Reset form
      setName('');
      setDescription('');
      setExternalUrl('');
      setAttributes([]);
      setFile(null);
      setPreview(null);

      // Call success callback
      if (onSuccess) {
        onSuccess(tokenId);
      }
    } catch (error: any) {
      console.error('Mint error:', error);
      toast.error(error.message || 'Failed to mint NFT');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isSubmitting = isUploading || isMinting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div>
        <Label htmlFor="image" className="mb-2 block">
          Image, Video, Audio, or 3D Model *
        </Label>
        {!preview ? (
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-center font-medium">
              {isDragActive ? 'Drop the file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              PNG, JPG, GIF, SVG, WebP. Max 10MB
            </p>
          </div>
        ) : (
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={removeFile}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {file && (
          <p className="mt-2 text-sm text-muted-foreground">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter NFT name"
          required
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your NFT"
          rows={4}
          maxLength={1000}
        />
        <p className="mt-1 text-sm text-muted-foreground">
          {description.length}/1000
        </p>
      </div>

      {/* External URL */}
      <div>
        <Label htmlFor="externalUrl">External URL (optional)</Label>
        <Input
          id="externalUrl"
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="https://your-website.com"
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Link to your website or portfolio
        </p>
      </div>

      {/* Attributes */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Properties (optional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAttribute}
          >
            + Add Property
          </Button>
        </div>

        <div className="space-y-2">
          {attributes.map((attr, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Trait (e.g., Background)"
                value={attr.trait_type}
                onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Value (e.g., Blue)"
                value={attr.value}
                onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeAttribute(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      {isSubmitting && uploadProgress > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Progress</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || !isConnected}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? 'Uploading...' : 'Minting...'}
            </>
          ) : (
            'Create NFT'
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
