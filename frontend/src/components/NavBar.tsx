import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell, User, Menu, X, Home as HomeIcon, Package, LogOut, Store } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container-wide flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HomeIcon className="h-5 w-5" />
          </div>
          <span>HostelBite</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated && (
            <>
              <Link to="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Browse
              </Link>
              <Link to="/shops" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Shops
              </Link>
              <Link to="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                My Orders
              </Link>
              {user?.role === 'owner' && (
                <Link to="/owner" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Profile Menu (Desktop) */}
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-label="Profile"
                >
                  <User className="h-5 w-5" />
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only">Logout</span>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/auth/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          'md:hidden border-t border-border bg-background transition-all duration-200 ease-in-out overflow-hidden',
          mobileMenuOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="container-wide py-4 space-y-2">
          {isAuthenticated && (
            <>
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Package className="h-5 w-5" />
                Browse Products
              </Link>
              <Link
                to="/shops"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Store className="h-5 w-5" />
                Browse Shops
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Package className="h-5 w-5" />
                My Orders
              </Link>
              {user?.role === 'owner' && (
                <Link
                  to="/owner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <HomeIcon className="h-5 w-5" />
                  Owner Dashboard
                </Link>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <User className="h-5 w-5" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
