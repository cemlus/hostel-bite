import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin } from 'lucide-react';
import { formatINR } from '@/utils/upi';
import { cn } from '@/lib/utils';

export interface Order {
  _id: string;
  id?: string;
  items: Array<{
    // Backend uses `product` (ObjectId) + `unitPrice`; frontend mocks use `productId` + `price`.
    productId?: string;
    product?: string;
    name: string;
    quantity: number;
    price?: number;
    unitPrice?: number;
  }>;
  total: number;
  status: 'placed' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryMode: 'delivery' | 'pickup';
  room?: string;
  paymentMethod: 'upi' | 'cod';
  createdAt: string;
  shop?: {
    _id: string;
    name: string;
  };
}

interface OrderCardProps {
  order: Order;
  showShopActions?: boolean;
  onStatusUpdate?: (orderId: string, status: string) => void;
}

const statusConfig = {
  placed: {
    label: 'Placed',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle,
    className: 'bg-blue-100 text-blue-700',
  },
  preparing: {
    label: 'Preparing',
    icon: Package,
    className: 'bg-purple-100 text-purple-700',
  },
  ready: {
    label: 'Ready',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700',
  },
  out_for_delivery: {
    label: 'Out for delivery',
    icon: Truck,
    className: 'bg-blue-100 text-blue-700',
  },
  delivered: {
    label: 'Delivered',
    icon: Truck,
    className: 'bg-success text-success-foreground',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive',
  },
};

const nextStatus: Record<string, string> = {
  placed: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

export function OrderCard({ order, showShopActions, onStatusUpdate }: OrderCardProps) {
  const orderId = order._id || order.id || '';
  const config = statusConfig[order.status] || statusConfig.placed;
  const StatusIcon = config.icon;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <Link
            to={`/orders/${orderId}`}
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            Order #{orderId.slice(-6).toUpperCase()}
          </Link>
          {order.shop && (
            <p className="text-sm text-muted-foreground">{order.shop.name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
        </div>
        
        <span className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium', config.className)}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {item.quantity}x {item.name}
            </span>
            <span className="font-medium">{formatINR((item.price ?? item.unitPrice ?? 0) * item.quantity)}</span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-muted-foreground">+{order.items.length - 3} more items</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {order.deliveryMode === 'delivery' ? (
              <>
                <Truck className="h-3 w-3" />
                Delivery
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3" />
                Pickup
              </>
            )}
          </span>
          <span className="uppercase">{order.paymentMethod}</span>
        </div>
        
        <span className="font-bold text-foreground">{formatINR(order.total)}</span>
      </div>

      {/* Shop Actions */}
      {showShopActions && onStatusUpdate && nextStatus[order.status] && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onStatusUpdate(orderId, nextStatus[order.status])}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Mark as {statusConfig[nextStatus[order.status] as keyof typeof statusConfig]?.label}
          </button>
        </div>
      )}
    </div>
  );
}
