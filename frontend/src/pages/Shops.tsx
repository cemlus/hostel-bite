import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, ArrowRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useAuth } from '@/contexts/AuthContext';
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
}

export default function Shops() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, [user]);

  const fetchShops = async () => {
    if (!user?.hostel) return;
    
    setIsLoading(true);
    try {
      const hostelId = user.hostel.id || user.hostel._id;
      const response = await api.get<Shop[]>(`${ENDPOINTS.SHOPS.LIST}?hostelId=${hostelId}`);
      if (response.data) {
        setShops(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Shops in your Hostel</h1>
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Shops in your Hostel</h1>
        <p className="text-muted-foreground">Browse all available shops in {user?.hostel?.name}</p>
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-16">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-lg text-muted-foreground">No shops found in your hostel yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Link
              key={shop._id}
              to={`/shops/${shop._id}`}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Store className="h-6 w-6" />
                </div>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  shop.open ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                )}>
                  {shop.open ? 'Open' : 'Closed'}
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {shop.name}
              </h2>
              
              {shop.description && (
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {shop.description}
                </p>
              )}
              
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {(shop.openTime || shop.closeTime) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.3 w-3" />
                      {shop.openTime} - {shop.closeTime}
                    </span>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
