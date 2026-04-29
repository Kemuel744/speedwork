import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { StaffProvider } from "@/contexts/StaffContext";

const AppLayout = lazy(() => import("@/components/layout/AppLayout"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Reports = lazy(() => import("@/pages/Reports"));
const Profile = lazy(() => import("@/pages/Profile"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const AdminSubscriptions = lazy(() => import("@/pages/AdminSubscriptions"));
const AdminBlog = lazy(() => import("@/pages/AdminBlog"));
const Messages = lazy(() => import("@/pages/Messages"));
const StockHub = lazy(() => import("@/pages/StockHub"));
const NetworkHub = lazy(() => import("@/pages/NetworkHub"));
const MarketplaceHub = lazy(() => import("@/pages/MarketplaceHub"));
const FinanceHub = lazy(() => import("@/pages/FinanceHub"));
const MarketingHub = lazy(() => import("@/pages/MarketingHub"));
const LocationDetail = lazy(() => import("@/pages/LocationDetail"));
const SupplierDetail = lazy(() => import("@/pages/SupplierDetail"));
const MarketplaceSupplier = lazy(() => import("@/pages/MarketplaceSupplier"));
const CashRegister = lazy(() => import("@/pages/CashRegister"));
const Employees = lazy(() => import("@/pages/Employees"));
const ReceiptSettingsPage = lazy(() => import("@/pages/ReceiptSettings"));
const StaffSpace = lazy(() => import("@/pages/StaffSpace"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Mapping centralisé : ancienne route -> nouvelle destination (avec onglet)
const LEGACY_REDIRECTS: Record<string, string> = {
  "/products": "/stock?tab=products",
  "/product": "/stock?tab=products",
  "/inventory": "/stock?tab=products",
  "/category": "/stock?tab=categories",
  "/categories": "/stock?tab=categories",
  "/multi-depot": "/stock?tab=multi-depot",
  "/multi-depot-stock": "/stock?tab=multi-depot",
  "/depots": "/stock?tab=multi-depot",
  "/transfers": "/stock?tab=transfers",
  "/stock-transfers": "/stock?tab=transfers",
  "/labels": "/stock?tab=labels",
  "/supplier": "/network?tab=suppliers",
  "/suppliers": "/network?tab=suppliers",
  "/location": "/network?tab=locations",
  "/locations": "/network?tab=locations",
  "/boutiques": "/network?tab=locations",
  "/purchase-order": "/network?tab=purchase-orders",
  "/purchase-orders": "/network?tab=purchase-orders",
  "/marketplace/orders": "/marketplace?tab=orders",
  "/marketplace/order": "/marketplace?tab=orders",
  "/marketplace/profile": "/marketplace?tab=profile",
  "/marketplace/discover": "/marketplace?tab=discover",
  "/supplier-profile": "/marketplace?tab=profile",
  "/cash": "/finance?tab=cash",
  "/cash-register": "/finance?tab=cash",
  "/return": "/finance?tab=returns",
  "/returns": "/finance?tab=returns",
  "/credit": "/finance?tab=credits",
  "/credits": "/finance?tab=credits",
  "/customer-credits": "/finance?tab=credits",
  "/accounting": "/finance?tab=accounting",
  "/comptabilite": "/finance?tab=accounting",
  "/vat": "/finance?tab=vat",
  "/tva": "/finance?tab=vat",
  "/vat-declaration": "/finance?tab=vat",
  "/tax-rates": "/finance?tab=tax-rates",
  "/taux": "/finance?tab=tax-rates",
  "/promotion": "/marketing?tab=promotions",
  "/promotions": "/marketing?tab=promotions",
  "/loyalty": "/marketing?tab=loyalty",
  "/fidelite": "/marketing?tab=loyalty",
  "/documents": "/dashboard",
  "/document": "/dashboard",
  "/clients": "/dashboard",
  "/client": "/dashboard",
  "/workers": "/dashboard",
  "/worker": "/dashboard",
  "/teams": "/dashboard",
  "/team": "/dashboard",
  "/missions": "/dashboard",
  "/mission": "/dashboard",
  "/attendance": "/dashboard",
  "/payroll": "/dashboard",
  "/analytics": "/dashboard",
  "/reliability": "/dashboard",
  "/annual-review": "/dashboard",
  "/reminders": "/dashboard",
  "/learning": "/guide",
  "/shared-document": "/dashboard",
  "/create-document": "/dashboard",
  "/work-tasks": "/dashboard",
  "/missions-map": "/dashboard",
  "/teams-map": "/dashboard",
  "/productivity": "/dashboard",
  "/productivity-map": "/dashboard",
};

function LegacyOrNotFound() {
  const pathname = window.location.pathname;
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (LEGACY_REDIRECTS[clean]) {
    return <Navigate to={LEGACY_REDIRECTS[clean]} replace />;
  }
  const segs = clean.split("/").filter(Boolean);
  if (segs.length >= 2) {
    const twoSeg = "/" + segs[0] + "/" + segs[1];
    if (LEGACY_REDIRECTS[twoSeg]) {
      return <Navigate to={LEGACY_REDIRECTS[twoSeg]} replace />;
    }
  }
  if (segs.length >= 1) {
    const firstSeg = "/" + segs[0];
    if (LEGACY_REDIRECTS[firstSeg]) {
      return <Navigate to={LEGACY_REDIRECTS[firstSeg]} replace />;
    }
  }
  return <NotFound />;
}

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function AuthenticatedRoutes() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <CurrencyProvider>
          <LocationProvider>
            <DocumentsProvider>
              <StaffProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Espace employé plein écran (hors AppLayout) */}
                  <Route path="/staff" element={<StaffSpace />} />

                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/inventory" element={<Reports />} />
                    <Route path="/sales-history" element={<Reports />} />
                    <Route path="/statistics" element={<Reports />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                    <Route path="/admin/blog" element={<AdminBlog />} />
                    <Route path="/messages" element={<Messages />} />

                    {/* Hubs fusionnés à onglets */}
                    <Route path="/stock" element={<StockHub />} />
                    <Route path="/network" element={<NetworkHub />} />
                    <Route path="/marketplace" element={<MarketplaceHub />} />
                    <Route path="/finance" element={<FinanceHub />} />
                    <Route path="/marketing" element={<MarketingHub />} />

                    {/* Pages détail conservées */}
                    <Route path="/suppliers/:id" element={<SupplierDetail />} />
                    <Route path="/locations/:id" element={<LocationDetail />} />
                    <Route path="/marketplace/:id" element={<MarketplaceSupplier />} />
                    <Route path="/cash-register" element={<CashRegister />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/receipt-settings" element={<ReceiptSettingsPage />} />

                    {/* Redirections vers les hubs */}
                    <Route path="/suppliers" element={<Navigate to="/network?tab=suppliers" replace />} />
                    <Route path="/categories" element={<Navigate to="/stock?tab=categories" replace />} />
                    <Route path="/locations" element={<Navigate to="/network?tab=locations" replace />} />
                    <Route path="/multi-depot-stock" element={<Navigate to="/stock?tab=multi-depot" replace />} />
                    <Route path="/purchase-orders" element={<Navigate to="/network?tab=purchase-orders" replace />} />
                    <Route path="/stock-transfers" element={<Navigate to="/stock?tab=transfers" replace />} />
                    <Route path="/labels" element={<Navigate to="/stock?tab=labels" replace />} />
                    <Route path="/marketplace/orders" element={<Navigate to="/marketplace?tab=orders" replace />} />
                    <Route path="/supplier-profile" element={<Navigate to="/marketplace?tab=profile" replace />} />
                    <Route path="/returns" element={<Navigate to="/finance?tab=returns" replace />} />
                    <Route path="/customer-credits" element={<Navigate to="/finance?tab=credits" replace />} />
                    <Route path="/accounting" element={<Navigate to="/finance?tab=accounting" replace />} />
                    <Route path="/vat-declaration" element={<Navigate to="/finance?tab=vat" replace />} />
                    <Route path="/tax-rates" element={<Navigate to="/finance?tab=tax-rates" replace />} />
                    <Route path="/promotions" element={<Navigate to="/marketing?tab=promotions" replace />} />
                    <Route path="/loyalty" element={<Navigate to="/marketing?tab=loyalty" replace />} />

                    {/* Anciennes routes obsolètes */}
                    <Route path="/documents" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/clients" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/workers" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/teams" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/missions" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/attendance" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/payroll" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/reliability" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/annual-review" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/reminders" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                  <Route path="*" element={<LegacyOrNotFound />} />
                </Routes>
              </Suspense>
              </StaffProvider>
            </DocumentsProvider>
          </LocationProvider>
        </CurrencyProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}
