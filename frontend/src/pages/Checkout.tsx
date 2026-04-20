import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin, CreditCard, Banknote, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToastNotify } from '@/components/Toast';
import { formatINR, openUpiPayment, isUpiSupported } from '@/utils/upi';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';

type DeliveryMode = 'delivery' | 'pickup';
type PaymentMethod = 'upi' | 'cod';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToastNotify();

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [room, setRoom] = useState(user?.room || '');
  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const total = subtotal; // Free delivery

  if (items.length === 0 && !orderSuccess) {
    navigate('/cart');
    return null;
  }

  const handleUpiPayment = () => {
    // Get first shop's VPA (in real app, this would come from shop settings)
    const shopVpa = 'hostelbite@upi';
    const shopName = items[0]?.shopName || 'HostelBite';
    
    openUpiPayment({
      vpa: shopVpa,
      name: shopName,
      amount: total,
      transactionNote: `HostelBite Order`,
    });
  };

  const handlePlaceOrder = async () => {
    if (deliveryMode === 'delivery' && !room.trim()) {
      toast.error('Please enter your room number');
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryMode,
        room: deliveryMode === 'delivery' ? room.trim() : undefined,
        paymentMethod,
      };

      const response = await api.post<{ orderId: string; status: string; total: number }>(
        ENDPOINTS.ORDERS.CREATE,
        orderData
      );

      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (!response.data) {
        toast.error('Failed to place order');
        return;
      }

      setOrderSuccess(response.data.orderId);
      clearCart();
      toast.success('Order placed successfully!');
    } catch {
      toast.error('Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (orderSuccess) {
    return (
      <div className="container-wide py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-2">
            Your order #{orderSuccess} has been placed successfully.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {deliveryMode === 'delivery'
              ? `We'll deliver to room ${room} soon.`
              : "You'll be notified when your order is ready for pickup."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link to="/orders">View Orders</Link>
            </Button>
            <Button asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      {/* Back */}
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to cart
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Delivery Mode */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setDeliveryMode('delivery')}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 transition-all',
                  deliveryMode === 'delivery'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  deliveryMode === 'delivery' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <Truck className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Room Delivery</p>
                  <p className="text-sm text-muted-foreground">Free delivery</p>
                </div>
              </button>

              <button
                onClick={() => setDeliveryMode('pickup')}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 transition-all',
                  deliveryMode === 'pickup'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  deliveryMode === 'pickup' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Pickup</p>
                  <p className="text-sm text-muted-foreground">Collect from shop</p>
                </div>
              </button>
            </div>

            {/* Room Number */}
            {deliveryMode === 'delivery' && (
              <div className="mt-4">
                <label htmlFor="room" className="block text-sm font-medium text-foreground mb-2">
                  Room Number
                </label>
                <input
                  type="text"
                  id="room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g., A-101"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Payment Method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setPaymentMethod('upi')}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 transition-all',
                  paymentMethod === 'upi'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  paymentMethod === 'upi' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">UPI Payment</p>
                  <p className="text-sm text-muted-foreground">Pay via any UPI app</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('cod')}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 transition-all',
                  paymentMethod === 'cod'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  paymentMethod === 'cod' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">Pay when you receive</p>
                </div>
              </button>
            </div>

            {/* UPI Action */}
            {paymentMethod === 'upi' && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  {isUpiSupported()
                    ? 'Click below to open your UPI app and complete the payment.'
                    : 'Open your UPI app and pay to complete the order.'}
                </p>
                <Button variant="outline" onClick={handleUpiPayment}>
                  <CreditCard className="h-4 w-4" />
                  Pay {formatINR(total)} via UPI
                </Button>
              </div>
            )}
          </section>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">{formatINR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium text-success">Free</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-lg text-foreground">{formatINR(total)}</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full mt-6"
              onClick={handlePlaceOrder}
              disabled={isLoading}
            >
              {isLoading ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
