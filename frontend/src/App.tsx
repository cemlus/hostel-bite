import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/components/Toast";
import { NavBar } from "@/components/NavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages are here
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Shops from "./pages/Shops";
import ShopDetail from "./pages/ShopDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerProducts from "./pages/owner/OwnerProducts";
import NewProduct from "./pages/owner/NewProduct";
import OwnerOrders from "./pages/owner/OwnerOrders";
import ShopSettings from "./pages/owner/ShopSettings";
import EditProduct from "./pages/owner/EditProduct";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Auth pages (no navbar) */}
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                  
                  {/* Main app with navbar */}
                  <Route path="/*" element={
                    <>
                      <NavBar />
                      <main>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                          <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                          <Route path="/shops" element={<ProtectedRoute><Shops /></ProtectedRoute>} />
                          <Route path="/shops/:id" element={<ProtectedRoute><ShopDetail /></ProtectedRoute>} />
                          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                          
                          {/* Owner Routes */}
                          <Route path="/owner" element={<ProtectedRoute requireOwner><OwnerDashboard /></ProtectedRoute>} />
                          <Route path="/owner/products" element={<ProtectedRoute requireOwner><OwnerProducts /></ProtectedRoute>} />
                          <Route path="/owner/products/new" element={<ProtectedRoute requireOwner><NewProduct /></ProtectedRoute>} />
                          <Route path="/owner/products/:id/edit" element={<ProtectedRoute requireOwner><EditProduct /></ProtectedRoute>} />
                          <Route path="/owner/orders" element={<ProtectedRoute requireOwner><OwnerOrders /></ProtectedRoute>} />
                          <Route path="/owner/settings" element={<ProtectedRoute requireOwner><ShopSettings /></ProtectedRoute>} />
                          
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </>
                  } />
                </Routes>
              </div>
            </BrowserRouter>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
