import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToastNotify } from '@/components/Toast';
import { validatePrice, validateImageUrl } from '@/utils/validators';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

const SUGGESTED_TAGS = ['Snacks', 'Beverages', 'Meals', 'Quick', 'Vegetarian', 'Non-Veg', 'Breakfast', 'Dessert'];

export default function NewProduct() {
  const navigate = useNavigate();
  const toast = useToastNotify();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGenerateDescription = async () => {
    if (!name.trim()) {
      toast.error('Please enter a product name first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post<{ description: string }>(ENDPOINTS.PRODUCTS.GENERATE_DESC, {
        name: name.trim(),
      });

      if (response.data?.description) {
        setDescription(response.data.description);
        toast.success('AI description generated!');
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch {
      toast.error('Failed to generate description');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    
    const priceValidation = validatePrice(price);
    if (!priceValidation.valid) newErrors.price = priceValidation.error!;
    
    if (!stock || parseInt(stock) < 0) newErrors.stock = 'Stock must be 0 or more';
    
    if (imageUrl) {
      const imageValidation = validateImageUrl(imageUrl);
      if (!imageValidation.valid) newErrors.imageUrl = imageValidation.error!;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const productData = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        stock: parseInt(stock),
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        tags,
      };

      const response = await api.post(ENDPOINTS.PRODUCTS.CREATE, productData);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Product created successfully!');
        navigate('/owner/products');
      }
    } catch {
      toast.error('Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-wide py-8">
      <Link
        to="/owner/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="max-w-xl">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Add New Product</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Maggi Noodles"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="description" className="block text-sm font-medium text-foreground">
                Description
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Generate with AI
              </button>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Price & Stock */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-foreground mb-1.5">
                Stock *
              </label>
              <input
                type="number"
                id="stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.stock && <p className="mt-1 text-xs text-destructive">{errors.stock}</p>}
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-foreground mb-1.5">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.imageUrl && <p className="mt-1 text-xs text-destructive">{errors.imageUrl}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              Enter a URL for your product image (Cloudinary, Imgur, etc.)
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
            
            {/* Selected Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-sm hover:bg-accent transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/owner/products')} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
