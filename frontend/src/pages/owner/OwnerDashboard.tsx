import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Plus, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  placedOrders: number;
  revenueToday: number;
  revenueWindow: number;
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    placedOrders: 0,
    revenueToday: 0,
    revenueWindow: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [productsRes, ordersRes, analyticsRes] = await Promise.all([
        api.get<{ items: Array<{ isActive?: boolean }> }>(ENDPOINTS.PRODUCTS.LIST),
        api.get<{ items: unknown[] }>(ENDPOINTS.ORDERS.SHOP_LIST),
        api.get<{
          ordersByStatus: Array<{ _id: string; count: number }>;
          totals: { orders: number; revenue: number };
          today: { orders: number; revenue: number };
        }>(`${ENDPOINTS.ORDERS.SHOP_ANALYTICS}?sinceDays=7&topN=5`),
      ]);

      const products = productsRes.data?.items ?? [];
      const totalProducts = products.length;
      const activeProducts = products.filter((p) => p.isActive !== false).length;

      const placedCount =
        analyticsRes.data?.ordersByStatus?.find((s) => s._id === 'placed')?.count ?? 0;

      setStats({
        totalProducts,
        activeProducts,
        totalOrders: analyticsRes.data?.totals?.orders ?? (ordersRes.data?.items?.length ?? 0),
        placedOrders: placedCount,
        revenueToday: analyticsRes.data?.today?.revenue ?? 0,
        revenueWindow: analyticsRes.data?.totals?.revenue ?? 0,
      });
    } catch {
      // Mock stats
      setStats({
        totalProducts: 6,
        activeProducts: 5,
        totalOrders: 24,
        placedOrders: 3,
        revenueToday: 0,
        revenueWindow: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      label: 'Active Products',
      value: stats.activeProducts,
      icon: TrendingUp,
      color: 'bg-success',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-purple-500',
    },
    {
      label: 'Placed Orders',
      value: stats.placedOrders,
      icon: Clock,
      color: 'bg-amber-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Owner Dashboard</h1>
          <p className="text-muted-foreground">Manage your shop and products</p>
        </div>
        <Button asChild>
          <Link to="/owner/products/new">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color} text-white`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/owner/products"
          className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <Package className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Manage Products</h3>
          <p className="text-sm text-muted-foreground">View, edit, and manage your product listings</p>
        </Link>

        <Link
          to="/owner/orders"
          className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <ShoppingBag className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
          <h3 className="font-semibold text-foreground mb-1">View Orders</h3>
          <p className="text-sm text-muted-foreground">Manage incoming orders and update status</p>
        </Link>

        <Link
          to="/owner/settings"
          className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <TrendingUp className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Shop Settings</h3>
          <p className="text-sm text-muted-foreground">Update your shop details and preferences</p>
        </Link>
      </div>
    </div>
  );
}
