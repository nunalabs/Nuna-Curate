'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useWallet } from '@/lib/wallet/wallet-provider';
import { apiClient } from '@/lib/api/client';

export default function CreateCollectionPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [isCreating, setIsCreating] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    royaltyPercentage: 5,
    externalUrl: '',
  });

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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
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

    setIsCreating(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);

      if (formData.symbol) {
        data.append('symbol', formData.symbol);
      }

      if (formData.royaltyPercentage) {
        data.append('royaltyPercentage', formData.royaltyPercentage.toString());
      }

      if (formData.externalUrl) {
        data.append('externalUrl', formData.externalUrl);
      }

      if (imageFile) {
        data.append('image', imageFile);
      }

      if (bannerFile) {
        data.append('banner', bannerFile);
      }

      const collection = await apiClient.createCollection(data);

      toast.success('Collection created successfully!');
      router.push(`/collection/${collection.id}`);
    } catch (error: any) {
      console.error('Failed to create collection:', error);
      // Error toast is handled by API client
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold">Create Collection</h1>
          <p className="mt-4 text-muted-foreground">
            Please connect your wallet to create collections
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-4xl font-bold">Create Collection</h1>
        <p className="mb-8 text-muted-foreground">
          Deploy your own NFT collection on Stellar
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Image */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Logo Image <span className="text-muted-foreground">(recommended: 350x350)</span>
            </label>
            <div className="relative">
              {imagePreview ? (
                <div className="relative h-48 w-48 overflow-hidden rounded-lg border">
                  <img
                    src={imagePreview}
                    alt="Logo preview"
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
                <label className="flex h-48 w-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload logo</span>
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

          {/* Banner Image */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Banner Image <span className="text-muted-foreground">(recommended: 1400x400)</span>
            </label>
            <div className="relative">
              {bannerPreview ? (
                <div className="relative h-48 w-full overflow-hidden rounded-lg border">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview('');
                    }}
                    className="absolute right-2 top-2 rounded-lg bg-background px-3 py-1 text-sm"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload banner</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
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
              placeholder="My Amazing Collection"
            />
          </div>

          {/* Symbol */}
          <div>
            <label htmlFor="symbol" className="mb-2 block text-sm font-medium">
              Symbol
            </label>
            <input
              type="text"
              id="symbol"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              maxLength={10}
              className="w-full rounded-lg border bg-background px-4 py-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="MYCOL"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional short symbol for your collection (max 10 characters)
            </p>
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
              placeholder="Describe your collection..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {formData.description.length} / 1000 characters
            </p>
          </div>

          {/* Royalty */}
          <div>
            <label htmlFor="royalty" className="mb-2 block text-sm font-medium">
              Default Royalty Percentage
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
              Earn {formData.royaltyPercentage}% on all secondary sales (max 10%)
            </p>
          </div>

          {/* External URL */}
          <div>
            <label htmlFor="externalUrl" className="mb-2 block text-sm font-medium">
              External Link
            </label>
            <input
              type="url"
              id="externalUrl"
              value={formData.externalUrl}
              onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://yourwebsite.com"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Link to your project website or social media
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-lg border px-6 py-3 font-semibold transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? 'Creating Collection...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
