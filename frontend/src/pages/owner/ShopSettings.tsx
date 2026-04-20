import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Store, Phone, MapPin, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToastNotify } from '@/components/Toast';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

interface Shop {
  _id: string;
  name: string;
  description?: string;
  open: boolean;
  openTime?: string;
  closeTime?: string;
  phone?: string;
  upiId?: string;
  location?: string;
}

export default function ShopSettings() {
  const toast = useToastNotify();

  const [shop, setShop] = useState<Shop | null>(null);
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [location, setLocation] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchShop();
  }, []);

  const fetchShop = async () => {
    try {
      const response = await api.get<Shop>(ENDPOINTS.SHOPS.MINE);
      if (response.data) {
        const s = response.data;
        setShop(s);
        setShopName(s.name);
        setPhone(s.phone || '');
        setUpiId(s.upiId || '');
        setLocation(s.location || '');
        setIsOpen(s.open);
      }
    } catch (err) {
      toast.error('Failed to load shop settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    setIsSaving(true);
    try {
      const response = await api.patch(ENDPOINTS.SHOPS.DETAIL(shop._id), {
        name: shopName,
        phone,
        upiId,
        location,
        open: isOpen,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Settings saved!');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-wide py-32 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container-wide py-8">
      <Link
        to="/owner"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="max-w-xl">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Shop Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Name */}
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-foreground mb-1.5">
              <Store className="inline h-4 w-4 mr-1" />
              Shop Name
            </label>
            <input
              type="text"
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
              <Phone className="inline h-4 w-4 mr-1" />
              Contact Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* UPI ID */}
          <div>
            <label htmlFor="upiId" className="block text-sm font-medium text-foreground mb-1.5">
              UPI ID (for payments)
            </label>
            <input
              type="text"
              id="upiId"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Customers will pay to this UPI ID
            </p>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1.5">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Near Main Gate"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Shop Status */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Shop Status</p>
                <p className="text-sm text-muted-foreground">
                  {isOpen ? 'Your shop is open for orders' : 'Your shop is closed'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                isOpen ? 'bg-success' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isOpen ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </div>
    </div>
  );
}
