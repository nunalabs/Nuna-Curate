'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useWallet } from '@/lib/wallet/wallet-provider';
import { apiClient } from '@/lib/api/client';
import useSWR from 'swr';

export default function CreatePage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collectionId: '',
    royaltyPercentage: 5,
    attributes: [] as Array<{ trait_type: string; value: string }>,
  });

  const { data: collectionsData } = useSWR(
    isConnected ? '/collections/user' : null,
    () => apiClient.getCollections({ limit: 100 }),
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!imageFile) {
      toast.error('Please select an image');
      return;
    }

    if (!formData.collectionId) {
      toast.error('Please select a collection');
      return;
    }

    setIsCreating(true);

    try {
      const data = new FormData();
      data.append('image', imageFile);
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('collectionId', formData.collectionId);
      data.append('royaltyPercentage', formData.royaltyPercentage.toString());

      if (formData.attributes.length > 0) {
        data.append('attributes', JSON.stringify(formData.attributes));
      }

      const nft = await apiClient.createNFT(data);

      toast.success('NFT created successfully!');
      router.push(`/nft/${nft.id}`);
    } catch (error: any) {
      console.error('Failed to create NFT:', error);
      // Error toast is handled by API client
    } finally {
      setIsCreating(false);
    }
  };

  const addAttribute = () => {
    setFormData({
      ...formData,
      attributes: [...formData.attributes, { trait_type: '', value: '' }],
    });
  };

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      attributes: formData.attributes.filter((_, i) => i !== index),
    });
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...formData.attributes];
    newAttributes[index][field] = value;
    setFormData({ ...formData, attributes: newAttributes });
  };

  if (!isConnected) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold">Create NFT</h1>
          <p className="mt-4 text-muted-foreground">
            Please connect your wallet to create NFTs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-4xl font-bold">Create NFT</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium">Image *</label>
            <div className="relative">
              {imagePreview ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute right-2 top-2 rounded-lg bg-background px-3 py-1 text-sm"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary">
                  <Upload className="mb-2 h-12 w-12 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload image
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="My Awesome NFT"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium">
              Description *
            </label>
            <textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe your NFT..."
            />
          </div>

          {/* Collection */}
          <div>
            <label htmlFor="collection" className="mb-2 block text-sm font-medium">
              Collection *
            </label>
            <select
              id="collection"
              required
              value={formData.collectionId}
              onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a collection</option>
              {collectionsData?.data.map((collection: any) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Don't have a collection?{' '}
              <a href="/create/collection" className="text-primary hover:underline">
                Create one
              </a>
            </p>
          </div>

          {/* Royalty */}
          <div>
            <label htmlFor="royalty" className="mb-2 block text-sm font-medium">
              Royalty Percentage
            </label>
            <input
              type="number"
              id="royalty"
              min="0"
              max="10"
              step="0.1"
              value={formData.royaltyPercentage}
              onChange={(e) =>
                setFormData({ ...formData, royaltyPercentage: parseFloat(e.target.value) })
              }
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Earn {formData.royaltyPercentage}% on all future sales
            </p>
          </div>

          {/* Attributes */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Attributes</label>
              <button
                type="button"
                onClick={addAttribute}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add Attribute
              </button>
            </div>

            <div className="space-y-2">
              {formData.attributes.map((attr, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Property (e.g., Background)"
                    value={attr.trait_type}
                    onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                    className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., Blue)"
                    value={attr.value}
                    onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="rounded-lg border px-3 text-sm hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? 'Creating NFT...' : 'Create NFT'}
          </button>
        </form>
      </div>
    </div>
  );
}
