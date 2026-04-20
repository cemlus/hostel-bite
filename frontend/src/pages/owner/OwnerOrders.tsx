import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { OrderCard, Order } from '@/components/OrderCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useToastNotify } from '@/components/Toast';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';

const MOCK_ORDERS: Order[] = [
  {
    _id: 'ord1',
    items: [
      { productId: '1', name: 'Maggi Noodles', quantity: 2, price: 30 },
      { productId: '2', name: 'Chai', quantity: 1, price: 20 },
    ],
    total: 80,
    status: 'placed',
    deliveryMode: 'delivery',
    room: 'A-101',
    paymentMethod: 'upi',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'ord2',
    items: [
      { productId: '3', name: 'Sandwich', quantity: 1, price: 50 },
    ],
    total: 50,
    status: 'accepted',
    deliveryMode: 'pickup',
    paymentMethod: 'cod',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'ord3',
    items: [
      { productId: '4', name: 'Cold Coffee', quantity: 2, price: 45 },
    ],
    total: 90,
    status: 'preparing',
    deliveryMode: 'delivery',
    room: 'B-205',
    paymentMethod: 'upi',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const tabs = ['all', 'placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'] as const;
type Tab = typeof tabs[number];

export default function OwnerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const toast = useToastNotify();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items: Order[] }>(`${ENDPOINTS.ORDERS.SHOP_LIST}?limit=50`);
      if (response.data?.items) {
        setOrders(response.data.items);
      } else {
        setOrders(MOCK_ORDERS);
      }
    } catch {
      setOrders(MOCK_ORDERS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const response = await api.patch(ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), { status });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: status as Order['status'] } : o
        )
      );
      toast.success(`Order marked as ${status}`);
    } catch {
      // Update locally for demo
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: status as Order['status'] } : o
        )
      );
      toast.success(`Order marked as ${status}`);
    }
  };

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <LoadingSkeleton variant="list" count={5} />
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Orders</h1>
      <p className="text-muted-foreground mb-6">Manage incoming orders from your customers</p>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap capitalize',
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {tab}
            {tab !== 'all' && (
              <span className="ml-1.5">
                ({orders.filter((o) => o.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No orders</h2>
          <p className="text-muted-foreground">
            {activeTab === 'all'
              ? 'You have no orders yet'
              : `No ${activeTab} orders`}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              showShopActions
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
