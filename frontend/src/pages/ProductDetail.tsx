import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, ThumbsUp, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useCart } from '@/contexts/CartContext';
import { useToastNotify } from '@/components/Toast';
import { formatINR } from '@/utils/upi';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';

interface ProductDetail {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  images?: string[];
  tags?: string[];
  score?: number;
  shop?: {
    _id: string;
    name: string;
  };
  owner?: {
    _id: string;
    name: string;
  };
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, getItemQuantity, updateQuantity, removeItem } = useCart();
  const toast = useToastNotify();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const productId = product?._id || product?.id || '';
  const quantity = getItemQuantity(productId);
  const isOutOfStock = (product?.stock ?? 0) <= 0;

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<ProductDetail>(ENDPOINTS.PRODUCTS.DETAIL(id!));
      if (response.data) {
        setProduct(response.data);
      } else {
        toast.error('Product not found');
        navigate('/products');
      }
    } catch {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    addItem({
      productId,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      shopId: product.shop?._id,
      shopName: product.shop?.name,
      stock: product.stock,
    });
    toast.success('Added to cart!');
  };

  const handleVote = async () => {
    if (!product) return;
    try {
      const response = await api.post<{ score: number }>(ENDPOINTS.PRODUCTS.VOTE(productId), { vote: 1 });
      if (response.data) {
        setProduct((prev) => prev ? { ...prev, score: response.data!.score } : null);
        toast.success('Vote recorded!');
      }
    } catch {
      toast.error('Failed to vote');
    }
  };

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <LoadingSkeleton variant="card" count={1} />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container-wide py-8">
      {/* Back Button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            {product.images?.[selectedImage] ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ShoppingCart className="h-24 w-24 opacity-30" />
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    'h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                    selectedImage === idx ? 'border-primary' : 'border-transparent'
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{product.name}</h1>
            {product.shop && (
              <Link
                to={`/shops/${product.shop._id}`}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Store className="h-4 w-4" />
                {product.shop.name}
              </Link>
            )}
          </div>

          {(product.description || product.owner || product.shop) && (
            <div className="space-y-1">
              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}
              {(product.owner || product.shop) && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Sold by {product.owner?.name || 'Owner'} at {product.shop?.name || 'Shop'}
                </p>
              )}
            </div>
          )}

          {/* Price & Stock */}
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">{formatINR(product.price)}</span>
            <span className={cn(
              'text-sm font-medium',
              isOutOfStock ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
            </span>
          </div>

          {/* Vote */}
          <button
            onClick={handleVote}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
            {product.score ?? 0} votes
          </button>

          {/* Add to Cart */}
          <div className="flex items-center gap-4">
            {quantity > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => quantity > 1 ? updateQuantity(productId, quantity - 1) : removeItem(productId)}
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                <button
                  onClick={() => quantity < product.stock && updateQuantity(productId, quantity + 1)}
                  disabled={quantity >= product.stock}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg border border-border transition-colors',
                    quantity >= product.stock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'
                  )}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Button size="lg" onClick={handleAddToCart} disabled={isOutOfStock} className="flex-1">
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
            )}

            {quantity > 0 && (
              <Button size="lg" asChild className="flex-1">
                <Link to="/cart">View Cart</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
