import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, Clock, Phone, MapPin } from 'lucide-react';
import { ProductCard, Product } from '@/components/ProductCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useToastNotify } from '@/components/Toast';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';

interface Shop {
  _id: string;
  name: string;
  description?: string;
  open: boolean;
  openTime?: string;
  closeTime?: string;
  phone?: string;
  location?: string;
  owner?: string;
}

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastNotify();

  useEffect(() => {
    if (id) {
      fetchShopAndProducts();
    }
  }, [id]);

  const fetchShopAndProducts = async () => {
    setIsLoading(true);
    try {
      const [shopRes, productsRes] = await Promise.all([
        api.get<Shop>(ENDPOINTS.SHOPS.DETAIL(id!)),
        api.get<{ items: Product[] }>(`${ENDPOINTS.PRODUCTS.RANKED}?shopId=${id}&pageSize=100`)
      ]);

      if (shopRes.data) {
        setShop(shopRes.data);
      }
      
      if (productsRes.data?.items) {
        setProducts(productsRes.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch shop details:', err);
      toast.error('Failed to load shop details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (productId: string) => {
    try {
      const response = await api.post<{ score: number }>(ENDPOINTS.PRODUCTS.VOTE(productId), { vote: 1 });
      if (response.data) {
        setProducts((prev) =>
          prev.map((p) =>
            (p._id === productId || p.id === productId)
              ? { ...p, score: response.data!.score }
              : p
          )
        );
        toast.success('Vote recorded!');
      }
    } catch {
      toast.error('Failed to vote');
    }
  };

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container-wide py-16 text-center">
        <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h1 className="text-xl font-bold text-foreground mb-4">Shop not found</h1>
        <Link to="/shops" className="text-primary hover:underline">
          Browse all shops
        </Link>
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      <Link
        to="/shops"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shops
      </Link>

      {/* Shop Header */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Store className="h-10 w-10" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">{shop.name}</h1>
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                shop.open ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}>
                {shop.open ? 'Open' : 'Closed'}
              </span>
            </div>
            
            {shop.description && (
              <p className="text-muted-foreground max-w-2xl mb-4">
                {shop.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {(shop.openTime || shop.closeTime) && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Hours: {shop.openTime} - {shop.closeTime}</span>
                </div>
              )}
              {shop.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  <span>{shop.phone}</span>
                </div>
              )}
              {shop.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{shop.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Menu Items</h2>
        
        {products.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">This shop hasn't added any products yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                onVote={handleVote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
