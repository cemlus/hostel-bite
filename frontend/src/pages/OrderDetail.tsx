import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, MapPin, Phone, Store } from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { formatINR } from '@/utils/upi';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';

interface OrderDetail {
  _id: string;
  items: Array<{
    productId?: string;
    product?: string;
    name: string;
    quantity: number;
    price?: number;
    unitPrice?: number;
  }>;
  total: number;
  status: string;
  deliveryMode: 'delivery' | 'pickup';
  room?: string;
  paymentMethod: string;
  createdAt: string;
  shop?: {
    _id: string;
    name: string;
    phone?: string;
  };
}

const statusSteps = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<OrderDetail>(ENDPOINTS.ORDERS.DETAIL(id!));
      if (response.data) {
        setOrder(response.data);
      } else {
        // Mock data
        setOrder({
          _id: id!,
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
          shop: { _id: 's1', name: 'Night Owl Canteen', phone: '9876543210' },
        });
      }
    } catch {
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <LoadingSkeleton variant="card" count={1} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-wide py-16 text-center">
        <h1 className="text-xl font-bold text-foreground mb-4">Order not found</h1>
        <Link to="/orders" className="text-primary hover:underline">
          View all orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container-wide py-8">
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Order #{order._id.slice(-6).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>

        {/* Status Timeline */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Order Status</h2>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full mb-2 transition-colors',
                      isCompleted
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step === 'delivered' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : step === 'ready' ? (
                      <Package className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium capitalize text-center',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Info */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              {order.deliveryMode === 'delivery' ? (
                <>
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span>
                    Delivery to Room <span className="font-medium">{order.room}</span>
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>Pickup from shop</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="uppercase">{order.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Shop Info */}
        {order.shop && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Shop</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <Store className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{order.shop.name}</p>
                {order.shop.phone && (
                  <a
                    href={`tel:${order.shop.phone}`}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {order.shop.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Items</h2>
          <div className="space-y-3 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">{formatINR((item.price ?? item.unitPrice ?? 0) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-lg text-foreground">{formatINR(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
