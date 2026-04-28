import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { LocationProvider } from "@/contexts/LocationContext";

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
const NotFound = lazy(() => import("@/pages/NotFound"));

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
              <Suspense fallback={<PageLoader />}>
                <Routes>
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </DocumentsProvider>
          </LocationProvider>
        </CurrencyProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}
