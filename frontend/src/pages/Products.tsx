import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { ProductCard, Product } from '@/components/ProductCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useToastNotify } from '@/components/Toast';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';

// Mock data for when API is unavailable
const MOCK_PRODUCTS: Product[] = [
  {
    _id: '1',
    name: 'Maggi Noodles',
    description: 'Classic 2-minute Maggi with extra masala',
    price: 30,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400'],
    tags: ['Snacks', 'Quick'],
    score: 42,
    shop: { _id: 's1', name: 'Night Owl Canteen' },
  },
  {
    _id: '2',
    name: 'Chai & Biscuits',
    description: 'Hot masala chai with cookies',
    price: 20,
    stock: 100,
    images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400'],
    tags: ['Beverages', 'Morning'],
    score: 85,
    shop: { _id: 's1', name: 'Night Owl Canteen' },
  },
  {
    _id: '3',
    name: 'Sandwich',
    description: 'Grilled veg sandwich with cheese',
    price: 50,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400'],
    tags: ['Meals', 'Vegetarian'],
    score: 63,
    shop: { _id: 's2', name: 'Campus Bites' },
  },
  {
    _id: '4',
    name: 'Cold Coffee',
    description: 'Iced coffee with chocolate drizzle',
    price: 45,
    stock: 30,
    images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'],
    tags: ['Beverages', 'Cold'],
    score: 71,
    shop: { _id: 's2', name: 'Campus Bites' },
  },
  {
    _id: '5',
    name: 'Samosa',
    description: 'Crispy potato samosa with chutney',
    price: 15,
    stock: 0,
    images: ['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400'],
    tags: ['Snacks', 'Vegetarian'],
    score: 95,
    shop: { _id: 's1', name: 'Night Owl Canteen' },
  },
  {
    _id: '6',
    name: 'Pasta',
    description: 'Creamy white sauce pasta',
    price: 70,
    stock: 15,
    images: ['https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400'],
    tags: ['Meals', 'Italian'],
    score: 58,
    shop: { _id: 's2', name: 'Campus Bites' },
  },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const toast = useToastNotify();

  // Derive tag options from products so filters always match actual data (fixes tag taxonomy mismatch with API/seed)
  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    products.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return ['All', ...Array.from(tags).sort()];
  }, [products]);

  // Reset selected tag if it no longer exists in the list (e.g. after refetch or switch from mock to API data)
  useEffect(() => {
    if (selectedTag !== 'All' && tagOptions.length > 1 && !tagOptions.includes(selectedTag)) {
      setSelectedTag('All');
    }
  }, [tagOptions, selectedTag]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Product[]>(ENDPOINTS.PRODUCTS.LIST);
      if (response.data) {
        setProducts(response.data);
      } else {
        // Use mock data if API fails
        setProducts(MOCK_PRODUCTS);
      }
    } catch {
      setProducts(MOCK_PRODUCTS);
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
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch {
      toast.error('Failed to vote');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesTag =
      selectedTag === 'All' ||
      product.tags?.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Browse Menu</h1>
        <p className="text-muted-foreground">Discover delicious food from shops in your hostel</p>
      </div>

      {/* Search & Filters - 50/50 width split */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-stretch">
        {/* Search - 50% width on sm+ */}
        <div className="relative min-w-0 sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 rounded-lg border border-input bg-background py-3 pl-10 pr-10 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Tags - 50% width on sm+, scroll when many */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0 min-w-0 sm:flex-1">
          <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          {tagOptions.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                selectedTag === tag
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {tag === 'All' ? 'All' : tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <LoadingSkeleton variant="card" count={6} />
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id || product.id} product={product} onVote={handleVote} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground mb-4">No products found</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedTag('All');
            }}
            className="text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
