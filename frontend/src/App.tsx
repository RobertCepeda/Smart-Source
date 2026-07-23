import { useEffect } from "react";
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { AdminRoute } from "./components/auth/AdminRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { AppShell } from "./components/layout/AppShell";
import { AuthProvider } from "./contexts/AuthContext";
import { AiConsult } from "./pages/AiConsult";
import { Catalog } from "./pages/Catalog";
import { CatalogItemDetail } from "./pages/CatalogItemDetail";
import { Dashboard } from "./pages/Dashboard";
import { Organizations } from "./pages/Organizations";
import { PriceHistory } from "./pages/PriceHistory";
import { PurchaseHistory } from "./pages/PurchaseHistory";
import { PurchaseOrders } from "./pages/PurchaseOrders";
import { QuoteRequests } from "./pages/QuoteRequests";
import { Registration } from "./pages/Registration";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { SmartSearch } from "./pages/SmartSearch";
import { SupportCenter } from "./pages/SupportCenter";
import { SupplierDetail } from "./pages/SupplierDetail";
import { SuppliersDirectory } from "./pages/SuppliersDirectory";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { isDemoMode } from "./services/api";

function App() {
  const Router = isDemoMode ? HashRouter : BrowserRouter;

  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/suppliers" element={<SuppliersDirectory />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/:id" element={<CatalogItemDetail />} />
            <Route path="/search" element={<SmartSearch />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/quote-requests" element={<QuoteRequests />} />
            <Route path="/purchase-history" element={<PurchaseHistory />} />
            <Route path="/price-history" element={<PriceHistory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-consult" element={<AiConsult />} />
            <Route path="/support" element={<SupportCenter />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [pathname, search]);

  return null;
}

export default App;
