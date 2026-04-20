import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useToastNotify } from '@/components/Toast';
import { formatINR } from '@/utils/upi';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images?: string[];
  tags?: string[];
}

// Mock data
const MOCK_PRODUCTS: Product[] = [
  { _id: '1', name: 'Maggi Noodles', price: 30, stock: 50, images: ['https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=200'], tags: ['Snacks'] },
  { _id: '2', name: 'Chai & Biscuits', price: 20, stock: 100, images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200'], tags: ['Beverages'] },
  { _id: '3', name: 'Sandwich', price: 50, stock: 25, images: ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200'], tags: ['Meals'] },
];

export default function OwnerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastNotify();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items: Product[] }>(`${ENDPOINTS.PRODUCTS.LIST}?page=1&pageSize=100`);
      if (response.data?.items) {
        setProducts(response.data.items);
      } else {
        setProducts(MOCK_PRODUCTS);
      }
    } catch {
      setProducts(MOCK_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(ENDPOINTS.PRODUCTS.DETAIL(productId));
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <LoadingSkeleton variant="list" count={5} />
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Products</h1>
          <p className="text-muted-foreground">{products.length} products</p>
        </div>
        <Button asChild>
          <Link to="/owner/products/new">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No products yet</h2>
          <p className="text-muted-foreground mb-6">Add your first product to start selling</p>
          <Button asChild>
            <Link to="/owner/products/new">
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product._id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              {/* Image */}
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Package className="h-6 w-6 opacity-50" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-medium text-foreground">{formatINR(product.price)}</span>
                  <span className={cn(
                    'text-sm',
                    product.stock > 0 ? 'text-muted-foreground' : 'text-destructive'
                  )}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="hidden sm:flex gap-1">
                {product.tags?.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Link
                  to={`/owner/products/${product._id}/edit`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
