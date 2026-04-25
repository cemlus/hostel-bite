import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { formatINR } from '@/utils/upi';
import { cn } from '@/lib/utils';

export interface Product {
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

interface ProductCardProps {
  product: Product;
  onVote?: (productId: string) => void;
}

export function ProductCard({ product, onVote }: ProductCardProps) {
  const { addItem, removeItem, getItemQuantity, updateQuantity } = useCart();
  const productId = product._id || product.id || '';
  const quantity = getItemQuantity(productId);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      productId,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      shopId: product.shop?._id,
      shopName: product.shop?.name,
      stock: product.stock,
    });
  };

  const handleIncrement = () => {
    if (quantity < product.stock) {
      updateQuantity(productId, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(productId, quantity - 1);
    } else {
      removeItem(productId);
    }
  };

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/20">
      {/* Image */}
      <Link to={`/products/${productId}`} className="relative aspect-square overflow-hidden bg-muted">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 opacity-30" />
          </div>
        )}
        
        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <span className="rounded-full bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link to={`/products/${productId}`} className="flex-1">
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          
          {/* Vote Button */}
          {onVote && (
            <button
              onClick={() => onVote(productId)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              aria-label="Vote for product"
            >
              <ThumbsUp className="h-4 w-4" />
              {product.score ?? 0}
            </button>
          )}
        </div>

        {(product.description || product.owner || product.shop) && (
          <div className="mb-3">
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
            )}
            {(product.owner || product.shop) && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">
                Sold by {product.owner?.name || 'Owner'} at {product.shop?.name || 'Shop'}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-foreground">{formatINR(product.price)}</span>
          
          {/* Cart Controls */}
          {quantity > 0 ? (
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50">
              <button
                onClick={handleDecrement}
                className="flex h-8 w-8 items-center justify-center rounded-l-lg hover:bg-accent transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= product.stock}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors",
                  quantity >= product.stock
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-accent"
                )}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
