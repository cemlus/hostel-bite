import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderCard, Order } from '@/components/OrderCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

// Mock data
const MOCK_ORDERS: Order[] = [
  {
    _id: 'ord1',
    items: [
      { productId: '1', name: 'Maggi Noodles', quantity: 2, price: 30 },
      { productId: '2', name: 'Chai', quantity: 1, price: 20 },
    ],
    total: 80,
    status: 'preparing',
    deliveryMode: 'delivery',
    room: 'A-101',
    paymentMethod: 'upi',
    createdAt: new Date().toISOString(),
    shop: { _id: 's1', name: 'Night Owl Canteen' },
  },
  {
    _id: 'ord2',
    items: [
      { productId: '3', name: 'Sandwich', quantity: 1, price: 50 },
    ],
    total: 50,
    status: 'delivered',
    deliveryMode: 'pickup',
    paymentMethod: 'cod',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    shop: { _id: 's2', name: 'Campus Bites' },
  },
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items: Order[] }>(`${ENDPOINTS.ORDERS.MINE}?limit=50`);
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

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">My Orders</h1>
        <LoadingSkeleton variant="list" count={3} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container-wide py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">No orders yet</h1>
          <p className="text-muted-foreground mb-6">
            Your order history will appear here once you place your first order.
          </p>
          <Button asChild>
            <Link to="/products">Browse Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">My Orders</h1>

      <div className="space-y-4 max-w-2xl">
        {orders.map((order) => (
          <OrderCard key={order._id || order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
